# Marché solidaire — Spécifications V2

> **Fichier** : marche-solidaire-V2.md
> **Version** : 1.0
> **Dernière mise à jour** : 2026-05-26
> **Session** : 2026-05-26
> Sous-espace de S'entraider. Voir aussi principes-transversaux-V2.md.
> Signature : LIFE BENJAMIN BALL.

---

## Base

- Paiement : gratuit / 99-coin / euros.
- Remise en main propre OU **envoi** (la livraison existe ici, contrairement au prêt).
- Deux formats : **article seul** ou **boutique** (agrège des articles + mini-blog).

## Boutique

- Création / agencement / mise à jour (image d'en-tête, lots, regroupement d'articles, mini-blog qui parle des articles, des nouveautés, ou du sujet en général).
- **Préfiguration** : poster un simple article crée déjà une boutique en germe (pas besoin de la créer formellement avant) ; configurable à tout moment.
- Les organisations peuvent tenir une boutique (cf. profils d'organisation, mandataires).

## Frais de port

- **Crypto** : payés en **POL** (Polygon natif), PAS en T99CP (dépense réelle). POL au taux de conversion du moment. Risque de change minime (POL stable + petites sommes).
- Pas de friction nouvelle : tout utilisateur 99-coin a déjà du POL (frais de gaz obligatoires pour toute transaction). Alerte UX « prévoir du POL » (sert au gaz ET aux frais de port).
- **Euros** : frais de port payés en euros via Stripe.
- Intérêt stratégique : utiliser du POL soutient le réseau Polygon (socle du 99-coin) → durabilité.

## Commission et TVA

- **Pas de commission Maintenant!** (paiement direct). Commission Stripe prise par Stripe sur le vendeur.
- **TVA** : ce n'est pas Maintenant! qui vend (paiement direct → vendeur) → responsabilité fiscale du VENDEUR. Franchise en base 2026 : 85 000 € (biens) / 37 500 € (services) → quasi tous les vendeurs sous le seuil = pas de TVA. Exonération asso « ventes accessoires aux membres < 10 % des recettes ». Au lancement : la plateforme ne gère pas la TVA elle-même ; prévoir un avertissement aux vendeurs réguliers. À valider Légicoop.

## Catégories et anti-saturation

- **Moins de catégories que LeBonCoin**, rangement soigné façon « vintage » (pas fouillis).
- **Anti-saturation vêtements** : à l'affichage par défaut (produits autour de soi sans recherche), les fringues doivent être MINORITAIRES → montrer de la diversité (objets, créations, alimentation…), éviter le « mur de t-shirts » qui fait croire que la plateforme est pauvre. Curation de la première impression.

## Réutilise

- Mini-blog, paiement unifié, message d'amorce, avis (notation 5 étoiles), partage + métadonnées OG, image par défaut, profils d'organisation, recherche carte/périmètre.
