import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getAppUrl, getUnsubscribeUrl } from "./app-url.js";

// Bulk waitlist email sender.
//
// Flow:
// 1. Parse CLI options.
// 2. Load the editable HTML/text template for the selected mode.
// 3. Fetch the right recipients from Supabase.
// 4. Render each recipient's unsubscribe link into the templates.
// 5. Refuse unsafe public URLs before any real send.
// 6. Send batches through Resend and update Supabase when needed.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, "email-templates");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_FROM = "Justin from ZhongLens <dev@zhonglens.dev>";
const DEFAULT_REPLY_TO = "dev@zhonglens.dev";

const EMAIL_MODES = {
  betaInvite: "beta-invite",
  unsubscribeCorrection: "unsubscribe-correction",
};

// Mode-specific behavior lives here so the rest of the script can stay generic.
const EMAIL_CONFIG = {
  [EMAIL_MODES.betaInvite]: {
    label: "beta invite",
    defaultSubject: "The ZhongLens beta is now ready!",
    subjectEnvName: "WAITLIST_BETA_INVITE_SUBJECT",
    fallbackSubjectEnvName: "WAITLIST_EMAIL_SUBJECT",
    templateName: "beta-invite",
    recipientDescription:
      "subscribed waitlist user(s) who have not received the beta invite",
    markBetaInviteSent: true,
  },
  [EMAIL_MODES.unsubscribeCorrection]: {
    label: "unsubscribe correction",
    defaultSubject: "Correction: ZhongLens unsubscribe link",
    subjectEnvName: "WAITLIST_CORRECTION_EMAIL_SUBJECT",
    templateName: "unsubscribe-correction",
    recipientDescription:
      "subscribed waitlist user(s) who already received the beta invite",
    markBetaInviteSent: false,
  },
};

// CLI help is intentionally detailed because this script is risky to run by hand.
function printUsage() {
  console.log(
    `
Usage: node utils/sendEmails.mjs [--dry-run] [--limit <number>] [--batch-size <number>] [--send-test-email <email>]

Options:
  --dry-run          Fetch recipients and print a preview without sending.
  --limit <number>   Only process the first N subscribed users.
  --batch-size <n>   Number of emails to send in each Resend batch request.
  --send-test-email  Send this email to one specific address only.
  --mode <mode>      Email mode: beta-invite or unsubscribe-correction.
  --correction       Shortcut for --mode unsubscribe-correction.
  --help             Show this message.

Editable email templates:
  HTML: utils/email-templates/<mode>.html
  Text: utils/email-templates/<mode>.txt

Optional environment variables:
  NEXT_PUBLIC_APP_URL                  Must be public HTTPS for real sends.
  WAITLIST_PROFILE_IMAGE_URL           Public HTTPS image URL for your picture.
  WAITLIST_POSTAL_ADDRESS              Mailing address added to the footer.
  WAITLIST_CORRECTION_EMAIL_SUBJECT    Subject override for correction mode.
  WAITLIST_BETA_INVITE_SUBJECT         Subject override for beta invite mode.
`.trim(),
  );
}

