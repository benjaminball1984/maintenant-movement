-- Migration 034 : privilèges des rôles applicatifs sur le schéma public.
--
-- Contexte (chantier 13.1) : en conditions réelles, on a constaté que les
-- rôles applicatifs Supabase (`anon`, `authenticated`, `service_role`)
-- n'avaient AUCUN droit de table sur le schéma `public`. Toute requête
-- PostgREST échouait avec l'erreur 42501 « permission denied for table … »,
-- y compris l'INSERT admin de la ligne `personne` au moment de l'inscription
-- (cf. actions.ts → inscrire) et la moindre lecture publique (ex. `commune`).
--
-- Cause : les `GRANT` que Supabase applique normalement à la création des
-- tables n'ont pas été posés lors du `db push` des migrations 002 à 033.
--
-- IMPORTANT : ces `GRANT` ne contournent PAS la sécurité. La vraie barrière
-- reste la RLS (Row Level Security), active sur toutes les tables sensibles :
--   - `anon` et `authenticated` restent filtrés ligne par ligne par les
--     policies (un GRANT sans policy permissive ne donne accès à rien) ;
--   - `service_role` contourne la RLS par conception, mais n'est jamais
--     exposé côté client (usage serveur uniquement, cf. lib/supabase/admin).
--
-- Idempotent : ré-exécuter ce script ne fait que re-poser les mêmes droits.

-- Accès au schéma lui-même.
grant usage on schema public to anon, authenticated, service_role;

-- Droits sur les objets EXISTANTS (tables 002 à 033, séquences, fonctions).
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Droits sur les objets FUTURS créés par `postgres` (rôle utilisé par les
-- prochaines migrations via `supabase db push`), pour ne plus jamais
-- retomber sur ce problème.
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on functions to anon, authenticated, service_role;
