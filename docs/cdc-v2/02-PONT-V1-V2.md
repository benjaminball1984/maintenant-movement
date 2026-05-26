# Pont V1 → V2 — Maintenant!

> **Fichier** : 02-PONT-V1-V2.md
> **Date** : 2026-05-26 (soir). Signature : LIFE BENJAMIN BALL.
> **But** : dire, entité V1 par entité V1, ce qu'elle DEVIENT dans la cible V2, et comment on l'y amène par greffe SANS perte de donnée ni reset de compteur.
> **Loi suprême de ce document** : on additionne, on ne soustrait jamais ; on backfill, on ne réinitialise jamais ; le grand modèle (tronc Objet) est une cible reportée, pas un chantier.

---

## 0. Les trois verbes du pont

Chaque table V1 reçoit l'un de ces trois traitements :

- **GARDER** : la table V1 est déjà conforme à l'esprit V2 (ou assez proche). On ne touche pas. Éventuellement on ajoute une colonne additive.
- **GREFFER** : on crée une structure V2 à côté, on la remplit en lisant la V1 (backfill), la V1 devient trace historique. Rien n'est supprimé.
- **CONVERGER (reporté)** : la table V1 a vocation à fondre dans le tronc `Objet`/`Espace` du V2. NE PAS FAIRE maintenant. Cible doctrinale, sur décision nominative de Lilou/Ben, table par table.

---

## 1. Identité et personnes

| Table V1 | Devient en V2 | Verbe | Comment |
|---|---|---|---|
| `personne` (liée à `auth.users`) | `Profil` individuel + `Compte` (D1) | **GARDER** | D1 colle déjà : `auth.users` = Compte, `personne` = Profil. Rien à faire. |
| `profil_unifie` (M+7) | `Profil` durable, identifiant M+7 (D1, §17) | **GARDER** | Déjà exactement la cible. Le générateur M+7 (anti-collision, anti-gros-mots) servira de base à ORM+5 et ESM+5. |

**Note** : le V2 (D4) prévoit `Profil` de type `organisation` (ORM+5) et le V2 (D13) prévoit `ESM+5` pour les espaces. Ces identifiants se posent **de façon additive** quand on créera les premières organisations/espaces génériques, en réutilisant le générateur existant. Pas avant, pas en bloc.

---

## 2. Consentements et signatures

| Table V1 | Devient en V2 | Verbe | Comment |
|---|---|---|---|
| `signature_petition` (+ 2 colonnes de consentement en dur) | `Signature` avec snapshot (D9) + entité `Consentement` séparée (D8) | **GREFFER** | Voir détail ci-dessous. |

