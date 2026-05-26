# Transport / Covoiturage — Spécifications V2

> **Fichier** : transport-V2.md
> **Version** : 1.0
> **Dernière mise à jour** : 2026-05-26
> **Session** : 2026-05-26 (T1-T2 + covoit'groupe)
> Sous-espace de S'entraider. Voir aussi principes-transversaux-V2.md.
> Signature : LIFE BENJAMIN BALL.

---

## T1 — Covoiturage classique (vitrine)

- Calqué sur **BlaBlaCar** EN APPARENCE (familier). C'est le cas MIS EN AVANT.
- Couvre : trajet unique vers une manif ; trajets réguliers ; entre particuliers.
- Paiement direct, **99-coin OU euros** (choix du passager), zéro prélèvement.
- Réutilise : système de réservation, message d'amorce, paiement unifié.

## Covoiturage de groupe — « Covoit'groupe » (inspiré CovoiTribu)

- Fonctionnalité distincte du covoiturage individuel. Modèle « doodle du covoiturage de groupe » (réf. covoitribu.fr).
- Principe : créer un groupe avec objectif (« X personnes à covoiturer de A à B », + retour B→A possiblement par d'autres conducteurs). Participants se placent (conducteur/passager). **Composition des voitures visible en UN point unique** (pas de recherche dispersée).
- **Règle de paiement COMMUNE au groupe**, décidée collectivement (gratuit pour tous / frais partagés…), pas fixée par chaque conducteur.
- Groupe **éphémère** (événement) ou **régulier** (ex. trajets scouts).
- Cas type : scouts (parents emmènent les jeunes ; gestion aller/retour ; nb de jeunes/voiture ; tout au même endroit).
- **JUSTIFICATION STRATÉGIQUE (amorçage)** : résout l'œuf-et-la-poule d'une plateforme vide. Un groupe constitué arrive avec son pool de demandeurs ET de proposeurs → utile dès le lancement → puis les habitués proposent d'autres trajets → remplissage → covoiturage ouvert grand public à terme. Porte d'entrée vers le covoiturage individuel.

## T2 — Transport de matériel + hiérarchie

- **Transport de matériel** possible (places de coffre : matériel d'action, dons, denrées). NON mis en avant.
- **Hiérarchie d'affichage** (cf. principes §15) : vitrine = covoiturage individuel façon BlaBlaCar ; covoit'groupe, transport matériel, location mutualisée = autres onglets, moins proéminents.

## Location mutualisée (cf. principes §12)

- **Bus, car, minibus** : un organisateur loue auprès d'un prestataire externe, met le prix, les gens remplissent et paient leur part, l'argent va à l'organisateur qui paie le prestataire. Départ quand rempli.
- **Paiement EXCLUSIVEMENT en euros** (facture externe réelle ; 99-coin non convertible → organisateur piégé sinon).
- ⚠️ Responsabilité de l'organisateur (tampon) — avertissement clair ; à valider Légicoop.

## Statut membres (cf. principes §13)

- Covoiturage = service entre membres (assurance + fiscal).

---

## Implications techniques

- Réutilise réservation + message d'amorce + paiement unifié.
- Covoit'groupe : composant spécifique (groupe, objectif, placement dans voitures, vue unique, règle de paiement commune, aller/retour, éphémère/régulier).
- Transport de matériel : variante du covoiturage.
- Location mutualisée : composant transversal (euros only).
