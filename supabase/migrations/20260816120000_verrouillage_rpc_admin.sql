-- ============================================================================
-- V2.6.126 — verrouillage des fonctions d'administration et d'une fuite de données
-- ============================================================================
--
-- Contexte (audit du 16/08/2026, demande Ben « fais ce qu'il faut pour que
-- seuls les admins puissent le faire »).
--
-- Point de départ : `definir_une_home()` était appelable par le rôle `anon`
-- (un visiteur non connecté). Sans gravité en soi — la fonction commence par
-- vérifier `est_admin_general()` — mais l'audit a montré que le défaut était
-- systématique, et qu'il cachait pire.
--
-- ## LA FUITE (vérifiée en ligne le 16/08)
--
-- `adhesions_a_relancer()` est `SECURITY DEFINER` (elle s'exécute avec les
-- droits de son propriétaire, donc RLS ne s'applique pas) et ne contrôlait
-- PAS qui l'appelle. Avec la seule clé publique du site — celle qui est
-- lisible dans le code de n'importe quelle page — un visiteur anonyme
-- obtenait **471 lignes de la table `adhesion`** : `personne_id`,
-- `montant_euros_centimes`, `stripe_session_id`, dates d'adhésion.
--
-- Ce n'était pas théorique : l'appel a été fait et les lignes sont revenues.
--
-- Deux autres fonctions avaient la même forme (`SECURITY DEFINER`, aucun
-- contrôle, renvoi de lignes) : `prestations_a_crediter` et
-- `candidates_pour_assemblee`.
--
-- ## CE QUE FAIT CETTE MIGRATION
--
--   1. Pose un contrôle d'identité À L'INTÉRIEUR de `adhesions_a_relancer`.
--      Retirer le droit à `anon` n'aurait pas suffi : `authenticated` le
--      gardait, donc n'importe quel compte créé sur le site aurait encore pu
--      lire les 471 lignes. Le contrôle interne est la vraie protection ; les
--      droits ne sont qu'une seconde barrière.
--   2. Retire `execute` à `anon` sur les 6 fonctions d'action réservées à
--      l'administration. Elles refusaient déjà les non-admins, mais il faut
--      désormais DEUX erreurs (retirer le contrôle interne ET rouvrir le
--      droit) pour créer un trou, au lieu d'une seule.
--   3. Réserve `prestations_a_crediter` au `service_role` : aucun code de
--      l'application ne l'appelle, elle attend un cron.
--   4. Retire `execute` à `anon` sur `candidates_pour_assemblee`.
--
-- ## CE QUE CETTE MIGRATION NE FAIT PAS
--
-- Elle ne touche à AUCUNE des fonctions que la base utilise pour décider qui
-- a le droit de lire quoi (`est_membre_commune`, `est_ami_reseau`,
-- `personne_affichage`…). Celles-là DOIVENT rester appelables par `anon` :
-- elles sont évaluées pendant les requêtes du site public, et les révoquer
-- casserait les pages pour les visiteurs. Même chose pour les compteurs
-- publics (`nombre_signatures`, `compter_membres_actifs`…), qui ne renvoient
-- qu'un nombre.
--
-- GREFFE ADDITIVE (CLAUDE.md §0.3) : aucune fonction supprimée, aucune table
-- ni donnée touchée. On ajoute un contrôle et on retire des droits.
--
-- Idempotente : rejouable sans erreur.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. La fuite : `adhesions_a_relancer` ne répond plus qu'à l'admin national
-- --------------------------------------------------------------------------
--
-- Le contrôle est posé dans le `where` : un appelant qui n'est pas admin
-- national obtient zéro ligne, sans erreur. C'est volontaire — on ne dit pas
-- à un curieux « tu n'as pas le droit », ce qui lui apprendrait que la
-- fonction existe et vaut la peine d'être attaquée.
--
-- L'appelant légitime est `envoyerRelancesAdhesion()`
-- (app/(public)/agir/adherer/actions.ts), qui vérifie déjà `est_admin_national`
-- côté application avant d'appeler : son comportement ne change pas.
--
-- NOTE POUR PLUS TARD : le jour où un cron quotidien appellera cette relance
-- avec la clé `service_role` (prévu, cf. CLAUDE.md §11), il n'aura pas
-- d'identité et obtiendra zéro ligne. Un cron doit lire la table `adhesion`
-- directement — le `service_role` contourne RLS de toute façon — ou bien il
-- faudra élargir ce contrôle sciemment.
create or replace function public.adhesions_a_relancer(seuil_jours integer default 0)
returns setof public.adhesion
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.adhesion
  where public.est_admin_national()
    and statut = 'active'
    and relance_envoyee_le is null
    and expire_le <= now() + make_interval(days => seuil_jours);
$$;

comment on function public.adhesions_a_relancer(integer) is
  'Adhésions arrivant à échéance, à relancer. RÉSERVÉE À L''ADMIN NATIONAL : renvoie zéro ligne à tout autre appelant (verrou posé le 16/08/2026 après constat de fuite publique).';

-- PIÈGE POSTGRESQL, découvert en vérifiant cette migration : une fonction est
-- créée avec `execute` accordé à **PUBLIC**, c'est-à-dire à tous les rôles.
-- Un `revoke ... from anon` ne retire PAS ce droit-là : `anon` continue d'en
-- hériter par PUBLIC, et le premier essai n'avait donc rien fermé. Il faut
-- retirer à PUBLIC, puis raccorder nommément les rôles légitimes.
revoke execute on function public.adhesions_a_relancer(integer) from public;
revoke execute on function public.adhesions_a_relancer(integer) from anon;
grant execute on function public.adhesions_a_relancer(integer) to authenticated, service_role;

-- --------------------------------------------------------------------------
-- 2. Les six actions d'administration : plus appelables par un anonyme
-- --------------------------------------------------------------------------
-- Chacune vérifie déjà `est_admin_general()` en première ligne et refuse les
-- autres. On ferme la porte du couloir en plus du contrôle au guichet.
-- Même précaution que ci-dessus : on retire à PUBLIC *et* à `anon`, puis on
-- raccorde nommément `authenticated` (l'admin agit depuis sa session) et
-- `service_role` (le serveur).
revoke execute on function public.definir_une_home(text, uuid) from public, anon;
grant execute on function public.definir_une_home(text, uuid) to authenticated, service_role;

revoke execute on function public.retirer_une_home(text) from public, anon;
grant execute on function public.retirer_une_home(text) to authenticated, service_role;

revoke execute on function public.definir_badge_officiel_organisation(uuid, boolean) from public, anon;
grant execute on function public.definir_badge_officiel_organisation(uuid, boolean) to authenticated, service_role;

revoke execute on function public.retirer_contenu_organisation(text, uuid) from public, anon;
grant execute on function public.retirer_contenu_organisation(text, uuid) to authenticated, service_role;

revoke execute on function public.retirer_gestionnaire(uuid) from public, anon;
grant execute on function public.retirer_gestionnaire(uuid) to authenticated, service_role;

revoke execute on function public.traiter_revendication_organisation(uuid, boolean) from public, anon;
grant execute on function public.traiter_revendication_organisation(uuid, boolean) to authenticated, service_role;

-- --------------------------------------------------------------------------
-- 3. `prestations_a_crediter` : réservée au serveur
-- --------------------------------------------------------------------------
-- Elle renvoie des lignes de `prestation_sel` en attente de modération.
-- Aucun code de l'application ne l'appelle (elle attend un cron horaire, cf.
-- app/(public)/s-entraider/sel/actions.ts) : personne ne perd rien.
revoke execute on function public.prestations_a_crediter(integer) from public, anon, authenticated;
grant execute on function public.prestations_a_crediter(integer) to service_role;

-- --------------------------------------------------------------------------
-- 4. `candidates_pour_assemblee` : plus appelable par un anonyme
-- --------------------------------------------------------------------------
-- Elle énumère les identifiants des adhérent·es actif·ves d'une commune ou
-- d'une fédération. Son seul appelant est `/agir/communes`, une rubrique
-- aujourd'hui en sommeil, et il tourne avec la session de la personne
-- connectée : `authenticated` est conservé.
revoke execute on function public.candidates_pour_assemblee(text, uuid) from public, anon;
grant execute on function public.candidates_pour_assemblee(text, uuid) to authenticated, service_role;
