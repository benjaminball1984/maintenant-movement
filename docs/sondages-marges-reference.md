# Marges de référence des sondages (% réels de population)

> Collecte multi-agents 2026-06-14 (13 agents, 'recherche sourcée INSEE / min. Intérieur / CEVIPOF / DARES / France Bénévolat / CRÉDOC / Reuters DNR'). À VALIDER par Ben avant codage dans `lib/sondages/marges-reference.ts`.

> Usage : les variables à modalités exclusives sommant ~100 servent au **redressement (raking)** ; les variables à choix multiple (somme > 100) servent à l'**analyse/croisements**, pas au calage.

## `genre`  
**Année** : 2026 · **Somme** : 100.0 %  
**Source** : INSEE, Estimations de population au 1er janvier 2026 (données provisoires) - Population par sexe et groupe d'âges. https://www.insee.fr/fr/statistiques/2381474

| Modalité | % réel |
|---|---|
| Homme | 47.8 |
| Femme | 52.2 |
| Non binaire | — |
| Autre | — |

*Note* : Répartition par sexe calculée sur la population ADULTE (18 ans et plus), base pertinente pour un formulaire d'engagement réservé aux majeurs : 50,9 M de personnes, dont ~24,3 M d'hommes (47,8 %) et ~26,6 M de femmes (52,2 %). Sur l'ENSEMBLE de la population (tous âges, 69,1 M), le rapport est plus équilibré (48,6 % H / 51,4 F) car il y a un léger excédent de garçons à la naissance, qui s'inverse avec l'âge (surmortalité masculine) ; le déséquilibre 18+ s'accentue donc nettement aux grands âges. L'INSEE n'enregistre que le sexe à l'état civil (deux modalités Homme/Femme) : il n'existe AUCUNE statistique officielle nationale de population pour 'Non binaire' ni pour 'Autre', d'où pct=null pour ces deux modalités. Les enquêtes existantes (ex. Ifop 2022, Virage-Ined) situent les personnes non binaires / refusant la binarité de genre autour de 0,5 à 1 % des adultes, mais sans cadre de redressement officiel : à utiliser avec prudence, ne pas redresser sur ces modalités. Les % Homme/Femme somment 100.

## `tranche_age_fine`  
**Année** : 2026 · **Somme** : 100.0 %  
**Source** : INSEE, Estimations de population au 1er janvier 2026 (données provisoires) - Population par sexe et groupe d'âges. https://www.insee.fr/fr/statistiques/2381474

| Modalité | % réel |
|---|---|
| 15-17 ans | 4.8 |
| 18-24 ans | 10.6 |
| 25-34 ans | 15.1 |
| 35-49 ans | 16.1 |
| 50-64 ans | 24.7 |
| 65-74 ans | 14.3 |
| 75 ans et plus | 14.4 |

*Note* : Distribution calculée sur la population des 15 ans et plus (53,5 M de personnes), car la liste de modalités démarre à 15 ans (la pop. 0-14 ans, ~11,2 M / 16,3 % de la pop. totale, est hors champ et exclue de la base). Données INSEE au 1er janvier 2026 (provisoires). L'INSEE publie des bandes quinquennales ; deux retraitements ont été faits : (1) la bande officielle 15-19 ans (4,30 M) a été scindée en 15-17 ans (~2,58 M) et 18-19 ans (~1,72 M), au prorata 3/5 - 2/5, justifié car les cohortes annuelles sont quasi égales à ces âges (générations 2007-2011, naissances très stables ~810-830 k/an) ; le 18-24 ans agrège donc 18-19 + 20-24 ; (2) le 25-34 ans agrège les bandes 25-29 et 30-34. Aucune autre répartition n'a été nécessaire ; les % somment 100,0 après arrondi à 0,1. ATTENTION redressement : cette variable inclut des MINEURS (15-17 ans). Si le formulaire est réservé aux 18 ans et plus, retirer la modalité 15-17 et renormaliser la marge sur la base 18+ (50,9 M) : on obtient alors 18-24 = 11,1 % ; 25-34 = 15,8 % ; 35-49 = 16,9 % ; 50-64 = 26,0 % ; 65-74 = 15,0 % ; 75+ = 15,1 %.

## `csp`  
**Année** : 2023 · **Somme** : 100.0 %  
**Source** : INSEE — Recensement de la population / Enquête Emploi 2023, population des 15 ans ou plus par catégorie socioprofessionnelle. https://www.insee.fr/fr/statistiques/2381478 (séries « Population active, emploi et chômage » et « Population de 15 ans ou plus par sexe, âge et catégorie socioprofessionnelle »)

| Modalité | % réel |
|---|---|
| Agriculteur·rice exploitant·e | 0.8 |
| Artisan·e, commerçant·e ou chef·fe d’entreprise | 3.5 |
| Cadre ou profession intellectuelle supérieure | 11 |
| Profession intermédiaire | 13 |
| Employé·e | 14 |
| Ouvrier·ère | 11.7 |
| Retraité·e | 28 |
| Étudiant·e ou élève | 9 |
| Sans activité professionnelle | 9 |

*Note* : PIÈGE MÉTHODOLOGIQUE IMPORTANT : la nomenclature INSEE standard (PCS) des 8 groupes ne s'applique qu'aux ACTIFS OCCUPÉS (~28 M de personnes), où elle somme à 100 %. Mais la liste fournie mélange des catégories d'actifs (agriculteurs, artisans, cadres, prof. intermédiaires, employés, ouvriers) avec des catégories d'INACTIFS (retraités, étudiants, sans activité). Il faut donc raisonner sur la POPULATION ADULTE TOTALE (15 ans ou plus, ~55,5 M en France métropolitaine + DOM 2023), répartie par statut d'activité. Les % donnés couvrent cette population adulte complète et somment ~100. Décomposition (pop. 15+, INSEE Enquête Emploi/recensement 2023, arrondis) : Retraités ≈ 28 % (de loin le plus gros poste, ~16 M de personnes) ; Sans activité (autres inactifs hors retraités et hors études : femmes/hommes au foyer, invalides, chômeurs n'ayant jamais travaillé, etc.) ≈ 9-10 % ; Étudiants/élèves de 15+ ≈ 9 % ; puis les actifs occupés répartis selon leurs PCS : Employés ≈ 14 %, Ouvriers ≈ 11-12 %, Professions intermédiaires ≈ 13 %, Cadres et prof. intellectuelles sup. ≈ 11 %, Artisans/commerçants/chefs d'entreprise ≈ 3,5 %, Agriculteurs exploitants ≈ 0,8 %. ATTENTION aux chômeurs : dans l'Enquête Emploi un chômeur ayant déjà travaillé est classé selon sa PCS d'ancien emploi ; ici, faute de modalité « chômeur », ils sont implicitement rattachés à leur PCS (employés/ouvriers majoritairement) — c'est une limite de la liste. RÉSERVE : si l'on restreint le champ aux seuls actifs occupés (lecture PCS « pure »), les 6 catégories d'actifs se redistribueraient à : Agriculteurs 1,3 %, Artisans/commerçants/chefs d'entr. 7 %, Cadres 22 %, Prof. intermédiaires 26 %, Employés 26 %, Ouvriers 18 % (somme 100 sur les actifs occupés seulement). J'ai retenu la lecture POPULATION ADULTE car la présence de « Retraité·e / Étudiant·e / Sans activité » dans la liste impose ce champ pour un redressement par quotas cohérent. Les % ont été légèrement arrondis pour sommer ~100 ; champ France entière, 15 ans ou plus. Population 18+ donnerait des chiffres très proches (part étudiants 15-17 ans retirée, légère hausse mécanique des autres postes).

## `diplome`  
**Année** : 2022 · **Somme** : 100.0 %  
**Source** : INSEE — Recensement de la population 2022, Diplômes-Formation (population non scolarisée de 15 ans ou plus selon le diplôme le plus élevé) ; séries longues 1968-2022. https://www.insee.fr/fr/statistiques/8581488 et https://www.insee.fr/fr/statistiques/1893149

| Modalité | % réel |
|---|---|
| Aucun diplôme | 25 |
| CEP, brevet des collèges, BEPC | 6 |
| CAP, BEP ou équivalent | 22 |
| Baccalauréat | 17 |
| Bac+2 | 11 |
| Bac+3 ou Bac+4 | 9 |
| Bac+5 et plus | 10 |
| En cours d’études | — |

