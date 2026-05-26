# Cagnottes — Spécifications V2

> **Fichier** : cagnottes-V2.md
> **Version** : 1.0
> **Dernière mise à jour** : 2026-05-26
> **Session** : 2026-05-26 (CA1 + arbitrages d'argent)
> Sous-espace de Mobiliser. Collecte de dons vers un bénéficiaire.
> Signature : LIFE BENJAMIN BALL. Voir aussi principes-transversaux-V2.md.

---

## CA1 — Objectif et versement

- Modèle **« tout ce qui est collecté est gardé »**. **PAS de tout ou rien.**
- L'objectif est une **cible indicative** : peut être dépassé ou non atteint. Dans tous les cas, versement des fonds.
- Cohérent avec le **paiement direct** (l'argent va directement au bénéficiaire, la plateforme ne le détient jamais ; pas de pot commun à rembourser, donc pas de « tout ou rien » possible techniquement).

## Mécanique d'argent (cf. paiement unifié, transversal)

> **Périmètre de cette fiche** : cagnottes avec **bénéficiaire externe** (personne, association tierce) — donc **régime A** (paiement direct). Les **cagnottes solidaires** (collecte vers le mouvement, caisse par cagnotte) relèvent du **régime B** et sont décrites dans `schema-donnees-V2.md` §D7 ; elles feront l'objet d'un complément de fiche le moment venu.

- **Paiement DIRECT** donateur·ices → bénéficiaire (régime A). Maintenant! ne touche pas l'argent ici.
- Canaux : **99-coin** (redirection wallet The 99 Coin Project) OU **euros** (Stripe paiement direct, bénéficiaire en Connect/KYC). « 99-coin toujours proposé ».
- **Zone tampon abandonnée** (initialement envisagée puis écartée le 26/05 pour supprimer le risque juridique d'intermédiation financière).
- Zéro prélèvement plateforme.
- **Friction assumée** : le porteur de cagnotte doit configurer Stripe Connect (KYC, coordonnées bancaires) AVANT de pouvoir recevoir des euros. Pas de cagnotte lancée « en deux secondes » côté euros.

## Transparence et fin de vie

- La cagnotte **existe même fermée** (archive permanente).
- **Devoir de transparence** : rendre compte de l'usage de l'argent via le **mini-blog** de la cagnotte (« voilà comment on a utilisé les fonds »).

## Mini-blog (cf. principes §7)

- Onglet « actualités » : le porteur poste des nouvelles, des suivis, le bilan d'usage des fonds.
- Articles → alimentent le vivier du média (éditorialisation par l'équipe média).

## Back-office (cf. principes §9-10)

- Délégation granulaire (ex. déléguer l'écriture d'articles sans déléguer la gestion des fonds).
- Intégration ascendante dans une campagne.
- Partage (3 entrées + métadonnées OG : image/titre/description).

## Création au nom d'une organisation

- Possible (cf. organisations-V2.md) : mandat obligatoire, multi-mandataires.

---

## Implications techniques

- Paiement direct (réutilise le module de paiement unifié) ; pas de compte de cantonnement.
- Compteur de progression vers objectif (indicatif), sans blocage si non atteint.
- KYC Stripe Connect côté porteur préalable à la collecte en euros.
- Mini-blog + back-office standardisé + partage avec métadonnées OG.
- Archive permanente + obligation d'un bilan d'usage (mini-blog).

## Questions encore ouvertes (à traiter en détail plus tard)

- Anonymat des dons (afficher ou non le nom des donateur·ices ; montant visible ou non).
- Durée d'une cagnotte (limite ou ouverte) — par cohérence avec les pétitions, probablement ouverte + fermeture manuelle.
- Qui peut fermer (porteur + admin ?).
- Que se passe-t-il pour le bénéficiaire d'une cagnotte créée au nom d'une organisation.