**Détail (le cas-école du pont)** :
1. La table `signature_petition` reste intacte. Ses colonnes `accepte_newsletter` et `accepte_contact_createurice` deviennent la **trace figée de l'état initial** (cohérent avec le snapshot D9).
2. Créer la table `consentement` (D8) : `profil_id`, `type_consentement`, `objet_id`, `valeur`, `date`, `source`. RLS dans sa propre migration.
3. **Backfill** (script idempotent, `--dry-run` obligatoire) : chaque `true` des deux colonnes → une ligne `consentement` datée du `created_at` de la signature, source `backfill_signature_v1`. Les `false` ne créent rien.
4. La table `consentement` devient l'**état vivant et révocable** ; les colonnes V1 restent la photo d'origine. Compteur de signatures inchangé (on n'a pas touché `signature_petition`).

---

## 3. Droits et traçabilité

| Table V1 | Devient en V2 | Verbe | Comment |
|---|---|---|---|
| `droit_admin` (6 niveaux fixes) | table `droit` atomique + presets (MD1, D10) | **GREFFER** | Les 6 niveaux V1 deviennent des **presets** V2. Backfill : chaque ligne active de `droit_admin` génère les `droit` atomiques de son preset. `droit_admin` reste lu par les helpers RLS V1 pendant la coexistence. Personne ne perd ses droits. |
| `journal_admin` | `JournalAdmin` (D10), append-only | **GARDER** | Déjà conforme. Enrichir la liste des `action` au besoin (additif). |

---

## 4. Paiements et collecte

| Table V1 | Devient en V2 | Verbe | Comment |
|---|---|---|---|
| `don` (`personne_id` nullable) | `Transaction` régime B + `Caisse` (D7, D11, D12) | **GREFFER (additif)** | Les dons passés restent tels quels (anonymat d'époque conservé). Pour les NOUVEAUX dons : rattacher un profil (D11, `afficher_nom` pour le masquage social), modéliser la `Caisse` et les `ReceptacleCaisse` datés, et les reversements comme transactions sortantes avec justificatif obligatoire (D12). |
| `cagnotte` | `Objet` de type cagnotte + `CagnotteDetail` (D6) | **GARDER pour l'instant** | La table `cagnotte` fait déjà le travail (régime B, jauge €+T99CP). La fonte dans le tronc `Objet` est CONVERGER (reporté). |
| (bouts de wallet intégré dans le code) | RIEN (§19 : aucun wallet intégré) | **RETIRER (code, pas donnée)** | Retirer `app/(membre)/profil/wallet/` et les bouts de wallet. Garder : lecture de solde + vérification de hash (unique, non déjà consommé) via l'adapter `lib/t99cp/`. Redirection vers la home `the99coinproject.org`. Chantier prioritaire, zéro donnée en jeu. |

---

## 5. Espaces (commune, fédération, campagne, GT…)

| Tables V1 | Deviennent en V2 | Verbe | Comment |
|---|---|---|---|
| `commune`, `appartenance_commune`, `federation`, `confederation`, `gt_thematique`, `campagne`, `module_campagne` + appartenances | `Espace` générique (`type`+`config`+`OutilActivé`) + `Rattachement` graphe (D2, D3, D13) | **CONVERGER (reporté)** | C'est le cœur du grand modèle. NE PAS fondre maintenant. Les tables V1 fonctionnent. Quand on créera de NOUVEAUX types d'espaces (ex. groupe d'entraide local), on peut le faire en style V1 (table dédiée) tout en restant compatible avec la cible, OU amorcer l'`Espace` générique sur décision. À arbitrer chantier par chantier. |
| `organisation_partenaire` | `Profil` de type organisation (ORM+5, D4) | **GREFFER (à clarifier)** | Le V2 (D4) signale qu'il faut vérifier si `organisation_partenaire` = la notion d'organisation-acteur ou une notion distincte. À clarifier avant de greffer ORM+5. |

---

## 6. Objets agrégés métier

| Tables V1 | Deviennent en V2 | Verbe | Comment |
|---|---|---|---|
| `petition`, `mobilisation`, `participation_mobilisation` | `Objet` + tables filles (D6) | **CONVERGER (reporté)** | Fonctionnent. Cible = tronc Objet. Pas maintenant. |
| `offre_entraide`, `service_sel`, `prestation_sel` | `Objet` type offre + `OffreDetail` + `Réservation` (D6, D8) | **CONVERGER (reporté)** + **GREFFER** la Réservation si absente | Le composant `Réservation` (D8, façon Airbnb/BlaBlaCar) est réutilisable : à greffer là où il manque, de façon additive. |
| `produit_marche`, `boutique_marche`, `produit_boutique`, `minimarche_solidaire`, `notation_marche` | `Objet` type offre marché + détails (D6) | **CONVERGER (reporté)** | Fonctionnent. |
| `moment_solidaire`, `participation_moment` | `Objet` type événement + `EvenementDetail` (D6) | **CONVERGER (reporté)** | Fonctionnent. |
| `adhesion` | `Objet` type adhésion + régime B (D6, D7) | **GARDER** | Fonctionne. |
| `sondage`, `reponse_sondage` | `Objet` type sondage + `SondageDetail` (D6) | **CONVERGER (reporté)** | Fonctionne. |
| `media` | `Objet` type article / mini-blog (D6, §7) | **CONVERGER (reporté)** | Vocabulaire : « Maintenant **Médias** » (avec S). |
| `tupperware` | (à clarifier : quel sous-espace V2 ?) | **À CLARIFIER** | Table présente en V1, pas explicitement reliée à une fiche V2. Demander à Lilou/Ben à quel sous-espace elle se rattache. |

---

## 7. Réseau social

| Tables V1 | Deviennent en V2 | Verbe | Comment |
|---|---|---|---|
| `relation_reseau`, `post_reseau`, `commentaire_reseau`, `reaction_reseau`, `message_reseau` | `Relation`, `Message` (DM), `FilDeGroupe`, posts (D8, §6, §18) | **GARDER + GREFFER le FilDeGroupe** | Le réseau social V1 (chantier 7.5) couvre déjà DM, posts, relations. Le **fil de discussion de groupe** (§18, distinct du DM) est à greffer là où il manque (tout groupe/espace). Additif. |
| `notification`, `preference_notification` | Notifications (transverses) | **GARDER** | Fonctionne. |

---

## 8. Cartographie et référentiels

| Tables V1 | Deviennent en V2 | Verbe | Comment |
|---|---|---|---|
| `commune_reference`, `correspondance_cp_insee`, `compteurs_commune` | Cartographie 2 sources (§5) + carte unifiée (transverse) | **GARDER** | 35 011 coquilles déjà précréées. Ne PAS retoucher (compteur de communes = donnée). |

---

## 9. Ce qui est NOUVEAU en V2 (n'existe pas en V1, donc pure addition)

Pas un pont, une création. Aucun risque données :
- Entité `Consentement` (greffe ci-dessus).
- Table `droit` atomique + presets (greffe ci-dessus).
- `Caisse` + `ReceptacleCaisse` datés + transactions sortantes avec justificatif (D7, D12).
- `FilDeGroupe` partout (§18).
- Composant `Réservation` réutilisable là où il manque (D8).
- Composant `TeleverseurImage` + bibliothèque d'images par défaut (exigences ET1/ET2).
- Bouton bascule thème (ET3), généralisation du dégradé (ET4).
- Nouveaux sous-espaces S'entraider non encore codés (hébergement, prêt, fruits, marché solidaire, groupe d'entraide local…) : à construire selon les fiches V2.
- Identifiants ORM+5 (organisations) et ESM+5 (espaces) : additifs, à la création des premières entités concernées.

---

## 10. Règle de conduite pour CHAQUE entrée de ce pont

Avant de toucher quoi que ce soit qui porte des données :
1. Vérifier le verbe (GARDER / GREFFER / CONVERGER-reporté).
2. Si CONVERGER : **ne rien faire**, c'est reporté. Avancer ailleurs.
3. Si GREFFER : créer à côté, backfill idempotent avec `--dry-run`, garder la V1 comme trace, consigner dans le MANIFEST sous « Écarts V1→V2 appliqués ».
4. Jamais de `DROP` de table/colonne avec données. Jamais de reset de compteur. En cas de doute : `// CHANTIER-EN-ATTENTE-DE-DÉCISION-LL/B`.
