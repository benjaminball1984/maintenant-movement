-- ============================================================================
-- Chantier V2.6.7 (épopée réseau V2, chantier D.1) — Amitié stockée
-- ============================================================================
--
-- Cf. docs/specs/09_RESEAU-SOCIAL-V2.md §3.
--
-- Aujourd'hui, « ami·e » = suivi mutuel CALCULÉ (deux lignes relation_reseau).
-- On le remplace par une vraie relation STOCKÉE avec un cycle
-- demande → acceptation, distincte du suivi :
--   - on peut être ami·es sans se suivre, et se suivre sans être ami·es ;
--   - accepter une demande force le suivi mutuel + débloque la messagerie
--     + le palier de visibilité « amies ».
--
-- Doctrine de greffe (CLAUDE.md §0.3) :
--   - ADDITIF : nouvelle table `amitie`, nouveaux helpers ; relation_reseau
--     (le suivi) est conservée telle quelle, aucun DROP.
--   - BACKFILL, ON NE RÉINITIALISE JAMAIS : toutes les amitiés actuelles
--     (suivis mutuels existants) sont recopiées en lignes `acceptee` pour que
--     personne ne perde son statut d'ami·e au basculement du helper.
--
-- Migration LOCALE (non poussée au distant avant la Phase M).
-- ============================================================================

-- ============================================================
-- Table : amitie (relation symétrique avec cycle de demande)
-- ============================================================
create table if not exists public.amitie (
  id              uuid primary key default gen_random_uuid(),
  demandeur_id    uuid not null references public.personne(id) on delete cascade,
  destinataire_id uuid not null references public.personne(id) on delete cascade,
  statut          text not null default 'en_attente',
  created_at      timestamptz not null default now(),
  repondu_le      timestamptz,

  constraint amitie_statut_valide check (statut in ('en_attente', 'acceptee', 'refusee')),
  constraint amitie_pas_soi check (demandeur_id <> destinataire_id),
  -- Cohérence : une réponse (accept/refus) porte une date, l'attente non.
  constraint amitie_repondu_coherent check (
    (statut = 'en_attente' and repondu_le is null)
    or (statut <> 'en_attente' and repondu_le is not null)
  )
);

comment on table public.amitie is
  'Relation d''amitié réseau (demande → acceptation). Symétrique une fois acceptée. Distincte du suivi (relation_reseau).';
comment on column public.amitie.demandeur_id is 'Personne qui a envoyé la demande.';
comment on column public.amitie.destinataire_id is 'Personne qui reçoit et répond à la demande.';
comment on column public.amitie.statut is 'en_attente | acceptee | refusee.';

-- Au plus UNE amitié active (en_attente ou acceptee) par paire, quel que soit
-- le sens de la demande. Les refus n'empêchent pas une nouvelle demande plus tard.
create unique index if not exists amitie_paire_active_unique
  on public.amitie (least(demandeur_id, destinataire_id), greatest(demandeur_id, destinataire_id))
  where statut <> 'refusee';

create index if not exists amitie_destinataire_idx
  on public.amitie (destinataire_id, statut);
create index if not exists amitie_demandeur_idx
  on public.amitie (demandeur_id, statut);

-- ============================================================
-- Backfill : suivis mutuels existants -> amitiés acceptées
-- ============================================================
-- Une ligne par paire (ordre canonique demandeur < destinataire). On ne
-- réinitialise rien : on préserve les amitiés déjà vécues (suivi mutuel).
insert into public.amitie (demandeur_id, destinataire_id, statut, repondu_le)
select a.suiveur_id, a.suivi_id, 'acceptee', now()
from public.relation_reseau a
join public.relation_reseau b
  on a.suiveur_id = b.suivi_id and a.suivi_id = b.suiveur_id
where a.suiveur_id < a.suivi_id
on conflict do nothing;

