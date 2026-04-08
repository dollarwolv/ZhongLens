import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getUnsubscribeUrl } from "./app-url.js";

// This whole thing is ChatGPT-generated – I don't wanna take credit for what I didn't do

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_FROM = "Justin from ZhongLens <dev@zhonglens.dev>";
const DEFAULT_REPLY_TO = "dev@zhonglens.dev";
const DEFAULT_SUBJECT = "The ZhongLens beta is now ready!";

function printUsage() {
  console.log(
    `
Usage: node utils/sendEmails.mjs [--dry-run] [--limit <number>] [--batch-size <number>] [--send-test-email <email>]

Options:
  --dry-run          Fetch recipients and print a preview without sending.
  --limit <number>   Only process the first N subscribed users.
  --batch-size <n>   Number of emails to send in each Resend batch request.
  --send-test-email  Send this email to one specific address only.
  --help             Show this message.
`.trim(),
  );
}

function parsePositiveInt(value, flagName) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${flagName} must be a positive integer.`);
  }

  return parsedValue;
}

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

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

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

function chunkArray(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function buildEmailText(unsubscribeUrl) {
  const unsubscribeSection = unsubscribeUrl
    ? `Unsubscribe: ${unsubscribeUrl}`
    : "This is a one-off test send, so the unsubscribe link is omitted.";

  return `Hey,

I’m opening up a very small ZhongLens beta for 5 people from the waitlist.

If you’d like to join, reply to this email. The first 5 people to reply will be invited.

This beta is for people who expect to use ZhongLens frequently, are willing to share in-depth feedback, and can report bugs when they run into them. You should also be using Chrome or another Chromium-based browser like Arc, since Firefox is not supported yet.

If you’re selected, you’ll get:

3 months of ZhongLens supporter for free, including access to the Cloud OCR model

a special price afterwards as a thank you for helping shape the product

If you’re interested, reply with a short note about how you plan to use ZhongLens and which browser you use.

Thanks again for being on the waitlist.

Justin

${unsubscribeSection}`;
}

function buildEmailHtml(unsubscribeUrl) {
  const footerHtml = unsubscribeUrl
    ? `<p style="font-size: 12px; color: #6b7280;">
        Don’t want emails like this anymore?
        <a href="${unsubscribeUrl}" style="color: #2563eb;">Unsubscribe here</a>.
      </p>`
    : `<p style="font-size: 12px; color: #6b7280;">
        This is a one-off test send, so the unsubscribe link is omitted.
      </p>`;

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <p>Hey,</p>
      <p>I’m opening up a very small ZhongLens beta for 5 people from the waitlist.</p>
      <p>If you’d like to join, reply to this email. The first 5 people to reply will be invited.</p>
      <p>
        This beta is for people who expect to use ZhongLens frequently, are willing to share in-depth feedback,
        and can report bugs when they run into them. You should also be using Chrome or another Chromium-based
        browser like Arc, since Firefox is not supported yet.
      </p>
      <p>If you’re selected, you’ll get:</p>
      <ul>
        <li>3 months of ZhongLens supporter for free, including access to the Cloud OCR model</li>
        <li>a special price afterwards as a thank you for helping shape the product</li>
      </ul>
      <p>If you’re interested, reply with a short note about how you plan to use ZhongLens and which browser you use.</p>
      <p>Thanks again for being on the waitlist.</p>
      <p>Justin</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      ${footerHtml}
    </div>
  `;
}

function createEmailPayload(user) {
  const unsubscribeUrl = user.unsubscribe_token
    ? getUnsubscribeUrl(user.unsubscribe_token)
    : null;

  return {
    from: process.env.WAITLIST_FROM_EMAIL?.trim() || DEFAULT_FROM,
    to: user.email,
    replyTo: process.env.WAITLIST_REPLY_TO?.trim() || DEFAULT_REPLY_TO,
    subject: process.env.WAITLIST_EMAIL_SUBJECT?.trim() || DEFAULT_SUBJECT,
    headers: unsubscribeUrl
      ? {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
        }
      : undefined,
    html: buildEmailHtml(unsubscribeUrl),
    text: buildEmailText(unsubscribeUrl),
  };
}

function createBatchPayload(users) {
  return users.map((user) => createEmailPayload(user));
}

async function fetchSubscribedUsers(supabase, limit) {
  let query = supabase
    .from("waitlist_users")
    .select("id, created_at, email, unsubscribe_token, beta_invite_sent_at")
    .eq("subscribed_status", true)
    .is("unsubscribed_at", null)
    .is("beta_invite_sent_at", null)
    .order("created_at", { ascending: true });

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

async function main() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printUsage();
    return;
  }

  const supabase = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  let recipients;

  if (options.sendTestEmail) {
    const waitlistUser = await fetchWaitlistUserByEmail(
      supabase,
      options.sendTestEmail,
    );

    recipients = [
      waitlistUser ?? {
        email: options.sendTestEmail,
        unsubscribe_token: null,
      },
    ];

    console.log(`Test mode enabled. Targeting ${options.sendTestEmail} only.`);

    if (!waitlistUser) {
      console.log(
        "No matching waitlist user found. Sending without an unsubscribe link.",
      );
    } else if (waitlistUser.beta_invite_sent_at) {
      console.log(
        `Matched waitlist user already has beta_invite_sent_at=${waitlistUser.beta_invite_sent_at}. Test send will not modify it.`,
      );
    }
  } else {
    recipients = await fetchSubscribedUsers(supabase, options.limit);

    if (recipients.length === 0) {
      console.log("No subscribed waitlist users found.");
      return;
    }

    console.log(
      `Loaded ${recipients.length} subscribed waitlist user(s) from ${getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")}.`,
    );
    console.log(
      `Preview recipients: ${recipients
        .slice(0, 5)
        .map((user) => user.email)
        .join(", ")}`,
    );
  }

  if (options.dryRun) {
    console.log("Dry run enabled. No emails were sent.");
    return;
  }

  const resend = new Resend(getRequiredEnv("RESEND_API_KEY"));
  const recipientChunks = options.sendTestEmail
    ? [recipients]
    : chunkArray(recipients, options.batchSize);
  let totalSent = 0;

  for (let index = 0; index < recipientChunks.length; index += 1) {
    const batchNumber = index + 1;
    const recipientChunk = recipientChunks[index];
    const payload = createBatchPayload(recipientChunk);

    console.log(
      `Sending batch ${batchNumber}/${recipientChunks.length} (${recipientChunk.length} recipient(s))...`,
    );

    const { data, error } = await resend.batch.send(payload);

    if (error) {
      throw new Error(`Resend batch ${batchNumber} failed: ${error.message}`);
    }

    const sentCount = data?.data?.length ?? 0;
    totalSent += sentCount;
    await markBetaInviteSent(supabase, recipientChunk);
    console.log(`Batch ${batchNumber} accepted ${sentCount} email(s).`);
  }

  console.log(`Finished. Resend accepted ${totalSent} email(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
