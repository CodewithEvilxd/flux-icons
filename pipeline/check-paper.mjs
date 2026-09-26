// Check the paper.design files against previews/paper/.
//
// Files, plural, since 11 Sep 2026: Paper's ceiling is on a whole file, so the
// set is split across two of them by `SET_PAPER_FILES` in lib/site-chrome.ts.
// Every board is looked for in both and then judged on whether it turned up in
// the one it belongs in, which is the STRAY finding.
//
//   node pipeline/check-paper.mjs [--file <id>] [--json]
//
// `paper:check` proves the sheets on disk match `icons/`. It says nothing about
// the file those sheets were written into, and that gap is where the drift
// actually lives: an artboard is written once and then sits there while the set
// moves underneath it. A board of 48 icons against a sheet of 51 looks exactly
// like a board that is up to date.
//
// This is the Paper half of what `check-figma.mjs` does for Figma, and it is
// cheaper: Paper's MCP server is local HTTP with no auth, so this talks to it
// directly rather than emitting a snippet for someone to paste through a plugin
// console. It needs Paper Desktop open with the file in it, which is why it is
// not in `icons:ci` — the same reason `icons:figma` and `brand:check` sit out.
//
// **What it compares, and what it cannot.** Paper will not hand geometry back:
// `get_jsx` returns the layout with the drawings' paths stripped, and `export`
// answers a node with an empty list. So this compares *composition* rather than
// drawing — which artboards exist, how many drawings each holds, and what every
// one of them is called, since the importer names each layer `<name> <style>`
// off the sheets. That catches an icon added, removed, renamed, a category
// re-split, a board never imported and a board imported from an older sheet.
//
// It cannot catch a drawing that was redrawn while keeping its name and its
// place. Nothing available here can. Say so rather than implying the file is
// verified: what this proves is that the file holds the right icons, not that it
// holds the right drawings of them.

import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { boardFiles, paperFiles } from "./lib/paper-files.mjs"
import { paperJson } from "./lib/paper-json.mjs"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const SHEETS = join(ROOT, "previews", "paper")
const ENDPOINT = process.env.PAPER_MCP ?? "http://127.0.0.1:29979/mcp"
const json = process.argv.includes("--json")

const c = (n, s) => `\x1b[${n}m${s}\x1b[0m`

/**
 * The files to check, taken from the constants the site already links to.
 *
 * `SET_PAPER_FILES` in `lib/site-chrome.ts` is what the site's Paper menu
 * opens, so those are by definition the files that have to match the
 * repository. Reading them from there rather than keeping a second copy is the
 * same call `build-paper.mjs` makes about the category table.
 *
 * `--file` narrows the run to one of them, which is the only way to check a
 * file the site does not link to yet.
 */
async function filesToCheck() {
  const all = await paperFiles(ROOT)
  const flag = process.argv.indexOf("--file")
  if (flag > -1 && process.argv[flag + 1]) {
    const only = process.argv[flag + 1]
    return [all.find((f) => f.id === only) ?? { id: only, url: only, from: "" }]
  }
  return all
}

/* One MCP session for the run. The transport answers as SSE, one `data:` line
   carrying the JSON-RPC body, and the session id comes back on the first call. */
let session = null

const CLIENT = { name: "flux-check-paper", version: "1" }

/* Paper drops a session mid-run and the socket comes back ECONNRESET, which is
   indistinguishable from the app being closed if you only catch `fetch`
   throwing. It is not the same thing: the server is still there and a fresh
   handshake gets a working session straight back. Told apart, the reset costs
   one extra round trip; conflated, it reads as "Paper is not listening" while
   Paper is plainly open, which is what the `New` board did every run from
   27 Aug 2026 until 4 Sep. `initialize` is excluded because retrying it is what
   the retry does. */
async function post(method, params) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  }
  if (session) headers["mcp-session-id"] = session
  return fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  })
}

const wasReset = (e) => (e?.cause?.code ?? e?.code) === "ECONNRESET"

async function rpc(method, params) {
  let res
  try {
    res = await post(method, params)
  } catch (e) {
    if (!wasReset(e) || method === "initialize")
      throw new Error(
        `${c(31, "Paper is not listening")} on ${ENDPOINT}.\n` +
          `Open Paper Desktop with the file, or set PAPER_MCP to its endpoint.`
      )
    session = null
    await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: CLIENT })
    res = await post(method, params)
  }

  session ??= res.headers.get("mcp-session-id")
  const text = await res.text()
  const line = text.split("\n").find((l) => l.startsWith("data:"))
  if (!line) throw new Error(`unreadable answer from ${method}: ${text.slice(0, 200)}`)
  return JSON.parse(line.slice(5).trim())
}

