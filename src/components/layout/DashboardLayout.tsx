import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Search,
  Store,
  FileText,
  Webhook,
  Key,
  Building2,
  CreditCard
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import logoWouaka from "@/assets/logo-wouaka.png";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { UserMenu } from "@/components/auth/UserMenu";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "analyst" | "enterprise" | "api-client";
  title: string;
}

const menuItems = {
  admin: [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/admin" },
    { icon: Users, label: "Utilisateurs", href: "/dashboard/admin/users" },
    { icon: Building2, label: "Organisations", href: "/dashboard/admin/organizations" },
    { icon: Key, label: "Clés API", href: "/dashboard/admin/api-keys" },
    { icon: FileCheck, label: "KYC Validations", href: "/dashboard/admin/kyc" },
    { icon: BarChart3, label: "Scores", href: "/dashboard/admin/scores" },
    { icon: Store, label: "Marketplace", href: "/dashboard/admin/marketplace" },
    { icon: CreditCard, label: "Facturation", href: "/dashboard/admin/billing" },
    { icon: Webhook, label: "Webhooks", href: "/dashboard/admin/webhooks" },
    { icon: FileText, label: "Logs d'audit", href: "/dashboard/admin/logs" },
    { icon: Settings, label: "Paramètres", href: "/dashboard/admin/settings" },
  ],
  analyst: [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/analyst" },
    { icon: FileCheck, label: "KYC à valider", href: "/dashboard/analyst/kyc" },
    { icon: BarChart3, label: "Scores analysés", href: "/dashboard/analyst/scores" },
    { icon: Users, label: "Clients", href: "/dashboard/analyst/clients" },
    { icon: Store, label: "Produits financiers", href: "/dashboard/analyst/products" },
    { icon: FileText, label: "Rapports", href: "/dashboard/analyst/reports" },
    { icon: Settings, label: "Paramètres", href: "/dashboard/analyst/settings" },
  ],
  enterprise: [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/enterprise" },
    { icon: FileCheck, label: "Demandes de score", href: "/dashboard/enterprise/requests" },
    { icon: BarChart3, label: "Mes scores", href: "/dashboard/enterprise/scores" },
    { icon: Store, label: "Marketplace", href: "/dashboard/enterprise/marketplace" },
    { icon: CreditCard, label: "Facturation", href: "/dashboard/enterprise/billing" },
    { icon: Settings, label: "Paramètres", href: "/dashboard/enterprise/settings" },
  ],
  "api-client": [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/api-client" },
    { icon: Key, label: "Clés API", href: "/dashboard/api-client/keys" },
    { icon: BarChart3, label: "Utilisation", href: "/dashboard/api-client/usage" },
    { icon: Webhook, label: "Webhooks", href: "/dashboard/api-client/webhooks" },
    { icon: FileText, label: "Logs API", href: "/dashboard/api-client/logs" },
    { icon: CreditCard, label: "Facturation", href: "/dashboard/api-client/billing" },
    { icon: Settings, label: "Paramètres", href: "/dashboard/api-client/settings" },
  ],
};

const roleLabels = {
  admin: "Super Admin",
  analyst: "Analyste",
  enterprise: "Entreprise",
  "api-client": "API Client",
};

const roleBadgeVariants = {
  admin: "destructive" as const,
  analyst: "secondary" as const,
  enterprise: "default" as const,
  "api-client": "outline" as const,
};

export const DashboardLayout = ({ children, role, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  
  // Initialize real-time notifications
  useRealtimeNotifications();

  const items = menuItems[role];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-primary text-primary-foreground transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-primary-foreground/10">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoWouaka} alt="Wouaka" className="w-10 h-10 rounded-lg" />
            {sidebarOpen && (
              <span className="font-display text-lg font-bold">Wouaka</span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-primary-foreground/10">
            <Badge variant={roleBadgeVariants[role]} className="w-full justify-center">
              {roleLabels[role]}
            </Badge>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-primary-foreground/10"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-primary-foreground/10">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-foreground/10 transition-colors text-primary-foreground/70 hover:text-primary-foreground"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-foreground/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-primary text-primary-foreground flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-primary-foreground/10">
              <Link to="/" className="flex items-center gap-3">
                <img src={logoWouaka} alt="Wouaka" className="w-10 h-10 rounded-lg" />
                <span className="font-display text-lg font-bold">Wouaka</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-primary-foreground/10">
              <Badge variant={roleBadgeVariants[role]} className="w-full justify-center">
                {roleLabels[role]}
              </Badge>
            </div>
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              {items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-primary-foreground/10"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent border-none outline-none text-sm w-40"
              />
            </div>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <UserMenu variant="full" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
