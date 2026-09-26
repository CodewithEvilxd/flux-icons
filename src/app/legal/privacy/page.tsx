import { SETTINGS_COOKIE, SETTINGS_DEFAULTS } from "@/lib/browser-settings"
import { loadIcons } from "@/lib/icons"
import { pageMetadata, SITE_URL } from "@/lib/seo"
import {
  LEGAL,
  SET_ISSUES_URL,
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
import { ShieldCheck, EyeOff, Lock, Server } from "@/components/icons"

export const metadata = pageMetadata({
  path: LEGAL.privacy,
  title: "Privacy",
  description:
    `How ${SET_TITLE} protects your privacy: zero user accounts, zero cross-site tracking, ` +
    `and no advertising pixels. A single functional cookie stores your interface preferences.`,
  socialDescription:
    "Zero user accounts, no cross-site tracking, and nothing on this site knows who you are.",
})

export default async function Page() {
  const stored = Object.keys(SETTINGS_DEFAULTS)
  const drawings = (await loadIcons()).length
  const host = SITE_URL.replace(/^https:\/\//, "")

  const summaryGrid = (
    <>
      <LegalHighlightCard
        variant="emerald"
        icon={<EyeOff className="size-4 text-emerald-600 dark:text-emerald-400" />}
        title="Zero Personal Tracking"
        description="We do not track your identity, your browser fingerprint, or your cross-site browsing habits."
      />
      <LegalHighlightCard
        variant="emerald"
        icon={<Lock className="size-4 text-emerald-600 dark:text-emerald-400" />}
        title="No User Accounts or Passwords"
        description="We collect zero names, zero emails, and zero credentials. The entire library is instantly accessible."
      />
      <LegalHighlightCard
        variant="blue"
        icon={<Server className="size-4 text-blue-600 dark:text-blue-400" />}
        title="Single Functional Cookie"
        description={`The only cookie we set (${SETTINGS_COOKIE}) strictly stores your theme mode and grid display preferences.`}
      />
      <LegalHighlightCard
        variant="amber"
        icon={<ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />}
        title="Privacy-Preserving Telemetry"
        description="Aggregate page counts are collected at the edge without logging IP addresses or personal identifiers."
      />
    </>
  )

  return (
    <LegalPage
      path={LEGAL.privacy}
      title="Privacy Policy"
      badge="[ PRIVACY-FIRST PLEDGE ]"
      description={`Transparent disclosure of how ${host} respects your privacy. Built on the principle that the best way to protect your data is never collecting it.`}
      updated="2026-08-23"
      summaryGrid={summaryGrid}
    >
      <LegalSection id="philosophy" title="Core privacy philosophy" badge="COMMITMENT">
        <p>
          {SET_TITLE} is an open-source design library and developer tool, not an advertising network
          or data-harvesting business. We believe developer tools should be transparent, lightweight,
          and completely respectful of individual privacy.
        </p>
        <p>
          You do not need to create an account, log in, provide an email address, or consent to invasive tracking cookies to use any feature of this website or download any of our {drawings.toLocaleString("en-US")} icons.
        </p>
      </LegalSection>

      <LegalSection id="what-we-dont-collect" title="Information we do not collect" badge="ZERO TRACKING">
        <p>
          To be completely explicit, {SET_TITLE} does <strong>not</strong> collect or store:
        </p>
        <LegalList>
          <li>Your name, email address, postal address, or telephone number.</li>
          <li>Login credentials, passwords, or authentication tokens.</li>
          <li>Payment information, credit card details, or billing addresses.</li>
          <li>Cross-site advertising cookies or behavioral retargeting trackers.</li>
          <li>Social media tracking pixels (e.g. Meta Pixel, TikTok, LinkedIn).</li>
          <li>Precise geolocation coordinates or device fingerprint hashes.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="cookies" title="Local preferences cookie" badge="FUNCTIONAL ONLY">
        <p>
          The only first-party cookie our website writes is named <code>{SETTINGS_COOKIE}</code>.
        </p>
        <p>
          This is a strictly functional, first-party cookie whose sole purpose is to remember how you customized the icon browser across page reloads. It contains no personally identifiable data and stores exclusively these {stored.length} display preferences:
        </p>
        <LegalList>
          {stored.map((key) => (
            <li key={key}>
              <code>{key}</code>: Your selected icon style, corner treatment, stroke width, or density view.
            </li>
          ))}
        </LegalList>
        <p>
          This cookie is never shared with third parties, never tracked across different websites, and can be cleared at any time directly through your browser settings.
        </p>
      </LegalSection>

      <LegalSection id="analytics" title="Privacy-preserving analytics" badge="AGGREGATED METRICS">
        <p>
          To understand which icons are most helpful and verify site reliability, we utilize privacy-focused, cookie-less edge analytics (Vercel Web Analytics &amp; Speed Insights).
        </p>
        <p>
          These tools collect strictly aggregate, anonymized metrics:
        </p>
        <LegalList>
          <li>Page load performance and Core Web Vitals (LCP, FID, CLS).</li>
          <li>Aggregate page visit counts and general referrers (e.g. GitHub, Twitter, search engines).</li>
          <li>General country-level geography derived at the edge without logging IP addresses.</li>
        </LegalList>
        <p>
          No individual user session is reconstructed, and no persistent identifier is stored on your machine.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="Third-party services and links" badge="EXTERNAL PLATFORMS">
        <p>
          When you interact with external services linked from this website (such as our{" "}
          <LegalLink href={SET_REPO_URL}>GitHub repository</LegalLink>, the npm registry, the Figma Community,
          or social platforms), your interaction is governed by their respective privacy policies.
        </p>
        <p>
          We take deliberate measures to protect you on our end:
        </p>
        <LegalList>
          <li>All typography and web fonts (Geist Sans and Geist Mono) are self-hosted directly on our origin server, ensuring no requests are dispatched to external font servers.</li>
          <li>Contributor avatars and mockups are proxied through our edge CDN with strict Content Security Headers.</li>
          <li>Outbound links open in isolated tabs with <code>rel=&quot;noopener noreferrer&quot;</code> security attributes.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="security" title="Security and data protection" badge="EDGE SECURITY">
        <p>
          All traffic to and from {host} is strictly encrypted in transit using industry-standard TLS 1.3 encryption (HTTPS).
          We enforce strict HTTP Strict Transport Security (HSTS) headers and automated edge defenses against unauthorized tampering.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact regarding privacy" badge="SUPPORT">
        <p>
          If you have questions regarding our privacy practices or wish to review the underlying code that handles settings and analytics, our entire web application is open-source.
        </p>
        <p>
          You are welcome to inspect our code and raise any questions or feedback directly on our{" "}
          <LegalLink href={SET_ISSUES_URL}>GitHub Issue Tracker</LegalLink>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