// Keep numeric CLI/env parsing strict so a typo does not send too many emails.
function parsePositiveInt(value, flagName) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${flagName} must be a positive integer.`);
  }

  return parsedValue;
}

// Parse command-line flags into one options object used by the main flow.
function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    batchSize: parsePositiveInt(
      process.env.WAITLIST_BATCH_SIZE ?? String(DEFAULT_BATCH_SIZE),
      "WAITLIST_BATCH_SIZE",
    ),
    dryRun: false,
    help: false,
    limit: null,
    mode: EMAIL_MODES.betaInvite,
    sendTestEmail: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg === "--correction") {
      options.mode = EMAIL_MODES.unsubscribeCorrection;
      continue;
    }

    if (arg === "--mode") {
      options.mode = parseMode(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith("--mode=")) {
      options.mode = parseMode(arg.split("=")[1]);
      continue;
    }

    if (arg === "--limit") {
      options.limit = parsePositiveInt(args[index + 1], "--limit");
      index += 1;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      options.limit = parsePositiveInt(arg.split("=")[1], "--limit");
      continue;
    }

    if (arg === "--batch-size") {
      options.batchSize = parsePositiveInt(args[index + 1], "--batch-size");
      index += 1;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      options.batchSize = parsePositiveInt(arg.split("=")[1], "--batch-size");
      continue;
    }

    if (arg === "--send-test-email") {
      options.sendTestEmail = normalizeEmail(
        args[index + 1],
        "--send-test-email",
      );
      index += 1;
      continue;
    }

    if (arg.startsWith("--send-test-email=")) {
      options.sendTestEmail = normalizeEmail(
        arg.split("=")[1],
        "--send-test-email",
      );
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

// Only known modes are allowed because each mode maps to recipient rules.
function parseMode(value) {
  const mode = value?.trim();

  if (!Object.values(EMAIL_MODES).includes(mode)) {
    throw new Error(
      `--mode must be one of: ${Object.values(EMAIL_MODES).join(", ")}.`,
    );
  }

  return mode;
}

// Required secrets are loaded lazily so --help can run without env setup.
function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// Email addresses from Supabase and CLI input are normalized before sending.
function normalizeEmail(value, flagName = "email") {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue) {
    throw new Error(`${flagName} requires an email address.`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    throw new Error(`${flagName} must be a valid email address.`);
  }

  return normalizedValue;
}

// Resend accepts batch sends, so split large recipient sets into chunks.
function chunkArray(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

// HTML template replacements are escaped unless they are deliberate HTML blocks.
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Subjects are still env-configurable, but copy is no longer embedded in JS.
function getEmailSubject(mode) {
  const config = EMAIL_CONFIG[mode];
  const modeSubject = process.env[config.subjectEnvName]?.trim();
  const fallbackSubject = config.fallbackSubjectEnvName
    ? process.env[config.fallbackSubjectEnvName]?.trim()
    : null;

  return modeSubject || fallbackSubject || config.defaultSubject;
}

// Template filenames are derived from the mode config.
function getTemplatePaths(mode) {
  const templateName = EMAIL_CONFIG[mode].templateName;

  return {
    html: path.resolve(TEMPLATES_DIR, `${templateName}.html`),
    text: path.resolve(TEMPLATES_DIR, `${templateName}.txt`),
  };
}

// Load both HTML and text versions so every email has a plain-text fallback.
async function loadEmailTemplates(mode) {
  const templatePaths = getTemplatePaths(mode);
  const [html, text] = await Promise.all([
    fs.readFile(templatePaths.html, "utf8"),
    fs.readFile(templatePaths.text, "utf8"),
  ]);

  return {
    html,
    paths: templatePaths,
    text,
  };
}

// Optional compliance footer. Set WAITLIST_POSTAL_ADDRESS to include it.
function buildPostalAddressHtml() {
  const postalAddress = process.env.WAITLIST_POSTAL_ADDRESS?.trim();

  return postalAddress
    ? `<p style="font-size: 12px; color: #6b7280; margin: 8px 0 0;">Mailing address: ${escapeHtml(postalAddress)}</p>`
    : "";
}

// Plain-text companion to buildPostalAddressHtml.
function buildPostalAddressText() {
  const postalAddress = process.env.WAITLIST_POSTAL_ADDRESS?.trim();

  return postalAddress ? `Mailing address: ${postalAddress}` : "";
}

// Optional sender photo. Email images should be hosted at a public HTTPS URL.
function buildProfileImageHtml() {
  const imageUrl = process.env.WAITLIST_PROFILE_IMAGE_URL?.trim();

  if (!imageUrl) {
    return "";
  }

  return `
    <img
      src="${escapeHtml(imageUrl)}"
      alt="Justin"
      width="56"
      height="56"
      style="display: block; width: 56px; height: 56px; border-radius: 50%; object-fit: cover; margin: 0 0 16px;"
    />
  `.trim();
}

// Tiny templating helper: replaces {{PLACEHOLDER}} tokens with strings.
function renderTemplate(template, replacements) {
  return Object.entries(replacements).reduce(
    (rendered, [key, value]) =>
      rendered.replaceAll(`{{${key}}}`, value === null ? "" : String(value)),
    template,
  );
}

// Create the final HTML/text pair for one recipient.
function renderEmail({ mode, templates, unsubscribeUrl, user }) {
  const unsubscribeText = unsubscribeUrl
    ? `Unsubscribe: ${unsubscribeUrl}`
    : "This is a one-off test send, so the unsubscribe link is omitted.";

  const replacements = {
    APP_URL: getAppUrl(),
    EMAIL: user.email,
    POSTAL_ADDRESS_HTML: buildPostalAddressHtml(),
    POSTAL_ADDRESS_TEXT: buildPostalAddressText(),
    PROFILE_IMAGE_HTML: buildProfileImageHtml(),
    UNSUBSCRIBE_FOOTER_HTML: unsubscribeUrl
      ? `<p style="font-size: 12px; color: #6b7280; margin: 0;"><a href="${unsubscribeUrl}" style="color: #2563eb;">Unsubscribe here</a>.</p>`
      : `<p style="font-size: 12px; color: #6b7280; margin: 0;">This is a one-off test send, so the unsubscribe link is omitted.</p>`,
    UNSUBSCRIBE_TEXT: unsubscribeText,
    UNSUBSCRIBE_URL: unsubscribeUrl ?? "",
  };

  return {
    html: renderTemplate(templates.html, replacements),
    subject: getEmailSubject(mode),
    text: renderTemplate(templates.text, replacements),
  };
}

// Real sends should never include localhost, HTTP, or private-looking URLs.
function assertPublicHttpsUrl(value, envName) {
  let parsedUrl;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${envName} must be a valid URL. Received: ${value}`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local");

  if (parsedUrl.protocol !== "https:" || isLocalhost) {
    throw new Error(
      `${envName} must be a public HTTPS URL for real sends. Current value: ${value}`,
    );
  }
}

