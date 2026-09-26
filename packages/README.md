# Workspace Packages

Flux Icons is structured as a high-performance pnpm monorepo consisting of the web application, build pipeline, and four core distribution packages.

## Directory Overview

| Package | Name | Description | Distribution |
| --- | --- | --- | --- |
| [`react/`](./react) | `@flux-icons/react` | Zero-dependency, tree-shakable React icon components with subpath exports for all styles (`duotone`, `fill`, `sharp`, `sharp/fill`). | [npm](https://www.npmjs.com/package/@flux-icons/react) |
| [`cli/`](./cli) | `@flux-icons/cli` | Instant terminal CLI for searching, inspecting, and downloading icons directly to your local project directory. | [npm](https://www.npmjs.com/package/@flux-icons/cli) |
| [`mcp/`](./mcp) | `@flux-icons/mcp` | Model Context Protocol (MCP) server providing AI coding agents (Claude, Cursor, Windsurf, Antigravity) icon search and inspection tools. | [npm](https://www.npmjs.com/package/@flux-icons/mcp) |
| [`figma-plugin/`](./figma-plugin) | `flux-icons-plugin` | Native Figma editor extension allowing designers to browse and drag-and-drop vector icons directly onto the canvas. | [Figma Community](https://www.figma.com/community/plugin/1672557050316875938/flux-icons) |

## Development & Publishing

Each package is managed with pnpm workspaces defined in `pnpm-workspace.yaml`.

```bash
# Build React package
pnpm --filter @flux-icons/react build

# Build CLI package
pnpm --filter @flux-icons/cli build

# Build MCP package
pnpm --filter @flux-icons/mcp build
```

> [!NOTE]
> All code in `packages/*/src/` and `packages/*/icons.json` is generated directly by the pipeline (`pipeline/build-react.mjs`, `pipeline/build-data.mjs`). Do not hand-edit generated files.
