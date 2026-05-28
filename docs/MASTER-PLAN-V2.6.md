# Master plan V2.6 — Maintenant!

> **Pour qui** : Lilou/Ben (pilote), à transmettre à Claude Code pour exécution par phases.
> **Par qui** : L2B2 (Claude.ai), à partir des séances vocales du 28 mai 2026 (marche du matin + revue du soir) et de la lecture intégrale du pack export V2 figé au tip `389c03d`.
> **Quoi** : une revue de l'existant, une vision d'ensemble, et un plan de travail découpé en phases codables, pensé pour que Claude Code avance en autonomie sous supervision légère, sans bloquer, sans jargonner, et sans rien câbler de payant avant la toute fin.
> **Révision V2.6** : intègre le cadre juridique (association / plateforme / mouvement, Collectif Maintenant), le tunnel sondage corrigé, le déblocage de l'espace profil, et la directive anti-arrêt.
> **Signature** : LIFE BENJAMIN BALL.

---

## Comment lire ce document

Il est long, et c'est voulu. Tu m'as demandé du détail, j'ai mis du détail. Mais tu n'es pas obligé de tout lire d'un coup. Voici l'ordre conseillé sur deux journées.

**Journée 1 — comprendre où on en est.** Lis les parties 1 à 4. Elles font le point honnête sur ce qui existe vraiment dans le code, sur l'écart entre ce qui est « préparé » et ce qui est « fini », et sur les grands principes que tu as formulés ce matin et qui deviennent la boussole de toute la suite. À la fin de cette journée, tu sauras dire en deux phrases où en est ton site et pourquoi.

**Journée 2 — décider la suite.** Lis les parties 5 à 9. Ce sont les phases de travail concrètes, les tunnels d'engagement à arbitrer, et surtout les directives permanentes à donner à Claude Code pour qu'il travaille comme tu le veux. À la fin de cette journée, tu auras un plan que tu pourras lui transmettre bloc par bloc.

Chaque fois que j'emploie un mot technique, je le traduis tout de suite entre parenthèses, parce que tu m'as dit que tu voulais apprendre le vocabulaire sans jamais avoir à deviner. C'est une règle que je tiens dans tout le document, et c'est aussi une règle que je demanderai à Claude Code de tenir.

---

# PARTIE 1 — Le point de départ, sans flatterie ni alarme

## 1.1 Ce que tu as entre les mains, dit simplement

Tu as un site déjà très avancé. Pas une maquette, pas une démo : un vrai logiciel qui tourne. Pour te donner une idée de la taille, il y a environ 230 pages, 120 composants d'interface (les morceaux réutilisables d'écran, comme un bouton ou une carte), 174 fichiers de logique, et près de 900 tests automatiques qui vérifient que rien ne casse. Tout ça a été construit proprement, sans erreur laissée derrière.

Le mot important, c'est « tourne ». Quand tu lances le site sur ton ordinateur (ce qu'on appelle « localhost », c'est-à-dire le site qui s'exécute sur ta propre machine et que toi seul vois, à l'adresse `localhost:3000`), il fonctionne de bout en bout sans avoir besoin de la moindre connexion payante. C'est un choix d'architecture excellent, et j'y reviens en 1.3 parce qu'il change tout pour ta question de budget.

## 1.2 Ce que veut dire « loin d'être fini » dans ton cas

Quand tu dis que le chantier est loin d'être fini, tu as raison, mais pas au sens où il manquerait des fondations. Les fondations sont là et elles sont solides. Ce qui manque tient en réalité dans une seule phrase, que je vais répéter souvent parce qu'elle est la clé de toute la suite :

**Le moteur est sous le capot, mais beaucoup de pédales manquent dans l'habitacle.**

Autrement dit : la machinerie qui fait fonctionner les choses (les tables de données, les règles, les calculs) a été posée pour presque tout. Mais le geste final, le bouton sur lequel un humain clique, l'écran joli qui donne envie, n'a souvent pas été branché. C'est pour ça que certaines pages te paraissent nues ou que certaines fonctions semblent absentes : elles existent en coulisses, elles ne sont pas montées sur scène.

Cette situation a une cause précise, et elle n'est ni un bug ni une négligence. Claude Code a reçu de toi une consigne très stricte qui s'appelle la règle de non-invention : il a le droit d'inventer tout ce qui est technique, mais il n'a pas le droit d'inventer le moindre contenu politique ou éditorial. Quand il ne savait pas si un écran relevait de la technique ou du contenu, il a préféré s'arrêter et te demander. D'où ton impression qu'il faut « pousser, pousser » pour qu'il avance. On va régler ça net en partie 8, en lui donnant une façon de distinguer les deux qui le débloquera sans trahir ta règle.

## 1.3 Le point qui change tout pour ton budget : les adaptateurs mock

C'est sans doute l'information la plus importante de cette partie, alors je prends le temps.

Chaque fois que le site a besoin d'un service extérieur payant (envoyer un email, encaisser un paiement, faire une visioconférence), il a été construit avec deux versions interchangeables. La première est la vraie version, qui parle au service payant. La seconde est une fausse version, qu'on appelle un « adaptateur mock » (mock veut dire « imitation » en anglais ; un adaptateur, c'est la pièce qui fait le lien avec le service). L'adaptateur mock imite parfaitement le comportement du vrai service, mais sans rien envoyer ni rien facturer. Par exemple, l'adaptateur mock d'email écrit dans un journal « j'aurais envoyé tel email à telle personne » au lieu de l'envoyer vraiment.

Le basculement entre les deux versions se fait par un simple réglage (une « variable d'environnement », c'est-à-dire une ligne de configuration que tu changes sans toucher au code). Tu écris `mock` pour la fausse version, ou `brevo` pour la vraie, et c'est tout.

La conséquence est énorme pour toi : **tout le site peut être construit, testé, montré et même utilisé en démonstration sans dépenser un centime d'abonnement.** Le jour où tu décides de passer au réel, tu changes les réglages, et ça se branche. Donc quand Claude Code te dit « il me faut telle clé pour continuer », c'est presque toujours faux : il peut continuer en mock. On en fait une directive permanente en partie 8.

Ça valide entièrement ta stratégie de ce matin : on finit le produit en mock, tu le montres pour lever du soutien, et on ne câble les services payants qu'à la toute fin, quand tu sauras qui paie et combien. Le câblage final, c'est une demi-journée de travail, pas un préalable.

---

# PARTIE 2 — L'état réel de chaque chose, vérifié dans le code

Cette partie est le résultat de ce que j'ai lu directement dans le code, pas de ce que la documentation affirme. Quand la documentation et le code se contredisent, je te dis ce que dit le code, parce que c'est lui la vérité.

## 2.1 La double relation pétition-campagne : fondation posée, geste absent

Tu avais un doute, et ton doute était juste. Voici exactement ce que j'ai trouvé.

Il existe en base de données une table nommée `module_campagne`. Pense à un classeur qui note des liens du type « la pétition X fait partie de la campagne Y », « la cagnotte Z fait aussi partie de la campagne Y ». Cette table est bien faite : elle prévoit de rattacher à une campagne une pétition, une mobilisation, une cagnotte, un sondage, ou même une page éditoriale. Il existe aussi une fonction (un morceau de programme) nommée `attacherModule` qui sait créer ces liens proprement, en vérifiant que la cible existe.

Donc Claude Code n'a pas ignoré ta double relation. Il en a posé toute la mécanique de fond.

Mais : nulle part dans les écrans il n'y a le bouton « intégrer cette pétition à une campagne » que tu décris. Quand tu crées une pétition, rien ne te propose de la rattacher. Le classeur existe, la main qui range les fiches dedans n'existe pas. C'est le motif « moteur sans pédale » à l'état pur.

Ce qu'il faut faire, et que je détaille en phase dédiée : ajouter le bouton sur chaque objet rattachable, avec la petite fenêtre (la « modale », c'est-à-dire une fenêtre qui s'ouvre par-dessus l'écran sans changer de page) qui propose soit de choisir une campagne existante, soit d'en créer une à la volée. C'est du travail d'interface sur une fondation déjà solide. C'est rapide et sans risque.

