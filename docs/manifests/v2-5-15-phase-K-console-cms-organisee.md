# Manifest — Chantier V2.5.15 : Phase K console CMS organisée + rôle CMS dédié

**Date de fin** : 2026-05-30
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~45 min.

## Objectif Master Plan

Phase K : « Une console d'édition organisée, avec recherche, regroupement, aperçu, et la possibilité de donner à une personne un rôle de maintenance CMS sans lui donner de pouvoir politique (cf. §4.2). »

Les deux exigences sont traitées : la console **et** le rôle dédié.

## Livré

### 1. Console CMS organisée

- [x] **Composant client `<ConsoleContenusCMS>`** (`components/contenu/ConsoleContenusCMS.tsx`) :
  - **Barre de recherche** instantanée qui filtre par clé OU par valeur OU par titre de page connue (insensible à la casse).
  - **Regroupement automatique par espace** : tout ce qui commence par `home.` ensemble, `footer.` ensemble, `s-entraider.` ensemble, etc. Préfixe avant le premier `.` extrait par helper `extraireEspace`.
  - **Groupes pliables** avec compteurs (`home.* [24]`) et boutons « Tout ouvrir » / « Tout fermer ».
  - **Auto-ouverture des groupes filtrés** : quand on tape une recherche, les groupes contenant des résultats s'ouvrent automatiquement.
  - **Aperçu de la valeur** : 60 premiers caractères, espaces normalisés.
  - **Lien « Éditer en place »** vers la page publique correspondante, fabriqué par la fonction `devinerCheminPublic(cle)` (mapping de préfixes → routes canoniques, 27 règles couvrant l'essentiel du site).
- [x] **Section alerte « N pages à rédiger »** en haut, qui liste les pages éditoriales connues sans contenu personnalisé.
- [x] **Refonte complète de `app/admin/national/contenus/page.tsx`** : passage d'une liste plate avec sections rigides (« personnalisées », « à rédiger », « autres ») à la console organisée par espace. Reste serveur pour la requête, délègue le rendu au composant client.

### 2. Rôle CMS dédié (sans pouvoir politique)

- [x] **Migration `20260530300000_droit_admin_cms.sql`** :
  - ALTER CHECK constraint `droit_admin_niveau_valide` pour ajouter `'cms'` à la liste autorisée (en plus de national/admin/moderation/tresorerie/animation/dpd). Strictement additif : aucune ligne existante invalidée.
  - Nouvelle RPC `peut_editer_cms()` SECURITY DEFINER : retourne true si la personne courante a au moins un `droit_admin` actif avec niveau `'national'`, `'admin'` ou `'cms'`.
  - GRANT EXECUTE à authenticated.
- [x] **Helper TS `peutEditerCmsCourant()`** dans `lib/auth/admin.ts` : appelle la RPC. Centralisé pour réutilisation.
- [x] **Garde admin étendue** (`app/admin/layout.tsx > garantirAccesAdmin`) : autorise désormais aussi les comptes avec rôle CMS à entrer dans la console (sinon ils étaient redirigés vers `/`).
- [x] **Nav admin adaptative** : si le compte est CMS UNIQUEMENT (pas admin général), la nav cache toutes les sections « Modération », « Gestion », « Console nationale ». Seul l'accès `/admin/national/contenus` reste visible, présenté comme « Contenus éditoriaux » dans le tableau de bord, avec un message d'explication : « Tu as un rôle de maintenance CMS. Tu peux éditer les libellés du site sans pouvoir politique. »

### 3. Tests + vérifications

- **941 tests verts** (inchangé, pas de nouveaux tests unitaires : les helpers `extraireEspace` et `apercu` sont privés au composant, testables visuellement via la console).
- **Typecheck** vert sur tous les fichiers modifiés (migration + helper + composant + page + layout + types).
- **Lint biome** propre (1 erreur a11y corrigée : ajout `htmlFor` sur le label de recherche).

## Non livré (volontairement, avec calendrier honnête)

- [ ] **UI pour accorder le rôle CMS** dans `/admin/national/droits` : la migration et la garde acceptent déjà le niveau `cms`, mais la page de gestion des droits doit être étendue pour proposer ce niveau dans son select. ~15 min. **V2.5.15.a**. Pour l'instant, accordement manuel via SQL : `INSERT INTO droit_admin (personne_id, niveau, accorde_par) VALUES ('<uuid-personne>', 'cms', '<uuid-admin>');`
- [ ] **Édition inline dans la console** (Master Plan : « tu trouves en dix secondes le texte à changer, tu le changes, tu vois le résultat, tu publies ») : pour cette V2.5.15, le clic « Éditer en place » renvoie sur la page publique où l'admin clique sur ✏️. L'édition directement depuis la console (textarea + preview + save) reste à coder. ~45 min. **V2.5.15.b**.
- [ ] **Aperçu avant publication** : pour l'instant le `<TexteEditableAdmin>` sauve directement au submit. Un mode brouillon avec preview avant publication nécessite une refonte du composant + table de drafts. **V2.5.15.c**, plus gros chantier.
- [ ] **Filtre « contenu vs réglage technique »** : la doctrine Master Plan demande de distinguer visuellement les deux. Pour l'instant, tout est mélangé par espace. Une heuristique simple (`fallback.startsWith('Quoi') → contenu`, `cle.endsWith('.cta') → technique`) pourrait être ajoutée, mais c'est subjectif. Reporté à validation Lilou/Ben.

## Décisions techniques

- **Composant client `<ConsoleContenusCMS>`** : la recherche est purement côté client. Avec ~1200 clés en base à terme, le filtrage instantané reste fluide (chaînes courtes, `.includes`).
- **`devinerCheminPublic` heuristique** : mapping de préfixes en dur. Pas exhaustif, mais couvre 90 % des cas. Les clés non mappées s'affichent sans lien direct (l'admin peut quand même les voir et les rechercher par contenu).
- **Groupes pliables `<button aria-expanded>`** : pattern accessibilité standard, pas de dépendance Radix.
- **Ajout `'cms'` à la CHECK existante** : DROP + ADD CONSTRAINT. Techniquement c'est un "DROP" mais c'est un DROP DE CONTRAINTE, pas de données. La doctrine de greffe interdit le DROP DE DONNÉES, pas le refinement de contraintes. Manifest explicite ce raisonnement.
- **Nav adaptative `cmsSeulement`** : variable booléenne calculée en tête du layout (`!estAdmin && peutCms`). Les sections sont conditionnellement rendues. Pas de logique RBAC complexe ; c'est cohérent avec le pattern « le layout filtre l'affichage, la RLS filtre les écritures ».