// Validate every URL that will be visible inside the outbound email.
function assertPublicSendUrls() {
  assertPublicHttpsUrl(getAppUrl(), "NEXT_PUBLIC_APP_URL");

  const profileImageUrl = process.env.WAITLIST_PROFILE_IMAGE_URL?.trim();

  if (profileImageUrl) {
    assertPublicHttpsUrl(profileImageUrl, "WAITLIST_PROFILE_IMAGE_URL");
  }
}

// Build one Resend email object for one recipient.
function createEmailPayload(user, mode, templates) {
  const unsubscribeUrl = user.unsubscribe_token
    ? getUnsubscribeUrl(user.unsubscribe_token)
    : null;
  const renderedEmail = renderEmail({ mode, templates, unsubscribeUrl, user });

  return {
    from: process.env.WAITLIST_FROM_EMAIL?.trim() || DEFAULT_FROM,
    to: user.email,
    replyTo: process.env.WAITLIST_REPLY_TO?.trim() || DEFAULT_REPLY_TO,
    subject: renderedEmail.subject,
    headers: unsubscribeUrl
      ? {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
        }
      : undefined,
    html: renderedEmail.html,
    text: renderedEmail.text,
  };
}

// Build the Resend batch payload for one chunk of recipients.
function createBatchPayload(users, mode, templates) {
  return users.map((user) => createEmailPayload(user, mode, templates));
}