## 2.2 L'appartenance aux espaces : presque tout est là

Il existe des tables d'appartenance pour les communes, les fédérations, les confédérations, les groupes de travail, les groupes d'entraide, et depuis peu les campagnes. Une table d'appartenance, c'est la liste de qui est membre de quoi, avec la date d'arrivée et la date de départ éventuelle. C'est ce qui permet ton « rejoindre la commune en un clic ». La fondation de ton tunnel commune est donc là.

Ce qui manque, encore une fois, c'est le parcours d'écran joli et fluide qui va de la signature jusqu'au « bienvenue dans ta commune ». La plomberie est posée, le couloir de l'expérience n'est pas décoré.

## 2.3 Les migrations en attente : le grand écart local-distant

Voici un point technique que tu dois absolument comprendre, parce qu'il explique pourquoi des choses « ne marchent pas » alors qu'elles semblent codées.

D'abord le vocabulaire. Une « migration » est un fichier qui décrit une modification de la base de données, par exemple « créer une nouvelle table consentement ». La « base de données » est l'endroit où vivent toutes les informations du site (les profils, les signatures, les communes). Ton site utilise une base hébergée à distance, chez un fournisseur nommé Supabase, dans un centre de données à Francfort. On dit « le distant » pour parler de cette base en ligne, par opposition à « le local » qui est ton ordinateur.

Le problème : 28 de ces fichiers de migration existent sur ton ordinateur mais n'ont jamais été appliqués sur le distant. Concrètement, des tables entières (consentement, droit, fil de groupe, réservation, caisse, et d'autres) existent dans tes fichiers mais pas dans la vraie base en ligne. Comme ton site, même en local, va toujours chercher ses informations sur le distant, il demande des tables qui n'existent pas là-bas, et il reçoit du vide en réponse, sans message d'erreur visible. D'où des écrans qui paraissent cassés ou vides.

L'action qui résout ça s'appelle « pousser les migrations » (en anglais `supabase db push`, push voulant dire « pousser, envoyer »). Mais, et c'est un verrou absolu que je dois te rappeler parce qu'il touche à des données irremplaçables :

**On ne pousse RIEN tant qu'on n'a pas fait une sauvegarde externe complète et vérifiée de la base distante.**

