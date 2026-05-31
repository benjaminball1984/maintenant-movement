# Revue 2026 : Bloc 6 : statut d'application des correctifs

> État honnête de ce qui a été appliqué pendant cette session, et de ce qui reste. Tout est commité par incréments (V2.6.33→V2.6.37). 1013 tests verts après application : **rien de cassé**.

## Appliqué et commité (13 correctifs)

| Id | Correctif | Commit |
|---|---|---|
| C18 | Scroll interne des modales `<dialog>` (signature + message) | V2.6.33 |
| C25 | Suppression des `<Link><Button>` imbriqués (+ helper `classesBouton`) | V2.6.33 |
| C7 | Double-validation du reversement (initiateur ≠ confirmateur) | V2.6.33 |
| C21 | UUID admin `min-w-0`/`break-all` | V2.6.33 |
| C22 | `/design-system` masqué en production | V2.6.33 |
| C23 | `dons/retour` paramètres manquants : Alert + lien | V2.6.33 |
| C19 | Frontières d'erreur `app/error.tsx` + `app/global-error.tsx` | V2.6.34 |
| C20 | État de chargement `app/loading.tsx` (SkeletonCarte) | V2.6.34 |
| C8 | Images de partage Open Graph sur 3 fiches (article, profil réseau, commune) + 2 em-dash de titre + 1 flèche corrigés au passage | V2.6.35 |
| C28 | Index perf `signature_petition_code_postal_idx` (migration additive) | V2.6.35 |
| C11 | Lien 99-coin `the99coinproject.org` (nouvelle fenêtre) sur le don T99CP | V2.6.36 |
| C27 | a11y : `aria-label` champ commentaire, `role=img` badge officiel | V2.6.37 |
| C26 | a11y : noms d'objet sur les actions admin organisations (accepter/refuser, retirer gestionnaire) | V2.6.37 |

## Reste à poursuivre : sûr et rapide (aucun risque de régression)

Ces correctifs sont locaux, additifs, sans dépendance externe ni test BDD. À enchaîner dans une prochaine session de polish.

- **C16** : forcer l'attestation de mandat aussi sur `declarerOrganisationInitiatriceAction` (mode « nouvelle »).
- **C17** : résidu `envoyerTransaction` dans l'adhésion T99CP → pattern redirection.
- **C24** : `zodResolver` sur `FormulaireCommentaire` et `FormulairePosterMessage`.
- **C26 (reste)** : `aria-label` sur les boutons « Accorder/Retirer le badge » de la console admin organisations.
- **C6** : alimenter `journal_admin` sur modération pétition, export, suppression.
- **C12 / C2** : flèches `→`/`←` et **tirets cadratins (—)** dans les textes affichés. **Tâche mécanique mais volumineuse** (≈303 occurrences en code, dont ≈40 titres/metadata + JSX + placeholders, et ≈600 en docs). À traiter comme une passe dédiée et **relue** (un remplacement aveugle risquerait de toucher des chaînes sensibles ou des regex). Quelques occurrences déjà corrigées au passage (C8).
- **C5 / C13 / C14 / C15** : migrations SQL **additives** (afficher_nom + payeur ; numero_organisation ORM+5 ; compte_immediatement+snapshot ; contenu_organisation soft-delete). Sûres à écrire ; à appliquer en local puis distant en Phase M.
- **C31** : TipTap en `dynamic()` ; `.limit()` sur `listerConversations` ; `remotePatterns` Supabase + `<img>`→`next/image`.

## Reste : nécessite un test BDD / infra / auth (NON appliqué à l'aveugle, pour « ne rien casser »)

Ces correctifs sont importants mais comportent un **risque réel de régression** s'ils sont appliqués sans test dans l'environnement adéquat. Conformément à la consigne « sans rien casser », ils sont décrits précisément mais pas appliqués mécaniquement.

