# Architecture du site Maintenant!

**Version** : 1.0 (synthèse sessions 1 à 7, 20 mai 2026)
**Statut** : référence active pour Claude Code

---

## 1. Vue d'ensemble

Maintenant! est une plateforme citoyenne web ouverte, structurée en **5 espaces** thématiques et **3 sections transverses**. Le site sert un mouvement politique populaire en construction, fondé sur l'**équivalence**, l'**empouvoirement** et l'**émancipation par accessibilité tactique**.

### Les 5 espaces

| Espace | Verbe | Fonction |
|---|---|---|
| **S'informer** | s'informer | médias, débats, prise de décision démocratique |
| **Mobiliser** | mobiliser | pétitions, campagnes, manifestations, cagnottes |
| **S'entraider** | s'entraider | entraide concrète et économique entre les gens |
| **Agir** | agir | adhérer, communes locales, moments solidaires |
| **Comprendre** (transverse) | comprendre | doctrine, monnaie, FAQ |

### Les sections transverses

- **Carte unifiée des actions** : visualisation géographique de tout ce qui est géolocalisé.
- **Agenda agrégé** : miroir temporel de la carte. Tout ce qui est public dans le temps.
- **Comprendre** : 6e bloc pédagogique. Page Monnaie 99-coin, FAQ, doctrine, ressources.

---

## 2. Arborescence complète

```
/                                       (Accueil)
├── /s-informer
│   ├── /media                          (Média Maintenant)
│   ├── /radio                          (Maintenant Radio, AzuraCast)
│   ├── /journal                        (Maintenant Médias, édition locale imprimable)
│   ├── /reseau                         (Réseau social interne)
│   ├── /sondages                       (Création + 2 modes classique/pondéré)
│   └── /decider                        (Infrastructure de décision)
│       ├── /salles                     (Salles permanentes + temporaires)
│       └── /assemblee-confederale      (Assemblée Confédérale des Communes et Territoires Libres)
│
├── /mobiliser
│   ├── /petitions
│   ├── /campagnes
│   ├── /mobilisations                  (Agenda Démosphère-like)
│   └── /cagnottes
│       ├── /ouvertes                   (Cagnottes solidaires)
│       ├── /lutte                      (Caisses de lutte et de grève)
│       └── /cotisations                (Cotisation solidaire admin, dont RBU)
│
├── /s-entraider
│   ├── /hebergement                    (Hébergement solidaire)
│   ├── /transport                      (Covoiturage solidaire)
│   ├── /qui-prete-tout                 (Prêt d'objets + Repair Café)
│   ├── /fruits-de-la-terre             (Alimentation + Frigos solidaires)
│   ├── /sel                            (Système d'échange local, 99-coin)
│   └── /marche                         (Marché solidaire, Bon Coin/Vinted-like)
│       ├── /produit
│       ├── /boutique
│       └── /minimarche                 (Minimarchés physiques, 4 monnaies)
│
├── /agir
│   ├── /adherer                        (Page sobre, 3 chemins)
│   ├── /communes                       (Commune libre)
│   │   └── /[slug]                     (Fiche d'une commune)
│   ├── /moments-solidaires             (Porte-à-porte et autres formats)
│   └── /autres-moyens                  (D'autres moyens d'agir, distance protectrice)
│
├── /comprendre                         (Section transverse)
│   ├── /monnaie                        (99-coin, T99CP)
│   ├── /doctrine
│   ├── /faq
│   └── /ressources
│
├── /carte                              (Carte unifiée, transverse)
├── /agenda                             (Agenda agrégé, transverse)
│
├── /profil                             (Espace utilisateurice connecté·e)
│   ├── /dashboard
│   ├── /informations
│   ├── /communes
│   ├── /contributions
│   ├── /notifications
│   ├── /wallet                         (Lien externe T99CP + intégrations)
│   └── /confidentialite                (Export, suppression, paramètres RGPD)
│
├── /admin                              (Console modération + admin)
│   ├── /moderation                     (Console unique, filtres onglets, droits)
│   ├── /communes                       (Cartographie pré-créée + édition)
│   ├── /membres
│   ├── /finances
│   └── /journal                        (Logs admin)
│
└── /            (pages utilitaires)
    ├── /connexion
    ├── /inscription
    ├── /mentions-legales
    ├── /confidentialite                (Politique de confidentialité publique)
    ├── /contact
    └── /a-propos                       (Qui sommes-nous)
```

---

## 3. Page d'accueil

### Structure