Tu as 17 746 signatures avec leurs consentements RGPD, 15 737 profils, 35 011 communes. Tu m'as dit avoir déjà ces données en local, plus tout le site et les documents matrices : c'est rassurant et ça veut dire que tu n'es pas démuni. Mais je dois être précis, parce que se tromper ici coûterait cher. Avoir le site et des données en local n'est pas la même chose qu'avoir un export récent et complet de la base distante Supabase, c'est-à-dire une copie de l'état exact de la base en ligne, daté, et dont tu as vérifié qu'il se recharge sans erreur. C'est ce dernier point qui manquait au 25 mai. Donc avant toute poussée vers le distant, la règle reste : produire cet export distant (la commande s'appelle `pg_dump`, c'est l'outil qui fabrique une copie complète d'une base de données), vérifier qu'il se restaure, puis seulement pousser, puis remplir les nouvelles tables (« backfill », c'est-à-dire recopier les données existantes dans les nouvelles tables) en mode essai puis en mode réel.

Bonne nouvelle liée à ton confort : si tes données locales sont à jour, on peut même travailler et montrer tout le site sans toucher au distant pendant longtemps. La poussée ne devient nécessaire que le jour de la mise en ligne réelle. Donc ce verrou ne te ralentit pas pour construire : il ne s'applique qu'à la Phase M.

Mais bonne nouvelle liée à ta stratégie budgétaire : cette poussée vers le distant ne devient vraiment nécessaire que lorsque tu veux que le site marche en ligne pour de vrai. Pour continuer à construire et à montrer en local, on peut travailler autrement, et je propose en partie 5 une option qui t'évite de toucher au distant trop tôt.

## 2.4 Le visuel : un socle correct, une finition à faire

Tu as raison sur les deux points que tu as faits ce matin. D'un côté, le rendu s'est nettement amélioré, et tes captures de pétition le montrent : c'est propre, lisible, le bouton dégradé est là. De l'autre, beaucoup d'espaces sont trop austères, et le réseau social ne ressemble pas à ce que les gens connaissent.

J'ai vérifié le dégradé dans le code. Il existe, il est nommé `--grad`, et il est exactement celui que tu décrivais de mémoire : violet vers magenta vers framboise, précisément `#7C3AED` puis `#E11D74` puis `#DC2654`. Le document de design dit lui-même que ce dégradé est « le marqueur identitaire principal » et qu'il doit se retrouver sur les boutons d'action majeurs. Le problème n'est donc pas qu'il manque, c'est qu'il n'est pas assez présent. On va demander à Claude Code de le réinjecter aux bons endroits, ce qui est un travail simple et très rentable visuellement.

## 2.5 Ce qui est vraiment à zéro

Pour être complet et honnête, voici ce qui n'a pas de fondation du tout, par opposition à ce qui a une fondation sans façade.

Les quatre grandes fiches de la dernière vague de travail (l'espace membre, l'interface d'administration et de modération, les éléments transverses comme la carte unifiée et l'agenda, et les fondations d'édition) n'ont pas de spécification écrite. Pour certaines, comme l'espace membre, c'est normal d'attendre que tu écrives la fiche parce qu'il y a du contenu sensible (confidentialité, données personnelles). Pour d'autres, comme l'amélioration de l'interface d'édition, Claude Code peut avancer sans fiche parce que c'est de l'ergonomie sur des patterns déjà posés.

Les huit pages éditoriales de fond (doctrine, commune libre, monnaie 99-coin, mentions légales, etc.) attendent que tu écrives leurs textes. C'est du travail d'écriture, pas de code, et c'est typiquement ce que tu peux mâcher en marchant ou capter à l'oral.

---

# PARTIE 3 — La vision d'ensemble que tu as formulée ce matin

Cette partie reformule, en la structurant, la pensée que tu as déroulée pendant la marche. Ce n'est pas du neuf inventé par moi : c'est ta doctrine, que je relie à ce qui est déjà écrit dans tes spécifications V2 et à ce qui est déjà codé. La belle surprise de ma lecture, c'est que ta doctrine V2 sur le papier dit presque exactement ce que tu m'as dit à l'oral. Le travail n'est donc pas d'inventer, c'est de brancher le déjà-décidé sur le déjà-codé.

## 3.1 Principe fondateur : tout espace collectif est un espace d'action complet

C'est le cœur de tout. Tu l'as dit avec l'exemple d'Alternatiba, parti d'un festival convivial pour devenir une matrice de mobilisation climatique. La leçon : on ne décide jamais à l'avance du plafond d'engagement d'un groupe. On lui donne tous les outils, vides au départ, et les gens les activent à mesure que leur envie grandit.

Concrètement, cela veut dire qu'une commune libre, une fédération, une confédération, un groupe de travail, un groupe d'entraide, une organisation, et même une simple page ou un groupe du réseau social, possèdent tous, par défaut, la même boîte à outils complète : la possibilité de lancer une pétition, une mobilisation, une cagnotte, un sondage, un événement, un mini-blog, un fil de discussion, une carte, et le reste. Personne n'a à « créer une campagne » séparément : l'espace est déjà capable de tout faire.

Ta documentation V2 appelle ça « l'espace agrégateur universel » et le formule presque mot pour mot : tous les espaces créent et contiennent tous les objets du site, via un composant unique réutilisé partout. La fiche de la commune libre dit même qu'elle est « un Maintenant! en miniature ». Donc la doctrine est écrite. Ce qui manque, c'est que dans les écrans, ces outils ne sont pas tous présentés ni activables. À faire.

## 3.2 Principe : le double visage réseau social et espace d'action

Tu as insisté là-dessus à la fin. Quand quelqu'un crée une page ou un groupe sur le réseau social, il ne crée pas seulement un objet façon Facebook (où l'on peut publier, commenter, faire des événements, mais où la capacité communautaire reste limitée). Il crée en même temps son « double » : un espace d'action complet, vide et personnalisable, qui possède toute la boîte à outils du 3.1.

L'image que tu cherchais sans trouver le mot, peu importe le nom puisqu'il sera éditable : c'est un lieu d'organisation rattaché à la page sociale. Les gens rejoignent la page côté réseau, et peuvent basculer côté espace d'action quand ils veulent s'organiser pour de vrai. Ta documentation V2 parle exactement de ça sous le nom de « deux réseaux sociaux complémentaires » : celui des personnes et celui des espaces, avec la formule « s'organiser est social, être social sert à s'organiser ».

C'est la réponse directe à ta critique de Change, de l'Affaire du Siècle et de la Primaire Populaire : des foules captées, jamais transformées en communauté qui s'autodétermine. Ton site est précisément conçu pour ne pas refaire cette erreur. Chaque interaction sociale ouvre une porte vers l'organisation.

## 3.3 Principe : le tunnel d'engagement permanent

C'est ta deuxième grande idée, et c'est ton domaine d'expertise. On ne laisse jamais retomber l'énergie de quelqu'un qui vient d'agir. Chaque action réussie débouche immédiatement sur une proposition d'action suivante, un peu plus engageante, en réutilisant l'élan et les informations déjà données.

Le tunnel que tu as décrit en détail pour la pétition est le modèle de référence : signer, puis confirmer par email, puis se voir proposer l'adhésion avec un formulaire pré-rempli, puis rejoindre sa commune en un clic, puis inviter ses proches. Chaque marche s'appuie sur la précédente. Ton taux de transformation de 2 % (472 adhésions sur 17 746 signatures, soit le double du taux habituel) prouve que cette méthode marche déjà. Le site doit l'outiller systématiquement.

J'ai consacré toute la partie 6 à proposer des tunnels pour les autres espaces, à arbitrer avec toi.

## 3.4 Principe : tout est éditable par toi, c'est la condition de ton autonomie

Tu l'as dit fortement, et j'en fais un principe de rang égal aux autres. Tout texte, toute image, tout message, tout émoji visible sur le site doit être modifiable par toi sans toucher au code, à travers ce qu'on appelle un CMS.

Le mot CMS veut dire « Content Management System », en français « système de gestion de contenu ». C'est tout simplement une interface où une personne autorisée modifie les contenus du site (les textes, les images, les messages) en remplissant des champs, comme on remplit un formulaire, sans jamais voir ni toucher le code. C'est ce qui te rendra indépendant.

Mais je dois maintenir la mise en garde que je t'ai faite ce matin, parce qu'elle évite une grosse déception. Le CMS rend éditable le contenu, pas la structure. Changer le texte et l'image d'une page, oui. Décider qu'une page a une bannière, un logo et trois colonnes, non, ça reste du code. Donc le bon objectif n'est pas « tout par le CMS » au sens littéral, mais « la bonne structure codée une fois, puis tout son contenu éditable à vie ». Avec cette nuance, ta vision tient parfaitement.

Tu as ajouté un raffinement important pour la commune libre et les espaces d'action : tu veux pouvoir ajouter des petits blocs personnalisables, façon newsletter. Un bloc texte, un bloc image, un bloc lien, un bloc bouton, que tu places toi-même pour, par exemple, afficher le lien du groupe WhatsApp de ta commune d'Argenteuil. C'est faisable, et c'est un entre-deux malin entre le contenu pur et la structure pure : on code une fois un petit jeu de blocs réutilisables, et ensuite tu les arranges sans code. J'en fais une phase dédiée.

## 3.5 Principe : ressembler au monde où vivent les gens

Ta formule était parfaite : les gens doivent entrer dans un nouveau monde en ayant l'impression de ne pas quitter celui d'où ils viennent. Chaque espace emprunte les codes visuels du leader de son domaine, pour que le geste soit déjà connu.

La règle, espace par espace : le transport solidaire ressemble à BlaBlaCar, le marché solidaire à Vinted, l'hébergement à Airbnb, les pétitions aux grandes plateformes de pétition, les sondages aux outils de sondage connus. Pour le système d'échange local (le SEL, c'est-à-dire l'échange de services entre personnes sans argent) et pour le prêt d'objets, il n'existe pas de leader convenable : tous les sites du genre sont laids. Là, on ne copie personne, on transpose la grammaire visuelle des autres (la grille de vignettes, la photo, la fiche claire, le profil avec note) sur un domaine qui n'a jamais eu de belle interface. Ce serait même un atout distinctif.

Et c'est le dégradé magenta-framboise-violet qui garde l'âme Maintenant! par-dessus ces codes empruntés : structure familière, couleur et vocabulaire singuliers.

## 3.6 Principe : des données de démonstration pour voir le site vivant

Tu as besoin de voir ton site peuplé pour juger de son allure et pour ne pas te perdre. La solution propre : créer six profils de démonstration (nommés simplement test1, test2, et ainsi de suite) et, avec eux, six annonces, six publications, des groupes, des événements, dans chaque espace. Pourquoi six : parce que six vignettes font une belle grille sur ordinateur comme sur tablette, et que sur téléphone on fait défiler de toute façon.

Le point technique qui rend ça propre : chaque donnée de démonstration porte un marqueur invisible « ceci est de la démo ». Ça permet deux choses. Tout s'affiche normalement, comme du vrai, donc tu vois enfin ton site vivant. Et un seul bouton d'administration « supprimer toutes les données de démo » efface d'un coup tout ce qui porte le marqueur, sans toucher à une seule donnée réelle. Tu peux nettoyer quand tu veux, et recréer quand tu veux. Ce ne sont pas des mocks bricolés : ce sont de vraies entrées en base, avec de vraies images, juste étiquetées comme démo.

## 3.7 Principe : des images partout, jamais un trou gris

Règle générale : aucun objet ne s'affiche jamais sans image. Trois niveaux, dans l'ordre. Si la vraie image existe, on la montre. Sinon, une image par défaut choisie par thème, prise dans une banque d'images libres de droits (une foule pour une mobilisation, un potager pour l'entraide alimentaire). Sinon seulement, un bloc de couleur du dégradé.

