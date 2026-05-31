# Revue 2026 : Plan d'action consolidé des correctifs (C1-C31)

> Synthèse de tous les écarts des Blocs 2-5, classés par priorité et par nature : **[LOCAL]** = applicable maintenant en local (Bloc 6, doctrine de greffe respectée, aucun service externe, aucune écriture distante) ; **[MIGRATION]** = migration SQL additive posée en local, à pousser au distant en Phase M ; **[DÉCISION]** = arbitrage Lilou/Ben requis ; **[PHASE FINALE]** = dépend du déploiement/cron/service payant.

## P0 : Critique

| Id | Correctif | Nature | Effort |
|---|---|---|---|
| C1 | **Imposer la 2FA** sur gardes admin/modération/trésorerie (check `getAuthenticatorAssuranceLevel()` → redirection enrôlement) | [LOCAL] | Moyen |
| C2 | **Tiret cadratin (—) dans les textes AFFICHÉS** (titres/metadata, JSX visibles, placeholders) → deux-points/parenthèses | [LOCAL] | Moyen (mécanique) |
| C18 | **Scroll interne des modales** `<dialog>` (`max-h-[90dvh] overflow-y-auto`) signature + message | [LOCAL] | Trivial |
| C28 | **Index `signature_petition.code_postal`** (fiche commune = page chaude) | [MIGRATION] | Trivial |
| C3 | **Job d'anonymisation 30 j** (`appliquer_suppressions_differees()`) | [MIGRATION] + [PHASE FINALE] (cron) | Moyen |
| C4 | **Export ZIP RGPD réel** (6 entrées) | [LOCAL] (route serveur + JSZip) | Élevé |

## P1 : Important

| Id | Correctif | Nature | Effort |
|---|---|---|---|
| C19 | `app/error.tsx` + `global-error.tsx` (+ profil/admin) | [LOCAL] | Faible |
| C20 | `app/loading.tsx` global + espaces lourds (réutilise `Skeleton`) | [LOCAL] | Faible |
| C5 | `afficher_nom` + payeur non nullable (nouveaux dons) | [MIGRATION] | Faible |
| C6 | Alimenter `journal_admin` (modération pétition, export, suppression) | [LOCAL] | Faible |
| C7 | Double-validation reversement (refuser si initiateur == confirmateur) | [LOCAL] | Trivial |
| C8 | OG images sur 3 fiches (article, profil réseau, commune référentiel) | [LOCAL] | Trivial |
| C9 | ET2 : 3 champs `type=url` → `ChampImageObjet` (logo orga ×2, photo profil) | [LOCAL] | Faible |
| C10 | Généraliser `BoutonsPartage` (~15 fiches) + 3e voie « publier sur le réseau » | [LOCAL] | Moyen |
| C11 | CTA redirection 99-coin `the99coinproject.org` (nouvelle fenêtre) dans formulaires T99CP | [LOCAL] | Faible |
| C25 | Supprimer `<Link><Button>` imbriqués (organisations, profil réseau) | [LOCAL] | Trivial |
| C29 | Compteurs pétitions/cagnottes via vues `petition_compteur`/`cagnotte_compteur` (supprime 2 N+1) | [LOCAL] | Faible |
| C30 | Cache compteurs home (`unstable_cache` revalidate) + fiche commune | [LOCAL] | Moyen |

## P2 : Polish

| Id | Correctif | Nature |
|---|---|---|
| C12 | Flèches `→`/`←` dans textes publiés → reformuler | [LOCAL] |
| C13 | ORM+5 : `numero_organisation` + trigger | [MIGRATION] |
| C14 | Colonnes `compte_immediatement` + `snapshot` (signature) | [MIGRATION] |
| C15 | `contenu_organisation` en soft-delete (cohérence fork) | [MIGRATION] |
| C16 | Aligner `declarerOrganisationInitiatriceAction` sur l'attestation obligatoire | [LOCAL] |
| C17 | Résidu `envoyerTransaction` adhésion T99CP → pattern redirection | [LOCAL] |
| C21 | UUID admin `min-w-0`/`break-all` | [LOCAL] |
| C22 | `/design-system` derrière admin/NODE_ENV | [LOCAL] |
| C23 | `dons/retour` params-manquants → Alert + lien | [LOCAL] |
| C24 | 2 formulaires → zodResolver | [LOCAL] |
| C26 | `aria-label` par objet (console admin organisations + gestionnaires) | [LOCAL] |
| C27 | `aria-live` toggles optimistes ; `aria-label` Textarea CartePost ; `role=img` BadgeCheck | [LOCAL] |
| C31 | RPC batch `personne_affichage_lot` ; TipTap `dynamic()` ; `.limit()` conversations ; `remotePatterns` + `<img>`→`next/image` | [LOCAL] + [MIGRATION] (RPC) |

## P3 : Décision Lilou/Ben requise (architecture / produit)

| Id | Sujet | Pourquoi une décision |
|---|---|---|
| D1 | **Statuts §13** (silencieux / membre non actif / membre actif-voteur) + correction du compteur public (qui inclut aujourd'hui les silencieux) | Choix produit structurant ; touche le sens du chiffre affiché publiquement |
| D2 | **Anonymat des votes Décider** (table `bulletin_decider` sans `personne_id` + token purgé) | Refonte de Décider (MVP actuel sans bulletin individuel) ; invariant RGPD fort |
| D3 | **Tronc `Objet`/`Espace`, `Rattachement` générique, `type_lien`, `OutilActivé`, ESM+5** | Vague 5 explicitement reportée ; décision nominative requise (doctrine §0.3) |
| D4 | **Mini-blog** : resserrer aux mandataires OU acter l'ouverture à tout membre actif | Arbitrage entre CDC §7 et le « double visage » assumé dans le code |
| D5 | **Frais de port marché en POL** | Feature absente ; à spécifier |

## Ordre d'exécution proposé pour le Bloc 6 (vagues de commits incrémentaux)

1. **Vague A (triviaux sûrs, fort impact)** : C18, C25, C28, C8, C7, C11, C21, C22, C23.
2. **Vague B (états & a11y)** : C19, C20, C26, C27, C16, C17.
3. **Vague C (vocabulaire/écriture mécanique)** : C2, C12 (sweep : sur textes affichés d'abord, vérifié).
4. **Vague D (perf & N+1)** : C29, C30, C31.
5. **Vague E (migrations additives locales)** : C5, C13, C14, C15, C28-RPC (queue Phase M).
6. **Vague F (RGPD lourde)** : C4 (export ZIP), C6 (journal), C1 (2FA), C3 (fonction anonymisation).

Chaque vague = vérif `typecheck`+`lint`(+tests) puis commit. Les [DÉCISION] D1-D5 restent documentées ici pour arbitrage (elles iront dans le ZIP).