async function call(name, args) {
  const out = await rpc("tools/call", { name, arguments: args })
  if (out.error) throw new Error(`${name}: ${JSON.stringify(out.error).slice(0, 200)}`)
  const body = (out.result?.content ?? [])
    .filter((x) => x.type === "text")
    .map((x) => x.text)
    .join("\n")
  /* A refusal arrives as a sentence in a successful result rather than as an
     error, so a caller that only checks `error` reads a quota message or a
     schema complaint as data. */
  if (out.result?.isError) throw new Error(`${name}: ${body.split("\n")[0]}`)
  return body
}

/* One summary line, `SVG "play stroke" (DXV5-0) 24×24`, with a text node's
   content quoted after the size. A size Paper has not measured prints as `?`,
   so the size is anything but a space: a line the pattern missed was a
   drawing left out of the count. */
const LINE = /^(\s*)(\w+) "(.*?)" \(([^)]+)\) (\S+)×(\S+)(?: "(.*)")?$/
/* What a summary prints in place of a node's children when `depth` runs out. */
const HINT = /^\s*\.\.\. \d+ children$/

/** A summary's nodes in document order, each marked `unread` if the summary stopped above its children. */
function nodes(summary) {
  const out = []
  for (const raw of summary.split("\n")) {
    if (HINT.test(raw)) {
      /* The hint follows the node it stands in for, directly. */
      if (out.length) out[out.length - 1].unread = true
      continue
    }
    const m = LINE.exec(raw)
    if (m) out.push({ component: m[2], name: m[3], id: m[4] })
  }
  return out
}

/*
 * Every read Paper cut short, and what became of it.
 *
 * Paper has capped its reads since its 18 Sep 2026 update and says so in the
 * answer, `truncated: true` beside a `truncatedMessage`. A cut this check reads
 * around is counted in `cut` and reported as one line. A cut it cannot read
 * around goes in `capped` and becomes a CAPPED finding, because a count taken
 * through it is a floor, and a floor compared with the sheets reads exactly
 * like a board that never took its import.
 */
const cut = new Map()
const capped = []

/**
 * Every drawing under a node, by name, in document order.
 *
 * Off `get_tree_summary`, a node at a time wherever one read cannot hold the
 * whole of it. Paper caps both of the readers that could do this, and at
 * different places. The summary stops at 1000 nodes. Until 18 Sep 2026 it
 * stopped there silently, which is how the Changelog board read 162 of its 195
 * drawings on 30 Aug and failed as STALE on every run; a check that cannot
 * pass is a check nobody keeps running. `get_children`, which this walked to
 * get round that, has stopped at 100 children since the same update. The
 * Newest release card holds 110 blocks, the walk never reached the last ten,
 * and 38 drawings that were in the file reported as 229 of 267. The summary
 * has no such cap on a node: the same card read at depth 1 lists all 110.
 *
 * So a summary that fits is read as it stands. One that does not is read again
 * at depth 1, which lists the node's children, and each child with children of
 * its own is read the same way, as is any node the summary stopped above
 * because `depth` ran out. Not keyed to 1000 or to 100: those are Paper's
 * numbers, and a check keyed to them goes quietly blind the day they change.
 * `truncated` is what it reads.
 */
async function walkDrawings(nodeId, id, board, into = []) {
  let answer = parsed(await call("get_tree_summary", { nodeId, depth: 8, fileId: id }))
  if (answer.truncated) {
    cut.set(answer.truncatedMessage, (cut.get(answer.truncatedMessage) ?? 0) + 1)
    answer = parsed(await call("get_tree_summary", { nodeId, depth: 1, fileId: id }))
    if (answer.truncated) capped.push({ board, node: nodeId, message: answer.truncatedMessage })
  }
  for (const node of nodes(answer.summary ?? "")) {
    /* Stop at the drawing: below it are its own paths, which come back as
       SVGVisualElement. */
    if (node.component === "SVG") into.push(node.name)
    else if (node.unread && node.id !== nodeId) await walkDrawings(node.id, id, board, into)
  }
  return into
}

