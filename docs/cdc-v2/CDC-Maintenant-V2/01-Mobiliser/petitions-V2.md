# Pétitions — Spécifications V2

> **Fichier** : petitions-V2.md
> **Version** : 1.1
> **Dernière mise à jour** : 2026-05-26
> **Sessions** : 2026-05-25 (P1-P6) + 2026-05-26 (ajout champ téléphone)
> Sous-espace de Mobiliser. Fonctionnalité la plus aboutie du site (déjà livrée).
> Signature : LIFE BENJAMIN BALL.

---

## Historique des versions

- **v1.0** (2026-05-25) : arbitrages P1 à P6.
- **v1.1** (2026-05-26) : ajout du champ téléphone optionnel « (pour agir avec nous) », cohérent avec les mobilisations.

---

## PRINCIPE TRANSVERSAL — deux logiques de pouvoir (vaut pour tout le site)

À ne jamais confondre :

1. **Le MOUVEMENT et ses instances** (communes, fédérations, confédération) = **délégation démocratique** : mandat, vote, représentation, reddition de comptes (cf. Décider).
2. **La PLATEFORME** (gestion technique, modération, administration de l'outil) = **cooptation** : les équipes s'agrandissent en cooptant des personnes de confiance, autodéterminent leurs règles, sous contrôle de l'admin.

Administrer l'outil n'est pas représenter le mouvement.

**Corollaire technique** récurrent : *le code offre la capacité, l'équipe choisit l'usage.* On ne code pas de règle de modération/gestion en dur ; on code un outil souple que l'équipe configure par sa pratique.

---

## P1 — Modération des pétitions

- Modération **a priori**, assurée par une **équipe de volontaires**.
- Recrutement par **cooptation** (logique plateforme).
- L'équipe **autodétermine ses propres règles**, sous contrôle de l'admin.
- Système volontairement **simple** : pas de critères figés dans le code, pas de circuit lourd.
- **Code** : file de pétitions « en attente » ; action valider/refuser ; statut visible par l'auteur·ice ; capacité de notification.

## P2 — Notification et motif de refus

- Laissé à la **libre appréciation de l'équipe** (cohérent avec P1).
- **Code** : rendre les deux pratiques possibles sans imposer. Champ « motif de refus » présent mais **facultatif** ; notification à l'auteur·ice disponible mais **activable/désactivable**.

## P3 — Signature et profil unifié

- Signature **sans compte** = champs minimum + **2 cases RGPD indépendantes et facultatives** :
  1. accepte d'être contacté·e par le **créateur·ice** de la pétition ;
  2. accepte d'être contacté·e par la **plateforme** = abonnement **newsletter**.
- Cocher 0, 1 ou 2 cases : la signature reste valable.
- Déroulé : signature → **création silencieuse d'un profil unifié** (M+7) → la signature **compte immédiatement** dans le total (avant confirmation email) → message « merci, confirmez votre mail » → email de confirmation → au clic, **message proposant d'adhérer**.
- La confirmation d'email = moment privilégié pour proposer l'adhésion.

## P3bis — Champs du formulaire (mise à jour v1.1)

- **Email** : obligatoire.
- **Téléphone** : **optionnel**, avec mention **« (pour agir avec nous) »**. Finalité : canal d'engagement renforcé (même logique que les mobilisations). Une personne ayant laissé son numéro + coché le consentement peut être recontactée plus directement (créateur·ice, plateforme) pour repasser un chemin d'engagement : signataire → inscription → adhésion.
- (Le code postal n'est PAS imposé sur la pétition — il l'est sur la mobilisation. À confirmer si on veut l'ajouter aussi sur la pétition.)

## P4 — Anti-bot et fiabilité des emails

- **Turnstile (anti-bot) OBLIGATOIRE** sur la signature. Garde-fou contre le gonflage automatisé (crédibilité politique). Adapter déjà au stack (mock → réel en prod).
- **Distinction confirmé / non-confirmé : conservée, jugée essentielle.**
  - Raison : qualité d'un email confirmé ≠ non confirmé ; vital pour la délivrabilité (éviter les rebonds qui plombent la réputation d'envoi).
  - **Finesse clé** : la confirmation est un attribut du **profil unifié** (la personne), **pas** de chaque signature. Dès qu'un profil a confirmé son mail **au moins une fois**, il entre durablement dans la base « fiable », quelles que soient ses signatures ultérieures non confirmées.
- Principe : **afficher large, envoyer fiable**. Total public généreux (toute signature compte) ; communication de masse ciblée en priorité sur les profils confirmés.
- **Code** : booléen durable « email confirmé au moins une fois » au niveau du profil, distinct du statut de chaque signature.

## P5 — Compteur et paliers (« stretch »)

- Le créateur·ice fixe un **objectif de départ**, modifiable **manuellement à tout moment**.
- Montée **automatique** du palier dès **dépassement de 90 %** de l'objectif courant.
- Paliers toujours sur **chiffres ronds et parlants**.
- **Progression retenue : suite 1 – 2 – 5 par ordre de grandeur** :
  1 000 → 2 000 → 5 000 → 10 000 → 20 000 → 50 000 → 100 000 → 200 000 → 500 000 → 1 000 000 → 2 000 000…
  - Espacement entre ×2 et ×2,5 ; pas de micro-pas même à grande échelle.
  - Un objectif manuel peut sortir de la suite si voulu.
  - Variante stricte 1-2-4-8 possible mais chiffres moins parlants → 1-2-5 par défaut.

## P6a — Recontact des signataires

- Le créateur·ice **peut** recontacter, mais **PAS via les outils de la plateforme** (aucun envoi depuis Maintenant!).
- Mécanisme : **téléchargement d'un CSV** contenant **exclusivement** les emails des personnes ayant coché la **case 1**. Exclusion stricte des non-consentants à ce canal.
- Au téléchargement, **case d'engagement obligatoire** : a lu et accepte les règles d'utilisation = usage **exclusivement réservé au suivi de la campagne**.
- Bénéfices : décharge la plateforme de la responsabilité d'envoi ; respecte le consentement granulaire ; responsabilise via engagement tracé.
- **Vigilance RGPD / code** : journaliser chaque export (qui, quand, quelle pétition) dans `journal_admin`.

## P6b — Création et clôture

- **Création** réservée aux comptes (formulaire utilisateur obligatoire). Créateur·ice toujours identifié. À distinguer de la **signature** (possible sans compte).
- **Clôture** : pétition **ouverte par défaut**, sans expiration automatique. Fermeture par (a) le créateur·ice, (b) un·e admin.
- Pétition fermée = **visible en lecture** (texte, total, historique) mais **signature désactivée**. Pas de suppression : **archive permanente**.

---

## Récapitulatif des implications techniques

- File de modération + actions valider/refuser ; motif facultatif ; notifications activables.
- Tunnel de signature : 2 cases RGPD facultatives, champ téléphone optionnel « (pour agir avec nous) », création silencieuse du profil unifié, comptage immédiat, email de confirmation, proposition d'adhésion.
- **Turnstile obligatoire** sur signature.
- Booléen durable « confirmé au moins une fois » au niveau profil.
- Moteur de paliers : suite 1-2-5, bascule à 90 %, override manuel.
- Export CSV consentants case 1 + case d'engagement + journalisation RGPD.
- Création réservée aux comptes ; clôture manuelle ; archive en lecture seule.
- Possibilité de créer **au nom d'une organisation** (voir organisations-V2.md).
