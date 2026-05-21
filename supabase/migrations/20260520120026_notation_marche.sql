-- Migration 026 : table `notation_marche` + vue stats (chantier 4.3).
--
-- Cf. spec §6F « Marché solidaire » :
--   « Notation : 5 étoiles + commentaire, unilatérale (de l'acheteuse
--     vers la vendeureuse). »
--
-- Notation UNILATÉRALE : seule la personne acheteuse note la
-- vendeureuse. L'inverse n'existe pas (décision politique : pas de
-- système réciproque type Airbnb qui pousse à la complaisance).
--
-- Une notation est liée à un produit acheté précis : empêche le spam
-- de notations sans transaction. Contrainte d'unicité (1 notation par
-- couple acheteureuse × produit).

create table public.notation_marche (
  id uuid primary key default gen_random_uuid(),

  -- Le produit qui motive la notation (preuve d'une transaction).
  produit_id uuid not null references public.produit_marche(id) on delete cascade,

  -- Personne qui note.
  acheteureuse_id uuid not null references public.personne(id) on delete cascade,

  -- Personne notée (= vendeureuse du produit, copiée ici pour
  -- faciliter l'agrégation et résister à un éventuel changement
  -- de vendeureuse_id sur le produit).
  vendeureuse_id uuid not null references public.personne(id) on delete cascade,

  -- Note 1-5 étoiles + commentaire libre (modération a posteriori).
  etoiles smallint not null,
  commentaire text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notation_etoiles_valide
    check (etoiles between 1 and 5),
  constraint notation_pas_soi_meme
    check (acheteureuse_id <> vendeureuse_id),
  constraint notation_unique_par_transaction
    unique (produit_id, acheteureuse_id)
);

comment on table public.notation_marche is
  'Notation 5 étoiles unilatérale (acheteureuse → vendeureuse) liée à un produit acheté. Cf. spec §6F.';
comment on column public.notation_marche.etoiles is '1 à 5 (CHECK).';

create index notation_vendeureuse_idx on public.notation_marche (vendeureuse_id);
create index notation_acheteureuse_idx on public.notation_marche (acheteureuse_id);
create index notation_produit_idx on public.notation_marche (produit_id);

create trigger notation_marche_updated_at
  before update on public.notation_marche
  for each row
  execute function public.tg_set_updated_at();

alter table public.notation_marche enable row level security;

-- ============================================================
-- Politiques RLS
-- ============================================================

-- Lecture publique des notations (transparence). La page profil
-- d'une vendeureuse affichera ses étoiles moyennes.
create policy "notation_marche_select"
  on public.notation_marche for select
  using (true);

-- Insertion : auth requise, l'acheteureuse doit être l'auteurice de
-- la notation, le produit doit être au statut `vendu`, et la
-- vendeureuse copiée doit être celle du produit. Le tout enforce une
-- traçabilité claire et empêche le spam.
create policy "notation_marche_insert"
  on public.notation_marche for insert
  with check (
    auth.uid() is not null
    and acheteureuse_id = auth.uid()
    and exists (
      select 1
      from public.produit_marche p
      where p.id = produit_id
        and p.statut = 'vendu'
        and p.vendeureuse_id = vendeureuse_id
        and p.vendeureuse_id <> auth.uid()
    )
  );

-- Édition par l'auteurice (corriger une faute) ou modération.
create policy "notation_marche_update"
  on public.notation_marche for update
  using (
    acheteureuse_id = auth.uid()
    or public.est_admin_general()
    or public.est_moderateurice('marche')
  );

-- ============================================================
-- Vue d'agrégation : moyenne + nombre de notations par vendeureuse.
-- Utilisée pour afficher les étoiles sur la fiche produit et le profil.
-- ============================================================
create or replace view public.notation_marche_stats as
select
  vendeureuse_id,
  round(avg(etoiles)::numeric, 2)::float as moyenne_etoiles,
  count(*)::int as nombre_notations
from public.notation_marche
group by vendeureuse_id;

comment on view public.notation_marche_stats is
  'Agrégation des notations par vendeureuse (moyenne 1-5 + nombre). Lecture publique.';

grant select on public.notation_marche_stats to anon, authenticated;
