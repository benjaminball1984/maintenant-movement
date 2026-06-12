-- Migration : qualification progressive du profil (sondages V2 §6-§7,
-- précisée par Ben le 2026-06-12).
--
-- Après un vote, la personne se voit proposer UNE question du panel de
-- qualification (CDC sondages-V2.md §7), puis une autre automatiquement
-- après chaque réponse, jusqu'à « C'est tout pour aujourd'hui ». Les
-- réponses construisent un profil sociodémographique NON PUBLIC, utilisé
-- uniquement pour le redressement par quotas des sondages.
--
-- Données sensibles (Q15/Q16 = opinions politiques) : table à part,
-- RLS stricte (chaque personne ne voit QUE ses réponses ; aucun accès
-- admin direct : les agrégats passeront par la « boîte noire » dédiée,
-- toujours agrégée, cf. CDC §5 et points Légicoop).

create table public.profil_qualification (
  id uuid primary key default gen_random_uuid(),

  personne_id uuid not null references public.personne(id) on delete cascade,

  -- Clé de la question du panel (référentiel applicatif
  -- lib/sondages/qualification.ts : 'csp', 'logement', 'genre', ...).
  question_cle text not null,

  -- Réponse retenue (libellé d'option, ou liste jointe par ' | ' pour les
  -- questions à choix multiple).
  reponse text not null,

  -- Second champ d'un même écran (Q22 : secteur de bénévolat).
  reponse_secondaire text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Jamais deux réponses pour la même question : la mise à jour remplace.
  constraint profil_qualification_unique unique (personne_id, question_cle),
  constraint profil_qualification_cle_format check (question_cle ~ '^[a-z0-9_]{2,60}$'),
  constraint profil_qualification_reponse_longueur check (char_length(reponse) between 1 and 400)
);

comment on table public.profil_qualification is
  'Qualification progressive du profil (sondages V2 §6-7). NON PUBLIC : sert uniquement au redressement par quotas. Accès strictement personnel via RLS ; agrégats via la future boîte noire admin (CDC §5).';

create index profil_qualification_personne_idx
  on public.profil_qualification (personne_id);

create trigger profil_qualification_updated_at
  before update on public.profil_qualification
  for each row
  execute function public.tg_set_updated_at();

alter table public.profil_qualification enable row level security;

-- Chaque personne ne lit et n'écrit QUE ses propres réponses. Pas de
-- policy admin : les croisements passeront par une couche agrégée dédiée.
create policy "profil_qualification_select"
  on public.profil_qualification for select
  using (personne_id = auth.uid());

create policy "profil_qualification_insert"
  on public.profil_qualification for insert
  with check (auth.uid() is not null and personne_id = auth.uid());

create policy "profil_qualification_update"
  on public.profil_qualification for update
  using (personne_id = auth.uid());