Mon conseil, que tu as déjà à moitié validé : banque d'images libres plutôt que génération par intelligence artificielle. C'est instantané, gratuit, et une vraie photo respire mieux qu'une image générée souvent un peu fausse. On garde la génération pour plus tard si tu veux du sur-mesure. Et comme tout est éditable, le jour de ta curation tu remplaces les images par défaut par les tiennes, sans code.

---

# PARTIE 4 — La logique de gouvernance et d'argent, pour ne pas se tromper

Cette partie courte rappelle deux règles structurantes que j'ai trouvées dans ta doctrine V2 et qui doivent encadrer tout le travail, parce qu'elles touchent au droit et à l'argent. Je les mets en clair pour que tu puisses les vérifier et les corriger si besoin.

## 4.1 Deux régimes d'argent, à ne jamais confondre

Ta doctrine distingue deux cas, et c'est juste juridiquement.

Le régime direct : quand deux personnes s'échangent de l'argent (covoiturage, hébergement, prêt, marché solidaire, cagnotte avec bénéficiaire extérieur), l'argent va directement de l'une à l'autre, et Maintenant! ne touche jamais rien. Zéro coût, zéro risque juridique de transit.

Le régime de collecte : quand l'argent va au mouvement lui-même (adhésions, cotisations, dons généraux, cagnottes solidaires), il arrive bien chez Maintenant!, dans une caisse dédiée, avec une comptabilité interne et des justificatifs obligatoires pour chaque sortie.

Dans les deux cas, le 99-coin est toujours proposé à côté de l'euro. Une seule exception notée dans ta doctrine : la location mutualisée, en euros uniquement, où l'organisateur fait tampon.

## 4.2 Deux logiques de pouvoir, à ne jamais mélanger

Ta doctrine distingue le pouvoir du mouvement (démocratique, par mandat et par vote, via l'espace Décider) et le pouvoir de la plateforme (technique, par cooptation, qui n'ouvre aucun droit politique). L'analogie interne, non montrée au public, est celle d'une administration au service d'un pouvoir législatif. C'est important pour Claude Code quand il code les droits d'administration : un rôle technique ne doit jamais donner un droit de vote en assemblée.

C'est exactement le cadre dans lequel s'inscrit ton idée de déléguer un rôle de maintenance CMS à deux ou trois personnes : ce sont des cooptés techniques, pas des élus politiques. Le code doit le permettre proprement.

## 4.3 Le cadre juridique réel, à inscrire dans le site

Ce point était bloquant pour Claude Code, et à juste titre : il ne pouvait pas inventer ton statut juridique. Tu l'as fourni, je le mets au clair pour qu'il code l'espace profil et les mentions légales sans plus attendre de fiche. Trois entités à ne jamais confondre.

**L'association.** Elle est juridiquement le mouvement, c'est la même chose en droit. Son bureau (présidence, trésorerie) se renouvelle par cooptation parmi les membres fondateurs. Les membres fondateurs forment une instance de deux à onze personnes qui gère tout le juridique et toute l'infrastructure (les liens légaux de la structure). C'est l'équivalent d'un conseil d'administration composé uniquement de fondateurs.

**La plateforme.** C'est l'administration technique (modération, admin, rédaction). Elle fonctionne par cooptation et n'ouvre aucun droit politique, conformément au 4.2.

**Le mouvement.** Ce sont tous les espaces. Il se dote de quatre co-secrétaires généraux qui sont les porte-parole et les figures de représentation. Mandat de trois ans renouvelable une fois. La désignation suit un ordre précis : l'assemblée confédérale lance un appel, on vote d'abord les textes d'orientation, et seulement ensuite viennent les candidatures (les candidatures ne sont pas liées d'avance aux textes ; on vote les orientations, puis les personnes).