*Note* : Référence = population NON SCOLARISÉE de 15 ans ou plus, France entière, recensement INSEE 2022 (champ adulte général, c'est la marge pertinente pour redresser un échantillon grand public). ATTENTION au champ d'âge : si l'enquête cible plutôt les 25-64 ans, la structure est nettement plus diplômée (INSEE 2023/2024, 25-64 ans : aucun diplôme/CEP ~12 %, brevet ~4 %, CAP-BEP ~18 %, bac ~22 %, supérieur ~44 % dont bac+2 ~12 %, bac+3/4 ~10-14 %, bac+5+ ~18 % et jusqu'à ~26 % chez les 25-34 ans) — choisir la marge selon la population visée. La modalité « En cours d’études » n'a PAS de référence dans ce cadre : la marge porte sur la population non scolarisée (par construction, les personnes en cours d'études en sont exclues), donc pct=null ; ce sont les ~5 modalités diplôme qui doivent être redressées sur 100 %. Les « bac+2 / bac+3-4 / bac+5+ » correspondent à la décomposition INSEE du « diplôme du supérieur » ; je les ai regroupés depuis les nomenclatures détaillées du recensement. Les % ont été arrondis à l'entier et calés pour sommer ~100 (25+6+22+17+11+9+10 = 100). Données INSEE diffusées sous forme de bases téléchargeables (xlsx/csv) : les valeurs exactes au dixième sont à extraire de base-cc-diplomes-formation-2022 ; chiffres ici cohérents avec les ordres de grandeur publiés par l'INSEE.

## `revenu_foyer`  
**Année** : 2024 (extrapolé) à partir de la structure 2015, source de référence : distribution du revenu disponible des ménages · **Somme** : 100.0 %  
**Source** : INSEE-DGFiP-Cnaf-Cnav-CCMSA, enquête Revenus fiscaux et sociaux (ERFS) — « Distribution du revenu disponible des ménages », Les revenus et le patrimoine des ménages, Insee Références éd. 2018 (données 2015), https://www.insee.fr/fr/statistiques/fichier/3549496/REVPMEN18_F1.3_distri-RDM.pdf ; actualisé via les niveaux de vie 2022 (https://www.insee.fr/fr/statistiques/8242355) et le RDB des ménages 2024 (https://www.insee.fr/fr/statistiques/8574712).

| Modalité | % réel |
|---|---|
| Moins de 650 € | 5 |
| 650 à 999 € | 3 |
| 1 000 à 1 499 € | 6 |
| 1 500 à 1 999 € | 14 |
| 2 000 à 2 499 € | 12 |
| 2 500 à 2 999 € | 11 |
| 3 000 à 3 999 € | 18 |
| 4 000 à 5 999 € | 19 |
| 6 000 € et plus | 12 |

*Note* : RÉFÉRENT CHOISI = revenu disponible PAR MÉNAGE (et non niveau de vie par personne, qui divise par les unités de consommation). C'est la marge pertinente pour une question 'revenu du foyer' libellée en € PAR MOIS (hypothèse retenue : tranches mensuelles, ménage entier). Données socle = table INSEE 'Distribution du revenu disponible des ménages' (France métropolitaine, ménages au revenu fiscal positif ou nul, personne de référence non étudiante), ERFS 2015 : déciles MENSUELS par ménage D1=1 136 €, D2=1 456 €, D3=1 760 €, D4=2 116 €, médiane D5=2 503 €, D6=2 922 €, D7=3 441 €, D8=4 113 €, D9=5 268 € (revenu moyen ménage ≈ 3 025 €/mois). MÉTHODE : (1) revalorisation des seuils 2015 d'environ +18 % pour approcher le niveau 2024 (croissance nominale cumulée du revenu disponible des ménages, cohérente avec le niveau de vie médian par personne passé de 20 300 €/an en 2015 à 24 330 €/an en 2022 puis hausse 2023-2024) ; seuils mensuels 2024 estimés ≈ D1 1 340, D2 1 718, D3 2 077, D4 2 497, D5 2 954, D6 3 448, D7 4 060, D8 4 853, D9 6 216 € ; (2) interpolation linéaire à l'intérieur de chaque bande de déciles (et linéaire depuis 0 dans la première bande) pour répartir la population dans les tranches du formulaire ; (3) arrondi à l'entier en garantissant une somme = 100 %. RÉSERVES IMPORTANTES : a) l'INSEE ne publie pas de tabulation officielle exactement calée sur ces 9 tranches mensuelles — les % sont donc des ESTIMATIONS par interpolation, pas des chiffres bruts INSEE ; les seuils 2024 sont extrapolés (la dernière distribution PAR MÉNAGE détaillée et publique remonte à 2015). b) Si le formulaire entend 'revenu du foyer' comme un revenu NET PERÇU (avant impôt) ou un autre concept, la marge diffère ; ici c'est le revenu DISPONIBLE (après impôts directs et après prestations sociales). c) Champ France métropolitaine ; les DROM (revenus plus bas) décaleraient légèrement la distribution vers le bas. d) Si les tranches devaient en réalité être interprétées en revenu PAR PERSONNE (niveau de vie), il faudrait utiliser les déciles par UC (D1≈1 080 €/mois, médiane≈2 030 €/mois, D9≈3 650 €/mois en 2022) et la distribution serait fortement décalée vers le bas — à clarifier avec le concepteur du formulaire. Aucune modalité 'NSPP/Autre' n'est présente ; toutes les tranches sont substantielles et somment à 100 %.

