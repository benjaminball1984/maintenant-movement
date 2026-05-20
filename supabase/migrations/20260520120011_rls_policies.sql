-- Migration 011 : politiques RLS pour toutes les tables du chantier 1.1.
--
-- Principes (cf. docs/specs/05_RGPD.md §5D et docs/specs/01_ARCHITECTURE.md §14) :
--   - Toute table avec données personnelles : RLS activée (faite dans les migrations précédentes).
--   - SELECT : minimisation : on ne lit que ce dont on a besoin.
--   - INSERT/UPDATE/DELETE : action sur soi-même par défaut ;
--     administrateurices selon leur niveau.
--   - Suppression : pas via RLS sur les tables avec historique (personne,
--     appartenance_commune) ; ces suppressions passent par anonymisation
--     ou marquage `est_active = false`.
--
-- Les politiques avancées (visibilité par champ du profil §9, droits
-- granulaires modération §11) seront posées au fil des chantiers qui en
-- ont besoin.

-- ============================================================
-- personne
-- ============================================================

-- Lecture : soi-même + admin général.
create policy "personne_select_self_ou_admin"
  on public.personne for select
  using (auth.uid() = id or public.est_admin_general());

-- Mise à jour : soi-même seulement (admin passe par service_role + audit).
create policy "personne_update_self"
  on public.personne for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Création : trigger Supabase Auth crée auth.users ; l'app insère ensuite
-- la ligne `personne` correspondante depuis le flux d'inscription.
create policy "personne_insert_self"
  on public.personne for insert
  with check (auth.uid() = id);

-- Pas de DELETE côté RLS : on passe par anonymisation (flux 30 jours).

-- ============================================================
-- commune
-- ============================================================

-- Lecture : publique (info politique publique).
create policy "commune_select_public"
  on public.commune for select
  using (true);

-- Création : toute personne authentifiée peut créer une commune libre
-- (territoire libre, quartier, ZAD, etc.). Les pré-créées seront posées
-- par le chantier 5.2 via service_role (donc bypass RLS).
create policy "commune_insert_auth"
  on public.commune for insert
  with check (auth.uid() is not null);

-- Mise à jour : créateurice + admin général + animation de la commune.
create policy "commune_update_createurice_ou_admin"
  on public.commune for update
  using (
    createurice_id = auth.uid()
    or public.est_admin_general()
    or public.est_animation_commune(id)
  );

-- Suppression : admin général uniquement.
create policy "commune_delete_admin"
  on public.commune for delete
  using (public.est_admin_general());

-- ============================================================
-- appartenance_commune
-- ============================================================

-- Lecture : sa propre appartenance + autres membres de la même commune
-- + admin général.
create policy "appartenance_commune_select"
  on public.appartenance_commune for select
  using (
    personne_id = auth.uid()
    or public.est_admin_general()
    or public.est_membre_commune(commune_id)
  );

-- Insertion : on ne peut rejoindre qu'une commune pour soi-même.
create policy "appartenance_commune_insert_self"
  on public.appartenance_commune for insert
  with check (personne_id = auth.uid());

-- Mise à jour : soi-même (quitter une commune) ou admin général.
create policy "appartenance_commune_update_self_ou_admin"
  on public.appartenance_commune for update
  using (personne_id = auth.uid() or public.est_admin_general())
  with check (personne_id = auth.uid() or public.est_admin_general());

-- Pas de DELETE : on conserve l'historique (est_active = false).

-- ============================================================
-- federation, confederation, gt_thematique
-- (modèle commun : lecture publique, création authentifiée, édition
-- créateurice + admin)
-- ============================================================

create policy "federation_select_public"
  on public.federation for select using (true);
create policy "federation_insert_auth"
  on public.federation for insert with check (auth.uid() is not null);
create policy "federation_update_createurice_ou_admin"
  on public.federation for update
  using (createurice_id = auth.uid() or public.est_admin_general());
create policy "federation_delete_admin"
  on public.federation for delete using (public.est_admin_general());

create policy "confederation_select_public"
  on public.confederation for select using (true);
create policy "confederation_insert_auth"
  on public.confederation for insert with check (auth.uid() is not null);
create policy "confederation_update_createurice_ou_admin"
  on public.confederation for update
  using (createurice_id = auth.uid() or public.est_admin_general());
create policy "confederation_delete_admin"
  on public.confederation for delete using (public.est_admin_general());

create policy "gt_thematique_select_public"
  on public.gt_thematique for select using (true);
create policy "gt_thematique_insert_auth"
  on public.gt_thematique for insert with check (auth.uid() is not null);
create policy "gt_thematique_update_createurice_ou_admin"
  on public.gt_thematique for update
  using (createurice_id = auth.uid() or public.est_admin_general());
create policy "gt_thematique_delete_admin"
  on public.gt_thematique for delete using (public.est_admin_general());

-- ============================================================
-- Appartenances supra-locales (federation, confederation, gt)
-- ============================================================

-- appartenance_federation (commune → fédération) : lecture publique
-- (liens supra-locaux transparents). Écriture admin général en 1.1 ;
-- la logique de subsidiarité par accord mutuel arrivera au chantier 5.2.
create policy "appartenance_federation_select_public"
  on public.appartenance_federation for select using (true);
create policy "appartenance_federation_write_admin"
  on public.appartenance_federation for all
  using (public.est_admin_general())
  with check (public.est_admin_general());

-- Idem pour confédération.
create policy "appartenance_confederation_select_public"
  on public.appartenance_confederation for select using (true);
create policy "appartenance_confederation_write_admin"
  on public.appartenance_confederation for all
  using (public.est_admin_general())
  with check (public.est_admin_general());

-- appartenance_gt (personne → GT) : sa propre appartenance + admin.
create policy "appartenance_gt_select"
  on public.appartenance_gt for select
  using (personne_id = auth.uid() or public.est_admin_general());
create policy "appartenance_gt_insert_self"
  on public.appartenance_gt for insert
  with check (personne_id = auth.uid());
create policy "appartenance_gt_update_self_ou_admin"
  on public.appartenance_gt for update
  using (personne_id = auth.uid() or public.est_admin_general())
  with check (personne_id = auth.uid() or public.est_admin_general());

-- ============================================================
-- droit_admin
-- ============================================================

-- Lecture : la personne voit ses propres droits ; les admins nationaux
-- voient tout.
create policy "droit_admin_select"
  on public.droit_admin for select
  using (personne_id = auth.uid() or public.est_admin_national());

-- Toute écriture : admin national uniquement.
create policy "droit_admin_write_national"
  on public.droit_admin for all
  using (public.est_admin_national())
  with check (public.est_admin_national());

-- ============================================================
-- journal_admin
-- ============================================================

-- Lecture : admin national + DPD.
create policy "journal_admin_select"
  on public.journal_admin for select
  using (public.est_admin_national() or public.est_dpd());

-- Écriture : toute personne authentifiée peut ajouter un log
-- (l'application décide quand journaliser). Pas d'UPDATE ni DELETE
-- (immuabilité de l'audit log, RGPD §5K).
create policy "journal_admin_insert_auth"
  on public.journal_admin for insert
  with check (auth.uid() is not null);