-- ============================================================
-- Helper : peut-on demander cette personne en ami·e ?
-- ============================================================
-- DÉFINI AVANT la RLS car la policy d'insertion l'utilise (sinon : « function
-- does not exist »). Vrai si la cible me suit déjà en retour, OU si elle a
-- activé le réglage « n'importe qui peut me demander en ami » (défaut : non).
-- SECURITY DEFINER pour lire relation_reseau et personne.preferences_visibilite
-- sans buter sur la RLS (la réponse, elle, est juste un booléen).
create or replace function public.peut_demander_ami(cible uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and auth.uid() <> cible
    and (
      exists (
        select 1 from public.relation_reseau
        where suiveur_id = cible and suivi_id = auth.uid()
      )
      or coalesce(
        (select (p.preferences_visibilite->>'demande_ami_ouverte')::boolean
           from public.personne p where p.id = cible),
        false
      )
    );
$$;

comment on function public.peut_demander_ami(uuid) is
  'True si le lecteur courant peut envoyer une demande d''ami à la cible (la cible le suit déjà, ou autorise les demandes ouvertes).';

revoke execute on function public.peut_demander_ami(uuid) from public;
grant execute on function public.peut_demander_ami(uuid) to authenticated, service_role;

-- ============================================================
-- RLS (policies idempotentes : drop if exists puis create, pour pouvoir
-- ré-appliquer la migration sur un état partiel sans « policy already exists »)
-- ============================================================
alter table public.amitie enable row level security;

-- Lecture : les deux personnes concernées (pour voir ses demandes/amitiés) + admin.
drop policy if exists "amitie_select" on public.amitie;
create policy "amitie_select" on public.amitie for select
  using (
    demandeur_id = auth.uid()
    or destinataire_id = auth.uid()
    or public.est_admin_general()
  );

-- Insertion : on ne crée une demande qu'en son nom, et seulement si la cible
-- nous suit déjà OU autorise les demandes de n'importe qui (cf. peut_demander_ami).
drop policy if exists "amitie_insert" on public.amitie;
create policy "amitie_insert" on public.amitie for insert
  with check (
    demandeur_id = auth.uid()
    and public.peut_demander_ami(destinataire_id)
  );

-- Réponse (accepter/refuser) : seul le destinataire met à jour la demande.
drop policy if exists "amitie_update" on public.amitie;
create policy "amitie_update" on public.amitie for update
  using (destinataire_id = auth.uid())
  with check (destinataire_id = auth.uid());

-- Retrait : le demandeur annule sa demande, ou l'un·e des deux retire l'amitié.
drop policy if exists "amitie_delete" on public.amitie;
create policy "amitie_delete" on public.amitie for delete
  using (demandeur_id = auth.uid() or destinataire_id = auth.uid());

-- ============================================================
-- Helper : est_ami_reseau réimplémenté sur la table amitie
-- ============================================================
-- Même signature qu'avant (les appelants TS et SQL ne changent pas) : seul le
-- calcul change. L'amitié est désormais une ligne `acceptee`, plus un suivi
-- mutuel calculé.
create or replace function public.est_ami_reseau(cible uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.amitie
    where statut = 'acceptee'
      and (
        (demandeur_id = auth.uid() and destinataire_id = cible)
        or (demandeur_id = cible and destinataire_id = auth.uid())
      )
  );
$$;

comment on function public.est_ami_reseau(uuid) is
  'True si le lecteur courant et la cible sont ami·es (ligne amitie acceptee). V2.6.7 : passe du suivi mutuel calculé à la table amitie.';

-- ============================================================
-- Transition : accepter une demande d'ami (élévation contrôlée)
-- ============================================================
-- Accepter force le suivi mutuel. Or la RLS de relation_reseau interdit
-- d'insérer un suivi au nom d'autrui (suiveur_id = auth.uid() obligatoire) :
-- le destinataire ne peut donc pas créer le suivi « demandeur -> destinataire »
-- depuis le client. On passe par cette fonction SECURITY DEFINER qui, après
-- avoir vérifié que l'appelant EST bien le destinataire de la demande, met le
-- statut à 'acceptee' et crée les deux suivis (idempotent).
create or replace function public.accepter_amitie(amitie_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  d_id uuid;
  dest_id uuid;
begin
  select demandeur_id, destinataire_id
    into d_id, dest_id
    from public.amitie
    where id = amitie_id and statut = 'en_attente';
  if not found then
    return false;
  end if;
  -- Seul le destinataire de la demande peut l'accepter.
  if dest_id <> auth.uid() then
    return false;
  end if;

  update public.amitie
    set statut = 'acceptee', repondu_le = now()
    where id = amitie_id;

  -- Suivi mutuel forcé (idempotent).
  insert into public.relation_reseau (suiveur_id, suivi_id)
    values (d_id, dest_id)
    on conflict do nothing;
  insert into public.relation_reseau (suiveur_id, suivi_id)
    values (dest_id, d_id)
    on conflict do nothing;

  return true;
end;
$$;

comment on function public.accepter_amitie(uuid) is
  'Accepte une demande d''ami (réservé au destinataire) : statut acceptee + suivi mutuel forcé.';

revoke execute on function public.accepter_amitie(uuid) from public;
grant execute on function public.accepter_amitie(uuid) to authenticated, service_role;

-- ============================================================
-- Redéfinition de personne_affichage : est_ami sur la vraie amitié
-- ============================================================
-- La version V2.5.49 calculait est_ami en suivi mutuel inline. On la redéfinit
-- (même signature, mêmes colonnes dont bio_html) en déléguant à
-- est_ami_reseau, pour que le palier de visibilité « amies » reflète la
-- vraie amitié stockée. Aucune donnée perdue (RPC sans état).
drop function if exists public.personne_affichage(uuid);

create function public.personne_affichage(cible uuid)
returns table (
  id uuid,
  numero_unique text,
  prenom text,
  nom text,
  pronom text,
  photo_url text,
  bio text,
  bio_html text
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

  -- V2.6.7 : amitié stockée (ligne amitie acceptee), plus suivi mutuel calculé.
  est_ami := public.est_ami_reseau(cible);

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
      then p.bio end,
    case when public.champ_reseau_visible(prefs->>'bio', est_soi, est_ami, est_connecte)
      then p.bio_html end
  from public.personne p
  left join public.profil_unifie pu on pu.personne_id = p.id
  where p.id = cible;
end;
$$;

comment on function public.personne_affichage(uuid) is
  'Identité affichable d''une personne pour le lecteur courant (champs masqués selon visibilité). V2.6.7 : est_ami sur la table amitie.';

revoke execute on function public.personne_affichage(uuid) from public;
grant execute on function public.personne_affichage(uuid) to anon, authenticated, service_role;
