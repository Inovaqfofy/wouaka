/**
 * ============================================
 * WOUAKA EMAIL TEMPLATES SYSTEM v2.0
 * Design System Premium - Classe Mondiale
 * ============================================
 */

import { PRODUCTION_DOMAIN, COMPANY_INFO, SOCIAL_URLS } from './app-config';

// ============================================
// BRAND COLORS - NOUVELLE CHARTE GRAPHIQUE
// ============================================

export const EMAIL_COLORS = {
  primary: '#1A2B4C',      // Bleu Marine Corporate
  secondary: '#F5A623',    // Or/Jaune de confiance
  accent: '#2d7a4f',       // Vert Succès
  background: '#f8fafc',   // Gris très clair
  white: '#FFFFFF',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  danger: '#dc2626',
  lightBlue: '#e8f4fd',
} as const;

export const EMAIL_STYLES = {
  fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  borderRadius: '12px',
  buttonRadius: '8px',
} as const;

// ============================================
// EMAIL HEADER COMPONENT
// ============================================

export function getEmailHeader(): string {
  return `
    <tr>
      <td style="padding: 40px 32px 32px 32px; text-align: center; background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, #243a5e 100%);">
        <a href="${PRODUCTION_DOMAIN}" style="text-decoration: none; display: inline-block;">
          <img 
            src="${PRODUCTION_DOMAIN}/logo.png" 
            alt="WOUAKA" 
            width="200" 
            height="auto" 
            style="max-width: 200px; height: auto; margin-bottom: 16px;"
          />
        </a>
        <p style="margin: 0; color: ${EMAIL_COLORS.secondary}; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; font-family: ${EMAIL_STYLES.fontFamily};">
          CERTIFICATION DE SOLVABILITÉ SOUVERAINE
        </p>
      </td>
    </tr>
  `;
}

// ============================================
// EMAIL FOOTER COMPONENT
// ============================================

export function getEmailFooter(unsubscribeUrl?: string): string {
  return `
    <tr>
      <td style="padding: 40px 32px; background-color: ${EMAIL_COLORS.primary}; text-align: center;">
        <!-- Logo Footer -->
        <img 
          src="${PRODUCTION_DOMAIN}/logo.png" 
          alt="WOUAKA" 
          width="120" 
          height="auto" 
          style="max-width: 120px; height: auto; margin-bottom: 20px; opacity: 0.9;"
        />
        
        <!-- Social Links -->
        <div style="margin-bottom: 24px;">
          <a href="${SOCIAL_URLS.linkedin}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
            <img src="https://cdn-icons-png.flaticon.com/32/174/174857.png" alt="LinkedIn" width="28" height="28" style="border-radius: 4px;">
          </a>
          <a href="${SOCIAL_URLS.facebook}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
            <img src="https://cdn-icons-png.flaticon.com/32/174/174848.png" alt="Facebook" width="28" height="28" style="border-radius: 4px;">
          </a>
          <a href="${SOCIAL_URLS.twitter}" style="display: inline-block; margin: 0 10px; text-decoration: none;">
            <img src="https://cdn-icons-png.flaticon.com/32/5968/5968830.png" alt="X/Twitter" width="28" height="28" style="border-radius: 4px;">
          </a>
          <a href="https://instagram.com/wouaka" style="display: inline-block; margin: 0 10px; text-decoration: none;">
            <img src="https://cdn-icons-png.flaticon.com/32/174/174855.png" alt="Instagram" width="28" height="28" style="border-radius: 4px;">
          </a>
        </div>
        
        <!-- Company Info -->
        <p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.secondary}; font-size: 14px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">
          ${COMPANY_INFO.legalName}
        </p>
        <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.8); font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">
          ${COMPANY_INFO.address}
        </p>
        <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.6); font-size: 12px; font-family: ${EMAIL_STYLES.fontFamily};">
          RCCM: ${COMPANY_INFO.rccm} | Tél: ${COMPANY_INFO.phone}
        </p>
        
        <!-- Legal Links -->
        <div style="margin-bottom: 20px; padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1);">
          <a href="${PRODUCTION_DOMAIN}/privacy" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 12px; margin: 0 16px; font-family: ${EMAIL_STYLES.fontFamily};">
            Confidentialité
          </a>
          <a href="${PRODUCTION_DOMAIN}/terms" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 12px; margin: 0 16px; font-family: ${EMAIL_STYLES.fontFamily};">
            Conditions
          </a>
          <a href="${PRODUCTION_DOMAIN}/legal" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 12px; margin: 0 16px; font-family: ${EMAIL_STYLES.fontFamily};">
            Mentions Légales
          </a>
        </div>
        
        <!-- Certification Badge -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.secondary}; font-size: 11px; font-weight: 600; letter-spacing: 1px; font-family: ${EMAIL_STYLES.fontFamily};">
            ✓ PLATEFORME DE CERTIFICATION D'IDENTITÉ AGRÉÉE
          </p>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.6); font-size: 11px; line-height: 1.5; font-family: ${EMAIL_STYLES.fontFamily};">
            Conforme aux directives BCEAO et à la réglementation UEMOA<br>
            sur la protection des données personnelles
          </p>
        </div>
        
        ${unsubscribeUrl ? `
        <a href="${unsubscribeUrl}" style="color: rgba(255,255,255,0.5); text-decoration: underline; font-size: 11px; font-family: ${EMAIL_STYLES.fontFamily};">
          Se désabonner des communications marketing
        </a>
        ` : ''}
        
        <!-- Support -->
        <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.7); font-size: 12px; font-family: ${EMAIL_STYLES.fontFamily};">
          Questions ? <a href="mailto:${COMPANY_INFO.supportEmail}" style="color: ${EMAIL_COLORS.secondary}; text-decoration: none; font-weight: 500;">${COMPANY_INFO.supportEmail}</a>
        </p>
        
        <!-- Copyright -->
        <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.4); font-size: 11px; font-family: ${EMAIL_STYLES.fontFamily};">
          © ${new Date().getFullYear()} WOUAKA. Tous droits réservés.
        </p>
      </td>
    </tr>
  `;
}