/** What the sheets say that artboard should hold. */
async function expected(files) {
  const drawings = []
  const captions = []
  for (const file of files) {
    const html = await readFile(join(SHEETS, file), "utf8")
    /* Name, style and treatment, in the order `build-paper.mjs` writes them.
       The suffix is what tells a sharp cell from the rounded one beside it:
       both draw the same icon in the same style, so on names alone a board
       with the two halves swapped would compare equal. */
    for (const [, name, style, corners] of html.matchAll(
      /data-icon="([^"]+)" data-style="([^"]+)" data-corners="([^"]+)"/g
    )) {
      drawings.push(`${name} ${style}${corners === "sharp" ? " sharp" : ""}`)
    }
    for (const [, base] of html.matchAll(/data-icon-set="([^"]+)"/g)) captions.push(base)
  }
  return { drawings, captions }
}

const manifest = JSON.parse(await readFile(join(SHEETS, "manifest.json"), "utf8"))

/** Manifest entries grouped into the artboards they were written into. */
const boards = new Map()
for (const sheet of manifest.sheets) {
  if (!boards.has(sheet.artboard)) boards.set(sheet.artboard, [])
  boards.get(sheet.artboard).push(sheet.file)
}

/* A file at Paper's size ceiling prefixes every answer with a warning line and
   then the JSON; see the same helper in import-paper.mjs. */
