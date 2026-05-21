# Manifest : Phase 4, Chantier 4.3 — Marché solidaire

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-4-chantier-4.3-marche-solidaire`
**Commit final** : `58decab`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migrations 023 + 024 + 025 + 026)

- [x] **Table `produit_marche`** : annonces produits, mode `vente` ou `don`, double prix EUR (centimes int) + T99CP (string bigint-safe). Toggle vente/don enforced en BDD via CHECK `produit_marche_prix_coherent`. Modes de retrait main propre / envoi postal (CHECK : au moins un). Statuts `disponible | reserve | vendu | retire | expire`. Champ `derniere_activite_le` pour le job de fraîcheur 3 mois (spec §6F). RLS modération a posteriori : lecture publique pour les statuts visibles, écriture par la vendeureuse + modé/admin `marche`.
- [x] **Table `boutique_marche`** : boutiques éphémères, `sens` `propose | cherche`, plage `ouverte_du / ouverte_au` optionnelle (CHECK `boutique_marche_dates_coherentes`), lieu géolocalisable. Statuts `ouverte | fermee | retiree`.
- [x] **Table `produit_boutique`** : rattachement n-n (un produit peut appartenir à plusieurs boutiques). RLS qui autorise la vendeureuse du produit OU la créatrice de la boutique à rattacher.
- [x] **Table `minimarche_solidaire`** : événements physiques, géolocalisé, plage de dates `commence_le / termine_le`, tableau `monnaies_acceptees text[]` avec CHECK `<@ {T99CP, EUR, G1, MNLC}` (4 monnaies physiques de la spec §6F). Statuts `annonce | en_cours | termine | annule | retire`.
- [x] **Table `notation_marche`** : notation 5 étoiles unilatérale (acheteureuse → vendeureuse). CHECK : 1-5, pas auto-notation, UNIQUE par couple (produit × acheteureuse). RLS d'insertion qui exige : produit au statut `vendu` + auteurice = `acheteureuse_id` + vendeureuse_id correspond bien au produit.
- [x] **Vue `notation_marche_stats`** : agrégation `moyenne_etoiles` + `nombre_notations` par vendeureuse. Lecture publique (transparence des notes).

### Code applicatif

- [x] **Types Database** : `ProduitMarche`, `BoutiqueMarche`, `ProduitBoutique`, `MinimarcheSolidaire`, `NotationMarche`, `NotationMarcheStats`, plus 4 unions (`ModeProduitMarche`, `StatutProduitMarche`, `SensBoutiqueMarche`, `StatutBoutiqueMarche`, `StatutMinimarche`, `MonnaieMarcheMinimarche`).
- [x] **Config centralisée** (`lib/marche/config.ts`) : 3 onglets, 4 monnaies (catalogue + flag `enLigne` pour limiter aux 2 en ligne), helpers d'affichage `formaterEuros` / `formaterT99CP`. Réexport des helpers de frais depuis `lib/payments/frais` (pattern « 5 % EUR / 0 % T99CP » sans tirer le PaymentService côté client).
- [x] **Extraction `lib/payments/frais.ts`** : sortie des 2 helpers purs de calcul de frais hors de `lib/payments/index.ts`, qui dépend de `node:crypto` via `MockPaymentService`. Permet d'importer côté client sans casser le bundle.
- [x] **Validations Zod** (`lib/validations/marche.ts`) : `creerProduitMarche` (avec refinement vente/don cohérent + retrait au moins un + lat/lng cohérents), `retirerProduit`, `marquerVendu`, `noterVendeureuse`, `creerBoutique` (refinement dates + lat/lng), `creerMinimarche` (refinement monnaies non vides + dates), `rattacherProduitBoutique`, `acheterProduit` (refinement T99CP exige tx_hash).
- [x] **Server Actions** (`app/(public)/s-entraider/marche/actions.ts`) :
  - `creerProduitMarche` : auth + Turnstile + slug unique.
  - `retirerProduit` : vendeureuse OU modé. Refuse les statuts terminaux.
  - `marquerProduitVendu` : vendeureuse uniquement, garde-fou `acheteureuse_id ≠ vendeureuse_id`.
  - `noterVendeureuse` : auth + Turnstile + traduction du `23505` en message clair (« déjà noté »).
  - `acheterProduit` : branche EUR (Stripe Checkout mock via `lib/payments`, frais 5 %, passage en `reserve`) ou T99CP (`getT99CPService`, transaction directe, passage en `vendu`).
  - `creerBoutique`, `rattacherProduitBoutique` (avec traduction `23505`), `creerMinimarche` (avec dédup monnaies).
- [x] **Couche de requêtes** (`lib/marche/requetes.ts`) : `listerProduitsMarche` (avec filtre mode + catégorie + statuts), `produitParSlug`, `listerNotationsProduit`, `listerBoutiques`, `boutiqueParSlug`, `produitsDeLaBoutique`, `listerMinimarches`, `minimarcheParSlug`. Hydratation des personnes + des stats de notation par IN-clause unique.

### Composants

- [x] **`<DoubleAffichagePrix>` + `<BadgesMonnaies>`** (`components/marche/BadgesMonnaies.tsx`) : badges EUR/T99CP côte à côte, ou « Don gratuit ». Badges 4 monnaies physiques (couleur différenciée en ligne / physique).
- [x] **`<NotationEtoiles>` + `<SelectEtoiles>`** : lecture seule (note fractionnaire avec fill partiel) + saisie (vrais `<input type="radio">` cachés visuellement, accessible clavier).
- [x] **`<CarteProduit>`** : badge mode (vente/don), titre, double prix, lieu, modes de retrait, note moyenne vendeureuse.
- [x] **`<CarteBoutique>`** : badge sens, nom, plage temporelle, lieu OU « boutique en ligne », nombre de produits rattachés.
- [x] **`<CarteMinimarche>`** : statut, date, lieu, badges des monnaies acceptées.
- [x] **`<FormulaireCreationProduit>`** : toggle vente/don qui bascule l'affichage des prix, validation côté client + serveur, double prix EUR/T99CP, modes de retrait.
- [x] **`<FormulaireCreationBoutique>`** : sens (propose/cherche), plage de dates optionnelle (les deux ou aucune), lieu optionnel.
- [x] **`<FormulaireCreationMinimarche>`** : titre, description, lieu, plage de dates obligatoire, 4 cases monnaies acceptées (ordre du catalogue préservé), conversion ISO 8601 avant envoi.
- [x] **`<FormulaireAchat>`** : double choix EUR/T99CP côte à côte (cf. spec « la personne acheteuse choisit »). En mock, génère un tx_hash factice côté client pour T99CP.
- [x] **`<FormulaireNotation>`** : 5 étoiles + commentaire optionnel + Turnstile.

### Pages

- [x] **`/s-entraider/marche`** : hub avec 3 cartes (Produit / Boutique / Minimarché) + bandeau « Conditions d'usage ».
- [x] **`/s-entraider/marche/produits`** : liste avec 3 filtres (Tous / En vente / En don).
- [x] **`/s-entraider/marche/produits/[slug]`** : fiche détail + carte d'achat (si visiteur·euse ≠ vendeureuse ET disponible ET vente) + carte notation (si statut vendu) + liste des notations existantes + footer avec étoiles vendeureuse.
- [x] **`/s-entraider/marche/produits/nouveau`** : auth requise, formulaire produit.
- [x] **`/s-entraider/marche/boutiques`** : liste boutiques ouvertes.
- [x] **`/s-entraider/marche/boutiques/[slug]`** : fiche boutique avec liste des produits rattachés.
- [x] **`/s-entraider/marche/boutiques/nouvelle`** : auth requise, formulaire boutique.
- [x] **`/s-entraider/marche/minimarches`** : liste minimarchés à venir.
- [x] **`/s-entraider/marche/minimarches/[slug]`** : fiche minimarché avec badges monnaies et conseils d'organisation.
- [x] **`/s-entraider/marche/minimarches/nouveau`** : auth requise, formulaire minimarché.

### Layout

- [x] **`/s-entraider/layout.tsx`** : remplacement des entrées greyed « SEL (4.2) » et « Marché solidaire (4.3) » par des vrais liens vers `/s-entraider/sel` et `/s-entraider/marche` (le SEL existait déjà en code mais n'était pas wiré dans la nav).

### Tests

- [x] **29 nouveaux tests unitaires** (`tests/unit/validations/marche.test.ts`) : création produit (vente, don, retrait minimal, lat/lng), notation 1-5, marquerVendu, boutique permanente / éphémère / dates incohérentes, minimarché 4 monnaies / hors catalogue, achat EUR/T99CP, helpers de frais et format euros/T99CP. Total **192 tests verts** (+29).
- [x] **E2E Playwright** (`tests/e2e/marche.spec.ts`) : 8 scénarios (hub, 3 onglets, liste produits/boutiques/minimarchés, 3 redirections sans auth, 404 slug).
- [x] **Lint Biome + typecheck tsc + build Next.js** : tous verts. Build : 67 routes au total, +7 pour le marché.

## Livré partiellement

- [ ] **Wallet T99CP réel** : le `<FormulaireAchat>` génère un tx_hash factice quand l'utilisateurice choisit T99CP (cohérent avec ce qu'a fait 3.3 et 4.2). La signature wallet réelle (Polygon) viendra avec le chantier T99CP dédié + branchement `wallet_t99cp` par personne.
- [ ] **Rattachement produit ↔ boutique depuis l'UI** : la Server Action `rattacherProduitBoutique` est prête et la RLS bilatérale est en place, mais l'UI pour ajouter un produit à une boutique depuis la fiche n'a pas été exposée (sera en polish ou 9.2).
- [ ] **Catégories en arborescence** : la colonne `categorie_slug` accepte du texte libre pour l'instant. L'arborescence définie en admin (cf. spec §6F « catégories : arborescence définie en admin (style Vinted) ») viendra avec le chantier 9.2 (tableau de bord admin).
- [ ] **Confirmation post-Stripe** : l'achat EUR redirige vers Stripe Checkout (mock) puis revient sur la fiche avec `?achat=succes`. La transition `reserve → vendu` après confirmation Stripe réelle nécessitera la route webhook (à brancher avec les clés Stripe en prod).

## Non livré (et pourquoi)

- [ ] **Console de modération marché** : pas d'onglet `/admin/moderation/marche` pour traiter les contestations / signalements. Sera ajouté quand les premiers signalements arriveront (workflow modération a posteriori → arbitrage humain).
- [ ] **Job de fraîcheur 3 mois** : la colonne `derniere_activite_le` est posée et l'index existe (`produit_marche_freshness_idx`). Le cron qui passe les annonces inactives en `expire` sera posé en chantier 11.3 (mêmes besoins que `crediterPrestationsEnAttente` SEL).
- [ ] **Notification messagerie « 3 mois sans interaction »** : dépend de la messagerie interne (chantier 7.5). Pour 4.3 v1, l'expiration est silencieuse côté usager·ère.
- [ ] **Galerie multi-image** : la table porte une colonne `image_url` unique. Une vraie galerie viendra avec un chantier dédié au stockage Supabase Storage si nécessaire.

## Contenus à arbitrer

Aucun. Le chantier 4.3 est entièrement technique — pas de texte éditorial à rédiger ; les microcopies posées sont fonctionnelles (« Crée la première », « Au moins un mode de retrait », etc.) et conformes à la règle d'or de non-invention.

## Décisions techniques prises

- **Toggle vente/don enforced en BDD via CHECK `produit_marche_prix_coherent`** : empêche d'avoir un produit `don` avec des prix > 0 ou un produit `vente` sans aucun prix. Cohérent avec la doctrine politique fixée par la spec §6F (« toggle sur le même formulaire »).
- **Prix T99CP stocké en `text` (regex `^\d+$`)** : reprend le pattern des dons T99CP de 3.3. JS Number ne représente pas fidèlement un bigint > 2^53, donc on sérialise en string bigint-safe.
- **Catalogue des 4 monnaies enforced via CHECK array `<@ {T99CP, EUR, G1, MNLC}`** : empêche d'insérer une monnaie hors catalogue (BTC, USD...) même par SQL direct. La spec §6F fixe ce périmètre, le code l'enforce.
- **Notation unilatérale par contrainte BDD** : la table `notation_marche` ne contient pas de chemin pour la vendeureuse → acheteureuse. Pas de système réciproque type Airbnb qui pousse à la complaisance (décision politique §6F).
- **Notation liée à un produit acheté** : empêche le spam (la RLS d'insertion vérifie le produit au statut `vendu` + la cohérence du couple `vendeureuse_id`). UNIQUE sur (produit, acheteureuse) empêche les notations multiples sur la même transaction.
- **Pas de table `commande` dédiée en v1** : le statut du produit + la table `notation_marche` couvrent les besoins de 4.3. Une table `commande` sera ajoutée si le besoin d'un panier multi-articles ou d'un historique d'achats par personne se concrétise.
- **`lib/payments/frais.ts` séparé de `lib/payments/index.ts`** : extraction des 2 helpers purs hors du module qui dépend de `node:crypto` (via `MockPaymentService`). Permet l'import client sans casser le bundle Next.js. Cohérent avec la doctrine adapter du CLAUDE.md §6.

## Tests

- Unitaires : **192 tests verts** (+29 pour 4.3).
- E2E Playwright : 8 scénarios couvrant la navigation des 3 onglets, le redirect d'auth, et le 404 produit.
- Lint Biome, typecheck tsc, build Next.js : tous verts.
- Build production : 67 routes au total dont 7 pour le marché.

## Notes pour les chantiers suivants

- **Chantier 5.1 (Adhérer)** : peut s'inspirer du double affichage EUR/T99CP du marché. La carte d'adhésion 12 €/12 T99CP réutilisera `DoubleAffichagePrix`.
- **Chantier 6.1 (Carte unifiée)** : ajouter les marqueurs `produit_marche` (statut `disponible`, géoloc renseignée), `boutique_marche` (statut `ouverte`, géoloc renseignée), `minimarche_solidaire` (statut `annonce` ou `en_cours`). Index `_geo_idx` posés à cet effet sur les 3 tables.
- **Chantier 9.2 (Admin)** : poser l'arborescence des catégories produits (table `categorie_marche` ou similaire) et migrer `produit_marche.categorie_slug text` vers une FK.
- **Chantier 11.3 (Cron prod)** : ajouter un cron qui passe les `produit_marche` au statut `expire` après 3 mois d'inactivité (utiliser l'index `produit_marche_freshness_idx`).
- **Chantier T99CP dédié** : table `wallet_t99cp` (personne_id, adresse) à créer pour remplacer les adresses stub utilisées par 4.2 et 4.3 (`0xperso_<id>`).
- **Chantier 7.5 (Messagerie)** : intégrer la modale « 3 mois sans interaction, que veux-tu faire ? » côté inbox.
