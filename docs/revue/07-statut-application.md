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

## Mise à jour (C6 + nettoyage + migrations additives)

- **Nettoyage écriture (option B) quasi complet** : 53 tirets affichés (V2.6.41) + 4 flèches « voir » (V2.6.42) + **718 tirets** dans commentaires/doc interne (V2.6.48) + **56 liens « ← X » → « Retour »** (V2.6.49). Cahiers des charges vérifiés intacts. Reste : quelques flèches « → » dans des affichages de plage et commentaires (mineur).
- **C6** (V2.6.50) : `journaliser()` branché sur modération pétition + export/suppression RGPD. Additif, best-effort.
- **C5** (afficher_nom) + **C14** (compte_immediatement + snapshot) : migrations additives **appliquées et vérifiées au LOCAL** (V2.6.51).
- **C13** (organisation ORM+5) : migration écrite et correcte, **non appliquée au local** (la table `organisation` du chantier B n'est pas dans la base de démo locale) ; s'appliquera au distant en Phase M.
- **Découverte** : la base de démo LOCALE n'a pas les tables du chantier B (organisation, gestionnaire_espace, contenu_organisation, revendication_organisation) — elles sont sur le distant. Conséquence : D4 (gestionnaire) et C13/C15 ne sont pleinement testables que là où ces tables existent.
- **C15** (soft-delete contenu_organisation) : **reportée** (table absente en local + nécessite un changement du chemin de lecture).
- **Reste** : C16 (5 formulaires), C17 (flux paiement), C24 (mineur), C15 ; décision D5 ; flèches « → » résiduelles ; push au distant en Phase M.

## Mise à jour (C16 + C15 + décision D5)

- **C16 implémenté** (V2.6.53) : attestation de mandat obligatoire pour déclarer une organisation initiatrice en mode « nouvelle » (5 formulaires de création). Case à cocher + refus serveur si absente.
- **C15 implémenté** (V2.6.53) : migration additive `contenu_organisation_soft_delete` (colonne `retire_le`, retrait = soft-delete au lieu de DELETE, re-déclaration réactive). Lecture publique ignore les liens retirés. Table du chantier B absente en local, donc **appliquée au distant en Phase M**.
- **D5 implémenté** (V2.6.54) : frais de port du marché. Migration additive `produit_marche_frais_port` (colonne `frais_port_centimes` default 0), **appliquée et testée en LOCAL**. Helper pur `lib/marche/port.ts` (+7 tests, 1020 verts). Port en euros ajouté au total Stripe (sans commission sur le port) ; pour le 99-coin, port réglé en POL au taux du moment (référence affichée + alerte « Prévois du POL »). Non-régression par construction (default 0 + dégradation propre sur le distant). Manifest `docs/manifests/v2-6-54-D5-frais-de-port-marche.md`.
- **Reste après D5** : **C17** (résidu `envoyerTransaction` dans l'adhésion T99CP, à passer au pattern redirection vers the99coinproject.org, touche au paiement), **C24** (mineur : `zodResolver` sur `FormulaireCommentaire` + `FormulairePosterMessage`), **C26-reste** (`aria-label` sur les boutons badge de la console admin organisations), quelques flèches « → » résiduelles dans des affichages de plage et commentaires. **Phase M** : push de toutes les migrations en attente au distant (D1, C5, C13, C14, C15, D5). **S3** : révocation du jeton Management (action manuelle de Lilou/Ben).

## Mise à jour (C24 + C26 + nettoyage flèches publiées)

- **C24 implémenté** (V2.6.58) : `FormulaireCommentaire` et `FormulairePosterMessage` passent à `react-hook-form` + `zodResolver`. Tout le comportement est préservé (compteur de caractères live, désactivation à vide, messages d'erreur, accessibilité `aria-live`/`role=alert`, garde « connecté·e », icône Send). Pour `FormulairePosterMessage`, le schéma Zod est construit à partir des libellés CMS (via `useMemo`) afin de **garder les messages d'erreur éditables** (§0bis.8). 1020 tests verts, typecheck + lint OK.
- **C26-reste implémenté** (V2.6.58) : `aria-label` nommant l'organisation sur les boutons « Accorder / Retirer le badge » de la console admin organisations (un lecteur d'écran entendait juste « Retirer le badge » dans une liste).
- **Nettoyage flèches « → » publiées** (V2.6.58) : retrait des flèches d'affordance « voir → » que le nettoyage V2.6.42 avait manquées (cartes « à la une » de la home, carte unifiée « Voir la fiche », module campagne, CTA tunnel de la modale de signature) + 2 cas de prose publiée (conditions du marché, note `pres-de-chez-moi`). **Volontairement laissées** : les flèches de PLAGE date/heure (« début → fin », idiome de données ; le Master Plan valide « Départ → Arrivée » pour le covoiturage) et les flèches dans les pages admin, commentaires, README, page design-system (= « notes internes », explicitement autorisées par `03_VOCABULAIRE.md` §6).
- **Reste réellement** : **C17** (flux paiement adhésion T99CP, gardé pour plus tard sur décision de Lilou/Ben car il touche au paiement) ; **Phase M** (push distant des migrations D1/C5/C13/C14/C15/D5) ; **S3** (révocation du jeton, action manuelle de Lilou/Ben).

## Mise à jour (C17 : adhésion 99-coin sans wallet intégré)

- **C17 implémenté** (V2.6.60), avec feu vert explicite de Lilou/Ben (flux paiement). L'adhésion en 99-coin n'appelle plus `envoyerTransaction` (la plateforme ne simule plus de paiement) : `tx_hash` devient OBLIGATOIRE, la personne paie depuis son propre wallet (lien vers the99coinproject.org, encadré « envoie 12 99-coin vers [adresse trésorerie] »), et le garde-fou anti-réutilisation `enregistrerHashConsomme` (table `t99cp_hash_consomme` de V2.1.1) est branché pour la **première fois** : un même hash ne peut servir qu'une fois, tous flux confondus. Conforme à la doctrine §19. Adresse de trésorerie = clé CMS `adhesion.t99cp.wallet_tresorerie` (placeholder ajouté à `CONTENUS-A-ARBITRER.md` §3.3). Aucune migration (table déjà locale). 1021 tests verts ; garde-fou prouvé par test transactionnel (même hash refusé une 2ᵉ fois). Manifest `docs/manifests/v2-6-60-C17-adhesion-t99cp-redirection.md`.
- **Reste vraiment** : **Phase M** (push distant des migrations D1/C5/C13/C14/C15/D5) ; **S3** (révocation du jeton Management, action manuelle de Lilou/Ben). Tous les correctifs de code de la revue sont désormais appliqués. Flux 99-coin non refactorés (hors C17) : crédit SEL et achat marché appellent encore `envoyerTransaction` (signalé, hors périmètre, à aligner plus tard si souhaité).

