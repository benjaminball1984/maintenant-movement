# Principes transversaux — Spécifications V2

> **Fichier** : principes-transversaux-V2.md
> **Version** : 3.2
> **Dernière mise à jour** : 2026-05-26
> **Sessions** : 2026-05-25 + 2026-05-26
> Document chapeau : ces principes traversent TOUS les sous-espaces. À LIRE EN PREMIER (y compris par Claude Code).
> Signature : LIFE BENJAMIN BALL.

---

## Historique des versions

- **v1.0** (26/05 matin) : intention commun, deux logiques de pouvoir, paiement unifié, espace agrégateur, fork, cartographie 2 sources, identifiants, modération.
- **v2.0** (26/05) : rattachements multiples + double consentement, deux réseaux sociaux, mini-blog, délégation granulaire, intégration ascendante, partage + métadonnées OG, back-office standardisé.
- **v3.0** (26/05) : image par défaut, message d'amorce, location mutualisée, statut « membres non actifs », ergonomie vitrine/options, Légicoop.
- **v3.1** (26/05) : fil de discussion de groupe, alerte « supprimer wallet intégré », redirection 99-coin vers home, affichage solde, groupe d'entraide local.
- **v3.2** (26/05 après-midi) : §1 enrichi (cooptation auto-perpétuante + analogie administration/législatif, modèle interne non exposé). Ajout points Légicoop : fiche méthodo sondages RGPD-compatible, service impression-livraison affiches (don, pas vente).

---

## 0. Intention directrice — un commun pour tous les mouvements sociaux

Au-delà de Maintenant!, la plateforme est un **service rendu à l'ensemble du champ des mouvements sociaux**. Cohérent avec la licence **AGPL-3.0** et la doctrine de Lilou sur la création/propriété comme commun reconnu par l'usage. **Boussole** : privilégier ce qui rend l'outil réutilisable et généralisable par d'autres collectifs.

---

## 1. Deux logiques de pouvoir

1. **MOUVEMENT et instances** = **délégation démocratique** (mandat, vote — cf. Décider). Autodéterminé par les gens qui participent dans les espaces, via fédération/confédération.
2. **PLATEFORME** (technique, modération, admin, rédaction média) = **cooptation**. Une équipe fondatrice préexistante (Lilou + proches) coopte pour remplir tous les espaces, y compris parmi membres et utilisateurs. Mécanisme **auto-perpétuant** : les coopté·es coopteront à leur tour, le système survit au départ des fondateur·ices.

**Analogie de référence (modèle mental interne, NON exposé aux utilisateurs)** : la plateforme est une **administration** sous l'égide d'un pouvoir législatif (le mouvement). L'administration fait tourner la machine ; le législatif ne peut révoquer personne. Le pouvoir de plateforme **n'ouvre AUCUN droit politique** : pas de vote en assemblée, pas de droit spécifique dans Décider. C'est du **support technique**, point. On ne l'explicite pas au public (inutile), mais c'est la règle d'architecture des droits.

**Corollaire** : *le code offre la capacité, l'équipe choisit l'usage.*

---

## 2. Paiement unifié — deux régimes (A direct / B collecte)

> **Correction du 26/05 soir** : la formulation initiale « Maintenant! ne touche JAMAIS l'argent » était fausse. Elle est vraie pour les **échanges entre personnes** (régime A), fausse pour les **contributions au mouvement** (régime B). Cf. `schema-donnees-V2.md` D7.

- **Régime A — Paiement DIRECT entre personnes.** Maintenant! ne transite rien. Cas couvrant : covoiturage, hébergement, SEL, prêt, marché solidaire, cagnottes avec bénéficiaire externe. L'argent va du payeur au bénéficiaire.
- **Régime B — Collecte vers le mouvement.** L'argent arrive bien à Maintenant!, dans une **Caisse dédiée** (D7). Cas couvrant : adhésions, cotisations, dons généraux, appels à contribution, **cagnottes solidaires** (une caisse par cagnotte). Aujourd'hui : compte Stripe existant. Demain : compte officiel de l'association ; côté 99-coin, wallet de réception dédié par caisse.
- Deux canaux dans les deux régimes : **99-coin** (redirection wallet The 99 Coin Project, hash vérifié en lecture sur Polygon ; **aucun wallet intégré côté plateforme** — cf. §19) ; **euros** (Stripe ; paiement direct en régime A via Connect/KYC côté bénéficiaire ; compte plateforme/association en régime B).
- **« 99-coin toujours proposé, jamais euro exclusif »**. Tout-euro = lien vers boutique extérieure.
- **EXCEPTION : location mutualisée** (voir §12) = euros exclusivement, organisateur fait tampon.
- Conséquences : régime A → zéro coût/prélèvement, zéro risque juridique de transit, friction KYC côté bénéficiaire. Régime B → comptabilité interne (caisses + réceptacles datés + transactions sortantes avec justificatif obligatoire, D7/D12).