// ============================================
// BASE TEMPLATE WRAPPER
// ============================================

export function wrapEmailTemplate(content: string, unsubscribeUrl?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
      <title>WOUAKA</title>
      <link href="${EMAIL_STYLES.fontUrl}" rel="stylesheet">
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <style type="text/css">
        table { border-collapse: collapse; }
        .mso-button { padding: 14px 32px !important; }
      </style>
      <![endif]-->
      <style>
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; max-width: 100% !important; }
          .mobile-padding { padding: 24px 20px !important; }
          .mobile-text-center { text-align: center !important; }
          .mobile-full-width { width: 100% !important; display: block !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.background}; font-family: ${EMAIL_STYLES.fontFamily}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${EMAIL_COLORS.background};">
        <tr>
          <td align="center" style="padding: 32px 16px;">
            <!-- Email Container -->
            <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: ${EMAIL_COLORS.white}; border-radius: ${EMAIL_STYLES.borderRadius}; box-shadow: 0 8px 32px rgba(26, 43, 76, 0.12); overflow: hidden;">
              ${getEmailHeader()}
              ${content}
              ${getEmailFooter(unsubscribeUrl)}
            </table>
            
            <!-- Footer Text -->
            <p style="margin: 24px 0 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 11px; font-family: ${EMAIL_STYLES.fontFamily}; text-align: center;">
              Cet email a été envoyé automatiquement depuis <a href="${PRODUCTION_DOMAIN}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none;">www.wouaka-creditscore.com</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ============================================
// CTA BUTTON COMPONENT
// ============================================