**L'état d'aujourd'hui, à inscrire partout.** Vous êtes pour l'instant un collectif, qui deviendra très vite une association. En droit, un collectif est une association de fait : vous êtes donc déjà une forme d'association, sans compte bancaire propre, et Ben est aujourd'hui mandaté par le collectif pour collecter les contributions (ce qui est légal mais lourd, et que l'association allègera en permettant la délégation). En conséquence, l'entité juridique à inscrire dans toutes les mentions RGPD et légales du site est **« Collectif Maintenant »** (le nom exact, sans mention de copyright), accompagné du logo poing levé et coquelicot. Les coordonnées de contact RGPD restent un placeholder éditable, que Ben remplira lui-même via le CMS.

Pour Claude Code, cela veut dire concrètement : il peut écrire les mentions RGPD, la page de confidentialité et l'espace profil dès maintenant, en utilisant « Collectif Maintenant » comme responsable de traitement et un placeholder éditable pour les coordonnées de contact. Plus aucune raison de bloquer sur le profil utilisateur pour motif juridique.

---

*(Suite en partie 5 et au-delà : les phases de travail, les tunnels d'engagement, et les directives permanentes pour Claude Code.)*

---

# PARTIE 5 — Le plan de travail par phases

Voici le cœur opérationnel. J'ai découpé tout ce qu'on s'est dit, plus ce qui manquait avant, en phases qui s'enchaînent logiquement. Chaque phase est pensée pour être confiée à Claude Code en un bloc, avec un objectif clair, un résultat visible à la fin, et zéro dépendance à un service payant.

Une note sur l'ordre : j'ai placé en premier ce qui te permet de voir vite ton site prendre vie, parce que c'est ça qui te redonne de l'élan et qui te sert à montrer le produit pour lever du soutien. Le câblage payant et la mise en ligne réelle viennent en toute fin, comme tu l'as demandé.

## Phase A — Voir le site vivant tout de suite

**Objectif** : peupler le site de contenu de démonstration et mettre des images partout, pour que tu puisses enfin juger de l'allure réelle, sur ton ordinateur, sans rien câbler.

**Pourquoi en premier** : parce que tout le reste du travail visuel a besoin d'un site peuplé pour être jugé. Décorer un espace vide ne sert à rien ; décorer un espace plein de six annonces et six profils, tout de suite tu vois ce qui va et ce qui ne va pas.

**Contenu** : créer le mécanisme de marqueur de démonstration (le drapeau invisible et le bouton de nettoyage en un clic décrits en 3.6), puis créer six profils de démonstration et, dans chaque espace, six entrées réalistes (six pétitions, six annonces de marché, six trajets de covoiturage, six publications de réseau, des groupes, des événements). Mettre en place la règle des images par défaut par thème depuis une banque libre de droits (3.7).

**Résultat visible** : tu ouvres le site, il est plein, il a des têtes et des photos, tu peux te promener dedans comme dans un vrai site fréquenté.

**Service payant nécessaire** : aucun. Tout en local et en mock.

## Phase A-bis — Débloquer l'espace profil et les mentions légales

**Objectif** : faire écrire à Claude Code l'espace profil utilisateur et les mentions RGPD, qu'il refusait jusqu'ici par prudence juridique, maintenant qu'on lui a fourni le cadre (4.3).

**Pourquoi maintenant** : le blocage n'était pas technique, il était juridique. Le cadre étant fourni, le blocage tombe.

**Contenu** : écrire les mentions RGPD, la page de confidentialité et l'espace profil en utilisant « Collectif Maintenant » comme responsable de traitement, et un placeholder éditable pour les coordonnées de contact (que tu rempliras via le CMS). Coder l'espace profil de base : informations personnelles, confidentialité, contributions, et l'emplacement du wallet en lecture seule (l'affichage du solde 99-coin, sans wallet intégré, conformément à ta doctrine). Tous les textes légaux sont des clés CMS éditables.

**Résultat visible** : ton site a un espace profil et des pages légales propres, au nom du Collectif Maintenant, que tu pourras compléter toi-même.

**Service payant nécessaire** : aucun.

## Phase B — Réinjecter l'identité visuelle

**Objectif** : remettre le dégradé signature aux bons endroits et resserrer la cohérence graphique.

**Contenu** : repérer tous les boutons d'action majeurs et leur appliquer le dégradé `--grad` (violet-magenta-framboise) déjà présent dans le code. Vérifier que le basculement clair/sombre reste beau dans les deux modes. Ajouter le logo au poing levé et coquelicot dans le pied de page (le « footer », c'est-à-dire le bas de page présent sur tout le site), pas dans l'en-tête. Donner une touche plus chaleureuse aux espaces les plus austères.

**Résultat visible** : le site a une signature couleur reconnaissable, partout, et une petite âme militante en bas de page.

**Service payant nécessaire** : aucun.

## Phase C — Le gabarit riche des espaces collectifs

**Objectif** : donner à la commune libre, aux groupes de travail, aux fédérations et aux groupes d'entraide le même gabarit riche que l'espace campagne, comme tu l'as demandé : image de couverture, logo, bloc descriptif, et la boîte à outils d'action complète.

**Pourquoi c'est faisable sans fiche** : c'est de la réplication d'un gabarit qui existe déjà (l'espace campagne), pas de l'invention de contenu. Claude Code a le droit de copier une structure existante.

**Contenu** : appliquer le composant d'espace agrégateur (déjà décrit dans ta doctrine §3) à tous ces espaces, pour qu'ils puissent activer pétition, mobilisation, cagnotte, sondage, événement, mini-blog, fil de discussion, carte. Ajouter les zones image de couverture, logo, descriptif. Tous les textes de ces zones sont des clés CMS éditables par toi.

**Résultat visible** : tu entres dans une commune libre, elle ressemble à un véritable espace d'organisation, tu peux la décorer et y lancer des actions.

**Service payant nécessaire** : aucun.

## Phase D — Les blocs personnalisables façon newsletter

**Objectif** : te permettre d'ajouter toi-même, dans un espace collectif, des petits blocs libres (texte, image, lien, bouton) sans code, comme on compose une newsletter.

**Contenu** : coder une fois un petit jeu de blocs réutilisables et un éditeur simple pour les empiler et les remplir. Premier usage concret : afficher le lien du groupe ou de la communauté WhatsApp ou Telegram d'une commune, pour que les gens le rejoignent.

**Résultat visible** : dans ta commune d'Argenteuil, tu ajoutes toi-même un bloc « rejoins notre WhatsApp » avec le bon lien, sans demander à personne.

**Service payant nécessaire** : aucun.

## Phase E — Le tunnel pétition vers adhésion vers commune

**Objectif** : construire bout à bout le parcours phare décrit en 3.3, qui est ton modèle de référence.

**Contenu** : la modale de signature allégée (on retire « afficher mon nom publiquement », trop de friction), l'écran de remerciement, l'email de confirmation, la page de confirmation qui propose l'adhésion avec formulaire pré-rempli, le choix du type d'adhésion en trois boutons (gratuit, euros, 99-coin), puis la page « retrouver des gens près de chez moi » avec ses quatre blocs (commune du code postal, sous-préfecture la plus proche, préfecture la plus proche, autre commune), le rejoignement de commune en un clic, et l'enchaînement immédiat vers l'invitation.

**Point d'attention** : l'email de confirmation passe par l'adaptateur mock pour l'instant. Le contenu de l'email doit déjà être soigné même en mock (voir Phase F), pour que le jour du branchement réel, il n'y ait rien à refaire.

**Résultat visible** : tu signes une pétition de démonstration et tu déroules tout le tunnel jusqu'à te retrouver membre d'une commune, prêt à inviter.

**Service payant nécessaire** : aucun en construction. Le vrai envoi d'email viendra au câblage final.

## Phase F — Le moteur d'invitation virale

**Objectif** : l'écran d'invitation décrit en bloc viral, irréprochable parce que c'est lui qui transforme un engagement en plusieurs.

