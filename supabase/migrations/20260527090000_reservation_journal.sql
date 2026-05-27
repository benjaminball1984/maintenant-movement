-- Table `reservation_journal` : journal applicatif des transitions de
-- statut sur `reservation` (cycle V2 D8bis, chantier V2.3.15).
--
-- Doctrine V2 D8bis « cycle ouvert/fermé observable des deux côtés » :
-- demandeur et propriétaire doivent pouvoir lire l'historique complet des
-- changements de statut d'une réservation. La colonne `motif_decision`
-- sur `reservation` ne garde qu'un seul motif (le dernier), ce qui
-- masque les transitions intermédiaires.
--
-- Insertion applicative (depuis `lib/reservation.ts:changerStatutReservation`)
-- plutôt que via trigger SQL : ça nous permet de capturer l'identité de
-- l'auteur (qui ne remonte pas dans un trigger AFTER UPDATE).
--
-- Doctrine de greffe V2 : on n'ajoute PAS de colonne à `reservation`
-- (greffe additive séparée). La table est en pure annexe lecture.
--
-- À appliquer avec `supabase db push`. Non appliquée distant cette nuit
-- (consigne « pas de touche au distant Supabase »).

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.reservation_journal (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservation(id) on delete cascade,
  statut_avant text not null check (statut_avant in (
    'proposee', 'acceptee', 'refusee', 'realisee', 'confirmee', 'annulee', 'litige'
  )),
  statut_apres text not null check (statut_apres in (
    'proposee', 'acceptee', 'refusee', 'realisee', 'confirmee', 'annulee', 'litige'
  )),
  motif text,
  -- Personne à l'origine de la transition. Peut être null si transition
  -- système (par exemple expiration automatique). On laisse la FK
  -- pointer vers `auth.users` plutôt que `personne` pour rester
  -- aligné avec les autres journaux V2.
  auteur_id uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

comment on table public.reservation_journal is
  'Journal des transitions de statut sur reservation (D8bis). Inséré applicativement par lib/reservation.ts:changerStatutReservation. Lecture pour demandeur + propriétaire + admins.';

-- ============================================================
-- Index
-- ============================================================
create index if not exists reservation_journal_reservation_idx
  on public.reservation_journal (reservation_id, changed_at);

-- ============================================================
-- RLS
-- ============================================================
alter table public.reservation_journal enable row level security;

-- Lecture : on s'aligne sur la RLS de `reservation`. Demandeur autorisé,
-- admins autorisés. Le propriétaire de l'offre n'a pas de référence
-- directe ici (la FK polymorphe est sur `reservation`) ; on lit donc
-- côté Server Action après vérification applicative pour cas
-- propriétaire (comme on fait déjà sur `reservation` côté listage propre).
drop policy if exists "reservation_journal_select_demandeur_admin" on public.reservation_journal;
create policy "reservation_journal_select_demandeur_admin"
  on public.reservation_journal
  for select
  using (
    exists (
      select 1
      from public.reservation r
      where r.id = reservation_journal.reservation_id
        and (
          r.demandeur_personne_id = auth.uid()
          or public.est_admin_general()
          or public.est_moderateurice('autres-moyens')
        )
    )
  );

-- Insertion : interdite via client. Seules les Server Actions via le
-- service_role peuvent insérer (cohérence avec `changerStatutReservation`
-- qui contourne déjà la RLS pour les transitions avancées).
drop policy if exists "reservation_journal_insert_blocked" on public.reservation_journal;
create policy "reservation_journal_insert_blocked"
  on public.reservation_journal
  for insert
  with check (false);

-- Pas de UPDATE / DELETE : un journal est immuable.
