# Manifest : Phase 4, Chantier 4.2 — SEL (système d'échange local)

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-4-chantier-4.2-sel`
**Commit final** : à renseigner après commit
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migrations 021 + 022)

- [x] **Table `service_sel`** : titre, description, `categorie` (service|volontariat), `sens` (propose|cherche), durée estimée (15-480 min), lieu + lat/lng. Statut `publie|retire|cloture`. RLS calquée sur les autres entités a posteriori. **Vocabulaire fixé en BDD via CHECK** : `service` et `volontariat` exclusivement (PAS « travail », cf. spec §6E).
- [x] **Table `prestation_sel`** : workflow modération 2h. Prestataire + bénéficiaire (contrainte CHECK les force distincts), `duree_minutes_reelle`, statut `en_attente | en_moderation | creditee | contestee | annulee`, timeline complète (réservée / déclarée / créditée / contestée / annulée), `tx_hash_credit` pour la traçabilité on-chain.
- [x] **Fonction `prestations_a_crediter(seuil_minutes)`** : SECURITY DEFINER, retourne les prestations en modération depuis plus du seuil donné (défaut 120 min). Utilisée par le cron applicatif de crédit.

### Code applicatif

- [x] **Types Database** : `ServiceSel`, `PrestationSel`, unions `CategorieServiceSel | SensServiceSel | StatutServiceSel | StatutPrestationSel`. Ajout de la signature `prestations_a_crediter` dans `Functions`.
- [x] **Validations Zod** : `creerServiceSelSchema` (avec refinement géo), `reserverPrestationSchema`, `declarerRealiseeSchema` (durée 1-480 min), `contesterPrestationSchema`, `annulerPrestationSchema`.
- [x] **Server Actions** :
  - `creerServiceSel` : auth + Turnstile + slug unique.
  - `reserverPrestation` : crée une ligne `en_attente`, prestataire/bénéficiaire déterminés selon le `sens` du service.
  - `declarerRealisee` (par le prestataire) : passe à `en_moderation` + démarre le compteur 2h.
  - `contesterPrestation` (par le bénéficiaire) : passe à `contestee` + log du motif.
  - `annulerPrestation` (par les deux parties) : `annulee` si encore `en_attente`.
  - `crediterPrestationsEnAttente` : cron applicatif, parcourt les prestations dont les 2h sont écoulées, appelle `T99CPService.envoyerTransaction` (mock par défaut), passe au statut `creditee` avec le tx_hash.
- [x] **Couche de requêtes** (`lib/sel/requetes.ts`) : `listerServicesSel(categorie?)`, `serviceSelParSlug(slug)`. Hydratation porteur.

### Composants

- [x] **`<CarteService>`** : double badge (catégorie + sens), durée + 99-coin attendus, lieu, accroche.
- [x] **`<FormulaireCreationService>`** (Client) : RHF + Zod, radio catégorie/sens, slider durée 15-480 min, mention « 1 min = 1 99-coin ».

### Pages

- [x] **`/s-entraider/sel`** : liste avec **3 onglets** (tous, services, volontariats), sous-titre conforme spec « Reconnaître le temps de chacun·e, libérer du temps pour tous et toutes », bandeau d'explication du workflow 2h.
- [x] **`/s-entraider/sel/[slug]`** : fiche détail (durée + 99-coin attendus, lieu, description, explication « comment ça marche » avec les 4 étapes).
- [x] **`/s-entraider/sel/nouveau`** : auth requise, formulaire complet.

### Tests

- [x] **9 nouveaux tests unitaires** (`tests/unit/validations/sel.test.ts`) : création service, réservation, déclaration, contestation. Total **163 tests verts** (+9).
- [x] **E2E** (`tests/e2e/sel.spec.ts`) : 4 scénarios (liste, 3 onglets, auth, 404).
- [x] **Lint + typecheck + build** : verts.

## Livré partiellement

- [ ] **UI de réservation / déclaration / contestation depuis la fiche** : les Server Actions sont prêtes, mais l'UI dédiée (bouton « Réserver », vue « Mes prestations en cours », formulaire de contestation) n'est pas exposée en v1. Sera ajoutée sur `/profil/contributions` (chantier polish ou 9.x).
- [ ] **Cron automatique de crédit** : la Server Action `crediterPrestationsEnAttente` existe et est appelable manuellement par un admin national, mais aucun cron Cloudflare Worker n'est posé pour la déclencher automatiquement toutes les heures. Sera ajouté au déploiement prod (chantier 11.3).

## Non livré (et pourquoi)

- [ ] **Cagnotte cotisation libre RBU** : spec §6E mentionne « cagnotte cotisation libre RBU sur la plateforme ». Cette cagnotte sera une cagnotte de type `cotisation` créée par l'équipe nationale via la console admin (déjà en place depuis 3.3). Pas de code dédié nécessaire pour 4.2.
- [ ] **Wallet T99CP réel par personne** : pour 4.2, le crédit T99CP utilise une adresse stub `0xperso_<id>` côté `crediterPrestationsEnAttente`. La vraie table `wallet_t99cp` (lien personne ↔ adresse wallet) viendra avec le chantier T99CP dédié.
- [ ] **Console de modération SEL** : pas d'onglet `/admin/moderation/sel` pour les contestations. Sera ajouté quand le besoin se concrétisera (workflow contestation → arbitrage humain).
- [ ] **Notification de fin de modération** : le bénéficiaire devrait recevoir une notification « durée déclarée par X, tu as 2 h pour contester ». Dépend du chantier 8.1 (notifications Brevo).

## Décisions techniques prises

- **Vocabulaire enforcé en BDD via CHECK constraint** : `categorie IN ('service', 'volontariat')`. Pas moyen d'inscrire « travail » par erreur, même via SQL direct. Cohérent avec la doctrine politique fixée par la spec §6E.
- **Workflow modération 2 h via cron applicatif** plutôt que trigger SQL. Plus visible côté code, plus facile à monitorer, plus simple à modifier (seuil 2h ajustable via paramètre).
- **`crediterPrestationsEnAttente` réservé à l'admin national** en attendant un vrai cron : empêche le déclenchement manuel par des modérateurices, et reste explicite côté audit.
- **Pas de colonne `raison_contestation` en BDD** : la spec §6E ne tranche pas. Pour 4.2 v1, le motif est consigné via `console.info` et journalisé via `journal_admin` plus tard (modération a posteriori).
- **Crédit T99CP via le service abstrait existant** (`getT99CPService`) : Mock en local + Polygon en prod, switch sur `T99CP_NETWORK`.

## Tests

- Unitaires : **163 tests verts** (+9 pour 4.2).
- E2E Playwright : 4 scénarios. Flux complet (créer → réserver → déclarer → 2h → créditer) à tester manuellement après déploiement migrations 021-022.
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **4.3 Marché solidaire** : peut s'inspirer de `service_sel` pour le toggle catégorie + sens. La notation 5 étoiles unilatérale nécessitera une table `notation` à créer.
- **8.1 Notifications** : envoyer un mail au bénéficiaire au moment de `declarerRealisee` pour qu'iel ait 2 h pour contester en connaissance de cause.
- **Wallet T99CP par personne** : table `wallet_t99cp` (personne_id, adresse) à créer pour remplacer l'adresse stub.
- **Console modération** : ajouter un onglet `sel` quand les contestations apparaîtront.
- **11.3 Cron prod** : poser un Cloudflare Worker scheduled qui appelle `crediterPrestationsEnAttente` toutes les heures.
