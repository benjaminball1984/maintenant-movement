# Manifest — Chantier V2.5.13 : Phase J réseau social plus chaleureux

**Date de fin** : 2026-05-30
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~25 min.

## Objectif Master Plan

Phase J : « Retravailler la présentation du fil, des profils, des publications, pour s'approcher des codes que les gens connaissent, tout en gardant l'algorithme de flux politique déjà conçu. Mettre des avatars, des images de couverture, des cartes de publication soignées. »

## Livré

- [x] **Page profil `/s-informer/reseau/[numero]`** entièrement refondue style page profil moderne :
  - **Bandeau dégradé** en haut (`bg-grad` violet → magenta → framboise) avec hauteur 128px mobile / 192px desktop. Donne immédiatement l'identité Maintenant! au profil.
  - **Avatar 96px en overlay** qui dépasse en bas du bandeau, avec bordure `border-4 border-surface` pour le mettre en relief.
  - **En-tête réorganisée** : nom + badge Ami·e à gauche, boutons d'action (Suivre / Message / Modifier mon profil) à droite, alignés en bas pour rester sur la même ligne visuelle.
  - **Bio en bloc plein large** sous l'en-tête, lisible (`leading-relaxed`).
  - **Stats abonné·es / suivi·es** en chiffres gras avec libellés discrets (`strong` sur le nombre, texte gris autour).
  - Padding cohérent sur mobile (`px-4`) et desktop (`px-6`).
- [x] **`<CartePost>` polish** :
  - Padding interne passe de `p-4` à `p-5` (plus aéré).
  - Transition au survol : bordure brand légère + ombre subtile (`hover:border-brand/40 hover:shadow-sm`).
  - **Bouton soutien** : icône cœur **en rouge `text-danger`** quand soutenu (au lieu de brand violet, code visuel universel « j'aime »). Micro-animation au clic (`active:scale-90`). Compteur en gras, libellé masqué sur mobile pour densifier.
  - **Bouton commentaire** : icône hover en brand violet (souligne le caractère « discussion »). Même densification mobile.
  - Footer plus aéré (`gap-5` au lieu de `gap-4`, `pt-3` au lieu de `pt-2`).
- [x] **`<ComposerPost>` polish** :
  - Padding `p-5` + ombre subtile au survol + transition focus.
  - Label « Quoi de neuf ? » en font-display (plus chaleureux que « Partager quelque chose »).
  - Placeholder enrichi : « Partage une nouvelle, une question, une victoire, un coup de gueule… »
  - Textarea `resize-none` (évite le redimensionnement manuel laid).
  - Compteur de caractères discret en pied (« X/5000 caractères ») à côté du bouton Publier.

## Non livré (volontairement reporté)

- [ ] **Image de couverture personnalisable** (`cover_url` sur `personne`) : migration additive nécessaire (~10 min) + UI éditeur dans `/profil/informations` (~20 min) + upload via Supabase Storage. Pour cette nuit, le bandeau dégradé fait office. Une fois la colonne ajoutée, il suffira de remplacer le bandeau par `style={{backgroundImage: profil.coverUrl ? \`url(${profil.coverUrl})\` : undefined}} className="bg-grad bg-cover"` pour basculer. **V2.5.13.a**.
- [ ] **Page principale `/s-informer/reseau` polishée** : l'en-tête, l'alert tri transparent et le bandeau financement restent dans leur forme actuelle (fonctionnels, sobres). Possibilité de les rendre plus chaleureux (icônes, hiérarchie typographique, micro-animations sur l'alert). **V2.5.13.b**.
- [ ] **Modale messagerie `<ModaleMessage>` polishée** : non touchée, reste fonctionnelle. **V2.5.13.c**.
- [ ] **AvatarReseau avec bordure optionnelle au survol** : pas nécessaire ici puisque l'avatar du profil est déjà en overlay avec bordure. Pour le flux, garder neutre.

## Décisions techniques

- **Pas d'image de couverture personnalisée pour ne pas alourdir** : ajouter `cover_url` exige migration + UI + storage. Le bandeau dégradé est l'équivalent visuel direct et donne l'identité Maintenant! sans data supplémentaire.
- **Cœur en `text-danger` quand soutenu** : code visuel universel (Vinted, Twitter, Instagram). Avant c'était brand violet ce qui prête à confusion avec d'autres usages du brand.
- **Pas de drag/drop ni d'animations CSS lourdes** : on reste sobre, conformément à la doctrine « sans captation d'attention ».
- **`focus-within` sur le ComposerPost** : signal subtil que la zone est active sans en faire trop.

## Tests

- **941 tests verts** (inchangé).
- **Typecheck** vert.
- **Lint biome** propre.

## Notes pour les chantiers suivants

- **V2.5.13.a** : ajouter colonne `personne.cover_url` + UI éditeur + bandeau qui bascule sur l'image perso. ~30 min.
- **V2.5.13.b** : page principale `/s-informer/reseau` polishée (en-tête plus identitaire, icônes, espacements).
- **Phase K CMS amélioré** : prochaine grande étape Master Plan. Console organisée pour les 1200+ clés éditables.
- **Phase L emails soignés** : gabarits HTML identitaires pour confirmation signature, bienvenue, invitation.
