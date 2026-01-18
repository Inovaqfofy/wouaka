import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// BRAND COLORS - NOUVELLE CHARTE WOUAKA
// ============================================

const EMAIL_COLORS = {
  primary: '#1A2B4C',      // Bleu Marine Corporate
  secondary: '#F5A623',    // Or/Jaune de confiance
  accent: '#2d7a4f',       // Vert Succès
  background: '#f8fafc',
  white: '#FFFFFF',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  danger: '#dc2626',
  lightBlue: '#e8f4fd',
};

const EMAIL_STYLES = {
  fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  borderRadius: '12px',
  buttonRadius: '8px',
};

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
// TEMPLATE COMPONENTS
// ============================================

function getEmailHeader(): string {
  return `
    <tr>
      <td style="padding: 40px 32px 32px 32px; text-align: center; background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, #243a5e 100%);">
        <a href="${PRODUCTION_DOMAIN}" style="text-decoration: none; display: inline-block;">
          <img src="${PRODUCTION_DOMAIN}/logo.png" alt="WOUAKA" width="200" height="auto" style="max-width: 200px; height: auto; margin-bottom: 16px;" />
        </a>
        <p style="margin: 0; color: ${EMAIL_COLORS.secondary}; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; font-family: ${EMAIL_STYLES.fontFamily};">
          CERTIFICATION DE SOLVABILITÉ SOUVERAINE
        </p>
      </td>
    </tr>
  `;
}

function getEmailFooter(): string {
  return `
    <tr>
      <td style="padding: 40px 32px; background-color: ${EMAIL_COLORS.primary}; text-align: center;">
        <img src="${PRODUCTION_DOMAIN}/logo.png" alt="WOUAKA" width="120" height="auto" style="max-width: 120px; height: auto; margin-bottom: 20px; opacity: 0.9;" />
        <div style="margin-bottom: 24px;">
          <a href="${SOCIAL_URLS.linkedin}" style="display: inline-block; margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/32/174/174857.png" alt="LinkedIn" width="28" height="28" style="border-radius: 4px;"></a>
          <a href="${SOCIAL_URLS.facebook}" style="display: inline-block; margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/32/174/174848.png" alt="Facebook" width="28" height="28" style="border-radius: 4px;"></a>
          <a href="${SOCIAL_URLS.twitter}" style="display: inline-block; margin: 0 10px;"><img src="https://cdn-icons-png.flaticon.com/32/5968/5968830.png" alt="X/Twitter" width="28" height="28" style="border-radius: 4px;"></a>
        </div>
        <p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.secondary}; font-size: 14px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">${COMPANY_INFO.legalName}</p>
        <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.8); font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">${COMPANY_INFO.address}</p>
        <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.6); font-size: 12px; font-family: ${EMAIL_STYLES.fontFamily};">RCCM: ${COMPANY_INFO.rccm} | Tél: ${COMPANY_INFO.phone}</p>
        <div style="margin-bottom: 20px; padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1);">
          <a href="${PRODUCTION_DOMAIN}/privacy" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 12px; margin: 0 16px;">Confidentialité</a>
          <a href="${PRODUCTION_DOMAIN}/terms" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 12px; margin: 0 16px;">Conditions</a>
          <a href="${PRODUCTION_DOMAIN}/legal" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 12px; margin: 0 16px;">Mentions Légales</a>
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.secondary}; font-size: 11px; font-weight: 600; letter-spacing: 1px;">✓ PLATEFORME DE CERTIFICATION D'IDENTITÉ AGRÉÉE</p>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.6); font-size: 11px; line-height: 1.5;">Conforme aux directives BCEAO et à la réglementation UEMOA</p>
        </div>
        <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.7); font-size: 12px;">Questions ? <a href="mailto:${COMPANY_INFO.supportEmail}" style="color: ${EMAIL_COLORS.secondary};">${COMPANY_INFO.supportEmail}</a></p>
        <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.4); font-size: 11px;">© ${new Date().getFullYear()} WOUAKA. Tous droits réservés.</p>
      </td>
    </tr>
  `;
}