---

## 3. Espace agrégateur universel

- **Tous les espaces** (commune, campagne, fédération, confédération, GT, organisation) créent/contiennent **TOUS les objets du site**.
- Composant unique réutilisé (DRY), **nativement extensible**. Un espace **référence** des objets autonomes (pas de possession exclusive). Ne jamais présumer qu'un objet est « hors sujet ».

---

## 4. FORK + rattachements multiples à double consentement

- Un espace peut **se détacher et devenir autonome**, voire survivre à son parent.
- Espaces **PAS rattachés en dur** : existence autonome dès la création (identifiant, objets, membres). Rattachement = relation **souple, révisable, MULTIPLE** (graphe, pas arbre). Fork = couper un lien sans rien détruire.
- **DOUBLE CONSENTEMENT** : tout rattachement = accord des deux parties (demande + acceptation). Empêche le squat d'identité.
- Table many-to-many, statut par lien (demandé/accepté/refusé/retiré) + temporalité.

---

## 5. Cartographie à deux sources (MapLibre)

1. **Communes Maintenant!** = référentiel exhaustif (35 000+ coquilles, doctrine §7B).
2. **Campagne / espace non territorial** = peuplée **par l'usage uniquement** (pas de référentiel pré-rempli).

---

## 6. Deux réseaux sociaux complémentaires

1. **DES PERSONNES** (7.5 existant) : suivi, partage, messages. Sans pub ni algo caché.
2. **DES ESPACES** (émergent) : organisations/campagnes/communes/groupes qui se rattachent/invitent/relaient. Cartographie vivante de la coopération militante.

*S'organiser EST social, être social SERT à s'organiser.*

---

## 7. Mini-blog partout

- Onglet « actualités » sur presque tout objet/espace (pétition, cagnotte, boutique, organisation, campagne, commune, GT…).
- Articles produits → **alimentent le vivier du média**. Produire décentralisé / publier dans le journal éditorialisé (sélection média).
- Écriture réservée au créateur·ice + mandataires (cf. §9). Composant réutilisable (DRY).

---

## 8. Modération — trois régimes

- **A priori** (pétitions) ; **a posteriori** (mobilisations, hébergement, etc.) ; **éditoriale** (articles/médias : valeurs + place + équilibres thématiques). Équipes = cooptation.

---

## 9. Back-office standardisé par objet

