# Manifest — V2 Vague 3, Chantier V2.3.3 : Location mutualisée (§12)

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-3-location-mutualisee`
**Base** : `main` (tip `4be2c67`, V2.3.2)
**Fiche source** : §12 de `docs/cdc-v2/CDC-Maintenant-V2/principes-transversaux-V2.md`

---

## Livré et fonctionnel

V2.3.3 pose le **socle technique** (schéma + helpers + tests) de la location mutualisée. **L'UI complète (formulaire création + page détail + paiement Stripe) est volontairement reportée** à un chantier V2 ultérieur — V2.3.3 livre les fondations indispensables pour que la UI puisse être construite en confiance.

- [x] **Migration `supabase/migrations/20260527070000_location_mutualisee.sql`** :
  - Table `location_mutualisee` : id, slug, organisateur, type_location (CHECK liste fermée 6 valeurs : transport_bus/car/minibus, hebergement_salle/lieu, autre), titre, description, prestataire texte libre, lieu, dates (CHECK `limite ≤ evenement`), économie en CENTIMES (montant_total, nb_parts_max ≤ 1000, prix_par_part), **canal forcé à `'euro'` par CHECK** (§12 : pas de 99-coin), statut (collecte_en_cours/validee/annulee/realisee), image_url, **`avertissement_juridique_accepte` obligatoirement `true` par CHECK SQL** (D12bis-style garde-fou : la BDD refuse une location sans acceptation).
  - Table `engagement_location_mutualisee` : (location, participant, nb_parts ≤ 100, montant en centimes, statut engage/paye/annule, Stripe PaymentIntent id, dates engage/paye/annule). CHECK de cohérence dates × statut. Index unique partiel : « un seul engagement actif par (location, participant) ».
  - Triggers `updated_at`.
  - **8 policies RLS** dans la migration : lecture publique des locations actives, insertion par l'organisateur authentifié (statut forcé à `collecte_en_cours` + avertissement accepté), mise à jour organisateur + admin, engagements visibles par participant + organisateur + admin.
- [x] **`lib/location-mutualisee-validation.ts`** : schémas Zod `creerLocationMutualiseeSchema` (avec 2 `refine` : cohérence dates + capacité ≥ montant cible) et `engagementLocationSchema`. Helpers purs `slugifierTitreLocation` (gestion diacritiques `\p{Mn}`), `slugValide`, `montantAttenduEngagement`.
- [x] **`lib/location-mutualisee.ts`** : helpers de requête `listerLocationsMutualisees`, `locationMutualiseeParSlug`, `compterPartsEngagees`, `listerEngagementsLocation`, `engagementActifDuParticipant`. Types stricts `TypeLocation`, `StatutLocation`, `StatutEngagement`, `LocationMutualisee`, `EngagementLocation`.
- [x] **`types/database.ts`** : 2 nouvelles définitions (`location_mutualisee`, `engagement_location_mutualisee`) avec Relationships.
- [x] **Tests unitaires** `tests/unit/location-mutualisee/validation.test.ts` — **13 tests** sur :
  - Acceptation locations valides.
  - Refus si avertissement juridique non accepté (Z2.boolean.refine).
  - Refus si date limite > date événement.
  - Acceptation date limite = date événement.
  - Refus si capacité × prix < montant total.
  - Refus si nb_parts_max > 1000.
  - Refus titre trop court.
  - Refus type_location hors liste.
  - Tests `engagementLocationSchema` (nb_parts entre 1 et 100).
  - Tests `slugifierTitreLocation` et `montantAttenduEngagement`.

## Livré partiellement

- [ ] **UI complète** : aucune page créée. Ce qui reste à construire dans un chantier UX dédié (V2.3.7 ou plus tard) :
  - `/s-entraider/location-mutualisee/page.tsx` : liste des locations actives avec jauge de collecte.
  - `/s-entraider/location-mutualisee/nouvelle/page.tsx` : formulaire création avec l'avertissement juridique en gros, à cocher.
  - `/s-entraider/location-mutualisee/[slug]/page.tsx` : détail avec bouton « M'engager pour N parts » + jauge + liste des engagements visibles (anonymisée pour les non-organisateurs).
- [ ] **Server Actions** : `creerLocationMutualisee`, `engagerParts`, `annulerEngagement`, `validerLocation`, `marquerRealisee`. Non écrites. La RLS est prête, les helpers de requête aussi.
- [ ] **Intégration Stripe** : le champ `stripe_payment_intent_id` attend une connexion à `lib/payments/StripePaymentService.ts`. Le PaymentIntent doit aller au compte Stripe **de l'organisateur** (pas de la plateforme — l'argent ne passe pas par la plateforme, §12). Demande probablement Stripe Connect côté organisateur, comme pour les cagnottes.
- [ ] **Page « Mes locations » côté profil** : liste des locations dont la personne est organisatrice + celles où elle est engagée. Pas livrée.

## Non livré (et pourquoi)

- [ ] **Migration appliquée au distant** : consigne, à faire au matin.
- [ ] **Avertissement juridique : texte exact** : le CHECK SQL refuse une location sans `avertissement_juridique_accepte = true`. Côté UI, il faudra un texte juridique sobre et explicite à valider avec Légicoop. **Contenu à arbitrer** avec Lilou/Ben + Légicoop.

## Contenus à arbitrer

- [ ] **Texte de l'avertissement juridique pour l'organisateur**. Doit expliquer en français clair que :
  - L'organisateur fait « tampon » : il collecte de l'argent qu'il reverse au prestataire externe.
  - Sa responsabilité personnelle est engagée si le prestataire ne livre pas, ou en cas de litige.
  - Maintenant! ne s'interpose pas dans le contrat avec le prestataire.
  - À valider avec Légicoop avant publication.

## Décisions techniques prises

- **Montants en centimes (int)** plutôt qu'en `numeric(14, 2)` : convention Stripe (PaymentIntent.amount est un int en centimes). Évite tous les pièges d'arrondi du décimal.
- **Canal forcé `'euro'` par CHECK SQL** : aucune migration future ne peut accidentellement permettre du 99-coin (§12 : l'organisateur serait piégé car non convertible en fiat).
- **Avertissement juridique en CHECK** : pour garantir qu'AUCUNE location ne peut être créée sans acceptation, même en passant directement par `service_role`. Garde-fou DBSP-style.
- **Pas de FK vers `prestataire`** : champ texte libre. Maintenir une table de prestataires serait du sur-engineering pour un cas où le prestataire change à chaque location.

## Écarts V1→V2 appliqués

- **Nouvelle entité V2 sans pendant V1** : greffe additive pure. Aucune table V1 touchée.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (+13 nouveaux).
- **Lint Biome** : 451 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur (fix `z.literal(true)` → `z.boolean().refine`).
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Application au matin** : `20260527070000_location_mutualisee.sql` à pousser.
- **UI à construire** dans un chantier UX dédié avec contenus arbitrés (texte de l'avertissement juridique, microcopies de la jauge, etc.).
- **Stripe Connect côté organisateur** : si on veut que les paiements arrivent directement sur le compte de l'organisateur (et non pas sur le compte plateforme), il faut activer Stripe Connect. Demande un flow d'onboarding KYC pour l'organisateur AVANT qu'il crée sa première location. Étape juridique et technique non triviale.
