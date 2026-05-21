# lib/

Logique partagée du site. Organisation par domaine fonctionnel :

## Services externes (pattern adapter)

Chaque service externe a une interface, un mock par défaut, une implémentation réelle, et une factory pilotée par variable d'environnement `*_PROVIDER`. Le site fonctionne à 100 % en local sans clé API.

- `email/` : `EmailService` (Brevo en prod, mock en dev).
- `payments/` : `PaymentService` (Stripe Checkout + Connect en prod, mock en dev).
- `t99cp/` : `T99CPService` (Polygon mainnet en prod, mock en dev).
- `livekit/` : `LiveKitService` (self-hosted en prod, mock en dev).
- `turnstile/` : `TurnstileService` (Cloudflare en prod, mock en dev).

## Accès Supabase

- `supabase/` : trois clients distincts (server, client, admin) + parsing des variables d'env.

## Domaines métier (requêtes et helpers)

Un dossier par espace fonctionnel, contenant typiquement `requetes.ts` (queries Supabase serveur) et parfois `config.ts` (constantes métier) :

- `adhesion/`, `admin/`, `agenda/`, `auth/`, `autres-moyens/`, `cagnottes/`, `campagnes/`, `carte/`, `communes/`, `entraide/`, `home/`, `marche/`, `media/`, `mobilisations/`, `moments/`, `notifications/`, `petitions/`, `sel/`, `sondages/`.

## Validations Zod

- `validations/` : schémas Zod par domaine. Chaque mutation Server Action commence par valider via le schéma du domaine concerné.

## Transverse

- `vocabulaire.ts` : lexique des termes fixés (cf. `docs/specs/03_VOCABULAIRE.md`).
- `utils.ts` : helpers transverses minuscules (`cn`, `formatageEuros`, etc.).
