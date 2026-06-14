# Profil sondage — 25 propositions de questions (à choisir par Ben)

> Demande Ben 2026-06-14 : garder les 22 questions, **monter à 25 propositions**,
> il choisit. Vocabulaire **vérifié aux normes des instituts** (recherche
> multi-agents : INSEE/PCS 2020, enquête Logement, grille de densité INSEE, TeO2
> INED, CEVIPOF, IFOP, Ipsos, Reuters DNR, France Bénévolat, ministère de
> l'Intérieur pour les libellés électoraux).
>
> Changements demandés intégrés :
> - ❌ « taille de l'agglomération » (en nb d'habitants) **retirée** → remplacée
>   par « type de commune » (continuum rural→métropole, grille INSEE).
> - ➕ « revenu » (échelle fine), « présidentielle 2022 » (12 candidat·es dans
>   l'ordre du bulletin), « logement » (propriétaire / locataire / hébergé privé
>   / hébergé collectif).
>
> `cle` = identifiant technique stable (clé `profil_qualification.question_cle`).
> 🔒 = donnée sensible (RGPD) → « Ne souhaite pas répondre » systématique.

## Bloc 1 — Socio (13)

1. **Genre** — `genre`
   Homme · Femme · Non binaire · Autre
2. **Tranche d'âge** — `tranche_age_fine` *(déduite de la date de naissance si connue)*
   18-24 · 25-34 · 35-49 · 50-64 · 65-74 · 75 ans et plus
3. **Catégorie socioprofessionnelle (CSP)** — `csp`
   Agriculteur·rice exploitant·e · Artisan·e, commerçant·e ou chef·fe d'entreprise · Cadre ou profession intellectuelle supérieure · Profession intermédiaire (technicien·ne, agent·e de maîtrise, enseignant·e du primaire, infirmier·ère…) · Employé·e · Ouvrier·ère · Retraité·e · Étudiant·e ou élève · Sans activité professionnelle (au foyer, recherche d'emploi de longue durée, autre) · Ne souhaite pas répondre
4. **Statut dans l'emploi** — `statut_emploi`
   Salarié·e en CDI · Salarié·e en CDD · Intérim · En alternance · Stagiaire · Fonctionnaire · Indépendant·e, à mon compte · En recherche d'emploi · En études · Inactif·ve · Ne souhaite pas répondre
5. **Secteur** — `secteur_employeur`
   Public (État, collectivités, hôpital public) · Privé (entreprise, association classique) · Économie sociale et solidaire (coopérative, mutuelle, association, fondation) · À mon compte / indépendant·e · Je n'ai jamais travaillé · Ne souhaite pas répondre
6. **Diplôme le plus élevé** — `diplome`
   Aucun diplôme · CEP, brevet des collèges, BEPC · CAP, BEP ou équivalent · Baccalauréat (général, techno, pro), brevet pro · Bac+2 (BTS, BUT/DUT, DEUG, sanitaire et social…) · Bac+3/Bac+4 (licence, master 1…) · Bac+5 et plus (master, ingénieur·e, école de commerce, doctorat, médecine…) · En cours d'études · Ne souhaite pas répondre
7. **Revenu mensuel net du foyer** — `revenu_foyer` ← *(demande Ben — échelle fine, brackets IFOP/Ipsos)*
   Moins de 1 000 € · 1 000 à 1 499 € · 1 500 à 1 999 € · 2 000 à 2 499 € · 2 500 à 2 999 € · 3 000 à 3 999 € · 4 000 à 5 999 € · 6 000 € et plus · Ne souhaite pas répondre
8. **Statut d'occupation du logement** — `logement` ← *(demande Ben)* 🔒
   Propriétaire (y c. accédant·e) · Locataire du parc privé · Locataire d'un logement social (HLM) · Hébergé·e gratuitement en logement privé (proche, famille, employeur) · Hébergé·e en logement collectif (foyer, résidence sociale, EHPAD, internat, caserne, CADA…) · Sans domicile · Ne souhaite pas répondre
   *(variante Ben à 4 postes possible : fusionner les 2 « locataire » en un seul)*
