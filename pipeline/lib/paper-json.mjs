/**
 * Read one of Paper's answers as JSON.
 *
 * Paper's tools answer JSON as text, and since its 18 Sep 2026 update a read
 * can answer with more than one block: `get_basic_info` leads with a
 * `{ file, contentHash }` header and then sends the page it used to send
 * alone. The two arrive as separate text items, the importer and the checker
 * both join items with a newline, and the result is no longer one JSON
 * document, so both stopped at their first read.
 *
 * Every top-level block is read and the blocks are merged, later keys
 * winning: a one-block answer reads exactly as it always did, and a two-block
 * one reads as the page with its header's fields beside it. Text outside the
 * blocks is skipped, which is also what the size-ceiling warning Paper puts in
 * front of an answer needs.
 */
export function paperJson(text) {
  const blocks = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (depth > 0 && ch === '"') {
      inString = true
      continue
    }
    if (ch === "{" || ch === "[") {
      if (depth === 0) start = i
      depth++
    } else if ((ch === "}" || ch === "]") && depth > 0) {
      depth--
      if (depth === 0) blocks.push(JSON.parse(text.slice(start, i + 1)))
    }
  }
  if (!blocks.length) throw new SyntaxError("no JSON in the answer")
  return blocks.length === 1 ? blocks[0] : Object.assign({}, ...blocks)
}
