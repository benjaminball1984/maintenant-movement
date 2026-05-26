# Schéma de données — Spécifications V2

> **Fichier** : schema-donnees-V2.md
> **Version** : 1.0 (inventaire bouclé : 10 décisions D1-D10)
> **Dernière mise à jour** : 2026-05-26 (soir)
> **Session** : 2026-05-26 (soir)
> Document de synthèse transversal. Modèle CONCEPTUEL (entités + relations), pas du SQL définitif. Claude Code en tire les tables Supabase.
> À lire après principes-transversaux-V2.md. Signature : LIFE BENJAMIN BALL.

---

## But de ce document

Expliciter les entités du site et leurs relations, pour que Claude Code ne les invente pas différemment à chaque session. Niveau : entité / champ / relation. Pas de SQL figé ici (Claude Code traduira en tables Supabase, RLS comprise).

Méthode : une décision à la fois, dérivée des fiches déjà validées (principes + sous-espaces) et complétée par arbitrage.

---

## Inventaire des familles d'entités (carte de travail)

> Liste de travail, affinée au fil des décisions. Une coche = entité traitée et arrêtée.

**Personnes**
- [x] Profil — l'unité humaine (M+7)
- [x] Compte — l'authentification (rattaché à un profil)

**Espaces**
- [x] Espace — agrégateur universel (commune, campagne, fédération, confédération, GT, groupe d'entraide…)
- [x] Rattachement — graphe many-to-many à double consentement
- [x] Organisation — profil d'organisation (ORM+5)

**Objets agrégés**
- [x] Pétition
- [x] Mobilisation
- [x] Campagne
- [x] Cagnotte
- [x] Article (mini-blog)
- [x] Sondage
- [x] Offre (hébergement / transport / prêt / SEL / marché / fruits…)
- [x] Événement (dont moment solidaire)
- [x] Adhésion

**Interactions**
- [x] Signature
- [x] Réservation
- [x] Transaction / Paiement
- [x] Caisse (réceptacle de collecte, régime B)
- [x] Message (DM) + Fil de groupe
- [x] Consentement (cases RGPD granulaires)

**Pouvoir & traçabilité**
- [x] Droit / Délégation (forme tranchée ; contenu → doc Matrice de droits)
- [x] JournalAdmin (`journal_admin`)

---

## Décisions arrêtées

### D1 — Profil et Compte : DEUX entités séparées ✅

**Décision** : deux entités distinctes.

- **`Profil`** = l'identité humaine dans le mouvement. Existe TOUJOURS, y compris pour un signataire silencieux sans compte.
- **`Compte`** = l'authentification seule. N'existe QUE lorsque la personne s'inscrit. Pointe vers un profil (relation 1–1).

**Justifications**
1. La spec pétitions impose un « profil unifié » créé silencieusement à la signature, AVANT tout compte → des milliers de profils existent sans authentification (≈ 15 737 profils unifiés en base existante, issus surtout de signatures).
2. Deux natures de données différentes : *qui est la personne* (nom, email, téléphone, M+7, statut, booléen « email confirmé au moins une fois ») vs *comment elle se connecte* (mot de passe, 2FA, sessions, dernière connexion).
3. Épouse l'architecture native de Supabase : `auth.users` (compte/connexion) déjà séparé de la table métier `profiles`. Aller contre serait ramer à contre-courant de l'outil.

**Champs pressentis (à affiner)**
- `Profil` : id (M+7), nom/prénom ou pseudo, email, téléphone (optionnel), statut (silencieux / membre non actif / membre actif), email_confirmé_au_moins_une_fois (booléen durable), date de création, rattachement éventuel à un Compte.
- `Compte` : id, profil_id (FK, 1–1), identifiants d'auth (gérés par Supabase `auth.users`), 2FA, sessions, dernière connexion.

**Note technique** : en pratique Supabase = `auth.users` (le Compte) + `profiles` (le Profil) reliés par l'`id` Supabase. Un Profil sans Compte = ligne dans `profiles` sans `auth.users` correspondant (champ de liaison nul).

### D2 — Espace agrégateur : hybride `type` + `config` JSON + table `OutilActivé` ✅

**Décision** : option 5 (hybride 3+4). Une seule entité `Espace` générique, jamais une table par type.

- **`Espace`** = coquille neutre commune à TOUS les espaces (commune, campagne, fédération, confédération, GT, groupe d'entraide, organisation…).
  - Colonne `type` : nature de l'espace (commune / campagne / federation / confederation / gt / groupe_entraide / …). Sert à l'affichage et aux règles par défaut, JAMAIS à créer du code spécifique en dur.
  - Colonne `config` (JSON) : réglages globaux propres à l'espace (préférences, règles internes décidées par l'équipe, métadonnées libres). Absorbe les cas particuliers sans nouvelle colonne ni migration.
- **`OutilActivé`** = table séparée. Un espace a N outils activés ; chaque ligne porte l'outil (pétitions / cagnottes / mini-blog / réservation / SEL / …), son état (activé/désactivé), et sa propre `config` (JSON) outil par outil.
  - Activer un outil = insérer/mettre à jour une ligne. JAMAIS une migration de schéma.

**Justifications**
1. Traduit littéralement le principe « familles d'outils activables » (§3) et le corollaire « le code offre la capacité, l'équipe choisit l'usage ».
2. Extensibilité native exigée par Lilou : créer un nouveau type d'espace OU un nouvel outil ne touche pas le schéma. Aucun refactoring.
3. `config` global (sur `Espace`) pour le grain espace ; `config` fin (sur `OutilActivé`) pour le grain outil → on règle au bon niveau sans tout mélanger.
4. DRY : un seul composant agrégateur réutilisé partout (cf. composants réutilisables 1 et 14).

**Champs pressentis (à affiner)**
- `Espace` : id, type, nom, description, image (défaut + perso, cf. §11), créateur (Profil), `config` (JSON), dates, identifiant éventuel (à arbitrer : les espaces ont-ils un identifiant public type M+7/ORM+5 ? — à traiter).
- `OutilActivé` : id, espace_id (FK), outil (clé : petitions, cagnottes, mini_blog, reservation, sel, transport, hebergement, sondage, decider…), actif (booléen), `config` (JSON), date d'activation.

**Points laissés ouverts (à reprendre)**
- Identifiant public des espaces : ont-ils un identifiant lisible (comme M+7 pour les profils) ? À arbitrer.
- Les outils activables forment-ils une liste fermée (énumération maintenue par l'équipe) ou totalement libre ? Pressenti : liste de référence extensible, pas libre, pour éviter le chaos. À confirmer.
- Relation Espace ↔ Organisation : un profil d'organisation est-il un Espace, ou une entité à part qui POSSÈDE un espace ? (Traité dans la décision Organisation.)

### D3 — Rattachement : graphe pur, lien orienté + typé + `config` JSON ✅

**Décision** : graphe pur (rattachements multiples simultanés, toutes natures) ; chaque lien est orienté, typé, et porte une `config` JSON (structure cohérente avec D2).

**Cardinalité** : un espace (commune ou autre) peut tisser AUTANT de rattachements qu'il veut, de natures variées, en parallèle. Pas de parent unique imposé par le code. C'est l'usage et le politique qui dessinent les appartenances, pas une contrainte de schéma. Fidèle au §4 (« graphe, pas arbre »).

**Structure du lien `Rattachement`**
- `source_espace_id` (FK Espace) — l'espace qui demande/initie.
- `cible_espace_id` (FK Espace) — l'espace visé.
- `type_lien` : nature du rattachement (fédère / relaie / soutient / héberge / …). Liste de référence extensible (pas libre, pour éviter le chaos — à confirmer).
- `statut` : demandé / accepté / refusé / retiré (machine à états du lien, cf. §4).
- `config` (JSON) : attributs souples propres au lien.
- temporalité : date de demande, date d'acceptation/refus, date de retrait.

**Double consentement & fork**
- Création d'un lien = demande (source) + acceptation (cible). Empêche le squat d'identité (§4).
- **Départ libre (fork)** : retirer un lien ne demande PAS l'accord de l'autre partie et ne détruit rien (ni membres, ni objets de l'espace). « Couper un lien sans rien détruire » (§4). → statut passe à `retiré`, l'historique est conservé.
- **« Changer de parent »** = retirer un lien de type `fédère` + créer un nouveau lien `fédère` vers une autre cible. La commune garde toute son autonomie pendant l'opération.

**Conséquence de modélisation** : le graphe pur IMPOSE le typage des liens. Sans `type_lien`, on ne distingue plus « fédérée à » de « relaie » ou « soutient ». C'est pourquoi l'option non typée (parent→enfant simple) est écartée.

**Point laissé ouvert**
- Liste de référence des `type_lien` : à arrêter (fédère, relaie, soutient, héberge… + autres ?). À reprendre quand on traitera les espaces fédération/confédération en détail.
- Règles éventuelles par nature (ex. un lien `fédère` doit-il être réciproquement exclusif d'un autre ?) : pour l'instant AUCUNE règle de cardinalité en dur (graphe pur). Si un besoin apparaît, il sera porté par la pratique, pas par le schéma.

### D4 — Organisation : Profil-organisation (ORM+5) qui PEUT posséder un Espace ✅

**Décision** : option 5 (hybride). On distingue clairement *agir* (acteur) de *contenir* (espace).

- **`Profil` de type organisation** = un acteur, au même titre qu'un profil individuel, mais avec `type = organisation` et identifiant **ORM+5** (au lieu de M+7 pour les individus). C'est lui qui « agit » : crée une pétition en son nom, signe, est mandaté, etc. On ne se connecte JAMAIS en tant qu'organisation : une personne physique identifiée agit en son nom via la liste de mandataires.
- **`Espace` possédé** : si l'organisation veut un lieu agrégateur (page publique, outils activables, membres, mini-blog…), elle « ouvre » un Espace rattaché à son profil-organisation. L'Espace est optionnel : une orga peut exister comme simple acteur sans page.
- **Cas COMMUNE (miroir)** : la commune est d'abord un **Espace** (D2, `type = commune`). Quand elle doit *agir comme une organisation* (créer/signer au nom de la commune), elle le fait via un profil-organisation façade rattaché. Les deux phrases de la fiche tiennent : « organisation = acteur qui crée » ET « commune = espace traité comme une organisation ».

**Ce qui découle de la fiche organisations-V2.md (déjà figé, repris ici)**
- **Identifiants** : individu = M+7 (26⁷ ≈ 8 Md) ; organisation = ORM+5 (26⁵ ≈ 11,9 M). Adapter la génération existante du `M+7` du `profil_unifie` pour accueillir `ORM+5` sans casser l'existant.
- **Mandat** : table/relation `Mandataire` reliant une entité (orga/commune) à N individus (profils M+7). Le créateur est premier mandataire/admin ; il ajoute/retire les autres (par M+7 ou email). Case « je suis mandaté·e par [X] » obligatoire à la création + déclaration tracée.
- **Traçabilité** : tout contenu « au nom de X » garde en interne le profil individuel réel qui l'a créé.
- **Email partagé** : un même email peut être lié à un profil individuel ET à un profil-organisation. Pas d'alerte doublon. À la connexion, si l'email pointe vers plusieurs profils, demander explicitement lequel. La distinction se fait par l'identifiant (M… / ORM…), jamais par l'email.
- **Droit de vote** : par défaut dans les assemblées du mouvement, les organisations NE votent PAS (une personne = une voix). Dans un espace dédié inter-organisations, elles peuvent voter (token distribué par décision humaine), cumul individu+orga assumé. Cf. decider-V2.md M4.

**Champs pressentis (à affiner)**
- `Profil` (rappel D1) gagne un champ `type` : individu / organisation. Si organisation → identifiant ORM+5, sinon M+7.
- `Mandataire` : id, entite_profil_id (FK Profil-orga ou commune), individu_profil_id (FK Profil M+7), role (admin / mandataire), date d'ajout, ajouté_par.

**Points laissés ouverts**
- Vérifier le lien avec `organisation_partenaire` existant : même notion ou à distinguer ? (déjà signalé dans la fiche).
- Une commune qui agit « comme une orga » : profil-organisation façade créé automatiquement, ou entité de mandat directement portée par l'Espace commune ? À préciser à l'implémentation (n'change pas la décision conceptuelle).

### D5 — Relation objet ↔ espaces : créateur direct + liaison many-to-many à rôle ✅

**Décision** : option 5 (hybride). Patron transversal valable pour TOUS les objets agrégés (pétition, mobilisation, campagne, cagnotte, article, sondage, offre, événement…). Même logique de graphe à rôle que D3 (rattachement entre espaces) → un seul patron mental pour Claude Code.

**Structure commune à tout objet agrégé**
- Sur l'objet lui-même (champs directs, lecture simple, jamais une requête) :
  - `createur_profil_id` (FK Profil) — qui a créé (individu OU profil-organisation, cf. D5). Toujours un profil individuel réel tracé en interne même si « au nom de X ».
  - `espace_origine_id` (FK Espace, **nullable**) — l'espace depuis lequel l'objet a été créé, s'il y en a un. Nullable car un objet peut naître hors de tout espace (création directe par un profil).
- Table de liaison `ObjetEspace` (many-to-many, diffusion souple) :
  - `objet_id` (+ `objet_type` : petition / cagnotte / article / … — voir point ouvert ci-dessous), `espace_id` (FK Espace), `role` (origine / relai / héberge / …), `statut` (proposé / accepté / retiré — double consentement si besoin, cf. §4), dates.

**Justifications**
1. Respecte le §3 : « un espace référence des objets autonomes, pas de possession exclusive ». Un objet circule entre espaces sans appartenir à aucun.
2. Garde la trace simple de « qui/quel espace a créé » (champ direct) → pas de requête pour une info aussi fréquente.
3. Permet l'« intégration ascendante » du §9 (bouton « intégrer dans une campagne ») : c'est simplement l'ajout d'une ligne `ObjetEspace` avec `role = relai`.
4. Cohérent avec D3 (graphe à rôle), donc Claude Code réutilise le même schéma mental.

**Point laissé ouvert — IMPORTANT (à arbitrer ensuite)**
- Comment la table de liaison référence-t-elle des objets de types différents (pétition, cagnotte, article…) ? Deux familles de solutions :
  - (a) **Liaison polymorphe** : une seule table `ObjetEspace` avec `objet_type` + `objet_id`. Souple, peu de tables, mais pas de contrainte de clé étrangère stricte côté base.
  - (b) **Table de liaison par type** : `PetitionEspace`, `CagnotteEspace`… Intégrité référentielle stricte, mais multiplie les tables.
  - Ce choix dépend de la décision suivante : **« comment représente-t-on la famille des objets agrégés ? »** (table unique `Objet` + type, vs une table par objet, vs héritage). → C'EST LA PROCHAINE DÉCISION (D6).

**Conséquence** : D6 fixe la *logique de liaison*. La *forme physique* de la liaison sera tranchée par D7 (modèle des objets eux-mêmes).

### D6 — Famille des objets agrégés : tronc commun `Objet` + `config` JSON + tables filles métier ✅

**Décision** : option 5 (hybride). Même geste architectural que D2 (Espace). Un dev retrouve partout le même patron : tronc + config souple + extension typée.

**Tronc commun `Objet`** (mutualisé une seule fois, DRY) :
- `id`, `objet_type` (petition / mobilisation / campagne / cagnotte / article / sondage / offre / evenement / adhesion / …)
- `createur_profil_id` (FK Profil — cf. D6)
- `espace_origine_id` (FK Espace, nullable — cf. D6)
- `titre`, `description`
- `image` (défaut par type + perso, cf. §11)
- `statut` (machine à états — sera détaillée dans le doc « machines à états »)
- `config` (JSON) : métadonnées souples, réglages légers, attributs non porteurs de logique métier critique
- dates (création, modification), partage OG (cf. §10), mini-blog activable (cf. §7)

**Tables filles métier** (UNIQUEMENT là où il y a de vrais champs porteurs de logique) :
- `PetitionDetail` : objectif courant, moteur de paliers (suite 1-2-5, bascule 90 %), compteur de signatures, champ téléphone activé, cases RGPD… (cf. petitions-V2.md)
- `CagnotteDetail` : montant cible, canal (euros/99-coin), bénéficiaire…
- `EvenementDetail` : date(s), lieu, capacité, spécialisation « moment solidaire »…
- `OffreDetail` : type d'offre (hébergement/transport/prêt/SEL/marché/fruits), prix, canal de paiement, disponibilités (lien Réservation)…
- `SondageDetail`, etc. — créées au besoin, pas avant.
- Les objets « légers » sans logique propre peuvent se contenter du tronc + `config` (pas de table fille forcée).

**Justifications**
1. Le tronc commun mutualise (DRY) tout ce que §7, §10, §11, D6 imposent à tous les objets : créateur, image, partage, mini-blog, liaison aux espaces.
2. Les champs porteurs de logique métier sensible (montant d'une cagnotte, compteur/paliers d'une pétition) vivent dans de **vraies colonnes typées et contraintes**, pas dans un JSON non protégé. Évite la classe de bugs « valeur métier cachée dans un blob ».
3. `config` JSON sur le tronc absorbe les métadonnées souples sans migration.
4. Extensibilité : un nouveau type d'objet léger = juste une valeur de `objet_type` ; un nouveau type lourd = une table fille. Pas de refonte.

**Résolution du point ouvert de D5 (forme de la liaison ObjetEspace)**
- Le tronc `Objet` ayant un `id` unique commun à tous les types, la table de liaison `ObjetEspace` peut référencer `objet_id` vers ce tronc unique : **liaison non polymorphe, clé étrangère stricte vers `Objet`**. On garde l'intégrité référentielle ET la simplicité (une seule table de liaison). Le point ouvert de D5 est donc tranché : liaison via le tronc commun.

**Cohérence d'ensemble (à noter pour la passe finale)**
- Espace = tronc + `config` + table fille `OutilActivé` (D2)
- Objet = tronc + `config` + tables filles métier (D7)
- Rattachement (espace↔espace, D3) et ObjetEspace (objet↔espace, D6) = même logique de graphe à rôle/statut.
- Trois patrons, recombinés partout. Économie de concepts maximale.

### D7 — Transaction / Paiement : DEUX régimes + tronc + tables filles par canal ✅

> ⚠️ **CORRECTION d'un principe mal énoncé.** Le §2 disait « Maintenant! ne touche JAMAIS l'argent ». C'est VRAI pour les échanges entre personnes, FAUX pour les contributions au mouvement. Il y a deux régimes distincts. À répercuter dans principes-transversaux (§2 à amender).

**Deux régimes de paiement**

- **Régime A — direct, de personne à personne.** Covoiturage, hébergement, SEL, prêt, marché solidaire… L'argent va du payeur au bénéficiaire. Maintenant! ne transite rien. (C'est le cas que décrivait le §2.) Canaux : euros (Stripe paiement direct) OU 99-coin (redirection wallet du bénéficiaire). Exception location mutualisée : euros exclusivement, l'organisateur fait tampon (§12).
- **Régime B — collecte vers le mouvement.** Adhésions, cotisations, dons, appels à contribution poussés sur le réseau social, cagnottes solidaires. **L'argent arrive bien à Maintenant!**, dans une **Caisse** dédiée. Aujourd'hui : compte Stripe existant (accès déjà en place), à reverser au bon endroit. Demain : réceptacle officiel de l'association une fois créée. Côté 99-coin : wallet de réception dédié par caisse.

**Modélisation**

Tronc `Transaction` (patron D6) + tables filles par canal :
- **Tronc `Transaction`** : id, `regime` (A direct / B collecte), `canal` (euro / 99-coin), `montant`, `devise_ou_unite`, `payeur_profil_id` (FK Profil, nullable si don anonyme à arbitrer), `objet_id` (FK Objet concerné : la cagnotte, l'adhésion, l'offre…), `caisse_id` (FK Caisse, nullable — rempli SEULEMENT en régime B), `beneficiaire_profil_id` (nullable — rempli en régime A), `statut` (machine à états : initiée / en attente / confirmée / échouée / annulée / litige), `config` (JSON léger), dates.
- **Table fille `DetailStripe`** : PaymentIntent id, statut Stripe, métadonnées Stripe… (colonnes typées, jamais dans un JSON).
- **Table fille `DetailPolygon`** : hash de transaction (UNIQUE — refuser un hash déjà consommé, §19), adresse de réception, montant on-chain vérifié, bloc… Vérification en LECTURE sur Polygon (la plateforme ne signe rien, AUCUN wallet intégré, §19).

**Entité `Caisse`** (régime B uniquement)
- Une **Caisse par TYPE de contribution** (adhésion, cotisation X, cotisation Y, dons généraux…) **+ une Caisse par cagnotte solidaire** (chaque cagnotte ouvre sa caisse). Décision granularité = option 1.
- Champs : id, `libelle`, `type_caisse` (adhesion / cotisation / don_general / cagnotte / …), `objet_id` (FK, si la caisse est liée à un objet précis comme une cagnotte), dates.
- **Réceptacles AVEC HISTORIQUE DATÉ** (option la plus prudente, retenue) : table fille `ReceptacleCaisse` = (caisse_id, canal euro/99-coin, identifiant du réceptacle [compte Stripe ou adresse wallet], `valide_du`, `valide_au` nullable). Permet de dire avec certitude vers quel compte/wallet est parti chaque versement à chaque période. Indispensable pour la bascule « Stripe général → Stripe association » et pour un contrôle/bilan.
  - Chaque `Transaction` de régime B référence donc une caisse ET, via la date, le réceptacle actif à ce moment.

**Justifications**
1. Corrige une erreur de doctrine : le régime B (adhésion/dons/cagnottes) fait bien arriver l'argent au mouvement.
2. Vue unifiée préservée (un seul tronc `Transaction`, tous régimes/canaux) — fidèle à l'esprit « paiement unifié » du §2.
3. Identifiants techniques sensibles (PaymentIntent Stripe, hash Polygon) dans de vraies colonnes typées et contraintes (hash UNIQUE), pas dans un JSON.
4. Caisses par type + par cagnotte = fléchage comptable propre pour reverser au bon endroit.
5. Historique daté des réceptacles = traçabilité juridique (Légicoop) et sérénité lors de la bascule vers l'association.

**Points laissés ouverts**
- **Wallet physique distinct par caisse VS caisse logique** : « un wallet par caisse » est propre comptablement mais coûteux à opérer/sécuriser (chaque adresse = clés à garder, cf. logique Smaug). Alternative : un wallet de réception unique + fléchage par identifiant de versement en base. Le modèle conceptuel (Caisse + Réceptacle daté) ne préjuge PAS de ce choix d'implémentation. À trancher au moment du dev, avec le souci de la garde de clés.
- Dons anonymes : `payeur_profil_id` nullable ? À confirmer (un don peut-il être fait sans profil ?).
- Reversement (de la Caisse vers le bénéficiaire final réel d'une cagnotte solidaire) : faut-il modéliser une seconde transaction « sortante » Caisse → bénéficiaire ? Probablement oui pour la traçabilité. À traiter quand on détaillera les cagnottes solidaires.
- §2 des principes transversaux à AMENDER (ne plus dire « jamais l'argent » sans distinguer A/B).

### D8 — Réservation, Messagerie, Consentement (interactions directes, peu d'arbitrage) ✅

Ces trois entités découlent directement des fiches déjà validées. Enregistrées sans nouvel arbitrage lourd.

**`Réservation`** (composant réutilisable, façon Airbnb/BlaBlaCar — cf. transport, hébergement, prêt)
- Champs : id, `offre_id` (FK Objet de type offre), `demandeur_profil_id` (FK Profil), `creneau` (date(s)/période), `nb_personnes` ou quantité, `statut` (machine à états : proposée / acceptée / refusée / réalisée / confirmée / annulée / litige — à détailler dans le doc machines à états), lien vers la `Transaction` éventuelle, dates.
- Amorcée par un **message d'amorce** pré-rempli (§14) dans la messagerie interne.
- Réutilisée par transport (covoiturage), hébergement, prêt, location mutualisée.

**`Message` + `FilDeGroupe`** (deux modes — cf. §18 et réseau social)
- **`Message`** (DM individuel) : id, `expediteur_profil_id`, `destinataire_profil_id`, `contenu`, `lu`, dates. Asynchrone + instantané (type Messenger).
- **`FilDeGroupe`** : id, `espace_id` ou `groupe_id` (FK — tout groupe/espace : commune, campagne, GT, groupe d'entraide, covoit'groupe…), puis messages rattachés au fil. Conversation collective, partage de liens, coordination.
- Relations sociales (rappel réseau social, déjà acté) : ami·e (bidirectionnel, demande+acceptation), follower (unidirectionnel). Entité `Relation` : id, `profil_a`, `profil_b`, `type` (ami / follow), `statut` (demandé/accepté pour ami), dates.

**`Consentement`** (cases RGPD granulaires — cf. pétitions P3, P6)
- Le consentement est **granulaire et indépendant** : chaque case = un consentement distinct, traçable et révocable.
- Champs : id, `profil_id` (FK Profil), `type_consentement` (contact_createur / newsletter_plateforme / …), `objet_id` (FK Objet concerné, ex. la pétition signée — nullable pour un consentement global), `valeur` (booléen), `date`, `source` (où/comment recueilli).
- Sert l'export CSV « case 1 » (P6a) : on sélectionne les profils ayant `type=contact_createur` + `valeur=true` pour une pétition donnée.
- Rappel : le booléen durable « email confirmé au moins une fois » est un attribut du **Profil** (D1), PAS un consentement (distinction P4).

### D9 — Signature : lien vers profil + snapshot complet JSON des champs saisis ✅

**Décision** : option 4. La signature lie un profil à une pétition ET fige une capture complète de ce qui a été saisi au moment T (valeur probante).

**Champs `Signature`**
- id, `petition_id` (FK Objet de type pétition), `profil_id` (FK Profil — créé silencieusement à la signature, cf. D1 et pétitions P3), `horodatage`.
- `snapshot` (JSON) : capture complète des champs saisis au moment de signer (nom/prénom, email, téléphone si fourni, code postal si demandé, cases RGPD cochées…). Preuve « notariale » de l'état exact de la signature, indépendante des évolutions ultérieures du profil.
- `compte_immediatement` : la signature compte dans le total dès la saisie, AVANT confirmation email (P4).

**Rappels de doctrine (pétitions, déjà actés)**
- La confirmation d'email est un attribut **durable du Profil** (« confirmé au moins une fois »), PAS de chaque signature (P4). Une personne qui signe N pétitions ne gère pas N confirmations.
- « Afficher large, envoyer fiable » : total public généreux (toute signature compte), communication ciblée en priorité sur les profils confirmés.
- Consentements (cases RGPD) : tracés aussi comme entité `Consentement` (D9) pour la révocabilité et l'export CSV. Le `snapshot` de la signature en garde une photo à l'instant T ; l'entité `Consentement` en gère l'état vivant et révocable. Les deux coexistent (photo figée vs état courant).
- Turnstile obligatoire sur la signature (anti-bot, P4) — contrôle applicatif, pas un champ du modèle.

**Justification**
- Une signature de pétition a une portée quasi juridique (qui, quand, quel email, quel consentement). Le snapshot fige cette vérité historique même si le profil change ensuite. Le JSON garde de la souplesse (champs variables selon les pétitions : code postal demandé ou non, etc.) sans multiplier les colonnes.

### D10 — Droits / Délégation + JournalAdmin ✅

**Droits — table générique à cases à cocher (option 1)**

Décision : table `Droit` entièrement configurable. Fidèle au §9 (« délégation granulaire par cases à cocher ») et au corollaire « le code offre la capacité, l'équipe choisit l'usage ».

- **`Droit`** : id, `profil_id` (FK Profil — à qui), `cible_type` (espace / objet), `cible_id` (FK polymorphe ou via le tronc Objet/Espace), `type_droit` (écrire_articles / modifier_objet / télécharger_fichier / modérer / publier_média / gérer_membres / …), `accordé_par` (FK Profil), date.
- Chaque droit est **indépendant et atomique** (une ligne = une capacité précise sur une cible précise). Pas de paquet figé : on coche ce qu'on veut.
- Couvre : rédacteur·ice = un droit, modérateur·ice = un droit, méga-édito = droit ouvert mais exercé collectivement, etc.

> ⚠️ **La FORME est tranchée ce soir (table générique). Le CONTENU EXHAUSTIF reste à dresser** : liste complète des `type_droit`, et matrice « qui peut quoi, dans quel espace ». → C'est l'objet du **document 2 : Matrice de droits**, à traiter en passe dédiée (sujet sensible : les permissions mal cadrées = failles de sécurité). Ne PAS improviser la liste ici.

**Rappel d'architecture (principes §1)** : le pouvoir de plateforme (technique/modération/admin/rédaction) relève de la **cooptation** et n'ouvre AUCUN droit politique (pas de vote en assemblée, pas de droit dans Décider). Les droits de cette table `Droit` sont des droits **techniques/éditoriaux**, à ne jamais confondre avec les droits politiques (mandat, vote) gérés côté Décider.

**`JournalAdmin`** (`journal_admin` — traçabilité RGPD, déjà nommé en pétitions P6a)
- id, `acteur_profil_id` (qui a agi), `action` (export_csv / valider_pétition / refuser / modérer / modifier_droit / …), `cible_type` + `cible_id`, `horodatage`, `détails` (JSON : contexte, ex. quelle pétition exportée).
- Journalise notamment : chaque export CSV (qui, quand, quelle pétition — P6a), les actes de modération, les changements de droits, les opérations sensibles.
- Append-only (on n'efface pas le journal) — registre de preuve.

### D11 — Dons : jamais d'anonymat total, profil toujours présent (nom masquable à l'affichage) ✅

**Décision** : un don au mouvement (régime B) crée ou rattache TOUJOURS un profil. Pas d'anonymat administratif. Le donateur peut seulement **masquer son nom à l'affichage**.

**Conséquences sur le modèle**
- `Transaction.payeur_profil_id` (régime B) = **NON nullable**. Le point ouvert de D7 (« dons anonymes : payeur nullable ? ») est tranché : non. Un don est toujours rattaché à un profil identifié côté plateforme.
- Champ d'affichage : `afficher_nom` (booléen) sur le don/la transaction (ou sur le lien donateur↔cagnotte). Si faux, le nom n'apparaît PAS sur la cagnotte publique ni pour le bénéficiaire. C'est un anonymat **social**, pas administratif.
- En euros (Stripe) comme en 99-coin (Polygon), l'identité reste connue de la plateforme. Pas de canal d'argent non identifié vers la structure.

**Justifications**
1. Conformité : un don ouvrant droit à reçu fiscal exige l'identité du donateur. Garder le profil rend les reçus possibles.
2. Anti-blanchiment / traçabilité : refuser tout flux anonyme vers la future association = sérénité en cas de contrôle. Évite le « cadeau empoisonné » d'un canal crypto non identifié.
3. Le besoin réel des donateurs (« que ça ne se voie pas ») est couvert par le masquage d'affichage, sans sacrifier la traçabilité.

**À confirmer avec Légicoop (ajouté à la liste juridique)**
- Conditions exactes des reçus fiscaux (l'association doit être créée et éligible).
- Seuils éventuels de déclaration des dons.
- Cas du don en 99-coin : régime fiscal d'un don en cryptomonnaie/monnaie complémentaire à une structure.

### D12 — Reversement des cagnottes : transactions sortantes multiples + justificatif ✅

**Décision** : option 4 (plusieurs transactions sortantes possibles), enrichie du justificatif de l'option 3.

**Modélisation**
- Le reversement d'une Caisse de cagnotte vers le(s) bénéficiaire(s) final(aux) = une ou **plusieurs** `Transaction` **sortantes**, symétriques des entrantes (même tronc D7).
  - `sens` (entrante / sortante) sur le tronc `Transaction`, OU `regime` enrichi. Une sortante : `caisse_id` (source), `beneficiaire_profil_id` (destinataire réel), `montant`, `canal`, `statut`, dates.
- **Sorties multiples assumées** : une caisse peut se vider en plusieurs fois (reversement échelonné) ET vers plusieurs bénéficiaires (ex. « on répartit entre les 3 familles »). La somme des sortantes peut être suivie vs total collecté → solde de caisse lisible à tout moment.
- **Pièce justificative** par sortie : champ `justificatif` (fichier attaché : preuve de virement, reçu…). Recommandé pour la transparence militante.
  - ✅ TRANCHÉ (D12bis) : justificatif **OBLIGATOIRE** pour toute sortie. Aucune transaction sortante n'est validée sans pièce justificative attachée. Rigueur maximale assumée sur l'argent solidaire — un garde-fou en dur justifié ici, par exception à la doctrine « le code offre la capacité ».

**Justifications**
1. La transparence sur la SORTIE de l'argent est aussi cruciale que sur l'entrée — c'est là que naissent les soupçons de détournement (même injustes). Tracer protège l'organisateur et la confiance des donateurs.
2. Le solidaire implique souvent des reversements partiels/répartis → les sorties multiples sont la norme, pas l'exception.
3. Cohérent avec D7 : la sortante réutilise le même tronc `Transaction`, pas de nouvelle mécanique.

**Lien avec D11** : les donateurs sont identifiés (profil), les bénéficiaires aussi (profil destinataire des sortantes) → chaîne traçable de bout en bout : donateur → caisse → bénéficiaire. Sérénité juridique.

**Point laissé ouvert**
- Qui déclenche/valide une sortante (l'organisateur de la cagnotte ? un admin ? double validation ?) → touche à la matrice de droits (doc 2).

### D13 — Points ouverts de D2/D3 refermés (liens, identifiant espaces, outils) ✅

Trois points légers tranchés ensemble. Fil rouge : **listes de référence extensibles, jamais du champ libre.**

**(a) Types de liens de rattachement (référence D3)**
- Liste de référence courte et extensible (PAS libre) :
  - `fédère` — lien hiérarchique fort (fédération ↔ commune).
  - `relaie` — diffusion (une campagne relaie une autre).
  - `soutient` — appui sans hiérarchie.
  - `héberge` — un espace en accueille un autre.
- Quatre pour démarrer ; l'équipe en ajoute par configuration si besoin. Garde le typage propre qu'impose le graphe pur (D3).

**(b) Identifiant public des espaces (référence D2)**
- OUI, identifiant public lisible, même famille que les autres : **ESM + 5** (« ESpace Maintenant »), 8 caractères, capacité 26⁵ ≈ 11,9 M.
- Cohérence d'ensemble des identifiants :
  - Individu = **M + 7** (26⁷ ≈ 8 Md)
  - Organisation = **ORM + 5** (26⁵ ≈ 11,9 M)
  - Espace = **ESM + 5** (26⁵ ≈ 11,9 M)
- Avantages : uniformise, facilite les liens courts et les références entre espaces, évite d'exposer des id techniques de base. Préfixe ESM reconnaissable, pas de collision de sens.
- ⚠️ À vérifier au code : générateur d'identifiants commun aux trois familles (M+7 / ORM+5 / ESM+5) sans collision, compatible avec l'existant `profil_unifie`.

**(c) Liste des outils activables (référence D2, `OutilActivé`)**
- Liste de référence **fermée, maintenue par l'équipe** (PAS libre). Énumération de départ :
  `petitions, cagnottes, mini_blog, reservation, sel, transport, hebergement, sondage, decider, marche, fruits, evenements, adherer, commune_libre, moments_solidaires` (+ extensions futures).
- Ajouter un outil = ajouter une valeur de référence, jamais refondre le schéma. Équilibre cohérence / extensibilité (esprit D2/D6).

**Tous les points ouverts de D2 et D3 sont désormais refermés.**