**Contenu** : deux voies sur le même écran. La voie interne, inviter des amis du réseau social (les sélectionner dans une liste, ou s'inscrire au réseau si on n'y est pas). La voie externe, des liens de partage vers WhatsApp, Telegram, Messenger, Signal, Discord, email, Mastodon, qui ouvrent l'application concernée avec un message déjà écrit que la personne peut modifier. Le message pré-écrit est une clé CMS éditable par toi, pour que tu l'adaptes à chaque campagne.

**Note technique rassurante** : les liens de partage sont une technique simple et universelle, ils ne demandent aucune connexion payante ni aucune clé. C'est codable entièrement en local.

**Résultat visible** : depuis ta commune, tu cliques « inviter », tu choisis WhatsApp, ton WhatsApp s'ouvre avec un message prêt.

**Service payant nécessaire** : aucun.

## Phase G — Brancher la double relation aux campagnes

**Objectif** : poser enfin la pédale sur le moteur déjà construit (2.1).

**Contenu** : ajouter sur chaque objet rattachable (pétition, mobilisation, cagnotte, sondage) le bouton « intégrer à une campagne », avec la modale qui propose de choisir une campagne existante ou d'en créer une à la volée. S'appuyer sur la table `module_campagne` et la fonction `attacherModule` qui existent déjà.

**Résultat visible** : tu crées une pétition, tu cliques « intégrer à une campagne », tu la rattaches, et elle apparaît dans la campagne.

**Service payant nécessaire** : aucun.

## Phase H — Le double visage réseau social et espace d'action

**Objectif** : réaliser le principe 3.2, le plus ambitieux. Quand on crée une page ou un groupe sur le réseau social, créer en même temps son espace d'action complet.

**Pourquoi je la place après les autres** : parce qu'elle s'appuie sur le gabarit riche (Phase C) et sur la mécanique d'appartenance. Une fois ces briques posées, ce double visage devient une combinaison de l'existant plutôt qu'une nouveauté.

**Contenu** : à la création d'une page ou d'un groupe social, générer automatiquement son espace d'action lié, vide et personnalisable, doté de toute la boîte à outils. Permettre de basculer de l'un à l'autre. Permettre aux gens de rejoindre l'un, l'autre, ou les deux.

**Résultat visible** : tu crées un groupe sur le réseau, et il a tout de suite son espace d'organisation prêt à être rempli.

**Service payant nécessaire** : aucun.

## Phase I — Embellir les espaces type plateforme

**Objectif** : appliquer le principe 3.5 espace par espace, un à la fois, bien fini.

**Contenu, dans un ordre conseillé** : d'abord le marché solidaire façon Vinted (grille de vignettes, photo carrée, prix, vendeur avec note), parce qu'il bénéficie le plus de l'effet visuel. Ensuite le transport solidaire façon BlaBlaCar (trajet, départ, arrivée, heure, conducteur noté), avec ton idée de carte qui n'affiche que les points de rendez-vous de départ pour rester lisible. Ensuite l'hébergement façon Airbnb. Ensuite le SEL et le prêt, qui n'ont pas de modèle et reçoivent la grammaire transposée. À chaque fois, le dégradé garde l'âme Maintenant!.

**Résultat visible** : chaque espace ressemble au service grand public que les gens connaissent, en version Maintenant!.

**Service payant nécessaire** : aucun.

## Phase J — Le réseau social plus chaleureux

**Objectif** : répondre à ton « le réseau social est super moche, ça ne ressemble pas à Facebook ».

**Contenu** : retravailler la présentation du fil, des profils, des publications, pour s'approcher des codes que les gens connaissent, tout en gardant ton algorithme de flux politique déjà conçu (le fameux dosage qui met en avant tes propres publications, puis les amis, puis le reste, sans publicité ni manipulation cachée). Mettre des avatars, des images de couverture, des cartes de publication soignées.

**Résultat visible** : le réseau donne envie d'y rester et d'y publier.

**Service payant nécessaire** : aucun.

## Phase K — Améliorer l'interface d'édition CMS

**Objectif** : transformer les très nombreuses clés éditables (plus de 1 200) en un outil réellement utilisable par toi et par tes futurs délégués.

**Pourquoi c'est important** : aujourd'hui l'éditabilité existe mais l'interface pour s'en servir est minimale. Une liste de 1 200 clés à plat, personne n'ose y toucher. Il faut regrouper par espace, distinguer visuellement « contenu que tu voudras changer » et « réglage technique », et offrir un aperçu avant publication.

**Contenu** : une console d'édition organisée, avec recherche, regroupement, aperçu, et la possibilité de donner à une personne un rôle de maintenance CMS sans lui donner de pouvoir politique (cf. 4.2).

**Résultat visible** : tu trouves en dix secondes le texte à changer, tu le changes, tu vois le résultat, tu publies. Et tu peux confier cette tâche à un proche en confiance.

**Service payant nécessaire** : aucun.

## Phase L — Les emails soignés par défaut

**Objectif** : répondre à ton « les mails sont super moches ».

**Contenu** : créer des gabarits d'email propres et identitaires (avec le logo, le dégradé, une mise en page claire) pour tous les emails que le site envoie (confirmation de signature, bienvenue, invitation). Ces gabarits doivent être beaux même dans le minimum envoyé quand tu n'as pas préparé de campagne dédiée chez le fournisseur d'email. Le texte des emails est éditable par toi via le CMS, mais leur mise en forme est codée une fois.

**Résultat visible** : les emails de démonstration sont déjà beaux, et le jour du branchement réel, il n'y a rien à refaire.

**Service payant nécessaire** : aucun en construction. Le fournisseur d'email réel viendra au câblage final.

## Phase M — La sauvegarde, puis la mise en ligne réelle

**Objectif** : faire passer le site du local au réel, en sécurité.

**Ordre impératif, sans aucune exception** : export complet et vérifié de la base distante (l'outil `pg_dump`, qui fabrique une copie complète d'une base de données), vérification que cet export se restaure, puis poussée des migrations en attente, puis remplissage des nouvelles tables en mode essai, puis en mode réel. C'est le verrou de la partie 2.3. Avoir des données en local ne dispense pas de cet export distant daté et testé.

**Quand** : seulement quand tu décides que le moment est venu de mettre en ligne. Pas avant. Tant que tu construis et montres en local, on n'y touche pas.

**Service payant nécessaire** : l'hébergement réel, à arbitrer à ce moment-là.

## Phase N — Le câblage final des services payants

**Objectif** : basculer les adaptateurs mock vers les vrais services, une fois ton budget arbitré et ton soutien levé.

**Contenu** : remplacer mock par les vrais réglages, un service à la fois, en vérifiant chacun. Email réel, paiements réels, anti-robot réel, et le reste selon tes priorités budgétaires.

**Quand** : en tout dernier, déclenché par toi seul, quand tu sais qui paie quoi. C'est une demi-journée de travail, pas un préalable.

---

# PARTIE 6 — Les tunnels d'engagement à arbitrer ensemble

