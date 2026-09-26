# Scripts

Standalone build and generation scripts for the Flux Icons ecosystem.

| Script | Purpose | Output |
| --- | --- | --- |
| `generate-extended-components.mjs` | Compiles raw JSON icon definitions from `public/extended-icons/chunks/` into typed React components for the Extended Vault (2,242 icons). | `src/components/extended-icons/icons.tsx` |
| `build-motion-icons.mjs` | Compiles animated Framer Motion icons and triggers (hover, click, loop, controlled) for the Motion Vault (467 icons). | `src/components/motion-icons/icons/*.tsx` |

## Usage

```bash
# Rebuild Extended Icons React components
pnpm icons:extended:build

# Rebuild Motion Icons Framer Motion components
pnpm icons:motion:build
```
