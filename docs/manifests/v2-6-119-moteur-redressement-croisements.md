# Manifest — V2.6.119 : moteur de redressement multi-variables + croisements + fiabilité

**Date** : 2026-06-14
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (à venir)

## Contexte (demande Ben, 2026-06-14)

Suite des sondages : « il est hyper important d'avoir les vrais % de chaque
option (les quotas) + un moteur de croisements et de calculs de fiabilité ;
explique-moi tes matrices. » Briques 2 et 3 après le socle des marges (V2.6.118).
Décision : croisements **réservés à l'admin**.

## Livré

### Moteur (fonctions pures, testées)
- `lib/sondages/raking.ts` : **calage sur marges (raking / IPF)** multi-variables.
  `calculerPoidsRaking(repondants, marges, {bornes})` itère jusqu'à convergence ;
  `agregerPondere` → totaux pondérés + **n effectif** + **effet de plan (Kish)** ;
  `margesRedressement()` branche les vraies marges (V2.6.118).
- `lib/sondages/fiabilite.ts` : `margeErreur95`, `intervalle95`, `nEffectif`,
  `effetDePlan`, `estFiable` + `SEUIL_CELLULE = 30` (toutes les marges sur le n
  EFFECTIF, pas le n brut).
- `lib/sondages/croisements.ts` : `croiserParVariable` → répartition pondérée du
  vote par modalité de profil, avec drapeau `fiable` (anonymat + fiabilité).

### Couche données (admin)
- `lib/admin/analyse-sondage.ts` : `analyserSondage(slug)` — RÉSERVÉ admin
  (`estAdminCourant`), lit les votes + le profil complet des votant·es
  (`profil_qualification`, via client service-role) et renvoie UNIQUEMENT des
  agrégats : brut, redressé, fiabilité, croisements (cellules < 30 marquées non
  fiables). Le genre déclaré au vote complète le profil s'il manque.

### Affichage (admin)
- `app/admin/national/sondages/[slug]/page.tsx` : résultat global brut vs
  redressé (+ écart en points), encadré fiabilité (n brut, n effectif, effet de
  plan, marge d'erreur ±pts, convergence), et croisements par variable (groupes
  sous le seuil grisés). Lien « Analyse » ajouté sur la liste admin des sondages.

## Pédagogie
Les matrices ont été expliquées à Ben (schéma + prose) : échantillon brut →
marges de référence → calage (raking) → tri croisé pondéré → fiabilité. Atout
clé : le **calage sur le vote réel** (présidentielle 2022) neutralise la
sur/sous-déclaration.

## Vérifications
- 9 tests moteur (convergence 1 et 2 variables, n eff./effet de plan, marge
  d'erreur, croisements, intégration marges réelles). **1157 tests verts au
  total**, typecheck + lint verts.

## Portée et limites (honnête)
- Le **public** garde l'affichage existant (redressement âge-seul) ; le
  multi-variables + croisements vivent dans la **page admin**. Promotion au
  public possible plus tard.
- Variables de quota actives = les 16 marges de V2.6.118 (revenu = la plus
  fragile). Les variables à choix multiple (confiance, engagement…) restent hors
  calage (analyse seulement).
- Le redressement ne vaut que par le remplissage du profil par les votant·es :
  tant qu'il est faible, peu de croisements seront « fiables » (seuil 30).
