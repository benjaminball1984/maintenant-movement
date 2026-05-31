# Revue 2026 — Bloc 3 : Responsivité + UX + complétude fonctionnelle

> Deux audits parallèles (responsivité mobile→desktop ; UX et règle d'exhaustivité §4). Preuves fichier:ligne.

## Synthèse

- **Responsivité : BONNE et systématique.** Aucun `<table>` HTML brut (listes admin en `Card`/grilles), aucune `grid-cols-N` sans variante responsive, aucune largeur fixe px problématique, `next/image` partout avec `sizes` mobile-first, cible tactile 44px sur `Button`/`IconButton` taille `md`. Un seul vrai trou : les modales `<dialog>` n'ont pas de scroll interne.
- **UX / complétude : REMARQUABLE.** Sur 161 pages, 31 formulaires : **aucun bouton sans action, aucun `href="#"`, aucun stub non déclaré, aucun TODO/lorem visible, aucun `console.log` ni `alert()` en place d'action.** États vide / erreur-formulaire / succès gérés, CMS-éditables, en français sobre. Seul écart net à §4 : pas de frontières d'erreur ni d'états de chargement au niveau routing.

---

## 1. Responsivité

| Sévérité | Problème | Fichier:ligne | Correctif |
|---|---|---|---|
| **Haute** | Modale de signature `<dialog>` sans hauteur max ni scroll : sur mobile court (clavier ouvert) le bas du formulaire + bouton « Signer » passent sous le pli, non scrollables. | `components/modales/ModaleSignaturePetition.tsx:199` | `max-h-[90dvh] overflow-y-auto` sur la `<dialog>` (dvh pour la barre d'URL mobile). |
| Moyenne | Même absence de scroll sur la modale message. | `components/reseau/ModaleMessage.tsx` (`<dialog>`) | Idem `max-h-[90dvh] overflow-y-auto`. |
| Basse | UUID en `<code>` dans une grille `sm:grid-cols-[auto_1fr_auto]` sans `min-w-0` : un id long peut élargir la carte au-delà de `sm`. | `app/admin/national/personnes/page.tsx:177,183` | `min-w-0` sur le div + `break-all` sur le `<code>` (déjà fait ailleurs). |
| Basse | Boutons taille `sm` = `h-9`/`h-9 w-9` (36px), sous 44px. | `components/ui/IconButton.tsx:18`, `Button.tsx:42` | Acceptable en contexte dense/admin ; éviter `taille="sm"` pour les actions tactiles publiques primaires. |
| Basse | Nav mobile = strip horizontal scrollable sans indicateur d'overflow (pas de burger). | `components/layout/Header.tsx:124-141` | Optionnel : masque dégradé en bord droit, ou menu burger si +d'espaces. |

**Bonnes pratiques à préserver** : grilles `grid gap-N sm:grid-cols-2 lg:grid-cols-3` partout ; conteneurs `mx-auto max-w-Nxl px-4 sm:px-6 lg:px-8` ; images `relative aspect-[16/9] w-full` + `<Image fill sizes=…>` ; `min-w-0 flex-1` + `truncate`/`break-words` là où il faut ; `flex flex-wrap` sur les barres de chips ; modales pleine largeur mobile plafonnées desktop ; titres `text-4xl md:text-5xl` ; carte MapLibre `h-[60vh] min-h-[400px] sm:h-[70vh]`.

## 2. UX / complétude fonctionnelle

| Sévérité | Problème | Fichier:ligne | Correctif |
|---|---|---|---|
| **Haute** | Aucun `error.tsx` ni `global-error.tsx` dans toute l'app : une exception serveur non interceptée tombe sur l'écran d'erreur React générique non stylé. | `app/**` (0 fichier) | Ajouter `app/error.tsx` (Client, bouton « Réessayer » via `reset()`) + `app/global-error.tsx` ; idéalement aussi sous `(membre)/profil/` et `admin/`. |
| Moyenne | Aucun `loading.tsx` ni `<Suspense>` : navigations vers pages lourdes (ex. `Promise.all` de 9 requêtes) bloquées sans squelette. Le composant `Skeleton` (V2.4.85) existe mais n'est utilisé nulle part. | `app/**` (0 `loading.tsx`) | `app/loading.tsx` global + `loading.tsx` ciblés (`mobiliser/`, `s-entraider/`, `communes/`, `recherche/`) réutilisant `SkeletonCarte`. |
| Basse | `/design-system` (showcase dev) accessible publiquement en prod. | `app/design-system/page.tsx:14` | Derrière `estAdminCourant()` ou `NODE_ENV !== 'production'`. |
| Basse | `dons/retour` état « paramètres manquants » : titre nu sans `<Alert>` ni lien retour (incohérent avec les 2 autres états). | `app/(public)/dons/retour/page.tsx:35-44` | `<Alert variant="warning">` + `<Link>` vers `/mobiliser/cagnottes`. |
| Basse (info) | `FormulaireCommentaire` et `FormulairePosterMessage` sans `zodResolver` (27 autres l'ont). | `components/commentaires/FormulaireCommentaire.tsx`, `components/fil-groupe/FormulairePosterMessage.tsx` | Optionnel : aligner sur Zod. |

**Stubs honnêtes déclarés (pas des bugs)** : Maintenant Radio (bannière explicite tant que flux AzuraCast absent, player prêt) ; pages éditoriales à `[TEXTE À FAIRE]` (convention §3, CMS-éditable — à remplir côté contenu) ; pré-remplissage tunnel post-signature (reporté, dépend du flux email). Aucun chantier 7.3/7.6 résiduel.

**Points forts** : 78 pages à état vide explicite ; `not-found.tsx` + 26 `notFound()` ; 27/29 formulaires Zod+RHF, 31/31 gèrent l'état d'envoi + erreurs par champ ; Server Actions `{ok:false,message}` (zéro `throw` non maîtrisé) ; tunnels post-signature et post-don présents ; microcopy FR sobre, CMS-éditable ; auth-gating via `/connexion?prochaine=`.

---

## Correctifs ajoutés à la liste (suite de 02-conformite.md)

- **C18 (P0, Haute)** : scroll interne des modales `<dialog>` (`max-h-[90dvh] overflow-y-auto`) — signature + message. *(local, 2 lignes, fort impact mobile)*
- **C19 (P1, Haute)** : `app/error.tsx` + `app/global-error.tsx` (+ profil/admin). *(local)*
- **C20 (P1, Moyenne)** : `app/loading.tsx` global + espaces lourds, réutilisant `Skeleton`. *(local)*
- **C21 (P2)** : UUID admin `min-w-0`/`break-all` (personnes). *(local)*
- **C22 (P2)** : `/design-system` derrière admin/NODE_ENV. *(local)*
- **C23 (P2)** : `dons/retour` params-manquants → Alert + lien. *(local)*
- **C24 (P3 opt)** : 2 formulaires → zodResolver. *(local)*

*Fin du Bloc 3. Suivent Bloc 4 (accessibilité) et Bloc 5 (performance/scalabilité).*
