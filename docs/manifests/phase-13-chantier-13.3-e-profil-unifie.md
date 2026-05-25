# Manifest — Phase 13, Chantier 13.3-E : profil unifié + numéro public M+7

**Date de fin** : 2026-05-25
**Branche** : feature/phase-13-integration
**Durée approximative** : 1 session Claude Code
**Décision fondatrice** : Lilou/Ben, 2026-05-25.

Chaque signataire (y compris les signataires importés sans compte) possède une
identité durable, le **profil unifié**, identifié par un numéro stable « M » +
7 lettres (ex. `MABCDEFG`). Ce numéro identifie la personne **au-delà de son
email** : elle peut changer d'adresse sans perdre son identité ni ses
contributions.

Cette décision **révise la réconciliation du 2026-05-24** (« tout repose sur
l'email, pas de table d'identité parallèle »). La nouvelle table `profil_unifie`
n'est PAS un doublon de `personne` : elle ne porte que le numéro, l'email de
réconciliation et le lien éventuel vers le compte.

## Livré et fonctionnel

- [x] Migration `20260525130000_profil_unifie.sql` :
  - Table `profil_unifie` (numéro, email unique insensible à la casse, lien 1-1
    `personne_id`), contrainte de format `^M[A-Z]{7}$`.
  - Générateur SQL `generer_numero_unique()` : « M » + 7 lettres, anti-collision
    (boucle) + anti gros mots (`numero_contient_terme_interdit`).
  - Trigger `profil_unifie_numero` (pose le numéro à la création) + `updated_at`.
  - Colonne `signature_petition.profil_unifie_id` (FK) + index.
  - RLS : la personne lit son propre profil unifié (lien `personne_id`).
  - `trouver_ou_creer_profil_unifie(email)` (SECURITY DEFINER, réservée
    `service_role`) : flux de signature.
  - `rattacher_profil_unifie()` (SECURITY DEFINER, idempotente) : à la
    vérification de l'email, relie le compte au profil unifié de cet email et
    rend ses signatures lisibles dans « Mes contributions ».
  - Remplissage des données existantes (comptes + ~17 500 signatures déjà
    importées) : un profil unifié par email, rattachement compte ↔ signatures.
- [x] Flux de signature (`app/(public)/mobiliser/petitions/actions.ts`) : chaque
  signature est rattachée à un profil unifié (numéro M+7) via la fonction
  service_role, même sans compte. Best-effort (dégradation propre si migration
  pas encore appliquée).
- [x] Rattachement à l'authentification (`app/auth/callback/route.ts`) : appel
  idempotent de `rattacher_profil_unifie` après email vérifié (inscription, lien
  magique, OAuth). Best-effort, ne bloque jamais la connexion.
- [x] Affichage : le numéro figure sur `/profil/informations` (« Ton numéro
  Maintenant! »), avec état « en cours d'activation » si indisponible.
  `lib/profil/unifie.ts` (`getNumeroUnifie`, `estNumeroUnifieValide`).
- [x] Import (`scripts/importer-signataires.ts`) : résout un profil unifié par
  email (dédupliqué) pour les signatures à insérer.
- [x] Tests : `tests/unit/profil/numero-unifie.test.ts` (6 cas, format M+7).
  Suite complète : 290 tests verts. typecheck + lint (389 fichiers) verts.

## Comment ça marche (cycle de vie)

1. **Signature (import ou anonyme)** : trouve-ou-crée un `profil_unifie` par
   email, y rattache la signature. Numéro attribué une fois, jamais modifié.
2. **Création de compte + email vérifié** : `rattacher_profil_unifie()` relie le
   `profil_unifie` au compte (`personne_id`) ; les signatures de cet email
   passent en `personne_id` = compte et deviennent lisibles dans
   « Mes contributions » (la RLS existante filtre par `personne_id`).
3. **Changement d'email** : l'identité (numéro) ne dépend pas de l'email ; les
   signatures déjà rattachées le restent.

## Déployé sur le distant (2026-05-25, autorisé par Lilou/Ben)

- [x] **Migration 038 appliquée** sur la base distante via
  `scripts/appliquer-sql-distant.ts`. Vérifié : **15 737 profils unifiés**
  créés (numéros tous uniques et au format `^M[A-Z]{7}$`), **17 746 / 17 746
  signatures reliées** à leur profil, compte existant relié.
- [x] **Pré-création des communes** (`precreer-communes.ts --confirm`) :
  **35 011 coquilles** `pre_creee` (révision §7B). Chaque commune est
  consultable et rejoignable.
- [x] **Import des signataires** : déjà complet (17 746 en base), 0 à insérer.
- Note types : `types/database.ts` a été mis à jour à la main (profil_unifie,
  `signature_petition.profil_unifie_id`, fonctions). Une régénération via la CLI
  Supabase reste possible plus tard mais n'est pas nécessaire (les types posés
  correspondent au schéma appliqué).

## Non livré (et pourquoi)

- [ ] **Réclamation d'un email antérieur** (cas où la personne a signé avec un
  email A puis crée un compte avec un email B) : nécessiterait une action
  « rattacher une autre adresse vérifiée ». Hors v1, à décider plus tard.

## Décisions techniques prises

- Identité durable dans une **table légère** `profil_unifie` (et non en colonne
  sur `personne`, qui exige un compte `auth.users`, impossible pour un
  signataire importé sans compte).
- Numéro généré et garanti **côté base** (trigger + contrainte de format +
  unicité), source unique de vérité, jamais côté application.
- Rattachement par email **uniquement après vérification** (callback), jamais à
  l'inscription : empêche de revendiquer les signatures d'autrui via un email non
  vérifié.

## Notes pour les chantiers suivants

- `lib/profil/unifie.ts` centralise l'accès au numéro et son format.
- La fonction `trouver_ou_creer_profil_unifie` est volontairement réservée à
  `service_role` (pas d'abus anonyme de création de profils).
- Quand le flux magic-link/OAuth créera vraiment la ligne `personne` (chantier
  1.3, aujourd'hui déféré), le rattachement marchera déjà (le callback appelle
  `rattacher_profil_unifie` après l'auth).