- **Délégation granulaire** : droits précis par cases à cocher (écrire articles / modifier objet / télécharger fichier… indépendants).
- **Intégration ascendante** : bouton discret « intégrer dans une campagne » (crée la campagne avec l'objet préinscrit si besoin). Navigation bidirectionnelle.
- **Partage** (cf. §10), proéminent.

---

## 10. Partage et métadonnées Open Graph (POINT DUR)

Trois entrées : (1) message interne ; (2) réseau social Maintenant! ; (3) extérieur (sous-menu WhatsApp/Telegram/Facebook/X/Mastodon/mail…).

- **SORTANT** : métadonnées OG (titre + description + IMAGE) générées CÔTÉ SERVEUR sur chaque page partageable (piège Next.js : robots OG ne lisent pas le JS). Sinon partage moche = zéro clic.
- **ENTRANT** : lecture des OG des liens partagés dans le fil interne pour bel aperçu.
- **À TESTER réellement** (aperçu WhatsApp/Facebook/X) avant lancement.

---

## 11. Image par défaut systématique (lié à §10)

- Tout objet partageable a TOUJOURS une image. Si le créateur n'en met pas → **image par défaut**.
- Images par défaut : **libres de droit** (banques d'images) ; **génériques par TYPE d'objet** (une image « article », une « pétition », une « vente marché », un « événement »… pas spécifique au contenu) ; **vraies images, PAS des pictos**.
- Deux niveaux : défaut (toujours là) + personnalisée (upload, remplace). Constituer une bibliothèque d'images libres de droit par type d'objet (curation admin).
- Raison : objet sans image = aperçu vide = perte massive de diffusion.

---

## 12. Location mutualisée (mécanisme transversal)

- Distinct du covoiturage/hébergement classiques. Un organisateur engage la location d'un bien collectif (bus, car, minibus, salle, lieu) auprès d'un **prestataire externe** ; met le prix ; les participants paient leur part ; départ/validation quand rempli/financé.
- L'argent va à l'**organisateur**, qui paie le prestataire. La plateforme ne loue rien.
- **Paiement EXCLUSIVEMENT en euros** (facture externe réelle à honorer ; 99-coin non convertible en fiat aujourd'hui → organisateur piégé sinon).
- Applications : transport (bus/car/minibus), hébergement (salle/lieu). Composant réutilisable.
- ⚠️ JURIDIQUE : l'organisateur fait « tampon » (collecte pour payer un tiers) → responsabilité réelle (avertissement clair à l'organisateur). À valider avec Légicoop.

---

## 13. Statut des utilisateurs — membres non actifs (juridique structurant)

Trois niveaux : (1) **profil silencieux** (signataire/participant sans compte) ; (2) **membre non actif** (compte + acceptation CG → membre de l'association SANS droit de vote) ; (3) **membre actif** (a cliqué « devenir membre » → vote, tirage au sort).

- Intérêt « membre non actif » : qualifie les échanges comme **services entre membres** → assurance entre membres + cadre fiscal favorable.
- CG : expliquer TRÈS clairement la finalité (assurance + services entre membres) et que c'est un statut TECHNIQUE/JURIDIQUE, PAS un engagement politique.
- **Compteur public** : ne compte QUE les membres actifs (pas de gonflage).
- ⚠️ À valider avec **Légicoop** : « accepter CG = devenir membre » solide ? conditions du cadre fiscal ? suppose l'association créée (aujourd'hui simple collectif).
- Posture : si requalification commerciale → mise en conformité, pas de contournement.

---

## 14. Message d'amorce (mise en relation)

- Partout où il y a mise en relation (réservation, demande de service, achat : hébergement, transport, SEL, prêt, marché…), le premier contact s'amorce par un **message pré-rempli mais personnalisable** dans la messagerie interne (structure auto-générée — dates, nb de personnes… — + champ libre). Raison : un champ vide intimide ; l'amorce rassure et accélère. Composant réutilisable.

---

## 15. Ergonomie : vitrine + options

- Mettre en avant le **cas le plus simple et universel** (ex. hébergement intérieur+ponctuel ; covoiturage individuel façon BlaBlaCar). Les cas spécialisés (extérieur, temps long, collectif, covoit'groupe, transport matériel, location mutualisée) sont **accessibles mais discrets** (autres onglets). Ne pas cacher, ne pas noyer.

---

## 16. Pas de suggestion par simple proximité géographique

- La proximité géographique n'implique pas l'affinité politique (ex. ne pas pousser une manif végane à un paysan hébergé à côté). Croisements/suggestions toujours justifiés par une intention (ex. une campagne montre SES hébergements), jamais par la seule proximité. Cohérent avec le refus des algos cachés.

---

## 17. Identifiants de profils

8 caractères : **Individu = M + 7** (26⁷ ≈ 8 Md) ; **Organisation = ORM + 5** (26⁵ ≈ 11,9 M). ORM évite « OM ». Détails : organisations-V2.md.

---

## 18. Fil de discussion de groupe (composant transversal)

- Distinct de la messagerie individuelle (DM un à un). TOUT groupe/espace (commune, campagne, GT, groupe d'entraide, groupe de prêt, covoit'groupe…) dispose d'un **fil de discussion commun** : conversation collective, partage de liens, coordination. Sans lui, un groupe ne peut pas vraiment vivre. Le système de messagerie a donc deux modes : individuel (DM) et collectif (fil de groupe).

## 19. 99-coin : géré entièrement à l'extérieur (alerte)

- **AUCUN wallet intégré** dans la plateforme. ⚠️ La plateforme actuelle contient des bouts de wallet intégré → À RETIRER entièrement (alerte pour Claude Code).
- Paiement : lien → nouvelle fenêtre sur la **home** `https://the99coinproject.org/` (toujours la home, jamais d'URL profonde — sécurité : reconnexion wallet). Import de wallet non-custodial possible.
- Vérification au retour (lecture Polygon) : hash existe + bon montant + **hash unique** (refuser un hash déjà consommé).
- Solde affichable au profil (lecture Polygon), visible par l'utilisateur seul, token T99CP uniquement, en 99-coin et en équivalent temps. Ne pas exposer l'adresse `0x...` publiquement.
- Afficher montant + adresse AVANT redirection (pas de pré-remplissage possible).

## Composants réutilisables à dégager (synthèse Claude Code)

1. Espace agrégateur. 2. Mini-blog. 3. Système de rattachement (graphe, double consentement, fork). 4. Back-office standardisé. 5. Module de partage + métadonnées OG. 6. Module de paiement unifié. 7. Cartographie 2 sources. 8. Message d'amorce. 9. Location mutualisée. 10. Système de réservation (calendrier dispo, façon Airbnb/BlaBlaCar). 11. Image par défaut + bibliothèque. 12. Fil de discussion de groupe. 13. Groupe d'objectif mutualisé (covoit'groupe, groupe de prêt). 14. Espace agrégateur à familles d'outils activables (commune/campagne/groupe d'entraide…).

Peu de concepts, recombinés partout : puissance + maintenabilité.

---

## Liste des points à valider avec Légicoop (juridique)

- Statut « membres non actifs » (CG = adhésion) + assurance entre membres + fiscalité services entre membres.
- Location mutualisée (organisateur fait tampon).
- Marché solidaire / euros vers tiers (Stripe Connect, seuils de requalification commerciale).
- Création de l'association (aujourd'hui simple collectif).
