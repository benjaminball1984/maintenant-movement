# Stack technique — Site Maintenant!

**Framework principal** : Next.js 14+ (App Router, React Server Components)
**Hébergement** : Cloudflare Pages
**Politique RGPD** : minimale légale (pas de cookie publicitaire, pas de traceur tiers, pas de bandeau de consentement)

---

## 1. Vue d'ensemble de la stack

| Brique | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 14+** (App Router) | Standard moderne, écosystème dense, ce que Claude Code maîtrise le mieux, supporte Server Components et Server Actions, bon support Cloudflare via `@cloudflare/next-on-pages`. |
| Langage | **TypeScript strict** | Claude Code produit du code plus juste avec types stricts. Réduit les bugs au runtime. |
| Hébergement | **Cloudflare Pages** | Performant, free tier généreux, edge-first, intégration native Turnstile. Dépendance US assumée par doctrine d'accessibilité tactique. |
| BDD | **Supabase** (Postgres managé) | Postgres + Auth + Storage + Realtime + RLS dans une seule offre. Région UE (Francfort par défaut, à confirmer). |
| Auth | **Supabase Auth** | 4 portes : email+mdp, magic link, OAuth GAFAM, OAuth éthique. RLS branché dessus. |
| Stockage médias | **Supabase Storage** | Cohérent avec BDD + auth + RLS. Limites par bucket configurables. |
| Email transactionnel + newsletter | **Brevo** (ex-Sendinblue) | Acteur français, RGPD natif, modèle au volume d'envois, ~40 % moins cher que Resend à 100k abonné·es. |
| Paiements | **Stripe Checkout** + **Stripe Connect** | Checkout pour adhésions et dons simples. Connect + KYC pour porteur·euses de cagnottes (versement). |
| Visio Décider | **LiveKit self-hosted** | Moderne, scalable, ouvert, WebRTC propre. Pas Zoom/Meet/Teams. Infra à choisir (Scaleway ou OVH probable). |
| Anti-bot | **Cloudflare Turnstile** | Accessible (pas reCAPTCHA), gratuit, intégré Cloudflare, respectueux vie privée. |
| Styles | **Tailwind CSS** + CSS variables | Design tokens dans `tailwind.config.ts` + variables CSS pour modification dynamique. |
| Composants UI | **shadcn/ui** (Headless UI + Tailwind) | Composants accessibles à composer, pas de lock-in. |
| Cartes | **MapLibre GL JS** | Libre, performant, basé OpenMapTiles. Pas Mapbox propriétaire. |
| i18n | **next-intl** | Français par défaut. Anglais en option future. |
| Validation formulaires | **Zod** + **react-hook-form** | Validation runtime + types TypeScript inférés. |
| State client | **Zustand** (léger) ou **TanStack Query** (data fetching) | Pas Redux (trop lourd pour ce besoin). |
| Tests | **Vitest** + **Playwright** | Vitest pour unitaires, Playwright pour end-to-end. |
| Lint/format | **Biome** (ou ESLint + Prettier) | Biome est plus rapide et tout-en-un. |
| Monitoring | **Sentry** (free tier) | Suivi erreurs. À paramétrer avec attention RGPD (pas d'IP, anonymisation). |

---

## 2. Versions cibles

```
node:        >= 20.x LTS
next:        ^14.2 (App Router)
react:       ^18.3
typescript:  ^5.4
tailwindcss: ^3.4
@supabase/supabase-js: ^2.45
@supabase/ssr: ^0.5 (helpers SSR/RSC)
livekit-client: ^2.x
@livekit/components-react: ^2.x
stripe: ^16.x
@stripe/stripe-js: ^4.x
maplibre-gl: ^4.x
react-map-gl: ^7.1 (wrapper React pour MapLibre)
zod: ^3.23
react-hook-form: ^7.52
next-intl: ^3.x
```

À adapter au moment du démarrage : utiliser les dernières versions stables au jour J.

---

## 3. Variables d'environnement

```dotenv
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # secret, jamais exposé côté client

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=                  # secret
STRIPE_WEBHOOK_SECRET=              # secret
STRIPE_CONNECT_CLIENT_ID=

# Brevo (email + newsletter)
BREVO_API_KEY=                      # secret
BREVO_SMTP_USER=
BREVO_SMTP_PASS=                    # secret
BREVO_NEWSLETTER_LIST_ID=

# LiveKit
LIVEKIT_URL=                        # wss://livekit.maintenant-le-mouvement.org
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=                 # secret

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=               # secret

# T99CP (Polygon)
NEXT_PUBLIC_T99CP_CONTRACT_ADDRESS=0x7275cfc83f486d53ca1379fc1f8025490bdcc79a
T99CP_RPC_URL=                      # Polygon RPC
T99CP_TRESORERIE_WALLET_PRIVATE_KEY= # secret, à protéger fortement

# AzuraCast (Radio)
NEXT_PUBLIC_AZURACAST_URL=

# Site
NEXT_PUBLIC_SITE_URL=https://maintenant-le-mouvement.org
NEXT_PUBLIC_SITE_NAME=Maintenant!
NODE_ENV=production
```

**Convention** : tout ce qui est préfixé `NEXT_PUBLIC_` est exposé côté client (clés publiques uniquement). Tout le reste est strictement serveur.

---

## 4. Architecture des dossiers

```
maintenant/
├── app/                            # App Router Next.js
│   ├── (public)/                   # Routes publiques (lecture libre)
│   │   ├── page.tsx                # Accueil
│   │   ├── s-informer/...
│   │   ├── mobiliser/...
│   │   ├── s-entraider/...
│   │   ├── agir/...
│   │   ├── comprendre/...
│   │   ├── carte/page.tsx
│   │   └── agenda/page.tsx
│   ├── (auth)/
│   │   ├── connexion/page.tsx
│   │   ├── inscription/page.tsx
│   │   └── magic-link/route.ts
│   ├── (membre)/                   # Routes pour personnes connectées
│   │   ├── profil/...
│   │   └── messagerie/...
│   ├── (admin)/                    # Routes admin
│   │   └── admin/...
│   ├── api/                        # API routes (webhooks Stripe, Brevo, etc.)
│   │   ├── stripe/webhook/route.ts
│   │   ├── brevo/webhook/route.ts
│   │   └── livekit/token/route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── components/                     # Composants partagés
│   ├── ui/                         # Composants UI bas niveau (shadcn/ui)
│   ├── layout/                     # Header, Footer, Nav
│   ├── carte/                      # CarteSection, etc.
│   ├── agenda/
│   ├── decider/                    # SalleDecider, VoteJugementMajoritaire
│   ├── formulaires/
│   ├── modales/
│   └── notifications/
│
├── lib/                            # Logique partagée
│   ├── supabase/                   # Clients Supabase (server, client, admin)
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── admin.ts
│   ├── stripe/
│   ├── brevo/
│   ├── livekit/
│   ├── t99cp/                      # Intégration Polygon
│   ├── turnstile/
│   ├── permissions/                # Helpers RLS et droits
│   ├── i18n/                       # Configuration next-intl
│   ├── vocabulaire.ts              # Lexique (depuis 03_VOCABULAIRE.md)
│   └── utils.ts                    # Helpers généraux
│
├── config/                         # Configuration centrale
│   ├── espaces.ts                  # Liste des 5 espaces et leurs sous-espaces (data)
│   ├── moments-solidaires.ts       # Types de moments solidaires (data)
│   ├── cagnottes.ts                # Types de cagnottes (data)
│   ├── notifications.ts            # Hiérarchie canaux (data)
│   ├── limites.ts                  # Limites upload, rate limits, etc.
│   └── site.ts                     # Métadonnées du site (titre, URLs, etc.)
│
├── types/                          # Types TypeScript partagés
│   ├── database.ts                 # Types générés depuis Supabase
│   ├── domain.ts                   # Types métier
│   └── api.ts
│
├── styles/                         # Tokens et styles globaux
│   ├── tokens.css                  # CSS variables (depuis 04_DESIGN-TOKENS.md)
│   └── fonts.css
│
├── public/                         # Assets statiques
│   ├── logo/
│   ├── images/
│   └── fonts/
│
├── messages/                       # Traductions next-intl
│   ├── fr.json
│   └── en.json
│
├── supabase/                       # Migrations SQL et seed
│   ├── migrations/
│   └── seed.sql                    # Cartographie 2100-2300 communes pré-créées
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── docs/
│   ├── specs/                      # Le pack que vous lisez
│   ├── README.md
│   ├── ARCHITECTURE-decisions.md   # ADR (Architecture Decision Records)
│   └── MAINTENANCE.md
│
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── biome.json (ou .eslintrc.json + .prettierrc)
└── .env.example                    # Sans les secrets, juste les noms
```

---

## 5. Patterns d'usage attendus

### React Server Components par défaut

Les composants sont Server Components sauf nécessité explicite (`'use client'` uniquement quand on a besoin de hooks, d'événements DOM, de state, etc.). Performance + sécurité (les secrets ne fuient pas côté client).

```tsx
// Server Component (défaut)
export default async function PetitionsPage() {
  const petitions = await getPetitionsActives() // appel direct Supabase côté serveur
  return <ListePetitions petitions={petitions} />
}

// Client Component (uniquement si nécessaire)
'use client'
export function ModaleSignature() {
  const [open, setOpen] = useState(false)
  // ...
}
```

### Server Actions pour les mutations

Préférer Server Actions à des routes API pour les mutations simples (création, édition, suppression). Validation Zod systématique.

```tsx
// app/agir/communes/actions.ts
'use server'

import { z } from 'zod'
import { creerCommuneLibreSchema } from '@/lib/validations'

export async function creerCommuneLibre(donneesBrutes: unknown) {
  const donnees = creerCommuneLibreSchema.parse(donneesBrutes)
  // ... insertion Supabase avec RLS
}
```

### Sécurité par RLS Supabase

Toutes les tables sont protégées par Row Level Security. Les politiques RLS encodent les permissions du domaine (créatrice = admin, modérateurice = accès console, etc.). **Jamais de bypass côté client.**

### Clients Supabase typés

Trois clients distincts :
- `lib/supabase/server.ts` : pour Server Components et Server Actions (avec cookies de session).
- `lib/supabase/client.ts` : pour Client Components (Realtime, etc.).
- `lib/supabase/admin.ts` : avec `SERVICE_ROLE_KEY`, jamais exposé, uniquement dans API routes pour les webhooks.

### Validation et erreurs

- **Schémas Zod** dans `lib/validations/` pour chaque formulaire et chaque API.
- Erreurs serveur typées (jamais de `try/catch` muet).
- Toast utilisateurice pour les erreurs prévisibles, log Sentry pour les erreurs imprévues.

### Internationalisation

`next-intl` pour la structure, mais le **contenu éditorial est en français**. L'i18n est posée pour préparer l'avenir, pas pour publier en anglais aujourd'hui. Sauf demande explicite, tout reste en `fr.json`.

### Accessibilité

- Cible WCAG 2.1 niveau AA minimum.
- Labels ARIA, contrastes suffisants, navigation clavier, focus visible.
- Cloudflare Turnstile (pas reCAPTCHA).
- `Atkinson Hyperlegible` ou équivalent pour les textes (voir `04_DESIGN-TOKENS.md`).

---

## 6. Sécurité

### Principes

- **Pas de secret côté client.** Tout ce qui n'est pas `NEXT_PUBLIC_*` reste serveur.
- **RLS Supabase activé partout.** Tester chaque politique en isolation.
- **CSP stricte** (Content Security Policy) en production.
- **HTTPS obligatoire**, HSTS activé.
- **Cookies de session** : `Secure`, `HttpOnly`, `SameSite=Lax` (sauf cas particuliers).
- **2FA obligatoire** pour comptes d'administration (animation, modération, trésorerie).
- **Rate limiting** sur tous les formulaires (par IP + par compte si connecté·e).
- **Audit log** systématique pour toutes les actions admin (table `journal_admin`).

### Stripe

- Toutes les transactions passent par Stripe (jamais de PAN ni CVV côté Maintenant!).
- Webhooks signés et vérifiés.
- Reçus fiscaux émis automatiquement (obligation associative).

### LiveKit

- Tokens d'accès émis par le serveur Maintenant! (jamais par le client).
- Permission par salle, par rôle (participant, modérateurice).
- Enregistrement opt-in selon le type d'instance (voir `01_ARCHITECTURE.md` §4F).

### T99CP

- La clé privée du wallet de trésorerie est **chiffrée au repos**.
- Idéalement, signatures multi-sig (à confirmer avec Lilou/Ben et l'équipe T99CP).
- Transactions toujours vérifiées on-chain avant validation.

---

## 7. Performance

- **Server Components** par défaut (moins de JS côté client).
- **Images** : `next/image`, formats AVIF/WebP, lazy loading.
- **Fonts** : `next/font` avec `display: swap`.
- **Caching** : `revalidateTag` et `revalidatePath` pour invalidation fine.
- **CDN** : Cloudflare Pages assure le edge caching.
- **BDD** : index sur les colonnes filtrées et triées fréquemment, pagination systématique.
- **Pas d'autoplay vidéo**, jamais (doctrine UX : on respecte l'attention).

---

## 8. Déploiement

### Environnements

- **Local** : `npm run dev`, Supabase local via CLI, LiveKit local optionnel.
- **Préproduction** : branche `develop`, déployée sur `dev.maintenant-le-mouvement.org`.
- **Production** : branche `main`, déployée sur `maintenant-le-mouvement.org`.

### Pipeline

GitHub Actions :
1. Lint (Biome).
2. Tests unitaires (Vitest).
3. Build Next.js (vérifie les types et le bundle).
4. Déploiement automatique sur Cloudflare Pages.
5. Tests end-to-end (Playwright) en post-déploiement préprod.
6. Promotion en prod manuelle.

### Migrations BDD

- Toutes les migrations dans `supabase/migrations/`.
- Numérotation horodatée.
- Reproductibles, idempotentes quand possible.
- Backup avant migration en prod (Supabase le fait automatiquement).

---

## 9. Observabilité

- **Sentry** pour les erreurs front et back.
- **Logs Supabase** pour les requêtes lentes.
- **Cloudflare Analytics** (anonymisé, RGPD natif) pour le trafic.
- **Plausible Analytics** (FR, RGPD natif, gratuit auto-hébergé) en option pour l'usage produit, à confirmer avec Lilou/Ben.
- **Logs LiveKit** pour les séances Décider.
- **Audit log Supabase** (`journal_admin`) pour les actions sensibles.

---

## 10. Ce qui n'est PAS dans la stack (choix conscients)

- **Pas de Mapbox** : MapLibre GL JS, libre.
- **Pas de reCAPTCHA** : Cloudflare Turnstile.
- **Pas de Google Analytics** : Cloudflare Analytics ou Plausible.
- **Pas de cookies tiers**, jamais.
- **Pas de Vercel** (préférence Cloudflare Pages pour le free tier et la philosophie edge).
- **Pas de Firebase** (lock-in Google, philosophie incompatible).
- **Pas d'IA-modération**, humain·e derrière toutes les décisions.
- **Pas de Zoom/Meet/Teams**, LiveKit self-hosted.
- **Pas de Sendinblue/Mailchimp/SendGrid**, Brevo.
- **Pas de Trustpilot ni équivalent**, notation interne 5 étoiles seulement sur marché solidaire.
