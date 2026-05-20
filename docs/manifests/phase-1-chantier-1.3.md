# Manifest : Phase 1, Chantier 1.3 — Profil utilisateurice

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-1-chantier-1.3-profil-utilisateurice`
**Commit final** : à renseigner après commit
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

- [x] **Helper `getPersonneOuRediriger`** (`lib/auth/session.ts`) : récupère la session Supabase et la ligne `personne` correspondante. Redirige vers `/connexion?prochaine=<chemin>` si non auth. Utilisé par toutes les pages `/profil/*`.
- [x] **Layout `(membre)/profil/layout.tsx`** : header sobre + bouton déconnexion + barre `NavOnglets` (Client Component qui surligne l'onglet actif via `usePathname`).
- [x] **Page racine `/profil`** : redirige vers `/profil/dashboard`.
- [x] **7 pages d'onglets** complètes, conformes à `01_ARCHITECTURE.md §9` :
  - `dashboard` : synthèse + 4 raccourcis, badge statut compte (actif / pending_deletion).
  - `informations` : édition nom, prénom, pronom, code postal, téléphone, photo, bio, thème UI. Pré-rempli depuis BDD.
  - `communes` : liste des appartenances actives avec compteur (`X / 3`), lien vers `/agir/communes/[slug]` (à venir au 5.2).
  - `contributions` : état d'attente honnête (les entités pétition/article/cagnotte arrivent aux phases 3+).
  - `notifications` : 5 préférences (push + son + vibration ; mardi récap ; vendredi newsletter) avec aide contextuelle. Messagerie interne et cloche signalées comme « toujours actives, on ne capte pas l'attention ».
  - `wallet` : balance T99CP via `getT99CPService()` (mock par défaut = 100 99-coin fictifs). Adresse exemple en attendant la colonne `personne.adresse_wallet_t99cp` (chantier API T99CP).
  - `confidentialite` : section visibilité par champ (7 champs × 4 niveaux) + section export ZIP + section 2FA + section suppression différée 30 jours, chaque section dans une `<Card>` distincte.
- [x] **Page `/profil/securite/2fa`** : enrôlement TOTP via `supabase.auth.mfa.enroll`. Affichage QR code (SVG inline retourné par Supabase) + secret texte en `<details>` pour saisie manuelle. Vérification du code 6 chiffres + redirection `/profil/confidentialite?2fa=active` à succès.
- [x] **Schémas Zod** (`lib/validations/profil.ts`) :
  - `preferencesVisibiliteSchema` (7 champs optionnels × `'publique' | 'membres' | 'amies' | 'privee'`)
  - `preferencesNotificationsSchema` (5 booléens) + `PREFERENCES_NOTIFICATIONS_DEFAUT` (mails opt-out, push opt-in)
  - `mettreAJourProfilSchema` (validation profil : URL photo, bio ≤ 500, mode_theme)
  - `demanderSuppressionSchema` (confirmation par retape de l'email)
  - `verifierTotpSchema` (code à 6 chiffres exacts)
- [x] **9 Server Actions** (`app/(membre)/profil/actions.ts`) :
  - `mettreAJourProfil` : update `personne` avec champs nettoyés (chaîne vide → null).
  - `mettreAJourPreferencesVisibilite` : update du jsonb.
  - `mettreAJourPreferencesNotifications` : update du jsonb sous la clé `notifications` (sans écraser la sous-structure visibilité).
  - `demanderExportZip` : stub avec envoi mail confirmation (cf. ADR-008).
  - `demanderSuppression` : vérifie l'email retapé contre celui de la session, puis pose `statut='pending_deletion'` + `suppression_demandee_le=now()`. Envoi mail.
  - `annulerSuppression` : retour à `statut='actif'`.
  - `demarrerEnrollementTotp` / `verifierEnrollementTotp` : flux 2FA en deux temps via Supabase MFA API.
  - `desactiverTotp` : `supabase.auth.mfa.unenroll`.
  - Toutes utilisent `getPersonneOuRediriger` comme garde-fou de session, et le pattern `ResultatAction<TPayload> = ({ ok: true } & TPayload) | { ok: false; message }`.
- [x] **Composants client** ciblés pour chaque section interactive : `BoutonDeconnexion`, `NavOnglets`, `FormulaireInformations`, `FormulaireNotifications`, `FormulaireVisibilite`, `BoutonExportZip`, `SectionSuppression`, `SectionDeuxFA`, `FormulaireEnrollementTotp`. Pages parents restent Server Components.
- [x] **Tests unitaires** (`tests/unit/validations/profil.test.ts`) : **20 tests** sur les 5 schémas Zod (visibilité, notifications, profil, suppression, TOTP). Couvre les cas valides, les cas limites (URL invalide, bio trop longue, code 5 chiffres, factor_id vide) et la cohérence des défauts.
- [x] **Tests E2E** (`tests/e2e/profil.spec.ts`) : **10 tests** vérifient que les 9 routes `/profil/*` redirigent vers `/connexion?prochaine=<chemin>` quand non auth, plus l'URL-encodage du paramètre.
- [x] **ADR-008** (export ZIP stub asynchrone, infra dédiée plus tard) ajoutée à `docs/ARCHITECTURE-decisions.md`.
- [x] **Build production vert** : 14 routes (+8 vs 1.2), middleware 82.5 kB.

## Livré partiellement

- [ ] **Export ZIP réel des données** : stub fonctionnel mais aucune génération réelle (cf. ADR-008). L'UI ne ment pas, le mail de confirmation part bien (Mock ou Brevo selon env). À brancher à un chantier d'infra dédié.
- [ ] **Modification de l'email** : non implémentée en 1.3 (la page `/profil/informations` n'expose pas le champ email). Le changement d'email passe par `supabase.auth.updateUser({ email })` qui déclenche un mail de confirmation : à poser à un chantier ultérieur si Lilou/Ben le souhaite.
- [ ] **Changement de mot de passe** : pas dans 1.3. À poser via `supabase.auth.updateUser({ password })` au chantier sécurité (probablement phase 11.2).

## Non livré (et pourquoi)

- [ ] **Cron quotidien d'anonymisation après 30 jours** : la BDD stocke `pending_deletion` + `suppression_demandee_le` (cf. migration 002 du chantier 1.1) mais aucun cron ne purge encore. À brancher à un chantier dédié (Edge Function Supabase + planificateur). La fonction SQL d'anonymisation (`anonymise_personne(uuid)`) sera ajoutée par migration à ce moment-là.
- [ ] **2FA obligatoire pour comptes admin** : code de l'enrôlement TOTP optionnel posé. La détection « admin sans TOTP → redirect /profil/securite/2fa » au login sera ajoutée au chantier **9.1** (console modération) quand les niveaux admin auront un sens applicatif.
- [ ] **Upload de la photo de profil** : pour 1.3 on collecte une URL externe. L'upload réel vers Supabase Storage avec compression et limites (cf. config/limites.ts : 10 Mo image) arrive au chantier qui posera le composant `<UploadMedia>` partagé (probablement 3.x ou 7.1).
- [ ] **Visibilité effective des champs sur les profils publics** : la préférence est stockée et modifiable, mais aucune page publique du profil n'existe encore (vue d'une autre personne). Sera posée au chantier qui exposera les profils publics (probablement 7.5, réseau social).
- [ ] **Page `/agir/communes/[slug]` liée depuis Mes communes** : 404 si une personne a une appartenance. Sera posée au chantier **5.2**. Pour 1.3, comme aucune personne n'a encore d'appartenance (table vide), le 404 n'arrive jamais en pratique.
- [ ] **OAuth éthique (Mastodon, Framasoft, Solid)** : toujours en disabled depuis 1.2, à ouvrir au chantier dédié.

## Contenus à arbitrer

- [ ] **Wording de l'aide pronom** : actuellement « Demandé pour te genrer correctement dans la newsletter et les communications. » À valider par Lilou/Ben (autre formulation possible : signal politique explicite « Le site reconnaît que les pronoms ne se présupposent pas »).
- [ ] **Texte d'avertissement suppression** : actuellement « Tes contributions sont préservées sous "Membre anonyme" pour ne pas effacer la trace politique. » À valider.

## Décisions techniques prises (ADR à archiver)

- **ADR-008** : `demanderExportZip` en stub asynchrone en 1.3, infra de génération à un chantier dédié. Voir `docs/ARCHITECTURE-decisions.md`.

## Incertitudes techniques résolues avec Lilou/Ben

- **Stockage des préférences notifications** : la spec ne prescrit pas de colonne dédiée. On les met dans `personne.preferences_visibilite` (jsonb) sous la clé `notifications`. Si la complexité augmente au chantier 8.1, on extraira dans une colonne dédiée (migration) sans casser l'UI.
- **Joins typés Supabase sans `Relationships`** : tant que `supabase gen types` n'est pas exécuté, on évite les jointures select et on fait deux requêtes (cf. `/profil/communes/page.tsx`). Documenté en commentaire dans le fichier.
- **Projet Supabase Francfort créé pendant la session** : `.env.local` rempli par Lilou/Ben avec les vraies clés. Les tests E2E utilisent désormais l'instance live pour `auth.getUser()` (qui retourne null sans session, déclenchant la redirection attendue).

## Tests

- **Unitaires (Vitest)** : 5 fichiers, **62 tests verts** (+20 par rapport à 1.2) : factories (7) + cn (5) + supabase env (7) + auth Zod (23) + profil Zod (20).
- **E2E (Playwright, chromium)** : 5 fichiers, **23 tests verts** (+10 par rapport à 1.2) : home (2) + design-system (3) + crawl (1) + auth (7) + profil (10).
- **Lint (Biome)** : 0 erreur sur 107 fichiers.
- **Typecheck (tsc strict)** : 0 erreur.
- **Build (`next build`)** : OK, 14 routes : 6 statiques (`/`, `/_not-found`, `/design-system`, `/inscription`, `/verifier-email`, `/profil`) + 8 dynamiques (toutes les `/profil/*` enfants + `/connexion` + `/auth/callback`). Middleware 82.5 kB.

## Notes pour les chantiers suivants

- **Pattern `getPersonneOuRediriger`** à reproduire pour toute page protégée qui dépend de la table `personne`. Pour les pages qui n'ont besoin que de la session (sans la ligne `personne`), utiliser `getSessionOuRediriger`.
- **Bonne pratique : layout n'appelle pas le helper de session** : seules les pages enfants le font, pour éviter une double consommation du cookie ou un état désynchronisé. Le layout pose juste la chrome visuelle commune.
- **`ResultatAction<TPayload>` avec `unknown` par défaut** : pattern réutilisable pour toute Server Action future. Le générique permet d'enrichir `ok: true` avec un payload (factorId, uri, qr pour le flux TOTP par exemple) sans casser les retours simples.
- **`auth.getUser()` à chaque request** : par défaut on consomme Supabase à chaque navigation vers une page protégée. Pour les pages très chargées (réseau social en flux infini), envisager du caching `cache()` React mais avec attention : le cache est par requête.
- **Couplage stockage `preferences_visibilite` + `notifications`** : si une autre sous-structure jsonb apparaît (préférences de carte, par exemple), suivre le même pattern (sous-clé jsonb). Ne pas multiplier les colonnes jsonb dédiées tant que la BDD n'a pas besoin d'indexer ces sous-structures.
- **2FA admin obligatoire au login** : la logique de détection (au login : si admin et totp_secret null → redirect 2fa) viendra au chantier 9.1. Préparer un middleware ou un hook auth qui inspecte les `droit_admin` actifs.
- **Pages publiques de profil** : quand on aura besoin d'afficher un profil consulté par une autre personne (probablement au chantier 7.5, réseau social), créer un helper `appliquerVisibilite(personne, visibiliteRequise: NiveauVisibilite)` qui filtre les champs selon `preferences_visibilite`.
- **Préalables externes restants** : appliquer les migrations 1.1 sur l'instance Supabase (`supabase db push`), configurer Brevo SMTP côté projet Supabase (pour les mails d'auth réels), et créer les apps OAuth GAFAM si on veut activer les boutons correspondants. Tout le reste tourne en local avec mocks.
