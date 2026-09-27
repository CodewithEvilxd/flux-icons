import { NextResponse } from "next/server"

export const dynamic = "force-static"

const LLMS_TXT = `# Flux Icons

> Pixel-perfect vector icon ecosystem for Tailwind CSS, shadcn/ui, Next.js, and React. 3,700+ MIT licensed icons across three vaults: Keyline (1,000 grid-aligned icons in 4 styles and 2 corner treatments), Extended (2,242 icons across 6 styles), and Motion (467 animated React icons).

## Documentation & Vaults

- [Keyline Vault](https://www.fluxicons.site/icons): 1,000 precision 24x24 icons in stroke, two-tone, duotone, and fill with sharp and rounded corners.
- [Extended Vault](https://www.fluxicons.site/extended): 2,242 interface glyphs in 6 styles across 28 domains.
- [Motion Vault](https://www.fluxicons.site/motion): 467 animated React icons powered by Framer Motion.
- [Browse All Icons](https://www.fluxicons.site/browse): Universal icon browser across all 3,700+ icons.
- [Installation Guide](https://www.fluxicons.site/install): NPM packages, React components, and CLI usage.
- [API & Ecosystem](https://www.fluxicons.site/docs): Architecture, MCP server, and design tools.
- [Changelog](https://www.fluxicons.site/changelog): Release history and update logs.
- [FAQ](https://www.fluxicons.site/faq): Common questions and answers.

## Optional

- [GitHub Repository](https://github.com/CodewithEvilxd/flux-icons): Open-source repository and build pipeline.
- [NPM Package](https://www.npmjs.com/package/@flux-icons/react): React icon distribution package.
`

export function GET() {
  return new NextResponse(LLMS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