- **C1 (2FA obligatoire admin)** [P0 sécurité] : ajouter un check `getAuthenticatorAssuranceLevel()` dans `garantirAccesAdmin`. **Risque** : verrouiller l'accès admin si l'enrôlement TOTP n'est pas testé bout-en-bout d'abord. À faire avec un test du flux d'enrôlement/connexion.
- **C29 (compteurs via vues `petition_compteur`/`cagnotte_compteur`)** [P1 perf] : **risque vérifié** : ces vues sont des vues simples sur `signature_petition`/`don` ; leur lisibilité par le rôle `anon` dépend de `security_invoker` et des `grant`. La fonction RPC actuelle (`SECURITY DEFINER`) est volontairement choisie pour exposer l'agrégat sans la table. Basculer sans test du rôle anon risquerait de mettre **les compteurs publics à 0**. À valider par une requête de test en rôle anon avant bascule. (C'est de la latence, pas de la correction : aucun risque à laisser en l'état.)
- **C30 (cache des compteurs home)** [P1 perf] : nécessite un client Supabase sans cookies + `unstable_cache`/`revalidate` ; à tester (cohérence cache vs données).
- **C3 (job d'anonymisation 30 j)** [P0 RGPD] : la fonction SQL est écrivable ; le **cron** d'exécution relève de la Phase finale (déploiement).
- **C4 (export ZIP RGPD réel)** [P0 RGPD] : génération asynchrone des 6 entrées + Storage + URL signée ; chantier d'infra à part entière.

## Décisions Lilou/Ben (P3) : inchangées
D1 statuts §13 + compteur public ; D2 anonymat votes Décider ; D3 tronc Objet/Espace + rattachement générique ; D4 mini-blog (mandataires vs membre actif) ; D5 frais de port marché en POL. Voir `06-plan-correctifs.md`.

---

*Le Bloc 8 (audit post-correctifs : sécurité + lisibilité + élégance + architecture) est mené sur cet état (13 correctifs appliqués, tests verts).*

---

## Mise à jour (suite de la même session)

Après le Bloc 8, sur décision Lilou/Ben :

- **Sécurité appliquée** : **S1** (anti open-redirect du callback auth) et **S2** (échappement des 6 recherches admin en `.or()`) corrigés et commités (V2.6.40). **S3** (révocation du jeton Management Supabase) reste une action manuelle de Lilou/Ben.
- **Nettoyage écriture (option B, textes affichés d'abord)** : **53 tirets cadratins** retirés des titres / libellés / placeholders affichés (V2.6.41) ; **4 flèches** retirées des liens « voir » (V2.6.42). Cible stricte (chaînes affichées seulement) ; cahiers des charges intacts ; 1013 tests verts.
- **Décisions tranchées et enregistrées** (mémoire projet) : **D1** (membre actif = adhésion en cours de validité ; compteur public = adhérent·es à jour) et **D2** (Décider = émargement + bulletin secret).

**Reste pour une prochaine passe** : liens « retour » (`← X`, ≈40, formulation « Retour à/au/aux X » au cas par cas) ; tirets/flèches dans les commentaires et la doc interne (le gros volume, invisible au public) ; décision D5 ; correctifs C16/C17/C24/C6 + migrations additives C5/C13/C14/C15/C31.

## Mise à jour (D1 et D4 implémentés et testés en local)

- **D1 implémenté** (V2.6.45) : fonction SQL `compter_membres_actifs()` (count distinct des personnes à adhésion valide : `statut='active'` et `expire_le > now()`), branchée dans `getCompteursHome`. **Testée en local** (transaction de test : une personne à 2 adhésions comptée une fois, adhésion expirée exclue). Migration additive appliquée au Supabase **local** ; à pousser au distant en Phase M.
- **D4 implémenté** (V2.6.46) : nouveau helper `peutPublierAuNomEspace` (gestionnaire actif OU `createurice_id` de l'espace). Publier au nom d'un espace n'est plus ouvert à tout membre actif. **Testé en local** (le créateur n'est jamais bloqué ; un non-créateur non-mandataire l'est). 1013 tests verts.
- **D3** : plan écrit (`09-plan-convergence-tronc.md`), exécution NON commencée (chantier séparé, `pg_dump` d'abord).

