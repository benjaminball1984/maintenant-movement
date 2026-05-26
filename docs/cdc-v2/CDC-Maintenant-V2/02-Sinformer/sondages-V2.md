# Sondages — Spécifications V2

> **Espace** : S'informer
> **Fichier** : sondages-V2.md
> **Version** : 1.0
> **Session** : 2026-05-26
> Signature : LIFE BENJAMIN BALL.
> Dépend de : principes-transversaux-V2.md (lire en premier).

---

## 0. Socle (rappel — acté sessions antérieures)

- Sondages simples (« Pour qui voteriez-vous entre… »), photo/illustration uploadable par option.
- Deux voies de création : admin crée directement, OU utilisateur·ice propose → validation admin.
- **Vote réservé aux personnes connectées.**

---

## 1. Le créateur de sondage : périmètre minimal

Le créateur ne se préoccupe de **rien** côté méthode. Il fournit seulement :
- **Titre**, **options de réponse**, **pictos / photos illustratives** par option, **description**. Point final.
- Il ne paramètre **aucun** redressement (entièrement automatique, cf. §2).
- **Il ne peut PAS recontacter les répondant·es.** Un sondage informe, il ne constitue pas un fichier de contacts. (Le recontact n'est possible que **par la plateforme**, et seulement si la personne a coché « J'accepte d'être contacté·e par la plateforme » — comme tout formulaire du site.)

---

## 2. Calcul de fiabilité : méthode combinée

Deux étages, appliqués automatiquement par le moteur (le créateur n'y touche pas).

### Étage 1 — Tirage équilibré (socle, lisible)
- Sur les **variables fortes** captées dès le profil minimal : **âge × zone géographique** (via code postal).
- Au lieu de pondérer (poids inégaux), on **tire au sort** dans les catégories sur-représentées pour obtenir un échantillon **aux bonnes proportions**, **une voix par personne**.
- Le facteur limitant = la catégorie la plus rare (ex. ruraux). Taille max d'échantillon = effectif de la case rare ÷ sa proportion cible.
- **Tirage côté serveur, graine (seed) figée par sondage** → reproductible et **identique pour tous les visiteurs** (sinon deux personnes verraient deux résultats différents). On re-tire uniquement à l'arrivée de nouvelles réponses.
- Avantage : « X personnes représentatives, une voix chacune » est plus inattaquable que des poids obscurs.

### Étage 2 — Pondération résiduelle fine (raking / calage sur marges)
- Sur les **variables secondaires** (CSP, revenu, etc.), **uniquement** pour les répondant·es à profil complet.
- Ajustement itératif des poids pour coller simultanément à toutes les marges connues.

### Référence de population
- Barèmes de référence (proportions réelles : recensement INSEE pour âge/zone, etc.) **saisis/modifiables par l'admin** dans le back-office (réaliste au lancement).

---

## 3. Affichage public de la fiabilité

Deux indicateurs, recalculés **en continu** à chaque réponse :

1. **Marge d'erreur** : ± 1,96 × √(p(1−p)/**n_eff**) à 95 %. Calculée sur la **taille d'échantillon EFFECTIVE** (pas le brut). Si les poids sont déséquilibrés, n_eff < n_brut → marge honnête.
2. **Indice de fiabilité en étoiles, à deux décimales** (ex. 4,85/5, 4,32/5). Score composite de : richesse du redressement (nb de variables calées) + solidité de l'échantillon effectif (ratio n_eff/n_brut) + volume (en saturation).

- **Mention permanente « sondage participatif en ligne »** à côté des étoiles. Aucune pondération ne corrige le **biais de recrutement** (qui choisit de cliquer). Ne JAMAIS se présenter comme un institut. Les étoiles disent la qualité technique du redressement ; la mention dit la nature de l'échantillon.

### Système à trois paliers (lissé, continu)

| Palier | Déclenchement (indicatif*) | Libellé public | Plafond étoiles |
|---|---|---|---|
| **Brut** | < ~500 répondants | « Sondage participatif brut, non redressé » (mention crue, visible) | ~1,0 → **1,5** |
| **Redressement partiel** | ~500–1 000, sur âge × zone | « Redressement partiel, indicatif » | jusqu'à **3** (jamais au-dessus) |
| **Redressement complet** | > ~1 000, cases suffisamment remplies | « Redressé » + marge d'erreur affichée | **3,5 → ~4,8** (5,00 quasi inatteignable) |

\* **Seuils calculés DYNAMIQUEMENT, pas figés en dur** : le moteur vérifie en continu qu'il a un minimum de ~30-50 répondants **par case** des variables à redresser. Un sondage redressé sur peu de variables (6 cases) bascule plus vite qu'un sondage à variables nombreuses (270 cases). Repères : ~30 cases sur âge × zone → ~800-1 000 répondants pour pondérer sérieusement (standard institut ≈ 1 000).

### Continuité de la note (CONTRAINTE FORTE pour Claude Code)
- La note est une **fonction lisse (saturation)**, JAMAIS en marches d'escalier. Les paliers sont des **plafonds**, pas des valeurs.
- **À chaque transition de palier, la note de départ du nouveau palier = note de fin du précédent** (raccordement sans discontinuité). Pas de saut visible (un saut 1,5 → 2,5 = « méthodologie bizarre »).
- La note **peut redescendre** : si une vague de réponses d'un même profil déséquilibre les cases, n_eff baisse → la note glisse vers le bas, en continu. Vivante dans les deux sens.
- Vaut pour **toutes** les transitions.

### Présentation visuelle des résultats (liée au palier)
Deux modes d'affichage, la forme devient elle-même un signal de fiabilité (un regard suffit à savoir si le sondage est brut ou sérieusement redressé).
- **Paliers brut + redressement partiel** → **barres simples** (une barre pleine par option, à son score). Pas de marge d'erreur affichée : à ce stade ce serait trompeur (faux air scientifique). Accompagné de la mention de palier.
- **Palier redressement complet** → **barres avec segment d'incertitude** (chaque score devient un intervalle, ex. « 16 → entre 13,6 et 18,4 », façon Odoxa « scores et marges d'erreur »). Rend visibles les chevauchements (deux candidats dont les segments se recoupent ne sont pas départageables). C'est là, et seulement là, que la marge d'erreur a un sens.
- **Longueur du segment calculée PAR option** (pas uniforme) : à partir de la marge d'erreur réelle √(p(1−p)/n_eff), qui dépend du score p et de n_eff. Un candidat à 32 % et un à 2 % n'ont pas le même segment. Plus juste que l'approximation uniforme des instituts.

---

## 4. Fiche méthodologique téléchargeable (par sondage)

- Consultable + téléchargeable par **tout le monde**.
- Contient : **données brutes** (agrégées, voir RGPD), **hypothèses** (barèmes/proportions cibles), **calculs** (n brut, n_eff, marge), **pondérations** (variables, poids, tirage), **méthodologie complète** en clair.
- Objectif : données brutes + méthodo = résultat fiable ET **croisable** avec d'autres sources (réutilisable par chercheur·es, journalistes, autres mouvements).
- **RGPD (impératif)** : brutes publiées à une **granularité agrégée / grossie** (tranches d'âge pas âge exact, grandes zones pas code postal précis) pour qu'**aucun individu ne soit ré-identifiable**. Méthodo totale, micro-données jamais en clair. *(Seuil d'agrégation à calibrer avec Légicoop.)*

---

## 5. Boîte noire de croisement (analyse) — réservée ADMIN (option A)

- Permet l'**analyse par tableaux croisés** (ex. « X % de ceux qui ont voté Y se déclarent Z »).
- **Réservée aux admins plateforme** (coopté·es). Le public voit le sondage, son résultat redressé, ses étoiles, sa marge, sa fiche méthodo. Les croisements fins restent un **outil interne**.
- **Toujours agrégé** : pourcentages + effectifs, **jamais de nominatif** (« Untel a voté Y » = INTERDIT absolu ; croiser opinion politique + nominatif = fichier sensible illégal).
- **Architecture** : le moteur tape sur une couche déjà anonymisée/agrégée ; il est **incapable** de sortir un nom (pas « on s'interdit » mais « impossible »).
- **Secret statistique** : toute case sous un **seuil minimal** (~5 personnes) est masquée (« effectif trop faible ») → empêche la ré-identification par recoupement.
- Accès **tracé**.

---

## 6. Confirmation du vote + qualification progressive du profil

1. **Confirmation par email** (double opt-in) : un vote = un email confirmé. Coupe faux comptes et bourrage, renforce la fiabilité.
2. **Après confirmation → invitation à enrichir** : « Voulez-vous renseigner un champ supplémentaire pour augmenter la fiabilité ? »
3. **Deux variables déjà gratuites** : âge (via date de naissance), zone (via code postal).
4. **Qualification progressive** : à chaque participation, le système pioche **une** question parmi le panel (§7) et la propose. La personne se qualifie petit à petit, sans mur de questions.

### Règles de tirage (CONTRAINTES Claude Code)
- **Pondération de la fréquence** : les questions les plus utiles à la fiabilité (CSP, type de commune, taille d'agglo, vote 2022) ont une **probabilité de tirage plus élevée** → qualifier vite sur ce qui compte.
- **Jamais deux fois la même** : ne piocher que dans les questions **non encore répondues** par cette personne, jusqu'à épuisement. (Redemander 4× le revenu = fuite garantie.)

---

## 7. Panel de qualification — 22 questions

> Catégories sociologiques classiques (nomenclatures INSEE) adaptées à l'engagement.
> **Religion et origine ethnique : EXCLUES** (données sensibles + contradiction politique pour un mouvement antiraciste). Remplacées par patrimoine et origine sociale.
> Ce panel est du **contenu à figer** (rédaction des libellés/options finaux). Options ci-dessous = base validée 26/05.

### Bloc 1 — Socle sociologique (14)
1. **CSP** : Agriculteur·ice · Artisan·e/commerçant·e/chef·fe d'entreprise · Cadre/prof. intellectuelle sup. · Prof. intermédiaire · Employé·e · Ouvrier·ère · Retraité·e · Étudiant·e · Sans activité · NSP.
2. **Diplôme** : Aucun/brevet · CAP-BEP · Bac · Bac+2/3 · Bac+5 et + · NSP.
3. **Revenu mensuel net du foyer** : < 1 500 € · 1 500–2 500 · 2 500–4 000 · 4 000–6 000 · > 6 000 · NSP.
4. **Situation maritale** : Célibataire · En couple/marié·e/pacsé·e · Séparé·e/divorcé·e · Veuf·ve.
5. **Composition du foyer** : Seul·e · Couple sans enfant · Avec enfant(s) · Monoparentale · Autre.
6. **Type de commune** : Rural · Petite ville · Ville moyenne · Grande ville · Métropole/cœur d'agglo.
7. **Logement** : Propriétaire · Locataire privé · Locataire social (HLM) · Hébergé·e/autre.
8. **Genre** : Homme · Femme · Gender fluide · Non-binaire · NSP.
9. **Secteur d'activité** : Public/fonction publique · Privé · Indépendant/libéral · Associatif/ESS · Sans emploi · Retraité·e · Étudiant·e.
10. **Patrimoine/épargne** : Aucune épargne · Épargne de précaution (< 3 mois) · Épargne confortable · Patrimoine immobilier (hors résidence principale) · NSP.
11. **Origine sociale** : CSP du père OU de la mère pendant l'enfance (mêmes catégories que Q1).
12. **Taille d'agglomération** : < 2 000 hab. · 2 000–20 000 · 20 000–100 000 · 100 000–200 000 · > 200 000 · Agglo parisienne.
13. **Statut dans l'emploi** : CDI · CDD/intérim · Fonctionnaire · Indépendant·e · Chômage · Inactif·ve · Études.
14. **Tranche d'âge fine** : 18–24 · 25–34 · 35–49 · 50–64 · 65–74 · 75+ (filet si date de naissance manquante).

### Bloc 2 — Politique (4, listes EXHAUSTIVES, zéro regroupement)
15. **Présidentielle 2022, 1er tour** — 12 candidat·es (vérifié Conseil constitutionnel) : Arthaud · Dupont-Aignan · Hidalgo · Jadot · Lassalle · Le Pen · Macron · Mélenchon · Pécresse · Poutou · Roussel · Zemmour · + blanc/nul · n'a pas voté · pas en âge · NSP.
16. **Européennes 2024** — **les 38 listes exhaustives** (intitulés officiels ministère Intérieur, liste complète ci-dessous) + blanc/nul · n'a pas voté · pas en âge · NSP. **Principe : pas de regroupement des petites listes (« autre ») — agréger les marges = les effacer.** Affichage : intitulé officiel + nom usuel entre parenthèses pour aider le répondant (ex. « Réveiller l'Europe (PS-Place publique, Glucksmann) »).
17. **Auto-positionnement gauche-droite** : échelle 0–10 + « cet axe ne veut rien dire pour moi ».
18. **Intérêt pour la politique** : Très · Assez · Peu · Pas du tout.

### Bloc 3 — Engagement (4)
19. **Forme(s) d'engagement** (choix multiple) : Manifestation · Pétition · Grève · Action directe · Bénévolat · Adhésion parti/syndicat · Mandat local · Aucune.
20. **Pratique syndicale** : Syndiqué·e actuellement · Anciennement · Jamais · Pas concerné·e.
21. **Pratique du don** : Donateur·ice régulier·ière (mensuel/récurrent) · Ponctuel·le · A déjà donné 1-2 fois · Jamais · NSP.
22. **Bénévolat associatif + secteur** : « Es-tu bénévole ? Oui/Non » + immédiatement, en ligne, « Quel secteur ? ». **Les deux champs obligatoires dans le MÊME écran, un seul passage** (champ conditionnel affiché d'emblée, validation des deux avant de passer). Secteurs : Social/solidarité · Humanitaire · Environnement · Culture · Sport · Éducation/jeunesse · Santé · Droits humains · Animaux · Autre.

### Liste exhaustive des 38 listes — Européennes 2024 (vérifiée, intitulés officiels ministère Intérieur, par voix décroissantes)
1. La France revient ! avec Jordan Bardella et Marine Le Pen (RN) — 7 765 936
2. Besoin d'Europe (Renaissance, Hayer) — 3 614 646
3. Réveiller l'Europe (PS-Place publique, Glucksmann) — 3 424 216
4. La France insoumise – Union populaire (LFI, Aubry) — 2 448 703
5. La droite pour faire entendre la voix de la France en Europe (LR, Bellamy) — 1 794 171
6. Europe Écologie (EELV, Toussaint) — 1 361 883
7. La France fière, menée par Marion Maréchal et soutenue par Éric Zemmour (Reconquête) — 1 353 127
8. Gauche unie pour le monde du travail soutenue par Fabien Roussel (PCF, Deffontaines) — 584 067
9. Alliance rurale (Lassalle) — 582 901
10. Parti animaliste – Les animaux comptent, votre voix aussi (Thouy) — 495 936
11. Écologie au centre (Governatori) — 316 136
12. Liste Asselineau-Frexit, pour le pouvoir d'achat et pour la paix (UPR) — 253 036
13. L'Europe ça suffit ! (Les Patriotes, Philippot) — 229 190
14. Lutte ouvrière – Le camp des travailleurs (Arthaud) — 121 281
15. Écologie positive et territoires (Wehrling) — 104 954
16. Équinoxe : écologie pratique et renouveau démocratique (Cholley) — 73 002
17. Europe Territoires Écologie (Changer l'Europe) — 63 482
18. Pour un monde sans frontières ni patrons, urgence révolution ! (NPA-R, Labib) — 37 434
19. Parti pirate (Zorn) — 28 119
20. Free Palestine (UDMF, Azergui) — 14 986
21. Nous le peuple — 13 886
22. Changer l'Europe — 13 068
23. Esperanto langue commune — 10 349
24. PACE – Parti des citoyens européens, pour l'armée européenne, pour l'Europe sociale, pour la planète ! — 7 397
25. France libre (Lalanne) — 5 474
26. Défendre les enfants (Coste-Meunier) — 5 214
27. Forteresse Europe – Liste d'unité nationaliste (Bonneau) — 5 096
28. « Pour le pain, la paix, la liberté ! » présentée par le Parti des travailleurs (POID, Adoue) — 4 120
29. La ruche citoyenne — 4 038
30. Paix et décroissance — 3 726
31. Pour une autre Europe (Nouvelle Donne, Larrouturou) — 3 688
32. Non à l'UE et à l'OTAN, communistes pour la paix et le progrès social (PRCF, Terrien) — 3 078
33. Non ! Prenons-nous en mains — 1 507
34. Parti révolutionnaire Communistes — 1 497
35. Pour une démocratie réelle : décidons nous-mêmes ! (Ponge) — 1 443
36. Pour une humanité souveraine (Deher-Lesaint) — 1 230
37. Liberté démocratique française (Grudé) — 1 007
38. Démocratie représentative — 749

Total exprimés : 24 753 773. Source : archives-resultats-elections.interieur.gouv.fr (europeennes2024). Les voix servent uniquement à fixer l'ordre d'affichage ; dans le panel, ne pas afficher les scores (un répondant déclare son propre vote, pas le résultat national).

---

## Points à valider avec Légicoop
- Fiche méthodo : seuil d'agrégation des données brutes pour rester RGPD-compatible.
- Q15/Q16 = opinions politiques (donnée sensible) : confirmer le cadre de collecte/conservation (cohérent avec boîte noire admin-only + masquage petits effectifs).

## Reste à faire
- Rédiger/figer les libellés et options définitifs des 22 questions (la liste des 38 européennes est désormais figée et vérifiée).