export function getCtaButton(text: string, url: string, variant: 'primary' | 'secondary' | 'success' | 'danger' = 'secondary'): string {
  const colors = {
    primary: { bg: EMAIL_COLORS.primary, text: EMAIL_COLORS.white },
    secondary: { bg: EMAIL_COLORS.secondary, text: EMAIL_COLORS.primary },
    success: { bg: EMAIL_COLORS.accent, text: EMAIL_COLORS.white },
    danger: { bg: EMAIL_COLORS.danger, text: EMAIL_COLORS.white },
  };
  
  const { bg, text: textColor } = colors[variant];
  
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
      <tr>
        <td style="background: ${bg}; border-radius: ${EMAIL_STYLES.buttonRadius}; text-align: center; box-shadow: 0 4px 12px ${bg}40;">
          <a href="${url}" target="_blank" class="mso-button" style="display: inline-block; padding: 16px 40px; color: ${textColor}; text-decoration: none; font-weight: 600; font-size: 15px; font-family: ${EMAIL_STYLES.fontFamily}; letter-spacing: 0.5px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ============================================
// INFO BOX COMPONENT
// ============================================

export function getInfoBox(content: string, variant: 'info' | 'success' | 'warning' | 'danger' = 'info'): string {
  const styles = {
    info: { bg: EMAIL_COLORS.lightBlue, border: EMAIL_COLORS.primary, icon: '💡' },
    success: { bg: '#f0fdf4', border: EMAIL_COLORS.accent, icon: '✓' },
    warning: { bg: '#fffbeb', border: EMAIL_COLORS.secondary, icon: '⚠️' },
    danger: { bg: '#fef2f2', border: EMAIL_COLORS.danger, icon: '🚨' },
  };
  
  const { bg, border, icon } = styles[variant];
  
  return `
    <div style="background: ${bg}; border-left: 4px solid ${border}; padding: 20px 24px; margin: 24px 0; border-radius: 0 ${EMAIL_STYLES.borderRadius} ${EMAIL_STYLES.borderRadius} 0;">
      <p style="margin: 0; color: ${EMAIL_COLORS.text}; font-size: 14px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
        <span style="font-size: 16px; margin-right: 8px;">${icon}</span>
        ${content}
      </p>
    </div>
  `;
}

// ============================================
// TEMPLATE 1: BIENVENUE (WELCOME)
// ============================================

export function getWelcomeEmail(data: { fullName: string; email: string }): string {
  const firstName = data.fullName?.split(' ')[0] || 'Cher utilisateur';
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <!-- Welcome Badge -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 88px; height: 88px; background: linear-gradient(135deg, ${EMAIL_COLORS.secondary} 0%, #f8c75a 100%); border-radius: 50%; line-height: 88px; font-size: 44px; box-shadow: 0 8px 24px ${EMAIL_COLORS.secondary}40;">
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
          Félicitations pour votre inscription sur <strong>WOUAKA</strong> ! Vous venez de rejoindre 
          la première plateforme de <strong style="color: ${EMAIL_COLORS.secondary};">certification de solvabilité souveraine</strong> 
          conçue exclusivement pour l'Afrique de l'Ouest.
        </p>
        
        <!-- Steps Progress -->
        <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.lightBlue} 0%, #f0f9ff 100%); border-radius: ${EMAIL_STYLES.borderRadius}; padding: 28px; margin: 32px 0;">
          <h3 style="margin: 0 0 20px 0; color: ${EMAIL_COLORS.primary}; font-size: 16px; font-weight: 700; font-family: ${EMAIL_STYLES.fontFamily};">
            📋 Les 3 étapes pour débloquer votre potentiel :
          </h3>
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(26,43,76,0.1);">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="44" style="vertical-align: top;">
                      <div style="width: 36px; height: 36px; background: ${EMAIL_COLORS.primary}; border-radius: 50%; text-align: center; line-height: 36px; color: white; font-weight: 700; font-size: 14px;">1</div>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 14px; font-family: ${EMAIL_STYLES.fontFamily};">Vérifiez votre Identité</p>
                      <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">Certification CNI/Passeport par notre IA</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(26,43,76,0.1);">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="44" style="vertical-align: top;">
                      <div style="width: 36px; height: 36px; background: ${EMAIL_COLORS.primary}; border-radius: 50%; text-align: center; line-height: 36px; color: white; font-weight: 700; font-size: 14px;">2</div>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 14px; font-family: ${EMAIL_STYLES.fontFamily};">Validez votre Mobile</p>
                      <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">Preuves USSD et historique mobile money</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="44" style="vertical-align: top;">
                      <div style="width: 36px; height: 36px; background: ${EMAIL_COLORS.secondary}; border-radius: 50%; text-align: center; line-height: 36px; color: ${EMAIL_COLORS.primary}; font-weight: 700; font-size: 14px;">3</div>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0 0 4px 0; color: ${EMAIL_COLORS.primary}; font-weight: 600; font-size: 14px; font-family: ${EMAIL_STYLES.fontFamily};">Obtenez votre W-SCORE</p>
                      <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">Votre score de solvabilité certifié</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
        
        ${getInfoBox(
          '<strong>Vos données vous appartiennent.</strong> Contrairement aux bureaux de crédit traditionnels, vous gardez le contrôle total de vos informations financières.',
          'info'
        )}
        
        ${getCtaButton('Commencer ma Certification', `${PRODUCTION_DOMAIN}/dashboard/borrower`, 'secondary')}
        
        <p style="margin: 28px 0 0 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; line-height: 1.6; font-family: ${EMAIL_STYLES.fontFamily};">
          Compte créé avec : <strong style="color: ${EMAIL_COLORS.primary};">${data.email}</strong>
        </p>
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

// ============================================
// TEMPLATE 2: CODE OTP
// ============================================

export function getOtpEmail(data: { fullName: string; otpCode: string; expiresIn: number }): string {
  const firstName = data.fullName?.split(' ')[0] || 'Cher utilisateur';
  const otpCode = data.otpCode || '000000';
  const expiresIn = data.expiresIn || 10;
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px; text-align: center;">
        <!-- Security Icon -->
        <div style="margin-bottom: 28px;">
          <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, #243a5e 100%); border-radius: 50%; line-height: 80px; font-size: 36px; box-shadow: 0 8px 24px ${EMAIL_COLORS.primary}30;">
            🔐
          </div>
        </div>
        
        <h1 style="margin: 0 0 12px 0; color: ${EMAIL_COLORS.primary}; font-size: 26px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre Code de Sécurité
        </h1>
        
        <p style="margin: 0 0 36px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 15px; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour ${firstName}, utilisez ce code pour vous authentifier
        </p>
        
        <!-- OTP Code Display -->
        <div style="background: linear-gradient(135deg, #fef9e7 0%, #fdf4dc 100%); border: 3px dashed ${EMAIL_COLORS.secondary}; border-radius: 16px; padding: 32px; margin: 0 auto; max-width: 320px;">
          <p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-family: ${EMAIL_STYLES.fontFamily};">
            Code de vérification
          </p>
          <p style="margin: 0; font-size: 48px; font-weight: 800; letter-spacing: 12px; color: ${EMAIL_COLORS.primary}; font-family: 'Courier New', monospace;">
            ${otpCode}
          </p>
        </div>
        
        <!-- Timer Warning -->
        <div style="margin: 28px auto; padding: 14px 24px; background: #fef2f2; border-radius: ${EMAIL_STYLES.borderRadius}; display: inline-block;">
          <p style="margin: 0; color: ${EMAIL_COLORS.danger}; font-size: 14px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">
            ⏱️ Ce code expire dans <strong>${expiresIn} minutes</strong>
          </p>
        </div>
        
        <p style="margin: 28px 0 0 0; color: ${EMAIL_COLORS.text}; font-size: 14px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.
        </p>
        
        ${getInfoBox(
          '<strong>Ne partagez jamais ce code.</strong> L\'équipe WOUAKA ne vous demandera jamais votre code OTP par téléphone, SMS ou email.',
          'warning'
        )}
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

// ============================================
// TEMPLATE 3: KYC APPROUVÉ (IDENTITÉ CERTIFIÉE)
// ============================================

export function getKycSuccessEmail(data: { 
  fullName: string; 
  certificationLevel: string;
  certificateId: string;
  validUntil: string;
}): string {
  const firstName = data.fullName?.split(' ')[0] || 'Cher utilisateur';
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <!-- Success Badge -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 96px; height: 96px; background: linear-gradient(135deg, ${EMAIL_COLORS.accent} 0%, #34d399 100%); border-radius: 50%; line-height: 96px; font-size: 48px; box-shadow: 0 8px 32px ${EMAIL_COLORS.accent}40;">
            ✓
          </div>
        </div>
        
        <h1 style="margin: 0 0 8px 0; text-align: center; color: ${EMAIL_COLORS.accent}; font-size: 28px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Identité Certifiée ✅
        </h1>
        
        <p style="margin: 0 0 36px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 17px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre profil a été vérifié par notre IA
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Excellente nouvelle ! Votre processus de vérification d'identité (KYC) a été 
          <strong style="color: ${EMAIL_COLORS.accent};">validé avec succès</strong> par notre système 
          d'intelligence artificielle certifié.
        </p>
        
        <!-- Certificate Card -->
        <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.primary} 0%, #243a5e 100%); border-radius: 16px; padding: 28px; margin: 28px 0; color: white; box-shadow: 0 8px 32px ${EMAIL_COLORS.primary}30;">
          <div style="border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 6px 0; font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px; font-family: ${EMAIL_STYLES.fontFamily};">
              Niveau de Certification
            </p>
            <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.secondary}; font-family: ${EMAIL_STYLES.fontFamily};">
              ${data.certificationLevel || 'Standard'}
            </p>
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%">
                <p style="margin: 0 0 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px; font-family: ${EMAIL_STYLES.fontFamily};">N° Certificat</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">${data.certificateId || 'N/A'}</p>
              </td>
              <td width="50%" style="text-align: right;">
                <p style="margin: 0 0 4px 0; font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px; font-family: ${EMAIL_STYLES.fontFamily};">Valide jusqu'au</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">${data.validUntil || 'N/A'}</p>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Benefits List -->
        <h3 style="margin: 32px 0 20px 0; color: ${EMAIL_COLORS.primary}; font-size: 16px; font-weight: 700; font-family: ${EMAIL_STYLES.fontFamily};">
          🎁 Vous débloquez maintenant :
        </h3>
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fafbfc; border-radius: ${EMAIL_STYLES.borderRadius}; padding: 20px;">
          <tr>
            <td style="padding: 10px 16px;">
              <span style="color: ${EMAIL_COLORS.secondary}; font-size: 18px; margin-right: 12px;">★</span>
              <span style="color: ${EMAIL_COLORS.text}; font-size: 14px; font-family: ${EMAIL_STYLES.fontFamily};">Accès aux offres de crédit des partenaires agréés</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 16px;">
              <span style="color: ${EMAIL_COLORS.secondary}; font-size: 18px; margin-right: 12px;">★</span>
              <span style="color: ${EMAIL_COLORS.text}; font-size: 14px; font-family: ${EMAIL_STYLES.fontFamily};">Score de solvabilité W-SCORE vérifié et certifié</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 16px;">
              <span style="color: ${EMAIL_COLORS.secondary}; font-size: 18px; margin-right: 12px;">★</span>
              <span style="color: ${EMAIL_COLORS.text}; font-size: 14px; font-family: ${EMAIL_STYLES.fontFamily};">Partage sécurisé de votre certificat aux institutions</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 16px;">
              <span style="color: ${EMAIL_COLORS.secondary}; font-size: 18px; margin-right: 12px;">★</span>
              <span style="color: ${EMAIL_COLORS.text}; font-size: 14px; font-family: ${EMAIL_STYLES.fontFamily};">Priorité dans les demandes de financement</span>
            </td>
          </tr>
        </table>
        
        ${getCtaButton('Consulter Mon Certificat', `${PRODUCTION_DOMAIN}/dashboard/borrower`, 'success')}
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

// ============================================
// TEMPLATE 4: SCORE DISPONIBLE
// ============================================

export function getScoreReadyEmail(data: { 
  fullName: string; 
  scoreValue: number;
  scoreTrend: 'up' | 'down' | 'stable';
  lastUpdate: string;
}): string {
  const firstName = data.fullName?.split(' ')[0] || 'Cher utilisateur';
  const scoreValue = data.scoreValue || 0;
  const scoreTrend = data.scoreTrend || 'stable';
  
  const trendInfo = {
    up: { icon: '📈', text: 'En progression', color: EMAIL_COLORS.accent },
    down: { icon: '📉', text: 'En baisse', color: EMAIL_COLORS.danger },
    stable: { icon: '➡️', text: 'Stable', color: EMAIL_COLORS.textMuted },
  };
  
  // Score category
  let scoreCategory: { label: string; color: string } = { label: 'Faible', color: EMAIL_COLORS.danger };
  if (scoreValue >= 750) scoreCategory = { label: 'Excellent', color: EMAIL_COLORS.accent };
  else if (scoreValue >= 650) scoreCategory = { label: 'Bon', color: '#22c55e' };
  else if (scoreValue >= 550) scoreCategory = { label: 'Moyen', color: EMAIL_COLORS.secondary };
  else if (scoreValue >= 450) scoreCategory = { label: 'Passable', color: '#f97316' };
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <!-- Score Icon -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 88px; height: 88px; background: linear-gradient(135deg, ${EMAIL_COLORS.secondary} 0%, #f8c75a 100%); border-radius: 50%; line-height: 88px; font-size: 40px; box-shadow: 0 8px 24px ${EMAIL_COLORS.secondary}40;">
            📊
          </div>
        </div>
        
        <h1 style="margin: 0 0 8px 0; text-align: center; color: ${EMAIL_COLORS.primary}; font-size: 26px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre Credit Score est disponible !
        </h1>
        
        <p style="margin: 0 0 36px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-family: ${EMAIL_STYLES.fontFamily};">
          Mise à jour : ${data.lastUpdate || 'Aujourd\'hui'}
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Votre nouveau score de solvabilité <strong>W-SCORE</strong> a été calculé et certifié. 
          Consultez votre rapport détaillé dès maintenant.
        </p>
        
        <!-- Score Display Card -->
        <div style="text-align: center; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 20px; padding: 40px; margin: 28px 0; border: 2px solid ${EMAIL_COLORS.border};">
          <p style="margin: 0 0 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-family: ${EMAIL_STYLES.fontFamily};">
            Votre W-SCORE
          </p>
          <p style="margin: 0; font-size: 72px; font-weight: 800; color: ${EMAIL_COLORS.primary}; font-family: ${EMAIL_STYLES.fontFamily}; line-height: 1;">
            ${scoreValue}
          </p>
          <p style="margin: 16px 0 0 0; font-size: 20px; font-weight: 700; color: ${scoreCategory.color}; font-family: ${EMAIL_STYLES.fontFamily};">
            ${scoreCategory.label}
          </p>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: ${trendInfo[scoreTrend].color}; font-family: ${EMAIL_STYLES.fontFamily};">
            ${trendInfo[scoreTrend].icon} ${trendInfo[scoreTrend].text}
          </p>
        </div>
        
        ${getInfoBox(
          '<strong>Améliorez votre score</strong> en ajoutant des preuves supplémentaires : captures USSD, historique SMS bancaire, ou garants de confiance.',
          'info'
        )}
        
        ${getCtaButton('Voir Mon Rapport Complet', `${PRODUCTION_DOMAIN}/dashboard/borrower/score`, 'secondary')}
        
        <p style="margin: 28px 0 0 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; line-height: 1.6; font-family: ${EMAIL_STYLES.fontFamily};">
          Ce score est basé sur vos données vérifiées et certifiées.<br>
          Il évolue à mesure que vous enrichissez votre profil.
        </p>
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

// ============================================
// TEMPLATE 5: ALERTE SÉCURITÉ
// ============================================

export function getSecurityAlertEmail(data: { 
  fullName: string; 
  alertType: 'new_login' | 'password_change' | 'suspicious_activity' | 'kyc_failed';
  ipAddress: string;
  location?: string;
  device?: string;
  timestamp: string;
}): string {
  const firstName = data.fullName?.split(' ')[0] || 'Cher utilisateur';
  const maskedIp = data.ipAddress?.split('.').slice(0, 2).join('.') + '.***';
  
  const alertConfigs = {
    new_login: { 
      title: 'Nouvelle connexion détectée', 
      icon: '🔑',
      severity: 'warning' as const,
    },
    password_change: { 
      title: 'Mot de passe modifié', 
      icon: '🔒',
      severity: 'warning' as const,
    },
    suspicious_activity: { 
      title: 'Activité suspecte détectée', 
      icon: '⚠️',
      severity: 'danger' as const,
    },
    kyc_failed: { 
      title: 'Tentatives KYC multiples échouées', 
      icon: '🚫',
      severity: 'danger' as const,
    },
  };
  
  const config = alertConfigs[data.alertType] || alertConfigs.new_login;
  const isDanger = config.severity === 'danger';
  
  const content = `
    <tr>
      <td class="mobile-padding" style="padding: 48px 40px;">
        <!-- Alert Icon -->
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; width: 88px; height: 88px; background: ${isDanger ? '#fef2f2' : '#fef9e7'}; border: 4px solid ${isDanger ? EMAIL_COLORS.danger : EMAIL_COLORS.secondary}; border-radius: 50%; line-height: 88px; font-size: 40px;">
            ${config.icon}
          </div>
        </div>
        
        <h1 style="margin: 0 0 8px 0; text-align: center; color: ${isDanger ? EMAIL_COLORS.danger : EMAIL_COLORS.primary}; font-size: 24px; font-weight: 800; font-family: ${EMAIL_STYLES.fontFamily};">
          Alerte de Sécurité WOUAKA
        </h1>
        
        <p style="margin: 0 0 36px 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 15px; font-family: ${EMAIL_STYLES.fontFamily};">
          ${config.title}
        </p>
        
        <p style="margin: 0 0 24px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Bonjour <strong style="color: ${EMAIL_COLORS.primary};">${firstName}</strong>,
        </p>
        
        <p style="margin: 0 0 28px 0; color: ${EMAIL_COLORS.text}; font-size: 16px; line-height: 1.7; font-family: ${EMAIL_STYLES.fontFamily};">
          Nous avons détecté une activité sur votre compte WOUAKA. Si vous êtes à l'origine de cette action, 
          vous pouvez ignorer cet email. <strong>Sinon, veuillez sécuriser votre compte immédiatement.</strong>
        </p>
        
        <!-- Activity Details -->
        <div style="background: #f8fafc; border: 1px solid ${EMAIL_COLORS.border}; border-radius: ${EMAIL_STYLES.borderRadius}; padding: 24px; margin: 28px 0;">
          <h3 style="margin: 0 0 20px 0; color: ${EMAIL_COLORS.primary}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-family: ${EMAIL_STYLES.fontFamily};">
            📋 Détails de l'activité
          </h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
                <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">Date et heure</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;">
                <span style="color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">${data.timestamp || 'Non disponible'}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
                <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">Adresse IP</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;">
                <span style="color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600; font-family: monospace;">${maskedIp}</span>
              </td>
            </tr>
            ${data.location ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
                <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">Localisation</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right;">
                <span style="color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">${data.location}</span>
              </td>
            </tr>
            ` : ''}
            ${data.device ? `
            <tr>
              <td style="padding: 10px 0;">
                <span style="color: ${EMAIL_COLORS.textMuted}; font-size: 13px; font-family: ${EMAIL_STYLES.fontFamily};">Appareil</span>
              </td>
              <td style="padding: 10px 0; text-align: right;">
                <span style="color: ${EMAIL_COLORS.text}; font-size: 13px; font-weight: 600; font-family: ${EMAIL_STYLES.fontFamily};">${data.device}</span>
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        ${getInfoBox(
          `<strong>Ce n'était pas vous ?</strong><br>
          1. Changez immédiatement votre mot de passe<br>
          2. Vérifiez les connexions récentes à votre compte<br>
          3. Contactez notre support si le problème persiste`,
          'danger'
        )}
        
        ${getCtaButton('Sécuriser Mon Compte', `${PRODUCTION_DOMAIN}/profile`, 'danger')}
        
        <p style="margin: 28px 0 0 0; text-align: center; color: ${EMAIL_COLORS.textMuted}; font-size: 12px; line-height: 1.6; font-family: ${EMAIL_STYLES.fontFamily};">
          Pour toute question, contactez-nous à<br>
          <a href="mailto:${COMPANY_INFO.supportEmail}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none; font-weight: 600;">${COMPANY_INFO.supportEmail}</a>
        </p>
      </td>
    </tr>
  `;
  
  return wrapEmailTemplate(content);
}

// ============================================
// EMAIL TYPE DEFINITIONS
// ============================================

export type EmailTemplate = 
  | 'welcome'
  | 'otp'
  | 'kyc_success'
  | 'score_ready'
  | 'security_alert';

export interface EmailData {
  template: EmailTemplate;
  to: string;
  subject: string;
  data: Record<string, unknown>;
}

export function getEmailSubject(template: EmailTemplate): string {
  const subjects: Record<EmailTemplate, string> = {
    welcome: 'Bienvenue dans l\'écosystème WOUAKA 🎉',
    otp: 'Votre code de sécurité WOUAKA 🔐',
    kyc_success: 'Identité Certifiée ✅ - WOUAKA',
    score_ready: 'Votre Credit Score est disponible 📊',
    security_alert: '🚨 Alerte de sécurité WOUAKA',
  };
  return subjects[template];
}
