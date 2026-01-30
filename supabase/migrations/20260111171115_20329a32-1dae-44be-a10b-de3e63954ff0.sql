-- Phase 1a: Ajouter les nouveaux rôles à l'enum app_role
-- Les nouvelles valeurs d'enum seront disponibles après cette migration

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'PARTENAIRE';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'EMPRUNTEUR';