# Manifest — Chantier V2.5.11 : Phase I marché Vinted + finitions G et H

**Date de fin** : 2026-05-30 (matin du 30)
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~1h.

## Contexte

Lilou/Ben a relevé en revue rapide que les chantiers V2.5.8 (Phase G) et V2.5.10 (Phase H) avaient été marqués comme « partielle » et « fondations », avec du travail UI non livré. Réponse honnête : c'était de l'évitement déguisé en prudence à la fin de nuit. Ce chantier finit le travail.

## Livré

### Phase I — Marché solidaire façon Vinted (V2.5.11)

- [x] **Refonte complète de `<CarteProduit>`** : passage d'une carte verbeuse en colonnes à une **vignette photo carrée** style Vinted.
  - Photo en hero (aspect-square, `object-cover`, transition zoom au survol).
  - Image par défaut `/defaults/offre-marche.svg` si pas de photo.
  - Badges (mode vente/don, statut) en **surimpression** sur la photo en haut à gauche.
  - Prix grand et lisible sous la photo (double affichage EUR / T99CP).
  - Titre compact en 2 lignes max (`line-clamp-2`).
  - Lieu en pied (icône MapPin compacte).
  - Vendeureuse + note moyenne tout en bas, séparé par border-t.
  - **Toute la carte cliquable** via overlay invisible.
- [x] **Grille plus dense** : passage de `lg:grid-cols-3` à `lg:grid-cols-4` (et `md:grid-cols-3`) pour densifier comme Vinted.

### Phase H finalisée — Badge espace dans `<CartePost>` (V2.5.11.a)

- [x] **Extension de `PostAffiche`** avec `espacePublieur: AttributionEspace | null` dans `lib/reseau/requetes.ts`.
- [x] **Helper `chargerAttributionsEspaces`** : une seule requête par type d'espace présent dans le lot (et pas une requête par post). Switch explicite par les 6 types pour préserver le typage Supabase. Résout nom + slug + image_url + chemin public.
- [x] **`hydraterPosts` adapté** : appelle `chargerAttributionsEspaces` en parallèle avec les autres hydrations, attache l'attribution à chaque PostAffiche concerné.
- [x] **Select SQL enrichis** : `getFluxReseau`, `listerPostsDePersonne`, `getPost` ramènent maintenant `espace_type` et `espace_id`.
- [x] **`<CartePost>` adapté** : si `espacePublieur` présent, met l'espace en avant (avatar = image de l'espace, nom = lien cliquable vers `cheminPublic`) avec « publié par [Auteurice] » en sous-titre fin pour la transparence. Sinon comportement inchangé.
- [x] **Conséquence visible immédiate** : les 6 posts au nom de communes démo (V2.5.10) apparaissent désormais dans le flux du réseau avec un badge « [DÉMO] Argenteuil » cliquable au lieu d'être confondus avec des posts personnels.

### Phase G finalisée — Modale « Intégrer à une campagne » (V2.5.11.b)

- [x] **Composant client `<BoutonAttacherACampagne>`** (`components/campagnes/BoutonAttacherACampagne.tsx`) :
  - Bouton outline « + Intégrer à une campagne ».
  - Au clic : ouvre une `<dialog>` natif avec un select des campagnes publiées.
  - Au submit : appelle la Server Action `attacherModule` existante.
  - Gestion d'erreur (ex. « déjà attaché » remonte le message clair).
  - Succès : refresh page + fermeture auto après 1.2s.
  - Si aucune campagne publiée : affiche un lien direct vers `/mobiliser/campagnes/nouvelle`.
- [x] **Branchement sur la page détail pétition** : affichage conditionné à `estAdmin`. Charge la liste des campagnes via `listerCampagnesPubliees()` côté serveur.
- [x] **Décision de permission** : admin de plateforme uniquement pour V1 (cohérent avec la RLS existante sur `module_campagne`). Étendre aux créateurices de la campagne cible dans un chantier ultérieur si Lilou/Ben le souhaite.

## Non livré (et reporté avec calendrier)

- [ ] **Branchement de `<BoutonAttacherACampagne>` sur les 3 autres types** (mobilisation, cagnotte, sondage) : copier-coller à faire (~5 min par page). À programmer V2.5.11.c.
- [ ] **Création de campagne à la volée** depuis la modale : lien vers `/mobiliser/campagnes/nouvelle` proposé pour l'instant. Refonte en modale 2 onglets (« Choisir existante » / « Créer nouvelle ») reportée si Lilou/Ben le juge utile.
- [ ] **Embellissement transport, hébergement, fruits de la terre, SEL, prêt** (Phase I sur les 5 autres espaces) : chacun mérite son propre chantier dédié avec la grammaire visuelle adaptée (BlaBlaCar pour transport, Airbnb pour hébergement, etc.). À programmer V2.5.12 à V2.5.16.

## Décisions techniques

- **Carte produit overlay invisible** : `<span aria-hidden absolute inset-0 />` à l'intérieur du `<Link>` du titre rend toute la carte cliquable sans casser l'accessibilité (le lecteur d'écran lit juste le titre).
- **Switch explicite par type d'espace** dans `chargerAttributionsEspaces` plutôt qu'accès dynamique : nécessaire pour préserver le typage Supabase auto-généré. Verbose mais auditable.
- **Modale `<dialog>` natif** pour `<BoutonAttacherACampagne>` : cohérent avec `<ModaleSignaturePetition>` existante. Accessible par défaut, pas de dépendance externe.
- **Pas de Web Share API ni de polyfill modale** : on garde le pattern existant du projet.

## Tests

- **941 tests verts** (inchangé : pas de nouveau test mais aucune régression).
- **Typecheck** vert sur tous les fichiers modifiés.
- **Lint** propre.

## Notes pour les chantiers suivants

- **V2.5.11.c** : étendre `BoutonAttacherACampagne` aux pages mobilisation, cagnotte, sondage (~15 min total).
- **V2.5.12** : Phase I transport façon BlaBlaCar (page liste + carte trajet).
- **V2.5.13** : Phase I hébergement façon Airbnb.
- Le cas démo de Phase H est désormais entièrement visible : aller sur `/s-informer/reseau` au matin pour voir les 6 posts au nom de communes avec leur badge.
- Le cas démo de Phase G : aller sur n'importe quelle pétition démo en étant connecté·e en admin, scroll en haut pour voir le nouveau bouton « + Intégrer à une campagne ».
- Le cas démo de Phase I (marché Vinted) : aller sur `/s-entraider/marche/produits` (vide en local pour l'instant — il faudrait des annonces démo pour vraiment voir la grille à 4 colonnes. Note pour plus tard : enrichir le seeding démo avec quelques `produit_marche`).
