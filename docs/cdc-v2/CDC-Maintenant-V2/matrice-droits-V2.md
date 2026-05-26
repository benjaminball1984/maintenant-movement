# Matrice de droits — Spécifications V2

> **Fichier** : matrice-droits-V2.md
> **Version** : 1.0 (matrice complète : MD0-MD6)
> **Dernière mise à jour** : 2026-05-26 (soir)
> **Session** : 2026-05-26 (soir)
> Document de synthèse transversal (doc 2). Rassemble et ordonne les droits dispersés dans les fiches.
> À lire après principes-transversaux-V2.md et schema-donnees-V2.md. Signature : LIFE BENJAMIN BALL.

---

## But de ce document

Dresser la liste exhaustive des droits **de plateforme** (techniques/éditoriaux) et la matrice « qui peut quoi, dans quel espace ». Sujet sensible : les permissions mal cadrées sont la source classique des failles de sécurité. Ce document alimente la table `Droit` (schéma D10).

---

## MD0 — Périmètre : pouvoir de PLATEFORME uniquement ✅

**Décision fondatrice** : cette matrice couvre EXCLUSIVEMENT le **pouvoir de plateforme** (technique, éditorial, modération, administration de l'outil). Elle ne traite PAS du pouvoir politique.

**Les deux mondes, strictement séparés (principe §1)**
- **Pouvoir POLITIQUE** (voter, désigner un binôme, légitimer une décision d'espace, mandater) = **délégation démocratique**. Se DÉRIVE du *statut* (membre actif) et du *mandat* (désignation par l'assemblée des présents). Entièrement spécifié dans **decider-V2.md**. N'apparaît PAS dans cette matrice, n'est JAMAIS une « case à cocher ».
- **Pouvoir de PLATEFORME** (écrire un article, modérer, modifier un objet, télécharger un fichier, gérer des membres techniques…) = **cooptation**. Géré par la table `Droit` (D10), cases à cocher granulaires (§9). C'est l'OBJET de cette matrice.

**Pourquoi cette séparation est non négociable (§1)**
- « Le pouvoir de plateforme n'ouvre AUCUN droit politique : pas de vote en assemblée, pas de droit spécifique dans Décider. C'est du support technique, point. »
- Analogie interne (non exposée) : la plateforme = une administration ; le mouvement = le législatif. L'administration fait tourner la machine, elle ne vote pas les lois.
- Risque écarté : qu'un jour quelqu'un coche une case technique en croyant accorder un pouvoir politique. Impossible par construction, puisque le politique n'est pas dans la matrice.

**Conséquence pour Claude Code** : la table `Droit` ne contient QUE des `type_droit` techniques/éditoriaux. Aucun droit de vote, aucun mandat, aucune légitimation politique n'y figure. Ces derniers se calculent depuis `Profil.statut` (membre actif) et les entités de mandat/désignation de Décider.

---

## Sommaire des décisions

- **MD0** ✅ Périmètre : pouvoir de plateforme uniquement (politique → Décider).
- **MD1** ✅ Grain fin (cases atomiques) + presets prêts à l'emploi.
- **MD2** ✅ Granularité de la cible : un droit porte sur une cible précise (objet ou espace).
- **MD3** ✅ Qui peut accorder un droit : non-élévation + verrou `gerer_droits` + exception cooptation.
- **MD5** ✅ Admin de plateforme : compte total (fondateur) + cercle d'admins cooptés granulaires.

**Reste à traiter (prochaines sessions)** :
- **MD2** : granularité — un droit porte-t-il sur un objet précis, un espace entier, ou les deux ?
- **MD4** ✅ Droits du créateur : preset « créateur » différencié objet / espace (voir plus bas).
- **MD6** ✅ Héritage des droits : AUCUN. Étanchéité totale des espaces (voir plus bas).

## MD1 — Grain des droits : fin (cases atomiques) + presets prêts à l'emploi ✅

**Décision** : option 4. Les droits sont **atomiques en base** (une permission = une action précise, cases indépendantes conformes au §9), ET regroupés en **presets** (modèles) pour l'attribution courante.

**Liste de référence des `type_droit` de plateforme (extensible, fermée — esprit D13)**

Regroupés par domaine pour la lisibilité (le regroupement est d'affichage ; en base chaque droit reste atomique et indépendant) :

- **Contenu / rédaction** : `ecrire_article`, `modifier_article_propre`, `modifier_article_autrui`, `supprimer_article`, `publier_mini_blog`.
- **Objets** : `creer_objet`, `modifier_objet`, `supprimer_objet`, `telecharger_fichier` (export), `gerer_image` (image par défaut/perso §11).
- **Modération** : `moderer_a_priori` (file pétitions §8), `moderer_a_posteriori`, `moderer_editorial` (média §8), `traiter_signalement`.
- **Média (sélection éditoriale §7)** : `selectionner_pour_media`, `editorialiser`, `mega_edito` (droit ouvert mais exercé COLLECTIVEMENT — cf. §1).
- **Membres / espace** : `gerer_membres` (techniques), `gerer_mandataires` (cf. D4 organisations), `administrer_espace` (config, outils activables D2), `gerer_droits` (accorder/retirer des droits — voir MD3).
- **Finance / caisse** : `gerer_caisse` (config réceptacles D7), `valider_reversement` (sortantes cagnotte D12), `consulter_journal` (lecture `journal_admin`).

> ⚠️ Aucun de ces droits n'est politique (pas de vote/mandat — MD0). Liste à compléter à l'implémentation ; ajouter un droit = ajouter une valeur de référence (esprit D13), jamais refondre.

**Presets (modèles d'attribution rapide)**
- Un preset = un paquet de `type_droit` coché en un clic, PUIS affinable case par case (on peut décocher après application).
- Presets de départ, calqués sur les « fonctions d'admin » de la réunion de structuration d'une commune (cf. commune-libre §3, point 5) :
  - **Rédacteur·ice** : `ecrire_article`, `modifier_article_propre`, `publier_mini_blog`.
  - **Modérateur·ice** : `moderer_a_posteriori`, `traiter_signalement` (+ `moderer_a_priori` si pétitions).
  - **Éditeur·ice média** : `selectionner_pour_media`, `editorialiser`.
  - **Gestionnaire d'espace** : `administrer_espace`, `gerer_membres`, `gerer_image`.
  - **Trésorier·ière** : `gerer_caisse`, `valider_reversement`, `consulter_journal`.
- Les presets sont des **raccourcis**, pas des rôles figés : ils posent des cases, ils ne créent pas une entité « rôle » rigide. Cohérent §9 (« le code offre la capacité, l'équipe choisit l'usage »).

**Justification**
- Grain fin = exigence directe du §9 (« écrire articles / modifier objet / télécharger fichier… indépendants »).
- Presets = vitesse d'attribution réelle (sinon : cocher 10 cases pour faire un rédacteur). Et ils épousent littéralement le point 5 de l'ordre du jour d'une commune (« partage des fonctions d'admin : qui prend quel rôle »).
- En base : table `Droit` (D10) inchangée, atomique. Les presets vivent dans l'UI + une liste de référence, pas dans une nouvelle structure rigide.
- MD2 : granularité — droit par objet, par espace, ou les deux ?
## MD2 — Granularité de la cible : un droit porte sur UNE cible précise (objet ou espace) ✅

**Décision** : tout droit de la table `Droit` (D10) s'applique à une **cible unique et précise** — soit un objet (cette pétition-ci, cette cagnotte-là), soit un espace (cette commune, cette campagne). Jamais à un « type » d'objet en général, jamais à plusieurs cibles d'un coup.

- Cible désignée par la paire `(cible_type, cible_id)` déjà prévue dans la table `Droit` (D10).
- Un droit sur un espace ne couvre PAS automatiquement les objets contenus/référencés par cet espace : un droit distinct par objet est nécessaire pour ce grain (cohérent D5/D6 — un objet est autonome, juste référencé, pas possédé).
- Exception pratique : `administrer_espace` confère, sur SON espace, la gestion de la configuration et des outils de cet espace (D2) — borné à l'espace, pas à ses objets ni à ses espaces rattachés (MD6, étanchéité).
- Cohérence : confirme MD3 (contrôle sur la paire profil × cible précise) et MD6 (aucune propagation). Pas de droit « global » sauf le compte admin total (MD5).

**Justification** : la granularité par cible précise est la condition d'un système de droits sûr et lisible — on sait toujours exactement sur quoi porte un pouvoir, sans zone grise.

## MD3 — Qui peut accorder un droit : non-élévation + verrou sur `gerer_droits` + exception cooptation ✅

**Décision** : option 4. Deux verrous anti-escalade combinés, avec une exception haute pour la cooptation (§1).

**Règle 1 — Non-élévation (« on ne donne que ce qu'on a »)**
- Un profil ne peut accorder QUE des `type_droit` qu'il possède lui-même sur la cible concernée.
- Conséquence : un modérateur ne peut pas, en manipulant les droits, se transformer en trésorier. Impossible de fabriquer un pouvoir supérieur au sien. Règle d'or anti-escalade.

**Règle 2 — Verrou sur `gerer_droits`**
- Avoir `gerer_droits` permet d'accorder/retirer les droits techniques/éditoriaux d'autrui, MAIS PAS d'accorder `gerer_droits` lui-même.
- Conséquence : un « donneur de droits » ne peut pas cloner son propre pouvoir de donner. Empêche l'auto-multiplication des administrateurs.

**Exception haute — Cooptation auto-perpétuante (§1)**
- L'**admin de plateforme** (le cercle coopté, §1) PEUT, lui, accorder `gerer_droits`. C'est sa fonction même : la cooptation est conçue pour être auto-perpétuante (« les coopté·es coopteront à leur tour », §1).
- Donc : les niveaux espace/objet sont verrouillés (règles 1+2) ; la transmission du pouvoir de coopter reste possible UNIQUEMENT au sommet coopté (admin plateforme). C'est voulu et cadré, pas une faille.

**Traçabilité (obligatoire)**
- Toute attribution/retrait de droit est journalisé dans `journal_admin` (D10/D11 schéma) : qui a accordé quoi, à qui, sur quelle cible, quand. Append-only. Indispensable pour auditer une escalade éventuelle.

**Justification**
- Ferme les deux chemins classiques d'escalade de privilèges : élévation (règle 1) et propagation du droit d'accorder (règle 2).
- Préserve l'architecture §1 : la cooptation contrôlée vit au sommet, le reste de la plateforme ne peut pas s'auto-promouvoir.
- Le politique reste hors sujet (MD0) : rien de tout ceci ne touche au vote/mandat.

**Point laissé ouvert**
- Définition précise de « admin de plateforme » comme entité/statut (est-ce un `type_droit` particulier, un statut sur le Profil, une appartenance à un cercle ?) → à préciser en MD5 (admin plateforme + équipes).
- MD4 : droits du créateur d'un objet/espace (auto-droits par défaut).
## MD4 — Droits du créateur : preset « créateur » différencié objet / espace ✅

**Décision** : option 4. À la création, un preset « créateur » est appliqué automatiquement, différent selon qu'on crée un OBJET ou un ESPACE. Affinable ensuite.

**Créateur d'un OBJET simple** (pétition, cagnotte, article, offre, sondage, événement…)
- Preset auto : `modifier_objet` (le sien), `supprimer_objet` (le sien), `gerer_image`, + droits spécifiques au type (ex. pétition : clôturer + exporter CSV consentants ; cagnotte : gérer la caisse + valider reversements ; article : publier mini-blog).
- **PAS de `gerer_droits` par défaut** sur un objet simple. Le créateur peut déléguer des droits précis (cf. §9 délégation granulaire) seulement s'il reçoit `gerer_droits`, dans la limite de non-élévation (MD3).
- Cohérent fiches : pétitions (créateur clôture + exporte), mini-blog §7 (écriture réservée créateur + mandataires).

**Créateur d'un ESPACE** (commune libre, campagne, GT, groupe d'entraide…)
- Preset auto plus large : `administrer_espace`, `gerer_membres`, `gerer_image`, `ecrire_article`/`publier_mini_blog`, + `gerer_droits` sur SON espace (légitime : c'est le pionnier qui « refait la déco »).
- Permet au fondateur d'un espace de l'organiser, d'inviter, de déléguer — exactement le rôle du pionnier de la commune libre.

**Articulation avec le cas COMMUNE LIBRE (pas une exception bricolée, une règle déjà posée)**
- La fiche commune-libre §2-3 a SA propre règle : le pionnier garde la main **jusqu'à 5 membres**, puis au seuil de 5 la **structuration via Décider** redistribue les rôles (désignation binôme, partage des fonctions d'admin).
- MD4 ne contredit PAS cela : le preset « créateur d'espace » donne au pionnier ses droits initiaux ; la structuration (Décider + réunion) est le moment POLITIQUE où la commune redistribue/confirme les droits de plateforme entre ses membres. Les deux cohabitent : MD4 = état initial à la création ; commune-libre §3 = évolution démocratique au seuil de 5.
- Litige (pionnier qui ne lâche pas) : réglé humainement par la modération (déjà acté commune-libre §2), pas par le code.

**Justification**
- Un espace mérite plus de pouvoir par défaut qu'un objet simple (on fonde un lieu vs on poste un contenu).
- Refuser `gerer_droits` par défaut sur les objets simples évite que le créateur d'une pétition à 17 000 signatures distribue des droits sans cadre.
- Les presets réutilisent MD1 ; rien de nouveau en base.

**Point laissé ouvert**
- Détail exact des droits spécifiques par type d'objet (pétition/cagnotte/…) → à finaliser avec les fiches de chaque sous-espace.
## MD5 — Admin de plateforme : compte total (fondateur) + cercle d'admins cooptés granulaires ✅

**Décision** : deux niveaux distincts, conformes au §1 (cooptation auto-perpétuante).

**Niveau 1 — Compte admin TOTAL (fondateur)**
- Le compte de Lilou/Ben (LIFE BENJAMIN BALL) : **tous les droits, sans restriction**. La clé maîtresse / compte racine.
- C'est lui qui amorce la cooptation et peut accorder `gerer_droits` (exception haute de MD3).
- ⚠️ **Point unique de défaillance assumé MAIS protégé** par trois garde-fous obligatoires :
  1. **2FA obligatoire et renforcée** sur ce compte (non négociable — déjà prévu pour les admins).
  2. **Journalisation systématique** de TOUTE action du compte total dans `journal_admin` (append-only), avec vigilance particulière.
  3. **Double validation des actions destructrices** : les opérations les plus dangereuses (suppression massive, modification de caisse/réceptacle, retrait de droits en masse, purge de données…) exigent une confirmation par un second admin habilité. Friction volontaire sur les gestes irréversibles.

**Niveau 2 — Cercle d'admins COOPTÉS (granulaires)**
- Entité « Cercle admin plateforme » : appartenance explicite (reflète l'« équipe fondatrice » du §1).
- Chaque admin coopté reçoit des **droits internes granulaires** (cases fines MD1), JAMAIS le total automatiquement. Principe de moindre pouvoir au sommet : un admin gère les caisses, un autre la modération globale, etc.
- Évite le super-admin monolithique dupliqué : si un compte coopté est compromis, seul son périmètre tombe, pas toute la plateforme.
- Auto-perpétuation (§1) : un admin disposant de `gerer_droits` (accordé par le fondateur ou un cercle habilité) peut coopter à son tour — dans la limite de la non-élévation (MD3, règle 1).

**Articulation avec MD3 (referme le point ouvert de MD3)**
- « Admin de plateforme » = appartenance au Cercle + droits internes. Le fondateur = membre du cercle avec droits totaux. Les cooptés = membres avec droits partiels.
- Seul ce cercle peut accorder `gerer_droits` (exception haute MD3). Les niveaux espace/objet restent verrouillés par non-élévation.

**Justifications**
1. Fidèle au §1 : cooptation collective, auto-perpétuante, cercle préexistant.
2. Moindre pouvoir même au sommet (sécurité) : pas de super-admin monolithique côté cooptés.
3. Le compte total reste pratique (clé maîtresse au démarrage) mais sa dangerosité est contenue par 2FA + journal + double validation.
4. Cohérent avec la vigilance de Lilou sur la garde de clés (cf. logique Smaug) : un point unique de défaillance n'est jamais laissé nu.

**Points laissés ouverts**
- Liste précise des « actions destructrices » soumises à double validation → à dresser à l'implémentation.
- Le « second admin » de la double validation : n'importe quel membre du cercle, ou un sous-ensemble désigné ? À préciser.
- MD6 : héritage des droits dans le graphe d'espaces (un droit sur un espace parent vaut-il sur l'enfant ?).
- Articulation finale avec la table `Droit` du schéma (D10).


## MD6 — Héritage des droits dans le graphe : AUCUN (étanchéité totale) ✅

**Décision** : option 1. Les droits ne se propagent JAMAIS le long des liens de rattachement. Chaque espace est étanche : un droit accordé sur un espace ne vaut QUE sur cet espace.

**Pourquoi ce choix radical est le bon ici**
- **Graphe pur (D3)** : un espace a des rattachements multiples, de natures diverses, sans hiérarchie imposée. Il n'existe pas de « parent » univoque → un héritage automatique n'aurait pas de sens clair, et serait dangereux.
- **Anti-squat (§4)** : le double consentement empêche le squat d'identité par rattachement. Si les droits coulaient le long des liens, on réintroduirait le squat par la porte des permissions (se faire rattacher = prendre le pouvoir). L'étanchéité ferme définitivement ce chemin d'invasion.
- **Règle d'or de sécurité** : aucun pouvoir ne franchit un lien tout seul. Pas de chemin d'escalade via le graphe. Cohérent avec MD3 (non-élévation) et l'esprit général anti-faille.

**Comment on évite la lourdeur (seul défaut du choix)**
Le risque d'« aucun héritage » est qu'une grosse fédération doive re-déclarer ses admins dans chaque commune. Parades, SANS jamais faire couler le pouvoir automatiquement :
- **Délégation explicite inter-espaces** (reprise de l'idée option 4, comme outil, pas comme automatisme) : un espace PEUT accorder volontairement un droit à un autre espace rattaché (« cette commune donne à la fédération le droit d'y publier »). Acte explicite, tracé (`journal_admin`), révocable. Le pouvoir est donné, jamais hérité.
- **Attribution groupée côté UI** : une personne ayant un preset dans plusieurs espaces peut être gérée par lots, mais chaque attribution reste une ligne `Droit` distincte par espace (pas un héritage, une commodité d'interface).
- **Mandataires d'organisation** (D4 schéma) : pour agir au nom d'une entité sur plusieurs espaces, la liste de mandataires reste le mécanisme — distinct des droits de plateforme.

**Conséquence technique (Claude Code)**
- Tout contrôle de droit se fait sur la PAIRE (profil, espace/objet cible) précise. JAMAIS de remontée/descente le long de la table `Rattachement`. Pas de requête récursive de droits dans le graphe.
- La table `Rattachement` (D3) sert les relations politiques/organisationnelles, PAS la propagation de droits. Séparation nette.

**La matrice de droits (doc 2) est désormais complète sur ses 6 axes : MD0 périmètre, MD1 grain+presets, MD3 octroi, MD4 créateur, MD5 admin, MD6 héritage. Restent des points de détail (listés dans chaque décision) à finaliser à l'implémentation.**
