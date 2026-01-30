import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  Key, 
  Webhook, 
  Terminal, 
  AlertCircle, 
  Clock, 
  Shield, 
  Play,
  ChevronDown,
  ChevronRight,
  FileCode,
  Database,
  Zap,
  Search,
  X,
  Activity,
  TestTube,
  Moon,
  Sun,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ApiStatusWidget } from "./ApiStatusWidget";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
  keywords?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "Introduction",
    items: [
      { id: "quickstart", label: "Quick Start", icon: Zap, keywords: ["démarrer", "commencer", "introduction", "guide"] },
      { id: "auth", label: "Authentification", icon: Key, keywords: ["jwt", "bearer", "token", "oauth", "api key", "clé"] },
      { id: "sdk", label: "Installation SDK", icon: Terminal, keywords: ["npm", "pip", "composer", "package", "install"] },
    ]
  },
  {
    title: "Endpoints",
    items: [
      { id: "scoring", label: "Scoring API", icon: Database, keywords: ["score", "crédit", "risque", "calcul"] },
      { id: "kyc", label: "Vérification API", icon: Shield, keywords: ["kyc", "identité", "vérification", "document"] },
      { id: "endpoints", label: "Référence complète", icon: FileCode, keywords: ["api", "endpoint", "route", "post", "get"] },
    ]
  },
  {
    title: "Webhooks",
    items: [
      { id: "webhooks", label: "Configuration", icon: Webhook, keywords: ["webhook", "callback", "notification", "événement"] },
      { id: "webhook-manager", label: "Gestionnaire", icon: Settings, href: "/developer/webhooks", badge: "Nouveau", badgeVariant: "secondary" },
      { id: "signatures", label: "Signatures HMAC", icon: Shield, keywords: ["hmac", "signature", "sécurité", "vérification"] },
    ]
  },
  {
    title: "Sandbox",
    items: [
      { id: "sandbox", label: "Console de test", icon: Play, href: "/developer/sandbox", badge: "Live", badgeVariant: "default" },
      { id: "magic-numbers", label: "Numéros magiques", icon: TestTube, href: "/developer/sandbox#magic", keywords: ["test", "mock", "simulation"] },
    ]
  },
  {
    title: "Référence",
    items: [
      { id: "errors", label: "Codes d'erreur", icon: AlertCircle, keywords: ["erreur", "error", "code", "http", "status"] },
      { id: "ratelimits", label: "Rate Limits", icon: Clock, keywords: ["limite", "quota", "throttle", "requête"] },
      { id: "status", label: "Status API", icon: Activity, href: "/developer/status", keywords: ["uptime", "santé", "disponibilité"] },
    ]
  },
];

interface DeveloperSidebarProps {
  activeSection?: string;
  onSectionClick?: (id: string) => void;
}

export const DeveloperSidebar = ({ activeSection, onSectionClick }: DeveloperSidebarProps) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(sections.map(s => s.title));
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleItemClick = (item: NavItem) => {
    if (item.href) {
      // Navigate handled by Link
    } else if (onSectionClick) {
      onSectionClick(item.id);
    }
  };

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    
    const query = searchQuery.toLowerCase();
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.keywords?.some(k => k.toLowerCase().includes(query))
      )
    })).filter(section => section.items.length > 0);
  }, [searchQuery]);

  const clearSearch = () => setSearchQuery("");

  return (
    <aside className="w-64 flex-shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto border-r border-border bg-card/50 hidden lg:block">
      <div className="p-4">
        {/* Logo / Title */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">Documentation</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">API WOUAKA v2.0</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm bg-muted/50 border-muted focus:border-primary"
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Count */}
        {searchQuery && (
          <div className="mb-4 text-xs text-muted-foreground">
            {filteredSections.reduce((acc, s) => acc + s.items.length, 0)} résultat(s) pour "{searchQuery}"
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-4">
          {filteredSections.map((section) => (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full py-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {section.title}
                {expandedSections.includes(section.title) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
              
              {expandedSections.includes(section.title) && (
                <div className="space-y-1 mt-1">
                  {section.items.map((item) => {
                    const isActive = activeSection === item.id || (item.href && location.pathname === item.href);
                    const Icon = item.icon;
                    
                    const content = (
                      <div
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer",
                          isActive 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge 
                            variant={item.badgeVariant || "secondary"} 
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              item.badge === "Live" && "bg-secondary text-secondary-foreground",
                              item.badge === "Nouveau" && "bg-primary/20 text-primary border-primary/30"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    );

                    if (item.href) {
                      return (
                        <Link key={item.id} to={item.href}>
                          {content}
                        </Link>
                      );
                    }

                    return <div key={item.id}>{content}</div>;
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Status Widget */}
        <div className="mt-8 pt-6 border-t">
          <ApiStatusWidget compact />
        </div>

        {/* Version Info */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Version 2.0.0</span>
            <a href="#changelog" className="text-primary hover:underline">Changelog</a>
          </div>
        </div>
      </div>
    </aside>
  );
};
