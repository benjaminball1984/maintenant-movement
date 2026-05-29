# Manifest groupé — Cycle V2.5.23 → V2.5.29 : rich text complet + logo officiel + hotfix CMS auth

**Date de fin** : 2026-05-29
**Branche** : `main`
**Commit final** : `96cacc7`
**Durée approximative** : ~3h sessions Claude Code.

## Objectif

Trois objectifs entrelacés, livrés en un cycle de 7 commits :

1. **Rich text généralisé sur toutes les zones éditables CMS** (Master Plan V2.6 demande explicite de Lilou/Ben : « tous les modes editables doivent pouvoir faire des couleurs, des polices, des tailles des styles, les modes articles doivent avoir toutes les possibilités d'un blog, insertion d'image, d'embeded code, etc etc et cela également pour les modes newsletter ou mail transactionnels »).
2. **Logo officiel intégré** dans le footer, les emails, les pages adhésion / inscription / connexion / vérification (logo poing levé + coquelicot, fourni par Lilou/Ben le 2026-05-29).
3. **Hotfix critical** : la Server Action d'édition CMS bloquait Lilou/Ben sur le distant parce que le RPC `peut_editer_cms` (migration V2.5.15) n'avait jamais été appliqué au distant (Master Plan local strict).

## Livré

### V2.5.23 — Fondations rich text + fix hydration button (commit `7b6a5fa`)

- [x] **Migration `supabase/migrations/20260530500000_contenu_editorial_html.sql`** : ajoute la colonne `valeur_html text` nullable à `contenu_editorial`. Strictement additive (doctrine de greffe §0.3). Quand renseignée, prend le pas sur `valeur_md` à l'affichage.
- [x] **`lib/rich-text/sanitize.ts`** : `sanitizeRichHtml(html)` avec allowlist stricte sanitize-html (balises p/h1-4/blockquote/ul/ol/li/strong/em/u/s/a/img/iframe/span/figure/figcaption/table, CSS color/background-color/font-size/font-family/font-weight/font-style/text-align/text-decoration/text-transform/line-height/letter-spacing, iframes filtrées par hostname YouTube/Vimeo/Spotify/SoundCloud/PeerTube, refus de `javascript:` / `data:` pour les liens, force `noopener noreferrer` sur `target=_blank`). Server-only (sanitize-html dépend de htmlparser2 non bundlable client).
- [x] **`components/rich-text/EditeurRiche.tsx`** : TipTap pur (StarterKit + Underline + TextStyle + Color + Link + Image + TextAlign + Youtube + Placeholder). `immediatelyRender=false` pour SSR.
- [x] **`components/rich-text/BarreOutilsRiche.tsx`** : toolbar complète (niveaux P/H1/H2/H3, gras/italique/souligné/barré, palette 12 couleurs brand+standard, listes/citation/code, alignement gauche/centre/droite/justifié, lien/image/YouTube, undo/redo).
- [x] **`components/rich-text/EditeurRicheAvecToolbar.tsx`** : combinaison pour les formulaires admin.
- [x] **`components/rich-text/RenduRiche.tsx`** : Server Component pour l'affichage côté visiteur. Injecte via `dangerouslySetInnerHTML` (HTML déjà sanitizé au save). Fallback `MarkdownLeger` sur `valeur_md` si pas de HTML riche.
- [x] **`app/actions/contenu-editorial.ts`** : schema Zod étendu avec `valeurHtml` optionnel (max 200_000 chars), sanitize avant upsert.
- [x] **`lib/contenu-editorial.ts`** : interface `ContenuEditorial` enrichie, `lireContenuEditorial` retourne `valeurHtml`.
- [x] **Fix bonus** : `BoutonEditerInline` passe de `<button>` à `<span role="button">` + `tabIndex=0` + gestion clavier Enter/Space. Résout l'erreur d'hydration `button-dans-button` que produisait l'usage de `TexteEditableAdmin` à l'intérieur du `<button>` déclencheur de `ModaleSignaturePetition` (HTML interdit cette imbrication).

### V2.5.24 — Logo officiel intégré (commit `733befc`)

- [x] **Logo `public/logo/maintenant.png`** : 1 Mo PNG bitmap, qualité native conservée pour les écrans haute densité.
- [x] **`components/layout/Footer.tsx`** : remplace le wordmark texte dégradé par le logo (128–144 px, `next/image` priority, wrappé en `Link` vers la home).
- [x] **`lib/email/gabarit.ts`** : ajoute le logo dans le bandeau identitaire des emails (120 px, URL absolue obligatoire pour les clients mail, `display:block` pour éviter l'espace blanc Gmail/Outlook).
- [x] **`app/(auth)/layout.tsx`** : ajoute le logo dans le header (40 px à côté du wordmark texte) ET en grand format (96 px) au-dessus du contenu central. Première chose vue par les nouvelles personnes via inscription / connexion / vérification email.
- [x] **`app/(public)/agir/adherer/page.tsx`** : ajoute le logo en bandeau d'entrée (80–96 px, à gauche du titre « Adhérer »). Cohérence identitaire sur la page passerelle vers l'adhésion.

**Décision explicite** : le logo n'est PAS dans le header public principal. Le header reste le menu de navigation, le wordmark gradient continue d'y figurer (Master Plan §B).

### V2.5.25 — Rich text branché sur PageEditorialeCMS + emails + hotfix CMS auth (commit `54c0dc9`)

- [x] **`components/contenu/ContenuEditableAdmin.tsx`** : refonte avec switch 2 modes (Markdown / Riche). Mode Riche pré-rempli si `valeurHtmlInitiale` existe. La sauvegarde envoie seulement le champ édité, l'autre est préservé côté serveur.
- [x] **`components/contenu/PageEditorialeCMS.tsx`** : propage `valeurHtmlInitiale` à `ContenuEditableAdmin` pour activer le rendu HTML riche côté visiteur sur les 10 pages éditoriales (Doctrine, Commune libre, Assemblée confédérale, FAQ, Monnaie, Ressources, À propos, Mentions légales, Confidentialité, Contact).
- [x] **`lib/email-templates.ts`** : `envoyerEmailTemplee` lit prioritairement `valeur_html` de la clé `email.{type}.html`. Permet aux admins de styler les emails via la console CMS sans toucher au code.
- [x] **Hotfix `app/actions/contenu-editorial.ts`** : si l'appel à `peut_editer_cms` retourne une erreur (RPC inexistant sur le distant), fallback gracieux sur `est_admin_general`. Restaure le droit d'édition CMS pour les admins généraux sur le distant en attendant la migration V2.5.15.
- [x] **Mises à jour partielles** : la Server Action lit l'existant pour ne pas écraser `valeur_md` quand on n'édite que `valeur_html` (et inversement). L'upsert reste atomique.

### V2.5.26 — Mode rich text dans la console CMS admin (commit `5188d76`)

- [x] **`components/contenu/EditeurInlineCMS.tsx`** : ajoute le switch Riche/Markdown. Mode par défaut Riche si `valeurHtml` existe, sinon Markdown. Particulièrement utile pour éditer les corps d'emails (`email.{type}.html`) sans coller du HTML brut à la main.
- [x] **`components/contenu/ConsoleContenusCMS.tsx`** : `ContenuListe` gagne `valeurHtml` optionnel, propage à `EditeurInlineCMS`.
- [x] **`app/admin/national/contenus/page.tsx`** : récupère `valeur_html` depuis Supabase (cast défensif si la colonne n'existe pas encore sur le distant — Master Plan local strict).

### V2.5.27 — Templates email réseau (sous-chantier V2.5.16.d) (commit `efc9d70`)

- [x] **`lib/email-templates.ts`** : `TypeEmail` étendu avec `reseau_message_recu` / `reseau_post_commente` / `reseau_post_soutenu`. Templates par défaut fournis (sujet + html + texte), toujours surchargeables CMS.
- [x] **`app/admin/national/emails-preview/page.tsx`** : 3 nouvelles previews iframe (message, commentaire, soutien) pour visualiser le rendu avec le gabarit identitaire.
- **Décision anti-spam** : les templates sont définis et previewables MAIS pas appelés automatiquement par les Server Actions du réseau. Un futur système de préférences utilisateurice (digest hebdo / opt-in par type) décidera quand basculer cloche → email.

### V2.5.28 — Tests sécurité sanitizeRichHtml (commit `526d9cd`)

- [x] **`tests/unit/rich-text-sanitize.test.ts`** : 18 tests couvrant 3 catégories :
  - **7 tests d'allowlist positive** : paragraphes/titres, gras/italique/souligné/barré, listes, liens http(s)/mailto, images http(s)/data:, iframes YouTube, styles CSS color/font-size.
  - **8 tests d'allowlist négative (vecteurs XSS)** : `<script>` supprimé, handlers `on*` supprimés, URL `javascript:`, `<object>`/`<embed>`, iframes hors hostname allowlistés, iframes sans src, styles `position:fixed` / `z-index`, force `noopener noreferrer` sur `target=_blank`, refuse `data:` pour `href`.
  - **3 tests sur `ressembleAduHtml`** (heuristique HTML vs Markdown).

### V2.5.29 — Mise à jour CLAUDE.md (commit `96cacc7`)

- [x] Section §11 État courant enrichie avec les chantiers V2.5.23–V2.5.28.

## Non livré (volontairement reporté)

- [ ] **Système de préférences notif réseau email** (digest hebdo / opt-in par type). Templates posés mais pas déclenchés. Demande : table `preference_notif_reseau(personne_id, type, mode)` avec modes `cloche` / `mail_immediat` / `digest_quotidien` / `digest_hebdo` + cron. ~2h. **V2.5.30.a**.
- [ ] **Migration assistée des contenus existants vers le mode riche**. Pour l'instant, les pages restent en Markdown jusqu'à ce qu'un admin clique sur « Éditer » et bascule sur Riche. Possibilité d'ajouter un bouton « Convertir Markdown → HTML riche » qui pré-remplit l'éditeur. ~30 min. **V2.5.30.b**.
- [ ] **Convertisseur Markdown → HTML pour le mode riche** : actuellement, basculer en mode Riche depuis un contenu Markdown existant repart d'une page vierge. Devrait pré-remplir avec la conversion HTML du Markdown actuel. ~20 min. **V2.5.30.c**.

## Décisions techniques

- **Séparation HTML / Markdown en colonnes** : préserve la doctrine de greffe (`valeur_md` reste source de vérité historique, `valeur_html` est additif). L'admin choisit. Le rendu visiteur priorise HTML riche.
- **Sanitization au SAVE, pas au RENDER** : sanitize-html est cher (parser). On paye 1 fois à l'enregistrement, jamais à la lecture. Le HTML en base est garanti propre.
- **iframe allowlist par hostname** : empêche `<iframe src="https://evil.com">` même si on garde la balise `iframe` pour YouTube/Vimeo. Allowlist = whitelist de domaines.
- **`<span role="button">` pour le bouton overlay d'édition** : HTML interdit `button > button`. Le span avec gestion clavier reste accessible et résout l'imbrication interdite.
- **Mises à jour partielles via lecture-puis-upsert** : Supabase `upsert` remplace tous les champs ; pour éviter d'écraser le champ qu'on n'édite pas (md ou html), on lit l'existant d'abord. Atomicité préservée par la séquence read → patch → upsert dans la même Server Action.
- **Hotfix par fallback gracieux** plutôt que par migration forcée : le distant Francfort ne doit pas être modifié sans `pg_dump` daté (Master Plan local strict jusqu'à Phase M). Le fallback permet d'utiliser le code V2.5+ sur le distant sans appliquer les migrations V2.5+.

## Tests

- **975 tests verts** (957 → 975, +18 sécurité sanitize).
- **Typecheck** vert.
- **Lint biome** propre.
- **HTTP 200** vérifié sur `/`, `/agir/adherer`, `/connexion`, `/mobiliser/petitions`, `/comprendre/doctrine`. Logo PNG servi en 1 Mo.

## Cas d'usage immédiats (vérifiables au navigateur)

1. **Footer / emails** : le logo poing levé + coquelicot apparaît partout.
2. **Pages éditoriales** : se connecter en admin → naviguer sur `/comprendre/doctrine` (ou autre) → survoler le contenu → cliquer sur « Modifier » → basculer sur « Mode riche » → écrire en couleurs/polices/listes/citations/lien/image/YouTube → enregistrer → revoir la page en visiteur, le HTML riche s'affiche.
3. **Console CMS** : `/admin/national/contenus` → chercher n'importe quelle clé → cliquer sur « Éditer ici » → bouton « Riche » dans la barre → éditer → enregistrer. Aussi possible sur les clés `email.{type}.html` pour styler un email sans toucher au code.
4. **Preview emails** : `/admin/national/emails-preview` montre 6 templates (RGPD export / RGPD suppression / adhésion relance + 3 nouveaux réseau) dans des iframes.
5. **Auth** : visiter `/connexion` ou `/inscription` → logo en grand au-dessus du formulaire + petit dans le header.

## Notes pour les chantiers suivants

- La colonne `valeur_html` doit être appliquée au distant via `supabase db push` quand la Phase M sera ouverte (avec les autres migrations en attente).
- Le fallback `est_admin_general` dans la Server Action peut être retiré une fois la migration `20260530300000_droit_admin_cms.sql` appliquée au distant.
- Pour activer les emails de notification réseau, créer la table `preference_notif_reseau` et brancher dans les Server Actions du réseau social (V2.5.30.a).
