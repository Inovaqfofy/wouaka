import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

// ============================================
// CONFIGURATION
// ============================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// BRAND COLORS - PALETTE FINTECH WOUAKA
// ============================================

const EMAIL_COLORS = {
  primary: '#064e3b',      // Vert Émeraude
  secondary: '#1e293b',    // Bleu Ardoise
  accent: '#10b981',       // Vert Accent
  gold: '#F5A623',         // Or de confiance
  background: '#f8fafc',   // Gris très clair
  white: '#FFFFFF',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  danger: '#dc2626',
  success: '#059669',
  lightGreen: '#ecfdf5',
  lightBlue: '#f0f9ff',
};

const EMAIL_STYLES = {
  fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  borderRadius: '12px',
  buttonRadius: '8px',
};

// Logo Wouaka hébergé dans Supabase Storage (bucket public)
const WOUAKA_LOGO_URL = 'https://xfpjpzxnekmxynbzbtwx.supabase.co/storage/v1/object/public/email-assets/logo-wouaka.png?v=1';

const PRODUCTION_DOMAIN = 'https://www.wouaka-creditscore.com';

const COMPANY_INFO = {
  legalName: 'Inopay Group SARL',
  rccm: 'CI-ABJ-03-2023-B13-03481',
  address: '27 BP 148 Abidjan 27, Côte d\'Ivoire',
  phone: '+225 07 01 23 89 74',
  supportEmail: 'support@wouaka-creditscore.com',
};

const SOCIAL_URLS = {
  facebook: 'https://facebook.com/wouaka',
  linkedin: 'https://linkedin.com/company/wouaka',
  twitter: 'https://x.com/wouaka',
};

// ============================================
// LOGGING HELPER
// ============================================

async function logToDatabase(
  level: 'info' | 'warn' | 'error' | 'debug',
  action: string,
  message: string,
  metadata: Record<string, unknown> = {},
  userId?: string
): Promise<void> {
  try {
    await supabase.from('logs').insert({
      level,
      source: 'send-automated-email',
      action,
      message,
      metadata,
      user_id: userId || null,
    });
    console.log(`[LOG:${level.toUpperCase()}] ${action}: ${message}`);
  } catch (err) {
    console.error('Failed to log to database:', err);
  }
}

// ============================================
// HARDCODED HTML TEMPLATE COMPONENTS
// ============================================

function getEmailHeader(): string {
  return `
    <tr>
      <td style="padding: 40px 32px 32px 32px; text-align: center; background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, #065f46 100%);">
        <a href="${PRODUCTION_DOMAIN}" style="text-decoration: none; display: inline-block;">
          <img src="${WOUAKA_LOGO_URL}" alt="WOUAKA" width="80" height="80" style="display: block; margin: 0 auto 16px auto; border-radius: 16px;" />
          <div style="font-size: 32px; font-weight: 800; color: ${EMAIL_COLORS.white}; letter-spacing: -1px; font-family: ${EMAIL_STYLES.fontFamily};">
            WOUAKA
          </div>
        </a>
        <p style="margin: 12px 0 0 0; color: ${EMAIL_COLORS.gold}; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; font-family: ${EMAIL_STYLES.fontFamily};">
          CERTIFICATION DE SOLVABILITÉ SOUVERAINE
        </p>
      </td>
    </tr>
  `;
}

function getEmailFooter(): string {
  return `
    <tr>
      <td style="padding: 40px 32px; background-color: ${EMAIL_COLORS.secondary}; text-align: center;">
        <div style="font-size: 24px; font-weight: 800; color: ${EMAIL_COLORS.white}; margin-bottom: 16px; font-family: ${EMAIL_STYLES.fontFamily};">WOUAKA</div>
        <div style="margin-bottom: 24px;">
          <a href="${SOCIAL_URLS.linkedin}" style="display: inline-block; margin: 0 10px; color: ${EMAIL_COLORS.white}; text-decoration: none;">LinkedIn</a>
          <a href="${SOCIAL_URLS.facebook}" style="display: inline-block; margin: 0 10px; color: ${EMAIL_COLORS.white}; text-decoration: none;">Facebook</a>
          <a href="${SOCIAL_URLS.twitter}" style="display: inline-block; margin: 0 10px; color: ${EMAIL_COLORS.white}; text-decoration: none;">X</a>
        </div>
        <p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.gold}; font-size: 14px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">${COMPANY_INFO.legalName}</p>
        <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.8); font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">${COMPANY_INFO.address}</p>
        <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.6); font-size: 12px; font-family: ${EMAIL_STYLES.fontFamily};">RCCM: ${COMPANY_INFO.rccm} | Tél: ${COMPANY_INFO.phone}</p>
        <div style="margin-bottom: 20px; padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1);">
          <a href="${PRODUCTION_DOMAIN}/privacy" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 12px; margin: 0 16px;">Confidentialité</a>
          <a href="${PRODUCTION_DOMAIN}/terms" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 12px; margin: 0 16px;">Conditions</a>
          <a href="${PRODUCTION_DOMAIN}/legal" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 12px; margin: 0 16px;">Mentions Légales</a>
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.gold}; font-size: 11px; font-weight: 600; letter-spacing: 1px;">✓ PLATEFORME CERTIFIÉE BCEAO/UEMOA</p>
        </div>
        <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.7); font-size: 12px;">Questions ? <a href="mailto:${COMPANY_INFO.supportEmail}" style="color: ${EMAIL_COLORS.gold};">${COMPANY_INFO.supportEmail}</a></p>
        <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.4); font-size: 11px;">© ${new Date().getFullYear()} WOUAKA. Tous droits réservés.</p>
      </td>
    </tr>
  `;
}

function wrapEmailTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WOUAKA</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.background}; font-family: ${EMAIL_STYLES.fontFamily}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${EMAIL_COLORS.background};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: ${EMAIL_COLORS.white}; border-radius: ${EMAIL_STYLES.borderRadius}; box-shadow: 0 8px 32px rgba(6, 78, 59, 0.12); overflow: hidden;">
          ${getEmailHeader()}
          ${content}
          ${getEmailFooter()}
        </table>
        <p style="margin: 24px 0 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-align: center;">
          Envoyé depuis <a href="${PRODUCTION_DOMAIN}" style="color: ${EMAIL_COLORS.primary};">www.wouaka-creditscore.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getCtaButton(text: string, url: string, variant: string = 'primary'): string {
  const colors: Record<string, { bg: string; text: string }> = {
    primary: { bg: EMAIL_COLORS.primary, text: EMAIL_COLORS.white },
    secondary: { bg: EMAIL_COLORS.gold, text: EMAIL_COLORS.secondary },
    success: { bg: EMAIL_COLORS.success, text: EMAIL_COLORS.white },
    danger: { bg: EMAIL_COLORS.danger, text: EMAIL_COLORS.white },
  };
  const { bg, text: textColor } = colors[variant] || colors.primary;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td style="background: ${bg}; border-radius: ${EMAIL_STYLES.buttonRadius}; text-align: center; box-shadow: 0 4px 12px ${bg}40;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 18px 48px; color: ${textColor}; text-decoration: none; font-weight: 600; font-size: 16px; font-family: ${EMAIL_STYLES.fontFamily};">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function getInfoBox(content: string, variant: string = 'info'): string {
  const styles: Record<string, { bg: string; border: string; icon: string }> = {
    info: { bg: EMAIL_COLORS.lightBlue, border: EMAIL_COLORS.primary, icon: '💡' },
    success: { bg: EMAIL_COLORS.lightGreen, border: EMAIL_COLORS.success, icon: '✓' },
    warning: { bg: '#fffbeb', border: EMAIL_COLORS.gold, icon: '⚠️' },
    danger: { bg: '#fef2f2', border: EMAIL_COLORS.danger, icon: '🚨' },
  };
  const { bg, border, icon } = styles[variant] || styles.info;
  return `
    <div style="background: ${bg}; border-left: 4px solid ${border}; padding: 20px 24px; margin: 24px 0; border-radius: 0 12px 12px 0;">
      <p style="margin: 0; color: ${EMAIL_COLORS.text}; font-size: 14px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
        <span style="font-size: 16px; margin-right: 8px;">${icon}</span>${content}
      </p>
    </div>
  `;
}

// ============================================
// SCORE GAUGE COMPONENT (Visual)
// ============================================

function getScoreGauge(score: number): string {
  // Determine which segment is active (1-5)
  const segment = Math.min(5, Math.max(1, Math.ceil(score / 200)));
  
  const segmentColors = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#064e3b'];
  
  return `
    <div style="text-align: center; margin: 32px 0;">
      <!-- Score Display -->
      <div style="font-size: 72px; font-weight: 800; color: ${EMAIL_COLORS.primary}; line-height: 1; margin-bottom: 8px; font-family: ${EMAIL_STYLES.fontFamily};">
        ${score}
      </div>
      <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">sur 1000 points</p>
      
      <!-- Visual Gauge -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="width: 50px; height: 14px; background: ${segmentColors[0]}; border-radius: 7px 0 0 7px; opacity: ${segment >= 1 ? '1' : '0.3'};"></td>
          <td style="width: 50px; height: 14px; background: ${segmentColors[1]}; opacity: ${segment >= 2 ? '1' : '0.3'};"></td>
          <td style="width: 50px; height: 14px; background: ${segmentColors[2]}; opacity: ${segment >= 3 ? '1' : '0.3'};"></td>
          <td style="width: 50px; height: 14px; background: ${segmentColors[3]}; opacity: ${segment >= 4 ? '1' : '0.3'};"></td>
          <td style="width: 50px; height: 14px; background: ${segmentColors[4]}; border-radius: 0 7px 7px 0; opacity: ${segment >= 5 ? '1' : '0.3'};"></td>
        </tr>
      </table>
      
      <!-- Legend -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 12px auto 0 auto;">
        <tr>
          <td style="padding: 0 8px; font-size: 10px; color: ${EMAIL_COLORS.textMuted};">Faible</td>
          <td style="padding: 0 8px; font-size: 10px; color: ${EMAIL_COLORS.textMuted};">Moyen</td>
          <td style="padding: 0 8px; font-size: 10px; color: ${EMAIL_COLORS.textMuted};">Bon</td>
          <td style="padding: 0 8px; font-size: 10px; color: ${EMAIL_COLORS.textMuted};">Très bon</td>
          <td style="padding: 0 8px; font-size: 10px; color: ${EMAIL_COLORS.textMuted};">Excellent</td>
        </tr>
      </table>
    </div>
  `;
}

// ============================================
// EMAIL TEMPLATE GENERATORS (HARDCODED)
// ============================================

function generateWelcomeEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || data.full_name || 'Cher utilisateur');
  const email = String(data.email || '');
  const firstName = fullName.split(' ')[0];
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 88px; height: 88px; background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, ${EMAIL_COLORS.accent} 100%); border-radius: 50%; line-height: 88px; font-size: 44px; box-shadow: 0 8px 24px ${EMAIL_COLORS.primary}40;">
            🎉
          </div>
        </div>
        
        <h1 style="margin: 0 0 12px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 28px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Bienvenue dans l'écosystème WOUAKA !
        </h1>
        <p style="margin: 0 0 32px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 16px; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre identité financière souveraine commence maintenant
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Félicitations pour votre inscription sur <strong>WOUAKA</strong> ! Vous venez de rejoindre la première plateforme de <strong style="color: ${EMAIL_COLORS.primary};">certification de solvabilité souveraine</strong> conçue pour l'Afrique de l'Ouest.
        </p>
        
        <div style="background: ${EMAIL_COLORS.lightGreen}; border-radius: 12px; padding: 28px; margin: 32px 0;">
          <h3 style="margin: 0 0 20px 0; color: ${EMAIL_COLORS.primary}; font-size: 16px; font-weight: 700;">
            📋 Les 3 étapes pour débloquer votre potentiel :
          </h3>
          
          <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid ${EMAIL_COLORS.border};">
            <table role="presentation"><tr>
              <td width="44" style="vertical-align: top;">
                <div style="width: 36px; height: 36px; background: ${EMAIL_COLORS.primary}; border-radius: 50%; text-align: center; line-height: 36px; color: white; font-weight: 700; font-size: 14px;">1</div>
              </td>
              <td style="padding-left: 12px;">
                <p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 14px;">Vérifiez votre Identité</p>
                <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Certification CNI/Passeport par notre IA</p>
              </td>
            </tr></table>
          </div>
          
          <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid ${EMAIL_COLORS.border};">
            <table role="presentation"><tr>
              <td width="44" style="vertical-align: top;">
                <div style="width: 36px; height: 36px; background: ${EMAIL_COLORS.primary}; border-radius: 50%; text-align: center; line-height: 36px; color: white; font-weight: 700; font-size: 14px;">2</div>
              </td>
              <td style="padding-left: 12px;">
                <p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 14px;">Validez votre Mobile</p>
                <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Preuves USSD et historique mobile money</p>
              </td>
            </tr></table>
          </div>
          
          <div>
            <table role="presentation"><tr>
              <td width="44" style="vertical-align: top;">
                <div style="width: 36px; height: 36px; background: ${EMAIL_COLORS.gold}; border-radius: 50%; text-align: center; line-height: 36px; color: ${EMAIL_COLORS.secondary}; font-weight: 700; font-size: 14px;">3</div>
              </td>
              <td style="padding-left: 12px;">
                <p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 14px;">Obtenez votre W-SCORE</p>
                <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Votre score de solvabilité certifié</p>
              </td>
            </tr></table>
          </div>
        </div>
        
        ${getInfoBox('<strong>Vos données vous appartiennent.</strong> Contrairement aux bureaux de crédit traditionnels, vous gardez le contrôle total de vos informations.', 'info')}
        
        ${getCtaButton('Commencer ma Certification', `${PRODUCTION_DOMAIN}/dashboard/borrower`, 'primary')}
        
        <p style="margin: 28px 0 0 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">
          Compte créé avec : <strong style="color: ${EMAIL_COLORS.primary};">${email}</strong>
        </p>
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

function generateConfirmationEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || data.full_name || 'Cher utilisateur');
  const confirmationUrl = String(data.confirmation_url || data.confirmationUrl || `${PRODUCTION_DOMAIN}/auth`);
  const token = String(data.token || '');
  const firstName = fullName.split(' ')[0];
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 88px; height: 88px; background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, ${EMAIL_COLORS.accent} 100%); border-radius: 50%; line-height: 88px; font-size: 44px; box-shadow: 0 8px 24px ${EMAIL_COLORS.primary}40;">
            ✉️
          </div>
        </div>
        
        <h1 style="margin: 0 0 12px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 28px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Confirmez votre email
        </h1>
        <p style="margin: 0 0 32px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 16px; font-family: ${EMAIL_STYLES.fontFamily};">
          Une dernière étape pour activer votre compte WOUAKA
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Merci de votre inscription ! Pour activer votre compte et accéder à la plateforme de certification de solvabilité, veuillez confirmer votre adresse email.
        </p>
        
        ${getCtaButton('Confirmer mon email', confirmationUrl, 'primary')}
        
        ${token ? `
        <div style="background: ${EMAIL_COLORS.lightGreen}; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 12px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
            Ou utilisez ce code
          </p>
          <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: ${EMAIL_COLORS.primary}; font-family: 'Courier New', monospace;">
            ${token}
          </p>
        </div>
        ` : ''}
        
        ${getInfoBox('<strong>Ce lien expire dans 24 heures.</strong> Si vous n\'avez pas créé de compte sur WOUAKA, ignorez cet email.', 'warning')}
        
        <div style="background: ${EMAIL_COLORS.lightGreen}; border-radius: 12px; padding: 20px; margin-top: 24px; text-align: center;">
          <p style="margin: 0; color: ${EMAIL_COLORS.primary}; font-size: 12px; font-weight: 600;">
            🔒 Plateforme sécurisée conforme BCEAO/UEMOA
          </p>
        </div>
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

function generateOtpEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || data.full_name || 'Cher utilisateur');
  const otpCode = String(data.otpCode || data.otp_code || data.token || '000000');
  const expiresIn = Number(data.expiresIn || data.expires_in || 10);
  const firstName = fullName.split(' ')[0];
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px; text-align: center;">
        <div style="margin-bottom: 28px;">
          <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, ${EMAIL_COLORS.accent} 100%); border-radius: 50%; line-height: 80px; font-size: 36px; box-shadow: 0 8px 24px ${EMAIL_COLORS.primary}30;">
            🔐
          </div>
        </div>
        
        <h1 style="margin: 0 0 12px 0; color: ${EMAIL_COLORS.primary}; font-size: 26px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre Code de Sécurité
        </h1>
        <p style="margin: 0 0 36px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 15px; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour ${firstName}, utilisez ce code pour vous authentifier
        </p>
        
        <div style="background: ${EMAIL_COLORS.lightGreen}; border: 3px dashed ${EMAIL_COLORS.primary}; border-radius: 16px; padding: 32px; margin: 0 auto; max-width: 320px;">
          <p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
            Code de vérification
          </p>
          <p style="margin: 0; font-size: 48px; font-weight: 800; letter-spacing: 12px; color: ${EMAIL_COLORS.primary}; font-family: 'Courier New', monospace;">
            ${otpCode}
          </p>
        </div>
        
        <div style="margin: 28px auto; padding: 14px 24px; background: #fef2f2; border-radius: 12px; display: inline-block;">
          <p style="margin: 0; color: ${EMAIL_COLORS.danger}; font-size: 14px; font-weight: 600;">
            ⏱️ Ce code expire dans <strong>${expiresIn} minutes</strong>
          </p>
        </div>
        
        <p style="margin: 28px 0 0 0; color: ${EMAIL_COLORS.text}; font-size: 14px; line-height: 1.7;">
          Si vous n'avez pas demandé ce code, ignorez cet email en toute sécurité.
        </p>
        
        ${getInfoBox('<strong>Ne partagez jamais ce code.</strong> L\'équipe WOUAKA ne vous demandera jamais votre code OTP.', 'warning')}
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

function generatePasswordRecoveryEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || data.full_name || 'Cher utilisateur');
  const recoveryUrl = String(data.recovery_url || data.recoveryUrl || `${PRODUCTION_DOMAIN}/reset-password`);
  const token = String(data.token || '');
  const firstName = fullName.split(' ')[0];
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 88px; height: 88px; background: linear-gradient(135deg, ${EMAIL_COLORS.gold} 0%, #f8c75a 100%); border-radius: 50%; line-height: 88px; font-size: 44px; box-shadow: 0 8px 24px ${EMAIL_COLORS.gold}40;">
            🔑
          </div>
        </div>
        
        <h1 style="margin: 0 0 12px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 28px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Réinitialisation du mot de passe
        </h1>
        <p style="margin: 0 0 32px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 16px; font-family: ${EMAIL_STYLES.fontFamily};">
          Vous avez demandé à réinitialiser votre mot de passe
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte WOUAKA. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
        </p>
        
        ${getCtaButton('Réinitialiser mon mot de passe', recoveryUrl, 'secondary')}
        
        ${token ? `
        <div style="background: ${EMAIL_COLORS.lightBlue}; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 12px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
            Code de réinitialisation
          </p>
          <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: ${EMAIL_COLORS.primary}; font-family: 'Courier New', monospace;">
            ${token}
          </p>
        </div>
        ` : ''}
        
        <div style="margin: 24px auto; padding: 14px 24px; background: #fef2f2; border-radius: 12px; text-align: center;">
          <p style="margin: 0; color: ${EMAIL_COLORS.danger}; font-size: 14px; font-weight: 600;">
            ⏱️ Ce lien expire dans <strong>1 heure</strong>
          </p>
        </div>
        
        ${getInfoBox('<strong>Vous n\'avez pas fait cette demande ?</strong> Ignorez cet email. Votre mot de passe restera inchangé.', 'warning')}
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

function generateKycSuccessEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || data.full_name || 'Cher utilisateur');
  const certificationLevel = String(data.certificationLevel || data.certification_level || 'Standard');
  const certificateId = String(data.certificateId || data.certificate_id || 'N/A');
  const validUntil = String(data.validUntil || data.valid_until || 'N/A');
  const firstName = fullName.split(' ')[0];
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 96px; height: 96px; background: linear-gradient(135deg, ${EMAIL_COLORS.success} 0%, ${EMAIL_COLORS.accent} 100%); border-radius: 50%; line-height: 96px; font-size: 48px; box-shadow: 0 8px 32px ${EMAIL_COLORS.success}40;">
            ✓
          </div>
        </div>
        
        <h1 style="margin: 0 0 8px 0; text-align: center; color: ${EMAIL_COLORS.success}; font-size: 28px; font-weight: 800;">
          Identité Certifiée ✅
        </h1>
        <p style="margin: 0 0 36px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 17px; font-weight: 600;">
          Votre profil a été vérifié avec succès
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Excellente nouvelle ! Votre vérification d'identité (KYC) a été <strong style="color: ${EMAIL_COLORS.success};">validée avec succès</strong> par notre système d'intelligence artificielle certifié.
        </p>
        
        <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, #065f46 100%); border-radius: 16px; padding: 28px; margin: 28px 0; color: white; box-shadow: 0 8px 32px ${EMAIL_COLORS.primary}30;">
          <div style="border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 6px 0; font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px;">
              Niveau de Certification
            </p>
            <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.gold};">
              ${certificationLevel}
            </p>
          </div>
          <table role="presentation" width="100%">
            <tr>
              <td width="50%">
                <p style="margin: 0 0 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase;">N° Certificat</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600;">${certificateId}</p>
              </td>
              <td width="50%" style="text-align: right;">
                <p style="margin: 0 0 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Valide jusqu'au</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600;">${validUntil}</p>
              </td>
            </tr>
          </table>
        </div>
        
        ${getCtaButton('Voir mon Certificat', `${PRODUCTION_DOMAIN}/dashboard/borrower`, 'primary')}
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

function generateScoreAlertEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || data.full_name || 'Cher utilisateur');
  const scoreValue = Number(data.scoreValue || data.score_value || data.score || 0);
  const scoreTrend = String(data.scoreTrend || data.score_trend || 'stable');
  const lastUpdate = String(data.lastUpdate || data.last_update || new Date().toLocaleDateString('fr-FR'));
  const firstName = fullName.split(' ')[0];
  
  const trendIcons: Record<string, { icon: string; color: string; text: string }> = {
    up: { icon: '📈', color: EMAIL_COLORS.success, text: 'En hausse' },
    down: { icon: '📉', color: EMAIL_COLORS.danger, text: 'En baisse' },
    stable: { icon: '➡️', color: EMAIL_COLORS.gold, text: 'Stable' },
  };
  const trend = trendIcons[scoreTrend] || trendIcons.stable;
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, ${EMAIL_COLORS.gold} 0%, #f8c75a 100%); border-radius: 50%; line-height: 80px; font-size: 40px; box-shadow: 0 8px 24px ${EMAIL_COLORS.gold}40;">
            ${trend.icon}
          </div>
        </div>
        
        <h1 style="margin: 0 0 8px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 26px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre W-SCORE a été mis à jour
        </h1>
        <p style="margin: 0 0 32px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 15px; font-family: ${EMAIL_STYLES.fontFamily};">
          Dernière mise à jour : ${lastUpdate}
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre score de solvabilité WOUAKA vient d'être recalculé. Voici les détails de votre nouveau score :
        </p>
        
        ${getScoreGauge(scoreValue)}
        
        <div style="text-align: center; margin: 24px 0; padding: 16px; background: ${EMAIL_COLORS.lightGreen}; border-radius: 12px;">
          <p style="margin: 0; font-size: 14px; color: ${trend.color}; font-weight: 600;">
            ${trend.icon} Tendance : <strong>${trend.text}</strong>
          </p>
        </div>
        
        ${getCtaButton('Voir les détails de mon score', `${PRODUCTION_DOMAIN}/dashboard/borrower/score`, 'primary')}
        
        ${getInfoBox('Votre score peut varier en fonction de vos activités financières. Continuez à enrichir votre profil pour l\'améliorer.', 'info')}
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

function generateLoanNotificationEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || data.full_name || 'Cher utilisateur');
  const amount = Number(data.amount || data.loan_amount || 0);
  const duration = Number(data.duration || data.loan_duration || 12);
  const monthlyPayment = Number(data.monthlyPayment || data.monthly_payment || 0);
  const interestRate = Number(data.interestRate || data.interest_rate || 0);
  const status = String(data.status || 'pending');
  const loanId = String(data.loanId || data.loan_id || 'N/A');
  const firstName = fullName.split(' ')[0];
  
  const statusConfig: Record<string, { icon: string; color: string; text: string; bg: string }> = {
    pending: { icon: '⏳', color: EMAIL_COLORS.gold, text: 'En cours d\'examen', bg: '#fffbeb' },
    approved: { icon: '✅', color: EMAIL_COLORS.success, text: 'Approuvée', bg: EMAIL_COLORS.lightGreen },
    rejected: { icon: '❌', color: EMAIL_COLORS.danger, text: 'Refusée', bg: '#fef2f2' },
    disbursed: { icon: '💰', color: EMAIL_COLORS.primary, text: 'Déboursée', bg: EMAIL_COLORS.lightBlue },
  };
  const statusInfo = statusConfig[status] || statusConfig.pending;
  
  const formatAmount = (val: number) => val.toLocaleString('fr-FR') + ' FCFA';
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 80px; height: 80px; background: ${statusInfo.bg}; border-radius: 50%; line-height: 80px; font-size: 40px; box-shadow: 0 8px 24px ${statusInfo.color}20;">
            ${statusInfo.icon}
          </div>
        </div>
        
        <h1 style="margin: 0 0 8px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 26px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Notification de Prêt
        </h1>
        <p style="margin: 0 0 32px 0; text-align: center; padding: 8px 16px; background: ${statusInfo.bg}; color: ${statusInfo.color}; font-size: 14px; font-weight: 600; border-radius: 20px; display: inline-block;">
          ${statusInfo.icon} ${statusInfo.text}
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Voici le récapitulatif de votre demande de prêt :
        </p>
        
        <!-- Loan Summary Card -->
        <div style="background: #f1f5f9; border-radius: 16px; padding: 0; margin: 28px 0; overflow: hidden; border: 1px solid ${EMAIL_COLORS.border};">
          <!-- Header -->
          <div style="background: ${EMAIL_COLORS.secondary}; padding: 16px 24px;">
            <p style="margin: 0; color: white; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
              Référence : ${loanId}
            </p>
          </div>
          
          <!-- Details -->
          <div style="padding: 24px;">
            <table role="presentation" width="100%" style="border-collapse: collapse;">
              <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
                  <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">Montant demandé</span>
                </td>
                <td style="padding: 16px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;">
                  <strong style="color: ${EMAIL_COLORS.primary}; font-size: 18px;">${formatAmount(amount)}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
                  <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">Durée</span>
                </td>
                <td style="padding: 16px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;">
                  <strong style="color: ${EMAIL_COLORS.text}; font-size: 16px;">${duration} mois</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
                  <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">Mensualité estimée</span>
                </td>
                <td style="padding: 16px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;">
                  <strong style="color: ${EMAIL_COLORS.success}; font-size: 16px;">${formatAmount(monthlyPayment)}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 0;">
                  <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">Taux appliqué</span>
                </td>
                <td style="padding: 16px 0; text-align: right;">
                  <strong style="color: ${EMAIL_COLORS.text}; font-size: 16px;">${interestRate}% / an</strong>
                </td>
              </tr>
            </table>
          </div>
        </div>
        
        ${getCtaButton('Voir ma demande', `${PRODUCTION_DOMAIN}/dashboard/borrower/applications`, 'primary')}
        
        ${getInfoBox('Notre équipe analyse votre demande. Vous recevrez une notification dès qu\'une décision sera prise.', 'info')}
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

function generateSecurityAlertEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || data.full_name || 'Cher utilisateur');
  const alertType = String(data.alertType || data.alert_type || 'security');
  const description = String(data.description || 'Une activité inhabituelle a été détectée sur votre compte.');
  const ipAddress = String(data.ipAddress || data.ip_address || 'Inconnu');
  const location = String(data.location || 'Inconnu');
  const device = String(data.device || 'Inconnu');
  const timestamp = String(data.timestamp || new Date().toLocaleString('fr-FR'));
  const firstName = fullName.split(' ')[0];
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, ${EMAIL_COLORS.danger} 0%, #ef4444 100%); border-radius: 50%; line-height: 80px; font-size: 40px; box-shadow: 0 8px 24px ${EMAIL_COLORS.danger}40;">
            🚨
          </div>
        </div>
        
        <h1 style="margin: 0 0 8px 0; text-align: center; color: ${EMAIL_COLORS.danger}; font-size: 26px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Alerte de Sécurité
        </h1>
        <p style="margin: 0 0 32px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 15px; font-family: ${EMAIL_STYLES.fontFamily};">
          Activité inhabituelle détectée
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          ${description}
        </p>
        
        <!-- Alert Details -->
        <div style="background: #fef2f2; border: 1px solid ${EMAIL_COLORS.danger}; border-radius: 16px; padding: 24px; margin: 28px 0;">
          <h3 style="margin: 0 0 16px 0; color: ${EMAIL_COLORS.danger}; font-size: 14px; font-weight: 700;">
            📍 Détails de l'activité :
          </h3>
          <table role="presentation" width="100%">
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Type :</td>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600;">${alertType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Date/Heure :</td>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Adresse IP :</td>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600;">${ipAddress}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Localisation :</td>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600;">${location}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Appareil :</td>
              <td style="padding: 8px 0; color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600;">${device}</td>
            </tr>
          </table>
        </div>
        
        ${getCtaButton('Sécuriser mon compte', `${PRODUCTION_DOMAIN}/profile`, 'danger')}
        
        ${getInfoBox('<strong>Ce n\'était pas vous ?</strong> Changez immédiatement votre mot de passe et contactez notre support.', 'danger')}
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

// ============================================
// SUBSCRIPTION ACTIVATED EMAIL
// ============================================

function generateSubscriptionActivatedEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || data.full_name || 'Cher utilisateur');
  const planName = String(data.planName || data.plan_name || 'Premium');
  const validUntil = String(data.validUntil || data.valid_until || 'N/A');
  const paymentMethod = String(data.paymentMethod || data.payment_method || 'Paiement');
  const firstName = fullName.split(' ')[0];
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 88px; height: 88px; background: linear-gradient(135deg, ${EMAIL_COLORS.success} 0%, ${EMAIL_COLORS.primary} 100%); border-radius: 50%; line-height: 88px; font-size: 44px; box-shadow: 0 8px 24px ${EMAIL_COLORS.success}40;">
            🎊
          </div>
        </div>
        
        <h1 style="margin: 0 0 12px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 28px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Forfait Activé !
        </h1>
        <p style="margin: 0 0 32px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 16px; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre abonnement est maintenant actif
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre forfait <strong style="color: ${EMAIL_COLORS.primary};">${planName}</strong> a été activé avec succès. Vous pouvez maintenant profiter de tous les avantages de votre abonnement.
        </p>
        
        <!-- Subscription Details -->
        <div style="background: ${EMAIL_COLORS.lightGreen}; border-radius: 16px; padding: 28px; margin: 28px 0; border: 1px solid ${EMAIL_COLORS.success};">
          <h3 style="margin: 0 0 20px 0; color: ${EMAIL_COLORS.primary}; font-size: 16px; font-weight: 700; text-align: center;">
            📋 Détails de votre abonnement
          </h3>
          <table role="presentation" width="100%">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
                <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">Forfait</span>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;">
                <strong style="color: ${EMAIL_COLORS.primary}; font-size: 16px;">${planName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
                <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">Valide jusqu'au</span>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;">
                <strong style="color: ${EMAIL_COLORS.text}; font-size: 16px;">${validUntil}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">Mode de paiement</span>
              </td>
              <td style="padding: 12px 0; text-align: right;">
                <strong style="color: ${EMAIL_COLORS.text}; font-size: 16px;">${paymentMethod}</strong>
              </td>
            </tr>
          </table>
        </div>
        
        ${getCtaButton('Accéder à mon espace', `${PRODUCTION_DOMAIN}/dashboard/borrower`, 'success')}
        
        ${getInfoBox('Vous pouvez maintenant générer votre W-SCORE, obtenir votre certificat de solvabilité et le partager avec les partenaires de votre choix.', 'success')}
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

// ============================================
// TEMPLATE ROUTER
// ============================================

type TemplateType = 
  | 'welcome' 
  | 'confirmation' 
  | 'otp' 
  | 'password_recovery' 
  | 'kyc_success' 
  | 'score_alert' 
  | 'loan_notification'
  | 'security_alert'
  | 'subscription_activated';

function getEmailSubject(template: TemplateType, data: Record<string, unknown> = {}): string {
  const subjects: Record<TemplateType, string> = {
    welcome: '🎉 Bienvenue sur WOUAKA - Votre identité financière souveraine',
    confirmation: '✉️ Confirmez votre email WOUAKA',
    otp: '🔐 Votre code de vérification WOUAKA',
    password_recovery: '🔑 Réinitialisation de votre mot de passe WOUAKA',
    kyc_success: '✅ Félicitations ! Votre identité est certifiée',
    score_alert: `📊 Mise à jour de votre W-SCORE : ${data.score || ''}`,
    loan_notification: '💰 Notification de votre demande de prêt',
    security_alert: '🚨 Alerte de sécurité sur votre compte WOUAKA',
    subscription_activated: `🎊 Votre forfait ${data.planName || 'Premium'} est activé !`,
  };
  return subjects[template] || 'Notification WOUAKA';
}

function generateEmailHtml(template: TemplateType, data: Record<string, unknown>): string {
  const generators: Record<TemplateType, (data: Record<string, unknown>) => string> = {
    welcome: generateWelcomeEmail,
    confirmation: generateConfirmationEmail,
    otp: generateOtpEmail,
    password_recovery: generatePasswordRecoveryEmail,
    kyc_success: generateKycSuccessEmail,
    score_alert: generateScoreAlertEmail,
    loan_notification: generateLoanNotificationEmail,
    security_alert: generateSecurityAlertEmail,
    subscription_activated: generateSubscriptionActivatedEmail,
  };
  
  const generator = generators[template];
  if (!generator) {
    throw new Error(`Unknown email template: ${template}`);
  }
  
  return generator(data);
}

// ============================================
// MAIN HANDLER
// ============================================

interface EmailRequest {
  template: TemplateType;
  to: string;
  data: Record<string, unknown>;
  // Pour les appels depuis un trigger SQL
  trigger_source?: string;
  user_id?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let requestData: EmailRequest | null = null;

  try {
    requestData = await req.json() as EmailRequest;
    
    const { template, to, data, trigger_source, user_id } = requestData;
    
    // Log the incoming request
    await logToDatabase(
      'info',
      'email_request_received',
      `Email request received for template: ${template}`,
      {
        template,
        to_email_hash: to ? to.substring(0, 3) + '***' : 'N/A',
        trigger_source: trigger_source || 'http',
        has_data: !!data,
      },
      user_id
    );

    // Validate required fields
    if (!template || !to) {
      await logToDatabase(
        'error',
        'email_validation_failed',
        'Missing required fields: template or to',
        { template, has_to: !!to }
      );
      
      return new Response(
        JSON.stringify({ error: 'Missing required fields: template, to' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate email content
    const html = generateEmailHtml(template, data || {});
    const subject = getEmailSubject(template, data || {});

    // Send via Resend
    const emailResponse = await resend.emails.send({
      from: 'WOUAKA <notifications@wouaka-creditscore.com>',
      to: [to],
      subject,
      html,
    });

    const duration = Date.now() - startTime;

    // Log success
    await logToDatabase(
      'info',
      'email_sent_success',
      `Email sent successfully via Resend`,
      {
        template,
        resend_id: emailResponse.data?.id || 'unknown',
        trigger_source: trigger_source || 'http',
        duration_ms: duration,
      },
      user_id
    );

    console.log(`[SUCCESS] Email ${template} sent to ${to} in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        resend_id: emailResponse.data?.id,
        template,
        duration_ms: duration,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error
    await logToDatabase(
      'error',
      'email_send_failed',
      `Failed to send email: ${errorMessage}`,
      {
        template: requestData?.template || 'unknown',
        trigger_source: requestData?.trigger_source || 'http',
        error: errorMessage,
        duration_ms: duration,
      },
      requestData?.user_id
    );

    console.error(`[ERROR] Email send failed:`, error);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        duration_ms: duration,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
