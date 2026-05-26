# Maintenant Médias — Spécifications V2

> **Espace** : S'informer
> **Fichier** : maintenant-medias-V2.md
> **Version** : 1.1 (révision 26/05 soir : retour à « Maintenant Médias » avec S, conforme au vocabulaire V1)
> **Session** : 2026-05-26
> Signature : LIFE BENJAMIN BALL.
> Dépend de : principes-transversaux-V2.md (lire en premier).

---

## 0. Nature : un seul objet, trois manières de le vivre

**Maintenant Médias = le média des 99 %.** Un **objet unique**, décliné en trois modes (PAS trois objets distincts) :

1. **National** : une home média, la rédaction nationale.
2. **Local** : par subsidiarité (comme groupes locaux, communes, groupes d'entraide). Chacun crée son équipe, sa curation, sa page. URL type `maintenant-le-mouvement.org/média-[localité ou nom choisi]`. Chaque média local choisit son nom.
3. **Affiche** : composition imprimable (voir §5).

> **Nommage / identité** : famille « des 99 % » → « le média des 99 % », « la radio des 99 % », etc. Le libellé « Maintenant Médias » s'affiche **en petit / discret** *(à préciser : minuscules `maintenant médias` OU simplement petite taille typographique — Lilou à trancher)*.
> **Décision de nommage** (révisée 26/05 soir) : on unifie sur **« Maintenant Médias »** (avec S, conforme au vocabulaire V1 fixé dans `docs/specs/03_VOCABULAIRE.md`). On abandonne les anciens noms « Média Maintenant » et « Maintenant Média » (sans S) pour ne PAS créer deux entités. *Note : la session du 26/05 PM proposait l'inverse (« Maintenant Média » sans S) ; arbitrage du 26/05 soir confirme « Médias » avec S pour ne pas contredire le vocabulaire V1, qui prime sur le V2 (voir bloc de préséance CLAUDE.md §0).*

**Circulation national ↔ local** : un média local pioche dans **n'importe quel** article du national + ses propres articles. Réciproquement, le national peut récupérer les articles publiés localement (**curation ascendante**). Cohérent avec §7 (mini-blog alimente le vivier média).

---

## 1. Gouvernance éditoriale : la rédaction est portière ET cheffe d'orchestre

- **ZÉRO automatique.** Rien ne paraît sans l'aval de l'équipe de rédaction. Ni les blogs internes, ni les dépêches ne remontent seuls : l'équipe sélectionne, met en forme, publie.
- L'équipe de rédaction relève de **l'ordre de la plateforme → cooptation** (cf. principes §1). Statut **technique**, sans droit politique attaché.
- Rôle « rédacteur·ice » = **droit attribué dans le back-office** (comme les modérateur·ices), pas un statut pesant en assemblée.

---

## 2. Trois sources d'alimentation

1. **Rédaction propre** : l'équipe écrit ses propres articles.
2. **Curation externe** : contenus produits ailleurs (dépêches AFP/Reuters *(I-9 : vérifier licence/coût)*, articles d'autres sites).
   - **Règle de droit** : si dépêche → étiquetée « dépêche ». Si article externe → **jamais reproduit intégralement** sauf droits de repro autorisés ; sinon affichage **partiel** + « lire la suite » qui ouvre la source dans un **nouvel onglet** (`target="_blank"` + `rel="noopener"`), **jamais une nouvelle fenêtre**.
   - **Raison du nouvel onglet** : génère un **référent visible** → le site source voit arriver du trafic depuis Maintenant et se demande qui l'envoie. Logique de visibilité réciproque.
3. **Curation interne** : tous les blogs des espaces (cf. principes §7) produisent des articles agrégeables et remixables par la rédaction.

**Bouton « Proposer un contenu »** (transversal) : n'importe qui peut soumettre un **contenu** d'ailleurs (le mot « contenu », pas « article », car ce peut être vidéo, podcast, dessin, photo, texte). Tombe dans une file de modération éditoriale traitée par la rédaction. Modale ouverte, pré-remplie si connecté·e.

---

## 3. Maintenant Radio (rappel — acté sessions antérieures)

- Onglet **« EN LIVE »** dans Maintenant Médias (pas un espace séparé : la radio vit DANS le média).
- Flux radio **continu**. Hébergement **AzuraCast** auto-hébergé, libre (~5-10 €/mois).
- *À préciser : continu 24/7 OU émissions programmées.*

---

## 4. Règles transversales d'affichage (pour Claude Code)

- **Lien externe = nouvel onglet** + `rel="noopener"`, jamais de nouvelle fenêtre (référent visible).
- **Pas d'autoplay vidéo** : clic obligatoire pour déclencher, pas de flux subi (règle déjà actée côté réseau social, généralisée ici).

---

## 5. Mode affiche (composition imprimable)

L'affiche n'est pas un objet à part : c'est un **mode** du média (national ou local). On compose son média sous forme d'affiche.

### Contenu imprimable
- **Uniquement formats imprimables** : articles, dessins, photos. **Pas** de podcast ni de vidéo (évidemment).

### Grille de formats (nombre de feuilles à assembler)
- **1×2** = 2 feuilles
- **2×3** = 6 feuilles
- **4×4** = 16 feuilles (la grande, « journal révolutionnaire »)
- Esprit journal de la Résistance / journal-affiche : on imprime chez soi et on assemble à la colle.

### Rendu d'impression (avec prévisualisation obligatoire)
- **Noir et blanc**
- **Bichromie** (noir + blanc + une couleur d'accent)
- **Couleur**
- Prix différenciés selon le mode (pour la voie livraison) ; N&B < bichromie < couleur.

### Esthétiques / modèles de journaux
- Choix entre plusieurs esthétiques prédéfinies (faciliter la composition).
- Repose sur les **30 modèles créés dans Canva → exportés en HTML/CSS** dans le code (Canva en conception, plus en production). L'utilisateur décrit ce qu'iel veut ; un agent pioche dans le contenu du site et remplit le modèle. *(Architecture v1 hybride actée session 4.)*

### Deux voies de sortie
1. **Impression maison (par défaut, gratuit)** : la personne imprime chez elle, assemble.
2. **Impression + livraison nationale (service à l'adhérent·e)** :
   - **Contribution financière, PAS une vente** (don ouvrant droit à recevoir les affiches ; aucune plus-value sur la vente). Statut juridique tranché.
   - **Opérateur = l'association** : elle imprime elle-même / achète des impressions, fournit le service à ses adhérent·es. Modèle associatif classique, juridiquement éprouvé. **Pas** une exception au « Maintenant! ne touche jamais l'argent » : c'est un service à l'adhérence assumé.
   - Paiement : **99-coin + POL** (frais de port) **OU euros + euros** (frais de port).
   - **Plafond : 100 affiches / personne.**
   - **Anti-abus par frottement POL** : même payé en 99-coin, le port coûte toujours quelques POL réels → dissuade les commandes massives de gens qui n'afficheront jamais. Pas besoin de garde-fou lourd.

---

## Points à valider avec Légicoop
- Service impression-livraison d'affiches = **don/contribution** (pas vente, pas de plus-value), **réservé aux adhérent·es**. Confirmer le montage (l'association imprime/achète et fournit le service).

## Reste à préciser
- « Maintenant Médias » en petit : minuscules OU petite taille typo ?
- Radio : continu 24/7 OU émissions programmées ?
- Licence/coût dépêches AFP/Reuters (I-9).
