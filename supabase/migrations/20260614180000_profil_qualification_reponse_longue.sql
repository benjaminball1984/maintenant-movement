-- ============================================================
-- Choix multiple dans le questionnaire de profil (Ben 2026-06-14) : une
-- réponse à choix multiple stocke toutes les options choisies, jointes par
-- « | ». Avec des options longues (formes d'engagement, confiance dans les
-- institutions…), la concaténation dépasse l'ancienne limite de 400 caractères.
-- On relève le plafond à 2000.
-- ============================================================

alter table public.profil_qualification
  drop constraint if exists profil_qualification_reponse_longueur;

alter table public.profil_qualification
  add constraint profil_qualification_reponse_longueur
  check (char_length(reponse) between 1 and 2000);
