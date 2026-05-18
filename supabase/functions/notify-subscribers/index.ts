// Supabase Edge Function: notify-subscribers
// Triggered when a new project is inserted into the `projects` table
// Sends a beautiful HTML email to all subscribers via Resend API

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") || "https://projectdukaan.vercel.app";

serve(async (req) => {
  try {
    const payload = await req.json();
    const project = payload.record;

    if (!project) {
      return new Response(JSON.stringify({ error: "No project data" }), { status: 400 });
    }

    // Create a service-role Supabase client to read subscribers
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all subscriber emails
    const { data: subscribers, error } = await supabase
      .from("subscribers")
      .select("email");

    if (error) throw error;
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers to notify" }), { status: 200 });
    }

    const emails = subscribers.map((s: { email: string }) => s.email);

    // Build the HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Project on ProjectDukaan</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                🎉 New Project Just Dropped!
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">
                A brand new project is now live on ProjectDukaan
              </p>
            </td>
          </tr>

          <!-- Project Info -->
          <tr>
            <td style="padding:36px 40px;">
              ${project.thumb ? `
              <div style="text-align:center;margin-bottom:24px;">
                <img src="${project.thumb}" alt="${project.title}" 
                  style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;" />
              </div>` : ""}

              <div style="background:#f8fafc;border-radius:12px;padding:24px;border-left:4px solid #2d6a9f;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">
                  ${project.category} · ${project.difficulty}
                </p>
                <h2 style="margin:8px 0 12px;font-size:22px;color:#1e293b;font-weight:700;">
                  ${project.title}
                </h2>
                <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
                  ${project.short}
                </p>
              </div>

              <!-- Price + CTA -->
              <div style="text-align:center;margin-top:32px;">
                <p style="margin:0 0 16px;font-size:28px;font-weight:800;color:#1e3a5f;">
                  ₹${Number(project.price).toLocaleString("en-IN")}
                </p>
                <a href="${SITE_URL}/project/${project.id}" 
                  style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#2d6a9f);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                  View Project →
                </a>
              </div>

              <!-- Tech stack -->
              ${project.tech && project.tech.length > 0 ? `
              <div style="margin-top:28px;">
                <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Tech Stack</p>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  ${project.tech.map((t: string) => `
                  <span style="background:#eff6ff;color:#1e40af;font-size:12px;font-weight:500;padding:4px 10px;border-radius:20px;">
                    ${t}
                  </span>`).join("")}
                </div>
              </div>` : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                You're receiving this because you subscribed to ProjectDukaan updates.<br/>
                <a href="${SITE_URL}" style="color:#2d6a9f;text-decoration:none;">Visit Website</a>
                &nbsp;·&nbsp;
                You can ignore future emails by not subscribing again.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send emails in batch via Resend
    // Resend supports "to" array for batch sending
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ProjectDukaan <onboarding@resend.dev>",
        to: emails,
        subject: `🎉 New Project: ${project.title} — ProjectDukaan`,
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(JSON.stringify({ error: resendData }), { status: 500 });
    }

    console.log(`✅ Notified ${emails.length} subscribers about: ${project.title}`);

    return new Response(
      JSON.stringify({ success: true, notified: emails.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
