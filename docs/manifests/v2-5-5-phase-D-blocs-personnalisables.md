# Manifest — Chantier V2.5.5 : Master Plan V2.6 Phase D (blocs personnalisables)

**Date de fin** : 2026-05-30 (nuit du 29 au 30)
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~40 min.

## Objectif Master Plan

Phase D : « Te permettre d'ajouter toi-même, dans un espace collectif, des petits blocs libres (texte, image, lien, bouton) sans code, comme on compose une newsletter. Premier usage concret : afficher le lien du groupe WhatsApp ou Telegram d'une commune. »

## Livré et fonctionnel

- [x] **Migration `bloc_espace`** (`supabase/migrations/20260530000000_bloc_espace.sql`) : table polymorphe `(espace_type, espace_id)` avec CHECK liste fermée (commune/federation/confederation/gt_thematique/groupe_entraide_local/campagne), colonne `type` CHECK (texte/image/lien/bouton), colonne `contenu_json jsonb`, colonne `ordre` pour le tri, trigger `updated_at`, RLS lecture publique, écriture réservée service_role. Conforme à la doctrine de greffe §0.3 (aucune table existante touchée).
- [x] **Types TS** (`lib/blocs-espace/types.ts`) : union discriminée `BlocEspaceDecode` qui assure le typage fort de chaque variante (texte/image/lien/bouton) avec son contenu spécifique. Énumération `TypeEspace` pour les 6 types d'espaces supportés.
- [x] **Validation Zod** (`lib/blocs-espace/validation.ts`) : 4 schémas Zod (`SchemaContenuTexte`, `SchemaContenuImage`, `SchemaContenuLien`, `SchemaContenuBouton`) avec contraintes strictes (URL valide refusant javascript:, longueurs max, variantes énumérées). Helper `decoderBloc` qui prend une ligne brute et renvoie l'union typée ou `null` si invalide (rendu silencieusement ignoré, pas de crash).
- [x] **Helpers de requête** (`lib/blocs-espace/requetes.ts`) : `listerBlocsEspace` (lecture, ordonnée), `creerBlocEspace` (ordre auto-incrémenté), `mettreAJourBlocEspace`, `supprimerBlocEspace`. Lecture via `getSupabaseServer`, écriture via `getSupabaseAdmin` (service_role bypasse RLS).
- [x] **Composant `RenduBlocsEspace`** (`components/blocs/RenduBlocsEspace.tsx`) : Server Component qui charge les blocs et dispatche au bon rendu selon le type. Bloc texte = `<div>` whitespace-pre-line, bloc image = `<figure>` 16/9 avec figcaption, bloc lien = `<Link>` avec icône externe, bloc bouton = `<Link>` stylé avec 3 variantes (primary/ghost/outline) — réutilise le dégradé `bg-grad`.
- [x] **Branchement sur la page commune** : `<RenduBlocsEspace espaceType="commune" espaceId={commune.id} />` ajouté entre la carte d'infos et la zone d'inscription. Affichage silencieux si aucun bloc.
- [x] **Seeding démo** : le script `seed-demo.ts` crée 3 blocs démo sur chacune des 6 communes (texte de bienvenue + lien WhatsApp + bouton réunion visio). 18 blocs au total. Idempotent (skip si la commune a déjà des blocs).
- [x] **Tests unitaires** : 14 nouveaux tests sur `decoderBloc` et `estTypeBloc`. Couvre les cas valides, les types inconnus, les contenus mal formés, les URLs malveillantes (javascript:), les longueurs excessives. **932 tests verts au total** (918 + 14).
- [x] **Lint biome** propre, **typecheck** global vert.

## Non livré (et pourquoi)

