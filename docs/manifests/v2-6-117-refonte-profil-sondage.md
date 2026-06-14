# Manifest — V2.6.117 : refonte du questionnaire de profil (sondages)

**Date** : 2026-06-14
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (à venir)

## Contexte (demande Ben, 2026-06-14)

Après avoir qualifié son profil, Ben a voulu refondre le panel de
qualification : retirer « taille de l'agglomération », ajouter les échelles de
revenu, la présidentielle 2022 (liste exhaustive), une question logement
détaillée, et **vérifier le vocabulaire des instituts de sondage**. Il a
demandé une liste enrichie (« monte à 25 propositions, je choisirai »), puis a
validé **question par question** le panel final.

## Méthode

1. **Réinitialisation** (demande Ben) : `data-migration/reinitialiser-compteurs.mjs`
   a vidé `profil_qualification` (11 → 0) et `reponse_sondage` (2 → 0) ; les vues
   `sondage_resultats` / `_par_tranche` retombent à 0 toutes seules.
2. **Recherche multi-agents** (13 agents, vocabulaire INSEE PCS 2020, grille de
   densité INSEE, enquête Logement, TeO2 INED, CEVIPOF, IFOP, Ipsos, CRÉDOC,
   ministère de l'Intérieur) → 26 questions sourcées →
   `docs/sondages-profil-25-propositions.md`.
3. **Validation une par une** avec Ben (AskUserQuestion) → **23 questions** retenues.
4. **Chiffres réactualisés** (demande Ben) : RSA personne seule **651,69 €** et AAH
   **1 041,59 €/mois** au 1ᵉʳ avril 2026 (LégiSocial, monparcourshandicap.gouv.fr)
   → palier « Moins de 650 € (sous le RSA) ».

## Panel livré — 23 questions (`lib/sondages/qualification.ts`)

**Socio (13)** : genre · tranche d'âge (**+ 15-17 ans**) · CSP · secteur · diplôme
· **revenu (échelle élargie vers le bas : <650 € sous le RSA / 650-999 €…)** ·
**logement (6 postes : propriétaire / locataire privé / HLM / hébergé privé /
hébergé collectif / sans domicile)** · **type de commune (remplace « taille
d'agglo », grille de densité INSEE + repère d'habitant·es)** · région · situation
conjugale · composition du foyer · **patrimoine** (ajout) · **aisance financière
CRÉDOC** (ajout).

**Politique (6)** : présidentielle 2022 T1 (**12 candidat·es, ordre du bulletin**)
· présidentielle 2022 T2 · européennes 2024 (**38 listes, exhaustif**) · axe
gauche-droite (CEVIPOF) · comment tu t'informes · **confiance dans les
institutions** (ajout, choix multiple).

**Engagement (4)** : formes d'engagement · bénévolat (+ domaine) · syndicalisation
(+ quel syndicat) · adhésion.

**Retirées** : statut dans l'emploi, origine sociale, législatives 2024, dons aux
associations, intérêt pour la politique.

## Détails techniques

- Le second champ d'écran (`secondaire.requisSi`) accepte désormais **plusieurs
  valeurs déclencheuses** (`string | readonly string[]`) : bénévolat (3 « Oui… »)
  et syndicalisation (« actuellement » / « anciennement »). Action
  `repondreQualification` mise à jour (`declencheurs.includes(...)`).
- `OPTIONS_LOGEMENT` passe à 6 postes (parts cibles ≈ enquête Logement INSEE,
  somme = 1, pour le redressement par quotas).
- `OPTIONS_GENRE` inchangé (réutilisé par `FormulaireVote`).
- Tests : `tests/unit/sondages/qualification.test.ts` mis à jour (23 questions,
  parts logement, doubles bénévolat + syndicat). 55 tests sondages verts,
  typecheck + lint verts.

## Reste / à faire

- Les libellés des options sont validés ; le **rendu visuel** du panel est
  inchangé (mécanique de tirage identique). À tester en conditions réelles après
  un vote.
- Quotas de redressement : seul l'âge est actif aujourd'hui ; les parts cibles
  logement sont posées pour un futur redressement multi-critères.