9. **Type de commune** — `type_commune` ← *(remplace « taille de l'agglomération », grille de densité INSEE)*
   Une grande ville ou son centre (métropole) · Une ville moyenne · Une petite ville · Une commune de banlieue / périphérie (couronne périurbaine) · Un village ou un bourg rural · Une commune rurale à habitat isolé/dispersé · Ne souhaite pas répondre
10. **Région de résidence** — `region_residence`
    Les 13 régions métropolitaines + 5 DROM (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte) + Hors de France + Ne souhaite pas répondre
11. **Situation conjugale** — `situation_maritale`
    Marié·e · Pacsé·e · En couple (union libre, concubinage) · Célibataire · Divorcé·e ou séparé·e · Veuf·ve · Ne souhaite pas répondre
12. **Composition du foyer** — `composition_foyer`
    Je vis seul·e · En couple sans enfant · En couple avec enfant(s) · Famille monoparentale · Je vis chez mes parents/ma famille · En colocation · Autre · Ne souhaite pas répondre
13. **Origine sociale (profession des parents)** — `origine_sociale` 🔒
    Même grille CSP que Q3, pour le père ET la mère (vers tes 15 ans) ; + « Je ne sais pas / sans objet » + « Ne souhaite pas répondre »

## Bloc 2 — Politique (6)

14. **Présidentielle 2022 — 1er tour** — `presidentielle_2022` ← *(demande Ben — 12 candidat·es, ordre officiel du bulletin)* 🔒
    Nathalie Arthaud (LO) · Nicolas Dupont-Aignan (DLF) · Anne Hidalgo (PS) · Yannick Jadot (EELV) · Jean Lassalle (Résistons !) · Marine Le Pen (RN) · Emmanuel Macron (LREM) · Jean-Luc Mélenchon (LFI) · Valérie Pécresse (LR) · Philippe Poutou (NPA) · Fabien Roussel (PCF) · Éric Zemmour (Reconquête !) · Blanc ou nul · Abstention · Pas en âge de voter / pas inscrit·e · Ne souhaite pas répondre
15. **Présidentielle 2022 — 2nd tour** — `presidentielle_2022_t2` 🔒
    Emmanuel Macron · Marine Le Pen · Blanc ou nul · Abstention · Pas en âge de voter / pas inscrit·e · Ne souhaite pas répondre
16. **Législatives 2024 — 1er tour** — `legislatives_2024` 🔒
    RN et alliés (dont LR-Ciotti) · Nouveau Front populaire (LFI, PS, Écologistes, PCF…) · Ensemble (Renaissance, MoDem, Horizons) · Les Républicains (hors alliance RN) · Reconquête · Autre droite/divers droite · Autre gauche/divers gauche · Autre (régionaliste, écolo hors NFP…) · Blanc ou nul · Abstention · Pas en âge de voter · Ne s'en souvient plus · Ne souhaite pas répondre
17. **Européennes 2024** — `europeennes_2024` 🔒
    Têtes de liste : Bardella (RN) · Hayer (Besoin d'Europe) · Glucksmann (PS-Place publique) · Aubry (LFI) · Bellamy (LR) · Toussaint (Écologistes) · Maréchal (Reconquête) · Deffontaines (PCF) · Lassalle (Alliance rurale) · Thouy (Parti animaliste) · Une autre liste · Blanc ou nul · Abstention · Pas en âge de voter · Ne s'en souvient plus · Ne souhaite pas répondre
18. **Axe gauche-droite** — `gauche_droite` *(échelle CEVIPOF)*
    0 (gauche) → 10 (droite) · « Cet axe ne veut rien dire pour moi »
19. **Intérêt pour la politique** — `interet_politique`
    Beaucoup · Assez · Peu · Pas du tout
20. **Comment tu t'informes sur la politique** — `source_info_politique`
    Télévision · Radio · Presse écrite · Sites/applis d'info en ligne · Réseaux sociaux · Podcasts/vidéos · Entourage · Je ne m'informe pas vraiment · Ne souhaite pas répondre

## Bloc 3 — Engagement (5)

21. **Formes d'engagement (2 dernières années, plusieurs choix)** — `formes_engagement`
    Pétition · Manifestation · Grève · Boycott · Bénévolat · Don · Militer dans un parti · Militer dans un syndicat · Réunion publique / conseil de quartier · Consultation citoyenne / votation locale · Interpeller un·e élu·e · S'exprimer sur les réseaux sociaux · Désobéissance civile (blocage, occupation, ZAD…) · Aucune
22. **Bénévolat** — `benevolat` *(pratique + domaine sur le même écran)*
    Oui régulièrement · Oui de temps en temps · Oui ponctuellement · Non mais déjà fait · Non jamais → si oui, domaine : Sport · Culture · Vie locale · Action sociale/caritative/humanitaire · Santé · Éducation/jeunesse · Environnement/animaux · Défense des droits et causes citoyennes · Religion · Autre
23. **Dons aux associations (12 derniers mois)** — `pratique_don` 🔒
    Oui régulièrement · Oui 1-2 fois dans l'année · Oui ponctuellement (urgence/appel) · Non pas cette année · Non jamais · Ne souhaite pas répondre
24. **Syndicalisation** — `pratique_syndicale` *(statut + lequel sur le même écran)* 🔒
    Adhérent·e actuellement · Anciennement · Jamais · Ne souhaite pas répondre → si adhérent·e/ancien·ne : CGT · CFDT · FO · CFE-CGC · CFTC · UNSA · Solidaires (SUD) · FSU · Syndicat étudiant/lycéen · Autre · Ne souhaite pas répondre
25. **Adhésion à une organisation (plusieurs choix)** — `adhesion_organisation` 🔒
    Association (sport, culture, loisirs…) · Association caritative/humanitaire/solidarité · Association de défense des droits ou de l'environnement · Syndicat · Parti ou mouvement politique · Aucune · Ne souhaite pas répondre

## Extras disponibles (à échanger contre une des 25 si tu veux)

- **Patrimoine / épargne** — `patrimoine` : Aucune épargne · Épargne de précaution (<3 mois) · Épargne confortable · Patrimoine immobilier hors résidence principale · NSPP
- **Comment tu t'en sors financièrement** — `aisance_financiere` (CRÉDOC) : Je vis confortablement · Ça va · C'est juste, il faut faire attention · J'y arrive difficilement · Je n'y arrive pas sans m'endetter · NSPP
- **Religion** 🔒 — `appartenance_religieuse` : Sans religion · Catholique · Autre chrétienne (protestante, orthodoxe, évangélique…) · Musulmane · Juive · Bouddhiste · Autre · NSPP
- **Pratique religieuse** 🔒 — `pratique_religieuse` : Plusieurs fois/semaine · ~1 fois/semaine · 1-2 fois/mois · Grandes fêtes · Cérémonies familiales · Jamais · NSPP
- **Proximité partisane** 🔒 — `proximite_partisane` : « De quel parti te sens-tu le/la plus proche ? » (liste LFI→RN + Aucun + NSPP)
- **Confiance dans les institutions** — `confiance_institutions` (CEVIPOF)
- **Nombre d'enfants** — `nombre_enfants` : 0 · 1 · 2 · 3 · 4 et plus · NSPP
