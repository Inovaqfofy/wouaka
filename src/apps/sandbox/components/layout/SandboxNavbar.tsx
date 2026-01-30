import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Menu, 
  X, 
  Code2, 
  Play, 
  Activity, 
  Webhook,
  FileJson,
  ExternalLink,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logoWouaka from "@/assets/logo-wouaka.png";
import { getMainSiteUrl, SANDBOX_CONFIG } from "../../lib/sandbox-config";

const navItems = [
  { label: "Documentation", href: "/", icon: Code2 },
  { label: "Sandbox", href: "/sandbox", icon: Play },
  { label: "Status", href: "/status", icon: Activity },
  { label: "Webhooks", href: "/webhooks", icon: Webhook },
  { label: "API Reference", href: "/api-reference", icon: FileJson },
];

export const SandboxNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0A3D2C] border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Branding */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logoWouaka} alt="Wouaka" className="h-8 w-auto" />
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold hidden sm:inline">Developer</span>
                <Badge variant="outline" className="border-[#D4A017] text-[#D4A017] text-xs">
                  v{SANDBOX_CONFIG.version}
                </Badge>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:flex"
              asChild
            >
              <a href={getMainSiteUrl()} target="_blank" rel="noopener noreferrer">
                <Home className="w-4 h-4 mr-2" />
                Site principal
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
            <Button
              size="sm"
              className="bg-[#D4A017] text-[#0A3D2C] hover:bg-[#D4A017]/90"
              asChild
            >
              <a href={getMainSiteUrl("/auth?mode=signup&role=PARTENAIRE")}>
                Créer un compte
              </a>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#0A3D2C]">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <a
              href={getMainSiteUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5"
            >
              <Home className="w-5 h-5" />
              Site principal
              <ExternalLink className="w-4 h-4 ml-auto" />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
