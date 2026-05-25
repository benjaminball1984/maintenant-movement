# Docker & développement local — Maintenant!

Trois façons de faire tourner le projet. Toutes lisent la configuration depuis
`.env.local` (copier `.env.example`, remplir au moins les clés Supabase). Le site
fonctionne à 100 % en local **sans aucune clé d'API externe** (adapters en mock
par défaut, cf. `CLAUDE.md §6`).

## 1. Local direct (le plus simple)

```bash
npm install
cp .env.example .env.local   # puis remplir NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE
npm run dev                  # http://localhost:3000
```

## 2. Local conteneurisé (Docker Compose)

Aucune install Node sur la machine : tout tourne dans un conteneur Node 20, avec
hot reload (le code est monté en volume).

```bash
cp .env.example .env.local   # remplir les clés Supabase
docker compose up            # http://localhost:3000
docker compose down
```

## 3. Image de production (Dockerfile)

Build d'une image autonome (`next build` + `next start`). Les variables
`NEXT_PUBLIC_*` sont **inlinées au build** : on les passe en build-arg. Les
secrets serveur sont fournis au **runtime** via `--env-file`.

```bash
docker build -t maintenant \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..." \
  .

docker run --env-file .env.local -p 3000:3000 maintenant
```

> Note : la cible d'hébergement de production reste **Cloudflare Pages**
> (`@cloudflare/next-on-pages`, cf. `CLAUDE.md §6`). Cette image Docker est utile
> pour un déploiement conteneurisé alternatif ou un test d'iso-prod local.

## Supabase en local (optionnel, via la CLI)

Par défaut, le projet tape sur le **Supabase distant** (région Francfort). Pour
travailler sur un Supabase 100 % local (Postgres + Auth + Studio en conteneurs
Docker, gérés par la CLI Supabase) :

```bash
# Installer la CLI Supabase (https://supabase.com/docs/guides/cli)
supabase init        # crée supabase/config.toml (une fois)
supabase start       # démarre la stack locale (Docker)
supabase db reset    # applique toutes les migrations de supabase/migrations/
```

Puis pointer `.env.local` sur l'instance locale (la CLI affiche l'URL et les
clés `anon` / `service_role` au démarrage).

> Les migrations sont la source de vérité du schéma. Sur le distant, on applique
> via `scripts/appliquer-sql-distant.ts` (API Management) quand la CLI n'est pas
> disponible ; penser à enregistrer la version dans
> `supabase_migrations.schema_migrations` (cf. `supabase/README.md`).

## Récapitulatif des variables d'environnement

Voir `.env.example` (commenté). Essentiel pour démarrer :

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (Supabase).
- `SUPABASE_ACCESS_TOKEN` (uniquement pour `scripts/appliquer-sql-distant.ts`).
- Les `*_PROVIDER` / `*_NETWORK` (email, paiements, livekit, t99cp, turnstile)
  restent à `mock` pour un fonctionnement complet sans clé.
