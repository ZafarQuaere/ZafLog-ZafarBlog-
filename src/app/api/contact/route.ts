import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(10000),
});

async function resolveRecipient(): Promise<string | null> {
  const db = getAdminDb();
  if (db) {
    const contactPage = await db.collection("pages").doc("contact").get();
    const fromContact = contactPage.data()?.recipientEmail;
    if (fromContact && String(fromContact).includes("@")) return String(fromContact);

    const siteDoc = await db.collection("settings").doc("site").get();
    const fromSite = siteDoc.data()?.contactRecipientEmail;
    if (fromSite && String(fromSite).includes("@")) return String(fromSite);
  }
  const env = process.env.CONTACT_EMAIL;
  return env && env.includes("@") ? env : null;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid input" }, { status: 400 });
  }

  const recipient = await resolveRecipient();
  if (!recipient) {
    return NextResponse.json({ success: false, message: "Contact email is not configured." }, { status: 500 });
  }

  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, message: "Email service is not configured." }, { status: 500 });
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return NextResponse.json({ success: false, message: "RESEND_FROM_EMAIL is not set." }, { status: 500 });
  }

  const { name, email, subject, message } = parsed.data;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      reply_to: email,
      subject: `[Blog contact] ${subject}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Message:</strong></p><p>${escapeHtml(
        message,
      ).replace(/\n/g, "<br/>")}</p>`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Resend error", res.status, errText);
    return NextResponse.json({ success: false, message: "Failed to send email." }, { status: 502 });
  }

  return NextResponse.json({ success: true, message: "Sent" });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
