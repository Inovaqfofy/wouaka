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
  CreditCard,
  QrCode,
  Award,
  TrendingUp,
  Shield,
  Activity,
  Brain,
  AlertTriangle,
  Power,
  Radio,
  FlaskConical,
  Headphones
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import logoWouaka from "@/assets/logo-wouaka.png";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { UserMenu } from "@/components/auth/UserMenu";
import { ROLE_LABELS, ROLE_CONFIG, type AppRole } from "@/lib/roles";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "partner" | "borrower";
  title: string;
}

// Mapping from dashboard role to AppRole
const dashboardRoleToAppRole: Record<"admin" | "partner" | "borrower", AppRole> = {
  admin: "SUPER_ADMIN",
  partner: "PARTENAIRE",
  borrower: "EMPRUNTEUR",
};

const menuItems = {
  admin: [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/admin" },
    { icon: TrendingUp, label: "Analytics", href: "/dashboard/admin/analytics" },
    { icon: Users, label: "Utilisateurs", href: "/dashboard/admin/users" },
    { icon: Building2, label: "Organisations", href: "/dashboard/admin/organizations" },
    { icon: Key, label: "Clés API", href: "/dashboard/admin/api-keys" },
    { icon: FileCheck, label: "KYC Validations", href: "/dashboard/admin/kyc" },
    { icon: Award, label: "Certifications", href: "/dashboard/admin/certificates" },
    { icon: AlertTriangle, label: "AML/Sanctions", href: "/dashboard/admin/aml" },
    { icon: Store, label: "Marketplace", href: "/dashboard/admin/marketplace" },
    { icon: CreditCard, label: "Facturation", href: "/dashboard/admin/billing" },
    { icon: Webhook, label: "Webhooks", href: "/dashboard/admin/webhooks" },
    { icon: FileText, label: "Logs d'audit", href: "/dashboard/admin/logs" },
    { icon: Activity, label: "Monitoring", href: "/dashboard/admin/monitoring" },
    { icon: Brain, label: "IA & Modèles", href: "/dashboard/admin/ai-monitoring" },
    { icon: Shield, label: "Security Watch", href: "/dashboard/admin/security" },
    { icon: Power, label: "Kill Switch", href: "/dashboard/admin/emergency" },
    { icon: Radio, label: "Lockdown Monitor", href: "/dashboard/admin/lockdown-monitor" },
    { icon: FlaskConical, label: "Tests Sécurité", href: "/dashboard/admin/security-tests" },
    { icon: Headphones, label: "Support", href: "/dashboard/admin/support" },
    { icon: Settings, label: "Paramètres", href: "/dashboard/admin/settings" },
  ],
  partner: [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/partner" },
    { icon: QrCode, label: "Valider un certificat", href: "/dashboard/partner/validate" },
    { icon: FileCheck, label: "Dossiers Reçus", href: "/dashboard/partner/evaluations" },
    { icon: Users, label: "Mes Clients", href: "/dashboard/partner/clients" },
    { icon: FileText, label: "Mes Offres", href: "/dashboard/partner/offers" },
    { icon: Users, label: "Candidatures", href: "/dashboard/partner/applications" },
    { icon: Key, label: "API & Webhooks", href: "/dashboard/partner/api-keys" },
    { icon: BarChart3, label: "Utilisation API", href: "/dashboard/partner/api-usage" },
    { icon: CreditCard, label: "Facturation", href: "/dashboard/partner/billing" },
    { icon: Settings, label: "Paramètres", href: "/dashboard/partner/settings" },
  ],
  borrower: [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/borrower" },
    { icon: BarChart3, label: "Mon Certificat", href: "/dashboard/borrower/score" },
    { icon: FileText, label: "Mes Preuves", href: "/dashboard/borrower/documents" },
    { icon: FileCheck, label: "Mes Candidatures", href: "/dashboard/borrower/applications" },
    { icon: Store, label: "Offres Disponibles", href: "/dashboard/borrower/offers" },
    { icon: Users, label: "Mon Profil", href: "/dashboard/borrower/profile" },
    { icon: Headphones, label: "Support", href: "/dashboard/borrower/support" },
  ],
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
            <Badge variant={ROLE_CONFIG[dashboardRoleToAppRole[role]].variant} className="w-full justify-center">
              {ROLE_LABELS[dashboardRoleToAppRole[role]]}
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
              <Badge variant={ROLE_CONFIG[dashboardRoleToAppRole[role]].variant} className="w-full justify-center">
                {ROLE_LABELS[dashboardRoleToAppRole[role]]}
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
