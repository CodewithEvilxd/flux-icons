import fs from "fs"
import path from "path"

const CHUNKS_DIR = path.resolve("public/extended-icons/chunks")
const OUT_FILE = path.resolve("src/components/extended-icons/icons.tsx")

const chunkFiles = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith(".json"))

function toPascal(slug) {
  return slug
    .split("-")
    .map(p => (/^\d/.test(p) ? "_" + p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("")
}

let out = `// GENERATED EXTENDED ICONS — Flux Extended 2,242 Icons Collection
import React from "react"

export interface ExtendedIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  color?: string
  strokeWidth?: number
  variant?: "linear" | "bold" | "twotone" | "bulk" | "broken" | "outline"
}
`

let count = 0
const seen = new Set()

for (const f of chunkFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(CHUNKS_DIR, f), "utf8"))
  for (const [slug, variants] of Object.entries(data)) {
    const compName = toPascal(slug)
    if (seen.has(compName)) continue
    seen.add(compName)

    const linearInner = variants.linear ? variants.linear.inner : (variants[Object.keys(variants)[0]]?.inner ?? "")
    const fill = variants.linear?.fill || "none"

    // Sanitize any unescaped quotes or JSX quirks
    const safeInner = JSON.stringify(linearInner)
    const safeFill = JSON.stringify(fill)

    out += `
export function ${compName}({
  size = 24,
  color = "currentColor",
  strokeWidth = 1.5,
  className = "",
  ...props
}: ExtendedIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill=${safeFill}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: ${safeInner} }}
      {...props}
    />
  )
}
`
    count++
  }
}

fs.writeFileSync(OUT_FILE, out, "utf8")
console.log(`Generated ${count} extended icon components in ${OUT_FILE}`);
