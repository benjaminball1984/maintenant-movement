-- Migration 035 : dates de lancement et d'échéance des pétitions.
--
-- Contexte (chantier 13.2) : l'équipe (admin/modération) doit pouvoir
-- éditer une pétition, y compris ses dates. Jusqu'ici la table `petition`
-- ne portait aucune date métier : seulement `created_at` (date technique
-- de création de l'enregistrement) et `modere_le` (date de décision de
-- modération). On ajoute deux dates métier, toutes deux optionnelles :
--
--   - `date_lancement` : début « officiel » de la campagne. Distincte de
--     `created_at`. Sert aussi à reprendre fidèlement les pétitions
--     historiques importées (Base44 fournit `date_lancement`).
--   - `date_echeance`  : date limite affichée publiquement (« jusqu'au … »).
--
-- Les deux restent NULL par défaut : aucune pétition existante n'est
-- impactée, et une pétition sans échéance reste valide (campagne ouverte).

alter table public.petition
  add column if not exists date_lancement timestamptz,
  add column if not exists date_echeance timestamptz;

comment on column public.petition.date_lancement is
  'Début officiel de la campagne (optionnel, éditable par l''équipe). Distinct de created_at.';
comment on column public.petition.date_echeance is
  'Date limite de la pétition, affichée publiquement (optionnel, éditable par l''équipe).';

-- Cohérence : si les deux dates sont posées, l'échéance ne peut pas
-- précéder le lancement. Tolère les NULL (l'une, l'autre, ou les deux).
alter table public.petition
  drop constraint if exists petition_dates_coherentes;
alter table public.petition
  add constraint petition_dates_coherentes
    check (
      date_echeance is null
      or date_lancement is null
      or date_echeance >= date_lancement
    );

-- Index partiel pour retrouver vite les pétitions dont l'échéance approche
-- (usage futur : relances, tri, mise en avant). Sans coût sur les lignes
-- sans échéance.
create index if not exists petition_echeance_idx
  on public.petition (date_echeance)
  where date_echeance is not null;