## `logement`  
**Année** : 2025 (statut d'occupation au 1er janvier 2025) ; 2020 pour le sans-domicile · **Somme** : 100.0 %  
**Source** : INSEE, Statut d'occupation des résidences principales (série révisée, données au 1er janvier 2025) — https://www.insee.fr/fr/statistiques/2415555 ; INSEE Première n°2090, Conditions de logement début 2024 — https://www.insee.fr/fr/statistiques/8727513 ; Fondation Abbé Pierre / INSEE enquête Sans-domicile pour l'estimation des personnes sans domicile

| Modalité | % réel |
|---|---|
| Propriétaire | 57.4 |
| Locataire du parc privé | 22.8 |
| Locataire d’un logement social (HLM) | 17.6 |
| Hébergé·e gratuitement en logement privé | 2.2 |
| Hébergé·e en logement collectif | — |
| Sans domicile | — |

*Note* : Base = résidences principales (ménages ordinaires) en France hors Mayotte, ~31,7 millions de logements. Source : INSEE, tableau 'Statut d'occupation des résidences principales', série révisée, valeurs au 1er janvier 2025. Détail INSEE : propriétaires 57,4 % (dont 34,9 % sans emprunt en cours + 22,6 % accédants), locataires 40,4 % (dont 22,8 % bailleurs privés / secteur libre + 17,6 % bailleurs sociaux : HLM, SEM, État, collectivités), logés gratuitement 2,2 %. Les quatre premières modalités somment 100,0 % (57,4 + 22,8 + 17,6 + 2,2) car elles couvrent l'intégralité des ménages en résidence principale. MAPPING ET LIMITES : (1) 'Hébergé·e gratuitement en logement privé' = catégorie INSEE 'logé gratuitement' (2,2 %), qui recouvre principalement l'hébergement gratuit chez un tiers en logement privé — c'est l'équivalent le plus proche. (2) 'Hébergé·e en logement collectif' (foyers de travailleurs, résidences sociales, maisons de retraite/EHPAD, internats, communautés, casernes…) : pct=null car ces personnes relèvent des 'communautés / hors ménages ordinaires' et sont EXCLUES de la base 'résidences principales' du tableau de référence ; à titre indicatif l'INSEE dénombre environ 1,6 million de personnes vivant en communauté au recensement (~2,4 % de la population), mais ce chiffre n'est pas homogène avec la répartition par statut d'occupation et ne doit pas être additionné aux 100 % ci-dessus. (3) 'Sans domicile' : pct=null car hors champ du recensement des résidences principales ; l'enquête INSEE/INED 'Sans-domicile' (dernière vague exploitée 2012, ~141 500 personnes sans domicile dont ~30 000 enfants ; estimations Fondation Abbé Pierre ~330 000 personnes sans domicile en 2024) situe cette population autour de 0,2 à 0,5 % de la population adulte selon la définition retenue — part très faible et marge nationale incertaine, à ne pas additionner aux 100 %. En pratique pour le redressement par quotas, recommander de répartir/ignorer les deux dernières modalités (très marginales et sous-représentées par construction dans une enquête en ligne ou par téléphone auprès de ménages ordinaires).

## `type_commune`  
**Année** : 2017-2021 (RP 2017 pour la grille à 4 niveaux ; grille à 7 niveaux 2022, géographie communale 2021/2024) · **Somme** : 100.0 %  
**Source** : INSEE — « 38 % de la population française vit dans une commune densément peuplée », Insee Focus n°169, 2019 (données RP 2017) : https://www.insee.fr/fr/statistiques/4252859 ; INSEE — Grille communale de densité à 7 niveaux, Documents de travail n°2022-18 et page « La grille de densité 2022/2025 » : https://www.insee.fr/fr/statistiques/6686472 et https://www.insee.fr/fr/information/8571524 ; INSEE — « 1.3 Grille de densité communale », La France et ses territoires : https://www.insee.fr/fr/statistiques/5039883

| Modalité | % réel |
|---|---|
| Une grande ville ou une métropole (100 000 habitant·es et plus) | 38 |
| Une ville moyenne (20 000 à 100 000) | 17 |
| Une petite ville (2 000 à 20 000) | 9 |
| Une commune de banlieue ou de périphérie | 4 |
| Un village ou un bourg rural (moins de 2 000) | 28 |
| Une commune rurale isolée | 4 |

*Note* : AVERTISSEMENT MÉTHODOLOGIQUE FORT : ces six libellés constituent une typologie DÉCLARATIVE / de PERCEPTION (comment le·la répondant·e décrit sa propre commune) qui mélange deux logiques INSEE distinctes — d'une part des tranches de TAILLE de population (100 000+, 20 000–100 000, 2 000–20 000, <2 000), d'autre part une logique de POSITION morphologique (« banlieue/périphérie », « rurale isolée »). Aucun zonage officiel ne se mappe terme à terme sur ces six modalités, et elles ne sont pas mutuellement exclusives dans les nomenclatures INSEE (une commune de banlieue a aussi une taille ; un village peut être « isolé »). La distribution ci-dessous est donc une TABLE DE CORRESPONDANCE CONSTRUITE, pas une marge officielle pour ces libellés exacts. Backbone retenu = grille communale de densité INSEE, seul classement officiel qui distingue centres urbains, ceintures/banlieues, petites villes, bourgs ruraux et rural isolé. Ancrages officiels solides (Insee Focus 169, RP 2017) : grille à 4 niveaux = densément peuplé 38 % (≈25 M hab., 774 communes / 2 %), densité intermédiaire 30 %, peu dense 29 %, très peu dense 4 % (les communes : 2 % / 10 % / 54 % / 34 %). Sous-découpage à 7 niveaux (Doc. travail 2022-18) : grands centres urbains ≈38 % ; les 30 % de densité intermédiaire se répartissent entre centres urbains intermédiaires (≈17 %), ceintures urbaines (≈4 %) et petites villes (≈9 %) ; les ≈33 % ruraux se répartissent entre bourgs ruraux + rural à habitat dispersé (≈28–29 %, les bourgs ruraux regroupant ~la moitié de la pop. rurale) et rural à habitat très dispersé (≈3–4 %). MAPPING APPLIQUÉ : grande ville/métropole←grands centres urbains (38) ; ville moyenne←centres urbains intermédiaires (17) ; petite ville←petites villes (9) ; banlieue/périphérie←ceintures urbaines (4 — sous-estimé : en perception déclarative cette part serait nettement plus forte car beaucoup d'habitant·es de grandes agglos se déclarent « en banlieue » plutôt qu'« en métropole », ce que la grille morphologique ne capte pas) ; village/bourg rural←bourgs ruraux + rural dispersé (28) ; rurale isolée←rural très dispersé (4). Total = 100 (arrondi : 38+17+9+4+28+4=100). LIMITES : (1) en enquête réelle, attendez-vous à un fort report perceptif des « grandes villes » vers « banlieue/périphérie » et des « villages » vers « rurale isolée » ; ces pourcentages morphologiques sont à utiliser comme borne basse pour les modalités de position. (2) Les seuils de taille des libellés (ex. 100 000) ne coïncident pas exactement avec les seuils de densité (un grand centre urbain au sens densité peut compter <100 000 hab.). (3) Si l'objectif est un redressement strict par TAILLE de commune, utiliser plutôt la nomenclature par taille d'unité urbaine (Insee Focus 210, RP 2017 : agglo de Paris 16 %, UU 100 000+ hors Paris ≈31 %, 50–100 000 ≈8 %, 20–50 000 ≈7 %, 10–20 000 ≈5 %, 5–10 000 ≈6 %, 2–5 000 ≈7 %, communes rurales hors UU ≈21 %) — mais cette nomenclature n'a pas de modalité « banlieue » ni « rurale isolée ». Aucune abstention/NSPP ici (variable factuelle de cadre de vie) ; prévoir néanmoins une modalité « Ne sait pas / ne souhaite pas répondre » à pct=null hors normalisation.

## `region_residence`  
**Année** : 2023 (populations légales INSEE millésimées 2023, publiées fin 2025 ; structure quasi identique aux estimations au 1er janvier 2025) · **Somme** : 100.0 %  
**Source** : INSEE — Estimations de population / Populations légales par région. Estimation de la population au 1er janvier 2025 : https://www.insee.fr/fr/statistiques/8331297 ; reprise des populations régionales : https://fr.wikipedia.org/wiki/R%C3%A9gion_fran%C3%A7aise

| Modalité | % réel |
|---|---|
| Auvergne-Rhône-Alpes | 12.01 |
| Bourgogne-Franche-Comté | 4.1 |
| Bretagne | 5.05 |
| Centre-Val de Loire | 3.78 |
| Corse | 0.52 |
| Grand Est | 8.14 |
| Hauts-de-France | 8.77 |
| Île-de-France | 18.23 |
| Normandie | 4.9 |
| Nouvelle-Aquitaine | 9 |
| Occitanie | 8.96 |
| Pays de la Loire | 5.72 |
| Provence-Alpes-Côte d’Azur | 7.64 |
| Guadeloupe | 0.56 |
| Martinique | 0.53 |
| Guyane | 0.43 |
| La Réunion | 1.3 |
| Mayotte | 0.38 |

*Note* : Distribution de la population RÉSIDANTE TOTALE (tous âges) par région, et non strictement adulte : l'INSEE ne publie pas la ventilation de la population majeure par région dans cette source. La structure adulte est très proche en métropole (la part des mineurs y varie peu), MAIS deux DROM (Mayotte et Guyane) sont beaucoup plus jeunes que la moyenne : dans une population strictement 18 ans et +, leur poids serait sensiblement plus faible que le % affiché (≈ -40 % pour Mayotte, ≈ -20 % pour Guyane), à corriger si la cible est exclusivement adulte. Total de référence = 68 350 798 habitants (France entière, 18 régions). Les % somment à 100,02 après arrondi à 2 décimales (léger sur-arrondi non réalloué). Hiérarchie : Île-de-France (18,2 %) loin devant, puis Auvergne-Rhône-Alpes (12,0 %), Nouvelle-Aquitaine, Occitanie, Hauts-de-France, Grand Est. Les 5 DROM pèsent ensemble ≈ 3,2 %. Aucune modalité null : la région de résidence est exhaustive et chaque modalité a une référence nationale.

## `situation_maritale`  
**Année** : 2017 (état matrimonial légal) ; 2020 (type d'union pour distinguer PACS / union libre) · **Somme** : 99.5 %  
**Source** : INSEE — État matrimonial légal des personnes selon le sexe (1er janv. 2017), https://www.insee.fr/fr/statistiques/2381496 ; INSEE — Couples-Familles-Ménages / vie en couple selon le type d'union 2020, https://www.insee.fr/fr/statistiques/8268828

| Modalité | % réel |
|---|---|
| Marié·e | 43 |
| Pacsé·e | 4 |
| En couple (union libre, concubinage) | 13 |
| Célibataire | 23 |
| Divorcé·e ou séparé·e | 9 |
| Veuf·ve | 7.5 |

*Note* : ATTENTION : les six modalités du formulaire MÉLANGENT deux concepts INSEE qui ne sont PAS directement additifs, d'où une répartition reconstruite (pas une marge officielle clé en main). 1) L'INSEE publie l'état matrimonial LÉGAL des 15 ans ou plus (1er janv. 2017, dernière année complète — non recalculé depuis 2018 car les divorces par notaire ne sont plus captés) : Célibataire 40,9 %, Marié·e 43,0 %, Veuf·ve 7,5 %, Divorcé·e 8,6 %. Mais ce concept légal classe les pacsés et les concubins comme 'célibataires' (ou selon leur statut antérieur), donc la modalité 'Célibataire' du recensement n'égale PAS 'célibataire = sans conjoint' au sens du formulaire. 2) Le formulaire ajoute 'Pacsé·e' et 'En couple (union libre)', concepts de situation conjugale de FAIT. Parmi les personnes vivant en couple, ~72 % sont mariées, ~7 % pacsées, ~21 % en union libre (INSEE 2016) ; les pacsés et concubins sont juridiquement célibataires (ou divorcés/veufs) au sens légal. ESTIMATION reconstruite pour mapper les six options sur ~100 % de la population adulte (18 ans+) : j'ai (a) gardé Marié·e ≈ 43 %, Veuf·ve ≈ 7,5 %, Divorcé·e/séparé·e ≈ 9 % (légal 8,6 % + un peu de séparés de fait non divorcés) ; (b) sorti du bloc 'légalement célibataire' (40,9 %) les pacsés (≈ 4 % de la population adulte) et les concubins en union libre (≈ 13 %, soit ~1 personne sur 5 des adultes vit en union libre tous statuts confondus, ramené ici aux seuls non-mariés), laissant Célibataire (réellement sans conjoint) ≈ 23 %. Ces valeurs sont des ORDRES DE GRANDEUR cohérents avec les sources mais dépendent de la façon dont les répondants s'auto-classent (un marié peut cocher 'Marié·e' ou, s'il est séparé de fait, 'Divorcé·e ou séparé·e'). Pour un redressement rigoureux, privilégier soit les 4 modalités légales strictes, soit une marge spécifique sur 'situation conjugale de fait'. Somme des modalités substantielles ≈ 99,5 %, arrondie.

## `composition_foyer`  
**Année** : 2021 (recensement / enquête INSEE sur les ménages) · **Somme** : 96.5 %  
**Source** : INSEE — Ménages, couples et familles, 1er janv. 2021, https://www.insee.fr/fr/statistiques/8242327 ; INSEE — Couples-Familles-Ménages en 2021, https://www.insee.fr/fr/statistiques/8268828

| Modalité | % réel |
|---|---|
| Je vis seul·e | 38 |
| En couple sans enfant | 25 |
| En couple avec enfant(s) | 24 |
| Famille monoparentale | 9.5 |
| Je vis chez mes parents ou ma famille | — |
| En colocation ou logement partagé | — |
| Autre configuration | — |

*Note* : Référence = répartition des MÉNAGES (et non des individus) selon le type, INSEE au 1er janv. 2021 (France hors Mayotte, 30,6 millions de ménages). Chiffres officiels par ménage : personnes seules 38 %, couples sans enfant 25 %, couples avec enfant(s) 24 %, familles monoparentales 9,5 %, ménages complexes 3,5 %. PROBLÈME DE CONCEPT : la marge INSEE porte sur les ménages, alors que le formulaire interroge l'INDIVIDU sur sa configuration de vie — les deux ne coïncident pas (ex. un couple avec 2 enfants = 1 ménage 'couple avec enfants' mais 4 personnes, dont 2 enfants qui, eux, cocheraient 'Je vis chez mes parents'). Si l'on veut une marge en POPULATION (part des individus dans chaque type de ménage), l'INSEE donne : personnes seules 18 %, couples sans enfant 23 %, couples avec enfant(s) 42 %, familles monoparentales 11 %, ménages complexes 5 %. Le formulaire éclate en plus le 'ménage complexe' en trois modalités non distinguées par l'INSEE : 'chez mes parents/famille', 'colocation/logement partagé', 'autre configuration' — il n'existe pas de marge nationale officielle pour ces sous-postes (pct=null), à l'exception du fait que la cohabitation intergénérationnelle des jeunes adultes (~par ex. les 18-29 ans vivant chez leurs parents) et les colocations relèvent en partie des 'enfants majeurs au domicile parental' (souvent comptés dans le ménage de leurs parents) ou des ménages complexes. RECOMMANDATION : pour redresser une population d'adultes répondant individuellement, utiliser la répartition par MÉNAGE ci-dessous (la personne de référence) plutôt que la part en population, et traiter les 3 dernières modalités comme un résidu commun ≈ 3,5 % à répartir. Les % donnés (ménages) somment ≈ 100 % avec les 3,5 % de ménages complexes répartis indicativement sur les 3 dernières lignes ; faute de ventilation officielle, ces 3 lignes sont marquées null sauf indication.

## `secteur_activite`  
**Année** : 2023-2024 · **Somme** : 99.0 %  
**Source** : INSEE — Emploi total et statut (Note de conjoncture / Insee Références « Marché du travail » fin 2024) https://www.insee.fr/fr/statistiques/8376894 ; INSEE Première n°2052 « L'emploi dans la fonction publique en 2023 » https://www.insee.fr/fr/statistiques/8572076 ; Observatoire national de l'ESS / ESS France 2023-2024 https://www.ess-france.org/chiffre-28-981-c-est-le-solde-net-d-emplois-dans-l-ess-sur-un-an-a-fin-juin-2023

| Modalité | % réel |
|---|---|
| Secteur public | 19 |
| Secteur privé | 60 |
| Économie sociale et solidaire | 9 |
| À mon compte / indépendant·e | 11 |
| Je n’ai jamais travaillé | — |

*Note* : Marge calculée sur les PERSONNES EN EMPLOI (≈30,4 M fin 2024 selon l'INSEE : 27,0 M de salarié·es + 3,4 M de non-salarié·es), pas sur l'ensemble des adultes. Décomposition : fonction publique ≈5,8 M agents fin 2023 (Insee Première 2052), soit ≈19 % de l'emploi total ; non-salarié·es/indépendant·es ≈3,4 M, soit ≈11 % ; salarié·es du privé ≈21,2 M (27,0−5,8). L'ESS (≈2,7 M de salarié·es, ≈14 % de l'emploi privé salarié, source Observatoire national de l'ESS) est JURIDIQUEMENT dans le privé : pour éviter le double comptage je l'ai sortie du « secteur privé » (≈9 % de l'emploi total) et réduit d'autant le privé (60 % au lieu de ≈70 %). Cette ventilation est une convention statistique : dans un sondage, beaucoup de salarié·es de l'ESS se déclarent « secteur privé », donc l'ESS est probablement sous-déclarée et le privé sur-déclaré par rapport à cette marge. Les % somment ≈99 (arrondis). « Je n'ai jamais travaillé » = pct null : la question porte sur le secteur d'activité des personnes ayant un emploi ; cette modalité n'a pas de marge dans l'emploi. Pour information, rapportée à l'ensemble de la population adulte (≈54 M de 15 ans ou +), la part de personnes n'ayant jamais travaillé est faible hors étudiant·es/jeunes (de l'ordre de quelques %), mais aucune marge officielle directe ne correspond exactement à ce libellé.

## `patrimoine`  
**Année** : 2024 · **Somme** : 100.0 %  
**Source** : INSEE — Enquête Histoire de vie et Patrimoine 2023-2024, Insee Focus n°354 « La détention de patrimoine des ménages en 2024 » https://www.insee.fr/fr/statistiques/8569009 ; Insee Focus n°371 « Les montants de patrimoine détenus par les ménages en 2024 » https://www.insee.fr/fr/statistiques/8672665

| Modalité | % réel |
|---|---|
| Aucune épargne | 13 |
| Épargne de précaution (moins de 3 mois de revenus) | 37 |
| Épargne confortable | 30 |
| Patrimoine immobilier (hors résidence principale) | 20 |

*Note* : ATTENTION : ces modalités ne sont PAS exclusives dans les libellés (on peut avoir de l'épargne ET de l'immobilier de rapport), alors qu'un sondage les présente probablement comme un choix unique ; il faut donc les lire comme un GRADIENT croissant de patrimoine, ce qui m'oblige à répartir et non à recopier un tableau INSEE unique. Ancrage sur l'enquête Histoire de vie et Patrimoine 2023-2024 (terrain juin 2023-janvier 2024) : début 2024, 90,5 % des ménages détiennent un produit financier, 86,9 % un livret d'épargne, 61,2 % de l'immobilier, et 20,5 % de l'immobilier AUTRE que la résidence principale (résidence secondaire ou immobilier de rapport) — ce dernier chiffre cale la dernière modalité (≈20 %). « Aucune épargne » : ≈9-10 % des ménages n'ont aucun produit financier ; en y ajoutant les ménages à patrimoine quasi nul (compte courant seulement, sans capacité d'épargne), on atteint ≈13 %. Les ≈37 % « épargne de précaution » et ≈30 % « épargne confortable » sont une partition du reste, cohérente avec le fait qu'environ la moitié des ménages les moins dotés ne détiennent que livret A/compte courant (patrimoine médian ≈18 600 € pour le quart le moins doté) et que la capacité d'épargne croît fortement avec le niveau de vie. Les 4 % somment 100 par construction (répartition par l'analyste), mais la frontière 3 mois de revenus / « confortable » n'est pas une catégorie officielle INSEE : marge approchée, à traiter comme indicative.

## `aisance_financiere`  
**Année** : 2024 · **Somme** : 100.0 %  
**Source** : CRÉDOC — enquête « Conditions de vie et aspirations des Français », question sur l'équilibre du budget du foyer (vagues 2023-2024), reprise par la Banque de France/Observatoire de l'inclusion bancaire et le Centre d'observation de la société https://www.credoc.fr/publications/les-comportements-budgetaires-des-menages-en-periode-dinflation ; https://www.banque-france.fr/fr/communiques-de-presse/les-menages-adaptent-leurs-comportements-budgetaires-pour-limiter-les-incidents-bancaires

| Modalité | % réel |
|---|---|
| Tu vis confortablement | 5 |
| Ça va, c’est correct | 43 |
| C’est juste, il faut faire attention | 35 |
| Tu y arrives difficilement | 7 |
| Tu ne t’en sors pas sans t’endetter | 10 |

*Note* : Marge issue de la question CRÉDOC sur l'équilibre du budget du foyer (échelle quasi identique aux libellés du formulaire), vague récente (2023-2024). Distribution publiée : ≈5 % « mettent beaucoup d'argent de côté / vivent confortablement », ≈43 % « mettent un peu d'argent de côté / ça va », ≈35 % « bouclent tout juste leur budget, il faut faire attention », ≈6-7 % « y arrivent de plus en plus difficilement / craignent de basculer », ≈10 % « ne peuvent pas y arriver sans faire de dettes ou sans être à découvert ». J'ai mappé « Tu y arrives difficilement » sur la catégorie « difficultés croissantes » (≈7 %) et « Tu ne t'en sors pas sans t'endetter » sur la catégorie « découvert/dettes » (≈10 %). Les % somment 100. LIMITE : la mesure CRÉDOC est SUBJECTIVE (auto-évaluation), donc sensible à l'inflation et au libellé exact ; selon les années et les instituts (versions à 3 ou 5 modalités), les bornes bougent de quelques points (ex. version courte : ≈49 % « se serrent la ceinture », ≈39 % « s'en sortent », ≈11 % « à découvert »). Pas de marge INSEE strictement équivalente : l'item EU-SILC/SRCV « capacité à joindre les deux bouts » a 6 modalités différentes. À utiliser comme référence de redressement indicative, pas comme un résultat électoral certifié.

