# Manifest : Phase 3, Chantier 3.1 — Pétitions

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-3-chantier-3.1-petitions`
**Commit final** : à renseigner après commit
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migrations 012 + 013)

- [x] **Table `petition`** (`supabase/migrations/20260520120012_petition.sql`) : slug unique, titre, texte, destinataire, image_url, objectif, créateurice, cycle de vie `en_moderation → publiee | rejetee → archivee`, raison de rejet, journal de modération (`modere_par`, `modere_le`). 3 contraintes CHECK (statut, objectif, slug format) et 2 contraintes de cohérence (rejet sans raison interdit, modération partielle interdite). 3 index (statut, créateurice, publiées récentes). Trigger `updated_at`.
- [x] **Politiques RLS `petition`** : lecture publique des publiées ; créateurice voit ses brouillons et rejets ; modérateurice / admin voient tout. Insertion auth requise (le `createurice_id` doit être `auth.uid()`). Update créateurice tant que `en_moderation` ; modérateurice à toujours.
- [x] **Table `signature_petition`** (`supabase/migrations/20260520120013_signature_petition.sql`) : `personne_id` nullable (signature anonyme), nom/prénom/email/code_postal obligatoires, téléphone optionnel, cases newsletter + autorisation contact. CHECK email et code_postal. Unique sur `(petition_id, lower(email))` pour interdire les doublons insensiblement à la casse. Index sur `petition_id`, `personne_id`, et département (préfixe code_postal).
- [x] **Politiques RLS `signature_petition`** : aucune lecture publique des lignes individuelles (vie privée). Signataire connectée voit ses signatures, créatrice voit les signatures ayant accepté le contact, modé et admin voient tout. Insertion ouverte si `personne_id is null` ou `= auth.uid()`. Update/delete par la signataire (droit RGPD d'opposition).
- [x] **Vue `petition_compteur`** : agrégat lisible publiquement (via la RLS de `petition`) — utile pour les futures requêtes batch.
- [x] **Fonction `nombre_signatures(uuid)`** : `SECURITY DEFINER`, autorise le count public sans exposer la table de signatures. Utilisée par `lib/petitions/requetes.ts`.

### Server Actions (`app/(public)/mobiliser/petitions/actions.ts`)

- [x] **`creerPetition`** : valide Zod + Turnstile, exige auth, génère un slug unique via `genererSlugUnique` (suffixage `-2`, `-3`, …), insert au statut `en_moderation`, retourne `{ ok: true, slug }`.
- [x] **`signerPetition`** : valide Zod + Turnstile, support anonyme (pas de session) et connectée, vérifie que la pétition est publiée, retourne un message clair sur conflit unique (code Postgres 23505 = déjà signé). Best-effort `inscrireNewsletter` avec tag `origine` (`petition-<slug>`), `action` (`signature-<slug>`) et département (préfixe code postal), sans bloquer la signature si l'inscription échoue.
- [x] **`modererPetition`** : valide Zod, exige auth + droit `petitions` (RPC `est_moderateurice('petitions')` ou `est_admin_general`), met à jour statut + journal, revalide les chemins concernés.
- [x] **Pattern `ResultatAction`** : `{ ok: true, ... } | { ok: false, message }` cohérent avec 1.2 et 1.3.

### Couche de requêtes (`lib/petitions/requetes.ts`)

- [x] **`listerPetitionsPubliees`** : SELECT publiees triées récentes, limite 50. Hydrate avec nom/prénom de la créatrice (IN-clause unique sur `personne`) et le compteur via RPC.
- [x] **`petitionParSlug`** : fetch d'une pétition par slug, accessible publiquement uniquement si publiée (RLS).
- [x] **`petitionAlaUne`** : raccourci pour la « Une » de la home.
- [x] **`listerPetitionsAModerer`** : pour la console admin, tri FIFO (le plus ancien d'abord).
- [x] **Découplage net** : les pages ne font aucun SELECT Supabase direct, tout passe par cette couche.

### Logique métier stretch (`lib/petitions/stretch.ts`)

- [x] **`calculerEtatStretch(signatures, objectif)`** applique la règle spec §5A : tant que `signatures < 90 %` de l'objectif, on garde l'objectif initial ; dès franchissement, on bascule sur `objectif × 1,5` (arrondi sup). Renvoie `{ objectifEffectif, pourcentage, estEtire, estAtteint }`. Garde-fous pour signatures négatives et objectif <= 0.
- [x] **Constantes exportées** `SEUIL_STRETCH = 0.9` et `FACTEUR_STRETCH = 1.5` (ajustables centralement si la règle évolue).

### Composants UI

- [x] **`<CompteurStretch>`** (`components/petitions/CompteurStretch.tsx`) : jauge `<progress>` native accessible, deux tailles (`sm` pour les cartes, `md` pour la fiche détail), badge « Objectif ×1,5 » quand étiré, message « Objectif atteint, on continue » quand le nouvel objectif est dépassé.
- [x] **`<CartePetition>`** : carte de la liste, avec accroche tronquée proprement (220 chars, sans couper un mot), créatrice formatée « Prénom N. ».
- [x] **`<FormulaireCreationPetition>`** (Client Component) : RHF + Zod, champs titre / destinataire / image URL / texte / objectif / Turnstile. Validation côté client cohérente avec la Server Action. Redirige vers la fiche détail au succès.
- [x] **`<FormulaireModeration>`** (Client Component) : deux actions « Publier » et « Rejeter », la raison de rejet n'apparaît qu'au clic sur Rejeter (ne pousse pas à la décision négative). Confirmation visible après succès.
- [x] **`<UnePetition>`** (mise à jour 2.1 → 3.1) : fetche désormais la pétition la plus récente publiée, branche `<CompteurStretch>` et `<ModaleSignaturePetition>` avec la vraie pétition. État vide propre (lien « lance la première ») si aucune.

### Pages

- [x] **`/mobiliser/petitions`** : liste des pétitions publiées (`<CartePetition>` x N), CTA « Lancer une pétition » adaptatif (texte change si pas connecté), état vide propre. Footer informatif sur le délai de modération (24-48 h).
- [x] **`/mobiliser/petitions/[slug]`** : fiche complète. Image (si fournie), titre, destinataire, `<CompteurStretch>` md, CTA « Signer cette pétition » (qui ouvre la modale), texte intégral, créatrice + date de lancement. Gère aussi les pétitions en attente / rejetées / archivées (visible par leur créatrice uniquement, RLS).
- [x] **`/mobiliser/petitions/nouvelle`** : auth requise (`getSessionOuRediriger`), redirige sinon vers `/connexion?prochaine=...`. Affiche les conditions de publication + formulaire.
- [x] **`/admin/moderation/petitions`** : layout `/admin` qui filtre l'accès (au moins un droit admin/modération, sinon redirige). Liste FIFO des pétitions en attente avec `<details>` pour voir le texte complet, formulaire de modération inline.

### Tests

- [x] **Unitaires** (`tests/unit/petitions/`) :
  - `stretch.test.ts` : 9 tests couvrant les seuils (sous 90 %, pile 90 %, juste au-dessus), l'arrondi sup, l'atteinte du stretch, le plafonnement à 100 %, les garde-fous (signatures négatives, objectif nul).
  - `slugifier.test.ts` : 8 tests (diacritiques, casse, espaces multiples, tirets de bord, longueur max, symboles, conformité regex SQL, chaîne entièrement symbolique).
- [x] **Total unit** : **86 tests verts** (+17 par rapport à 2.1).
- [x] **E2E** (`tests/e2e/petitions.spec.ts`) : liste accessible et état rempli/vide géré, redirection auth, 404 sur slug inexistant.
- [x] **Lint** : Biome `check` zéro erreur (regex de slugifier réécrite avec `String.fromCodePoint` pour échapper proprement la plage des combining marks U+0300-U+036F, qui faisait râler `noMisleadingCharacterClass`).
- [x] **Typecheck** : `tsc --noEmit` zéro erreur.
- [x] **Build production vert** : 37 routes (+4 par rapport à 2.1). Première Load JS pour la fiche détail = 140 kB (formulaires + modale lazy-loadés OK).

## Livré partiellement

- [ ] **Tests E2E flux complet** : sans BDD branchée localement, le scénario complet « créer → modérer → publier → signer → vérifier le compteur » ne peut pas tourner en CI. La spec couvre les redirections d'auth et l'état vide. Le flux complet sera testé manuellement après `supabase db push` des migrations 012 + 013.
- [ ] **Affichage image dans la fiche détail** : utilisation de `next/image` avec `unoptimized` parce que les URL viennent d'uploads externes inconnus au build. L'upload direct côté Supabase Storage (composant `<UploadMedia>`) viendra plus tard, probablement au chantier polish 11.x. Pour l'instant, on accepte une URL existante.

## Non livré (et pourquoi)

- [ ] **Tag newsletter par axe « action »** : le tag `action-<slug>` est posé côté signature mais l'envoi réel à Brevo dépend du chantier 8.1 (config Brevo) ; en attendant, `MockEmailService` log la demande dans la console.
- [ ] **Modale signature anonyme connectée à un compte si email connu** : la spec §3 ne tranche pas ce cas. La signature crée toujours une ligne `signature_petition`, distincte de la création d'un compte. Si la signataire est connectée, `personne_id` est rempli ; sinon, il reste null. La pré-remplissage de la modale avec les infos du profil connecté viendra en polish (chantier 11.x).
- [ ] **Anti-spam au-delà de Turnstile + unicité email** : pas de rate-limit IP ni de honeypot. Évaluation à faire après ouverture publique. Hors scope 3.1.
- [ ] **Bouton « retirer ma signature »** : la RLS supporte le `delete` par la signataire, mais aucune UI dédiée. À ajouter sur `/profil/contributions` au chantier qui activera cet onglet.
- [ ] **Archivage manuel d'une pétition** : `statut = 'archivee'` autorisé en BDD, mais pas de bouton UI sur la console. Cas rare, à ajouter quand un besoin réel apparaît.
- [ ] **Pagination de la liste** : limite 50 en dur. La pagination viendra quand la masse l'exigera (probablement après import Base44 chantier 10.1).
- [ ] **Console admin générique « multi-onglets »** (Q10) : pour 3.1 on pose le layout `/admin` avec uniquement l'onglet pétitions ; campagnes (3.2) et cagnottes (3.3) sont indiqués grisés. La console finale émergera incrémentalement.

## Contenus à arbitrer

Aucun placeholder éditorial nouveau dans ce chantier : le sous-espace pétitions est purement fonctionnel, les textes affichés sont du microcopy utilitaire (« Lancer une pétition », « Conditions de publication », etc.), couvert par la règle d'or de non-invention (cf. CLAUDE.md §3). Les textes éditoriaux à arbitrer restent ceux du chantier 2.1.

## Décisions techniques prises

- **Jointure créateurice via deux requêtes plutôt qu'un PostgREST embed**. Les `Relationships` du fichier `types/database.ts` sont vides (le fichier sera régénéré par `supabase gen types` plus tard). En attendant, un IN-clause sur `personne` évite des erreurs de typage `SelectQueryError` qui empêcheraient le typecheck. Le surcoût (1 query + N RPC compteurs) est marginal sur 50 lignes max.
- **Compteur via fonction SQL SECURITY DEFINER plutôt que via la vue**. La vue `petition_compteur` agrège les signatures, mais le `count()` agrégé sur `signature_petition` est filtré par la RLS de cette table (qui interdit la lecture publique des lignes). La fonction `nombre_signatures` contourne proprement en exposant uniquement l'entier agrégé, sans permettre de SELECT * dessus.
- **Slugifieur portable**. La regex sur les diacritiques (`̀-ͯ`) est construite par `String.fromCodePoint` pour éviter d'écrire des combining marks bruts dans la source (Biome `noMisleadingCharacterClass` rejette le pattern avec un caractère combinant entre crochets).
- **Layout `/admin` séparé**. Les pages d'administration sont sous `app/admin/...` sans group `(membre)` ou `(public)` : c'est volontaire pour bien isoler les protections (le layout vérifie qu'on a au moins un droit admin/modération avant d'afficher quoi que ce soit, en plus des RLS).
- **Server Actions passées en props aux Client Components**. Les formulaires (`<FormulaireCreationPetition>`, `<FormulaireModeration>`, `<ModaleSignaturePetition>`) reçoivent les Server Actions par prop plutôt que de les importer directement. Cohérent avec la convention déjà posée en 1.2 / 1.3.

## Incertitudes techniques résolues

Aucune question soulevée à Lilou/Ben pour ce chantier : la spec §5A et §3 couvraient l'ensemble du périmètre. La règle « ×1,5 à 90 % » est implémentée côté applicatif (pas en BDD) pour permettre une évolution future de la règle sans migration de données.

## Tests

- Unitaires : **86 tests verts** (`npm test`), dont 17 nouveaux pour 3.1.
- E2E Playwright : `tests/e2e/petitions.spec.ts` (4 scénarios). Le flux complet « créer → modérer → signer » dépend d'une BDD branchée et sera vérifié manuellement au déploiement de la migration.
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **3.2 Campagnes** : peut largement réutiliser la couche `lib/petitions/requetes.ts` comme modèle (split des SELECT par helper, hydratation IN-clause, RPC pour les agrégats). Le composant `<CompteurStretch>` est réutilisable pour les jauges de campagne.
- **3.3 Cagnottes** : la console `/admin/moderation/*` peut s'enrichir d'un onglet cagnotte sur le même pattern. Le layout `/admin` accueille déjà les onglets grisés.
- **8.1 Newsletter taggée 3 axes** : le tag est déjà posé côté Server Action (`signerPetition`). Reste à brancher Brevo réellement.
- **10.1 Migration Base44** : les ~16 000 signatures existantes seront importées directement en table `signature_petition`. Le `petition_id` devra exister (lien direct entre la pétition Base44 et sa réécriture). Penser à conserver le `created_at` original.
- **11.x Polish** : pré-remplir la modale de signature avec les infos du profil connecté ; ajouter le bouton « retirer ma signature » sur `/profil/contributions` ; envisager une étape « partage » dans la modale post-signature (mais cf. doctrine « pas de demande de partage »).
