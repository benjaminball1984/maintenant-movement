# Manifest : Phase 7, Chantiers 7.3 + 7.4 + 7.5 + 7.6

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-7-chantier-7.3-7.6-stubs`
**Commit final** : `À RENSEIGNER PAR LE COMMIT FIX SUIVANT`
**Durée approximative** : 1 session Claude Code (7.4 complet + 7.3/7.5/7.6 stubs)

---

## Stratégie

Ce commit livre **un chantier réel (7.4 Sondages)** et **trois stubs explicites (7.3 journal-affiche, 7.5 réseau social, 7.6 Décider)**. Les trois stubs correspondent à des features qui demandent soit des dépendances externes (Canva API, LiveKit server, Anthropic API clés) soit un volume de code qui mérite sa propre session. Au lieu de poser des bouts épars et fragiles, on rend des pages honnêtes qui expliquent l'état de la feature et renvoient vers les pages existantes.

---

## 7.4 — Sondages (chantier complet)

### Schéma BDD (migration 032)

- [x] **Table `sondage`** : titre, question, options (`text[]` 2-10), image_url, mode (`classique | pondere`), commune_id (FK optionnelle), géolocalisation, statut. CHECK sur `array_length(options, 1) between 2 and 10` enforce la spec §4D. RLS : lecture publique des ouverts/fermés/archives ; insert auth ; update créatrice tant qu'ouvert + modé/admin.
- [x] **Table `reponse_sondage`** : `option_index` 0-based, variables sociodémo optionnelles (code_postal, tranche_age, pronom, genre_declare). UNIQUE par couple (sondage, personne) = 1 vote max. CHECK sur la tranche d'âge (6 valeurs). RLS : la personne voit son propre vote ; l'agrégat est exposé par la vue.
- [x] **Vue `sondage_resultats`** : agrégation `count(*) by option_index`. Lecture publique (transparence des résultats agrégés).

### Code applicatif

- [x] **Types Database** : `Sondage`, `ReponseSondage`, `SondageResultats`, unions `ModeSondage | StatutSondage | TrancheAge`.
- [x] **Validations Zod** (`lib/validations/sondages.ts`) : `creerSondage` (options 2-10, refinement géo) + `voterSondage` (option_index 0-9, sociodémo optionnels).
- [x] **Server Actions** (`app/(public)/s-informer/sondages/actions.ts`) : `creerSondage` (Turnstile + auth + slug unique), `voterSondage` (vote connecté obligatoire cf. doctrine §4D, vérifie le statut `ouvert` et que `option_index` est dans la plage, traduit le 23505 en « tu as déjà voté »).
- [x] **Couche de requêtes** : `listerSondagesOuverts`, `sondageParSlugAvecResultats` (compte par option, total, flag `pondere_disponible` à true dès 300 votes pour le mode pondéré), `aVotePersonne`.

### Composants + Pages

- [x] **`<FormulaireCreationSondage>`** : titre + question + textarea options (1 par ligne) + radio mode + Turnstile.
- [x] **`<FormulaireVote>`** : radios options + `<details>` repliable pour les sociodémo optionnels (mode pondéré uniquement) + Turnstile.
- [x] **`/s-informer/sondages`** : liste des sondages ouverts/fermés avec badge mode + nombre d'options.
- [x] **`/s-informer/sondages/[slug]`** : fiche détail + formulaire vote (si connecté·e et pas encore voté) + bandeau « Tu as déjà voté » + résultats agrégés en barres `<progress>` avec pourcentage.
- [x] **`/s-informer/sondages/nouveau`** : auth requise, formulaire.

### Tests 7.4

- [x] **7 nouveaux tests unitaires** : création (minimal, refuse < 2 options, refuse > 10 options) + vote (simple, option_index négatif refusé, tranche d'âge OK, code postal mal formé refusé).
- [x] **E2E** : rendu liste + redirect auth création.

---

## 7.3 — Journal-affiche (stub explicite)

- [x] **`/s-informer/journal`** : page stub avec rappel doctrine §4C (30 modèles Canva + agent Claude + Paged.js + Puppeteer + Stripe/T99CP pour impression à façon). Indique clairement les dépendances manquantes :
  - modèles Canva à fournir par l'équipe édito ;
  - clés API Anthropic à brancher (chantier 11.3) ;
  - Stripe/T99CP en place pour les commandes.
- [x] Section pédagogique du modèle économique (impression locale gratuite, impression à façon en T99CP/euros, plafond 100 affiches, ~0,023 $ par affiche avec Haiku 4.5).

**Non livré et pourquoi** : la feature complète demande des dépendances externes non fournies (modèles Canva, clés API). Plutôt que de bricoler un flux qui ne marchera pas, on rend une page honnête qui explique l'état.

---

## 7.5 — Réseau social (stub explicite)

- [x] **`/s-informer/reseau`** : page stub avec rappel des règles strictes de la doctrine §4E (pas de pub, pas d'algo caché, pas d'autoplay, pas de captation, encart financement permanent). Renvoie vers Média Maintenant et Mobiliser en attendant.

**Non livré et pourquoi** : le réseau social demande plusieurs tables nouvelles (`publication`, `relation_ami`, `message_interne`), un algorithme de flux strict (4 niveaux), une messagerie temps réel, et une couche de modération a posteriori complète. C'est un gros chantier dédié.

---

## 7.6 — Décider (stub explicite)

- [x] **`/s-informer/decider`** : page stub avec 3 cartes pédagogiques :
  - **3 modes de décision hiérarchisés** : consensus / levée d'objections (PAS « consentement ») / jugement majoritaire Balinski-Laraki (max 10 propositions, mentions Excellent → À rejeter).
  - **Stack technique** : LiveKit self-hosted + couche métier maison + chat Décider tokens.
  - **Privacy par périmètre** : GT local / commune / GT fédéré / Assemblée Confédérale.

**Non livré et pourquoi** : Décider est un chantier majeur (LiveKit serveur, tables `salle_decider`, `reunion`, `vote`, `bulletin`, algorithme du jugement majoritaire avec mention médiane, bot Décider, archivage chiffré). Une session dédiée.

---

## Tests globaux

- Unitaires : **245 tests verts** (+7 pour 7.4).
- E2E Playwright : 4 nouveaux scénarios (sondages liste, redirect auth, stubs 7.3/7.5/7.6 rendus, stub Décider affiche 3 modes).
- Lint, typecheck, build : tous verts.

---

## Notes pour les chantiers suivants

- **Chantier 7.3 vrai** : poser le pipeline 30 modèles Canva → Claude API → Paged.js → Puppeteer → PDF print-ready. Nécessite Anthropic API key + serveur Puppeteer.
- **Chantier 7.5 vrai** : tables `publication` + `relation_ami` + `message_interne` ; algorithme de flux strict ; messagerie temps réel (Supabase Realtime ou WebSocket dédié).
- **Chantier 7.6 vrai** : LiveKit auto-hébergé ; tables `salle_decider`, `reunion`, `proposition_vote`, `bulletin_vote` ; algorithme Balinski-Laraki (mention médiane) ; bot Décider tokens.
- **Chantier 8.1 (Notifications)** : annoncer les nouveaux sondages dans la newsletter du vendredi.
- **Carte unifiée 6.1** : ajouter les sondages géolocalisés (statut `ouvert` + lat/lng renseignés). À faire en polish.