## `presidentielle_2022`  
**Année** : 2022 · **Somme** : 100.0 %  
**Source** : Ministère de l'Intérieur — Résultats officiels du 1er tour de l'élection présidentielle, 10 avril 2022. https://www.resultats-elections.interieur.gouv.fr/presidentielle-2022/ (synthèse également publiée au Journal officiel et reprise par l'INSEE/data.gouv.fr)

| Modalité | % réel |
|---|---|
| Nathalie Arthaud | 0.56 |
| Nicolas Dupont-Aignan | 2.06 |
| Anne Hidalgo | 1.75 |
| Yannick Jadot | 4.63 |
| Jean Lassalle | 3.13 |
| Marine Le Pen | 23.15 |
| Emmanuel Macron | 27.85 |
| Jean-Luc Mélenchon | 21.95 |
| Valérie Pécresse | 4.78 |
| Philippe Poutou | 0.77 |
| Fabien Roussel | 2.28 |
| Éric Zemmour | 7.07 |

*Note* : Pourcentages des SUFFRAGES EXPRIMÉS au 1er tour du 10 avril 2022 (résultats officiels Conseil constitutionnel / ministère de l'Intérieur). Inscrits : 48 752 339 ; votants : 36 020 575 ; abstention : 26,31 % des inscrits. Blancs : 1,52 % des votants ; nuls : 0,67 % des votants. Suffrages exprimés : 35 003 770. Détail des % exprimés : Macron 27,85 ; Le Pen 23,15 ; Mélenchon 21,95 ; Zemmour 7,07 ; Pécresse 4,78 ; Jadot 4,63 ; Lassalle 3,13 ; Roussel 2,28 ; Dupont-Aignan 2,06 ; Hidalgo 1,75 ; Poutou 0,77 ; Arthaud 0,56. Somme = 99,98 (écart d'arrondi officiel de 0,02 point, non redressé). RAPPEL MÉTHODE : ces % portent sur les exprimés, pas sur la population adulte totale ; pour redresser un échantillon il faut tenir compte de l'abstention réelle (26,31 % des inscrits) et de la part des non-inscrits (~5 à 8 % des majeurs estimés mal/non inscrits selon l'INSEE), modalités à traiter via une catégorie 'abstention / blanc-nul / non inscrit / pas en âge / NSPP' portée à part (pct=null ici).

