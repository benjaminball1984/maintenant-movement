-- Table `consentement` : entité RGPD granulaire et révocable (cycle V2, D8).
--
-- Cycle V2 chantier V2.1.2. Implémente la décision D8 de
-- `docs/cdc-v2/CDC-Maintenant-V2/schema-donnees-V2.md` :
--
--   « Le consentement est granulaire et indépendant : chaque case = un
--    consentement distinct, traçable et révocable. »
--
-- Avant cette migration, les consentements étaient portés en dur par
-- deux booléens de `signature_petition` (`accepte_newsletter` et
-- `accepte_contact_createurice`). Ces colonnes sont CONSERVÉES (doctrine
-- de greffe, interdit n°1 : on ne soustrait jamais) : elles deviennent la
-- TRACE FIGÉE de l'état initial au moment de la signature (cohérent
-- avec le snapshot D9). La nouvelle table `consentement` porte l'état
-- VIVANT et RÉVOCABLE.
--
-- À appliquer avec `supabase db push` ou `scripts/appliquer-sql-distant.ts`.
-- DDL pur, sans PII directe. Le script de backfill associé est dans
-- `scripts/backfill-consentement.ts` (`--dry-run` obligatoire par défaut).

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.consentement (
  id uuid primary key default gen_random_uuid(),

  -- Identité durable de la personne qui donne (ou retire) le consentement.
  -- On utilise `profil_unifie` plutôt que `personne` (auth.users) pour couvrir
  -- aussi les signataires importé·es qui n'ont jamais créé de compte (cf.
  -- migration 038 `profil_unifie`).
  profil_unifie_id uuid not null
    references public.profil_unifie(id) on delete cascade,

  -- Type de consentement. Liste de référence fermée mais extensible (esprit
  -- D13 V2 : « listes de référence extensibles, jamais du champ libre »).
  -- Les valeurs initiales correspondent aux deux cases historiques + une
  -- valeur libre pour la future extension (sondages, dons, etc.).
  type_consentement text not null check (type_consentement in (
    'newsletter_plateforme',
    'contact_createur',
    'partage_donnees_anonymisees',
    'communications_thematique'
  )),

  -- Objet métier auquel ce consentement est rattaché, s'il y en a un :
  -- - `objet_type` = 'petition', `objet_id` = uuid de la pétition pour
  --   « contact_createur » (un consentement par pétition signée).
  -- - `objet_type` = null pour un consentement global (ex. la newsletter
  --   plateforme qui n'est rattachée à rien de précis).
  objet_type text check (
    objet_type is null or objet_type in (
      'petition', 'cagnotte', 'mobilisation', 'sondage', 'campagne', 'autre'
    )
  ),
  objet_id uuid,

  -- État courant du consentement. Une révocation = UPDATE de `valeur` à false,
  -- pas un DELETE (on garde la trace que le consentement a existé puis a été
  -- retiré, avec `updated_at`). C'est ce que demande la définition V2 « state
  -- vivant et révocable » : on lit la dernière valeur.
  valeur boolean not null,

  -- Date du consentement (recueilli OU révoqué). Recopiée depuis
  -- `signature_petition.created_at` lors du backfill ; remplie par
  -- `now()` à chaque mise à jour ensuite.
  date_consentement timestamptz not null default now(),

  -- Origine du consentement, pour audit et traçabilité RGPD. Liste de
  -- référence extensible. `backfill_signature_v1` désigne explicitement
  -- l'historisation des consentements des signatures V1.
  source text not null check (source in (
    'signature_petition_v1',
    'signature_petition_v2',
    'parametres_profil',
    'backfill_signature_v1',
    'import_base44'
  )),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Cohérence : si `objet_id` est rempli, `objet_type` doit l'être aussi.
  constraint consentement_objet_coherent
    check ((objet_type is null and objet_id is null) or (objet_type is not null and objet_id is not null))
);

comment on table public.consentement is
  'Consentement RGPD granulaire et révocable (cycle V2, D8). État vivant ; le snapshot figé reste dans signature_petition.';
comment on column public.consentement.valeur is
  'État courant. Révocation = UPDATE à false, pas DELETE (trace conservée).';
comment on column public.consentement.source is
  'Origine du consentement (audit RGPD). backfill_signature_v1 = importé des colonnes V1.';