const parsed = (body) => {
  const start = body.search(/[{[]/)
  return paperJson(start >= 0 ? body.slice(start) : body)
}

const files = await filesToCheck()

/** Where each board is supposed to be, by the same rule the site's links use. */
const where = boardFiles(files, manifest)

await rpc("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: CLIENT,
})

/* Every page of every file. Pages, because a file puts the changelog on its own
   and an artboard looked for on the wrong page reads as missing. Files, because
   the set outgrew one of them: a board is looked for everywhere and then judged
   on whether it turned up where it belongs, so a board left behind in the file
   it was moved out of is a finding rather than a silent duplicate. */
const names = new Map()
const found = new Map()
for (const file of files) {
  const opened = parsed(await call("open_file", { fileId: file.id }))
  names.set(file.id, opened.fileName ?? file.id)
  const pages = parsed(await call("get_basic_info", { fileId: file.id })).pages ?? []
  for (const page of pages) {
    /* The page goes to the read itself as well: since Paper's 18 Sep 2026
       update, a page opened by one call is not the active page for the next,
       and every page read back as the one the file was left on. */
    await call("open_file", { fileId: file.id, pageId: page.id })
    const info = parsed(await call("get_basic_info", { fileId: file.id, pageId: page.id }))
    /* A short artboard list would report every board it left off as MISSING. */
    if (info.truncated) {
      capped.push({
        board: page.name,
        node: page.id,
        message: info.truncatedMessage,
        page: names.get(file.id),
      })
    }
    for (const board of info.artboards) {
      const at = { ...board, page: page.name, file }
      /* Keyed by board *and* file: the same name in two files is the case this
         is here to catch, and a plain name key would hide one behind the
         other. */
      found.set(`${file.id}/${board.name}`, at)
    }
  }
}

/** Every place a board of this name turned up, in file order. */
const placesOf = (name) =>
  files.map((f) => found.get(`${f.id}/${name}`)).filter(Boolean)

const findings = []
for (const [name, sheets] of boards) {
  const belongs = where.get(name)
  const places = placesOf(name)
  const board = found.get(`${belongs.id}/${name}`) ?? places[0]

  if (!board) {
    findings.push({ board: name, kind: "MISSING", detail: "in neither file" })
    continue
  }

  /* Somewhere, but not where the sheets say. Read as STRAY rather than as
     MISSING because the drawings are not gone: the board has to be written into
     the file it belongs in and then deleted from the one it is in, and only the
     first half of that is an import. A board in both files reports here too,
     since the copy left behind is the same problem. */
  const stray = places.filter((at) => at.file.id !== belongs.id)
  if (stray.length) {
    findings.push({
      board: name,
      kind: "STRAY",
      detail:
        `also in ${names.get(stray[0].file.id)}` +
        (found.has(`${belongs.id}/${name}`)
          ? `, delete it there`
          : ` rather than ${names.get(belongs.id)}`),
    })
    if (!found.has(`${belongs.id}/${name}`)) continue
  }

  const id = board.file.id
  const want = await expected(sheets)
  /* One summary where the board fits in one, more only where it does not. */
  const got = { drawings: await walkDrawings(board.id, id, name) }

  const short = capped.find((x) => x.board === name && !x.page)
  if (short) {
    findings.push({
      board: name,
      kind: "CAPPED",
      detail:
        `${got.drawings.length} drawings read of ${want.drawings.length} in the sheets, ` +
        `but Paper cut the read of ${short.node} short ("${short.message}"), ` +
        `so that count is a floor and not a finding`,
    })
    continue
  }

  if (got.drawings.length !== want.drawings.length) {
    findings.push({
      board: name,
      kind: "STALE",
      detail: `${got.drawings.length} drawings in Paper, ${want.drawings.length} in the sheets`,
    })
    continue
  }

  /* Layer names are the importer's, taken from the sheets. All of them still
     reading "SVG" means the board was written but never named, which is a
     different job from re-importing it.
     `length` first, because `[].every()` is true: without it the changelog,
     which is prose and holds no drawings at all, reported itself unnamed. */
  if (got.drawings.length && got.drawings.every((x) => x === "SVG")) {
    findings.push({ board: name, kind: "UNNAMED", detail: "imported but never named" })
    continue
  }

  const wrong = got.drawings.filter((x, i) => x !== want.drawings[i])
  if (wrong.length) {
    findings.push({
      board: name,
      kind: "DRIFT",
      detail: `${wrong.length} drawings differ, first is "${wrong[0]}" where the sheet says "${
        want.drawings[got.drawings.indexOf(wrong[0])]
      }"`,
    })
  }
}

for (const board of found.values()) {
  /* A board that belongs in another file has already reported as STRAY there;
     saying it again from this end would name the same board twice with two
     different fixes. */
  if (boards.has(board.name)) continue
  findings.push({
    board: board.name,
    kind: "ORPHAN",
    detail: `on ${board.page} in ${names.get(board.file.id)}, no sheet builds it`,
  })
}

for (const x of capped.filter((x) => x.page)) {
  findings.push({
    board: x.board,
    kind: "CAPPED",
    detail:
      `the artboard list in ${x.page} stopped short ("${x.message}"), ` +
      `so a board it left off reads as MISSING`,
  })
}

if (json) {
  console.log(
    JSON.stringify(
      {
        files: files.map((f) => ({ id: f.id, name: names.get(f.id) ?? f.id })),
        boards: boards.size,
        /* Reads Paper cut short that the walk read around, by Paper's message. */
        cut: Object.fromEntries(cut),
        findings,
      },
      null,
      2
    )
  )
} else {
  const total = [...boards.values()].reduce((n, f) => n + f.length, 0)
  const held = (file) =>
    [...where].filter(([, f]) => f.id === file.id).length
  console.log(
    `${boards.size} artboards from ${total} sheets, across ${files.length} file` +
      `${files.length === 1 ? "" : "s"}:`
  )
  for (const file of files) {
    console.log(`  ${(names.get(file.id) ?? file.id).padEnd(24)} ${held(file)} boards`)
  }
  /* Every cut is said out loud, read around or not, so a cap Paper moves or
     adds shows up here by its own message before it shows up as a finding. */
  for (const [message, n] of cut) {
    console.log(
      `  ${c(33, "!")} Paper cut ${n} read${n === 1 ? "" : "s"} short ("${message}");` +
        ` each was read again a node at a time`
    )
  }
  for (const f of findings) {
    console.log(`  ${c(33, f.kind.padEnd(10))} ${f.board.padEnd(16)} ${f.detail}`)
  }
  if (!findings.length) {
    console.log(
      c(32, `Paper matches previews/paper/ across ${boards.size} artboards`) +
        `\nComposition and names only: nothing here can see the drawings themselves.`
    )
  }
  if (findings.some((f) => f.kind !== "CAPPED")) {
    console.log(
      `\nRe-import the boards above. Do not delete them: write_html takes` +
        ` mode: "replace" against an artboard's child, which swaps the contents` +
        ` and leaves the artboard's id, name and canvas position alone.` +
        `\nThe position is the reason. Nothing here records it, so a board` +
        ` deleted and recreated comes back at the origin.`
    )
  }
  if (findings.some((f) => f.kind === "CAPPED")) {
    console.log(
      `\nCAPPED is not a re-import. Paper cut a read short and the walk could not` +
        ` read around it, so the board is unverified rather than stale. Read the node` +
        ` it names some other way, or group the sheet so no container outgrows the cap.`
    )
  }
}

if (!existsSync(join(SHEETS, "manifest.json"))) process.exit(1)
process.exit(findings.length ? 1 : 0)