## `presidentielle_2022_t2`  
**Année** : 2022 · **Somme** : 100.0 %  
**Source** : Ministère de l'Intérieur — Résultats officiels du 2nd tour de l'élection présidentielle, 24 avril 2022. https://www.resultats-elections.interieur.gouv.fr/presidentielle-2022/ (proclamation Conseil constitutionnel)

| Modalité | % réel |
|---|---|
| Emmanuel Macron | 58.54 |
| Marine Le Pen | 41.46 |

*Note* : Pourcentages des SUFFRAGES EXPRIMÉS au 2nd tour du 24 avril 2022 (résultats officiels). Macron 58,54 % ; Le Pen 41,46 % (somme = 100,00). Inscrits : 48 752 500 ; votants : 35 096 478 ; abstention : 28,01 % des inscrits (plus haute pour un 2nd tour de présidentielle depuis 1969). Blancs : 6,35 % des votants ; nuls : 2,25 % des votants — soit environ 3 millions de bulletins blancs+nuls, niveau record. ATTENTION REDRESSEMENT : ces deux % somment à 100 sur les seuls exprimés ; ils ne décrivent PAS la population adulte. Pour un quota il faut sortir à part l'abstention (28,01 % des inscrits), les blancs/nuls (8,60 % des votants) et les non-inscrits, regroupés dans une modalité 'abstention / blanc-nul / non inscrit / pas en âge / NSPP' (pct=null ici).

## `europeennes_2024`  
**Année** : 2024 · **Somme** : 100.0 %  
**Source** : Ministère de l'Intérieur, résultats définitifs des élections européennes du 9 juin 2024 (France entière) — https://www.archives-resultats-elections.interieur.gouv.fr/resultats/europeennes2024/ensemble_geographique/index.php (repris par Touteleurope.eu et Wikipédia)

| Modalité | % réel |
|---|---|
| RN (Bardella) | 31.37 |
| Besoin d’Europe (Hayer) | 14.6 |
| PS-Place publique (Glucksmann) | 13.83 |
| LFI (Aubry) | 9.89 |
| LR (Bellamy) | 7.25 |
| Écologistes (Toussaint) | 5.5 |
| Reconquête (Maréchal) | 5.47 |
| PCF (Deffontaines) | 2.36 |
| Alliance rurale (Lassalle) | 2.35 |
| Parti animaliste (Thouy) | 2.06 |
| Autres listes (cumul) | 5.32 |

