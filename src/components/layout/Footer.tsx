import { Link } from "react-router-dom";
import logoWouaka from "@/assets/logo-wouaka.png";
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin, Building2, Shield, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const footerProducts = [
  { label: "Inclusion Score", href: "/scoring" },
  { label: "Pre-Check", href: "/developers" },
  { label: "Identity Check", href: "/kyc" },
  { label: "Business Score", href: "/solutions#produits" },
  { label: "Fraud Shield", href: "/solutions#produits" },
  { label: "RBI Score", href: "/developers" },
  { label: "Wouaka Watch", href: "/solutions#produits" },
];

const footerSolutions = [
  { label: "Pour les Banques", href: "/solutions#banques" },
  { label: "Pour les Fintech", href: "/solutions#fintech" },
  { label: "Pour les IMF", href: "/solutions#microfinance" },
  { label: "Pour les Télécoms", href: "/solutions#telecoms" },
];

const footerResources = [
  { label: "Hub Développeurs", href: "/developers" },
  { label: "Documentation API", href: "/api-docs" },
  { label: "Tarifs", href: "/pricing" },
  { label: "Comparatif vs Traditionnels", href: "/vs-traditional" },
  { label: "Notre Impact", href: "/impact" },
];

const footerLegal = [
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Mentions légales", href: "/legal" },
  { label: "Confidentialité", href: "/privacy" },
  { label: "CGU", href: "/terms" },
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
    <footer className="bg-[#1c3d5a] text-white" role="contentinfo" aria-label="Pied de page Wouaka">
      {/* CTA Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Prêt à scorer l'invisible ?</h3>
              <p className="text-white/70">Essai gratuit 14 jours. Intégration en 48 heures.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-[#e8b93a] text-[#1c3d5a] hover:bg-[#d4a832] gap-2" asChild>
                <Link to="/developers">
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="/contact">Parler à un expert</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand */}
          <div className="lg:col-span-1 md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-6 group" aria-label="Wouaka - Retour à l'accueil">
              <img src={logoWouaka} alt="Logo Wouaka" className="w-12 h-12 rounded-xl transition-transform group-hover:scale-105" />
              <span className="text-2xl font-bold tracking-tight">Wouaka</span>
            </Link>
            
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Le scoring de crédit pour 100% des Africains. Pas seulement les 15% bancarisés. 
              Données alternatives, IA africaine, inclusion financière réelle.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 text-sm">
                <Building2 className="w-4 h-4 mt-0.5 text-[#e8b93a] shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-white">Inopay Group SARL</p>
                  <p className="text-white/70">RCCM : CI-ABJ-03-2023-B13-03481</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-[#e8b93a] shrink-0" aria-hidden="true" />
                <span className="text-white/80">27 BP 148 Abidjan 27, Côte d'Ivoire</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-[#e8b93a] shrink-0" aria-hidden="true" />
                <a href="tel:+2250701238974" className="text-white/80 hover:text-[#e8b93a] transition-colors">
                  +225 07 01 23 89 74
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-[#e8b93a] shrink-0" aria-hidden="true" />
                <a href="mailto:contact@wouaka-creditscore.com" className="text-white/80 hover:text-[#e8b93a] transition-colors">
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
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#e8b93a] hover:text-[#1c3d5a] transition-all duration-300"
                  aria-label={social.ariaLabel}
                >
                  <social.icon className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Produits</h3>
            <nav aria-label="Produits Wouaka">
              <ul className="space-y-3">
                {footerProducts.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-white/70 hover:text-[#e8b93a] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Solutions</h3>
            <nav aria-label="Solutions Wouaka">
              <ul className="space-y-3">
                {footerSolutions.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-white/70 hover:text-[#e8b93a] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Ressources</h3>
            <nav aria-label="Ressources Wouaka">
              <ul className="space-y-3">
                {footerResources.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-white/70 hover:text-[#e8b93a] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Entreprise</h3>
            <nav aria-label="Informations légales">
              <ul className="space-y-3">
                {footerLegal.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-white/70 hover:text-[#e8b93a] transition-colors">
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
      <div className="bg-[#152c42] border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-white/60 text-center leading-relaxed max-w-4xl mx-auto">
            <strong className="text-white/80">Important :</strong> Wouaka est une plateforme de Inopay Group SARL. 
            Nous ne sommes pas un établissement financier et n'octroyons pas de crédits. 
            Nos analyses constituent une aide à la décision et ne garantissent pas l'obtention d'un financement.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-[#0f1f2e]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/50">© {currentYear} Wouaka — Tous droits réservés.</p>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-[#e8b93a]" aria-hidden="true" />
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