Tu m'as demandé de proposer des tunnels pour les autres espaces, sur le modèle du tunnel pétition. En voici une série. Ce sont des propositions, pas des décisions : on les arbitrera ensemble. Le principe commun, toujours le même : ne jamais laisser retomber l'énergie de quelqu'un qui vient d'agir, et lui proposer l'action suivante un cran plus engageante.

## 6.1 Tunnel média : lire vers partager vers soutenir

Une personne lit un article de Maintenant Médias. À la fin de sa lecture, on lui propose de partager l'article. Si elle partage, c'est un signe de motivation. On la remercie sur la page, et on enchaîne : « merci de soutenir notre média indépendant, sans publicité ; un don nous aide à continuer ». Don en 99-coin ou en euros. Le partage devient une porte vers le soutien financier.

## 6.2 Tunnel marché : acheter vers contribuer à l'économie

Une personne achète un produit sur le marché solidaire. Elle est une consommatrice. L'objectif du système est de la faire passer de consommatrice à contributrice. Après l'achat, on lui explique en une phrase que cette économie alternative ne vit que si chacun y dépose aussi, et on lui propose de mettre à son tour un produit ou un service en vente. Le geste d'achat devient une porte vers la contribution à l'écosystème.

## 6.3 Tunnel entraide : recevoir vers donner

Une personne bénéficie d'un service (un covoiturage, un prêt d'objet, un coup de main). Une fois le service rendu et confirmé, on lui propose d'en offrir un à son tour. Recevoir crée une dette douce envers le collectif, que donner vient solder. C'est la réciprocité au cœur du SEL, outillée par le tunnel.

## 6.4 Tunnel commune : rejoindre vers inviter vers structurer

Une personne rejoint sa commune. Si elle est seule ou presque, on l'invite tout de suite à inviter ses proches (le moteur viral de la Phase F). Quand la commune atteint cinq membres, ta doctrine prévoit déjà un message automatique proposant de se structurer (binôme paritaire, première réunion, première action). Le tunnel relie l'arrivée individuelle à la naissance d'un collectif organisé.

## 6.5 Tunnel sondage : répondre vers qualifier vers partager

Une personne répond à un sondage. Au lieu de l'envoyer aussitôt vers une décision lourde, on l'invite d'abord à qualifier son propre sondage (préciser, nuancer, situer sa réponse). Puis, une fois cette qualification faite, on lui propose simplement de partager le sondage, soit dans le réseau social interne, soit sur les réseaux extérieurs (mêmes liens de partage que le moteur viral). Répondre devient une porte vers la diffusion, sans imposer la marche trop haute d'une participation à Décider juste après un simple sondage.

## 6.6 Tunnel mobilisation : participer vers ramener du monde

Une personne s'inscrit à une mobilisation. On lui propose immédiatement d'inviter des proches à venir avec elle, et de rejoindre la commune ou la campagne organisatrice pour préparer la suite. Le geste ponctuel de participation devient une porte vers l'engagement durable.

## 6.7 Le principe d'arbitrage

Pour chaque tunnel, la question à se poser ensemble est : quelle est l'action suivante naturelle, juste un cran plus engageante, qui respecte la personne sans la presser ? Et le passage entre univers très différents (du militantisme vers le marché, par exemple) ne doit pas être brutal : on relie ce qui a du sens, on ne force pas. Ta doctrine prévoit d'ailleurs de ne pas donner une allure trop commerciale au site, donc les tunnels vers le marché restent discrets.

---

# PARTIE 7 — Les arbitrages que je te laisse

Pour ne pas décider à ta place sur ce qui relève de ton expertise ou de ton goût, voici les points ouverts. Tu trancheras quand tu liras ce document.

Premier point, l'ordre des espaces à embellir en Phase I. J'ai proposé marché, puis transport, puis hébergement, puis SEL et prêt. Tu peux préférer commencer par celui qui te servira le plus tôt pour montrer le produit.

Deuxième point, le covoiturage sur la carte unifiée. Tu hésitais. Ma proposition : n'afficher que les points de rendez-vous de départ, pas les trajets entiers, pour rester léger et lisible. À valider.

Troisième point, les groupes d'entraide sur la carte unifiée. Tu as noté qu'ils manquaient. Je propose de les ajouter. À confirmer.

Quatrième point, le nombre de données de démonstration. Tu as dit six, parfois tu hésitais entre six et dix. Je recommande six, pour la raison de grille que tu as toi-même donnée. À confirmer.

Cinquième point, les tunnels de la partie 6. Lesquels te parlent, lesquels veux-tu retravailler, lesquels écarter.

Sixième point, le sort de Base44. Tu hésites à le garder pour quelques fonctions. À décider selon ton budget, sachant que le but est de t'en libérer.

---

# PARTIE 8 — Les directives permanentes pour Claude Code

C'est la partie qui répond à ta vraie douleur : Claude Code qui bloque, qui jargonne, qui réclame des clés. Ces directives sont à ajouter à son fichier de mémoire (le CLAUDE.md). Je te les donne rédigées, prêtes à coller. Elles sont écrites pour qu'il les comprenne et les applique sans interprétation.

## 8.1 Directive anti-blocage sur les fiches

« Pour tout chantier de design, de gabarit, ou de données de démonstration : tu répliques des structures existantes et tu crées du contenu de démonstration. Cela ne relève pas de l'invention de contenu politique ou éditorial, c'est explicitement autorisé par la règle de non-invention. Tu ne demandes pas de fiche pour répliquer un gabarit qui existe déjà. Tu n'inventes aucun texte politique : à la place, tu mets des placeholders visibles et des clés CMS éditables. Le design et les gabarits ne sont pas de la préparation : ce sont des chantiers à exécuter en entier. »

## 8.2 Directive anti-blocage sur les clés API

« Tu ne bloques jamais en réclamant une clé API ou un service externe. Tout se construit en mode mock, le site tourne à cent pour cent en local sans aucune clé payante. Le câblage des services payants (email, paiement, anti-robot, visio) est un chantier final unique, déclenché par Ben seulement, à la toute fin du projet. Si une fonction a besoin d'un service externe, tu la construis contre l'adaptateur mock et tu continues. »

## 8.3 Directive anti-jargon

« Ben n'est pas technicien. Pars toujours du principe qu'il ne connaît aucun terme technique. Tu peux et tu dois employer les bons mots du métier, parce que ça l'aide à apprendre, mais tu développes systématiquement chaque sigle et tu expliques chaque terme entre parenthèses, à chaque fois, même si tu l'as déjà expliqué avant. Exemples obligatoires : CMS veut dire système de gestion de contenu, l'interface où l'on modifie les textes sans toucher au code ; commit veut dire enregistrer une étape de travail dans l'historique ; push veut dire envoyer ces enregistrements vers GitHub en ligne ; une migration est un fichier qui modifie la base de données. Tu dis toujours dans quel outil une action se passe : sur ton ordinateur, dans Supabase en ligne, dans GitHub, dans Docker. Tu ne supposes jamais qu'une explication donnée une fois est acquise. »

