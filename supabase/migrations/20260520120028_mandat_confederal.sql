-- Migration 028 : Assemblée Confédérale (chantier 5.2).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §7B « Composition de l'Assemblée
-- Confédérale » :
--   - Délégué·es en binômes tirés au sort.
--   - Communes + Fédérations + Confédérations (un binôme par entité).
--   - Incompatibilité de cumul de mandats : pas représentant·e
--     simultané·e d'une commune et d'une fédération. Si tiré·e à un
--     niveau supérieur, libération du siège au niveau inférieur.
--
-- Modèle : un `mandat_confederal` = une personne représente UNE entité
-- (commune | federation | confederation) dans un binôme. Le binôme se
-- déduit de la paire (entite_type, entite_id) : on en attend 2.

create table public.mandat_confederal (
  id uuid primary key default gen_random_uuid(),

  -- Personne déléguée. UNIQUE active (cf. trigger d'incompatibilité).
  personne_id uuid not null references public.personne(id) on delete cascade,

  -- Entité représentée (polymorphe par discriminant + id, pas de FK
  -- dynamique : on vérifie l'existence dans la Server Action).
  entite_type text not null,
  entite_id uuid not null,

  -- Tirage au sort
  tire_le timestamptz not null default now(),
  tirage_seed text,

  -- Cycle de vie
  statut text not null default 'actif',
  -- Quand le mandat est libéré (volontairement ou par incompatibilité
  -- de cumul automatique lors d'un tirage à un niveau supérieur).
  libere_le timestamptz,
  raison_liberation text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mandat_entite_type_valide
    check (entite_type in ('commune', 'federation', 'confederation')),
  constraint mandat_statut_valide
    check (statut in ('actif', 'libere')),
  constraint mandat_liberation_coherente
    check (
      (statut = 'actif' and libere_le is null)
      or (statut = 'libere' and libere_le is not null)
    )
);

comment on table public.mandat_confederal is
  'Mandat d''une personne dans l''Assemblée Confédérale. Tirage au sort par binômes. Incompatibilité de cumul (cf. spec §7B).';
comment on column public.mandat_confederal.entite_type is
  'commune | federation | confederation (cf. spec §7B trois niveaux)';

create index mandat_confederal_personne_idx
  on public.mandat_confederal (personne_id) where statut = 'actif';
create index mandat_confederal_entite_idx
  on public.mandat_confederal (entite_type, entite_id) where statut = 'actif';

create trigger mandat_confederal_updated_at
  before update on public.mandat_confederal
  for each row
  execute function public.tg_set_updated_at();

alter table public.mandat_confederal enable row level security;

-- Lecture publique (transparence radicale, cf. spec §7B « pas de
-- quorum + transparence radicale »).
create policy "mandat_confederal_select"
  on public.mandat_confederal for select
  using (true);

-- Insertion réservée admin national (= cosec gé). Le tirage au sort
-- est déclenché par la console admin, pas par les usager·ères.
create policy "mandat_confederal_insert"
  on public.mandat_confederal for insert
  with check (public.est_admin_national());

create policy "mandat_confederal_update"
  on public.mandat_confederal for update
  using (public.est_admin_national());

-- ============================================================
-- Trigger : incompatibilité de cumul (cf. spec §7B).
-- Quand une personne est tirée au sort à un niveau supérieur, on
-- libère automatiquement ses mandats actifs aux niveaux inférieurs.
--   - confederation > federation > commune
-- ============================================================
create or replace function public.tg_mandat_confederal_incompatibilite()
returns trigger
language plpgsql
as $$
declare
  niveau_nouveau integer;
  niveau_existant integer;
  rec record;
begin
  if (new.statut <> 'actif') then
    return new;
  end if;

  -- Niveau du nouveau mandat (0 commune, 1 federation, 2 confederation).
  niveau_nouveau := case new.entite_type
    when 'commune' then 0
    when 'federation' then 1
    when 'confederation' then 2
  end;

  -- Libérer les mandats actifs de la même personne à un niveau strictement
  -- inférieur. On laisse cohabiter au même niveau (la spec parle de
  -- cumul entre niveaux ; le cumul à même niveau dans 2 communes
  -- différentes est traité ailleurs par la limite 3 communes max).
  for rec in
    select id, entite_type
    from public.mandat_confederal
    where personne_id = new.personne_id
      and statut = 'actif'
      and id <> new.id
  loop
    niveau_existant := case rec.entite_type
      when 'commune' then 0
      when 'federation' then 1
      when 'confederation' then 2
    end;

    if (niveau_existant < niveau_nouveau) then
      update public.mandat_confederal
      set statut = 'libere',
          libere_le = now(),
          raison_liberation = 'cumul incompatible avec ' || new.entite_type
      where id = rec.id;
    end if;
  end loop;

  return new;
end;
$$;

create trigger mandat_confederal_incompatibilite
  after insert on public.mandat_confederal
  for each row
  execute function public.tg_mandat_confederal_incompatibilite();

-- ============================================================
-- Fonction de comptage : nombre_communes_actives(personne_id).
-- Permet à la Server Action de savoir s'il faut afficher la modale
-- 2e commune (1 actuelle), 3e (2 actuelles) ou refus (3 actuelles).
-- ============================================================
create or replace function public.nombre_communes_actives(personne_a_compter uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.appartenance_commune
  where personne_id = personne_a_compter
    and est_active = true;
$$;

comment on function public.nombre_communes_actives(uuid) is
  'Compteur des communes actives d''une personne (0 à 3). Utilisé par la Server Action `rejoindreCommune` pour choisir le palier de modale.';

-- ============================================================
-- Fonction de tirage au sort de l'Assemblée Confédérale.
--
-- Réservée admin_national. Tire `nb_binomes` paires par entité, parmi
-- les personnes adhérentes actives et membres actives de l'entité.
-- Renvoie la liste pour audit. La création des lignes `mandat_confederal`
-- est faite côté Server Action (qui passe la RLS et journalise).
-- ============================================================
create or replace function public.candidates_pour_assemblee(
  entite_type_recherche text,
  entite_id_recherche uuid
)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct p.id
  from public.personne p
  inner join public.adherent_actif a on a.personne_id = p.id
  where (
    -- Membres de la commune
    (entite_type_recherche = 'commune' and exists (
      select 1 from public.appartenance_commune ac
      where ac.personne_id = p.id
        and ac.commune_id = entite_id_recherche
        and ac.est_active = true
    ))
    -- Membres de la fédération (via commune appartenant à la fédération)
    or (entite_type_recherche = 'federation' and exists (
      select 1 from public.appartenance_commune ac
      inner join public.appartenance_federation af on af.commune_id = ac.commune_id
      where ac.personne_id = p.id
        and af.federation_id = entite_id_recherche
        and ac.est_active = true
        and af.est_active = true
    ))
    -- Membres de la confédération (via fédération via commune)
    or (entite_type_recherche = 'confederation' and exists (
      select 1
      from public.appartenance_commune ac
      inner join public.appartenance_federation af on af.commune_id = ac.commune_id
      inner join public.appartenance_confederation acf on acf.federation_id = af.federation_id
      where ac.personne_id = p.id
        and acf.confederation_id = entite_id_recherche
        and ac.est_active = true
        and af.est_active = true
        and acf.est_active = true
    ))
  );
$$;

comment on function public.candidates_pour_assemblee(text, uuid) is
  'Liste les candidat·es éligibles pour un binôme confédéral d''une entité. Adhérent·es actif·ves + membres actif·ves de l''entité.';