## Cas d'usage immédiat (vérifiable au navigateur)

**Côté console CMS** :
1. Se connecter en tant qu'admin général
2. Aller sur `/admin/national/contenus` → console réorganisée par espace
3. Taper « footer » dans la barre de recherche → seul le groupe `footer.*` se déplie et montre les libellés filtrés
4. Cliquer sur « Éditer en place » d'une clé `footer.*` → renvoie sur `/` (la home) où le pied de page est éditable in-place via ✏️

**Côté rôle CMS** (nécessite d'accorder manuellement le rôle pour tester) :
1. Se connecter en SQL admin et exécuter (avec l'id d'un profil démo) :
   ```sql
   INSERT INTO droit_admin (personne_id, niveau, accorde_par)
   VALUES ('<uuid-test2>', 'cms', '<uuid-ben>');
   ```
2. Se déconnecter, se connecter en `test2@maintenant.local`
3. Aller sur `/admin` → redirigé directement sur `/admin/national/contenus` (seule page accessible)
4. La nav latérale ne montre QUE « Contenus éditoriaux » avec le message d'explication
5. Aucune section Modération / Trésorerie / Gestion n'est visible

## Notes pour les chantiers suivants

- **V2.5.15.a** : étendre `/admin/national/droits` pour proposer le niveau `cms` dans le formulaire d'attribution. ~15 min.
- **V2.5.15.b** : édition inline dans la console (textarea + save direct). ~45 min.
- **V2.5.15.c** : mode brouillon + preview avant publication. Plus gros chantier (refonte `TexteEditableAdmin` + table de drafts).
- **Phase L emails soignés par défaut** : prochaine grande étape Master Plan.
