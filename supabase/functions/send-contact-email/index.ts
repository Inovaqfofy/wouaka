import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

const subjectLabels: Record<string, string> = {
  demo: "Demande de démo",
  pricing: "Questions sur les tarifs",
  technical: "Support technique",
  partnership: "Partenariat",
  other: "Autre demande",
};

async function sendEmail(to: string[], subject: string, html: string, replyTo?: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Wouaka <contact@wouaka-creditscore.com>",
      to,
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Contact email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, subject, message }: ContactEmailRequest = await req.json();

    console.log("Received contact form submission:", { name, email, company, subject });

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.error("Missing required fields");
      return new Response(JSON.stringify({ error: "Tous les champs obligatoires doivent être remplis" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format");
      return new Response(JSON.stringify({ error: "Format d'email invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate input lengths
    if (name.length > 100 || email.length > 255 || (company && company.length > 100) || message.length > 5000) {
      console.error("Input too long");
      return new Response(
        JSON.stringify({ error: "Un ou plusieurs champs dépassent la longueur maximale autorisée" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const subjectLabel = subjectLabels[subject] || subject;

    // Escape HTML to prevent XSS
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompany = company ? escapeHtml(company) : null;
    const safeMessage = escapeHtml(message);

    // Send notification email to Wouaka team
    const notificationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #295b2d 0%, #1c3d5a 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
          .field { margin-bottom: 20px; }
          .field-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
          .field-value { font-size: 16px; color: #1c3d5a; }
          .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #e8b93a; margin-top: 20px; }
          .badge { display: inline-block; background: #e8b93a; color: #1c3d5a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Nouveau message de contact</h1>
            <span class="badge">${subjectLabel}</span>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Nom</div>
              <div class="field-value">${safeName}</div>
            </div>
            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
            </div>
            ${
              safeCompany
                ? `
            <div class="field">
              <div class="field-label">Entreprise</div>
              <div class="field-value">${safeCompany}</div>
            </div>
            `
                : ""
            }
            <div class="message-box">
              <div class="field-label">Message</div>
              <div class="field-value">${safeMessage.replace(/\n/g, "<br>")}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(["contact@wouaka-creditscore.com"], `[Wouaka Contact] ${subjectLabel} - ${safeName}`, notificationHtml, email);

    console.log("Notification email sent");

    // Send confirmation email to the user
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #295b2d 0%, #1c3d5a 100%); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
          .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .cta { display: inline-block; background: #e8b93a; color: #1c3d5a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Merci ${safeName} !</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Nous avons bien reçu votre message</p>
          </div>
          <div class="content">
            <p>Bonjour ${safeName},</p>
            <p>Nous accusons réception de votre message concernant : <strong>${subjectLabel}</strong>.</p>
            
            <div class="highlight">
              <p style="margin: 0;"><strong>Notre engagement :</strong></p>
              <p style="margin: 10px 0 0;">Notre équipe vous répondra dans un délai de <strong>24 heures ouvrées</strong>.</p>
            </div>
            
            <p>En attendant, n'hésitez pas à explorer nos ressources :</p>
            <ul>
              <li>Découvrez nos solutions pour votre secteur</li>
              <li>Consultez notre documentation API</li>
              <li>Explorez nos tarifs adaptés à vos besoins</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://www.wouaka-creditscore.com" class="cta">Visiter Wouaka</a>
            </div>
            
            <div class="footer">
              <p>L'équipe Wouaka</p>
              <p style="font-size: 12px; color: #999;">
                Inopay Group SARL — 27 BP 148 Abidjan 27, Côte d'Ivoire<br>
                +225 07 01 23 89 74 — contact@wouaka-creditscore.com
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail([email], "Nous avons bien reçu votre message - Wouaka", confirmationHtml);

    console.log("Confirmation email sent");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Emails envoyés avec succès",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(JSON.stringify({ error: error.message || "Erreur lors de l'envoi du message" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
