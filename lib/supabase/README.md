# lib/supabase/

Trois clients Supabase distincts (chantier 1.1) :

- `server.ts` : pour Server Components et Server Actions, avec cookies de session.
- `client.ts` : pour Client Components (Realtime, abonnements).
- `admin.ts` : avec `SUPABASE_SERVICE_ROLE_KEY`, **jamais exposé côté client**, uniquement dans les API routes webhook.

RLS Supabase activée sur toutes les tables avec données personnelles. Jamais de bypass côté client.
