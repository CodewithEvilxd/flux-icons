<img src="https://fluxicons.vercel.app/icon.svg" width="56" height="56" alt="Flux Icons logo">

# @flux-icons/mcp

An MCP server for [Flux Icons](https://fluxicons.vercel.app). Lets an agent
search the set, read an icon's SVG, and get the right React import, without
guessing at names.

## Install

Claude Code:

```bash
claude mcp add flux-icons -- npx -y @flux-icons/mcp
```

Anything else that speaks MCP over stdio:

```json
{
  "mcpServers": {
    "flux-icons": {
      "command": "npx",
      "args": ["-y", "@flux-icons/mcp"]
    }
  }
}
```

No API key, no network. The whole set ships inside the package.

## Tools

| Tool | What it does |
| --- | --- |
| `describe_set` | Counts, styles, and the rule deciding which icons have which style. Worth calling first. |
| `search_icons` | Find icons by name. Returns which styles each has. |
| `get_icon` | Full SVG source for one name, style and corner treatment, `regular` or `sharp`. |
| `get_react_usage` | The import line and JSX from `@flux-icons/react`, sharp entry points included. |

## Why the tools are shaped this way

**Names are guessable but not obvious.** Compounds read base-first, so a mail
icon with a tick is `mail-check` and not `check-mail`, and containers are
prefixes: `square-arrow-down`. `search_icons` ranks exact over prefix over
word-boundary over substring, so searching `check` returns `check` before the
twelve compounds containing it.

**A missing style is a real answer, not an error.** `bar-chart` is three open
strokes with no interior, so it has no fill, and the tool says exactly that
rather than returning nothing. Duotone and fill need a fillable region, which
comes from the glyph's own enclosed area or from a square/circle container.

**Typos resolve in one turn.** A name that misses is matched by substring, then
by edit distance, then by leading segment, so `chekc` suggests `check` and
`arow` suggests the `arrow-*` family even though there is no bare `arrow` icon.

## Licence

MIT.
