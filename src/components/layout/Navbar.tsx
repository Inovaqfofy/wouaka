import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Wallet, Building2, DollarSign, MessageSquare, Code2, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoWouaka from "@/assets/logo-wouaka.png";

// Dropdown menus structure
const solutionsMenu = [
  { label: "API Scoring & KYC", href: "/partenaires", icon: Building2, description: "Pour institutions financières" },
  { label: "Conformité", href: "/compliance", icon: Shield, description: "Sécurité et réglementations" },
];

const developerMenu = [
  { label: "Documentation API", href: "https://sandbox.wouaka-creditscore.com/", icon: Code2, description: "Guides et références", external: true },
  { label: "Tarifs API", href: "/pricing", icon: DollarSign, description: "Plans et tarification" },
];

// Simple links (no dropdown)
const simpleLinks = [
  { label: "Marketplace", href: "/marketplace", icon: Wallet },
  { label: "Contact", href: "/contact", icon: MessageSquare },
];

// All links for mobile
const allMobileLinks = [
  { label: "Solutions", href: "/partenaires", icon: Building2, description: "API de scoring et KYC" },
  { label: "Conformité", href: "/compliance", icon: Shield, description: "Sécurité et réglementations" },
  { label: "Marketplace", href: "/marketplace", icon: Wallet, description: "Offres de financement" },
  { label: "Développeurs", href: "https://sandbox.wouaka-creditscore.com/", icon: Code2, description: "Documentation API", external: true },
  { label: "Tarifs", href: "/pricing", icon: DollarSign, description: "Plans et tarification" },
  { label: "Contact", href: "/contact", icon: MessageSquare, description: "Parlez à notre équipe" },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("#")[0]);
  };

  return (
    <header className="navbar-premium">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src={logoWouaka} alt="Wouaka" className="w-12 h-12 rounded-lg" />
          <span className="font-bold text-xl text-foreground hidden sm:block">Wouaka</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Solutions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
              <Building2 className="w-4 h-4" />
              Solutions
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-card border border-border z-50">
              {solutionsMenu.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link to={item.href} className="flex items-start gap-3 p-3 cursor-pointer">
                    <item.icon className="w-4 h-4 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Simple Links */}
          {simpleLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                isActive(link.href)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}

          {/* Developers Dropdown - At the end before auth */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
              <Code2 className="w-4 h-4" />
              Développeurs
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-card border border-border z-50">
              {developerMenu.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link to={item.href} className="flex items-start gap-3 p-3 cursor-pointer">
                    <item.icon className="w-4 h-4 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {loading ? (
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              <NotificationDropdown />
              <UserMenu />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Connexion</Link>
              </Button>
              <Button variant="default" size="sm" className="gap-2" asChild>
                <Link to="/auth?mode=signup">
                  Créer un compte
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-foreground"
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-slide-down max-h-[80vh] overflow-y-auto">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {allMobileLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-3 text-sm font-medium transition-colors rounded-lg ${
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <link.icon className="w-5 h-5" />
                <div>
                  <p className="font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
              </Link>
            ))}

            <div className="border-t border-border my-4" />

            {user ? (
              <div className="flex items-center gap-3">
                <NotificationDropdown />
                <UserMenu />
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button variant="default" size="sm" className="flex-1" asChild>
                  <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                    S'inscrire
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
