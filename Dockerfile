# Image conteneurisée du site Maintenant! (build de production).
#
# Le site tape sur Supabase DISTANT (pas de Postgres dans cette image). Pour un
# Supabase 100 % local, voir docs/DOCKER.md (CLI `supabase start`).
#
# Les variables NEXT_PUBLIC_* sont inlinées au build : on les passe en build-arg
# (voir docker-compose.yml / docs/DOCKER.md). Les secrets serveur (service role,
# clés Stripe, etc.) sont fournis au RUNTIME, jamais dans l'image.

# --- Dépendances ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

# --- Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Utilisateur non-root.
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
USER app
EXPOSE 3000
CMD ["npm", "run", "start"]
