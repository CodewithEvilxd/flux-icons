import { pageMetadata, SITE_URL } from "@/lib/seo"
import {
  LEGAL,
  SET_ISSUES_URL,
  SET_LICENSE_NAME,
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
import { Globe, Lock, ShieldCheck, FileText } from "@/components/icons"

export const metadata = pageMetadata({
  path: LEGAL.terms,
  title: "Terms",
  description:
    `The terms for using the ${SET_TITLE} website, documentation, registry, and tooling: ` +
    `what it promises, what it disclaims, and how the icons are licensed separately under ${SET_LICENSE_NAME}.`,
  socialDescription:
    "Transparent terms of use for the Flux Icons website, registry, and developer tooling.",
})

export default function Page() {
  const host = SITE_URL.replace(/^https:\/\//, "")

  const summaryGrid = (
    <>
      <LegalHighlightCard
        variant="emerald"
        icon={<Globe className="size-4 text-emerald-600 dark:text-emerald-400" />}
        title="Free & Open Access"
        description="Browse, search, inspect, and copy icon code without paying subscription fees or creating user accounts."
      />
      <LegalHighlightCard
        variant="blue"
        icon={<FileText className="size-4 text-blue-600 dark:text-blue-400" />}
        title="Independent Icon License"
        description="The icons themselves are licensed under the MIT License, which operates completely independent of website terms."
      />
      <LegalHighlightCard
        variant="neutral"
        icon={<Lock className="size-4 text-muted-foreground" />}
        title="Zero Account Lock-in"
        description="No login barriers, no API keys, and no telemetry tracking tied to your personal identity."
      />
      <LegalHighlightCard
        variant="amber"
        icon={<ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />}
        title="Transparent Commit History"
        description="Every modification to these terms is publicly tracked in our repository commit history."
      />
    </>
  )

  return (
    <LegalPage
      path={LEGAL.terms}
      title="Terms of Service"
      badge="[ WEBSITE & REGISTRY TERMS ]"
      description={`Clear and transparent terms of service governing your use of ${host}, our shadcn/ui registry endpoints, and online developer utilities.`}
      updated="2026-08-23"
      summaryGrid={summaryGrid}
    >
      <LegalSection id="scope" title="What these terms cover" badge="JURISDICTION">
        <p>
          These Terms of Service apply directly to your interaction with the website at {host},
          including the online icon gallery, the search catalog, interactive component previews,
          the Next.js documentation portal, and the public shadcn/ui registry endpoints hosted at this domain.
        </p>
        <p>
          <strong>Crucial Distinction:</strong> These terms govern the web platform itself. They do <em>not</em> govern your subsequent use of the downloaded icon drawings or packages in your own projects. Those are governed exclusively by the <LegalLink href={LEGAL.license}>{SET_LICENSE_NAME}</LegalLink>, which is unconditional and irrevocable.
        </p>
        <p>
          For information on how we protect your privacy while browsing the site, please review our{" "}
          <LegalLink href={LEGAL.privacy}>Privacy Policy</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="license" title="Independent icon licensing" badge="PRECEDENCE">
        <p>
          {SET_TITLE} is published under the terms of the{" "}
          <LegalLink href={LEGAL.license}>{SET_LICENSE_NAME}</LegalLink>.
        </p>
        <p>
          Nothing in these website terms introduces any additional fee, restriction, or prerequisite on the license granted by MIT. If any interpretation of these terms appears to conflict with the MIT License regarding the code or the vector assets, the MIT License takes full precedence.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable use of the site" badge="FAIR USE">
        <p>
          We provide this documentation site, registry, and CLI endpoints as a public good for the design and engineering communities.
        </p>
        <LegalList>
          <li>
            <strong>Fair Consumption:</strong> You may query the search engine, download SVGs, copy code snippets, and use the shadcn registry freely.
          </li>
          <li>
            <strong>Bulk Programmatic Access:</strong> If you need to perform bulk downloads, mirror the collection, or conduct automated analysis, please clone the <LegalLink href={SET_REPO_URL}>GitHub repository</LegalLink> or install our npm packages (<code>@flux-icons/react</code>, <code>@flux-icons/cli</code>) rather than scraping the web pages.
          </li>
          <li>
            <strong>System Integrity:</strong> Do not attempt to bypass security headers, inject malicious payloads, conduct denial-of-service attacks, or disrupt availability for fellow developers.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="name" title="Brand identity and marks" badge="PROTECTION">
        <p>
          The name {SET_TITLE}, our wordmark, and our logos represent our project reputation and quality standards.
        </p>
        <p>
          You are entirely free and encouraged to state truthfully that your application, theme, or design kit is built using {SET_TITLE}. However, you may not use our brand marks in a confusing or deceptive manner that suggests official endorsement, sponsorship, or co-authorship without express consent.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="Disclaimer of warranties and liability" badge="DISCLAIMER">
        <p>
          To the maximum extent permitted by applicable law, this website, its documentation, and all associated software and icon assets are provided strictly on an <strong>&ldquo;as is&rdquo;</strong> and <strong>&ldquo;as available&rdquo;</strong> basis, without warranty of any kind, whether express, implied, statutory, or otherwise.
        </p>
        <p>
          In no event shall the authors, maintainers, or contributors be held liable for any damages, losses, or claims (including loss of data, profits, or business interruption) arising out of your access to or inability to use this site, its registry, or the icons downloaded from it.
        </p>
      </LegalSection>

      <LegalSection id="revisions" title="Revisions and transparency" badge="AUDIT TRAIL">
        <p>
          We periodically update these terms to reflect infrastructure enhancements or regulatory changes. The date displayed at the top indicates when these terms were last amended.
        </p>
        <p>
          In keeping with our open-source values, every revision is committed directly to our public{" "}
          <LegalLink href={SET_REPO_URL}>GitHub repository commit log</LegalLink>, accompanied by a transparent explanatory note.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Inquiries and feedback" badge="COMMUNITY">
        <p>
          As an open-source project, all inquiries, bug reports, and suggestions are handled openly through our official{" "}
          <LegalLink href={SET_ISSUES_URL}>GitHub Issue Tracker</LegalLink>.
        </p>
        <p>
          This ensures questions and answers remain visible, transparent, and beneficial to the wider open-source community.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
