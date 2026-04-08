export const metadata = {
  title: "Privacy Policy | ZhongLens",
  description:
    "Privacy Policy for the ZhongLens website and browser extension.",
};

const lastUpdated = "April 8, 2026";

const sections = [
  {
    title: "Introduction and Scope",
    body: [
      "This Privacy Policy explains how ZhongLens handles information when you use the ZhongLens website, browser extension, and related services. ZhongLens is operated by an individual developer.",
      "This policy applies to information collected through the ZhongLens website, the ZhongLens browser extension, optional account and subscription features, and optional cloud OCR processing. It is intended to describe the product's current behavior based on the current codebase and service flow. It does not cover third-party services that have their own privacy policies.",
    ],
  },
  {
    title: "Information We Collect",
    body: [
      "Depending on how you use ZhongLens, we may collect account information such as your email address, authentication and session information needed to keep you signed in, waitlist signup information, subscription status information, internal account identifiers, and support messages you send to us.",
      "The browser extension also stores operational and preference data in browser storage, such as OCR mode, crop settings, onboarding state, shortcut preferences, usage counters, subscription cache data, and an anonymous installation identifier used for cloud OCR usage tracking.",
      "If you use ZhongLens's OCR features, the extension may process screenshots of the visible tab or a user-selected area of a webpage so it can detect and display text. When cloud OCR is enabled, the backend receives the image data needed to perform OCR, an anonymous installation identifier, and, if you are signed in, a JWT that allows the backend to resolve your account and check subscription status.",
      "The ZhongLens website also uses analytics tooling to understand aggregate usage of the site. Standard technical information such as browser metadata, page visits, and related usage events may be processed through those tools.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use information to provide and improve ZhongLens, including operating OCR features, displaying results on webpages, managing accounts, maintaining subscriptions, sending waitlist or product updates when requested, responding to support requests, and protecting the service against abuse or overuse.",
      "We do not sell personal information and we do not use OCR content or webpage content for advertising purposes.",
    ],
  },
  {
    title: "Image Data Processing: Local OCR vs. Cloud OCR",
    body: [
      "When local OCR is used, OCR processing happens inside the browser extension using packaged OCR components. In that mode, the captured image data is processed locally on the device as part of the extension workflow and is not sent to ZhongLens's OCR backend.",
      "When cloud OCR is enabled by the user, the extension sends the image data needed to perform OCR to ZhongLens's backend. In the current backend code, that uploaded image is read into server memory, decoded, processed by the OCR model, and returned as OCR results. The current backend code does not write the uploaded image to a database table, object storage bucket, or persistent file path as part of the OCR flow.",
      "That distinction is important: the image data is processed on a server, but the current codebase does not store the uploaded screenshot itself as part of the application's OCR pipeline. The OCR request exists so the server can generate text results and return them to the extension.",
      "When a cloud OCR request is made by a user who is not logged in, the backend receives the uploaded image and an anonymous installation identifier. The backend uses that anonymous identifier to look up and update the number of free cloud OCR requests associated with that browser installation.",
      "When a cloud OCR request is made by a user who is logged in, the backend receives the uploaded image, the anonymous installation identifier, and a JWT. The JWT is used to resolve the signed-in user's account with Supabase and to check whether the user has a supporter subscription. In the broader account system, ZhongLens knows the email address associated with that account, but the OCR request itself does not send the email address as a separate form field. Instead, the backend resolves identity through the authentication token.",
      "The current cloud OCR backend does store some non-image records needed to operate the service. Specifically, it stores the anonymous installation identifier, free-tier request counts associated with that identifier, and, when a JWT is present, a link between the anonymous installation identifier and the user's internal Supabase user ID. The backend also reads subscription status from the subscription table to determine whether cloud OCR limits apply.",
    ],
  },
  {
    title: "Accounts and Authentication",
    body: [
      "If you create an account or sign in, ZhongLens uses Supabase to support authentication, account sessions, password reset flows, and related account features.",
      "Account information is used to provide account-based functionality, including sign-in, profile management, password resets, account-linked cloud OCR behavior, and access to subscription-linked features. The extension and website may also use session information to determine whether you are logged in and to open authenticated account flows.",
    ],
  },
  {
    title: "Payments and Subscriptions",
    body: [
      "If you choose to purchase a subscription or supporter plan, ZhongLens uses Stripe and related website endpoints to create checkout sessions, support billing portal access, and update subscription status. Payment card details are processed by Stripe, not stored directly by ZhongLens.",
      "ZhongLens stores and reads subscription-related records such as whether an account has an active supporter plan, along with identifiers needed to manage that subscription, such as Stripe customer or subscription references. This subscription status is also used by the extension and backend to determine cloud OCR eligibility and limits.",
    ],
  },
  {
    title: "Website Analytics and Waitlist",
    body: [
      "The ZhongLens website uses Vercel Analytics to measure general website usage and performance.",
      "If you join the waitlist, your email address is stored so ZhongLens can send updates about product availability and related announcements. Waitlist emails are sent using Resend, and each email may include an unsubscribe link. Waitlist subscription state and unsubscribe tokens are stored so ZhongLens can manage those emails correctly.",
    ],
  },
  {
    title: "Data Sharing and Service Providers",
    body: [
      "ZhongLens shares information only as needed to operate the product and related services. Service providers currently used in the codebase include Supabase for authentication and application data, Stripe for payments and subscription management, Resend for sending emails, and Vercel Analytics for website analytics.",
      "If you use cloud OCR, OCR image data is processed by ZhongLens's backend infrastructure so the OCR result can be returned to you. The backend also uses Supabase to read or update the non-image operational records described above, such as usage counts, linked user identifiers, and subscription status checks.",
      "We may also disclose information if required by law, to enforce our terms, or to protect the security, rights, or integrity of ZhongLens, its users, or others.",
    ],
  },
  {
    title: "Data Retention",
    body: [
      "We retain information for as long as reasonably necessary to operate ZhongLens, maintain accounts and subscriptions, provide the waitlist or email features you requested, comply with legal obligations, resolve disputes, and enforce agreements.",
      "In the current codebase, the uploaded image used for cloud OCR is processed in memory and is not intentionally written to persistent application storage as part of the OCR request flow. By contrast, account records, waitlist records, subscription records, anonymous installation identifiers, usage counts, and install-to-user links may be retained in application databases for as long as they are reasonably needed to operate the service.",
      "Retention periods may vary depending on the type of information and the purpose for which it was collected. When information is no longer reasonably needed, we will seek to delete it or de-identify it where appropriate.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use reasonable administrative, technical, and organizational measures to protect information processed through ZhongLens. However, no method of transmission over the internet or method of electronic storage is completely secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    title: "Your Privacy Rights",
    body: [
      "Depending on where you live, you may have rights to request access to personal information, request correction, request deletion, request a copy of your data, or object to or restrict certain processing. Residents of the EEA, UK, and California may have additional rights under applicable law.",
      "You may also unsubscribe from waitlist or update emails using the unsubscribe link included in those messages. To make a privacy-related request, contact us at the email address below. We may need to verify your identity before completing certain requests.",
    ],
  },
  {
    title: "Children's Privacy",
    body: [
      "ZhongLens is not intended for children under 13, and we do not knowingly collect personal information from children under 13. If you believe that a child has provided personal information through ZhongLens, please contact us so we can review and address the issue.",
    ],
  },
  {
    title: "Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes to ZhongLens, legal requirements, or operational practices. If we make material changes, we will update the \"Last updated\" date on this page.",
    ],
  },
  {
    title: "Contact Information",
    body: [
      "If you have questions about this Privacy Policy or want to make a privacy request, contact: dev@zhonglens.dev.",
    ],
  },
];

function PrivacyPage() {
  return (
    <main className="bg-zhonglens-white text-black min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="mb-12 rounded-3xl border border-black/10 bg-white p-8 shadow-lg shadow-black/5 md:p-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] opacity-50">
            Privacy Policy
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            ZhongLens Privacy Policy
          </h1>
          <p className="max-w-2xl text-base leading-7 opacity-70 md:text-lg">
            This page explains what information ZhongLens processes, why it is
            processed, and what choices and rights users have.
          </p>
          <p className="mt-6 text-sm opacity-60">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-black/10 bg-white/70 p-7 md:p-8"
            >
              <h2 className="mb-4 text-2xl font-bold tracking-tight">
                {section.title}
              </h2>
              <div className="space-y-4 text-base leading-7 opacity-80">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>
                    {paragraph.includes("dev@zhonglens.dev") ? (
                      <>
                        {paragraph.split("dev@zhonglens.dev")[0]}
                        <a
                          href="mailto:dev@zhonglens.dev"
                          className="font-medium underline underline-offset-4"
                        >
                          dev@zhonglens.dev
                        </a>
                        {paragraph.split("dev@zhonglens.dev")[1]}
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export default PrivacyPage;
