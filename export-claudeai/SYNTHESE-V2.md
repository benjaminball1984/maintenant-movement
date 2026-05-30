# Synthèse du cycle V2 — Maintenant!

> **Document destiné à Claude.ai (web).** Synthèse exhaustive du travail accompli dans le repo `Maintenant` sur le cycle V2 (26-28 mai 2026), pour permettre à Claude.ai d'analyser le travail fait par Claude Code, formuler des recommandations, et revenir vers Lilou/Ben avec un avis externe.
>
> **Auteur** : Claude Code (Opus 4.7, sonnet/opus 1M context selon les sessions).
> **Date** : 2026-05-28.
> **État de référence** : `main` à `389c03d` (poussé sur `origin/main`).
> **Préséance** : ce document ne remplace pas `CLAUDE.md` (§0 préséance, §11 état courant). En cas de contradiction, `CLAUDE.md` gagne.

---

## 0. À lire d'abord

### 0.1 Qui parle, à qui

- **Lilou/Ben** (LIFE BENJAMIN BALL, cosec gé du mouvement Maintenant!) pilote le projet. Iel rédige les CDC (cahiers des charges), arbitre les décisions politiques et techniques, fournit les contenus.
- **Claude Code** (cet agent) code, teste, commite, push, écrit les manifests et la mémoire persistante (`CLAUDE.md`).
- **Claude.ai** (web, destinataire de ce doc) est utilisé par Lilou/Ben pour des revues critiques, de l'analyse externe, et la rédaction des CDC.

### 0.2 Trois couches sédimentaires du projet

1. **V0** : première plateforme sur Base44 (abandonnée le 17/05/2026). Données : 946 membres, ~9k newsletter, ~17 746 signataires. Toutes migrées vers la V1 en mai 2026.
2. **V1** : reconstruction sur Claude Code (~46 tables, ~90 pages, phases 0-13 livrées). Code actuel du repo. Réseau social inclus. C'est ce qui tourne aujourd'hui (en local + Supabase distant Francfort).
3. **V2** : nouvelle doctrine formalisée dans `docs/cdc-v2/CDC-Maintenant-V2/` (principes transversaux, schéma de données D1-D13, matrice de droits MD0-MD6, fiches de sous-espaces). **Greffe additive sur V1**, jamais refonte.

### 0.3 Trois interdits absolus (doctrine de greffe V2)

1. **On additionne, on ne soustrait jamais.** Nouvelles tables/colonnes à côté de l'existant. Aucun `DROP` de données réelles.
2. **On backfill, on ne réinitialise jamais.** Les 17 746 signatures restent 17 746. Les 15 737 profils restent 15 737. Les 35 011 communes restent 35 011.
3. **Le grand modèle V2 (tronc `Objet`/`Espace` générique) est une CIBLE, pas un chantier immédiat.** Aucune migration lourde sans décision nominative de Lilou/Ben.

Tous les chantiers V2 livrés respectent ces interdits.

---

## 1. Vue d'ensemble du cycle V2

### 1.1 Périmètre temporel

- **Ouverture** : 26/05/2026 dans la nuit.
- **Snapshot du présent doc** : 28/05/2026.
- **Durée** : ~52 heures, en sessions intensives nocturnes et diurnes (Claude Code automatisé, Lilou/Ben en supervision asynchrone).

### 1.2 Volume de travail

| Métrique | Valeur |
|---|---|
| Commits sur le cycle V2 (26-28/05) | **245** |
| Commits totaux dans le repo | 337 |
| Chantiers V2 livrés | **~158** (V2.0.1 → V2.4.154) |
| Vagues du plan officiel fermées | **4 / 5** (V0, V1, V2, V3 ; V4 en cours ; V5 reportée) |
| Tests unitaires verts | **912** sur 79 fichiers |
| Migrations Supabase | **57** au total (dont 28 V2 posées localement) |
| Fichiers de code (`.ts`/`.tsx`) | 526 (174 lib + 119 components + 233 app) |
| Manifests V2 | 40 (`docs/manifests/v2-*.md`) |
| Lignes de doc | 13 175 dans `docs/` |
| Interfaces `LibellesXxx` exportées | **30** (couverture 100 % des formulaires UI) |
| Interfaces `MessagesValidationXxx` | **18** (couverture 100 % des schémas Zod) |
| Clés CMS éditables (estimation) | **>1 200** (libellés UI + messages validation + textes éditoriaux + templates) |

### 1.3 État Git

- Branche active : `main`
- Tip : `389c03d` (V2.4.154 + maj CLAUDE.md)
- En sync avec `origin/main` sur GitHub (`benjaminball1984/maintenant-movement`).
- Aucune branche feature non mergée critique (24 branches feature `feature/v2-*-*` sur origin, toutes mergées dans `main` puis conservées comme historique).
- 1 branche `fix/ci-playwright-multi-browser` en attente de PR (poussée mais PR non créée).

---

## 2. Le plan officiel V2 et où nous en sommes

Source : `docs/cdc-v2/03-PLAN-IMPLEMENTATION.md`.

```
VAGUE 0  Socle de cohérence (CLAUDE.md, hygiène, fondations UI)         CLÔTURÉE 26/05
VAGUE 1  Greffes additives (wallet, consentement, droits)               CLÔTURÉE 26/05
VAGUE 2  Composants réutilisables (fil groupe, réservation, caisse, OG) CLÔTURÉE 27/05
VAGUE 3  Nouveaux sous-espaces (S'entraider, location mutualisée…)      CLÔTURÉE 27/05
VAGUE 4  Blocs CDC non spécifiés (fiches à 0 %)                         EN COURS (préparation technique)
VAGUE 5  Convergence tronc Objet                                        REPORTÉE
```

### 2.1 VAGUE 0 — Socle de cohérence (3 chantiers, 26/05)