*Note* : Pourcentages des SUFFRAGES EXPRIMÉS (résultats officiels définitifs, France entière). Les 10 listes nommées totalisent 94,68 % ; 'Autres listes (cumul)' = 5,32 % est le résidu réparti sur les 28 autres listes qui n'ont pas eu d'élu (sur 38 listes au total ; seules 7 ont dépassé le seuil de 5 % et obtenu des sièges). Les % somment exactement à 100,00. ABSTENTION RÉELLE : 48,51 % des inscrits (participation 51,49 %). Votes BLANCS : 1,40 % et NULS : 1,49 % — mais ces taux sont calculés sur les votants, PAS sur les exprimés, ils n'entrent donc pas dans la somme ci-dessus (qui est en exprimés). Pour un redressement, appliquer ces % d'exprimés à la sous-population déclarant avoir voté ; traiter abstention/blanc/nul/'pas en âge'/NSPP comme catégories hors-champ (≈48,5 % d'abstention à modéliser séparément). Parti animaliste arrondi à 2 % par certaines sources, valeur fine 2,06 %.

## `gauche_droite`  
**Année** : 2025 · **Somme** : 100.0 %  
**Source** : CEVIPOF (Sciences Po) — Baromètre de la confiance politique, Vague 16, terrain OpinionWay 17 janv.–5 févr. 2025, 3 561 individus représentatifs (France). Question NOU1 'Sur une échelle de 0 à 10, où 0 = la gauche et 10 = la droite'. PDF résultats OpinionWay p.76-78 — https://www.opinion-way.com/wp-content/uploads/2025/02/OpinionWay-pour-le-CEVIPOF-Barometre-de-la-confiance-en-politique-Vague-16-Fevrier-2025-1.pdf ; analyse B. Cautrès, Revue Politique et Parlementaire — https://www.revuepolitique.fr/le-centrisme-existe-t-il-dans-lopinion/

| Modalité | % réel |
|---|---|
| 0-1 (très à gauche) | 4 |
| 2-3 | 14 |
| 4-6 (centre) | 33 |
| 7-8 | 18 |
| 9-10 (très à droite) | 10 |
| Ne se positionne pas | 21 |

*Note* : Auto-positionnement gauche-droite (0=gauche, 10=droite), base = ENSEMBLE des répondants (y compris les non-positionnés), source officielle CEVIPOF vague 16 / fév. 2025. Détail par point relevé dans le PDF OpinionWay (p.76) : 0=2 %, 1=2 %, 2=7 %, 3=7 %, 4=8 %, 5=15 %, 6=10 %, 7=9 %, 8=9 %, 9=5 %, 10=5 %, NSP=21 %. Regroupement selon les bornes du formulaire : 0-1=4 % ; 2-3=14 % ; 4-6=8+15+10=33 % ; 7-8=18 % ; 9-10=10 % ; NSP=21 %. Somme = 100 % exactement (aucun arrondi forcé). ATTENTION : la borne '4-6 (centre)' du formulaire (33 %) NE coïncide PAS avec le 'centre' au sens CEVIPOF, qui regroupe différemment (CEVIPOF publie : extrême gauche 4 %, gauche 22 %, centre 15 %, droite 28 %, extrême droite 10 %, NSP 21 %). J'ai utilisé la distribution point-par-point — seule façon de mapper exactement aux bornes 0-1/2-3/4-6/7-8/9-10 demandées. 'Ne se positionne pas' a ici une VRAIE référence nationale mesurée (21 %, NSP), donc renseignée et non null ; à utiliser comme strate à part entière (ou à exclure puis renormaliser sur les 79 % positionnés si le formulaire force un choix). Le refus de se positionner est élevé et structurellement croissant : c'est une limite connue pour le redressement politique.

## `confiance_institutions`  
**Année** : 2025 · **Somme** : 691.0 %  
**Source** : CEVIPOF / OpinionWay - Baromètre de la confiance politique, Vague 16 (terrain 17 janv. - 5 fév. 2025, 3561 personnes, France), Q13 (institutions politiques) et Q25 (organisations). https://www.sciencespo.fr/cevipof/fr/actualites/barometre-de-la-confiance-politique-du-cevipof-2025-le-grand-desarroi-democratique/ ; document complet : https://sciencespo.hal.science/hal-04975385/document ; résultats CESE : https://www.lecese.fr/sites/default/files/documents/CEVIPOF_Resultats_BarometreConfiancePolitique_Vague16_Fev2025.pdf

| Modalité | % réel |
|---|---|
| La science | 80 |
| L’hôpital public | 76 |
| Les associations | 63 |
| Les syndicats | 38 |
| La justice | 44 |
| Les médias | 31 |
| La police | 71 |
| L’armée | 74 |
| Les collectivités locales (mairie) | 58 |
| Le gouvernement | 23 |
| L’Assemblée nationale | 24 |
| Les partis politiques | 16 |
| Les banques | 43 |
| Les réseaux sociaux | 18 |
| L’Union européenne | 32 |

*Note* : ATTENTION : ce ne sont PAS des proportions qui somment à 100. Chaque % indique la part de Français déclarant 'tout à fait' + 'plutôt' confiance dans CHAQUE acteur, item par item (questions séparées Q13/Q25 du baromètre CEVIPOF vague 16, fév. 2025). Ce sont des variables indépendantes : utiliser chaque % comme marge cible d'une question oui/non de confiance pour l'institution correspondante, et NON comme une répartition d'un choix unique. Correspondances exactes avec les libellés CEVIPOF : 'La science'=La science (80%) ; 'L'hôpital public'=Les hôpitaux (76%) ; 'Les associations'=Les associations (63%) ; 'Les syndicats'=Les syndicats (38%) ; 'La justice'=La justice (44%) ; 'Les médias'=Les médias (31%) ; 'La police'=La police (71%) ; 'L'armée'=L'armée (74%) ; 'Les collectivités locales (mairie)'=Le conseil municipal (58%) - à noter que 'le maire de votre commune' obtient 61% ; 'Le gouvernement'=Le gouvernement (23%) ; 'L'Assemblée nationale'=L'Assemblée nationale (24%) ; 'Les partis politiques'=Les partis politiques (16%) ; 'Les banques'=Les banques (43%) ; 'Les réseaux sociaux'=Les réseaux sociaux (18%) ; 'L'Union européenne'=L'Union européenne (32%). Précision : 'la science' renvoie ici aux chercheurs/à la science (Q25). Si le formulaire mesure une confiance ordinale (très/plutôt/pas), ces % sont la cible du sous-total 'confiance'. Si le formulaire demande une SÉLECTION (cocher les institutions de confiance), traiter chaque % comme taux d'adoption attendu et ne PAS forcer la somme à 100.

## `source_info_politique`  
**Année** : 2025 · **Somme** : 182.0 %  
**Source** : Reuters Institute - Digital News Report 2025, fiche France (terrain janv.-fév. 2025, panel YouGov ~2000 répondants/pays). https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/france ; synthèses FR : https://fr.themedialeader.com/le-paysage-mediatique-francais-est-marque-par-une-defiance-persistante-selon-le-digital-news-report-2025-de-reuters/ et https://mediaculture.fr/digital-news-report-2025-les-12-tendances-cles-a-connaitre/

| Modalité | % réel |
|---|---|
| La télévision | 59 |
| La radio | — |
| La presse écrite | 13 |
| Les sites et applications d’information en ligne | 64 |
| Les réseaux sociaux | 37 |
| Les podcasts ou vidéos en ligne | 9 |
| Les discussions avec l’entourage | — |

*Note* : ATTENTION : question MULTI-RÉPONSE (part des Français utilisant CHAQUE canal pour s'informer au cours d'une semaine type), les % NE somment PAS à 100 (un même répondant cumule plusieurs sources). Chiffres officiels Reuters DNR 2025 pour la France, usage hebdomadaire : Télévision = 59% (-4 pts/2024) ; sites et applications d'information en ligne = 64% (Reuters classe le 'online' à 64%, dont une part recouvre les réseaux sociaux) ; Réseaux sociaux = 37% ; Presse écrite (print) = 13% (-33 pts en 10 ans) ; Podcasts/vidéos d'info en ligne = 9% (figure 'podcasts d'info' ; les vidéos en ligne hors podcasts ne sont pas isolées dans la fiche France accessible). LIMITES : la fiche France 2025 publiquement accessible ne donne PAS de % hebdomadaire chiffré isolé pour 'La radio' ni pour 'Les discussions avec l'entourage' (bouche-à-oreille) - Reuters indique seulement que la radio linéaire est en déclin lent ; ces deux modalités sont donc mises à null faute de chiffre national officiel extractible (ne pas inventer). Repère complémentaire : 19% des Français citent les réseaux sociaux comme source PRINCIPALE d'information (en hausse continue depuis 10 ans). Pour un redressement par quotas sur une question 'principale source' (choix unique sommant à 100), ces marges multi-réponses ne conviennent pas telles quelles ; les utiliser comme taux d'usage par canal. Source officielle alternative pour radio/TV : CRÉDOC, Baromètre du numérique 2025 (https://www.credoc.fr/publications/barometre-du-numerique-edition-2025), qui mesure l'écoute radio/TV mais pas une répartition 'source d'info' par les 7 canaux du formulaire.

## `formes_engagement`  
**Année** : 2021 (Fondation Jean-Jaurès/BVA) et 2024 (CEVIPOF) — voir note · **Somme** : 223.0 %  
**Source** : Fondation Jean-Jaurès / BVA, « Les Français et l'engagement », juillet 2021 — https://www.jean-jaures.org/publication/les-francais-et-lengagement/ ; CEVIPOF, Baromètre de la confiance politique vague 15, février 2024 — https://www.sciencespo.fr/cevipof/fr/etudes-enquetes/barometre-confiance-politique/

| Modalité | % réel |
|---|---|
| Signer une pétition | 54 |
| Participer à une manifestation | 25 |
| Faire grève | 17 |
| Boycotter des produits | 45 |
| Faire du bénévolat | 24 |
| Faire un don | 52 |
| Militer dans un parti | 2 |
| Militer dans un syndicat | 4 |
| Désobéissance civile | — |

*Note* : LIMITE MAJEURE : ce n'est PAS une variable à modalités exclusives sommant à 100. Chaque ligne est un pourcentage INDÉPENDANT de Français déclarant pratiquer / avoir pratiqué cette forme d'engagement (réponses multiples possibles). Ne pas redresser comme une partition. Sources de référence (pas de marge populationnelle « officielle » INSEE pour ces actes — meilleures estimations d'enquête) : pétition 54 %, don 52 %, boycott 45 % = registre individuel majoritaire ; manifestation 25 %, grève 17 % = registre collectif minoritaire (Fondation Jean-Jaurès/BVA 2021, échantillon représentatif national). Militer dans un parti ≈ 2 % et dans un syndicat ≈ 4 % = militants actifs (cohérent avec un taux d'adhésion partisane 2-3 % et syndicale ~10 % des salariés, tous ne militant pas). Bénévolat : 24 % de bénévoles associatifs (Recherches & Solidarités/IFOP 2024, 3 155 personnes 15+) ; ce taux monte à ~33-37 % si l'on inclut le bénévolat direct/informel hors association. Le CEVIPOF 2024 (cadrage « au cours des 12 derniers mois / récemment », plus restrictif) donne des valeurs plus basses et utiles en alternative : pétition 41 %, boycott 32 %, manifestation 16 %, grève 15 %. « Désobéissance civile » : aucune mesure nationale fiable et stable ; estimation très basse (de l'ordre de 3-6 % déclarant y avoir déjà participé selon enquêtes ponctuelles), donc pct=null par prudence. Choisir une seule source homogène (Jean-Jaurès OU CEVIPOF) si l'on veut comparer les lignes entre elles.

## `benevolat`  
**Année** : 2024 · **Somme** : 100.0 %  
**Source** : Recherches & Solidarités / IFOP, « La France bénévole 2024 » (19e édition), enquête janvier 2024, 3 155 personnes 15+ représentatives — https://recherches-solidarites.org/benevolat/

| Modalité | % réel |
|---|---|
| Bénévole (régulier ou occasionnel) | 24 |
| Non bénévole | 76 |

*Note* : 24 % des Français (15 ans et plus) sont bénévoles DANS UNE ASSOCIATION en 2024 (~12,5 M de personnes), dont ~9 % chaque semaine et ~7-8 % ponctuellement — ce qui correspond bien au libellé « régulier ou occasionnel ». Donc 76 % non bénévoles (au sens associatif). ATTENTION périmètre : si l'on inclut TOUTES les formes de bénévolat (associatif + bénévolat direct/de proximité hors association + autres organisations), le taux global de bénévoles atteint ~33-37 % et le « non bénévole » tombe à ~63-67 %. Le 24 % est le chiffre de référence le plus cité et le plus robuste pour le bénévolat associatif. Niveau pré-Covid retrouvé. Les % somment à 100 par construction (complément à 100).

## `pratique_syndicale`  
**Année** : 2019 (taux courant, DARES publ. 2023) ; structure passée d'après enquêtes DARES/conditions de travail · **Somme** : 100.0 %  
**Source** : DARES, « La syndicalisation en France », Dares Analyses n°6, février 2023 (données 2019) — https://dares.travail-emploi.gouv.fr/publication/de-l-adherent-au-responsable-syndical ; Centre d'observation de la société — https://www.observationsociete.fr/modes-de-vie/vie-politique-et-associative/une-france-tres-peu-syndiquee/

| Modalité | % réel |
|---|---|
| Adhérent·e actuellement | 11 |
| Anciennement | 16 |
| Jamais | 73 |

*Note* : RÉFÉRENCE = SALARIÉS (et non population adulte totale). Taux de syndicalisation courant ≈ 10,1-10,3 % des salariés en 2019 (DARES), arrondi à 11 % ici pour rester cohérent avec les enquêtes déclaratives « êtes-vous adhérent ». ~73 % des salariés déclarent n'avoir JAMAIS adhéré à un syndicat ; le solde (~16 %) a adhéré « anciennement » mais ne l'est plus. Les trois modalités somment à 100 (11+16+73) — j'ai ajusté l'« anciennement » comme résidu pour boucler à 100, car les enquêtes donnent un ordre de grandeur (15-16 %) plutôt qu'un chiffre figé. ATTENTION : rapporté à TOUTE la population adulte (incluant retraités, inactifs, indépendants), l'adhésion courante tombe à ~5 % ; rapporté aux seuls salariés c'est ~10-11 %. Choisir le dénominateur selon la cible du formulaire (actifs/salariés vs population générale). Public bien plus syndiqué (~18 %) que le privé (~8 %).

## `adhesion_organisation`  
**Année** : 2016 (INSEE, associations) ; 2019 (DARES, syndicats) ; estimations CEVIPOF/CRÉDOC (partis) · **Somme** : 103.0 %  
**Source** : INSEE, taux d'adhésion aux associations (enquête 2016) — https://www.insee.fr/fr/statistiques/2406371 ; DARES 2023 (syndicats) ; CEVIPOF / CRÉDOC (adhésion partisane) — https://www.observationsociete.fr/modes-de-vie/vie-politique-et-associative/les-francais-adherent-de-moins-en-moins-aux-associations-3/

| Modalité | % réel |
|---|---|
| Une association | 40 |
| Un syndicat | 5 |
| Un parti ou mouvement politique | 3 |
| Aucune | 55 |

*Note* : PROBLÈME STRUCTUREL : ces modalités ne sont PAS exclusives à la source (une même personne peut adhérer à une association ET à un syndicat). J'ai construit une partition approximative compatible avec un format « choix dominant / aucune » : Association 40 % (INSEE 2016 : 40 % des 16+ adhèrent à au moins une association, ~21,6 M) ; Syndicat ~5 % de la population adulte totale (≈10 % des salariés, dilués par retraités/inactifs) ; Parti ou mouvement politique ~2-3 % (taux d'adhésion partisane parmi les plus bas d'Europe). « Aucune » ≈ 55 % obtenu par complément pour boucler à 100 (40+5+3+55=103, léger sur-total dû au recouvrement association/syndicat ; ramener « Aucune » à ~52-55 % si l'on veut sommer exactement à 100). Si le formulaire autorise les réponses multiples, utiliser les pct bruts (assoc 40, synd 5, parti 3) sans « Aucune » comme complément. Données associations un peu anciennes (2016) faute d'actualisation INSEE plus récente sur le taux global ; tendance de fond à la baisse (~44 % début 2000s → 40 %).

## Sources (cumul)

- INSEE - Population par sexe et groupe d'âges (estimations au 1er janvier 2026, provisoires) : https://www.insee.fr/fr/statistiques/2381474
- INSEE - Bilan démographique 2025 (Insee Première n°2087) : https://www.insee.fr/fr/statistiques/8719824
- INSEE - Estimation de la population au 1er janvier 2025 : https://www.insee.fr/fr/statistiques/8331297
- INSEE - Estimations de population par sexe et âge au 1er janvier 2026 : https://www.insee.fr/fr/statistiques/2012692
- INSEE — Recensement de la population 2023 / Enquête Emploi 2023 : population de 15 ans ou plus par catégorie socioprofessionnelle. https://www.insee.fr/fr/statistiques/2381478
- INSEE — Nomenclature des professions et catégories socioprofessionnelles (PCS) 2020. https://www.insee.fr/fr/information/2406153
- INSEE — Emploi par catégorie socioprofessionnelle (actifs occupés). https://www.insee.fr/fr/statistiques/2489546
- https://www.insee.fr/fr/statistiques/8581488
- https://www.insee.fr/fr/statistiques/1893149
- https://www.insee.fr/fr/statistiques/8242337?sommaire=8242421
- https://www.insee.fr/fr/statistiques/8612520
- https://www.insee.fr/fr/statistiques/fichier/3549496/REVPMEN18_F1.3_distri-RDM.pdf
- https://www.insee.fr/fr/statistiques/5371205?sommaire=5371304
- https://www.insee.fr/fr/statistiques/8242355
- https://www.insee.fr/fr/statistiques/7758831?geo=METRO-1
- https://www.insee.fr/fr/statistiques/8574712?sommaire=8574832
- https://www.insee.fr/fr/statistiques/fichier/7941491/RPM24.pdf
- https://www.insee.fr/fr/statistiques/2415555
- https://www.insee.fr/fr/statistiques/8727513
- https://www.insee.fr/fr/statistiques/7700305
- https://www.insee.fr/fr/metadonnees/definition/c1068
- https://www.insee.fr/fr/metadonnees/source/serie/s1004
- INSEE, « 38 % de la population française vit dans une commune densément peuplée », Insee Focus n°169, 2019 (données RP 2017) : https://www.insee.fr/fr/statistiques/4252859
- INSEE, Grille communale de densité à 7 niveaux — Documents de travail n°2022-18 : https://www.insee.fr/fr/statistiques/6686472
- INSEE, « La grille de densité 2022 / 2025 » : https://www.insee.fr/fr/information/8571524
- INSEE, « 1.3 Grille de densité communale » (La France et ses territoires) : https://www.insee.fr/fr/statistiques/5039883
- INSEE, « Toujours plus d'habitants dans les unités urbaines », Insee Focus n°210, 2020 (répartition par taille d'unité urbaine, RP 2017) : https://www.insee.fr/fr/statistiques/4806684
- Géoconfluences (ENS de Lyon), « Grille de densité » : https://geoconfluences.ens-lyon.fr/glossaire/grille-de-densite
- https://www.insee.fr/fr/statistiques/8331297
- https://www.insee.fr/fr/statistiques/7752095
- https://fr.wikipedia.org/wiki/R%C3%A9gion_fran%C3%A7aise
- https://www.ined.fr/fr/tout-savoir-population/chiffres/france/structure-population/regions/
- https://www.insee.fr/fr/statistiques/2381496
- https://www.insee.fr/fr/statistiques/8268828
- https://www.insee.fr/fr/statistiques/8242327
- https://www.insee.fr/fr/statistiques/3146177
- https://www.insee.fr/fr/statistiques/8560677?sommaire=8560708
- https://www.insee.fr/fr/statistiques/8376894
- https://www.insee.fr/fr/statistiques/8572076
- https://www.ess-france.org/chiffre-28-981-c-est-le-solde-net-d-emplois-dans-l-ess-sur-un-an-a-fin-juin-2023
- https://www.insee.fr/fr/statistiques/8569009
- https://www.insee.fr/fr/statistiques/8672665
- https://www.credoc.fr/publications/les-comportements-budgetaires-des-menages-en-periode-dinflation
- https://www.banque-france.fr/fr/communiques-de-presse/les-menages-adaptent-leurs-comportements-budgetaires-pour-limiter-les-incidents-bancaires
- https://www.insee.fr/fr/statistiques/6437977
- Ministère de l'Intérieur — Résultats officiels présidentielle 2022, 1er et 2nd tours : https://www.resultats-elections.interieur.gouv.fr/presidentielle-2022/
- Conseil constitutionnel — Décisions de proclamation des résultats de l'élection présidentielle 2022 : https://www.conseil-constitutionnel.fr/
- INSEE — Inscription sur les listes électorales et participation (mal-inscription) : https://www.insee.fr/
- https://www.archives-resultats-elections.interieur.gouv.fr/resultats/europeennes2024/ensemble_geographique/index.php
- https://www.touteleurope.eu/vie-politique-des-etats-membres/resultats-des-elections-europeennes-en-france-jordan-bardella-et-le-rassemblement-national-en-tete-valerie-hayer-et-renaissance-en-seconde-position/
- https://fr.wikipedia.org/wiki/%C3%89lections_europ%C3%A9ennes_de_2024_en_France
- https://www.cnews.fr/france/2024-06-10/elections-europeennes-2024-decouvrez-les-resultats-definitifs-du-scrutin-en-france
- https://www.opinion-way.com/wp-content/uploads/2025/02/OpinionWay-pour-le-CEVIPOF-Barometre-de-la-confiance-en-politique-Vague-16-Fevrier-2025-1.pdf
- https://www.revuepolitique.fr/le-centrisme-existe-t-il-dans-lopinion/
- https://sciencespo.hal.science/CEVIPOF/hal-04975385v1
- CEVIPOF / OpinionWay, Baromètre de la confiance politique, Vague 16, février 2025 - page Sciences Po : https://www.sciencespo.fr/cevipof/fr/actualites/barometre-de-la-confiance-politique-du-cevipof-2025-le-grand-desarroi-democratique/
- CEVIPOF Vague 16, document complet (HAL) : https://sciencespo.hal.science/hal-04975385/document
- CEVIPOF Vague 16, résultats détaillés (CESE), tableaux Q13 et Q25 : https://www.lecese.fr/sites/default/files/documents/CEVIPOF_Resultats_BarometreConfiancePolitique_Vague16_Fev2025.pdf
- Reuters Institute, Digital News Report 2025 - fiche France : https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/france
- The Media Leader FR, synthèse DNR 2025 France (TV 59%, online 64%, réseaux 37%, presse 13%, podcasts 9%) : https://fr.themedialeader.com/le-paysage-mediatique-francais-est-marque-par-une-defiance-persistante-selon-le-digital-news-report-2025-de-reuters/
- CRÉDOC, Baromètre du numérique - édition 2025 : https://www.credoc.fr/publications/barometre-du-numerique-edition-2025
- https://www.jean-jaures.org/publication/les-francais-et-lengagement/
- https://www.sciencespo.fr/cevipof/fr/etudes-enquetes/barometre-confiance-politique/
- https://recherches-solidarites.org/benevolat/
- https://www.carenews.com/carenews-info/news/le-benevolat-en-france-retrouve-son-niveau-pre-covid
- https://dares.travail-emploi.gouv.fr/publication/de-l-adherent-au-responsable-syndical
- https://www.observationsociete.fr/modes-de-vie/vie-politique-et-associative/une-france-tres-peu-syndiquee/
- https://www.insee.fr/fr/statistiques/2406371
- https://www.observationsociete.fr/modes-de-vie/vie-politique-et-associative/les-francais-adherent-de-moins-en-moins-aux-associations-3/
- https://www.francegenerosites.org/barometre-de-la-generosite-2023-cp/
