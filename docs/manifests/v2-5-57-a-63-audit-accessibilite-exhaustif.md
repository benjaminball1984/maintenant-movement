# Manifest — Phase V2.5, Chantiers V2.5.57 → V2.5.63 : audit d'accessibilité exhaustif

**Date de fin** : 2026-05-29
**Branche** : main
**Commits** : `3a5f515` (lot 1), `ccca862` (lot 2), `eb46b45` (lot 3), `9817b73` (lot 4), `03f6996` (lot 5), `e2ff26c` (lot 6), `38f6edd` (lot 7) + commits de suivi.
**Durée approximative** : 1 longue session Claude Code.

## Objet

Audit d'accessibilité (WCAG 2.1 AA) **exhaustif** de tout le site (156 pages,
7 layouts, 134 composants), avec exigence forte : utilisabilité au lecteur
d'écran + clavier seul par un·e **admin / membre malvoyant·e** (toute la
console admin, tous les dashboards, tous les backends). Revue de code +
corrections, **sans nouvelle dépendance**, **sans régression** (lint /
typecheck / 1005 tests verts après chaque lot).

Méthode : revue manuelle des fondations + balayage par 10 sous-agents
spécialisés couvrant 100 % des fichiers, puis corrections par lots vérifiés
(chaque constat d'agent revérifié dans le code avant correction). Le détail
exhaustif (constat par constat, fichier:ligne) est dans
`docs/audits/a11y-audit-2026-05-29.md`.

## Livré et fonctionnel

- [x] **LOT 1 — Lien d'évitement** : composant `LienEvitement` (Server,
  libellé CMS `a11y.lien_evitement`), câblé dans les 3 layouts à navigation
  + `id="contenu"`/`tabIndex={-1}` sur chaque `<main>`.
- [x] **LOT 2 — Éditeur rich text TipTap** (BLOQUANT) : `role="textbox"` +
  `aria-label` (prop `labelA11y`) + `aria-multiline` ; labels parlants sur
  les 6 usages ; texte alternatif demandé à l'insertion d'image ; bouton
  « Code » `aria-pressed` corrigé.
- [x] **LOT 3 — Champs de filtre/recherche** (BLOQUANT) : `aria-label`
  contextuel sur 9 pages admin national + recherche communes + recherche
  réseau.
- [x] **LOT 4 — Boutons de modération nommés** (BLOQUANT) : prop
  `libelleObjet` injectée en `aria-label`, répercutée depuis 11 pages
  appelantes ; textareas motif reliés.
- [x] **LOT 5 — Erreurs de formulaire reliées** : `aria-invalid` +
  `aria-describedby` sur les formulaires auth, profil, suppression, modale
  signature.
- [x] **LOT 6 — Annonces vocales** : régions live persistantes masquées
  (`aria-live`) sur ~23 composants (suivre, post, messagerie, réservations,
  participation, notifications, uploads, recherche admin, reversement, CMS,
  créations, invitation) ; `aria-pressed`/`aria-expanded`/`aria-busy` selon
  les cas.
- [x] **LOT 7 — Libellés humains** au lieu d'enum bruts (réservations,
  trésorerie, sondages, moments, médias, décider, mes-créations,
  signatures), avec fallback.
- [x] **LOT 8 — Données admin** : intitulés `sr-only` devant les valeurs
  nues (trésorerie, personnes) + `aria-label` titre+valeur sur les cartes de
  stats. Choix assumé : PAS de conversion en `<table>` (préserve le design
  en cartes responsive).
- [x] **LOT 9 — Divers** : `<Link><Button>` imbriqués corrigés ; hiérarchie
  de titres home ; média (alt/track/icône) ; OAuth groupes ; QR 2FA (clé
  textuelle visible + `role="img"`) ; HeaderProfilMenu (downgrade
  `role="menu"`) ; CartePost (`window.confirm` → confirmation inline).
- [x] **Bug fonctionnel corrigé** (au-delà de l'a11y) : la modale de
  signature de pétition n'a jamais bloqué le scroll de fond (un événement
  `show` inexistant était écouté) ; corrigé.
- [x] **LOT 10 — Détails** : `aria-hidden` sur les icônes décoratives (cartes
  + pages détail) ; flèches `↓ → ` admin masquées ; `<dl>` sans `<dt>`
  corrigés (5 cartes) ; Avatar double nom ; emoji 👋 dashboard.

## Non livré (et pourquoi)

- [ ] **Flèches `←` des liens « retour » portées par des valeurs CMS**
  (`FALLBACKS.retour`, ~15 pages) : lues « flèche gauche » avant le texte
  descriptif. MINEUR, non corrigé : le caractère fait partie de la chaîne
  CMS éditable ; le corriger proprement (retirer du défaut + span
  `aria-hidden` dans chaque fichier) est tédieux pour un bruit minime.
  Documenté comme résidu accepté dans l'audit.

## Décisions techniques prises

- **Régions live** : `aria-live="polite"` + `aria-atomic="true"` sur un
  `<span sr-only>` persistant, JAMAIS `role="status"`/`role="alert"` sur un
  `<div>` (refusé par la règle biome `useSemanticElements`, qui a fait
  échouer un commit ; basculé sur `aria-live`).
- **Données tabulaires** : approche additive (intitulés `sr-only`) plutôt que
  conversion en `<table>`, pour ne pas casser le design responsive en cartes.
- **Menu profil** : downgrade `role="menu"` → liste de liens (Tab natif)
  plutôt qu'implémenter un pattern menu ARIA complet (flèches/focus) jugé
  risqué.

## Tests

- Unitaires : 1005 tests verts (`npm test`) à chaque lot.
- Lint (biome) + typecheck (tsc) : verts à chaque lot.
- Smoke test dev (Supabase local) : routes en 200 / 404 propre, zéro 500,
  zéro erreur de compilation.

## Notes pour les chantiers suivants

- Le document `docs/audits/a11y-audit-2026-05-29.md` reste la référence
  exhaustive (constat par constat, statut par statut).
- Pour aller plus loin : tests automatisés axe-core dans Playwright (refusé
  ici car « sans nouvelle dépendance »), et la finition des flèches CMS.
- Tout nouveau composant doit suivre les patterns posés ici : `IconButton`
  avec `aria-label`, région live `sr-only aria-live`, éditeur riche avec
  `labelA11y`, lien d'évitement déjà global.
