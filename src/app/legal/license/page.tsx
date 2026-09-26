import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { loadIcons } from "@/lib/icons"
import { pageMetadata } from "@/lib/seo"
import {
  LEGAL,
  SET_FIGMA_URL,
  SET_ISSUES_URL,
  SET_LICENSE,
  SET_LICENSE_NAME,
  SET_LICENSE_URL,
  SET_PAPER_URL,
  SET_REPO_URL,
  SET_TITLE,
} from "@/lib/site-chrome"
import {
  LegalHighlightCard,
  LegalLink,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal-page"
import { Check, ShieldCheck, Sparkles, Building } from "@/components/icons"

export const metadata = pageMetadata({
  path: LEGAL.license,
  title: "License",
  description:
    `${SET_TITLE} is 100% free and open-source under the ${SET_LICENSE_NAME}: use the icons in ` +
    `personal and commercial work, modify them, and ship them in products you ` +
    `sell, with no attribution required and no limit on projects or seats.`,
  socialDescription: `Use the icons anywhere, commercially, with no attribution required. ${SET_LICENSE_NAME}.`,
})

async function licenseText() {
  return (await readFile(join(process.cwd(), "LICENSE"), "utf8")).trim()
}

export default async function Page() {
  const [text, icons] = await Promise.all([licenseText(), loadIcons()])

  const summaryGrid = (
    <>
      <LegalHighlightCard
        variant="emerald"
        icon={<Building className="size-4 text-emerald-600 dark:text-emerald-400" />}
        title="Commercial & Client Projects"
        description="Build and sell software, SaaS platforms, client deliverables, themes, and physical goods without royalties."
      />
      <LegalHighlightCard
        variant="emerald"
        icon={<Check className="size-4 text-emerald-600 dark:text-emerald-400" />}
        title="Zero Attribution Required"
        description="You do not have to link back to Flux Icons or credit us in your user interface or marketing collateral."
      />
      <LegalHighlightCard
        variant="blue"
        icon={<Sparkles className="size-4 text-blue-600 dark:text-blue-400" />}
        title="Full Modification Rights"
        description="Recolour, restyle, reshape, combine, or adapt any vector glyph to suit your product's design tokens."
      />
      <LegalHighlightCard
        variant="amber"
        icon={<ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />}
        title="100% Free Under MIT"
        description="No subscriptions, no hidden tier limits, no seat pricing, and no surprise licensing renewals."
      />
    </>
  )

  return (
    <LegalPage
      path={LEGAL.license}
      title="License"
      badge="[ MIT OPEN SOURCE PERMISSIVE ]"
      description="Flux Icons is distributed as a completely open-source, permissive design system under the MIT License. You own what you build."
      updated="2026-08-23"
      summaryGrid={summaryGrid}
    >
      <LegalSection id="allowed" title="What you can do" badge="PERMITTED USES">
        <p>
          Everything detailed below is an irrevocable right granted directly by the MIT
          License, not a conditional perk or trial offer. There is no sign-up form, no
          tracking pixel, no account creation, and no enterprise licensing gatekeeper.
        </p>
        <LegalList>
          <li>
            <strong>Commercial Products:</strong> Ship icons in software you charge for, including web applications, iOS/Android apps, SaaS platforms, internal tools, and downloadable templates.
          </li>
          <li>
            <strong>Client Work &amp; Agencies:</strong> Use freely across unlimited client deliverables, freelance contracts, and agency engagements without buying client seats.
          </li>
          <li>
            <strong>Derivatives &amp; Customization:</strong> Modify vector paths, recolor fills, adjust stroke weights, combine multiple symbols into brand marks, and fork the repository.
          </li>
          <li>
            <strong>Open-Source Software:</strong> Embed icons directly inside open-source libraries, UI kits, design systems, and GitHub projects with compatible permissive licenses.
          </li>
          <li>
            <strong>No Required Attribution:</strong> While we always appreciate a shout-out or star on GitHub, giving credit in your app or website is never mandatory.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="condition" title="The one condition" badge="REQUIREMENT">
        <p>
          The MIT License asks for exactly one courtesy: the copyright notice and the
          permission text must accompany copies of the software or substantial portions
          of the source code.
        </p>
        <p>
          In practice, this means:
        </p>
        <LegalList>
          <li>
            When installing via npm (e.g. <code>@flux-icons/react</code>), the package manager automatically retains the license metadata in your <code>node_modules</code>. You do not need to do anything further.
          </li>
          <li>
            If you copy raw source code or vendor the full repository into a public repository, keep the accompanying <LegalLink href={`${SET_REPO_URL}/blob/main/LICENSE`}>LICENSE</LegalLink> file intact.
          </li>
          <li>
            Using icons in your user interface (e.g. rendering an SVG in a button) does <em>not</em> require displaying a license popup, modal, or legal disclaimer to your end users.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="artwork" title="The artwork is covered too" badge="SCOPE">
        <p>
          Because the original MIT License was drafted for software code, questions occasionally
          arise regarding whether vector art is covered.
        </p>
        <p>
          Under {SET_TITLE}, both the code and the vector artwork are unified under the exact same MIT License: all {icons.length} Keyline drawings, all 2,242 Extended interface icons, all 467 Framer Motion components, the React component wrappers, the build pipeline, and this website are one unified work under one grant. There is no separate &ldquo;commercial vector fee&rdquo;, no &ldquo;pro tier&rdquo;, and no split licensing.
        </p>
        <p>
          This uniform grant applies wherever the set is distributed: the official{" "}
          <LegalLink href={SET_REPO_URL}>GitHub repository</LegalLink>, the npm
          registry, the <LegalLink href={SET_FIGMA_URL}>Figma Community file &amp; plugin</LegalLink>,
          and the <LegalLink href={SET_PAPER_URL}>paper.design sheets</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="name" title="What the license does not cover" badge="TRADEMARK">
        <p>
          The name, logo, and brand identity of {SET_TITLE} are reserved to protect developers from confusion and counterfeit packages.
        </p>
        <LegalList>
          <li>
            <strong>Accurate Statements:</strong> You are fully welcome to state that your product or website uses {SET_TITLE}.
          </li>
          <li>
            <strong>No Fork Naming:</strong> Do not name a competing icon library or modified fork {SET_TITLE}, or use names confusingly similar to it.
          </li>
          <li>
            <strong>No False Endorsement:</strong> Do not use the Flux Icons wordmark or logo in a manner that falsely implies endorsement, certification, or partnership by the maintainers.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="conflict" title="Legal priority" badge="INTERPRETATION">
        <p>
          In any dispute or question of legal interpretation, the verbatim text of the MIT License takes absolute precedence. Nothing written on this explanatory page is intended to restrict or withdraw any right guaranteed by the MIT License.
        </p>
        <p>
          If any phrase on this page appears to conflict with the MIT text, please{" "}
          <LegalLink href={SET_ISSUES_URL}>notify us on GitHub</LegalLink> so we can amend the explanation for greater clarity.
        </p>
      </LegalSection>

      <LegalSection id="text" title={`The Canonical ${SET_LICENSE} License Text`} badge="VERBATIM">
        <p>
          Below is the official license shipped in the root directory of this repository, reproduced word for word. You may also view the{" "}
          <LegalLink href={SET_LICENSE_URL}>canonical OSI text</LegalLink>.
        </p>
        <pre className="overflow-x-auto rounded-2xl border border-dashed border-border/80 bg-muted/50 p-5 font-mono text-[13px] leading-relaxed text-foreground select-all whitespace-pre-wrap">
          <code>{text}</code>
        </pre>
      </LegalSection>
    </LegalPage>
  )
}