| Chantier | Livré |
|---|---|
| **V2.0.1** | Bloc de préséance dans CLAUDE.md (§0), dépôt du pack CDC V2 dans `docs/cdc-v2/CDC-Maintenant-V2/`, correction des coquilles V2 (« Maintenant Médias » avec S), extension du hook commit-msg pour accepter la convention `phase V2.W - chantier V2.W.X - ...` |
| **V2.0.2** | Hygiène repo : rangement route groups fantômes (`app/(admin)/`, `app/(auth)/`), suppression doublon `lib/stripe/`, CSP nominative dans `next.config.mjs` (origines réelles inventoriées, pas de wildcards permissifs) |
| **V2.0.3** | **Fondations UI transversales (ET1-ET4)** : composant `TeleverseurImage` réutilisable (JPEG/PNG/WebP, adapter mock par défaut), bibliothèque d'images par défaut par type d'objet, bouton de bascule thème clair/sombre branché sur `personne.mode_theme`, variant `primary` du `Button` avec token `--grad` + `--shadow-brand` |

### 2.2 VAGUE 1 — Greffes additives (3 chantiers, 26/05)

| Chantier | Livré |
|---|---|
| **V2.1.1** | Retrait du wallet intégré (§19 doctrine V2). Suppression de `app/(membre)/profil/wallet/`. Lecture seule de solde Polygon conservée + vérification de hash + redirection vers `the99coinproject.org`. Adapter `lib/t99cp/`. Zéro donnée touchée. |
| **V2.1.2** | Table `consentement` (D8) avec RLS. **Backfill depuis `signature_petition` (les `true` seulement)**, daté du `created_at`, source `backfill_signature_v1`. Colonnes V1 conservées. Compteur intact à 17 746. Révocation fine côté profil. Script idempotent `scripts/backfill-consentement.ts` (`--dry-run` puis `--confirm`). |
| **V2.1.3** | Table `droit` atomique (D10) + liste des `type_droit` (MD1) + presets (les 6 niveaux V1 comme presets). **Backfill depuis `droit_admin`**. Coexistence : helpers RLS V1 continuent de lire `droit_admin`. Non-élévation + verrou `gerer_droits` (MD3). Aucun droit perdu. Script `scripts/backfill-droits.ts`. |

### 2.3 VAGUE 2 — Composants réutilisables (4 chantiers, 26-27/05)

| Chantier | Livré |
|---|---|
| **V2.2.1** | `FilDeGroupe` (§18). Fil de discussion collectif distinct du DM, attachable à tout groupe/espace. Migration `20260527030000_fil_groupe.sql`. Helper SQL `est_membre_espace` (corrigé en V2.3.8). |
| **V2.2.2** | `Réservation` (D8, §14). FK polymorphe `(offre_type, offre_id)` avec CHECK liste fermée. Machine à états D8 : 7 valeurs `proposee/acceptee/refusee/realisee/confirmee/annulee/litige`. Helper pur `transitionAutorisee`. 9 tests verts. Migration `20260527040000_reservation.sql`. |
| **V2.2.3** | `Caisse` + reversements (D7, D12). Entité Caisse (par type de contribution + par cagnotte), `ReceptacleCaisse` datés, transactions sortantes avec justificatif OBLIGATOIRE (D12bis). Régime B. Additif. Migration `20260527050000_caisse.sql`. |
| **V2.2.4** | Module de partage + Open Graph côté serveur (§10, point dur). Métadonnées OG générées côté serveur (Next.js export `generateMetadata`). Robots OG ne lisent pas le JS, donc serveur impératif. Lecture des OG entrants dans le fil. |

### 2.4 VAGUE 3 — Nouveaux sous-espaces + finitions (3 chantiers spec + 34 finitions étendues, 27/05)

**Spec officielle :**

| Chantier | Livré |
|---|---|
| **V2.3.1** | OG sur les 10 pages détail restantes |
| **V2.3.2** | Groupe d'entraide local (porte d'entrée non-politique). Migration. |
| **V2.3.3** | Location mutualisée (§12 socle backend). |

**Finitions étendues nuit 27/05 (V2.3.4 → V2.3.46) :**

34 chantiers couvrent le cycle D8 complet (réservation), notifications cloche V2, trésorerie complète bout-en-bout, Mes contributions financières, Rejoindre/Quitter campagne + GT, stats admin V2, recherche réseau, etc.

Cycle D8 réservation totalement navigable de bout en bout côté UI :
```
créer (V2.3.5) → accepter/refuser (V2.3.13) → marquer réalisée (V2.3.13)
              → confirmer (V2.3.14) / litige (V2.3.16, V2.3.21) / annuler (V2.3.11)
              → modération litige (V2.3.17)
```
Journalisation D8bis via `reservation_journal` (V2.3.15). Page audit `/admin/national/audit` (V2.3.43). Helper d'identité respectant visibilité (V2.3.19, V2.3.20).

### 2.5 VAGUE 4 — Blocs non spécifiés (préparation technique en cours)

Le plan dit : **« spécification d'abord, code ensuite »**. Les 4 blocs (V2.4.1 Espace membre, V2.4.2 Admin/modération, V2.4.3 Transverses, V2.4.4 Fondations) sont **à 0 % côté fiches CDC**. Tant que les fiches ne sont pas écrites par Lilou/Ben, Claude Code ne peut pas coder le fond.

