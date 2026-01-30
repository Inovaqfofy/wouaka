import { Shield, Building, User, ChartBar, Code, type LucideIcon } from "lucide-react";

// ============================================================
// SINGLE SOURCE OF TRUTH FOR ROLES
// ============================================================
// All role-related constants and types are defined here.
// Import from this file instead of defining locally.
// ============================================================

// Active roles in the current system
export const ACTIVE_ROLES = ['SUPER_ADMIN', 'PARTENAIRE', 'EMPRUNTEUR'] as const;

// Legacy roles (for backward compatibility with existing users)
export const LEGACY_ROLES = ['ANALYSTE', 'ENTREPRISE', 'API_CLIENT'] as const;

// All roles combined
export const ALL_ROLES = [...ACTIVE_ROLES, ...LEGACY_ROLES] as const;

// Type for all roles
export type AppRole = typeof ALL_ROLES[number];

// Roles available for admin invitation
export const INVITABLE_ROLES: readonly AppRole[] = ['SUPER_ADMIN', 'PARTENAIRE', 'EMPRUNTEUR'] as const;

// Roles available for public signup (no SUPER_ADMIN)
export const SIGNUP_ROLES = ['PARTENAIRE', 'EMPRUNTEUR'] as const;
export type SignupRole = typeof SIGNUP_ROLES[number];

// ============================================================
// LABELS & DESCRIPTIONS
// ============================================================

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PARTENAIRE: "Institution Financière",
  EMPRUNTEUR: "Particulier",
  // Legacy
  ANALYSTE: "Analyste (legacy)",
  ENTREPRISE: "Entreprise (legacy)",
  API_CLIENT: "API Client (legacy)",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  SUPER_ADMIN: "Accès complet à l'administration du système",
  PARTENAIRE: "Banque, IMF, fintech – reçoit les dossiers de preuves",
  EMPRUNTEUR: "Certifie sa solvabilité et partage son dossier",
  // Legacy
  ANALYSTE: "Rôle legacy - équivalent Partenaire",
  ENTREPRISE: "Rôle legacy - équivalent Partenaire",
  API_CLIENT: "Rôle legacy - équivalent Partenaire",
};

// Signup-specific labels with more detail
export const SIGNUP_ROLE_LABELS: Record<SignupRole, { label: string; description: string }> = {
  EMPRUNTEUR: { 
    label: 'Particulier (Emprunteur)', 
    description: 'Je veux certifier ma solvabilité et partager mon dossier',
  },
  PARTENAIRE: { 
    label: 'Institution Financière', 
    description: 'Banque, IMF, fintech – je veux recevoir des dossiers de preuves',
  },
};

// ============================================================
// VISUAL CONFIG (badges, icons, colors)
// ============================================================

export const ROLE_CONFIG: Record<AppRole, { 
  variant: "destructive" | "secondary" | "default" | "outline";
  icon: LucideIcon;
  color: string;
}> = {
  SUPER_ADMIN: { variant: "destructive", icon: Shield, color: "bg-red-500" },
  PARTENAIRE: { variant: "default", icon: Building, color: "bg-green-500" },
  EMPRUNTEUR: { variant: "secondary", icon: User, color: "bg-blue-500" },
  // Legacy
  ANALYSTE: { variant: "outline", icon: ChartBar, color: "bg-gray-500" },
  ENTREPRISE: { variant: "outline", icon: Building, color: "bg-gray-500" },
  API_CLIENT: { variant: "outline", icon: Code, color: "bg-gray-500" },
};

// ============================================================
// DASHBOARD ROUTES
// ============================================================

export const DASHBOARD_ROUTES: Record<AppRole, string> = {
  SUPER_ADMIN: '/dashboard/admin',
  PARTENAIRE: '/dashboard/partner',
  EMPRUNTEUR: '/dashboard/borrower',
  // Legacy roles redirect to partner
  ANALYSTE: '/dashboard/partner',
  ENTREPRISE: '/dashboard/partner',
  API_CLIENT: '/dashboard/partner',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function isActiveRole(role: string): role is typeof ACTIVE_ROLES[number] {
  return (ACTIVE_ROLES as readonly string[]).includes(role);
}

export function isLegacyRole(role: string): role is typeof LEGACY_ROLES[number] {
  return (LEGACY_ROLES as readonly string[]).includes(role);
}

export function getRoleLabel(role: AppRole): string {
  return ROLE_LABELS[role] || role;
}

export function getRoleDescription(role: AppRole): string {
  return ROLE_DESCRIPTIONS[role] || '';
}
