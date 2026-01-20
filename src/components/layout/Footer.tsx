import { Link } from "react-router-dom";
import logoWouaka from "@/assets/logo-wouaka.png";
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin, Building2, Shield, ArrowRight, Wallet } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const footerLegal = [
  { label: "Mentions légales", href: "/legal" },
  { label: "Confidentialité", href: "/privacy" },
  { label: "CGU", href: "/terms" },
];

const footerSociete = [
  { label: "À propos", href: "/about" },
  { label: "Nos partenaires", href: "/partenaires" },
  { label: "Tarifs", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com/wouaka", icon: Facebook, ariaLabel: "Suivez Wouaka sur Facebook" },
  { label: "LinkedIn", href: "https://linkedin.com/company/wouaka", icon: Linkedin, ariaLabel: "Suivez Wouaka sur LinkedIn" },
  { label: "Instagram", href: "https://instagram.com/wouaka", icon: Instagram, ariaLabel: "Suivez Wouaka sur Instagram" },
  { label: "X", href: "https://x.com/wouaka", icon: Twitter, ariaLabel: "Suivez Wouaka sur X" },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A3D2C] text-white" role="contentinfo" aria-label="Pied de page Wouaka">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-6 group" aria-label="Wouaka - Retour à l'accueil">
              <img src={logoWouaka} alt="Logo Wouaka" className="w-12 h-12 rounded-xl transition-transform group-hover:scale-105" />
              <span className="text-2xl font-bold tracking-tight">Wouaka</span>
            </Link>
            
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              L'inclusion financière pour l'Afrique. Emprunteurs et institutions financières, 
              nous vous accompagnons.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 text-sm">
                <Building2 className="w-4 h-4 mt-0.5 text-[#D4A017] shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-white">Inopay Group SARL</p>
                  <p className="text-white/70">RCCM : CI-ABJ-03-2023-B13-03481</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-[#D4A017] shrink-0" aria-hidden="true" />
                <span className="text-white/80">27 BP 148 Abidjan 27, Côte d'Ivoire</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-[#D4A017] shrink-0" aria-hidden="true" />
                <a href="tel:+2250701238974" className="text-white/80 hover:text-[#D4A017] transition-colors">
                  +225 07 01 23 89 74
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-[#D4A017] shrink-0" aria-hidden="true" />
                <a href="mailto:contact@wouaka-creditscore.com" className="text-white/80 hover:text-[#D4A017] transition-colors">
                  contact@wouaka-creditscore.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D4A017] hover:text-[#0A3D2C] transition-all duration-300"
                  aria-label={social.ariaLabel}
                >
                  <social.icon className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Société */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Société</h3>
            <nav aria-label="Liens société">
              <ul className="space-y-3">
                {footerSociete.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-white/70 hover:text-[#D4A017] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Légal</h3>
            <nav aria-label="Informations légales">
              <ul className="space-y-3">
                {footerLegal.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-white/70 hover:text-[#D4A017] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-[#072A1E] border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-white/60 text-center leading-relaxed max-w-4xl mx-auto">
            <strong className="text-white/80">Important :</strong> Wouaka est une plateforme de Inopay Group SARL. 
            Nous ne sommes pas un établissement financier et n'octroyons pas de crédits. 
            Nous mettons en relation emprunteurs et institutions financières partenaires.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-[#051D14]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/50">© {currentYear} Wouaka — Tous droits réservés.</p>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-[#D4A017]" aria-hidden="true" />
                <span className="text-white/50">Conforme BCEAO</span>
              </span>
              <Separator orientation="vertical" className="h-3 bg-white/20" />
              <span>Inopay Group</span>
              <Separator orientation="vertical" className="h-3 bg-white/20" />
              <span>🇨🇮 Abidjan</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
