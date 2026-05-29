-- ============================================================
-- commentaire_objet : commentaires polymorphes sur les contenus
-- (Chantier A — commentaires + auteurs suivables, V2.6).
--
-- Permet de commenter n'importe quel contenu du site (pétition,
-- mobilisation, cagnotte, moment, sondage, campagne, offres d'entraide,
-- produits/boutiques du marché) sans créer une table par type.
--
-- Greffe additive (doctrine §0.3) : ne touche à aucune table existante.
-- Modèle calqué sur `commentaire_reseau` (modération a posteriori, mêmes
-- colonnes de retrait). Réservé aux personnes connectées (RLS insert).
-- ============================================================
create table public.commentaire_objet (
  id uuid primary key default gen_random_uuid(),

  -- FK polymorphe : (objet_type, objet_id) désigne le contenu commenté.
  -- Liste fermée alignée sur les noms de tables métier.
  objet_type text not null,
  objet_id uuid not null,

  auteurice_id uuid not null references public.personne(id) on delete cascade,

  texte text not null,

  statut text not null default 'publie',
  retire_par uuid references public.personne(id) on delete set null,
  retire_le timestamptz,
  raison_retrait text,

  created_at timestamptz not null default now(),

  constraint commentaire_objet_texte_non_vide check (length(btrim(texte)) > 0),
  constraint commentaire_objet_texte_taille check (length(texte) <= 2000),
  constraint commentaire_objet_statut_valide check (statut in ('publie', 'retire')),
  constraint commentaire_objet_type_valide check (
    objet_type in (
      'petition',
      'mobilisation',
      'cagnotte',
      'moment_solidaire',
      'sondage',
      'campagne',
      'offre_entraide',
      'service_sel',
      'produit_marche',
      'boutique_marche'
    )
  )
);

comment on table public.commentaire_objet is
  'Commentaire polymorphe sous un contenu (objet_type, objet_id). Réservé aux connecté·es. Modération a posteriori (onglet réseau).';

-- Lecture du fil d'un objet (ordre chronologique).
create index commentaire_objet_cible_idx
  on public.commentaire_objet (objet_type, objet_id, created_at);
-- Tous les commentaires d'une personne (pour son profil / la modération).
create index commentaire_objet_auteurice_idx
  on public.commentaire_objet (auteurice_id, created_at desc);

alter table public.commentaire_objet enable row level security;

-- Visible si publié, ou à son auteurice, ou à la modération réseau / admin.
create policy "commentaire_objet_select" on public.commentaire_objet for select
  using (
    statut = 'publie'
    or auteurice_id = auth.uid()
    or public.est_moderateurice('reseau')
    or public.est_admin_general()
  );

-- Insertion réservée à la personne connectée, en son propre nom.
create policy "commentaire_objet_insert" on public.commentaire_objet for insert
  with check (auth.uid() is not null and auteurice_id = auth.uid());

-- Mise à jour (retrait) par l'auteurice ou la modération / admin.
create policy "commentaire_objet_update" on public.commentaire_objet for update
  using (
    auteurice_id = auth.uid()
    or public.est_moderateurice('reseau')
    or public.est_admin_general()
  );

-- Suppression dure par l'auteurice ou un admin général.
create policy "commentaire_objet_delete" on public.commentaire_objet for delete
  using (auteurice_id = auth.uid() or public.est_admin_general());
