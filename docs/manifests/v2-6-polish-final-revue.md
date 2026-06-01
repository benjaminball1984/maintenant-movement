# Manifest — Polish final post-revue (V2.6.66 → V2.6.71)

**Date de fin** : 2026-06-01
**Branche** : `main`
**Commits** : `1273359` (P1) · `c4f0ec2` (P2) · `0590268` (P3) · `b673fcc` (P4) · `285adb2` (P5) · `279e06a` (P6) · ce manifest (V2.6.72)
**Durée approximative** : 1 session Claude Code

> Solde les améliorations restantes de la revue (`docs/revue/08-audit-post-correctifs.md` §C/§D) : items Q1 à Q6, manques mineurs, dette technique. Tout local, additif, **aucune migration**, **rien poussé au distant**. Méthode : une vague = un commit, les 4 vérifications (typecheck, lint, tests, build) vertes avant chaque commit.

## Livré et fonctionnel

### Vague P1 — finitions UI et accessibilité (`1273359`)
- [x] Modales `<dialog>` sans hauteur max alignées sur le correctif C18 (`max-h-[90dvh] overflow-y-auto`) : `components/partage/InvitationInterne.tsx`, `components/campagnes/BoutonAttacherACampagne.tsx`. Plus aucune modale `<dialog>` sans garde de débordement vertical.
- [x] Open Graph de la fiche article du journal (Maintenant Médias) : `ogType: 'article'` passé à `metadataPourPartage` (`app/(public)/s-informer/journal/[slug]/page.tsx`). Les autres pages partageables restent `website` par défaut.

### Vague P2 — DRY chirurgical Q1/Q4/Q5 (`c4f0ec2`)
- [x] **Q1** : `app/actions/reservation.ts` réutilise le type exporté `StatutReservation` au lieu de réinliner l'union des 7 statuts 5 fois (1 type de retour + 4 casts).
- [x] **Q4** : centralisation du formatage euros. Deux variantes ajoutées dans `lib/format-euros.ts` qui **reproduisent exactement** les deux styles inline existants : `formaterEurosEntier` (`maximumFractionDigits: 0`) et `formaterEurosDecimales` (2 décimales fixes), chacune construite une seule fois. 8 fichiers migrés (`app/admin/page.tsx`, `app/(membre)/profil/dashboard`, `components/cagnottes/JaugeT99CPEuros`, `components/adhesion/FormulaireAdhesionEuros`, `app/admin/national/tresorerie` ×2, `components/cagnottes/FormulaireDonEuros`, `app/(membre)/profil/contributions`). **Affichage strictement identique** : prouvé par 6 tests d'équivalence comparant à la config Intl inline (y compris 0 et négatifs, que ces variantes n'effacent pas, contrairement à `formaterEuros`).
- [x] **Q5** : le schéma Zod de `app/actions/transaction-sortante.ts` branche `estIbanValide` (`lib/iban.ts`, déjà testé) : pour le canal euro, un IBAN bénéficiaire saisi (champ optionnel) doit être valide (ISO 13616, mod 97). Le canal 99-coin porte un wallet, non validé comme IBAN. Câble au passage un helper « musée ».

### Vague P3 — helpers de garde Q3/Q6 (`0590268`)
- [x] **Q3** : nouveau helper `exigerSession(message?)` dans `lib/auth/session.ts` qui centralise « récupérer la session, sinon retourner `{ok:false, message}` ». Appliqué à ~40 gardes dans 16 fichiers `app/actions/*` (+ `reservation.ts`). Messages préservés à l'identique (défaut « Connexion requise. »). La variable `session` n'est extraite que dans les actions qui l'utilisent ensuite (respect de `noUnusedLocals`, vérifié par typecheck).
- [x] **Q6** : `app/actions/reservation.ts` : extraction de `executerTransitionDemandeur` qui factorise le squelette commun des trois transitions côté demandeur (signaler litige, confirmer, annuler) : charge la réservation, vérifie le demandeur, vérifie la transition D8, change le statut. Les spécificités (validation du motif, notifications, revalidation) et les deux messages d'erreur variables restent chez chaque appelant, mots pour mots.

### Vague P4 — centralisation libellés d'enum Q2 (`b673fcc`)
- [x] **Cagnotte** : `LIBELLE_TYPE` (ouverte/lutte/cotisation), byte-identique dans 3 fichiers, centralisé dans `lib/cagnottes/libelles.ts` (`LIBELLE_TYPE_CAGNOTTE`). Aucun changement d'affichage.
- [x] **Visibilité Décider** : `LIBELLE_VISIBILITE` divergeait (console admin en forme courte « Membres »/« Fédéré » ; page publique et formulaire en forme longue « Membres uniquement »/« Périmètre fédéré »/« Public (enregistré) »). Centralisé dans `lib/decider.ts` (`LIBELLE_VISIBILITE_SALLE`, à côté de `LIBELLE_MODE`/`LIBELLE_STATUT`). **Forme longue retenue comme canonique** (plus explicite, déjà majoritaire) : la console admin est donc harmonisée vers la forme longue.

