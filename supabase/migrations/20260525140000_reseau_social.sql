-- Migration 039 : Réseau social (chantier 7.5).
--
-- Cf. docs/specs/01_ARCHITECTURE.md §4E et §13 :
--   - Flux Facebook-like SANS publicité, algorithme strictement transparent et
--     hiérarchisé (soi -> ami·es / suivi·es -> contenus du site -> entraide ~5 %).
--   - Messagerie interne type Messenger (DM).
--   - Modération A POSTERIORI (publication immédiate, retrait si problème).
--   - Pas de pondération cachée, pas d'autoplay, pas de captation d'attention.
--
-- Modèle de relation : on modélise le SUIVI (one-way). « Ami·e » = suivi
-- MUTUEL (les deux se suivent), calculé à la volée. Cela couvre « ami·es ET
-- personnes suivies » du flux sans imposer un cycle demande/acceptation.

-- ============================================================
-- relation_reseau : suivi one-way (ami = mutuel)
-- ============================================================
create table public.relation_reseau (
  suiveur_id uuid not null references public.personne(id) on delete cascade,
  suivi_id uuid not null references public.personne(id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (suiveur_id, suivi_id),
  -- On ne se suit pas soi-même.
  constraint relation_reseau_pas_soi check (suiveur_id <> suivi_id)
);

comment on table public.relation_reseau is
  'Suivi one-way entre personnes (réseau social). Ami·e = suivi mutuel (calculé).';

create index relation_reseau_suivi_idx on public.relation_reseau (suivi_id);

alter table public.relation_reseau enable row level security;

-- Le graphe de suivi est lisible par toute personne connectée (compteurs,
-- état des boutons « suivre »). On ne suit/désuit que pour soi-même.
create policy "relation_reseau_select" on public.relation_reseau for select
  using (auth.uid() is not null);
create policy "relation_reseau_insert" on public.relation_reseau for insert
  with check (suiveur_id = auth.uid());
create policy "relation_reseau_delete" on public.relation_reseau for delete
  using (suiveur_id = auth.uid());

-- ============================================================
-- post_reseau : publication du flux (modération a posteriori)
-- ============================================================
create table public.post_reseau (
  id uuid primary key default gen_random_uuid(),
  auteurice_id uuid not null references public.personne(id) on delete cascade,

  texte text not null,
  image_url text,

  -- Modération a posteriori : publié par défaut, retiré si problème.
  statut text not null default 'publie',
  retire_par uuid references public.personne(id) on delete set null,
  retire_le timestamptz,
  raison_retrait text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint post_reseau_texte_non_vide check (length(btrim(texte)) > 0),
  constraint post_reseau_texte_taille check (length(texte) <= 5000),
  constraint post_reseau_statut_valide check (statut in ('publie', 'retire'))
);

comment on table public.post_reseau is
  'Publication du réseau social. Modération a posteriori (statut publie | retire).';

create index post_reseau_auteurice_idx on public.post_reseau (auteurice_id, created_at desc);
create index post_reseau_flux_idx on public.post_reseau (created_at desc) where statut = 'publie';

create trigger post_reseau_updated_at
  before update on public.post_reseau
  for each row execute function public.tg_set_updated_at();

alter table public.post_reseau enable row level security;

-- Lecture : publications publiées (flux public), ou la sienne, ou modération.
create policy "post_reseau_select" on public.post_reseau for select
  using (
    statut = 'publie'
    or auteurice_id = auth.uid()
    or public.est_moderateurice('reseau')
    or public.est_admin_general()
  );
create policy "post_reseau_insert" on public.post_reseau for insert
  with check (auteurice_id = auth.uid());
-- Mise à jour : l'autrice édite son texte ; modération/admin gèrent le retrait.
create policy "post_reseau_update" on public.post_reseau for update
  using (
    auteurice_id = auth.uid()
    or public.est_moderateurice('reseau')
    or public.est_admin_general()
  );
create policy "post_reseau_delete" on public.post_reseau for delete
  using (auteurice_id = auth.uid() or public.est_admin_general());

-- ============================================================
-- commentaire_reseau
-- ============================================================
create table public.commentaire_reseau (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.post_reseau(id) on delete cascade,
  auteurice_id uuid not null references public.personne(id) on delete cascade,

  texte text not null,

  statut text not null default 'publie',
  retire_par uuid references public.personne(id) on delete set null,
  retire_le timestamptz,
  raison_retrait text,

  created_at timestamptz not null default now(),

  constraint commentaire_reseau_texte_non_vide check (length(btrim(texte)) > 0),
  constraint commentaire_reseau_texte_taille check (length(texte) <= 2000),
  constraint commentaire_reseau_statut_valide check (statut in ('publie', 'retire'))
);

comment on table public.commentaire_reseau is
  'Commentaire sous une publication. Modération a posteriori.';

create index commentaire_reseau_post_idx on public.commentaire_reseau (post_id, created_at);

alter table public.commentaire_reseau enable row level security;

create policy "commentaire_reseau_select" on public.commentaire_reseau for select
  using (
    statut = 'publie'
    or auteurice_id = auth.uid()
    or public.est_moderateurice('reseau')
    or public.est_admin_general()
  );
create policy "commentaire_reseau_insert" on public.commentaire_reseau for insert
  with check (auteurice_id = auth.uid());
create policy "commentaire_reseau_update" on public.commentaire_reseau for update
  using (
    auteurice_id = auth.uid()
    or public.est_moderateurice('reseau')
    or public.est_admin_general()
  );
create policy "commentaire_reseau_delete" on public.commentaire_reseau for delete
  using (auteurice_id = auth.uid() or public.est_admin_general());

-- ============================================================
-- reaction_reseau : soutien (toggle, une par personne et publication)
-- ============================================================
create table public.reaction_reseau (
  post_id uuid not null references public.post_reseau(id) on delete cascade,
  personne_id uuid not null references public.personne(id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (post_id, personne_id)
);

comment on table public.reaction_reseau is
  'Soutien d''une publication (une seule par personne, toggle).';

alter table public.reaction_reseau enable row level security;

create policy "reaction_reseau_select" on public.reaction_reseau for select
  using (auth.uid() is not null);
create policy "reaction_reseau_insert" on public.reaction_reseau for insert
  with check (personne_id = auth.uid());
create policy "reaction_reseau_delete" on public.reaction_reseau for delete
  using (personne_id = auth.uid());

-- ============================================================
-- message_reseau : messagerie interne (DM)
-- ============================================================
create table public.message_reseau (
  id uuid primary key default gen_random_uuid(),
  expediteur_id uuid not null references public.personne(id) on delete cascade,
  destinataire_id uuid not null references public.personne(id) on delete cascade,

  texte text not null,
  lu boolean not null default false,
  lu_le timestamptz,

  created_at timestamptz not null default now(),

  constraint message_reseau_texte_non_vide check (length(btrim(texte)) > 0),
  constraint message_reseau_texte_taille check (length(texte) <= 5000),
  constraint message_reseau_pas_soi check (expediteur_id <> destinataire_id),
  constraint message_reseau_lu_coherent check (
    (lu = true and lu_le is not null) or (lu = false and lu_le is null)
  )
);

comment on table public.message_reseau is
  'Message direct (messagerie interne type Messenger). Cf. spec §10 canal primaire.';

create index message_reseau_paire_idx
  on public.message_reseau (expediteur_id, destinataire_id, created_at);
create index message_reseau_destinataire_idx
  on public.message_reseau (destinataire_id, created_at desc);
create index message_reseau_non_lus_idx
  on public.message_reseau (destinataire_id) where lu = false;

alter table public.message_reseau enable row level security;

-- Lecture : seuls l'expéditeur et le destinataire (et admin) voient un message.
create policy "message_reseau_select" on public.message_reseau for select
  using (
    expediteur_id = auth.uid()
    or destinataire_id = auth.uid()
    or public.est_admin_general()
  );
create policy "message_reseau_insert" on public.message_reseau for insert
  with check (expediteur_id = auth.uid());
-- Mise à jour : le destinataire marque le message comme lu.
create policy "message_reseau_update" on public.message_reseau for update
  using (destinataire_id = auth.uid())
  with check (destinataire_id = auth.uid());

-- ============================================================
-- Helpers de visibilité (respect de preferences_visibilite)
-- ============================================================
-- Un champ est visible selon son niveau (défaut 'membres', cf. spec §9) et la
-- relation entre la personne regardée et la personne qui regarde.
create or replace function public.champ_reseau_visible(
  niveau text,
  est_soi boolean,
  est_ami boolean,
  est_connecte boolean
)
returns boolean
language sql
immutable
as $$
  select case
    when est_soi then true
    when coalesce(niveau, 'membres') = 'publique' then true
    when coalesce(niveau, 'membres') = 'membres' then est_connecte
    when coalesce(niveau, 'membres') = 'amies' then est_ami
    else false -- 'privee'
  end;
$$;

comment on function public.champ_reseau_visible(text, boolean, boolean, boolean) is
  'Visibilité d''un champ de profil selon son niveau et la relation au lecteur.';

-- Identité affichable d'une personne pour le lecteur courant (auth.uid()),
-- chaque champ masqué (null) s'il n'est pas visible. SECURITY DEFINER pour lire
-- personne.preferences_visibilite malgré la RLS.
create or replace function public.personne_affichage(cible uuid)
returns table (
  id uuid,
  numero_unique text,
  prenom text,
  nom text,
  pronom text,
  photo_url text,
  bio text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  est_soi boolean;
  est_connecte boolean := viewer is not null;
  est_ami boolean;
  prefs jsonb;
begin
  select (p.id = viewer), p.preferences_visibilite
    into est_soi, prefs
    from public.personne p
    where p.id = cible;
  if not found then
    return;
  end if;

  -- Ami·e = suivi mutuel.
  est_ami := exists (
    select 1 from public.relation_reseau a
    join public.relation_reseau b
      on a.suiveur_id = b.suivi_id and a.suivi_id = b.suiveur_id
    where a.suiveur_id = viewer and a.suivi_id = cible
  );

  return query
  select
    p.id,
    pu.numero_unique,
    case when public.champ_reseau_visible(prefs->>'prenom', est_soi, est_ami, est_connecte)
      then p.prenom end,
    case when public.champ_reseau_visible(prefs->>'nom', est_soi, est_ami, est_connecte)
      then p.nom end,
    case when public.champ_reseau_visible(prefs->>'pronom', est_soi, est_ami, est_connecte)
      then p.pronom end,
    case when public.champ_reseau_visible(prefs->>'photo_url', est_soi, est_ami, est_connecte)
      then p.photo_url end,
    case when public.champ_reseau_visible(prefs->>'bio', est_soi, est_ami, est_connecte)
      then p.bio end
  from public.personne p
  left join public.profil_unifie pu on pu.personne_id = p.id
  where p.id = cible;
end;
$$;

comment on function public.personne_affichage(uuid) is
  'Identité affichable d''une personne pour le lecteur courant (champs masqués selon visibilité).';

-- Ami·e (suivi mutuel) entre le lecteur courant et la cible.
create or replace function public.est_ami_reseau(cible uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.relation_reseau a
    join public.relation_reseau b
      on a.suiveur_id = b.suivi_id and a.suivi_id = b.suiveur_id
    where a.suiveur_id = auth.uid() and a.suivi_id = cible
  );
$$;

comment on function public.est_ami_reseau(uuid) is
  'True si le lecteur courant et la cible se suivent mutuellement.';

-- ============================================================
-- membres_commune : co-membres visibles ENTRE MEMBRES (décision A)
-- ============================================================
-- Renvoie les membres actifs d'une commune, avec leur identité affichable, mais
-- UNIQUEMENT si le lecteur est lui-même membre de cette commune. Les
-- non-membres et les visiteur·euses anonymes reçoivent un ensemble vide : la
-- liste nominative n'existe qu'entre membres (rien de public).
create or replace function public.membres_commune(commune_cible uuid)
returns table (
  personne_id uuid,
  numero_unique text,
  prenom text,
  nom text,
  photo_url text,
  rejoint_le timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.est_membre_commune(commune_cible) then
    return;
  end if;

  return query
  select a.personne_id, aff.numero_unique, aff.prenom, aff.nom, aff.photo_url, a.created_at
  from public.appartenance_commune a
  cross join lateral public.personne_affichage(a.personne_id) aff
  where a.commune_id = commune_cible
    and a.est_active = true
  order by a.created_at asc;
end;
$$;

comment on function public.membres_commune(uuid) is
  'Co-membres d''une commune (identité affichable), visibles uniquement si le lecteur est membre.';

-- Résout le numéro public (M+7) d'une personne vers son id. Le numéro est un
-- identifiant public (handle de profil) : résoluble par tout le monde, malgré
-- la RLS de profil_unifie qui restreint la lecture de la ligne complète.
create or replace function public.personne_id_par_numero(numero_cible text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pu.personne_id
  from public.profil_unifie pu
  where pu.numero_unique = numero_cible;
$$;

comment on function public.personne_id_par_numero(text) is
  'Résout un numéro public (M+7) vers l''id de la personne. Handle public.';

-- Exécution : profils publics lisibles aussi par anon (champs 'publique' seuls).
grant execute on function public.personne_id_par_numero(text) to anon, authenticated, service_role;
grant execute on function public.personne_affichage(uuid) to anon, authenticated, service_role;
grant execute on function public.est_ami_reseau(uuid) to authenticated, service_role;
grant execute on function public.membres_commune(uuid) to authenticated, service_role;
