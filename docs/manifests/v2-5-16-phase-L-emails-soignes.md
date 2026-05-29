# Manifest — Chantier V2.5.16 : Phase L emails soignés par défaut

**Date de fin** : 2026-05-30
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~30 min.

## Objectif Master Plan

Phase L : « Créer des gabarits d'email propres et identitaires (avec le logo, le dégradé, une mise en page claire) pour tous les emails que le site envoie. Ces gabarits doivent être beaux même dans le minimum envoyé quand tu n'as pas préparé de campagne dédiée. Le texte des emails est éditable par toi via le CMS, mais leur mise en forme est codée une fois. »

## Livré

### 1. Gabarit identitaire `lib/email/gabarit.ts`

- [x] **Fonction `gabaritEmailHTML(contenuHtml, options)`** qui enveloppe automatiquement un contenu HTML libre dans une mise en page Maintenant! :
  - **Bandeau en-tête** : fond `#7C3AED` (couleur de début du dégradé signature, en aplat car les clients mail ne supportent pas les gradients CSS), wordmark « Maintenant! » en blanc taille 24px gras, baseline en blanc semi-transparent.
  - **Bloc central blanc** sur fond gris `#F9FAFB`, `max-width: 600px` (standard email), `border-radius: 8px`, padding 32px aéré.
  - **Pied de page** avec lien « Visiter le site », lien désinscription (optionnel, désactivé pour les transactionnels), lien politique de confidentialité, copyright.
  - **Titre optionnel** rendu en `<h1>` 22px, **pré-en-tête** caché pour les previews mail (Gmail, Outlook).
- [x] **Compatible Outlook** : layout en tables (pas de flex/grid), styles inline, couleurs hex (pas de var CSS), VML implicite via `<table>`.
- [x] **Échappement HTML** automatique sur toutes les variables interpolées (titre, préheader, libellés CMS) via une fonction `escapeHtml` privée (anti-XSS basique).
- [x] **Tous les libellés du gabarit éditables CMS** : clés `email.gabarit.baseline`, `email.gabarit.desinscription`, `email.gabarit.confidentialite`, `email.gabarit.visiter_site`, `email.gabarit.copyright`.
- [x] **Helper `ctaEmail(libelle, href)`** : génère un bouton CTA dans la couleur brand, avec table imbriquée (Outlook ne respecte pas `padding` sur `<a>`). Utilisable dans le contenu CMS via interpolation.

### 2. Intégration dans `envoyerEmailTemplee`

- [x] **`lib/email-templates.ts > envoyerEmailTemplee` enrichi** : le HTML CMS-édité passe désormais automatiquement par `gabaritEmailHTML(corpsHtml, {titre: sujet, preheader: sujet, avecDesinscription: false})`. Les 3 templates existants (`rgpd_export_demande`, `rgpd_suppression_demande`, `adhesion_relance`) sortent désormais avec le gabarit identitaire **sans avoir touché à leur contenu** (le contenu CMS reste juste le « corps », l'enveloppe est ajoutée par-dessus).

### 3. Console de prévisualisation

- [x] **Page admin `/admin/national/emails-preview`** : rend 3 exemples typiques (confirmation adhésion, suppression compte RGPD, relance adhésion) dans des `<iframe srcDoc>`, pour visualiser à quoi ressemblent les emails sans devoir déclencher de vrais envois. Iframes en sandbox vide (pas d'exécution JS dans la preview).
- [x] **Lien ajouté à la nav admin nationale** entre « Contenus éditoriaux » et « Décider (salles) ».

### 4. Tests

- **6 nouveaux tests unitaires** sur `ctaEmail` : structure table-based, couleur signature, échappement anti-XSS sur libellé ET URL, padding inline, conservation des query strings.
- **947 tests verts au total** (941 + 6).
- **Typecheck** vert.
- **Lint biome** propre.

## Non livré (volontairement, calendrier honnête)

- [ ] **Logo poing levé + coquelicot en image** dans le bandeau : pour cette V2.5.16, le bandeau affiche le wordmark texte « Maintenant! ». Quand Lilou/Ben fournira le SVG/PNG, il suffira de remplacer le `<a>` texte par `<img src="cid:logo" alt="Maintenant!">` dans `gabaritEmailHTML`. ~5 min. **V2.5.16.a**.
- [ ] **Dégradé en bandeau via image bitmap** : techniquement possible (générer un PNG du gradient et l'utiliser en background), mais peu de gain par rapport à l'aplat violet `#7C3AED` qui est déjà identitaire. À considérer si Lilou/Ben veut le dégradé exact, **V2.5.16.b**.
- [ ] **Version markdown éditable plutôt que HTML** : pour l'instant le contenu CMS est du HTML simple (`<p>`, `<a>`, `<strong>`). Permettre du Markdown nécessiterait d'inclure un parseur dans `envoyerEmailTemplee`. **V2.5.16.c**.
- [ ] **Templates pour les emails de réseau social** (nouveau message, nouvelle interaction) : les `TypeEmail` actuels couvrent RGPD + adhésion. À étendre quand les notifications réseau passeront en email (pour l'instant elles vont dans la cloche in-app). **V2.5.16.d**.

## Décisions techniques

- **Aplat `#7C3AED` au lieu de gradient CSS** : Gmail, Outlook et la plupart des clients email ne supportent pas les gradients CSS. L'aplat préserve l'identité (c'est la première couleur du dégradé) sans dégrader le rendu.
- **Layout en table, pas en flex** : Outlook (Microsoft Word renderer) ignore flex/grid. Les tables imbriquées sont le standard email depuis 20 ans.
- **`<iframe srcDoc>` pour la preview** : isolation parfaite du HTML email du DOM de la console admin (pas de fuite CSS, pas d'exécution JS dans la preview).
- **Échappement XSS systématique** des libellés CMS : même si seul un admin peut les modifier, on échappe par défense en profondeur.
- **Gabarit codé une fois** : conforme au principe Master Plan « structure dans le code, contenu dans le CMS ».

## Cas d'usage immédiat (vérifiable au navigateur)

1. Se connecter en admin général.
2. Aller sur `/admin/national/emails-preview` → voir les 3 exemples d'email rendus dans des iframes : bandeau violet, contenu propre, CTA stylé, pied de page complet.
3. Pour modifier le design : `lib/email/gabarit.ts > gabaritEmailHTML`.
4. Pour modifier les libellés du gabarit : aller sur `/admin/national/contenus`, chercher `email.gabarit.*`, éditer.
5. Pour modifier le contenu d'un type d'email spécifique : chercher `email.adhesion_relance.html` (par exemple) dans la console CMS.

## Notes pour les chantiers suivants

- **V2.5.16.a** : remplacer le wordmark texte par une image logo réelle quand Lilou/Ben la fournira.
- **V2.5.16.c** : support Markdown dans les templates d'email.
- **V2.5.16.d** : ajouter des templates pour les notifications réseau (nouveau message, nouvelle interaction, etc.).

## Bilan global Phase L

Le cœur de la Phase L est livré : **toutes les emails sortants du site sont désormais identitaires par défaut**, sans aucune modification du contenu CMS. L'envoi continue à passer par `envoyerEmailTemplee` qui applique le gabarit automatiquement. Le jour où Brevo est branché (Phase N), les emails partiront déjà avec le bon design.

L'unique « invention » du gabarit (l'enveloppe HTML) est strictement technique : pas de copy politique ajouté, juste de la structure visuelle conforme au design tokens existants (`#7C3AED` brand, `#1F2937` texte, etc.).