-- ============================================================
-- Unicité : un seul consentement par (profil, type, objet) en vigueur.
-- ============================================================
-- On utilise un index unique sur l'expression `(profil, type, coalesce(objet_id, '00000000-...'))`
-- pour traiter NULL objet_id comme valeur distincte. Postgres ne considère
-- pas deux NULL comme égaux dans une contrainte UNIQUE classique, ce qui
-- créerait des doublons globaux pour les consentements non rattachés.
create unique index if not exists consentement_unique_par_cible
  on public.consentement (
    profil_unifie_id,
    type_consentement,
    coalesce(objet_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- Index recherche pour les lectures côté profil (« mes consentements »)
-- et côté pétition (« qui a accepté contact_createur sur cette pétition »).
create index if not exists consentement_profil_idx
  on public.consentement (profil_unifie_id);

create index if not exists consentement_objet_idx
  on public.consentement (objet_type, objet_id)
  where objet_id is not null;

create index if not exists consentement_type_idx
  on public.consentement (type_consentement, valeur);

-- ============================================================
-- Trigger : maintien automatique de `updated_at`
-- ============================================================
create or replace function public.consentement_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  -- Quand `valeur` change, on met aussi `date_consentement` à jour
  -- (la date d'accord ou de révocation la plus récente).
  if old.valeur is distinct from new.valeur then
    new.date_consentement := now();
  end if;
  return new;
end;
$$;

drop trigger if exists consentement_updated_at_trigger on public.consentement;
create trigger consentement_updated_at_trigger
  before update on public.consentement
  for each row
  execute function public.consentement_set_updated_at();

-- ============================================================
-- RLS : posée dans la migration même (cohérent avec le retour
-- d'expérience de la revue 21/05 qui pointait le défaut de la RLS
-- déportée dans une migration unique).
-- ============================================================
alter table public.consentement enable row level security;

-- Lecture : la personne voit ses propres consentements ; les admins voient
-- tout ; le créateur d'une pétition voit les consentements « contact_createur »
-- pour SA pétition (cas d'usage : exporter la liste des signataires
-- consentants — cohérent avec la policy lecture de signature_petition).
drop policy if exists "consentement_select_self_admin_createur" on public.consentement;
create policy "consentement_select_self_admin_createur"
  on public.consentement
  for select
  using (
    -- Sa propre ligne, via la liaison profil_unifie → personne.
    exists (
      select 1 from public.profil_unifie pu
      where pu.id = consentement.profil_unifie_id
        and pu.personne_id = auth.uid()
    )
    or public.est_admin_general()
    or public.est_moderateurice('petitions')
    -- Créateur de la pétition cible peut voir les consentements contact_createur
    -- sur sa pétition (cas export CSV).
    or (
      type_consentement = 'contact_createur'
      and valeur = true
      and objet_type = 'petition'
      and exists (
        select 1 from public.petition p
        where p.id = consentement.objet_id
          and p.createurice_id = auth.uid()
      )
    )
  );

-- Insertion : la personne peut créer ses propres consentements (via UI
-- profil ou flux de signature). Le backfill et l'import passent par le
-- service_role qui contourne la RLS.
drop policy if exists "consentement_insert_self" on public.consentement;
create policy "consentement_insert_self"
  on public.consentement
  for insert
  with check (
    exists (
      select 1 from public.profil_unifie pu
      where pu.id = consentement.profil_unifie_id
        and pu.personne_id = auth.uid()
    )
  );

-- Mise à jour : la personne peut modifier ses propres consentements
-- (révocation = update valeur à false).
drop policy if exists "consentement_update_self" on public.consentement;
create policy "consentement_update_self"
  on public.consentement
  for update
  using (
    exists (
      select 1 from public.profil_unifie pu
      where pu.id = consentement.profil_unifie_id
        and pu.personne_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profil_unifie pu
      where pu.id = consentement.profil_unifie_id
        and pu.personne_id = auth.uid()
    )
  );

-- Suppression : non autorisée. La doctrine RGPD V2 dit « révocation = UPDATE
-- valeur à false », pas DELETE. La trace doit être conservée. Seuls les
-- admins peuvent supprimer (cas extrême de demande d'effacement RGPD §17).
drop policy if exists "consentement_delete_admin" on public.consentement;
create policy "consentement_delete_admin"
  on public.consentement
  for delete
  using (public.est_admin_general());