**MAIS** : « Claude Code peut préparer le terrain technique (ex. brancher le CMS sur le composant d'upload). »

C'est exactement ce qu'a fait le cycle V2.4.1 → V2.4.154 (154 chantiers) : préparer le terrain V2.4.4 (Fondations / CMS d'édition) sans toucher au fond éditorial.

**On y revient en détail au §3.**

### 2.6 VAGUE 5 — REPORTÉE

Convergence vers le tronc `Objet`/`Espace` générique. Ne se lance que sur décision nominative table par table. Site V2 pleinement fonctionnel sans elle.

---

## 3. Le gros morceau du cycle : la logique d'éditabilité

### 3.1 Pourquoi cette logique ?

Le mouvement Maintenant! veut **gouverner ses propres contenus** : pas de blocs marbre dans le code, tout doit être modifiable par un·e admin qui sait lire du markdown, sans toucher au code, sans redéploiement. C'est une demande structurante de la doctrine V2.

### 3.2 Architecture en 3 strates

```
┌─────────────────────────────────────────────────────────────────┐
│ Strate 1 : Contenus éditoriaux (textes longs, Markdown)         │
│ Table : contenu_editorial                                       │
│ Clé : "doctrine.intro", "home.bandeau", etc.                    │
│ Helper : lireContenuEditorial(cle, fallback)                    │
│ Composants : PageEditorialeCMS, TexteEditableAdmin              │
│ Console admin : /admin/national/contenus                        │
│ Migration : 20260527130000_contenu_editorial.sql                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Strate 2 : Messages de validation (erreurs Zod)                 │
│ Table : contenu_editorial (mêmes clés, préfixe "validation.")   │
│ Module : lib/messages-validation.ts (1045 lignes, 18 dicts)     │
│ Pattern : creerXxxSchema(messages?) factory Zod                 │
│ Strate intermédiaire : lireMessagesValidationXxx() côté serveur │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Strate 3 : Libellés UI (labels, placeholders, hints, CTAs)      │
│ Table : contenu_editorial (mêmes clés, préfixe "libelle.")      │
│ Pattern : prop libelles? + LIBELLES_DEFAUT sur chaque formulaire│
│ 30 interfaces LibellesXxx exportées (un par formulaire)         │
│ Couverture : 100 % des formulaires UI                           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Le pattern technique (résumé en 4 points)

**Point 1 — Une seule table SQL pour stocker** :
```sql
create table contenu_editorial (
  cle         text primary key,
  titre       text,
  valeur_md   text not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);
```
Un seul format : clé string + valeur markdown. Pas de schéma rigide. Permet de stocker n'importe quoi (texte long, libellé court, JSON pour les libellés structurés).

**Point 2 — Un helper de lecture avec fallback systématique** :
```typescript
export async function lireContenuEditorial(
  cle: string,
  fallback: { titre?: string; valeurMd: string },
): Promise<ContenuEditorial>
```
Si la clé n'existe pas en base, retourne le fallback. Donc le site **fonctionne dès le premier rendu** sans que personne n'ait jamais touché à la base. Les valeurs par défaut sont dans le code (lorem ipsum pour les pages éditoriales, vraies valeurs métier pour les libellés).

**Point 3 — Une factory Zod pour les messages de validation** :
```typescript
export function creerInscriptionSchema(
  messages: MessagesValidationAuth = MESSAGES_VALIDATION_AUTH_DEFAUT,
) {
  return z.object({
    email: z.string().email({ message: messages.emailFormat }),
    motDePasse: z.string().min(12, { message: messages.motDePasseLongueur }),
    // ...
  });
}
```
La page parente (Server Component) lit les messages CMS via `lireMessagesValidationAuth()`, les passe en prop au Client Component, qui appelle la factory locale.

**Point 4 — Un prop `libelles?` sur chaque formulaire** :
```typescript
export interface LibellesAchat {
  alertErreurTitre: string;
  legendeMonnaie: string;
  ctaSubmit: string;
  // ...
}

const LIBELLES_DEFAUT: LibellesAchat = {
  alertErreurTitre: "Achat impossible",
  legendeMonnaie: "Choisis la monnaie de paiement",
  ctaSubmit: "Confirmer l'achat",
  // ...
};

export function FormulaireAchat({
  // ...
  libelles = LIBELLES_DEFAUT,
}: FormulaireAchatProps) {
  return <Alert titre={libelles.alertErreurTitre}>...</Alert>;
}
```
Si la page parente ne surcharge rien, le formulaire affiche `LIBELLES_DEFAUT`. Si elle lit des libellés CMS, elle les passe en prop.

### 3.4 Étapes chronologiques d'éditabilité

| Chantiers | Date | Cible |
|---|---|---|
| **V2.4.1-9** | 27/05 | CMS minimal, helpers `estAdminCourant` + `PageEditorialeCMS` + console contenus, migration des 10 premières pages éditoriales |
| **V2.4.10-17** | 27/05 | Espaces V2 (Décider MVP, Journal-affiche MVP, consoles admin) |
| **V2.4.18-50** | 27/05 | Helpers purs (~33 helpers : format-date, format-euros, pluriel, slugifier, capitalisation, etc.) — pas directement liés à l'éditabilité mais permettent le découplage. |
| **V2.4.51-104** | 27/05 | Composants Pagination, exports CSV, pages admin filtrables, RSS, sitemap, dashboard membre enrichi, etc. (toujours préparation du terrain) |
| **V2.4.105-110** | 27/05 | Header CTAs, 4 Unes home entièrement éditables admin |
| **V2.4.111-117** | 27/05 | Pages auth, hub admin, index sous-espaces |
| **V2.4.118-125** | 27/05 | Fiches individuelles : pétition, cagnotte, mobilisation, commune, fédération, moment, médias, sondages, journal, Décider salle, marché, SEL, groupes locaux, offre, réunion individuelle |
| **V2.4.126-130** | 27/05 | Pages utilitaires (`/agenda`, `/recherche`, `/cartes`), file de modération hub, 22 sous-pages `/admin/moderation/` et `/admin/national/` |
| **V2.4.131-134** | 27/05 | Templates de notifications cloche + templates d'emails transactionnels + cartes |
| **V2.4.135-138** | 27/05 | Libellés CTAs auth, 18 labels FormulaireInscription, /connexion, formulaire infos profil |
| **V2.4.139-146** | 27-28/05 | **Messages de validation Zod éditables admin (factories Zod)** : auth, profil, signature pétition, 12 schémas restants. **18 dictionnaires `MessagesValidationXxx` au total.** |
| **V2.4.147-148** | 28/05 | Branchement `messages?` sur 18 formulaires UI (props prêts, page parente peut surcharger) |
| **V2.4.149-154** | 28/05 | **Branchement `libelles?` sur les 24 formulaires UI restants.** Couverture 100 %. ~280 nouvelles clés UI éditables admin. |

### 3.5 Compteurs finals

- **30 interfaces `LibellesXxx` exportées** (un par formulaire UI Client Component)
- **18 interfaces `MessagesValidationXxx` exportées** (un par schéma Zod)
- **108 fichiers** appellent `lireContenuEditorial` ou `lireMessagesValidation*` ou `lireLibelles*`
- **Estimation finale : >1 200 clés CMS** distinctes utilisables par l'admin pour personnaliser le site sans toucher au code.

---

## 4. Architecture technique du repo

### 4.1 Stack

| Brique | Choix | Statut |
|---|---|---|
| Framework | Next.js 14.2 (App Router) | en prod-ready dev |
| Langage | TypeScript strict | 0 `any`, 0 `@ts-ignore` non justifié |
| BDD | Supabase Postgres (région Francfort) | DISTANT depuis le dev (pas de Supabase local) |
| Auth | Supabase Auth (cookies) | branché |
| Storage médias | Supabase Storage | branché, bucket `media` créé |
| Email transactionnel | Brevo (avec adapter mock par défaut) | mock par défaut, Brevo configurable |
| Paiements | Stripe Checkout + Stripe Connect (adapter mock par défaut) | mock par défaut |
| Visio Décider | LiveKit (adapter mock par défaut) | mock |
| Anti-bot | Cloudflare Turnstile | clé free tier |
| T99CP | Polygon, contract `0x7275...` (adapter mock par défaut) | mock |
| Hébergement front | **Local dev** + Cloudflare Pages prévu | pas de Vercel |
| Cartes | MapLibre GL JS | branché |
| Styles | Tailwind CSS + tokens CSS | branché |
| Validation | Zod + react-hook-form | branché partout |
| Tests | Vitest (unitaires, 912 tests) + Playwright (E2E) | tous verts |
| Lint/format | Biome | hook pre-commit |
| CI | GitHub Actions | en place |

### 4.2 Pattern adapter mock-par-défaut

**Chaque API externe a deux implémentations, switching par variable d'env :**

```
lib/email/         → MockEmailService (log console + fichier) | BrevoEmailService
lib/payments/      → MockPaymentService                       | StripePaymentService
lib/livekit/       → MockLiveKitService                       | LiveKitService
lib/t99cp/         → MockT99CPService                         | PolygonT99CPService
lib/storage/justificatifs/ → MockStorage                      | SupabaseStorage
```

```dotenv
EMAIL_PROVIDER=mock           # ou "brevo" en prod
PAYMENT_PROVIDER=stripe_test  # ou "stripe_live" en prod
LIVEKIT_PROVIDER=mock         # ou "livekit"
T99CP_NETWORK=mumbai          # ou "polygon_mainnet"
```

**Conséquence majeure** : le site fonctionne à 100 % en local sans aucune API connectée. Les flux utilisateurice sont testables bout-en-bout. Les tests E2E passent. Le jour où Lilou/Ben branche Brevo, la variable change, c'est branché.

### 4.3 Structure des dossiers (récap)

```
maintenant/
├── app/                    # 233 fichiers .ts/.tsx — pages Next.js App Router
│   ├── (public)/           # site public
│   ├── (membre)/profil/    # espace membre connecté
│   ├── admin/              # consoles admin (modération, national, trésorerie)
│   ├── actions/            # Server Actions globales
│   └── api/                # API routes (webhooks)
├── components/             # 119 fichiers .tsx
│   ├── ui/                 # composants atomiques (Button, Input, Card, Alert, ...)
│   ├── layout/             # Header, Footer
│   ├── formulaires/        # CaptchaTurnstile + helpers
│   ├── home/               # composants de la home
│   ├── reseau/             # composants réseau social
│   ├── contenu/            # composants CMS (PageEditorialeCMS, TexteEditableAdmin)
│   └── [domaine]/          # un dossier par domaine métier
├── lib/                    # 174 fichiers .ts — logique pure et helpers
│   ├── auth/               # session, RLS helpers
│   ├── supabase.ts         # client serveur/client (SSR)
│   ├── contenu-editorial.ts # CMS helpers (Strate 1)
│   ├── messages-validation.ts # CMS messages Zod (Strate 2, 1045 lignes)
│   ├── helpers-purs.ts     # index unifié de 38 helpers purs
│   ├── reservation*.ts     # logique cycle D8
│   ├── caisse*.ts          # logique trésorerie
│   └── [40+ autres modules]
├── docs/
│   ├── cdc-v2/             # CDC V2 (28 fichiers)
│   ├── specs/              # specs V1 (vocabulaire, design tokens, RGPD, etc.)
│   ├── manifests/          # 69 manifests (un par chantier)
│   └── ARCHITECTURE-decisions.md  # ADRs
├── scripts/                # 12 scripts (backfills, imports, RLS test)
├── supabase/migrations/    # 57 migrations SQL
├── tests/                  # 99 fichiers .ts — tests Vitest + Playwright
├── types/database.ts       # types BDD générés
├── CLAUDE.md               # 63 KB — mémoire persistante de Claude Code
├── docker-compose.yml      # service web local conteneurisé
├── Dockerfile              # build prod conteneurisé
└── next.config.mjs         # config Next.js + CSP nominative
```

### 4.4 Localisation des données (où vit quoi)

| Donnée | Où | Notes |
|---|---|---|
| **Code source** | Local + GitHub `benjaminball1984/maintenant-movement` | Tout pushé. |
| **BDD applicative** | Supabase **distant** (région Francfort) | Pas de Supabase local. Le dev tape sur le distant. |
| **Migrations SQL** | `supabase/migrations/` local + Supabase distant | **28 migrations V2 posées localement, à appliquer via `supabase db push` au prochain accès** |
| **Storage médias** | Supabase Storage bucket `media` (créé) | Bucket public en lecture, écriture restreinte par RLS |
| **Storage justificatifs** | Supabase Storage bucket à créer manuellement | Mentionné en V2.3.32. Pas encore créé sur le distant. |
| **Données migrées Base44** | `data-migration/*.csv` (70 MB) | 17 746 signatures déjà importées. Membres + newsletter à finaliser. |
| **Tests artefacts** | `playwright-report/`, `test-results/` | Locaux, non commitiés |
| **Build artefacts** | `.next/` (737 MB) | Local, non commitié |
| **Dépendances** | `node_modules/` (464 MB) | Local, non commitié |
| **Env secrets** | `.env.local` (jamais commitié) | Tient les vraies clés Supabase distantes |
| **Env template** | `.env.example` (commitié) | Documente toutes les variables |

### 4.5 Conteneurs Docker

**Deux usages distincts, documentés** :

1. **`docker-compose.yml`** : service `web` qui lance `next dev` dans un conteneur Node 20, monte le code en volume (hot reload), lit `.env.local`. Le site tape toujours sur Supabase distant. Pour faire tourner le site sur une autre machine sans installer Node.
2. **`Dockerfile`** : build de prod (multi-stage : deps → build → runner). Variables `NEXT_PUBLIC_*` inlinées au build via `--build-arg`. Secrets serveur fournis au runtime via `--env-file`. Image légère (Node 20 Alpine, user non-root).

Pour un Supabase 100 % local (Postgres + Auth en conteneurs), un guide `docs/DOCKER.md` est prévu mais pas encore utilisé : le développement se fait contre Supabase distant.

---

## 5. La phase de test sur localhost et les allers-retours

### 5.1 Workflow type d'un chantier (modèle stable depuis le 26/05)

```
1. Claude Code lit CLAUDE.md (auto à chaque session) + manifest du chantier précédent
2. Claude Code identifie le chantier suivant (depuis le plan ou la discussion en cours)
3. Claude Code crée des tasks (TaskCreate) pour le suivi
4. Claude Code lit les fichiers concernés (Read)
5. Claude Code applique les modifs (Edit), souvent en parallèle
6. Claude Code lance `npm run typecheck` et `npm run lint`
7. Si erreur de format Biome : Claude Code ajuste manuellement (le hook pre-commit applique aussi `biome check`)
8. Claude Code lance `npm test -- --run` (Vitest)
9. Si tests verts : Claude Code git add + git commit avec message conventionnel
10. Le hook pre-commit lefthook relance biome + typecheck (ceinture+bretelles)
11. Le hook commit-msg vérifie la convention `phase V2.W - chantier V2.W.X - description`
12. Claude Code git push (sur demande de Lilou/Ben)
13. Claude Code met à jour CLAUDE.md §11 (état courant) périodiquement, pas à chaque commit
14. Claude Code écrit un manifest dans docs/manifests/ pour les chantiers structurants
```

### 5.2 Les allers-retours avec Lilou/Ben

**Style de pilotage observé** :
- Lilou/Ben donne des instructions courtes, parfois en français rapide (« continue avec les 2 admin restants puis les hors pattern »).
- Lilou/Ben ne relit pas chaque diff. Iel relit les **manifests** en fin de session, le `CLAUDE.md` §11 (état courant), et les écrans réels (à venir).
- Claude Code est en **Auto Mode** : « bias toward working without stopping for clarifying questions — when you'd normally pause to check, make the reasonable call and keep going ».
- Demandes typiques de Lilou/Ben : « commit », « push it », « what's next on the v2 plan », « update the CLAUDE.md state section », « fais moi un document ».

**Cas observé sur cette session (V2.4.152-154)** :
- Lilou/Ben : « salut reprenons » → Claude Code propose le contexte et 3 options.
- Lilou/Ben : « oui poursuivre les branchements cms » → Claude Code identifie les 9 formulaires restants, propose 2 sous-séquences (admin / hors-pattern), exécute la 1ʳᵉ.
- Lilou/Ben : « continue avec les 2 admin restants puis les hors pattern » → Claude Code exécute en 2 commits séparés.
- Lilou/Ben : « update the CLAUDE.md state section » → Claude Code édite §11.
- Lilou/Ben : « commit the CLAUDE.md update » → Claude Code commit (1 échec hook convention, 1 réussite après reformulation).
- Lilou/Ben : « push it » → Claude Code push.
- Lilou/Ben : « what's next on the v2 plan » → Claude Code lit le plan, restitue l'état des vagues.
- Lilou/Ben : « fais moi un document d'explication » → ce document.

### 5.3 Logs et observabilité

**Pas encore branchés** (mentionné dans CLAUDE.md §6 comme à brancher plus tard) :
- Sentry (free tier, anonymisé RGPD) — pas encore configuré.
- Lighthouse — utilisé manuellement sur certaines pages, pas en CI permanent.
- CSP report-to / report-uri — pas configuré (pas de receiver branché).

**En place** :
- Hook pre-commit lefthook → bloque un commit qui casse lint/typecheck.
- Hook commit-msg → bloque un message non conforme.
- CI GitHub Actions → typecheck + lint + tests Vitest + Playwright (matrix multi-browser sur branche `fix/ci-playwright-multi-browser`).
- Tests E2E Playwright qui crawlent les pages → détectent les liens morts.
- Adapter mock par défaut → les logs des envois mock vont dans la console locale (`logs/` non utilisé pour l'instant).

**Test sur localhost effectif** :
- `npm run dev` → http://localhost:3000 → tape sur Supabase distant.
- Le site fonctionne à 100 % en local sans aucune API connectée (grâce aux mocks).
- Le pipeline Playwright lance Next, crawl le site, soumet les formulaires, vérifie qu'aucune navigation ne renvoie 404/500/page blanche.

### 5.4 Tests unitaires

- **912 tests verts** sur 79 fichiers.
- Cap dépassé en V2.4.89 (912 verts, milestone « cap 900 franchi »).
- Couverture concentrée sur les **helpers purs** (`lib/*.ts`) : pagination, format-date, format-euros, distance-gps, validation IBAN, validation SIRET (Luhn), validation téléphone FR, code postal FR, validation URL (refus javascript:/data:/file:), etc.
- Tests E2E Playwright : suite multi-browser (Chromium / Firefox / WebKit) prévue, actuellement filtrée à Chromium dans la CI principale, multi-browser sur cron mensuel via `ci-cross-browser.yml`.

---

## 6. État Git et ce qui est pushé / committé

### 6.1 Local vs distant

| Lieu | État |
|---|---|
| Local `main` | tip `389c03d` (V2.4.154 + maj CLAUDE.md) |
| GitHub `origin/main` | **en sync** (`main` poussé) |
| GitHub `origin/feature/v2-*-*` | 24 branches feature conservées comme historique (toutes mergées dans main) |
| GitHub `origin/fix/ci-playwright-multi-browser` | poussée, PR à créer |

### 6.2 Stratégie de merge

- Branches feature démarrent de `main`, sont mergées en fast-forward.
- Pas de squash, pas de rebase interactif (interdits par CLAUDE.md §7).
- Convention de commit stricte (hook commit-msg). Exemples :
  ```
  phase V2.0 - chantier V2.0.1 - preseance + depot CDC V2 + coquilles + hook V2
  phase V2.4 - chantier V2.4.154 - libelles UI editables sur 3 formulaires hors-pattern
  fix - phase V2.4 - chantier V2.4.154 - mise a jour CLAUDE.md section etat courant
  ```

### 6.3 Migrations à appliquer sur Supabase distant

**12 + 3 = 15 migrations V2 posées localement, en attente de `supabase db push`** :

V2.1.x (3) :
- `20260527010000_consentement.sql`
- `20260527020000_droit.sql`

V2.2.x (3) :
- `20260527030000_fil_groupe.sql`
- `20260527040000_reservation.sql`
- `20260527050000_caisse.sql`

V2.3.x (6) :
- `20260527060000_groupe_entraide_local.sql`
- `20260527070000_location_mutualisee.sql`
- `20260527080000_est_membre_espace_fix.sql`
- `20260527090000_reservation_journal.sql`
- `20260527110000_transaction_entrante.sql`
- `20260527120000_appartenance_campagne_groupe.sql`

V2.4.x (3) :
- `20260527130000_contenu_editorial.sql`
- `20260527140000_decider.sql`
- `20260527150000_journal_affiche.sql`

Plus `20260527000000_t99cp_hash_consomme.sql` (V2.1.1).
Plus `20260526220000_storage_media_bucket.sql` (déjà appliqué le 26/05).

**Action à faire** : `supabase db push` puis les 3 backfills (`scripts/backfill-consentement.ts`, `scripts/backfill-droits.ts`, `scripts/backfill-caisses.ts`) en `--dry-run` puis `--confirm`.

### 6.4 Données déjà migrées (V1 → distant Supabase)

- 17 746 signatures importées (script `importer-signataires.ts` lancé en `--confirm` le 25/05)
- 35 011 communes pré-créées (script `precreer-communes` lancé en `--confirm` le 25/05)
- 15 737 profils unifiés (générés via trigger BDD `trouver_ou_creer_profil_unifie`)
- Tables `compteurs_commune`, `profil_unifie` appliquées (migrations 037, 038)

**Pas encore importé** : membres Base44 (~946) + newsletter (~9k). Scripts disponibles : `importer-membres-base44.ts`. À lancer en `--dry-run` puis `--confirm`.

---

## 7. Vocabulaire fixé (rappel critique pour Claude.ai)

**Termes à NE JAMAIS modifier** (cf. `docs/specs/03_VOCABULAIRE.md`) :
- **Maintenant!** (avec capitale et point d'exclamation, partout).
- **Cosec gé** (jamais « président·e »).
- **Adhérent·e** (jamais « membre » seul, qui est ambigu).
- **Sympathisant·e**, **signataire**, **donateur·ice** : statuts distincts.
- **99-coin (T99CP)** avec **tiret obligatoire**.
- **Décider** à l'infinitif (nom de l'espace).
- **Levée d'objections** (jamais « consentement »).
- **Jugement majoritaire** (méthode Balinski-Laraki).
- **Empouvoirement** vs **Captation de pouvoir**.
- **Moments solidaires** (« Moments » au pluriel toujours).
- **Commune libre**, **Assemblée Confédérale des Communes et Territoires Libres**.
- **Maintenant Médias** (avec S, pas « Maintenant Média »).
- **Cotisation solidaire** (forme spécifique de cagnotte).

**Règles d'écriture** :
- Pas de tirets cadratins (—) dans les textes affichés ou commentaires (marqueur IA).
- Inclusivité variée (épicène > point médian > doublet > néologismes mots-valises sans point).
- Pas de jargon académique pédant.
- Apostrophes typographiques (’) si possible.

---

## 8. Notes d'analyse et recommandations pour la suite

### 8.1 Forces du travail accompli

1. **Discipline de greffe respectée à la lettre**. Aucun `DROP` de données réelles. Tous les backfills idempotents. Tous les compteurs intacts. La doctrine V2 §0.3 n'est jamais transgressée.
2. **Couverture CMS exceptionnelle**. 100 % des formulaires UI ont leur libellé éditable. 100 % des schémas Zod ont leurs messages d'erreur éditables. 108 fichiers branchent le CMS. Estimation : >1 200 clés éditables.
3. **Pattern uniforme**. Le même pattern partout : interface `LibellesXxx` + constante `LIBELLES_DEFAUT` + prop optionnel. Lisible. Un développeur·euse senior·e peut intervenir.
4. **Mocks par défaut systématiques**. Le site tourne à 100 % en local sans la moindre clé API. C'est un cadeau pour l'onboarding et les tests CI.
5. **Tests verts en permanence**. 912 tests Vitest, hook pre-commit qui bloque tout commit cassant lint/typecheck. Aucun commit cassé sur les 158 chantiers V2.
6. **Traçabilité fine**. 245 commits avec messages conventionnels, 40 manifests V2, `CLAUDE.md` mis à jour à chaque jalon. Le futur lecteur sait pourquoi tout est là.

### 8.2 Risques et dette à connaître

1. **Le distant Supabase n'est pas synchronisé avec le local.**
   28 migrations V2 attendent un `supabase db push`. Les tables `consentement`, `droit`, `fil_groupe`, `reservation`, `caisse`, etc., **n'existent que localement** dans les fichiers SQL. **Conséquence** : le site en local en mode `next dev` tape sur le distant et **ces tables n'existent pas côté distant**. Toute lecture/écriture sur ces tables échouera silencieusement (data: null) en attendant le push.
   *Action* : Lilou/Ben (ou Claude Code sur autorisation) doit lancer `supabase db push` et les 3 backfills. Ce n'est pas anodin : il faut backup d'abord.
2. **Backup Supabase pas vérifié.** Le TABLEAU-DE-BORD V2 du 26/05 mentionne « BACKUP Supabase AVANT toute migration V2 (bloquant) — toujours non fait au 25/05 ». Statut au 28/05 inconnu. **À vérifier impérativement avant push.**
3. **Bucket Storage justificatifs** mentionné en V2.3.32 mais pas créé sur le distant. À créer manuellement avant tout reversement réel.
4. **Le gap V2.4.91 → V2.4.148 dans CLAUDE.md §11.** L'historique des chantiers de cette plage (58 chantiers) n'est pas listé ligne par ligne dans CLAUDE.md, seulement dans les commits Git. Si quelqu'un lit CLAUDE.md sans `git log`, il manque 58 chantiers d'historique. Compromis assumé pour ne pas faire exploser le fichier.
5. **Console admin CMS encore minimaliste**. L'éditabilité est posée mais l'interface admin pour modifier ces >1 200 clés n'est qu'à un MVP (V2.4.1 = « CMS minimal »). Édition clé par clé, pas de regroupement par espace, pas d'aperçu, pas de versioning. C'est un chantier UI futur.
6. **8 pages éditoriales bloquées sur contenu (V1 chantier 2.2)**. Doctrine, Commune libre, Assemblée Confédérale, Monnaie 99-coin, FAQ, Ressources, À propos, Mentions légales : `docs/CONTENUS-A-ARBITRER.md` les liste. Lilou/Ben doit fournir les textes.
7. **VAGUE 4 fiches CDC à 0 %**. Espace membre, Admin/modération UI, Transverses, Fondations. Tant que ces fiches ne sont pas écrites, Claude Code ne peut pas coder le fond.
8. **Pas de monitoring prod**. Sentry pas branché, CSP sans receiver. À traiter le jour du déploiement Cloudflare Pages.

### 8.3 Recommandations pour Claude.ai (avis externe demandé)

**Trois questions sur lesquelles un avis externe serait précieux** :

**Q1 — La cadence du cycle V2.4 est-elle saine ?**
158 chantiers en 48 heures, c'est énorme. Les commits sont propres, les tests verts, mais la fatigue cognitive de Lilou/Ben pour relire 245 commits est réelle. Faut-il :
- (a) ralentir et regrouper en chantiers plus gros ;
- (b) garder cette granularité fine (1 commit = 1 chantier audité) ;
- (c) intercaler des sessions de revue collective entre les blocs.

**Q2 — La doctrine CMS est-elle excessive ?**
On a rendu éditable >1 200 clés. Risque : l'admin ne saura pas où chercher, et personne ne touchera jamais à 99 % de ces clés. Faut-il :
- (a) maintenir l'éditabilité totale au cas où ;
- (b) prioriser visuellement dans la console admin (« clés probablement à éditer » vs « clés techniques ») ;
- (c) accepter qu'une partie n'est éditable que théoriquement, pas pratiquement.

**Q3 — Quand commencer le code de VAGUE 4 sur les blocs Espace membre / Admin UI ?**
Le plan dit « fiches d'abord ». Mais Claude Code a déjà préparé tout le terrain technique. Faut-il :
- (a) Lilou/Ben rédige les 4 fiches V2.4.x avant tout code de fond ;
- (b) Claude Code peut commencer à coder l'Espace membre en s'appuyant sur les patterns posés (dashboard membre existe déjà en V2.4.5) ;
- (c) Co-construire les fiches au fur et à mesure du codage, mais avec des placeholders explicites pour ce qui manque.

**Recommandation de Claude Code** : option (a) sur l'Espace membre (besoin doctrinal fort sur la confidentialité, le wallet lecture seule, les notifications) ; option (b) sur le CMS d'édition (V2.4.4 — c'est juste de la plomberie, Claude Code peut continuer à brancher les libellés au CMS sans avoir besoin de fiche) ; (c) sur l'Admin UI car les patterns sont déjà partout.

### 8.4 Trois actions concrètes recommandées sous 7 jours

1. **Pusher les migrations V2 sur le distant** (`supabase db push` + 3 backfills), après backup vérifié. Sinon le site V2 ne marchera jamais en réel.
2. **Créer le bucket justificatifs sur Supabase Storage distant**. C'est 2 minutes mais bloquant pour V2.3.32.
3. **Lilou/Ben écrit la fiche V2.4.1 Espace membre** (la plus mûre côté V1, le moins de fond politique à inventer). Ouvre la VAGUE 4 réelle.

---

## 9. Comment exploiter le zip joint

Le ou les zips joints à ce document contiennent :
- `SYNTHESE-V2.md` (ce fichier)
- `CLAUDE.md` (la mémoire persistante complète, 63 KB)
- `docs/cdc-v2/` (le pack CDC V2 doctrinal)
- `docs/specs/` (les specs V1 — vocabulaire, design tokens, RGPD, etc.)
- `docs/manifests/` (les 69 manifests, dont 40 V2)
- `docs/ARCHITECTURE-decisions.md` (les ADRs)
- `lib/contenu-editorial.ts` (helper CMS, Strate 1)
- `lib/messages-validation.ts` (helper CMS, Strate 2, 1045 lignes)
- `components/contenu/PageEditorialeCMS.tsx` (composant CMS générique)
- Quelques exemples de formulaires avec le pattern `libelles?` (Strate 3)
- `supabase/migrations/` (les 57 migrations SQL)
- `package.json`, `next.config.mjs`, `docker-compose.yml`, `Dockerfile`
- `.env.example` (template des variables d'environnement)
- `tests/` (tests unitaires)
- `scripts/` (scripts de backfill et d'import)
- `git-log-v2.txt` (les 245 commits du cycle V2)
- `git-status.txt` (l'état Git précis au moment du zip)

**Si plusieurs zips** : ils sont numérotés `maintenant-v2-export-01.zip`, `-02.zip`, etc. Le `01` contient toujours `SYNTHESE-V2.md` et `CLAUDE.md` en racine. Les autres contiennent les blocs de code par dossier.

**Pour reconstituer le site** :
1. Cloner `https://github.com/benjaminball1984/maintenant-movement` (état au tip `389c03d`).
2. `cp .env.example .env.local` et remplir avec les clés Supabase distantes.
3. `npm install`
4. `supabase db push` (après backup distant)
5. Lancer les 3 backfills en `--dry-run` puis `--confirm`.
6. `npm run dev` → http://localhost:3000.

**Référence canonique** : le repo GitHub `benjaminball1984/maintenant-movement`. Ce zip est un snapshot du 28/05/2026 à `389c03d`.

---

## 10. Annexes courtes

### 10.1 Les 18 dictionnaires `MessagesValidationXxx`

```
MessagesValidationAuth        MessagesValidationProfil      MessagesValidationPetition
MessagesValidationAdhesion    MessagesValidationCagnotte    MessagesValidationCampagne
MessagesValidationCommunes    MessagesValidationEntraide    MessagesValidationMobilisation
MessagesValidationMoments     MessagesValidationSondages    MessagesValidationSel
MessagesValidationReseau      MessagesValidationMedia       MessagesValidationModeration
MessagesValidationAutresMoyens MessagesValidationDroitAdmin MessagesValidationMarche
```

### 10.2 Les 30 formulaires avec `LibellesXxx`

```
adhesion/FormulaireAdhesionEuros, Gratuit, T99CP
cagnottes/FormulaireCreationCagnotte, DonEuros, DonT99CP, ModerationCagnotte
campagnes/FormulaireCreationCampagne, ModerationCampagne
communes/FormulaireCreationCommuneLibre, Federation
entraide/FormulaireCreationOffre
fil-groupe/FormulairePosterMessage
groupe-entraide-local/FormulaireCreationGroupeEntraide
marche/FormulaireAchat, CreationBoutique, CreationMinimarche, CreationProduit, Notation
mobilisations/FormulaireCreationMobilisation, FormulaireRetrait
modales/ModaleSignaturePetition
moments/FormulaireCreationMoment
petitions/FormulaireCreationPetition, EditionPetition, Moderation
reseau/ModaleMessage
sel/FormulaireCreationService
sondages/FormulaireCreationSondage, Vote
admin/national/FormulaireAccorderDroit
admin/tresorerie/FormulaireInitierReversement
```

### 10.3 Les 12 scripts CLI

```
scripts/appliquer-sql-distant.ts       (DDL via API Management Supabase)
scripts/backfill-caisses.ts            (V2.3.27)
scripts/backfill-consentement.ts       (V2.1.2)
scripts/backfill-droits.ts             (V2.1.3)
scripts/import-communes.ts             (CSV → table commune)
scripts/importer-communes-reference.ts (référentiel INSEE)
scripts/importer-correspondance-cp-insee.ts
scripts/importer-membres-base44.ts     (V1 chantier 10.1)
scripts/importer-signataires.ts        (CSV Base44 → signature_petition)
scripts/migrer-base44.ts               (orchestrateur global)
scripts/precreer-communes.ts           (35 011 coquilles)
scripts/tester-rls.ts                  (smoke-test RLS Supabase)
```

### 10.4 Numéros clés à retenir

```
245    commits V2 (26-28 mai)
158    chantiers V2 livrés (V2.0.1 → V2.4.154)
912    tests Vitest verts
 57    migrations SQL
 30    interfaces LibellesXxx
 18    interfaces MessagesValidationXxx
108    fichiers branchent le CMS
 28    migrations V2 en attente de supabase db push
 17 746 signatures préservées (et toujours préservables)
 15 737 profils unifiés
 35 011 communes pré-créées
```

---

*Fin du document. Pour toute question, revenir vers Lilou/Ben qui transmettra à Claude Code pour action concrète.*
