-- ============================================================================
-- Revue 2026 (correctif C14) — Attributs D9 nommés sur signature_petition.
-- ============================================================================
--
-- Décision D9 (CDC schema-donnees-V2) : une signature compte dans le total
-- DÈS son insertion (avant confirmation d'email), et garde un snapshot probant
-- des champs saisis au moment T. Le comportement existait déjà (le compteur
-- `petition_compteur` compte toute ligne ; l'identité est capturée en colonnes) ;
-- on nomme ici explicitement les deux attributs du CDC pour lever l'écart.
--
-- Migration ADDITIVE : colonnes seulement, valeurs par défaut cohérentes avec
-- l'existant (compte_immediatement = true). Aucune donnée modifiée. Local d'abord.
-- ============================================================================

alter table public.signature_petition
  add column if not exists compte_immediatement boolean not null default true;

alter table public.signature_petition
  add column if not exists snapshot jsonb;

comment on column public.signature_petition.compte_immediatement is
  'D9 : la signature compte dans le total dès l''insertion (avant confirmation email). Défaut true.';
comment on column public.signature_petition.snapshot is
  'D9 : capture probante (JSON) des champs saisis au moment de la signature. Optionnel, rempli côté applicatif.';
