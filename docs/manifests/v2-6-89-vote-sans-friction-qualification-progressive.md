# Manifest — V2.6.89 : vote sans friction + qualification progressive du profil (sondages V2 §6-§7)

**Date de fin** : 2026-06-12
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (commit de ce chantier)
**Durée approximative** : 1 session Claude Code (suite de la revue bêta)

## Contexte (directives vocales Ben, 2026-06-12)

« Très simple, pas de friction pour le premier vote » : les gens étant
connectés pour voter, le code postal vient du profil (pas de champ) ;
le formulaire ne demande que le genre (Homme · Femme · Non binaire ·
Autre, « autre » au singulier) et la tranche d'âge. Après le vote :
merci + UNE question s'affiche immédiatement (chapô « fiabiliser »),
chaque réponse enchaîne automatiquement sur la suivante (pas de
« voulez-vous une autre question ? »), bouton « C'est tout pour
aujourd'hui » pour s'arrêter. Les réponses, non publiques, nourrissent
la méthode des quotas. Critères : géographie (code postal → département,
région, urbanité, taille de commune), âge, genre, + type de logement
(parts INSEE 2021 fournies par Ben et vérifiées) et CSP via le panel.

## Livré et fonctionnel

- [x] **Formulaire de vote simplifié** (`FormulaireVote`) : deux sélecteurs
  optionnels visibles (genre 4 options, tranche d'âge 6 options), plus de
  champ code postal ni pronom. Aide : « comme le code postal déjà présent
  dans ton profil, servent uniquement à fiabiliser les résultats ».
- [x] **Données gratuites du profil** (`voterSondage`) : le code postal de
  la personne (colonne `personne.code_postal`) est enregistré avec le vote ;
  la tranche d'âge est déduite de `personne.date_naissance` quand elle n'est
  pas déclarée (`trancheAgeDepuisDateNaissance`, testée). Le genre déclaré
  au vote alimente aussi le profil de qualification (la question du panel
  ne sera pas re-posée).
- [x] **Migration additive appliquée au distant** (feu vert explicite Ben) :
  `20260612150000_profil_qualification.sql` : table NON PUBLIQUE
  `profil_qualification` (personne_id + question_cle UNIQUE, réponse,
  réponse secondaire pour le bénévolat), RLS stricte : chaque personne ne
  lit/écrit QUE ses réponses, AUCUNE policy admin (les croisements
  passeront par la boîte noire agrégée, CDC §5).
- [x] **Panel de qualification** (`lib/sondages/qualification.ts`) : les
  22 questions du CDC §7 verbatim (dont les 38 listes des européennes 2024,
  zéro regroupement), avec les ajustements Ben : genre 4 options, logement
  en 5 catégories INSEE 2021 avec parts cibles (57,1 / 34,9 / 5 / 2,7 /
  0,3 %). Poids de tirage : CSP, type de commune, taille d'agglo,
  présidentielle 2022 et logement sortent plus souvent (CDC §6).
- [x] **Tirage** (`tirerProchaineQuestion`, pur, testé) : aléatoire pondéré
  parmi les questions NON répondues ; la tranche d'âge fine est exclue si
  la date de naissance du profil est connue.
- [x] **Enchaînement post-vote** (`QualificationProgressive`) : chapô, la
  question (boutons-réponses ; cases à cocher pour le choix multiple ;
  écran double Oui/Non + secteur pour le bénévolat, second champ requis si
  Oui) ; chaque réponse charge la suivante en UN aller-retour
  (`repondreQualification` renvoie la question suivante) ; bouton
  « C'est tout pour aujourd'hui ». Première question tirée CÔTÉ SERVEUR
  (affichage immédiat, zéro friction).

## Vérification INSEE (demande Ben)

Parts logement confirmées dans les ordres de grandeur par l'INSEE
(~57,9 % de MÉNAGES propriétaires, ~35 % locataires ; la fiche
« personnes majeures » de France portrait social 2023 donne 57,1 / 34,9 /
8 dont 5 + 2,7 + 0,3). Cibles posées dans `OPTIONS_LOGEMENT`
(constantes), à rendre modifiables par l'admin (CDC §2 « barèmes
saisis/modifiables ») dans un chantier back-office à venir.

## Non livré (et pourquoi)

- [ ] **Moteur de redressement complet** (CDC §2-§3) : tirage équilibré
  seedé (étage 1), raking multi-marges (étage 2), note de fiabilité en
  étoiles continue, paliers, fiche méthodologique téléchargeable, boîte
  noire admin : gros chantier dédié. La pondération actuelle reste sur la
  tranche d'âge (V2.6.88) ; les nouvelles données (genre, logement, CSP,
  géo via CP) s'accumulent dès maintenant pour l'alimenter.
- [ ] **Dérivés géographiques du code postal** (département, région,
  urbanité, taille de commune) : à matérialiser dans une vue/table de
  correspondance (la grille communale de densité INSEE reste à importer).
- [ ] **Barèmes admin modifiables** (back-office des parts cibles).

## Contenus à arbitrer

- [ ] Libellés définitifs des 22 questions (CDC §7 « Reste à faire » :
  rédaction à figer par Lilou/Ben ; les libellés posés suivent le CDC).
- [ ] Chapô de la qualification (défaut : « Pour fiabiliser les sondages,
  tu peux compléter ton profil… ») : surchargeable par props, à brancher
  au CMS si souhaité.

## Tests

- Unitaires : **1 091 tests verts**, dont 18 nouveaux (panel : 22 clés
  uniques, options complètes, 42 options européennes, parts logement
  sommant à 1, second champ bénévolat ; tirage pondéré et exclusions ;
  déduction de la tranche d'âge avec bornes).
- Lint Biome + typecheck : verts.
- Vérification en prod après déploiement : page de vote avec les
  2 sélecteurs (capture navigateur) ; le flux post-vote complet sera
  validé par le premier vote réel de Ben.

## Notes pour les chantiers suivants

- Q15/Q16 (votes passés) = données sensibles : cadre de
  collecte/conservation à confirmer avec Légicoop (CDC, déjà signalé).
- La réponse « genre » du vote est synchronisée vers le panel ; l'inverse
  (pré-remplir le sélecteur de vote depuis le panel) serait un plus.
