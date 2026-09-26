import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { MotionIconBrowser } from "@/components/motion-icons"
import { SiteHero } from "@/components/site-hero"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Flux Motion — 467 Animated Micro-Interaction Icons",
    description:
      "Explore 467 micro-interactive animated icons built for Framer Motion and React. Smooth hover triggers, continuous loop modes, hardware-accelerated spring physics, and ready-to-copy code.",
    path: "/motion",
  }),
}

export default function MotionIconsPage() {
  return (
    <>
      <SiteNav />
      <div className="mx-auto w-full max-w-360 px-6 py-10 lg:px-8">
        <SiteHero total={467} variant="motion" />
        <div id="icons" className="scroll-mt-15 lg:scroll-mt-19">
          <MotionIconBrowser />
        </div>
        <Toaster />
      </div>
      <SiteFooter />
    </>
  )
}