function wrapEmailTemplate(content: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>WOUAKA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>@media only screen and (max-width: 600px) { .email-container { width: 100% !important; } .mobile-padding { padding: 24px 20px !important; } }</style>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.background}; font-family: ${EMAIL_STYLES.fontFamily}; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${EMAIL_COLORS.background};">
        <tr><td align="center" style="padding: 32px 16px;">
          <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: ${EMAIL_COLORS.white}; border-radius: ${EMAIL_STYLES.borderRadius}; box-shadow: 0 8px 32px rgba(26, 43, 76, 0.12); overflow: hidden;">
            ${getEmailHeader()}${content}${getEmailFooter()}
          </table>
          <p style="margin: 24px 0 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; text-align: center;">Envoyé depuis <a href="${PRODUCTION_DOMAIN}" style="color: ${EMAIL_COLORS.primary};">www.wouaka-creditscore.com</a></p>
        </td></tr>
      </table>
    </body></html>`;
}

function getCtaButton(text: string, url: string, variant: string = 'secondary'): string {
  const colors: Record<string, { bg: string; text: string }> = {
    primary: { bg: EMAIL_COLORS.primary, text: EMAIL_COLORS.white },
    secondary: { bg: EMAIL_COLORS.secondary, text: EMAIL_COLORS.primary },
    success: { bg: EMAIL_COLORS.accent, text: EMAIL_COLORS.white },
    danger: { bg: EMAIL_COLORS.danger, text: EMAIL_COLORS.white },
  };
  const { bg, text: textColor } = colors[variant] || colors.secondary;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;"><tr>
    <td style="background: ${bg}; border-radius: ${EMAIL_STYLES.buttonRadius}; text-align: center; box-shadow: 0 4px 12px ${bg}40;">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 40px; color: ${textColor}; text-decoration: none; font-weight: 600; font-size: 15px; font-family: ${EMAIL_STYLES.fontFamily};">${text}</a>
    </td></tr></table>`;
}

function getInfoBox(content: string, variant: string = 'info'): string {
  const styles: Record<string, { bg: string; border: string; icon: string }> = {
    info: { bg: EMAIL_COLORS.lightBlue, border: EMAIL_COLORS.primary, icon: '💡' },
    success: { bg: '#f0fdf4', border: EMAIL_COLORS.accent, icon: '✓' },
    warning: { bg: '#fffbeb', border: EMAIL_COLORS.secondary, icon: '⚠️' },
    danger: { bg: '#fef2f2', border: EMAIL_COLORS.danger, icon: '🚨' },
  };
  const { bg, border, icon } = styles[variant] || styles.info;
  return `<div style="background: ${bg}; border-left: 4px solid ${border}; padding: 20px 24px; margin: 24px 0; border-radius: 0 12px 12px 0;">
    <p style="margin: 0; color: ${EMAIL_COLORS.text}; font-size: 14px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};"><span style="font-size: 16px; margin-right: 8px;">${icon}</span>${content}</p>
  </div>`;
}

// ============================================
// EMAIL GENERATORS
// ============================================

function generateWelcomeEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || 'Cher utilisateur');
  const email = String(data.email || '');
  const firstName = fullName.split(' ')[0];
  
  const content = `<tr><td class="mobile-padding" style="padding: 48px 40px;">
    <div style="text-align: center; margin-bottom: 32px;"><div style="display: inline-block; width: 88px; height: 88px; background: linear-gradient(135deg, ${EMAIL_COLORS.secondary} 0%, #f8c75a 100%); border-radius: 50%; line-height: 88px; font-size: 44px; box-shadow: 0 8px 24px ${EMAIL_COLORS.secondary}40;">🎉</div></div>
    <h1 style="margin: 0 0 12px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 28px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">Bienvenue dans l'écosystème WOUAKA !</h1>
    <p style="margin: 0 0 32px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 16px; font-family: ${EMAIL_STYLES.fontFamily};">Votre identité financière souveraine commence maintenant</p>
    <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,</p>
    <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">Félicitations pour votre inscription sur <strong>WOUAKA</strong> ! Vous venez de rejoindre la première plateforme de <strong style="color: ${EMAIL_COLORS.secondary};">certification de solvabilité souveraine</strong> conçue pour l'Afrique de l'Ouest.</p>
    <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.lightBlue} 0%, #f0f9ff 100%); border-radius: 12px; padding: 28px; margin: 32px 0;">
      <h3 style="margin: 0 0 20px 0; color: ${EMAIL_COLORS.primary}; font-size: 16px; font-weight: 700;">📋 Les 3 étapes pour débloquer votre potentiel :</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding: 12px 0; border-bottom: 1px solid rgba(26,43,76,0.1);"><table role="presentation"><tr><td width="44" style="vertical-align: top;"><div style="width: 36px; height: 36px; background: ${EMAIL_COLORS.primary}; border-radius: 50%; text-align: center; line-height: 36px; color: white; font-weight: 700; font-size: 14px;">1</div></td><td style="padding-left: 12px;"><p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 14px;">Vérifiez votre Identité</p><p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Certification CNI/Passeport par notre IA</p></td></tr></table></td></tr>
        <tr><td style="padding: 12px 0; border-bottom: 1px solid rgba(26,43,76,0.1);"><table role="presentation"><tr><td width="44" style="vertical-align: top;"><div style="width: 36px; height: 36px; background: ${EMAIL_COLORS.primary}; border-radius: 50%; text-align: center; line-height: 36px; color: white; font-weight: 700; font-size: 14px;">2</div></td><td style="padding-left: 12px;"><p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 14px;">Validez votre Mobile</p><p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Preuves USSD et historique mobile money</p></td></tr></table></td></tr>
        <tr><td style="padding: 12px 0;"><table role="presentation"><tr><td width="44" style="vertical-align: top;"><div style="width: 36px; height: 36px; background: ${EMAIL_COLORS.secondary}; border-radius: 50%; text-align: center; line-height: 36px; color: ${EMAIL_COLORS.primary}; font-weight: 700; font-size: 14px;">3</div></td><td style="padding-left: 12px;"><p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 14px;">Obtenez votre W-SCORE</p><p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Votre score de solvabilité certifié</p></td></tr></table></td></tr>
      </table>
    </div>
    ${getInfoBox('<strong>Vos données vous appartiennent.</strong> Contrairement aux bureaux de crédit traditionnels, vous gardez le contrôle total de vos informations.', 'info')}
    ${getCtaButton('Commencer ma Certification', `${PRODUCTION_DOMAIN}/dashboard/borrower`, 'secondary')}
    <p style="margin: 28px 0 0 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Compte créé avec : <strong style="color: ${EMAIL_COLORS.primary};">${email}</strong></p>
  </td></tr>`;
  return wrapEmailTemplate(content);
}

function generateOtpEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || 'Cher utilisateur');
  const otpCode = String(data.otpCode || '000000');
  const expiresIn = Number(data.expiresIn || 10);
  const firstName = fullName.split(' ')[0];
  
  const content = `<tr><td class="mobile-padding" style="padding: 48px 40px; text-align: center;">
    <div style="margin-bottom: 28px;"><div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, #243a5e 100%); border-radius: 50%; line-height: 80px; font-size: 36px; box-shadow: 0 8px 24px ${EMAIL_COLORS.primary}30;">🔐</div></div>
    <h1 style="margin: 0 0 12px 0; color: ${EMAIL_COLORS.primary}; font-size: 26px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">Votre Code de Sécurité</h1>
    <p style="margin: 0 0 36px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 15px; font-family: ${EMAIL_STYLES.fontFamily};">Bonjour ${firstName}, utilisez ce code pour vous authentifier</p>
    <div style="background: linear-gradient(135deg, #fef9e7 0%, #fdf4dc 100%); border: 3px dashed ${EMAIL_COLORS.secondary}; border-radius: 16px; padding: 32px; margin: 0 auto; max-width: 320px;">
      <p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Code de vérification</p>
      <p style="margin: 0; font-size: 48px; font-weight: 800; letter-spacing: 12px; color: ${EMAIL_COLORS.primary}; font-family: 'Courier New', monospace;">${otpCode}</p>
    </div>
    <div style="margin: 28px auto; padding: 14px 24px; background: #fef2f2; border-radius: 12px; display: inline-block;">
      <p style="margin: 0; color: ${EMAIL_COLORS.danger}; font-size: 14px; font-weight: 600;">⏱️ Ce code expire dans <strong>${expiresIn} minutes</strong></p>
    </div>
    <p style="margin: 28px 0 0 0; color: ${EMAIL_COLORS.text}; font-size: 14px; line-height: 1.7;">Si vous n'avez pas demandé ce code, ignorez cet email en toute sécurité.</p>
    ${getInfoBox('<strong>Ne partagez jamais ce code.</strong> L\'équipe WOUAKA ne vous demandera jamais votre code OTP par téléphone, SMS ou email.', 'warning')}
  </td></tr>`;
  return wrapEmailTemplate(content);
}

function generateKycSuccessEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || 'Cher utilisateur');
  const certificationLevel = String(data.certificationLevel || 'Standard');
  const certificateId = String(data.certificateId || 'N/A');
  const validUntil = String(data.validUntil || 'N/A');
  const firstName = fullName.split(' ')[0];
  
  const content = `<tr><td class="mobile-padding" style="padding: 48px 40px;">
    <div style="text-align: center; margin-bottom: 32px;"><div style="display: inline-block; width: 96px; height: 96px; background: linear-gradient(135deg, ${EMAIL_COLORS.accent} 0%, #34d399 100%); border-radius: 50%; line-height: 96px; font-size: 48px; box-shadow: 0 8px 32px ${EMAIL_COLORS.accent}40;">✓</div></div>
    <h1 style="margin: 0 0 8px 0; text-align: center; color: ${EMAIL_COLORS.accent}; font-size: 28px; font-weight: 800;">Identité Certifiée ✅</h1>
    <p style="margin: 0 0 36px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 17px; font-weight: 600;">Votre profil a été vérifié par notre IA</p>
    <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7;">Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,</p>
    <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7;">Excellente nouvelle ! Votre vérification d'identité (KYC) a été <strong style="color: ${EMAIL_COLORS.accent};">validée avec succès</strong> par notre système d'intelligence artificielle certifié.</p>
    <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, #243a5e 100%); border-radius: 16px; padding: 28px; margin: 28px 0; color: white; box-shadow: 0 8px 32px ${EMAIL_COLORS.primary}30;">
      <div style="border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 16px; margin-bottom: 16px;">
        <p style="margin: 0 0 6px 0; font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px;">Niveau de Certification</p>
        <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.secondary};">${certificationLevel}</p>
      </div>
      <table role="presentation" width="100%"><tr><td width="50%"><p style="margin: 0 0 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase;">N° Certificat</p><p style="margin: 0; font-size: 13px; font-weight: 600;">${certificateId}</p></td><td width="50%" style="text-align: right;"><p style="margin: 0 0 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Valide jusqu'au</p><p style="margin: 0; font-size: 13px; font-weight: 600;">${validUntil}</p></td></tr></table>
    </div>
    <h3 style="margin: 32px 0 20px 0; color: ${EMAIL_COLORS.primary}; font-size: 16px; font-weight: 700;">🎁 Vous débloquez maintenant :</h3>
    <table role="presentation" width="100%" style="background: #fafbfc; border-radius: 12px; padding: 20px;">
      <tr><td style="padding: 10px 16px;"><span style="color: ${EMAIL_COLORS.secondary}; font-size: 18px; margin-right: 12px;">★</span><span style="color: ${EMAIL_COLORS.text}; font-size: 14px;">Accès aux offres de crédit des partenaires agréés</span></td></tr>
      <tr><td style="padding: 10px 16px;"><span style="color: ${EMAIL_COLORS.secondary}; font-size: 18px; margin-right: 12px;">★</span><span style="color: ${EMAIL_COLORS.text}; font-size: 14px;">Score de solvabilité W-SCORE vérifié et certifié</span></td></tr>
      <tr><td style="padding: 10px 16px;"><span style="color: ${EMAIL_COLORS.secondary}; font-size: 18px; margin-right: 12px;">★</span><span style="color: ${EMAIL_COLORS.text}; font-size: 14px;">Partage sécurisé de votre certificat aux institutions</span></td></tr>
    </table>
    ${getCtaButton('Consulter Mon Certificat', `${PRODUCTION_DOMAIN}/dashboard/borrower`, 'success')}
  </td></tr>`;
  return wrapEmailTemplate(content);
}

function generateScoreReadyEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || 'Cher utilisateur');
  const scoreValue = Number(data.scoreValue || 0);
  const scoreTrend = String(data.scoreTrend || 'stable');
  const lastUpdate = String(data.lastUpdate || 'Aujourd\'hui');
  const firstName = fullName.split(' ')[0];
  
  const trendInfo: Record<string, { icon: string; text: string; color: string }> = {
    up: { icon: '📈', text: 'En progression', color: EMAIL_COLORS.accent },
    down: { icon: '📉', text: 'En baisse', color: EMAIL_COLORS.danger },
    stable: { icon: '➡️', text: 'Stable', color: EMAIL_COLORS.textMuted },
  };
  const trend = trendInfo[scoreTrend] || trendInfo.stable;
  
  let scoreCategory = { label: 'Faible', color: EMAIL_COLORS.danger };
  if (scoreValue >= 750) scoreCategory = { label: 'Excellent', color: EMAIL_COLORS.accent };
  else if (scoreValue >= 650) scoreCategory = { label: 'Bon', color: '#22c55e' };
  else if (scoreValue >= 550) scoreCategory = { label: 'Moyen', color: EMAIL_COLORS.secondary };
  else if (scoreValue >= 450) scoreCategory = { label: 'Passable', color: '#f97316' };
  
  const content = `<tr><td class="mobile-padding" style="padding: 48px 40px;">
    <div style="text-align: center; margin-bottom: 32px;"><div style="display: inline-block; width: 88px; height: 88px; background: linear-gradient(135deg, ${EMAIL_COLORS.secondary} 0%, #f8c75a 100%); border-radius: 50%; line-height: 88px; font-size: 40px; box-shadow: 0 8px 24px ${EMAIL_COLORS.secondary}40;">📊</div></div>
    <h1 style="margin: 0 0 8px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 26px; font-weight: 800;">Votre Credit Score est disponible !</h1>
    <p style="margin: 0 0 36px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">Mise à jour : ${lastUpdate}</p>
    <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7;">Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,</p>
    <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7;">Votre nouveau score de solvabilité <strong>W-SCORE</strong> a été calculé et certifié.</p>
    <div style="text-align: center; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 20px; padding: 40px; margin: 28px 0; border: 2px solid ${EMAIL_COLORS.border};">
      <p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Votre W-SCORE</p>
      <p style="margin: 0; font-size: 72px; font-weight: 800; color: ${EMAIL_COLORS.primary}; line-height: 1;">${scoreValue}</p>
      <p style="margin: 16px 0 0 0; font-size: 20px; font-weight: 700; color: ${scoreCategory.color};">${scoreCategory.label}</p>
      <p style="margin: 12px 0 0 0; font-size: 14px; color: ${trend.color};">${trend.icon} ${trend.text}</p>
    </div>
    ${getInfoBox('<strong>Améliorez votre score</strong> en ajoutant des preuves supplémentaires : captures USSD, historique SMS bancaire, ou garants de confiance.', 'info')}
    ${getCtaButton('Voir Mon Rapport Complet', `${PRODUCTION_DOMAIN}/dashboard/borrower/score`, 'secondary')}
  </td></tr>`;
  return wrapEmailTemplate(content);
}

function generatePaymentReminderEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || 'Cher utilisateur');
  const productName = String(data.productName || 'Produit WOUAKA');
  const amount = Number(data.amount || 0);
  const paymentUrl = String(data.paymentUrl || PRODUCTION_DOMAIN);
  const transactionId = String(data.transactionId || '');
  const createdAt = String(data.createdAt || '');
  const firstName = fullName.split(' ')[0];
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';
  
  const content = `<tr><td class="mobile-padding" style="padding: 48px 40px;">
    <div style="text-align: center; margin-bottom: 28px;"><div style="display: inline-block; width: 88px; height: 88px; background: linear-gradient(135deg, ${EMAIL_COLORS.secondary} 0%, #f8c75a 100%); border-radius: 50%; line-height: 88px; font-size: 40px; box-shadow: 0 8px 24px ${EMAIL_COLORS.secondary}40;">🛒</div></div>
    <h1 style="margin: 0 0 8px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 26px; font-weight: 800;">Commande en attente</h1>
    <p style="margin: 0 0 36px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 15px;">Finalisez votre achat sur WOUAKA</p>
    <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7;">Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,</p>
    <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7;">Nous avons remarqué que vous n'avez pas terminé votre commande. Votre panier vous attend toujours ! Finalisez votre achat en quelques clics pour débloquer vos services WOUAKA.</p>
    <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, #243a5e 100%); border-radius: 16px; padding: 28px; margin: 28px 0; color: white; box-shadow: 0 8px 32px ${EMAIL_COLORS.primary}30;">
      <div style="text-align: center; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.15);">
        <p style="margin: 0 0 4px 0; font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px;">Votre commande</p>
        <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.secondary};">${productName}</p>
      </div>
      <table role="presentation" width="100%">
        <tr>
          <td width="50%">
            <p style="margin: 0 0 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Montant à régler</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: white;">${formattedAmount}</p>
          </td>
          <td width="50%" style="text-align: right;">
            <p style="margin: 0 0 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Initiée le</p>
            <p style="margin: 0; font-size: 13px; font-weight: 600;">${formattedDate}</p>
          </td>
        </tr>
      </table>
      ${transactionId ? `<p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 11px; color: rgba(255,255,255,0.5);">Réf: ${transactionId.slice(0, 16).toUpperCase()}</p>` : ''}
    </div>
    ${getCtaButton('Finaliser mon paiement', paymentUrl, 'secondary')}
    ${getInfoBox('<strong>Votre lien de paiement est sécurisé</strong> et vous redirige vers notre partenaire de paiement CinetPay. Vos données bancaires ne sont jamais stockées sur nos serveurs.', 'info')}
    <div style="margin-top: 32px; padding: 20px; background: #f8fafc; border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Des questions sur votre commande ?</p>
      <p style="margin: 0; color: ${EMAIL_COLORS.primary}; font-size: 14px; font-weight: 600;">Contactez-nous : <a href="mailto:${COMPANY_INFO.supportEmail}" style="color: ${EMAIL_COLORS.secondary};">${COMPANY_INFO.supportEmail}</a></p>
    </div>
  </td></tr>`;
  return wrapEmailTemplate(content);
}

function generateSecurityAlertEmail(data: Record<string, unknown>): string {
  const fullName = String(data.fullName || 'Cher utilisateur');
  const alertType = String(data.alertType || 'new_login');
  const ipAddress = String(data.ipAddress || '0.0.0.0');
  const location = data.location ? String(data.location) : null;
  const timestamp = String(data.timestamp || 'Maintenant');
  const firstName = fullName.split(' ')[0];
  const maskedIp = ipAddress.split('.').slice(0, 2).join('.') + '.***';
  
  const alertConfigs: Record<string, { title: string; icon: string; severity: string }> = {
    new_login: { title: 'Nouvelle connexion détectée', icon: '🔑', severity: 'warning' },
    password_change: { title: 'Mot de passe modifié', icon: '🔒', severity: 'warning' },
    suspicious_activity: { title: 'Activité suspecte détectée', icon: '⚠️', severity: 'danger' },
    kyc_failed: { title: 'Tentatives KYC multiples échouées', icon: '🚫', severity: 'danger' },
  };
  const config = alertConfigs[alertType] || alertConfigs.new_login;
  const isDanger = config.severity === 'danger';
  
  const content = `<tr><td class="mobile-padding" style="padding: 48px 40px;">
    <div style="text-align: center; margin-bottom: 28px;"><div style="display: inline-block; width: 88px; height: 88px; background: ${isDanger ? '#fef2f2' : '#fef9e7'}; border: 4px solid ${isDanger ? EMAIL_COLORS.danger : EMAIL_COLORS.secondary}; border-radius: 50%; line-height: 88px; font-size: 40px;">${config.icon}</div></div>
    <h1 style="margin: 0 0 8px 0; text-align: center; color: ${isDanger ? EMAIL_COLORS.danger : EMAIL_COLORS.primary}; font-size: 24px; font-weight: 800;">Alerte de Sécurité WOUAKA</h1>
    <p style="margin: 0 0 36px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 15px;">${config.title}</p>
    <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7;">Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,</p>
    <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7;">Nous avons détecté une activité sur votre compte WOUAKA. Si vous êtes à l'origine de cette action, ignorez cet email. <strong>Sinon, sécurisez votre compte immédiatement.</strong></p>
    <div style="background: #f8fafc; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 12px; padding: 24px; margin: 28px 0;">
      <h3 style="margin: 0 0 20px 0; color: ${EMAIL_COLORS.primary}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">📋 Détails de l'activité</h3>
      <table role="presentation" width="100%">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};"><span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Date et heure</span></td><td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;"><span style="color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600;">${timestamp}</span></td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};"><span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Adresse IP</span></td><td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;"><span style="color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600; font-family: monospace;">${maskedIp}</span></td></tr>
        ${location ? `<tr><td style="padding: 10px 0;"><span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">Localisation</span></td><td style="padding: 10px 0; text-align: right;"><span style="color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600;">${location}</span></td></tr>` : ''}
      </table>
    </div>
    ${getInfoBox('<strong>Ce n\'était pas vous ?</strong><br>1. Changez immédiatement votre mot de passe<br>2. Vérifiez les connexions récentes<br>3. Contactez notre support', 'danger')}
    ${getCtaButton('Sécuriser Mon Compte', `${PRODUCTION_DOMAIN}/profile`, 'danger')}
  </td></tr>`;
  return wrapEmailTemplate(content);
}

// ============================================
// RESEND API HELPER
// ============================================

async function sendEmailWithResend(
  apiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<{ id?: string; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WOUAKA <no-reply@wouaka-creditscore.com>',
        to: [to],
        subject,
        html,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[Resend] Error:', result);
      return { error: result.message || 'Failed to send email' };
    }
    
    return { id: result.id };
  } catch (error) {
    console.error('[Resend] Exception:', error);
    return { error: String(error) };
  }
}

// ============================================
// HASH HELPER FOR EMAIL LOGGING
// ============================================

async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// ============================================
// MAIN HANDLER
// ============================================

interface EmailRequest {
  template: 'welcome' | 'otp' | 'kyc_success' | 'score_ready' | 'security_alert' | 'payment_reminder';
  to: string;
  data: Record<string, unknown>;
  triggeredBy?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[send-automated-email] RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { template, to, data, triggeredBy = 'api' }: EmailRequest = await req.json();

    console.log(`[send-automated-email] Processing ${template} email to ${to.replace(/(.{2})(.*)(@.*)/, '$1***$3')} (triggered by: ${triggeredBy})`);

    // Generate email based on template
    let html: string;
    let subject: string;

    switch (template) {
      case 'welcome':
        subject = 'Bienvenue dans l\'écosystème WOUAKA 🎉';
        html = generateWelcomeEmail(data);
        break;
      case 'otp':
        subject = 'Votre code de sécurité WOUAKA 🔐';
        html = generateOtpEmail(data);
        break;
      case 'kyc_success':
        subject = 'Identité Certifiée ✅ - WOUAKA';
        html = generateKycSuccessEmail(data);
        break;
      case 'score_ready':
        subject = 'Votre Credit Score est disponible 📊';
        html = generateScoreReadyEmail(data);
        break;
      case 'security_alert':
        subject = '🚨 Alerte de sécurité WOUAKA';
        html = generateSecurityAlertEmail(data);
        break;
      case 'payment_reminder':
        subject = '🛒 Finalisez votre commande WOUAKA';
        html = generatePaymentReminderEmail(data);
        break;
      default:
        throw new Error(`Unknown template: ${template}`);
    }

    // Send email via Resend
    const emailResult = await sendEmailWithResend(resendApiKey, to, subject, html);

    if (emailResult.error) {
      // Log failed email
      const emailHash = await hashEmail(to);
      await supabase.from('email_logs').insert({
        template,
        recipient_email_hash: emailHash,
        status: 'failed',
        error_message: emailResult.error,
        triggered_by: triggeredBy,
      });
      throw new Error(emailResult.error);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[send-automated-email] Email sent successfully in ${processingTime}ms: ${emailResult.id}`);

    // Log successful email (with hashed email for privacy)
    const emailHash = await hashEmail(to);
    await supabase.from('email_logs').insert({
      template,
      recipient_email_hash: emailHash,
      status: 'sent',
      resend_id: emailResult.id,
      triggered_by: triggeredBy,
    });

    // Also log to audit_logs
    await supabase.from('audit_logs').insert({
      action: 'email_sent',
      entity_type: 'email',
      entity_id: emailResult.id || null,
      metadata: {
        template,
        to_email_masked: to.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        triggered_by: triggeredBy,
        processing_time_ms: processingTime,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.id,
        processingTime,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[send-automated-email] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
