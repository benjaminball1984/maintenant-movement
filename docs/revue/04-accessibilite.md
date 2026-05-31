# Revue 2026 — Bloc 4 : Accessibilité (WCAG 2.1 AA), delta depuis l'audit du 2026-05-29

> L'audit exhaustif `docs/audits/a11y-audit-2026-05-29.md` (cycle V2.5.57-63) **tient toujours** : tous ses correctifs sont intacts. Ce bloc vérifie la tenue + repère les régressions introduites par le code V2.6 (organisations, home « une », images démo, double affichage 99-coin).

## Synthèse

Bonne tenue générale. Le nouveau code V2.6 suit majoritairement les patterns posés par l'audit (`useId` + label `sr-only`, `aria-invalid`/`aria-describedby`, régions `sr-only aria-live`, `Heading niveau/apparenceComme`). Les images démo/cartes sont toutes `alt=""` (décoratives, titre adjacent) ou `alt={nom}` (avatars) : aucune régression d'alternative, aucun texte sur image. Découverte favorable : `components/ui/Alert.tsx` porte `role="status"`/`role="alert"` natif → tous les Alert dynamiques V2.6 sont annoncés automatiquement. Régressions réelles : peu et localisées (surtout un anti-pattern `<Link><Button>` réintroduit, et le standard admin `libelleObjet` non propagé aux nouvelles consoles).

## Problèmes par sévérité

| Sévérité | WCAG | Problème | Fichier:ligne | Correctif |
|---|---|---|---|---|
| **Sérieux** | 4.1.1 / 1.3.1 | `<Link href><Button>` imbriqués (`<a>` contenant `<button>`, HTML invalide, double tabstop). **Régression V2.6.** | `app/(public)/organisations/page.tsx:47-49` | `<Link>` stylisé en bouton (cf. CTA `UneSection:122-131`) ou `Button asChild`. |
| Sérieux | 4.1.1 / 1.3.1 | Même anti-pattern (pré-existant) sur le profil réseau (« Modifier mon profil », « Se connecter »). | `app/(public)/s-informer/reseau/[numero]/page.tsx:96-97,112-113` | Idem. |
| Moyen | 2.4.6 / 4.1.2 | Console admin organisations : « Accepter »/« Refuser »/« Accorder le badge »/« Retirer le badge » sans nom d'objet dans le nom accessible (pattern `libelleObjet` du LOT 4 non appliqué). | `app/admin/national/organisations/ConsoleOrganisationsAdmin.tsx:73-95,132-143` | `aria-label` incluant le nom de l'organisation. |
| Moyen | 4.1.2 / 2.4.4 | `PanneauGestionOrganisation` : « Retirer » un·e gestionnaire sans son nom. | `app/(public)/organisations/[slug]/PanneauGestionOrganisation.tsx:176-182` | `aria-label={`Retirer ${g.nom} de la gestion`}`. |
| Mineur | 4.1.3 | Toggles optimistes V2.6 sans annonce vocale (`BoutonMettreALaUne`, bascule badge). | `components/home/BoutonMettreALaUne.tsx:43-61` ; `PanneauGestionOrganisation.tsx:93-96` | `<span class="sr-only" aria-live="polite">` post-action (cf. `BoutonAmitie.tsx:129`). |
| Mineur | 1.3.1 / 4.1.2 | `CartePost` : `<Textarea>` commentaire avec `placeholder` seul, sans label/`aria-label`. | `components/reseau/CartePost.tsx:227-233` | `aria-label="Écrire un commentaire"`. |
| Mineur | 4.1.2 | `BadgeCheck` « officielle » : incohérence `role`/`aria-hidden` selon contexte (texte adjacent ou non). | `components/organisations/BlocOrganisationPorteuse.tsx:44-51` | `role="img"` quand l'icône est seule. |
| Mineur (résidu accepté) | 1.1.1 | Flèches `←`/`→` dans des libellés de lien (lues « flèche gauche/droite »). Résidu CMS déjà accepté par l'audit ; V2.6 en a ajouté quelques-unes. | `organisations/[slug]/page.tsx:79` ; `home/UneSection.tsx:95,101` ; `UneArticle/UneCagnotte` ; `CarteUnifiee.tsx:234` | Non bloquant ; à traiter au nettoyage global des flèches. |

## Régressions V2.6
1. `<Link><Button>` réintroduit (`organisations/page.tsx:47`) — seul vrai retour en arrière sur un correctif d'audit.
2. Pattern `libelleObjet` (LOT 4) non hérité par la console admin organisations + panneau gestionnaires.
3. Pattern `sr-only aria-live` (LOT 6) oublié sur 2 toggles optimistes hors-Alert.

Aucune régression sur contrastes (tokens réutilisés), images (alt corrects), landmarks, `<h1>` unique, `prefers-reduced-motion`.

## Déjà conforme (à préserver)
Composants commentaires V2.6 exemplaires (`useId`, label sr-only, `aria-invalid`/`describedby`, `sr-only aria-live`, `<time dateTime>`) ; `BoutonAmitie` (toggle + aria-live) ; `Alert` (`role` natif) ; `Heading` (sémantique ≠ apparence) ; `Avatar`/`AvatarReseau` (`role="img"`/`alt=""` cohérents) ; cartes images `alt=""` + titre adjacent + `<dl>/<dt sr-only>` ; formulaires organisations (labels associés) ; `CarteUnifiee` (marqueurs `<button aria-label>`, `<fieldset><legend>`) ; `PlayerAzuraCast` (contrôles nommés) ; `CartePost` (aria-pressed/expanded/controls).

## Correctifs ajoutés
- **C25 (P1)** : supprimer `<Link><Button>` imbriqués (organisations/page.tsx:47 ; reseau/[numero]:96,112). *(local)*
- **C26 (P2)** : `aria-label` par objet sur console admin organisations + panneau gestionnaires. *(local)*
- **C27 (P2)** : `aria-live` sur toggles optimistes (BoutonMettreALaUne, badge) ; `aria-label` Textarea CartePost ; `role="img"` BadgeCheck seul. *(local)*

*Fin du Bloc 4.*
