import { Resend } from "resend";

let client: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (client) return client;
  client = new Resend(key);
  return client;
}

export interface SendEmailInput {
  to?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY tanımlı değil." };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const to = input.to ?? process.env.RESEND_TO_EMAIL;

  if (!to) {
    return { ok: false, error: "RESEND_TO_EMAIL tanımlı değil." };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}

export function buildEpisodeEmail(input: {
  animeTitle: string;
  episodeNumber: number;
  animeId: number;
  coverUrl: string | null;
  format: string | null;
  seasonYear: number | null;
}): { subject: string; html: string; text: string } {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://sytheris.vercel.app";
  const link = `${siteUrl}/anime/${input.animeId}`;

  const subject = `Yeni bölüm: ${input.animeTitle} — ${input.episodeNumber}. bölüm`;

  const cover = input.coverUrl
    ? `<img src="${input.coverUrl}" alt="" width="120" style="border-radius:8px;display:block;margin-bottom:20px;" />`
    : "";

  const meta = [input.format, input.seasonYear ? String(input.seasonYear) : null]
    .filter(Boolean)
    .join(" · ");

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0B0B0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#F5F3EF;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0F;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#131318;border-radius:16px;border:1px solid #1C1C23;overflow:hidden;">
          <tr>
            <td style="padding:32px;">

              <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#00E676;font-family:monospace;margin-bottom:8px;">
                SYTHERIS · BİLDİRİM
              </div>

              <h1 style="margin:0 0 24px;font-size:24px;font-weight:600;line-height:1.2;color:#F5F3EF;">
                Yeni bölüm yayında
              </h1>

              ${cover}

              <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#71717E;font-family:monospace;margin-bottom:6px;">
                ${meta || "Anime"}
              </div>

              <div style="font-size:20px;font-weight:600;line-height:1.3;color:#F5F3EF;margin-bottom:12px;">
                ${escapeHtml(input.animeTitle)}
              </div>

              <div style="display:inline-block;padding:8px 14px;background:rgba(0,230,118,0.12);border:1px solid rgba(0,230,118,0.4);border-radius:999px;font-size:13px;font-weight:600;color:#00E676;font-family:monospace;margin-bottom:28px;">
                ${input.episodeNumber}. BÖLÜM
              </div>

              <div style="margin-top:28px;">
                <a href="${link}" style="display:inline-block;background:#00E676;color:#0B0B0F;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">
                  Detayları gör →
                </a>
              </div>

            </td>
          </tr>
        </table>

        <div style="margin-top:20px;font-size:11px;color:#71717E;font-family:monospace;">
          <a href="${siteUrl}/settings" style="color:#71717E;text-decoration:none;">Ayarlardan bildirimleri kapat</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `Yeni bölüm yayında!

${input.animeTitle} — ${input.episodeNumber}. bölüm
${meta}

${link}`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}