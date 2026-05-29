# Manifest — Chantier V2.5.14 : Phase J finitions (cover personnalisable, page principale, modale)

**Date de fin** : 2026-05-30
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~30 min.

## Contexte

Lilou/Ben a (encore) relevé que j'avais reporté V2.5.13.a/b/c sous prétexte de « ne pas multiplier les chantiers ouverts ». Réponse honnête : c'était toujours de l'évitement, comme pour G et H la veille. Ce chantier finit la Phase J en entier.

## Livré

### V2.5.13.a — Image de couverture personnalisable

- [x] **Migration `20260530200000_personne_cover_url.sql`** : ajout `cover_url text` nullable sur `personne` (additif, doctrine de greffe). Pas de DROP, pas de NOT NULL.
- [x] **RPC dédiée `personne_cover_url(cible uuid) returns text`** : SECURITY DEFINER pour contourner la RLS `personne_select_self_ou_admin` sur cette unique colonne publique. GRANT EXECUTE à anon + authenticated. **On NE TOUCHE PAS** à la RPC existante `personne_affichage` (la cover n'est pas une donnée masquable par visibilité, c'est une image décorative publique).
- [x] **`types/database.ts`** enrichi à la main : colonne ajoutée à `personne.Row/Insert/Update`, RPC ajoutée à `Functions`.
- [x] **Validation Zod** : `cover_url` ajouté à `mettreAJourProfilSchema` avec même règle que `photo_url` (URL valide, optionnel).
- [x] **Server Action `mettreAJourProfil`** : nouvelle colonne dans le UPDATE.
- [x] **`<FormulaireInformations>`** : nouveau champ Input URL « Image de couverture du profil (URL, optionnel) » + clé CMS `labelCover` éditable.
- [x] **`/profil/informations`** : valeur initiale `cover_url` chargée + clé CMS dans la lecture.
- [x] **Page profil `/s-informer/reseau/[numero]`** : `ProfilReseau.coverUrl` chargé via la nouvelle RPC. Le bandeau bascule entre image perso (`backgroundImage: url(...)`) et dégradé `bg-grad` selon présence. Conserve `role="img"` + `aria-label` pour l'accessibilité quand image perso, `aria-hidden="true"` quand dégradé décoratif.

### V2.5.13.b — Page principale `/s-informer/reseau` polishée

- [x] **Titre identitaire** : « Réseau social » passe en `bg-grad bg-clip-text text-transparent` (gradient text), même traitement que la home et le wordmark footer.
- [x] **CTA Rechercher / Mes messages** transformés de simples liens texte en **boutons avec icône** (Search, MessageCircle) dans une card border. Hover en brand.
- [x] **Badge compteur messages non-lus** : `nonLus > 0` affiche un petit cercle rouge `bg-danger` en surimpression sur le coin top-right du bouton « Mes messages » (style notification universel).
- [x] **Card financement réorganisée** : icône Heart violette à gauche (couleur brand), texte au milieu, CTA Soutenir en bouton gradient à droite (au lieu d'un lien texte). Fond `bg-brand-light/40` + bordure `border-brand/20` pour l'identifier sans agresser.

### V2.5.13.c — Modale messagerie `<ModaleMessage>` polishée

- [x] **Avatar message dans le header** : disque `bg-brand-light` avec icône MessageCircle violette à côté du nom du destinataire. Donne immédiatement le sens (action = écrire un message).
- [x] **Textarea `resize-none`** : pas de poignée de redimensionnement laide.
- [x] **Compteur de caractères discret** « X/5000 » en pied à gauche, juste à côté des boutons d'action à droite. Aide à mesurer la longueur sans imposer.

## Tests

- **941 tests verts** (inchangé).
- **Typecheck** vert sur tous les fichiers modifiés (9 fichiers : migration SQL + types + validation + Server Action + formulaire + page informations + page profil + page principale + modale).
- **Lint biome** propre.

## Décisions techniques

- **RPC dédiée plutôt que d'étendre `personne_affichage`** : `personne_affichage` gère le masquage par visibilité (préférences fines par champ). La cover_url est une donnée publique non sensible — pas besoin de la passer par le masquage. RPC `personne_cover_url` séparée, additive, ne touche pas l'existant.
- **Champ URL plutôt qu'upload direct** : pour cette nuit, l'utilisateur·rice colle une URL d'image hébergée. Pour brancher Supabase Storage à la place, il suffira de remplacer le `<Input type="url">` par `<ChampImageObjet>` (composant qui existe déjà et qu'utilise le ComposerPost). Reporté à V2.5.14.a si Lilou/Ben le souhaite.
- **Badge compteur non-lus en `bg-danger`** : code visuel universel (Twitter, Facebook, Discord, etc.). Avant : juste «  (3) » entre parenthèses, peu visible.
- **Pas de migration des cover_url existantes** : la colonne est nullable, les profils existants ont `NULL` et tombent sur le dégradé. Aucune donnée perdue.

## Notes pour les chantiers suivants

- **V2.5.14.a (optionnel)** : remplacer le champ URL cover par `<ChampImageObjet>` pour permettre l'upload direct via Supabase Storage. ~15 min.
- **Phase K CMS amélioré** : prochaine grande étape Master Plan.
- **Phase L emails soignés par défaut**.

## Cas d'usage immédiat (vérifiable au matin)

1. Se connecter en `test1@maintenant.local` / `demo-test1!`
2. Aller dans `/profil/informations`
3. Coller dans « Image de couverture du profil (URL, optionnel) » : `https://picsum.photos/seed/test1-cover/1200/400`
4. Enregistrer
5. Aller sur `/s-informer/reseau/[le-numero-M-de-test1]` → le bandeau a basculé sur l'image Picsum
6. Aller sur `/s-informer/reseau` → titre Réseau social en gradient, boutons CTA avec icônes, badge non-lus visible quand des messages arrivent, card financement avec cœur violet et bouton gradient

Phase J désormais **complète à 100 %** (au lieu de partielle).