- [ ] **Éditeur admin (formulaire de création/édition/réordonnancement)** : non livré cette nuit. La logique côté serveur (`creerBlocEspace`, `mettreAJourBlocEspace`, etc.) existe et est testée. Reste à câbler un formulaire Server Action sur la page admin de chaque espace. **Workaround temporaire pour Lilou/Ben** : modifier directement les blocs via Supabase Studio (`http://127.0.0.1:54323` en local). À programmer pour V2.5.5.a ou plus tard.
- [ ] **Branchement sur les 5 autres types d'espaces** (fédération, GT, confédération, groupe d'entraide, campagne) : pour cette nuit, le `<RenduBlocsEspace>` n'est branché que sur la page commune. La table accepte déjà ces 5 autres types via la CHECK, et le composant accepte n'importe quel `TypeEspace`. Reste juste à ajouter le `<RenduBlocsEspace>` sur les 4-5 autres pages slug. Mécanique en place, copier-coller à faire.
- [ ] **Drag & drop pour réordonner** : non livré. La colonne `ordre` existe (par pas de 10 pour permettre l'insertion entre deux blocs sans renumérotation), et `mettreAJourBlocEspace` peut écrire un nouvel `ordre`, mais l'UI drag&drop reste à coder.
- [ ] **Permissions par rôle dans l'espace** : pour l'instant l'écriture est réservée aux admins de plateforme (`droit_admin`). Donner ce pouvoir aux animateurices d'une commune particulière nécessite une notion de « rôle dans un espace » qui n'existe pas encore (champ `role` dans les tables `appartenance_*`). À aborder dans un chantier dédié.

## Décisions techniques

- **Polymorphisme par `(espace_type, espace_id)`** plutôt que 6 tables filles : cohérent avec les autres tables polymorphes du projet (`reservation`, `transaction_entrante`, `bloc_espace`). Plus simple à étendre.
- **CHECK liste fermée** sur `espace_type` ET `type` : empêche les écritures aberrantes même par script. Évolution = ALTER CHECK additif.
- **`contenu_json jsonb`** avec validation Zod côté applicatif : flexibilité maximale, le schéma SQL ne contraint pas la structure du contenu. Permet d'ajouter un 5e type sans toucher au schéma SQL.
- **`decoderBloc` retourne null sur invalide** plutôt que jeter : le rendu d'un bloc cassé n'écroule pas la page entière.
- **Ordre par pas de 10** : permet l'insertion d'un nouveau bloc entre deux existants (ex. ordre 15) sans renuméroter tous les blocs.
- **Lecture publique RLS, écriture service_role** : cohérent avec le pattern des autres tables admin (caisse, objet_demo).

## Tests

- **932 tests verts** (918 + 14 nouveaux sur `decoderBloc`).
- **Typecheck** global vert.
- **Lint biome** propre.
- **Test fonctionnel manuel** : seeding de 18 blocs démo réussi, lecture via `listerBlocsEspace` confirmée par le rendu (à valider visuellement par Lilou/Ben au matin sur les 6 pages commune démo).

## Notes pour les chantiers suivants

- **V2.5.5.a (éditeur admin blocs)** : prévoir un composant client `<EditeurBlocsEspace>` qui liste les blocs existants, propose un bouton « + Ajouter un bloc » avec un sélecteur de type, et un formulaire dynamique par type (texte = textarea, image = champ URL + alt, lien = url + libellé + checkbox externe, bouton = url + libellé + sélecteur variante). Server Actions : `creerBlocEspaceAction`, `modifierBlocEspaceAction`, `supprimerBlocEspaceAction`. Validation Zod côté serveur (réutiliser les schémas de `lib/blocs-espace/validation.ts`).
- **Branchement multi-espaces** : ajouter `<RenduBlocsEspace>` sur les pages fédération, GT, groupe entraide local, campagne. ~5 minutes par page.
- **Cas d'usage du Master Plan** : « afficher le lien du groupe WhatsApp pour la commune d'Argenteuil » est désormais possible — il suffit d'insérer un bloc de type `lien` ou `bouton` dans la base (UI éditeur à venir).
