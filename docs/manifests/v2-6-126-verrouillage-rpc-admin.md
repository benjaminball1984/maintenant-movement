# Manifest — V2.6.126 : verrouillage des fonctions d'administration, et une fuite de données trouvée en route

**Date de fin** : 2026-08-16
**Branche** : `feature/phase-0-chantier-0.1-deploiement-cloudflare`
**Migration** : `supabase/migrations/20260816120000_verrouillage_rpc_admin.sql` (appliquée au distant)

---

## Demande Ben

« Fais ce qu'il faut pour que seuls les admins puissent le faire », après une question sur un
point mineur que j'avais signalé : `definir_une_home()` (la fonction qui épingle un contenu à la
une) était appelable par le rôle `anon`, c'est-à-dire par n'importe quel visiteur non connecté.

Ce point était bénin en soi — la fonction commence par vérifier `est_admin_general()` et refuse
tout le monde d'autre. Mais avant de le corriger, j'ai regardé si le défaut était isolé.

## Il ne l'était pas : les 6 actions d'administration étaient dans le même cas

`definir_une_home`, `retirer_une_home`, `definir_badge_officiel_organisation`,
`retirer_contenu_organisation`, `retirer_gestionnaire`, `traiter_revendication_organisation` —
toutes appelables par `anon`, toutes protégées uniquement par leur contrôle interne.

## Et surtout : une fuite de données personnelles, vérifiée en ligne

En élargissant l'audit à **toutes** les fonctions `SECURITY DEFINER` (celles qui s'exécutent avec
les pleins pouvoirs, hors du contrôle habituel des droits de lecture), j'en ai trouvé trois qui
renvoyaient des lignes **sans aucun contrôle d'identité**.

La plus grave, `adhesions_a_relancer()` :

> Avec la seule clé publique du site — celle qui est lisible dans le code source de n'importe
> quelle page, par n'importe qui — un appel anonyme renvoyait **471 lignes de la table
> `adhesion`** : `personne_id`, `montant_euros_centimes`, `stripe_session_id`, dates d'adhésion.

Ce n'était pas une hypothèse : l'appel a été fait, les lignes sont revenues. Le site étant en
ligne avec 470 membres réels, il s'agissait d'une exposition effective de données personnelles.

Deux autres fonctions avaient la même forme : `prestations_a_crediter` (prestations SEL en
attente de modération) et `candidates_pour_assemblee` (énumération des adhérent·es actif·ves
d'une commune).

## Corrigé

1. **Contrôle d'identité posé À L'INTÉRIEUR de `adhesions_a_relancer`** (`est_admin_national()`
   dans le `where` : un appelant non admin obtient zéro ligne, sans message d'erreur qui lui
   apprendrait que la fonction vaut la peine d'être attaquée). C'est la vraie protection —
   retirer le droit à `anon` n'aurait pas suffi, puisque `authenticated` le gardait et que
   n'importe qui peut créer un compte sur le site.
2. **Droits retirés** à `anon` sur les 9 fonctions concernées ; `prestations_a_crediter` est
   désormais réservée au `service_role` (aucun code de l'application ne l'appelle).

## Le piège PostgreSQL rencontré au passage — à retenir

La première version de la migration ne fermait **rien** du tout, alors qu'elle avait l'air
correcte. Raison : une fonction est créée avec `execute` accordé à **PUBLIC**, c'est-à-dire à
tous les rôles. Un `revoke execute ... from anon` ne retire pas ce droit-là — `anon` continue
d'en hériter par PUBLIC.

C'est la vérification après coup qui l'a montré (`has_function_privilege('anon', …)` renvoyait
toujours `true`). La bonne formule est : **retirer à PUBLIC, puis raccorder nommément** les rôles
légitimes.

`definir_une_home` faisait exception et s'était bien fermée du premier coup : elle avait déjà
reçu un `revoke ... from public` dans sa migration d'origine.

## Ce qui n'a pas été touché, volontairement

Aucune des fonctions que la base utilise pour décider qui a le droit de lire quoi
(`est_membre_commune`, `est_ami_reseau`, `personne_affichage`…) : elles **doivent** rester
appelables par `anon`, puisqu'elles sont évaluées pendant les requêtes du site public. Les
révoquer aurait cassé les pages pour les visiteurs. Idem pour les compteurs publics
(`nombre_signatures`, `compter_membres_actifs`…), qui ne renvoient qu'un nombre.

## Vérifications

- **Avant** : appel anonyme à `adhesions_a_relancer` → HTTP 200, **471 lignes**.
- **Après** : HTTP 401, `permission denied for function adhesions_a_relancer`. Idem pour
  `prestations_a_crediter` et `definir_une_home`.
- Les 9 fonctions vérifiées une à une : `anon` n'a plus le droit d'exécution sur aucune.
- **Le site public n'a pas bougé** : les 8 pages principales de `maintenant-le-mouvement.org`
  répondent toujours 200.
- 1186 tests verts, `tsc --noEmit` vert.

## Reste à faire

- [ ] **Auditer les fonctions restantes** de la liste « aucun contrôle d'identité » :
      `personne_id_par_numero`, `personne_cover_url`, `compteurs_cagnotte`, `compteurs_commune`,
      `nombre_communes_actives`. Elles paraissent inoffensives (un identifiant, une URL d'image,
      des compteurs) et sont probablement utilisées par le site public, mais elles n'ont pas été
      vérifiées une par une dans ce chantier.
- [ ] **Se demander si d'autres tables sont lisibles trop largement.** Cet audit n'a porté que
      sur les *fonctions*. Les politiques RLS des tables elles-mêmes n'ont pas été relues.
