import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { ExtendedIconBrowser } from "@/components/extended-icons/extended-icon-browser"
import { SiteHero } from "@/components/site-hero"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Flux Extended — 2,242 Icons in 6 Styles",
    description:
      "Explore 2,242 open-source icons across 6 styles: Linear, Bold, Two-Tone, Bulk, Broken, and Outline. Unified 24×24 grid, live studio customizer, and official @flux-icons/react integration.",
    path: "/extended",
  }),
}

export default function ExtendedIconsPage() {
  return (
    <>
      <SiteNav />
      <div className="mx-auto w-full max-w-360 px-6 py-10 lg:px-8">
        <SiteHero total={2242} variant="extended" />
        <div id="icons" className="scroll-mt-15 lg:scroll-mt-19">
          <ExtendedIconBrowser />
        </div>
        <Toaster />
      </div>
      <SiteFooter />
    </>
  )
}
