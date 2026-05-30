# Spec — Réseau social V2 : relations, commentaires, organisations

> Spécification de l'épopée « réseau social V2 », arbitrée avec Lilou/Ben les
> 30-31/05/2026. Source de vérité pour les chantiers A→D ci-dessous. Tout se
> construit **par greffe additive** (doctrine CLAUDE.md §0.3) sur l'infra
> réseau existante (chantier 7.5 + Phase H). Aucune table existante détruite,
> aucun compteur réinitialisé. Migrations locales jusqu'à la Phase M.

## 0. Principe directeur

Chaque action publique sur le site (lancer une pétition, proposer un service,
commenter, créer un espace…) est une **occasion de pousser vers le réseau
social**. Tout auteur·ice / proposeur·euse / espace devient une présence
**suivable** et **cliquable**.

## 1. Identités : personne vs organisation/espace

- **Personne** → on suit son **profil** (`relation_reseau`, suivi sens unique).
  Identité = `personne` + `profil_unifie` (numéro public M+7).
- **Organisation / espace collectif** (commune, fédération, confédération, GT,
  groupe d'entraide, campagne, **organisation** [nouveau]) → on suit sa
  **page** (`abonnement_espace_reseau`). **Pas de profil unifié** : juste un
  **appairage** réseau ↔ espace via le couple `(espace_type, espace_id)` (déjà
  utilisé pour les publications « au nom d'un espace », Phase H).

## 2. Lien public, affichage au choix

- Agir sur le site rend la présence réseau **publiquement liée et suivable**
  (le **handle/numéro** est public, donc le profil est toujours atteignable).
- **Ce qui s'affiche** (nom, photo, bio…) reste piloté par les **préférences
  de visibilité** de la personne / les réglages de l'organisation. Le palier
  « amies » débloque davantage de champs.
- Conséquence technique : le **numéro public** ne doit pas être masqué (c'est
  le handle). Seuls les champs de contenu (nom, photo, bio) suivent la
  visibilité. (Cf. chantier A.2b : vérifier/ajuster `personne_affichage`.)

## 3. Suivre / Ami·e (personnes uniquement)

- **Suivre** : sens unique, ouvert par défaut. *(Existe : `relation_reseau`.)*
- **Ami·e** : relation **stockée, distincte du suivi** (nouveau ; aujourd'hui
  « ami » = suivi mutuel calculé, à remplacer par une vraie table).
  - **Demande d'ami** autorisée si la cible **te suit déjà en retour**, *ou*
    si elle a activé « n'importe qui peut me demander en ami » (défaut : non).
  - **Accepter** une demande → **force le suivi mutuel** + débloque la
    **messagerie** entre les deux + palier de visibilité « amies ».
  - On peut **arrêter de suivre sans cesser d'être ami·es** : l'amitié persiste
    indépendamment du suivi.
- Les **organisations/espaces n'ont pas d'« ami »** (on les suit, point).

## 4. Messagerie

- Par défaut : **entre ami·es uniquement**.
- Sauf si la personne a activé « **n'importe qui peut m'envoyer un message** ».
- ⚠️ Changement de comportement : aujourd'hui tout·e connecté·e peut écrire à
  n'importe qui. On resserre (verrou + préférence). Additif (pas de perte).

## 5. Flux (hiérarchie transparente, raffinée)

Ordre d'affichage : **ami·es → ami·es d'ami·es → pages/personnes suivies →
reste**. (Affine l'actuel soi → suivis → reste.)

## 6. Commentaires (chantier A — FAIT)

- Table polymorphe `commentaire_objet (objet_type, objet_id, …)`, réservée aux
  connecté·es, modération a posteriori (onglet réseau).
- Sur tous les contenus : pétitions, mobilisations, cagnottes, campagnes,
  moments, sondages, offres d'entraide, services SEL, produits, boutiques.
- Pseudo de l'auteurice **cliquable → profil réseau** + suivable.

## 7. Organisations + mandat (chantier B)

> Arbitré avec Lilou/Ben le 30/05/2026. Décisions ci-dessous = source de vérité.

### 7.0 Principe : « organisation » est un concept ombrelle

Tout collectif est une **organisation** : les espaces internes du mouvement
(commune libre, fédération, GT, groupe d'entraide) ET les structures externes
(association, syndicat, ONG, coopérative, entreprise, fondation, mouvement,
collectif…). **Conceptuellement, tout est organisation.**

**Techniquement, on NE FUSIONNE PAS** (doctrine de greffe §0.3.3 : pas de
migration lourde du modèle sans décision nominative dédiée). « Organisation »
devient un **`espace_type` de plus**, à côté des tables existantes (intactes).
Le mécanisme gestionnaire / badge / mandat est **polymorphe** `(espace_type,
espace_id)` : il s'applique d'abord aux nouvelles organisations externes, et
pourra plus tard couvrir les espaces internes sans rien casser.

### 7.1 Taxonomie (type_organisation, liste fermée + « autre »)

`collectif`, `association`, `syndicat`, `mouvement`, `fondation`, `ong`,
`cooperative`, `entreprise`, `groupe`, `autre`. (Éditable/extensible plus tard.)

### 7.2 Décisions de gouvernance (arbitrées)

- **Badge « officiel » (anti-usurpation) — voie 2** : l'**admin** accorde le
  PREMIER badge d'une organisation, après vérification. Ensuite, un·e
  gestionnaire déjà officialisé·e peut **coopter** d'autres gestionnaires sans
  repasser par l'admin. Tant que le badge n'est pas accordé, la page existe
  mais reste **non officielle** (gestion provisoire possible).
- **Droits du·de la gestionnaire — les trois** : (a) **tenir la page**
  (publier au nom de l'organisation, éditer nom/logo/description, répondre) ;
  (b) **initier des contenus rattachés** (pétitions, cagnottes, mobilisations
  affichées comme portées par l'organisation, soumises à la même modération
  que les autres) ; (c) **gérer les autres gestionnaires** (coopter / retirer).
- **Revendication concurrente — file d'attente, l'admin tranche** : la première
  personne attestée gère à titre provisoire ; toute revendication concurrente
  est mise **en attente** et c'est l'**admin** qui désigne le·la gestionnaire
  officiel·le. Pas de fusion automatique.

### 7.3 Création

- **Manuelle** : une personne crée une organisation (nom, type, description,
  logo) et en devient gestionnaire provisoire (avec attestation sur l'honneur).
- **Auto (à la déclaration d'un contenu initiateur)** : si une personne lance
  un contenu en déclarant une organisation initiatrice, la page est créée (ou
  reliée si elle existe). Branché après l'infra (sous-chantier B.4).

### 7.4 Découpage des sous-chantiers B

| Sous-chantier | Contenu |
|---|---|
| **B.1** | Table `organisation` (+ `espace_type` 'organisation' dans les CHECK existants), page publique `/organisations/[slug]` suivable + index, création manuelle. |
| **B.2** | Rôle `gestionnaire_espace` polymorphe + attestation + badge officiel (admin) + cooptation entre gestionnaires + publier/éditer au nom de l'organisation. |
| **B.3** | File d'attente des revendications concurrentes + console admin d'arbitrage (accorder le badge, désigner le·la gestionnaire). |
| **B.4** | Contenus rattachés à une organisation (déclaration d'organisation initiatrice + création auto). |

## 8. Découpage et ordre des chantiers

| Chantier | Contenu | Risque | État |
|---|---|---|---|
| A.1/A.2 | Commentaires polymorphes sur tous les contenus | additif | ✅ FAIT (V2.6.1/2) |
| **A.2b** | Auteurs/proposeurs **cliquables → profil réseau** (public) sur les fiches | additif | ✅ FAIT (V2.6.3/4/5) |
| **C** | Espaces communautaires (communes, fédérations, GT, groupes) **cliquables/suivables** ; pousser le lien réseau à la création | additif | ✅ FAIT (V2.6.6) |
| **D** | Amitié stockée + demandes + messagerie verrouillée + flux re-classé | additif (table + prefs) + 2 comportements ajustés | ✅ FAIT (V2.6.7→11) |
| **B** | Pages organisation + mandat (attestation + officialisation validée) | porte droits/gouvernance | à concevoir avec Lilou/Ben |

## 9. Garde-fous

- Greffe additive stricte : nouvelles tables (`commentaire_objet`, `amitie`,
  `espace organisation`), nouvelles colonnes de préférences ; jamais de DROP.
- `relation_reseau` (suivi) conservé tel quel ; l'amitié devient une table à
  part, le helper `est_ami_reseau` sera réimplémenté sur cette table (sans
  casser ses appelants).
- Migrations **locales** jusqu'à la Phase M (push distant sur décision).