### Vague P5 — code mort et rangement (`285adb2`)
- [x] Retrait des 3 composants stub orphelins (0 référence en code, vérifié par recherche globale : seulement des mentions en docs + 1 commentaire) : `components/home/PageEspaceStub.tsx`, `PageSousEspaceStub.tsx`, `PageEditorialeStub.tsx` (~180 lignes). Réversible via l'historique git.
- [x] Rangement local : `export-claudeai/` déplacé sous `docs/archives/` (reste gitignoré, le zip de 3,6 Mo n'entre pas dans le dépôt — règle `export-claudeai/` non ancrée qui matche à toute profondeur).

### Vague P6 — wallet vendeur sur l'achat marché (`279e06a`)
- [x] Le marché 99-coin affiche désormais l'adresse wallet de la vendeureuse (sur le modèle de l'encadré cagnotte/adhésion : `Alert` info + `<code>` copiable) au lieu de « l'adresse t'est communiquée via la messagerie ».
  - `lib/marche/requetes.ts` : helper `walletVendeureuse(id)` en **requête séparée et défensive** (la colonne `personne.wallet_t99cp` est locale jusqu'à la Phase M ; sur le distant la sélection renvoie une erreur PostgREST, `data` vaut null, dégradation propre à `null`, la fiche produit ne plante jamais).
  - `app/(public)/s-entraider/marche/produits/[slug]/page.tsx` : charge le wallet uniquement quand le formulaire d'achat s'affiche, passe `walletVendeur` en prop.
  - `components/marche/FormulaireAchat.tsx` : prop `walletVendeur` + 3 libellés CMS-éditables. **Dégradation propre par construction** (défaut `null` → message de repli conservé).

## Livré partiellement

- [ ] **Q2 (suite) : harmonisation des « ~27 maps d'enum locales »** : l'audit signalait « ~27 maps d'enum locales (certaines divergentes) ». L'inspection montre que `LIBELLE_TYPE` est un **nom générique** réutilisé pour des enums différents (media, fédérations, agenda, mes-créations…) au **contenu distinct** : ce ne sont PAS des duplications, elles ne sont donc pas fusionnées. Les deux divergences réelles (cagnotte byte-identique, visibilité Décider courte/longue) sont traitées. Un écart mineur restant, jugé **intentionnel** et laissé tel quel : `LIBELLE_TYPE_CAISSE` en singulier sur la fiche caisse (`tresorerie/[caisseId]`) vs pluriel sur la liste agrégée (`tresorerie/page`) — détail vs agrégat, à arbitrer seulement si Lilou/Ben veut l'uniformiser.

## Non livré (et pourquoi)

- [ ] **Déplacement de `V2/`** sous `docs/archives/` : `mv` refusé par Windows (« accès refusé », verrou probable sur le `.zip`). Sans impact dépôt (le dossier est gitignoré). **Action Lilou/Ben** : déplacer ou supprimer `V2/` manuellement quand aucun process ne le tient (ferme tout explorateur/archiveur ouvert dessus).
- [ ] Hors périmètre du prompt (volontairement non touchés) : C1 (2FA admin), C3/C4 (anonymisation, export ZIP RGPD), C29/C30 (compteurs via vues, cache home), Phase M (push distant), feature paiement 99-coin entre membres dans le flux de réservation, passe C2/C12 (tirets/flèches). Ce sont des chantiers risqués ou structurants, pas du polish.

## Contenus à arbitrer

- [ ] `components/marche/FormulaireAchat.tsx` : 3 nouveaux libellés par défaut, fonctionnels (microcopie d'aide, autorisée §3), CMS-éditables : `walletVendeurTitre` (« Paie à l'adresse de la vendeureuse »), `walletVendeurAvant`, `walletVendeurApres`. Relecture éditoriale optionnelle.

## Décisions techniques prises

- **Q4** : plutôt que router les 8 formatteurs euro vers `formaterEuros` (qui a un 3ᵉ format adaptatif et renvoie `''` pour 0 — ce qui aurait changé l'affichage), on a ajouté deux variantes qui répliquent **exactement** les formats inline. Réconcilie « passer par le helper » et « affichage identique ».
- **Q2** : forme **longue** retenue comme canonique pour la visibilité Décider (déjà utilisée par la page publique et le formulaire de création ; seule la console admin, secondaire, est harmonisée).
- **Helpers « musée »** : `lib/iban.ts` est désormais câblé (Q5). `lib/siret.ts` et `lib/distance-gps.ts` restent testés mais non branchés : **signalés pour arbitrage** (les câbler à un usage réel ou les retirer) — laissés en place, non supprimés.

## Tests

- Unitaires : **1027 verts** (`npx vitest run`), dont +6 nouveaux tests d'équivalence sur `formaterEurosEntier`/`formaterEurosDecimales` (`tests/unit/format-euros.test.ts`).
- Typecheck TypeScript strict : vert (`npm run typecheck`), zéro `any` ajouté.
- Lint Biome : 18 warnings **préexistants** (non liés, `useExhaustiveDependencies` sur l'éditeur TipTap), zéro nouveau ; fichiers touchés propres.
- Build Next.js : vert (`npm run build`).
- E2E Playwright : non relancé cette session (changements unitaires + build couvrant ; aucun flux modifié dans son comportement).

## Notes pour les chantiers suivants

- **Aucune migration ajoutée** : la liste des migrations en attente de Phase M est inchangée (D1 `compter_membres_actifs`, C5 `afficher_nom`, C13/C15 chantier B, C14 snapshot, D5 frais de port, `personne_wallet_t99cp`, index C28).
- Le helper `walletVendeureuse` repose sur la dégradation propre : à la Phase M, une fois `personne.wallet_t99cp` poussée au distant, le wallet s'affichera automatiquement sans changement de code.
- `V2/` reste à ranger manuellement (verrou Windows). `S3` (révoquer `SUPABASE_ACCESS_TOKEN`) reste une action Lilou/Ben.