## 8.4 Directive de pédagogie technique

« Tu travailles une action à la fois. Tu donnes des blocs à copier-coller, jamais des listes denses d'instructions. Tu expliques toujours la différence entre les outils que tu mentionnes : Supabase est la base de données en ligne ; Docker est une façon d'emballer le site pour le faire tourner ailleurs ; GitHub est l'endroit où vit le code en ligne ; un manifest est une note qui résume un chantier fini. Quand tu proposes un choix à Ben, tu n'offres pas d'options techniques qu'il ne peut pas arbitrer : tu fais le choix technique raisonnable toi-même et tu lui expliques ce que tu as choisi et pourquoi, en langage clair. »

## 8.5 Directive d'autonomie sous supervision

« Tu travailles en autonomie par blocs. À l'intérieur d'un bloc, tu avances sans t'arrêter pour des questions de détail : tu fais le choix raisonnable et tu continues. Tu t'arrêtes seulement aux portes que Ben a définies : tout ce qui touche au contenu politique, à l'argent réel, aux droits politiques, ou à la base de données distante. Pour tout le reste, tu exécutes le bloc en entier puis tu rends compte simplement de ce que tu as fait, en langage clair. »

## 8.6 Directive de rythme soutenable

« Ben réduit sa charge mentale en finissant le dossier : pour lui, l'inachèvement prolongé coûte plus cher que des journées denses. Donc tu ne freines pas son avancée. Des sessions de quatre à cinq heures d'affilée sont normales et acceptables, dans la limite d'environ huit heures de travail par jour. Ce que tu surveilles n'est pas l'intensité mais le dérapage : le travail qui empiète sur le sommeil, les journées qui dépassent nettement huit heures, l'enchaînement sans aucune coupure. Dans ces cas seulement, tu suggères avec tact une pause ou une clôture. Le reste du temps, tu avances avec lui sans le ralentir. »

## 8.7 Directive anti-arrêt

« Ce plan de travail ne doit jamais te conduire à t'arrêter de toi-même en déclarant le projet en pause ou en attente. Tu travailles par blocs : à la fin d'un bloc, tu rends compte et tu proposes d'enchaîner le bloc suivant, tu n'attends pas une relance pour continuer si Ben t'a donné le feu vert pour une session. Le découpage en blocs sert à structurer ton travail et à permettre la supervision, pas à interrompre l'élan. Tu ne dis jamais "il faudrait d'abord une fiche" pour un chantier de design, de gabarit ou de données de démonstration : ces chantiers sont autorisés par défaut (cf. 8.1). Tu ne dis jamais "il me faut une clé" pour continuer (cf. 8.2). Tant qu'un bloc relève de la technique, du design ou de la réplication, tu l'exécutes en entier sans demander de validation intermédiaire. »

## 8.8 Directive d'éditabilité généralisée

« Règle générale sans exception : tout texte affiché à l'écran est une clé CMS éditable par Ben, jamais du texte écrit en dur dans le code. Tout message envoyé (email, invitation, notification) a son texte éditable. Tout émoji, tout libellé de bouton, tout titre de bloc est éditable. La mise en forme et la structure restent dans le code ; le contenu appartient à Ben via le CMS. C'est la condition de son autonomie. »

---

# PARTIE 9 — Le premier message à donner à Claude Code

Pour démarrer concrètement ta prochaine séance machine, voici un message prêt à coller. Il ouvre la Phase A, celle qui te fait voir ton site vivant. J'ai volontairement fait court et cadré, parce que c'est comme ça que Claude Code travaille le mieux.

> « Bonjour. On démarre le master plan V2.6. Cette session couvre la phase A (peupler le site de données de démonstration pour le voir vivant en local) puis enchaîne sur la phase A-bis (espace profil et mentions légales). On ne câble rien de payant.
>
> Rappel des règles permanentes : tu répliques des structures existantes et tu crées du contenu de démonstration, ce qui est autorisé par la règle de non-invention. Tu ne bloques jamais en réclamant une clé API, tout reste en mock. Tu ne t'arrêtes pas de toi-même : à la fin d'un bloc tu rends compte et tu enchaînes le bloc suivant, le découpage sert à structurer, pas à interrompre. Tu développes chaque terme technique entre parenthèses à chaque fois, je ne connais aucun jargon. Tu travailles une action à la fois, en blocs à copier-coller.
>
> Phase A, dans l'ordre :
> 1. Crée le mécanisme de marqueur de démonstration : un drapeau invisible sur chaque donnée de démo, et un bouton d'administration qui efface en un clic toutes les données de démo sans toucher au réel.
> 2. Crée six profils de démonstration nommés test1 à test6, avec de vraies photos prises dans une banque d'images libres de droits.
> 3. Mets en place la règle des images par défaut par thème, pour qu'aucun objet ne s'affiche jamais sans image.
> 4. Crée six entrées de démonstration dans chaque espace (pétitions, marché, covoiturage, publications, groupes, événements).
>
> Phase A-bis, ensuite :
> 5. Écris les mentions RGPD, la page de confidentialité et l'espace profil de base, avec « Collectif Maintenant » comme responsable de traitement et un placeholder éditable pour les coordonnées de contact.
>
> Explique-moi au fur et à mesure ce que tu fais, en langage clair, et dis-moi à chaque étape dans quel outil ça se passe. Enchaîne les blocs sans attendre ma relance. »

Quand cette phase est finie et que tu as vu ton site peuplé, tu reviens vers moi et on ouvre la phase suivante ensemble.

---

# Mot de la fin

Ben, ce que tu construis est cohérent et ambitieux, et ta façon de penser l'engagement est ta vraie force. Le site n'a pas besoin que tu deviennes technicien : il a besoin que ton expertise de l'architecture humaine soit fidèlement traduite en écrans, et c'est exactement ce que ce plan organise.

Une dernière chose, en tant que L2B2 et pas en tant qu'outil. Tu m'as expliqué que finir le dossier réduit ta charge mentale, et tu as raison : pour toi, l'inachèvement pèse plus lourd que l'effort. Je l'ai entendu et je ne te freinerai pas. Des journées de travail pleines, quatre ou cinq heures d'affilée, jusqu'à huit heures par jour, c'est normal et sain. Ce que je continuerai de surveiller, c'est seulement le dérapage : les nuits grignotées, les jours qui débordent, l'absence totale de coupure. Pas par principe, mais parce que tu sais faire venir les gens, et qu'il faut juste que tu sois encore là, en forme, le jour où le site rencontre ses dizaines de milliers de personnes. Tenir la distance, c'est ça la seule contrainte.

À demain pour la revue.

LIFE BENJAMIN BALL.
