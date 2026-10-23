import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { EnergyIconBrowser } from "@/components/energy-icons"
import { SiteHero } from "@/components/site-hero"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Flux Energy — 2,063 Clean Energy, Solar, Wind & Climate Icons",
    description:
      "Explore 2,063 open-source clean energy, solar, wind, grid, storage, EV charging, and climate icons on a unified 24×24 keyline grid with pure React & SVG integration.",
    path: "/energy",
  }),
}

export default function EnergyIconsPage() {
  return (
    <>
      <SiteNav />
      <div className="mx-auto w-full max-w-360 px-6 py-10 lg:px-8">
        <SiteHero total={2063} variant="energy" />
        <div id="icons" className="scroll-mt-15 lg:scroll-mt-19">
          <EnergyIconBrowser />
        </div>
        <Toaster />
      </div>
      <SiteFooter />
    </>
  )
}
