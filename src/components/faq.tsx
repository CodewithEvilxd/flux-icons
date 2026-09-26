import type { FaqEntry } from "@/lib/faq"
import { cn } from "@/lib/utils"

/**
 * A list of questions and answers, on any of the three pages that has one.
 *
 * It exists as a component because the alternative is three copies of the same
 * `dl`, and the markup is not arbitrary: `dt`/`dd` rather than `h3`/`p`, because
 * these are terms and their definitions. As headings they would give every page
 * an outline that runs h1, h2, then eight or ten h3s, which a screen reader
 * announces as eight subsections of the FAQ rather than as a list of pairs.
 *
 * Answers are plain strings, and that is load-bearing rather than lazy: each
 * page emits the same array as `FAQPage` structured data, which may only quote
 * what is actually rendered. A link or a `<code>` inside an answer would fork
 * the two, so anything that wants a link goes underneath the list.
 *
 * Two columns from `md` up. A single column of ten questions is a very long
 * thin list on a wide page, and a question is self-contained, so nothing is
 * lost by reading down one column and back up the next.
 */
export function Faq({
  items,
  className,
}: {
  items: FaqEntry[]
  className?: string
}) {
  return (
    <dl className={cn("grid gap-6 md:grid-cols-2", className)}>
      {items.map((entry, index) => (
        <div
          key={entry.question}
          className="paper-card-dashed paper-card-lift relative flex flex-col gap-3 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="ann-tag-amber font-handwritten">
              [ FAQ #{String(index + 1).padStart(2, "0")} ]
            </span>
          </div>
          <dt className="font-handwritten text-lg font-bold text-foreground">
            {entry.question}
          </dt>
          <dd className="font-sans text-sm leading-relaxed text-muted-foreground">
            {entry.answer}
          </dd>
        </div>
      ))}
    </dl>
  )
}
