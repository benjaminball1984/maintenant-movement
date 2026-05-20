# Doctrines transverses — Site Maintenant!

**Source** : sessions 1 à 7 consolidées, doctrines politiques fondatrices du mouvement.
**Usage pour Claude Code** : en cas de doute sur une décision d'UX ou de produit, ces doctrines orientent. Quand deux choix techniques sont équivalents, on prend celui qui sert la doctrine.

---

## 1. Empouvoirement vs Captation de pouvoir

### Sens

- **Captation de pouvoir** : réunir des gens pour donner du poids à notre voix de leader. Ils sont là pour gonfler nos rangs.
- **Empouvoirement** : organiser AVEC les gens, en collégial autogéré, pour qu'ILS s'expriment, créent, proposent.

### Implications produit

- **Pas de leader visible centralisé** dans l'UI. Pas de page « le bureau », « le ou la chef·fe ». Les visages sont ceux des communes locales, des contributeurices.
- Le site **donne des outils**, ne récite pas un programme. L'usage est libre, pas guidé par un tunnel forcé.
- **Décider** (l'espace) est conçu pour permettre aux personnes de décider, pas pour faire valider des décisions déjà prises.
- Les pétitions, articles, mobilisations sont **portés par leurs créateurices** (créateurice = admin du groupe). Maintenant! n'absorbe pas la voix.

---

## 2. Mouvement de service au service de nous-mêmes

### Sens

Maintenant! n'est pas un parti qui veut le pouvoir, ni une asso d'expert·es au service de bénéficiaires. C'est un mouvement où les gens s'organisent eux-mêmes, pour eux-mêmes, avec un outil partagé. On se sert collectivement de l'outil mouvement.

### Implications produit

- **Pas de hiérarchie utilisateurice/bénéficiaire**. Les SEL, l'hébergement solidaire, le marché solidaire fonctionnent entre pair·es.
- **Auto-éducation populaire** : la section « Comprendre » outille les gens à comprendre le mouvement, ses doctrines, sa monnaie, ses pratiques.
- **Auto-solidarité** : les Moments solidaires sont des organisateurices et participant·es co-mêlé·es, pas des « bénévoles » qui aident des « bénéficiaires ».

---

## 3. Ce qui se fait pour les gens sans les gens se fait contre les gens

### Sens

On ne décide pas pour les gens. Toute décision qui les concerne se prend AVEC eux·elles.

### Implications produit

- **Cartographie pré-créée des communes (2100-2300)** comme **seule exception** au principe « pas de coquilles vides ». Et seulement parce que c'est techniquement nécessaire pour amorcer la pompe. Toute commune supplémentaire est créée par les gens du territoire.
- **Pas de templates de pétition pré-remplis** : c'est aux gens de formuler leur cause.
- **Pas de modération IA** : c'est des humain·es qui décident ce qui reste ou pas.
- Les **fédérations et confédérations** se forment ascendantes (les communes décident d'adhérer), pas descendantes (le bureau national les crée).

---

## 4. Chanter aujourd'hui, pas seulement promettre demain

### Sens

Un mouvement politique de gauche traditionnel promet le grand soir. Maintenant! propose de **commencer à vivre le mouvement maintenant**, dans les Moments solidaires, dans le SEL, dans la cartographie de l'entraide. Le futur désirable se préfigure dans le présent.

### Implications produit

- **Donner des choses concrètes à faire dès la première visite** : signer, participer, proposer un service, trouver un Moment solidaire près de chez soi.
- **Pas de tunnel d'engagement** abstrait (« Découvre notre vision en 12 étapes »). Le site doit être actionnable dès la home.
- **Maintenant Radio, Maintenant Médias, journal-affiche** : production culturelle vivante du mouvement, pas que des analyses programmatiques.

---

## 5. Émancipation par accessibilité tactique

### Sens

Le purisme militant excluant (langage parfaitement inclusif, outils 100 % libres, niveau de discours universitaire) **exclut les personnes qu'on veut justement rejoindre**. On accepte temporairement des compromis sur la forme pour atteindre les gens où ils·elles sont.

### Implications produit

- **OAuth GAFAM autorisé** comme porte d'entrée (au même titre que email, magic link, OAuth éthique). On ne filtre pas à l'entrée par l'outil.
- **Flyer porte-à-porte solidaire SANS écriture inclusive** (exception consciente). Décision politique : ne pas rebuter à l'entrée.
- **Cloudflare Pages** (acteur US) assumé. Migration possible plus tard, pas de blocage doctrinal aujourd'hui.
- **Vocabulaire accessible** : pas de jargon académique pédant. Si un terme savant est utile, on l'explique tout de suite entre parenthèses.

---

## 6. Légitimité d'expression par ancrage territorial réel

### Sens

> « Je n'y habite pas, je n'y travaille pas, je ne fais rien dedans, donc je ne vois pas quelle est ma légitimité à m'y exprimer. »

On parle au nom d'un territoire si et seulement si on y est concrètement présent·es. La fédération crée un espace commun supplémentaire, jamais un passe-droit pour parler dans une commune où on n'est pas.

### Implications produit

- **Une commune fédérée parle dans la sienne + dans la fédération**, pas dans les autres communes-membres.
- **Permissions de prise de parole par commune** : seul·es les membres d'une commune peuvent y poster un post, organiser un Moment solidaire, proposer un vote.
- **Tagging géographique = département** par défaut, calculé depuis le code postal.
- **Diffusion virale naturelle** vers les départements limitrophes (pas frontière dure).

---

## 7. Distance protectrice

### Sens

Sur certaines pages (notamment « D'autres moyens d'agir »), on relaie sans endosser. **Présomption d'utilité** des organisations listées, **retrait si problématique**. On informe sans absorber.

### Implications produit

- **Page « D'autres moyens d'agir »** : liste de redirections sans éditorial, sans logo collé à la nôtre. Mention claire « cette liste n'engage pas Maintenant! ».
- **Modération a posteriori** sur les contenus créés par les communes : on n'éditorialise pas en amont, on retire si dérapage.
- **Liens externes** ouvrent dans un nouvel onglet, avec `rel="noopener noreferrer"`.

---

## 8. Subsidiarité par accord mutuel

### Sens

Une fédération ou confédération ne prend de décision **qu'avec l'accord des entités concernées**, pas par majorité plaquée. Chaque entité reste souveraine de sa décision.

### Implications produit

- **Les décisions de fédération** dans Décider passent par accord des communes-membres (chaque commune vote, l'accord de toutes est requis pour engager).
- **Pas de centralisation forcée** des annonces : la fédération propose, les communes décident de relayer.
- **Composition de l'Assemblée Confédérale** : binômes tirés au sort par entité, **incompatibilité de cumul** entre niveaux.

---

## 9. Les gens s'engagent pour ce qui leur est proche

### Sens

Règle empirique d'organisation : **la proximité crée l'engagement**. Loin = abstrait. Près = concret. On mobilise mieux pour un Moment solidaire à 500m que pour une grande cause à 5000 km.

### Implications produit

- **Algorithme du réseau social** : soi → ami·es → site → entraide (~5 %). Pas de pondération cachée.
- **Newsletter taggée géo** : par défaut, diffusion au département.
- **Carte unifiée** comme entrée majeure : voir ce qui se passe **près de chez soi**.
- **Mise en avant page d'accueil** : prioriser ce qui est proche, à compétences égales (compteur stretch, urgence, etc.).
- **Causes locales d'abord, activistes ensuite** : asso quartier, projets jeunesse, scouts, classes vertes, hôpital local. Puis squats, anti-expulsion, sans-papiers. **Mix progressif modéré → activiste**.

---

## 10. Le but de la plateforme n'est pas que la plateforme fonctionne

### Sens

La plateforme est **un moyen**, pas une fin. Si elle marche bien mais qu'elle ne crée pas de lien réel, elle a échoué. Si elle est imparfaite mais qu'elle fait advenir des Moments solidaires, des SEL actifs, des assemblées qui décident vraiment, elle réussit.

### Implications produit

- **Pas de captation d'attention par la plateforme**. Pas de gamification (badges, points, streaks). Pas de notifications push agressives.
- **Pas de métriques d'engagement vanity** publiées : on regarde combien de Moments solidaires se sont passés, pas combien de minutes les gens ont passé sur le site.
- **Liens sortants assumés** : si une cause se relaie mieux ailleurs, on relaie.
- **Maintenant Médias imprimable** : on accepte qu'une partie du contenu sorte du site sur papier, pour des gens qui n'y reviendront jamais.

---

## 11. On ne capte pas l'attention, on la respecte

### Sens

Doctrine UX et notifications. On ne cherche pas à maximiser le temps passé, on minimise les sollicitations.

### Implications produit

- **Maximum 2 mails par semaine** (mardi récap + vendredi newsletter).
- **3 jours d'écart minimum** entre les deux mails.
- **Push opt-in** uniquement. Son et vibration au choix de la personne.
- **Pas d'autoplay vidéo**, jamais.
- **Pas de modale popup** intrusive à l'arrivée.
- **Pas de cookie banner** (politique RGPD minimale).
- **Pas de carousel automatique** (rotation forcée).
- **Animations sobres**, respect du `prefers-reduced-motion`.
- **Notifications regroupées** style Facebook dans le mail récap (pas un email par interaction).

---

## 12. Boucle d'engagement par dette légère

### Sens

Mécanique d'implication subtile : créer une **petite dette sociale réciproque** qui ramène la personne dans le mouvement, sans culpabilisation ni captation.

Exemple emblématique : les **Tupperwares à ramener** au prochain repas solidaire après distribution. La personne emporte de la nourriture, doit ramener le contenant. Elle a une raison concrète de revenir.

### Implications produit

- **Mail de relance d'adhésion** à l'échéance d'un an : ton chaleureux, factuel, sans pression.
- **Inscription à un Moment solidaire** = mail de rappel 24h avant, pas plus.
- **Tupperwares tracker** dans l'espace Moments solidaires : qui a emporté quoi, à qui le ramener (optionnel, à la main des communes).

---

## 13. Pression sociale positive pour dignité et fierté

### Sens

Mécanique de mobilisation par l'engagement public. La levée de mains pendant le repas solidaire (« qui veut faire partie de l'équipe la prochaine fois ? ») fonctionne parce qu'elle est **publique, collective, et qu'on s'engage par dignité**, pas par peur ou culpabilité.

### Implications produit

- **Engagement public visible** : afficher (avec consentement) les noms des personnes inscrites à un Moment solidaire.
- **Pas de classement compétitif** (top contributeurices, gamification). C'est de la dignité collective, pas de l'individu performant.
- **Indicateurs publics** (Q14) du mouvement : à concevoir dans cet esprit. Pas « top 10 des plus actifs », mais « 432 personnes ont signé cette semaine », « 12 repas solidaires ce mois-ci dans le 93 ».

---

## 14. Équivalence (pas horizontalité)

### Sens

L'horizontalité parfaite est un mythe géométrique : elle nie les compétences spécifiques, les responsabilités assumées, les énergies inégales. L'**équivalence** reconnaît que les voix se valent dans la délibération, sans nier que certain·es portent plus de responsabilités à certains moments.

### Implications produit

- **Rôles différenciés mais voix égales** dans Décider : un·e modérateurice de séance facilite, ne décide pas.
- **Reconnaissance du travail** dans les statuts (créateurice de pétition, animatrice de commune), mais **pas de privilège de vote**.
- **Tirage au sort** comme mécanisme central pour les délégations (Assemblée Confédérale).

---

## 15. Moindre violence (pas non-violence dogmatique)

### Sens

La non-violence dogmatique nie qu'il y a de la violence partout, y compris dans l'inaction. La **moindre violence** cherche la voie qui réduit la violence sans la nier abstraitement.

### Implications produit

- **Pas de doctrine de la non-violence affichée**.
- **Modération nuancée** : on retire un contenu qui appelle à la violence directe, on ne retire pas un contenu qui décrit la violence systémique.
- **Soutien aux luttes** (caisses de grève, manifestations, soutien à expulsion) sans valorisation esthétique de l'affrontement.

---

## 16. Récapitulatif sous forme de checklist UX

Avant chaque décision d'UI/UX significative, se poser ces questions :

- [ ] Est-ce que ça **donne du pouvoir aux gens**, ou est-ce que ça en capte ?
- [ ] Est-ce que ça **respecte l'attention**, ou est-ce que ça la capte ?
- [ ] Est-ce que ça **passe par les gens**, ou est-ce que ça décide pour eux·elles ?
- [ ] Est-ce que ça **propose du concret actionnable**, ou que de l'abstrait à promesse ?
- [ ] Est-ce que ça **est accessible aux gens visé·es** (langage, outils, prix), ou est-ce purement militant·es initié·es ?
- [ ] Est-ce que ça **respecte l'ancrage territorial réel**, ou est-ce que ça permet de parler depuis nulle part ?
- [ ] Est-ce que ça **relaie sans absorber**, ou est-ce que ça récupère la voix des autres ?
- [ ] Est-ce que ça **respecte la souveraineté de chaque entité**, ou est-ce que ça centralise ?
- [ ] Est-ce que ça **mise sur la proximité**, ou est-ce que ça force des engagements lointains ?
- [ ] Est-ce que ça **sert le mouvement réel**, ou est-ce que ça enferme dans la plateforme ?
- [ ] Est-ce que ça **valorise la dignité collective**, ou est-ce que ça met en compétition les individus ?