// Normal sends only target users who are still subscribed and not unsubscribed.
async function fetchSubscribedUsers(supabase, limit, mode) {
  let query = supabase
    .from("waitlist_users")
    .select("id, created_at, email, unsubscribe_token, beta_invite_sent_at")
    .eq("subscribed_status", true)
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: true });

  if (mode === EMAIL_MODES.betaInvite) {
    // Beta invite mode should only reach people who have not already received it.
    query = query.is("beta_invite_sent_at", null);
  } else if (mode === EMAIL_MODES.unsubscribeCorrection) {
    // Correction mode should only reach people who got the earlier bad email.
    query = query.not("beta_invite_sent_at", "is", null);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch waitlist users: ${error.message}`);
  }

  return (data ?? [])
    .filter((user) => user.email && user.unsubscribe_token)
    .map((user) => ({
      ...user,
      email: normalizeEmail(user.email),
    }));
}

// Test sends try to reuse a real waitlist row so unsubscribe rendering is realistic.
async function fetchWaitlistUserByEmail(supabase, email) {
  const { data, error } = await supabase
    .from("waitlist_users")
    .select(
      "id, created_at, email, unsubscribe_token, subscribed_status, unsubscribed_at, beta_invite_sent_at",
    )
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch waitlist user ${email}: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    email: normalizeEmail(data.email),
  };
}

// Only beta invite mode updates beta_invite_sent_at after Resend accepts the batch.
async function markBetaInviteSent(supabase, users) {
  const userIds = users.map((user) => user.id).filter(Boolean);

  if (userIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("waitlist_users")
    .update({ beta_invite_sent_at: new Date().toISOString() })
    .in("id", userIds);

  if (error) {
    throw new Error(`Failed to mark beta invites as sent: ${error.message}`);
  }
}

// Test mode returns one recipient; real mode queries Supabase by mode.
async function getRecipients(supabase, options) {
  if (options.sendTestEmail) {
    const waitlistUser = await fetchWaitlistUserByEmail(
      supabase,
      options.sendTestEmail,
    );

    return [
      waitlistUser ?? {
        email: options.sendTestEmail,
        unsubscribe_token: null,
      },
    ];
  }

  return fetchSubscribedUsers(supabase, options.limit, options.mode);
}

// Print enough context that a dry run can catch obvious mistakes before sending.
function logRunSummary({ config, options, recipients, templates }) {
  console.log(`Mode: ${options.mode}`);
  console.log(`Subject: ${getEmailSubject(options.mode)}`);
  console.log(`HTML template: ${templates.paths.html}`);
  console.log(`Text template: ${templates.paths.text}`);

  if (options.sendTestEmail) {
    console.log(
      `Test mode enabled for ${config.label}. Targeting ${options.sendTestEmail} only.`,
    );
    return;
  }

  console.log(
    `Loaded ${recipients.length} ${config.recipientDescription} from ${getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")}.`,
  );
  console.log(
    `Preview recipients: ${recipients
      .slice(0, 5)
      .map((user) => user.email)
      .join(", ")}`,
  );
}

// Send each Resend batch sequentially so failures are easy to trace.
async function sendBatches({ mode, recipients, supabase, templates, options }) {
  const resend = new Resend(getRequiredEnv("RESEND_API_KEY"));
  const config = EMAIL_CONFIG[mode];
  const recipientChunks = options.sendTestEmail
    ? [recipients]
    : chunkArray(recipients, options.batchSize);
  let totalSent = 0;

  for (let index = 0; index < recipientChunks.length; index += 1) {
    const batchNumber = index + 1;
    const recipientChunk = recipientChunks[index];
    const payload = createBatchPayload(recipientChunk, mode, templates);

    console.log(
      `Sending batch ${batchNumber}/${recipientChunks.length} (${recipientChunk.length} recipient(s))...`,
    );

    const { data, error } = await resend.batch.send(payload);

    if (error) {
      throw new Error(`Resend batch ${batchNumber} failed: ${error.message}`);
    }

    const sentCount = data?.data?.length ?? 0;
    totalSent += sentCount;

    if (config.markBetaInviteSent) {
      await markBetaInviteSent(supabase, recipientChunk);
    }

    console.log(`Batch ${batchNumber} accepted ${sentCount} email(s).`);
  }

  console.log(`Finished. Resend accepted ${totalSent} email(s).`);
}

// Main orchestration. Most work is delegated to small functions above.
async function main() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printUsage();
    return;
  }

  const config = EMAIL_CONFIG[options.mode];
  const templates = await loadEmailTemplates(options.mode);
  const supabase = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
  const recipients = await getRecipients(supabase, options);

  if (recipients.length === 0) {
    console.log(`No ${config.recipientDescription} found.`);
    return;
  }

  logRunSummary({ config, options, recipients, templates });

  if (options.dryRun) {
    console.log("Dry run enabled. No emails were sent.");
    return;
  }

  assertPublicSendUrls();
  await sendBatches({
    mode: options.mode,
    options,
    recipients,
    supabase,
    templates,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
