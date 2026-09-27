import { CLI_PACKAGE, MCP_PACKAGE, REACT_PACKAGE } from "@/lib/icon-code"

/**
 * How often the set has been downloaded from npm, or `null` when npm will not
 * say.
 *
 * Summed across all three packages, because the landing page states one fact
 * about the set rather than three about its entry points, and the badge that
 * shows it links to the scope's page, which lists all three.
 *
 * Built the way `repoStars` in `lib/github.ts` is, for the same reasons:
 * server-side so the number is in the HTML at first paint and costs the browser
 * nothing, `revalidate` so the whole site spends a handful of calls an hour
 * rather than one per visit, and never throwing, because a download count is
 * not worth a 500. The landing page already revalidates hourly for the star
 * count in the bar, so this adds no renders.
 *
 * `null` for any failure, including one package of three. A partial sum would
 * be a number that looks right and is quietly low, and the badge simply not
 * rendering is the honest way to say npm did not answer.
 */
export async function npmDownloads(): Promise<{
  total: number
  lastWeek: number
} | null> {
  const perPackage = await Promise.all(
    [REACT_PACKAGE, CLI_PACKAGE, MCP_PACKAGE].map(async (name) => {
      const [windows, lastWeek] = await Promise.all([
        Promise.all(totalPeriods().map((period) => downloads(period, name))),
        // npm's own "last-week", not the last seven days of a range: a range
        // pads the days npm has not counted yet with zeros, so its tail reads
        // as a collapse that never happened. This is the figure npm's package
        // page calls weekly downloads.
        downloads("last-week", name),
      ])

      if (lastWeek === null || windows.includes(null)) return null

      return { total: sum(windows as number[]), lastWeek }
    })
  )

  if (perPackage.includes(null)) return null

  const counts = perPackage as { total: number; lastWeek: number }[]
  return {
    total: sum(counts.map((count) => count.total)),
    lastWeek: sum(counts.map((count) => count.lastWeek)),
  }
}

/** The day `@flux-icons/react`, the first of the three, was published. */
const FIRST_PUBLISHED = "2026-08-20"

/**
 * npm clamps a date range to 18 months and does not say so: ask for three
 * years and the answer comes back with a later `start` and a smaller number.
 * So the all-time count is asked for in windows that stay under the limit.
 */
const WINDOW_DAYS = 500

const DAY = 24 * 60 * 60 * 1000

function totalPeriods(): string[] {
  const day = (time: number) => new Date(time).toISOString().slice(0, 10)
  const today = Date.now()
  const periods: string[] = []

  for (
    let start = Date.parse(FIRST_PUBLISHED);
    start <= today;
    start += WINDOW_DAYS * DAY
  ) {
    const end = Math.min(start + (WINDOW_DAYS - 1) * DAY, today)
    periods.push(`${day(start)}:${day(end)}`)
  }

  return periods
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

async function downloads(period: string, name: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.npmjs.org/downloads/point/${period}/${name}`,
      {
        signal: AbortSignal.timeout(1200),
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) return null

    const body: unknown = await response.json()
    const count =
      typeof body === "object" && body !== null
        ? (body as { downloads?: unknown }).downloads
        : undefined

    return typeof count === "number" ? count : null
  } catch {
    return null
  }
}
