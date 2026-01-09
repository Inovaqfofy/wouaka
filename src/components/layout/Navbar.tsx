import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Target, Building2, Smartphone, Eye, AlertTriangle, Zap, Users, Code2, BarChart3, Fingerprint, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import logoWouaka from "@/assets/logo-wouaka.png";

const productLinks = [
  { 
    label: "Inclusion Score", 
    href: "/scoring", 
    icon: Target,
    description: "Le score pour les non-bancarisés",
    badge: "Phare"
  },
  { 
    label: "Pre-Check", 
    href: "/developers#precheck", 
    icon: Zap,
    description: "Pré-scoring instantané < 2s"
  },
  { 
    label: "Identity Check (KYC)", 
    href: "/kyc", 
    icon: Fingerprint,
    description: "Vérification d'identité KYC"
  },
  { 
    label: "Comprendre les scores", 
    href: "/score-education", 
    icon: GraduationCap,
    description: "Guide d'interprétation des scores"
  },
  { 
    label: "Tous nos produits", 
    href: "/solutions#produits", 
    icon: BarChart3,
    description: "Business Score, Agent Mobile, Watch..."
  },
];

const solutionLinks = [
  { 
    label: "Banques & Institutions", 
    href: "/solutions#banques", 
    icon: Building2,
    description: "Scoring et conformité pour banques"
  },
  { 
    label: "Fintech & Startups", 
    href: "/solutions#fintech", 
    icon: Zap,
    description: "API rapide pour flux digitaux"
  },
  { 
    label: "Microfinance & IMF", 
    href: "/solutions#microfinance", 
    icon: Users,
    description: "Inclusion financière à grande échelle"
  },
];

const resourceLinks = [
  { label: "Documentation API", href: "/api-docs" },
  { label: "Hub Développeurs", href: "/developers" },
  { label: "Comparatif vs Traditionnels", href: "/vs-traditional" },
  { label: "Notre Impact", href: "/impact" },
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const dashboardLinks = [
  { label: "Tableau de bord", href: "/dashboard/enterprise" },
  { label: "Mon compte", href: "/profile" },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("#")[0]);
  };

  const closeAllMenus = () => {
    setProductsOpen(false);
    setSolutionsOpen(false);
    setResourcesOpen(false);
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
          {/* Produits Mega Menu */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setProductsOpen(!productsOpen); }}
              onBlur={() => setTimeout(() => setProductsOpen(false), 200)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
            >
              Produits
              <ChevronDown className={`w-4 h-4 transition-transform ${productsOpen ? "rotate-180" : ""}`} />
            </button>
            
            {productsOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl py-2 animate-scale-in z-50">
                <div className="px-4 py-2 border-b border-border mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nos produits</p>
                </div>
                {productLinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    to={link.href}
                    onClick={() => setProductsOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <link.icon className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{link.label}</span>
                        {link.badge && (
                          <span className="px-1.5 py-0.5 text-xs bg-secondary/20 text-secondary rounded">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                    </div>
                  </Link>
                ))}
                <div className="px-4 py-3 border-t border-border mt-2">
                  <Link 
                    to="/pricing" 
                    onClick={() => setProductsOpen(false)}
                    className="text-sm text-secondary hover:underline flex items-center gap-1"
                  >
                    Voir tous les tarifs <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Solutions Mega Menu */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setSolutionsOpen(!solutionsOpen); }}
              onBlur={() => setTimeout(() => setSolutionsOpen(false), 200)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
            >
              Solutions
              <ChevronDown className={`w-4 h-4 transition-transform ${solutionsOpen ? "rotate-180" : ""}`} />
            </button>
            
            {solutionsOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl py-2 animate-scale-in z-50">
                <div className="px-4 py-2 border-b border-border mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Par secteur</p>
                </div>
                {solutionLinks.map((link) => (
                  <Link
                    key={link.href + link.label}
                    to={link.href}
                    onClick={() => setSolutionsOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <link.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">{link.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                    </div>
                  </Link>
                ))}
                <div className="px-4 py-3 border-t border-border mt-2">
                  <Link 
                    to="/solutions" 
                    onClick={() => setSolutionsOpen(false)}
                    className="text-sm text-secondary hover:underline flex items-center gap-1"
                  >
                    Voir toutes les solutions <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Développeurs */}
          <Link
            to="/developers"
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
              isActive("/developers")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              Développeurs
            </span>
          </Link>

          {/* Tarifs */}
          <Link
            to="/pricing"
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
              isActive("/pricing")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Tarifs
          </Link>
          
          {/* Ressources Dropdown */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setResourcesOpen(!resourcesOpen); }}
              onBlur={() => setTimeout(() => setResourcesOpen(false), 200)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
            >
              Ressources
              <ChevronDown className={`w-4 h-4 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} />
            </button>
            
            {resourcesOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl py-2 animate-scale-in z-50">
                {resourceLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setResourcesOpen(false)}
                    className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
                <Link to="/developers">
                  <Code2 className="w-4 h-4" />
                  Essai gratuit
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
            {/* Produits Section */}
            <div className="pb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">Produits</p>
              {productLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  <link.icon className="w-4 h-4 text-secondary" />
                  {link.label}
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-xs bg-secondary/20 text-secondary rounded ml-auto">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            
            {/* Solutions Section */}
            <div className="border-t border-border pt-2 pb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">Solutions</p>
              {solutionLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  <link.icon className="w-4 h-4 text-primary" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Resources Section */}
            <div className="border-t border-border pt-2 pb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">Ressources</p>
              <Link
                to="/developers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                <Code2 className="w-4 h-4" />
                Développeurs
              </Link>
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-2.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                <BarChart3 className="w-4 h-4" />
                Tarifs
              </Link>
              {resourceLinks.slice(2).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {user && (
              <div className="border-t border-border pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">Mon espace</p>
                {dashboardLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border">
              {user ? (
                <>
                  <NotificationDropdown />
                  <UserMenu />
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
                  </Button>
                  <Button variant="default" size="sm" className="flex-1 gap-2" asChild>
                    <Link to="/developers" onClick={() => setMobileMenuOpen(false)}>
                      <Code2 className="w-4 h-4" />
                      Essai gratuit
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};