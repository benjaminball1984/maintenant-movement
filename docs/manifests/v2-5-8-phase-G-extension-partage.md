# Manifest — Chantier V2.5.8 : extension du moteur de partage + état Phase G

**Date de fin** : 2026-05-30 (nuit du 29 au 30)
**Branche** : `main`
**Commit final** : (à renseigner après commit)
**Durée approximative** : ~15 min.

## Décision d'arbitrage en cours de nuit

La Phase G du Master Plan (« brancher la double relation aux campagnes ») mérite un vrai chantier dédié avec UI réfléchie (modale de choix campagne existante / création à la volée, gestion du `module_campagne.ordre`, attache/détache, persistance de l'admin). Vu l'heure (~04h30) et le risque de bâcler quelque chose qui touche à la mécanique campagne, j'ai préféré :
- **Documenter ici** que la mécanique est **déjà entièrement en place** côté Server Action (`app/(public)/mobiliser/campagnes/actions.ts > attacherModule`, l. 129-166) et côté table (`module_campagne`, migration `20260520120017`).
- **Reporter le chantier UI** à V2.5.8.a (à programmer avec Lilou/Ben).
- **Utiliser le temps disponible** pour étendre concrètement le moteur de partage V2.5.7 à 2 autres entités publiques majeures : mobilisations et cagnottes.

## Livré

- [x] **`<BoutonsPartage>` branché sur la page détail mobilisation** (`app/(public)/mobiliser/mobilisations/[slug]/page.tsx`) : visible quand la mobilisation est publiée. Message pré-rempli inclut la date et le lieu pour donner toute l'info utile à la personne reçue. Titre du bloc : « Ramener des proches » (lien avec le tunnel 6.6 du Master Plan).
- [x] **`<BoutonsPartage>` branché sur la page détail cagnotte** (`app/(public)/mobiliser/cagnottes/[slug]/page.tsx`) : visible quand la cagnotte est publiée. Titre : « Faire connaître cette cagnotte ». Intro insiste sur l'objectif financier (le partage est essentiel pour les cagnottes solidaires).
- [x] **Typecheck** vert, **lint** propre.
- [x] **941 tests verts** (inchangé).

## État Phase G (campagnes UI) — non livré, documenté

Le Master Plan §2.1 et §G décrit le besoin d'un bouton « Intégrer cette pétition à une campagne » sur chaque objet rattachable (pétition, mobilisation, cagnotte, sondage), avec une modale qui propose de choisir parmi les campagnes existantes ou d'en créer une à la volée.

**Existant** (ne pas refaire) :
- Table `module_campagne` (migration `20260520120017_module_campagne.sql`) : relation polymorphe campagne ↔ (pétition, mobilisation, cagnotte, sondage, page éditoriale) avec ordre + contenu éditorial optionnel.
- Server Action `attacherModule(donneesBrutes: unknown)` dans `app/(public)/mobiliser/campagnes/actions.ts` ligne 129 : valide Zod, vérifie l'existence de la cible, gère la contrainte d'unicité (un module donné = une seule attache par campagne), revalide la page.
- Server Action `detacherModule(donneesBrutes: unknown)` ligne 171.
- Helper `listerCampagnesPubliees(limite = 50)` dans `lib/campagnes/requetes.ts` ligne 111.

**À faire (V2.5.8.a)** :
1. Composant client `<BoutonAttacherACampagne>` qui prend en props `{typeModule: 'petition'|'mobilisation'|...; cibleId: string; campagnes: CampagneEnrichie[]}`. Affiche un bouton « + Intégrer à une campagne ». Au clic, ouvre une `<dialog>` avec un select des campagnes + bouton submit qui appelle `attacherModule`.
2. Bouton uniquement visible aux admins ou aux créateurices de l'objet (à discuter : qui a le droit d'attacher ?).
3. Branchement sur les pages détail des 4 types d'objets attachables.
4. Permission : pour V1, restreindre aux admins de plateforme (déjà géré par RLS `module_campagne`). Pour V2, considérer aussi les créateurices de la campagne cible.

## Décisions techniques

- **Pas de modification du système de campagne lui-même** : la mécanique est éprouvée (tests existants), pas de risque de régression.
- **Message pré-rempli mobilisation** : inclut date + lieu, ce qui est l'info pratique cruciale pour mobiliser des proches.
- **Message pré-rempli cagnotte** : sobre, sans appel au don agressif (« mérite d'être vue »), respecte la doctrine anti-saturation publicitaire.

## Tests

- **941 tests verts** (inchangé).
- **Typecheck** vert, **lint** propre.

## Notes pour les chantiers suivants

- **V2.5.8.a (Phase G UI)** : ~30-45 min, à programmer.
- **Étendre `<BoutonsPartage>` aux autres entités** : sondage, moment solidaire, campagne. ~5 min par entité.
- **Tunnel 6.1 (média lire → partager → soutenir)** : `<BoutonsPartage>` ferait pareil sur la page article du journal-affiche. À ajouter en complément.