1. **Header** : liens vers les 5 espaces (S'informer, Mobiliser, S'entraider, Agir, Comprendre) + profil en haut à droite. Connecté·e : historique + indicateur adhérent·e. Déconnecté·e : presque tout visible (lecture libre).
2. **Bloc titre** :
   - Surtitre : « La plateforme citoyenne des 99 % »
   - Titre : « Maintenant! »
   - Sous-titre : « Pour une vie digne et heureuse pour tous et toutes, dans un monde vivable. Face aux oppressions systémiques, nos luttes doivent devenir systémiques. »
3. **4 unes empilées** (mises à jour automatiquement) :
   - Pétition en cours (CTA : Signer en modale + Voir toutes)
   - Article éditorial (CTA : Lire l'article)
   - Mobilisation à venir (CTA : Rejoindre)
   - Cagnotte solidaire (CTA : Soutenir)
4. **Pré-footer** : compteurs Newsletter, Membres, Signataires.
5. **Footer** : Qui sommes-nous, Mentions légales, Confidentialité, Contact, Réseaux.

### Parcours pétition (modale)

Modale légère : nom, prénom, code postal, email, téléphone optionnel. Cases à cocher : newsletter + autorisation de contact par la personne qui a créé la pétition. Remerciement sans demande de partage.

### Parcours adhésion (3 onglets sur `/agir/adherer`)

1. **Gratuite** (formulaire, vaut adhésion 1 an, mail de relance à l'échéance)
2. **12 99-coins (T99CP)** (flow T99CP, wallet certifié)
3. **12 €** (Stripe Checkout, mail de relance à l'échéance)

Pré-remplissage si connecté·e, tag « adhérent·e » posé, indicateur visible.

---

## 4. Espace S'informer (6 sous-espaces)

### A. Média Maintenant (`/s-informer/media`)

Sections : Éditos, Tribunes, Articles, Brèves (flux Reuters + AP), Dessins, Podcasts, Vidéos, Lives, Newsletter (archive), Maintenant Radio (live embarqué).

### B. Maintenant Radio (`/s-informer/radio`)

Onglet live unique. Infrastructure : AzuraCast auto-hébergé. Player intégré + métadonnées de l'émission en cours.

### C. Maintenant Médias (`/s-informer/journal`)

Édition locale d'un journal-affiche imprimable. Patchwork de modules existants sur le site (articles, brèves, dessins, mobilisations, annonces). Format A3 ou A4 collable dans l'espace public.

**Architecture v1 hybride** :
- 30 modèles designés sur Canva, exportés en HTML/CSS.
- Agent Claude (API) pioche les modules pertinents et remplit le modèle.
- Paged.js + Puppeteer génèrent un PDF print-ready.

**Modèle économique** : impression locale gratuite, impression à façon en T99CP ou en euros, marge mutualisée. Plafond à 100 affiches par commande.

**Coûts API estimés** : ~0,023 $ par affiche avec Claude Haiku 4.5, soit ~23 $ pour 1 000 affiches/mois.

### D. Sondages (`/s-informer/sondages`)

Création simple, ajout photo. Vote connecté obligatoire. Panel sociodémo + politique.

**2 modes** :
- **Classique** : vote brut.
- **Pondéré** : à partir de 300 répondant·es, méthode des quotas appliquée.

### E. Réseau social (`/s-informer/reseau`)

Flux Facebook-like sans pub. Algorithme strictement transparent et hiérarchisé :

1. Mes contenus (soi)
2. Contenus d'ami·es et de personnes suivies
3. Contenus du site (pétitions, articles, mobilisations)
4. Contenus S'entraider (environ 5 %)

**Règles strictes** :
- Pas de publicité.
- Pas de pondération algorithmique cachée.
- Pas d'autoplay vidéo.
- Pas de captation d'attention (notifications, badges agressifs).
- Messagerie interne type Messenger.
- Modération a posteriori.
- Encart financement permanent visible (cagnotte de fonctionnement du mouvement).

### F. Décider (`/s-informer/decider`)

**Fonction** : infrastructure technique de la décision en réunion. Couvre **toutes** les assemblées : communes, groupes de travail, fédérations, confédérations, Assemblée Confédérale.

#### Salles

- Salle dédiée permanente par commune.
- Salles temporaires nommées, fermées à la fin de la séance.
- Interface inspirée Discord, en plus simple.

#### Modes de décision (3 hiérarchisés)

1. **Consensus** : accord plein de toutes les personnes présentes.
2. **Levée d'objections** : décision validée si aucune objection bloquante n'est levée.
3. **Vote au jugement majoritaire** : méthode Balinski-Laraki, max 10 propositions. Mentions : Excellent, Très bien, Bien, Assez bien, Passable, Insuffisant, À rejeter. La mention médiane désigne la gagnante.

**À ne pas écrire « consentement »** : on dit « levée d'objections ».

#### Tokens et fenêtre de vote

- Tokens via chat « Décider » (bot interne), numéro de vote unique.
- Pas de blockchain.
- Bouton « j'ai oublié » qui renvoie le token.
- Fenêtre de vote : 10 minutes pendant la réunion, votables aussi par personnes absentes prévenues (logique Assemblée nationale).

#### Privacy des votes et relevés

| Périmètre | Qui consulte les relevés |
|---|---|
| Groupe de travail local | Membres du groupe + de la commune |
| Plénière commune | Membres de la commune uniquement |
| Groupe fédéré thématique | Membres du groupe fédéré (pas les sous-groupes locaux) |
| Assemblée Confédérale | Public (enregistrement systématique) |

Votes anonymes (à secret). Relevés transparents en solidarité, par périmètre.

#### Désignation de personnes

- Tirage au sort pur.
- Élection sans candidat·e suivie d'un vote au jugement majoritaire.

#### Symétrie virtuel/physique

Visios et réunions physiques suivent la même logique d'invitation : ouverte (presse, réseaux) ou aux seul·es membres. La commune ou le groupe choisit cas par cas.

#### Enregistrement

| Type | Enregistrement |
|---|---|
| Commune locale | Pas par défaut |
| Groupe de travail local | Pas par défaut |
| Local sur demande | Si accord, téléchargement aux participant·es, pas sur serveurs |
| Assemblée Confédérale | Systématique, public |
| Groupe fédéré thématique | Live transparent + replay |

#### Stack technique

- **Visio + chat** : LiveKit self-hosted (moderne, scalable, ouvert).
- **Couche métier maison** : interface salles, chat Décider (bot), votes, tokens, archivage chiffré, permissions.
- Pas Zoom, pas Meet, pas Teams.

---

## 5. Espace Mobiliser

### A. Pétitions (`/mobiliser/petitions`)

- Modération **a priori** (avant publication).
- Compteur stretch ×1,5 au franchissement de 90 % de l'objectif (pour relancer la dynamique).
- Modèle de pétition standard : titre, image, texte, destinataire, objectif chiffré, créateurice.

### B. Campagnes (`/mobiliser/campagnes`)

- Modération **a priori**.
- Modules combinables (pétition + mobilisation + cagnotte + page éditoriale + sondage).

### C. Mobilisations (`/mobiliser/mobilisations`)

- Modération **a posteriori**.
- Agenda type Démosphère, géolocalisé, contribution à la carte unifiée.
- Statut « je participe » d'un clic, anonyme par défaut.

### D. Cagnottes (`/mobiliser/cagnottes`)

- Modération **a posteriori** + blocage en cas de comportement louche.

**3 sous-types** :
1. **Cagnottes ouvertes** : projets, personnes, causes.
2. **Caisses de lutte et de grève**.
3. **Cotisations** (admin only, créées par l'équipe nationale) :
   - Sécurité sociale du logement
   - Sécurité sociale des mobilités (renommé)
   - Sécurité sociale de l'alimentation
   - Cagnotte cotisation libre RBU

**Versement** :
- Euros : Stripe Connect + KYC pour la personne porteuse.
- T99CP : wallet T99CP.
- Frais : 5 % sur les euros (absorbés par la personne donatrice), 0 % sur les T99CP.

---

## 6. Espace S'entraider (6 sous-espaces)

### A. Hébergement solidaire (`/s-entraider/hebergement`)
Fiches d'offre, géolocalisation, contact via messagerie interne.

### B. Transport solidaire (`/s-entraider/transport`)
Covoiturage solidaire, mise en relation simple.

### C. Qui prête tout + Repair Café (`/s-entraider/qui-prete-tout`)
Prêt d'objets entre particulier·ères. Initiatives Repair Café déclenchent automatiquement la création d'un groupe sur le réseau social + entrée sur la carte unifiée.

### D. Fruits de la terre + Frigos solidaires (`/s-entraider/fruits-de-la-terre`)
Alimentation circuit court. Frigos solidaires : étiquetage des produits, registre, gestion collective (vérification quotidienne, nettoyage, vidage/compostage, approvisionnement). Carte unifiée.

### E. SEL (`/s-entraider/sel`)

Système d'échange local. Sous-titre : « Reconnaître le temps de chacun·e, libérer du temps pour tous et toutes ».

**Conversion fondatrice** : 1 99-coin (T99CP) = 1 € = 1 minute.

**Vocabulaire** : « Service » entre particulier·ères, « Volontariat » pour les collectifs. **PAS « travail »**.

**Mécanique** : modération à 2 h, 120 minutes = 120 99-coins crédités automatiquement. Cagnotte cotisation libre RBU sur la plateforme.

### F. Marché solidaire (`/s-entraider/marche`)

#### Concept

Bon Coin/Vinted-like. Vente OU don gratuit (toggle sur le même formulaire).

#### Fraîcheur

3 mois d'inactivité déclenchent une modale de gestion via la messagerie interne (renouveler, retirer, autre).

#### 3 onglets

1. **Produit** (proposer ou chercher un objet).
2. **Boutique** (créer ou chercher une boutique éphémère).
3. **Minimarché solidaire** (conseils pour organiser un marché physique).

#### Minimarchés physiques

Lieu physique, géolocalisé sur la carte unifiée.

**4 monnaies acceptées** :
- T99CP (99-coin)
- Euros
- Ğ1 (Jaune, monnaie libre Duniter)
- Monnaies locales complémentaires

Préfigure le Comptoir de Change (chantier annexe T99CP).

#### Monnaies boutique en ligne

T99CP + Euros, double affichage. La personne acheteuse choisit. Pas de Ğ1 ni monnaies locales en ligne (réservées au physique pour l'instant).

#### Autres règles

- Modération a posteriori.
- Frais : 5 % euros, 0 % T99CP.
- Retrait : rencontre physique OU envoi postal (port à la charge de la personne acheteuse).
- Don/vente : toggle dans le même formulaire.
- Catégories : arborescence définie en admin (style Vinted).
- Notation : 5 étoiles + commentaire, unilatérale (de l'acheteuse vers la vendeuse).

---

## 7. Espace Agir (4 sous-espaces)

### A. Adhérer (`/agir/adherer`)

Page sobre, doctrine ouverte. Pas d'argumentaire pesant : on entre dans le mouvement, on en sort, on revient. 3 chemins (gratuit, T99CP, euros). Onboarding contextualisé selon le chemin d'entrée.

### B. Commune libre (`/agir/communes`)

#### Argumentaire

Argumentaire fonction + mise à l'échelle + organisation systémique + le 99,99 % vs le 0,01 % + allyship + règles de réunion + pas de quorum + transparence radicale + fédération ascendante.

#### Doctrine

> « On part du réel et on ne part pas de coquille vide. »

**Révision Lilou/Ben (2026-05-25)** : la règle « pas de coquilles vides » est levée. On pré-crée désormais une coquille (`statut_creation = 'pre_creee'`) pour chaque commune et arrondissement du référentiel officiel (~35 000 communes + 45 arrondissements, table `commune_reference`), via le script `scripts/precreer-communes.ts`, pour que chaque commune soit consultable et « rejoignable » immédiatement.

**Cartographie** : tout le référentiel est matérialisé en coquilles dans la table `commune` (statut `pre_creee`). La création libre d'une commune supplémentaire (quartier, ZAD, territoire libre, ex : « Commune libre d'Orgemont ») reste possible avec le nom souhaité, et n'est refusée que si ce nom exact est déjà pris (coquille pré-créée ou commune déjà créée par la communauté).

#### Trois niveaux supra-locaux

1. **Groupes fédérés thématiques** : agrègent des individus sur un sujet, ascendant.
2. **Fédérations de communes** : agrègent des communes par affinité (géo, théma, mixte).
3. **Confédérations** : agrègent des fédérations, récursif au-delà.

#### Doctrine de fédération libre

- Pas de continuité territoriale obligatoire.
- Pas de limite de nombre de fédérations par commune.
- Exemple : Saint-Denis + Sainte-Geneviève + Marseille + Villeurbanne → « Fédération des quartiers et villes populaires ».
- **Subsidiarité par accord mutuel** : à chaque palier, accord mutuel des entités concernées.
- **Légitimité d'expression par ancrage territorial** : on parle au nom d'un territoire si on y est concrètement présent·es.

#### Territoires libres

Permet entités non-communales (ZAD, Corse autonome, quartier auto-constitué). Techniquement on crée une commune, on lui donne le nom qu'on veut.

D'où le nom complet : **Assemblée Confédérale des Communes et Territoires Libres**.

#### Composition de l'Assemblée Confédérale

- Délégué·es en **binômes** tirés au sort.
- Communes + Fédérations + Confédérations (un binôme par entité).
- **Incompatibilité de cumul de mandats** : pas représentant·e simultané·e d'une commune et d'une fédération. Si tiré·e au sort à un niveau supérieur, libération du siège au niveau inférieur.

#### Permissions d'appartenance à une commune

| Action | Comportement |
|---|---|
| Rejoindre commune | Un clic, auto-déclaration |
| 2e commune | Modale « Es-tu sûr·e ? » |
| 3e commune | Modale « Tu participes déjà à 2... » |
| 4e commune | Refus |

**Anti-spam transitions** : rate limit d'environ une transition par mois. Poster dans 3 communes max simultanément.

### C. Moments solidaires (`/agir/moments-solidaires`)

#### Doctrine fondatrice

> « Ce qui se fait pour les gens sans les gens se fait contre les gens. »

> « On ne peut pas seulement promettre des lendemains qui chantent, il faut chanter aujourd'hui. »

Maintenant! comme **mouvement de service au service de nous-mêmes**. Auto-éducation populaire, auto-solidarité.

#### Distinction politique majeure

**Captation de pouvoir** = réunir pour donner force à NOTRE voix de leader.
**Empouvoirement** = organiser AVEC les gens, en collégial autogéré, pour qu'ILS s'expriment, créent, proposent.

Principe directeur transverse.

#### Porte-à-porte solidaire en 7 moments

1. **1er passage caddie** : groupe de 2 à 5 personnes, on demande de l'aide (pas propose). Liste prédéterminée : couches, petits pots, lait maternel, vêtements enfants, pâtes, hygiène, vêtements chauds. Flyer « Entrez dans nous... » **SANS écriture inclusive** (accessibilité tactique). Notation des besoins constatés.
2. **2e passage / collecte renforcée**.
3. **Tri convivial** (apéro ou vin chaud, recrutement de bénévoles).
4. **Distribution** : biens + appels pour les absent·es + services (cours de maths, jardinage, bénévoles désintéressé·es).
5. **Maraude d'invitation** : café/thé aux gens de la rue, invitation au repas.
6. **Repas solidaire LE SOIR** (pas midi) : auberge espagnole + surplus végétarien par défaut + sollicitation commerçants + prise de parole asso locale + collecte pour leur cause.
7. **Pendant le repas** : feuille volontaires + technique levée de mains (engagement public oral, pression sociale positive pour dignité et fierté).

#### Variantes actées

- **Tupperwares à ramener** : remplace la maraude de fin. Repartage dans les espaces personnels + viralité douce + **boucle d'engagement par dette légère**.

#### Causes locales — doctrine éditoriale

Mix progressif modéré → activiste :
- D'abord : asso quartier, projets jeunesse (scouts, classes vertes, sorties scolaires), enfants malades hôpital, Téléthon.
- Ensuite : squats, anti-expulsion, sans-papiers.

**Règle fondamentale** : *les gens s'engagent plus facilement pour ce qui leur est proche*. Vaut pour ciblage newsletter, mise en avant, suggestions.

#### Autres types

- **Maraude solidaire** autonome (café/thé aux gens de la rue, géolocalisée, agendée).
- **Vide-grenier solidaire** (vente + surplus pour cause locale).
- **Soutien** (présence collective : gréviste, expulsion, procès, démarche).
- **Manifestation** (groupe constitué dans la rue, à distinguer des Mobilisations).
- **Rencontre** (café citoyen, apéro de quartier, soirée débat).
- **Concert solidaire** (culturel + recettes pour cause).

#### Permissions

- **Organiser** : être membre de la commune territoriale concernée.
- **Participer** : pas d'obligation, mais incitation à laisser des coordonnées (logique mobilisations).

### D. D'autres moyens d'agir (`/agir/autres-moyens`)

**Doctrine de distance protectrice.** Page courte, pas d'éditorialisation. « Il y a d'autres moyens d'agir, les voici. » Liste de redirections sans endossement. Présomption d'utilité. Retrait si problématique.

**Raison politique** : ne pas être éclaboussé·es par les dérapages des organisations listées.

---

## 8. Sections transverses

### A. Carte unifiée des actions (`/carte`)

Vue cartographique de tout ce qui est géolocalisé sur le site :
- Communes libres
- Mobilisations
- Cagnottes locales
- Moments solidaires
- Frigos solidaires
- Minimarchés physiques
- Initiatives d'hébergement, transport, prêt d'objets, alimentation
- Sondages locaux

**Filtres** : par type d'objet, par espace d'origine, par date, par département.

**Architecture technique** : bases de données séparées par espace, **agrégation à l'affichage** (pas une table monolithique).

### B. Agenda agrégé (`/agenda`)

Miroir temporel de la carte. Agrège tout ce qui est public dans le temps :
- Mobilisations
- Moments solidaires (porte-à-porte, tri, repas, distribution, maraudes)
- Réunions publiques de communes
- Événements de tout type

**Présentation** : flux temporel cliquable + navigation par localité, département, date. Inspiration plateformes événementielles à gros volume.

### C. Comprendre (`/comprendre`)

6e bloc transverse, pédagogique. Sous-pages :
- `/comprendre/monnaie` : page Monnaie 99-coin (T99CP)
- `/comprendre/doctrine` : doctrines fondatrices
- `/comprendre/faq`
- `/comprendre/ressources`

---

## 9. Profil utilisateurice

### Décisions actées (Q5 et S6 + S7)

| Élément | Décision |
|---|---|
| Visibilité du profil public | **Configurable** par champ (chaque champ : visible publiquement, visible aux membres, visible à mes seul·es ami·es, privé) |
| Architecture interne | **Hybride** : dashboard d'accueil + onglets thématiques |
| Authentification | **4 portes** : email + mot de passe, magic link, OAuth GAFAM (Google, Apple, Microsoft), OAuth éthique (Mastodon, Framasoft, Solid) |
| Affichage des sections | **Progressif** : ne s'affichent que si du contenu est présent |
| Friction inscription | Nom + Prénom + **Pronom** + Email + Code postal + Téléphone (optionnel) |
| Pseudonymie | Tolérée (faux nom OK, pas vérifié) |
| Onboarding tutoriel | Non |
| Adhésion proposée juste après inscription | Oui, 3 chemins |
| Suppression / RGPD | Période de grâce 30 jours + Export ZIP + Anonymisation des contributions |
| Validation email | Systématique |
| 2FA | Optionnelle pour toustes, **obligatoire** pour comptes d'administration (animation, modération, trésorerie) |

### Pronom obligatoire — signal politique

Permet le genrage correct dans la newsletter personnelle et toute communication. Signal politique : le site reconnaît que les pronoms ne se présupposent pas.

### Anonymisation à la suppression

Les contributions restent (pétitions signées, articles, votes), l'identité disparaît. **Trace politique préservée même si la personne part.**

### Sous-pages du profil

- `/profil/dashboard` : vue d'accueil
- `/profil/informations` : nom, prénom, pronom, email, code postal, téléphone, photo, bio
- `/profil/communes` : communes auxquelles j'appartiens (1 à 3)
- `/profil/contributions` : pétitions signées, mobilisations, articles, cagnottes, votes Décider, services SEL
- `/profil/notifications` : préférences (cloche, push, mails)
- `/profil/wallet` : statut T99CP + lien externe
- `/profil/confidentialite` : export ZIP, suppression différée 30 j, paramètres visibilité

---

## 10. Notifications

### Hiérarchie des canaux

| Niveau | Canal | Contenu |
|---|---|---|
| Haute priorité | Messagerie interne (ping fort) | DM, désignations, atteintes d'objectifs, modération me concernant |
| Priorité courante | Cloche in-app | Activité dans mes espaces, événements département, réponses, contenus |
| Périphérique | Push (badge cloche) | Numérique discret. Opt-in son/vibration |
| Hebdo | Mail récap personnel | **Mardi** — regroupement style Facebook |
| Hebdo | Newsletter éditoriale | **Vendredi** |

### Principe

> On ne capte pas l'attention, on la respecte.

**Deux mails par semaine maximum** (mardi récap + vendredi newsletter). Trois jours d'écart, anti-saturation.

### Communications internes par espace

Messagerie interne en canal **primaire**, mail en doublure. Vaut pour commune, GT, fédération.

### Newsletter taggée — 3 axes

1. **Tag origine** : d'où vient l'inscription (pétition X, formulaire newsletter, adhésion, etc.).
2. **Tag action** : à quoi je me suis inscrit·e (campagne Y, mobilisation Z, etc.).
3. **Tag géographique = département** (calculé depuis le code postal).

Diffusion par défaut au département de la personne, diffusion virale naturelle pour les départements limitrophes.

---

## 11. Modération

### Niveaux

| Espace | Modération |
|---|---|
| Pétitions, Campagnes | **A priori** (avant publication) |
| Mobilisations, Cagnottes, Réseau social, Marché solidaire, Moments solidaires | **A posteriori** (après publication, retrait si problème) |

### Console (Q10)

Console unique, filtres par onglet (pétitions, mobilisations, cagnottes, etc.), droits par personne (un·e modo peut avoir accès à certains onglets seulement).

### Automation

**Cloudflare Turnstile** sur tous les formulaires publics (anti-bot, accessible). **Pas d'IA-modération**. Humain·e derrière toutes les décisions.

---

## 12. Logiques transverses

### Création de contenu = compte obligatoire

Signer une pétition, participer à une mobilisation : possible en anonyme. Créer du contenu (pétition, article, mobilisation, cagnotte, post réseau social) : compte requis.

### Code postal obligatoire

Sur tout formulaire (sauf le clic « je participe » sur une mobilisation, qui reste anonyme). Sert au tagging département et à la cartographie.

### Wallet T99CP

Blockchain Polygon, contract `0x7275cfc83f486d53ca1379fc1f8025490bdcc79a`. Lien externe vers T99CP.

**API Maintenant! ↔ T99CP** à construire pour : wallets certifiés + RBU 30 T99CP/mois (chantier API dédié).

### Paiements en euros

Stripe Checkout (paiements simples adhésion, dons) + Stripe Connect KYC (cagnottes versées à porteur·euse).

### Limites d'upload

- Image : 10 MB
- Document : 25 MB
- Vidéo : 200 MB
- Audio : 100 MB
- Total par compte : 5 GB

### Pré-remplissage des formulaires

Friction minimum si l'utilisateurice est connecté·e. Récupération des champs déjà renseignés.

### Jauge unifiée

Quand un objectif est exprimé en euros + T99CP, affichage unifié « X 99-coin / euro » (équivalence 1 T99CP = 1 €).

---

## 13. Migration Base44

Actifs à préserver :
- **946 membres** adhérent·es
- **~9 000 abonné·es** newsletter
- **~16 000 signataires** de pétitions
- Plusieurs pétitions à réécrire (corrections de wording)
- 2 articles à reprendre

Réseaux sociaux Base44 : zappés (tests uniquement, pas de communauté installée).

**Notification RGPD aux ~10 000 personnes** : pas obligatoire (décision S7, doctrine RGPD minimale légale, MAJ de la politique de confidentialité suffit).

Script de migration spécifique à produire en chantier dédié (voir `08_PLAN_CHANTIERS.md` phase 9).

---

## 14. Modèle de données (vue d'ensemble)

> Le schéma SQL détaillé sera produit par Claude Code au chantier #2 du plan. Voici les **entités principales** qu'il devra modéliser, avec leurs relations.

### Entités principales

- **personne** : identité (nom, prénom, pronom, email, code postal, téléphone optionnel, photo, bio, statut adhérent·e, date d'adhésion, mode adhésion, paramètres de visibilité par champ)
- **commune** : identité (slug, nom, code INSEE, géo, description courte, image, créatrice originale, modérateurices, statut pré-créée/auto-créée)
- **appartenance_commune** : personne x commune (avec date d'entrée, statut)
- **federation** : identité (nom, type géo/théma/mixte, description, membres-communes)
- **confederation** : identité (nom, membres-fédérations)
- **gt_thematique** : groupe de travail thématique (nom, sujet, membres-individus)
- **petition**, **campagne**, **mobilisation**, **cagnotte** : entités de l'espace Mobiliser
- **article**, **edito**, **tribune**, **breve**, **dessin**, **podcast**, **video** : entités de Média Maintenant
- **sondage**, **reponse_sondage** : entités sondages
- **post_reseau**, **commentaire**, **reaction**, **message** : entités réseau social et messagerie
- **offre_hebergement**, **offre_transport**, **offre_pret**, **offre_alimentation**, **service_sel**, **annonce_marche**, **boutique**, **minimarche** : entités S'entraider
- **moment_solidaire**, **rdv_porte_a_porte**, **inscription_moment** : entités Moments solidaires
- **salle_decider**, **seance**, **proposition**, **vote**, **objection**, **token_vote** : entités Décider
- **notification**, **preferences_notif** : entités notifications
- **moderation_signal**, **moderation_decision** : entités modération
- **transaction_stripe**, **transaction_t99cp** : entités paiements
- **journal_admin** : logs admin (audit RGPD)

### Permissions

Architecture RLS (Row Level Security) Supabase :
- Toute personne peut lire les contenus publics.
- Toute personne connectée peut créer du contenu (modération a priori/a posteriori selon type).
- L'autrice du contenu peut éditer le sien.
- Les modérateurices ont accès à la console selon leurs droits par onglet.
- Les administrateurices nationales ont accès complet, journalisé.
- Pattern principe : **édition admin globale + auto-édition créateurice**.

### Suppression et anonymisation

- Suppression demandée → grâce 30 j (réversible).
- Après 30 j → anonymisation : `personne.statut = 'anonymisee'`, `personne.email = null`, etc. Les FK vers cette personne restent valides (les contributions sont préservées sous le pseudo « Membre anonyme »).

---

## 15. Flux utilisateurice clés

### Inscription

1. Page `/inscription`.
2. Choix de la porte d'auth (email + mdp, magic link, OAuth GAFAM, OAuth éthique).
3. Formulaire : Nom + Prénom + Pronom + Email + Code postal + Téléphone (optionnel).
4. Cloudflare Turnstile.
5. Validation email systématique (lien magique).
6. Au retour de validation → proposition d'adhésion (3 chemins).

### Adhésion gratuite

1. Page `/agir/adherer`, onglet Gratuite.
2. Formulaire pré-rempli si connecté·e, sinon inscription d'abord.
3. Validation.
4. Tag « adhérent·e » + date d'adhésion + indicateur visible profil.
5. Mail de bienvenue.
6. À J+365 : mail de relance.

### Adhésion 12 €

1. Onglet 12 €.
2. Redirect Stripe Checkout.
3. Retour webhook Stripe : crée la transaction, valide l'adhésion.
4. Reçu fiscal par mail.

### Adhésion 12 T99CP

1. Onglet T99CP.
2. Vérification du wallet certifié de la personne.
3. Émission d'une transaction Polygon (depuis le wallet de la personne vers celui du mouvement).
4. Confirmation on-chain (1 à 2 minutes).
5. Validation de l'adhésion.

### Création d'une pétition

1. Page `/mobiliser/petitions/nouvelle` (auth requise).
2. Formulaire : titre, image, texte, destinataire, objectif chiffré.
3. Soumission → file de modération a priori.
4. Modération validée → publication.
5. Compteur stretch à 90 % (×1,5 de l'objectif).

### Création d'un Moment solidaire (porte-à-porte)

1. Page `/agir/moments-solidaires/nouveau` (membre de la commune requis).
2. Formulaire : type (porte-à-porte / autre), date(s), lieu, description.
3. Si porte-à-porte : génère automatiquement les 7 RDV liés (caddie, collecte, tri, distrib, maraude, repas, levée de mains).
4. Soumission → publication immédiate (modération a posteriori).
5. Inscription à la carte unifiée + agenda agrégé.

### Séance Décider

1. Réunion programmée par un·e membre de la commune.
2. À l'heure dite, ouverture de la salle (LiveKit).
3. Présent·es virtuel·les + physiques.
4. Au moment de décider :
   - Choix du mode (consensus → levée d'objections → jugement majoritaire).
   - Si vote au jugement majoritaire : max 10 propositions, mentions affichées, fenêtre 10 minutes, tokens via chat Décider.
   - Visualisation des mentions, calcul de la médiane, affichage du résultat.
5. Procès-verbal automatique avec horodatage, signé par la salle.
6. Stockage dans la BDD avec niveau de privacy adapté au périmètre.

### Suppression de compte

1. Page `/profil/confidentialite`.
2. Bouton « Supprimer mon compte ».
3. Modale d'avertissement (effets, irréversibilité après 30 j, possibilité de revenir en se reconnectant pendant 30 j).
4. Validation → statut `pending_deletion`, mail de confirmation.
5. À J+30, cron job : anonymisation (FK conservées, données identifiantes nullifiées), export ZIP envoyé par mail.

---

## 16. Composants partagés à prévoir

Pour respecter DRY et l'extensibilité, Claude Code devra créer ces composants partagés en priorité :

- `<Layout>` (header + footer + nav)
- `<Header>` (logo + nav 5 espaces + profil/auth)
- `<Footer>`
- `<NavEspace>` (sous-nav contextuelle par espace)
- `<CarteSection>` (composant carte unifiée réutilisable)
- `<AgendaSection>` (composant agenda réutilisable)
- `<ModaleAuth>`
- `<ModaleSignaturePetition>`
- `<ModaleAdhesion>`
- `<JaugeT99CPEuros>` (compteur unifié)
- `<BoutonParticiper>` (mobilisation, moment solidaire, etc.)
- `<NotationEtoiles>` (marché solidaire)
- `<CompteurStretch>` (pétitions)
- `<EditeurContenu>` (rich text pour articles, posts)
- `<UploadMedia>` (avec limites)
- `<CaptchaTurnstile>`
- `<ParametresVisibilite>` (par champ, profil)
- `<SalleDecider>` (LiveKit wrapper)
- `<VoteJugementMajoritaire>`
- `<RelevePV>`
- `<NotificationCloche>` + `<CentreNotifications>`
- `<MessagerieInterne>`

---

## 17. Pages éditoriales à produire (hors code)

À fournir par Lilou/Ben ou rédigées en parallèle :

- Fiche Commune libre (`/comprendre/commune-libre`)
- Fiche Assemblée Confédérale (`/comprendre/assemblee-confederale`)
- Page Monnaie 99-coin (`/comprendre/monnaie`)
- FAQ (`/comprendre/faq`)
- À propos / Qui sommes-nous (`/a-propos`)
- Mentions légales (`/mentions-legales`)
- Politique de confidentialité (déjà v3, à finaliser)
- Doctrine fondatrice (`/comprendre/doctrine`)
