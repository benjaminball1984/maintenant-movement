# Manifest — V2 Vague 3, Chantier V2.3.5 : Réservation sur offres entraide + SEL

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-5-reservation-offres`
**Base** : `main` (tip `e0d18e8`, V2.3.4)

---

## Livré et fonctionnel

Branche le **composant transversal `Réservation` (V2.2.2)** aux pages de détail des offres existantes. Cycle V2 D8 + §14.

- [x] **Server Action `creerReservationAction`** (`app/actions/reservation.ts`) : valide la session, le créneau (début dans le futur, fin ≥ début), la quantité, l'existence de l'offre, le fait que l'appelant ne soit pas le créateur (pas d'auto-réservation). Génère le message d'amorce via `lib/reservation-amorce.ts` (avec prénom du demandeur + titre de l'offre). Appelle `lib/reservation.ts:creerReservation`. Revalidation du chemin.
- [x] **Helper interne `chargerContexteOffre`** : FK polymorphe selon `offreType`, route vers la bonne table (offre_entraide / service_sel / location_mutualisee). Extrait titre + créateur pour le message d'amorce et la vérification anti-auto-réservation.
- [x] **Composant `BoutonReserverOffre`** (`components/reservation/BoutonReserverOffre.tsx`) : Client Component avec :
  - État « non connecté » → bouton « Se connecter pour réserver ».
  - État « créateur » → message « C'est ton offre… ».
  - État initial → bouton primaire « Demander une réservation ».
  - État ouvert → formulaire (date début, date fin optionnelle, quantité 1-100, note libre).
  - État succès → bandeau de confirmation.
  - Gestion erreur via Alert.
- [x] **Branchement sur 2 pages détail** :
  - `app/(public)/s-entraider/offre/[slug]/page.tsx` : pour les offres transport (covoit) / hébergement / prêt. Mapping fin de `offre.type` vers `OffreTypeReservation`.
  - `app/(public)/s-entraider/sel/[slug]/page.tsx` : pour les services SEL. Texte « Comment ça marche » actualisé pour annoncer la réservation V2.

## Livré partiellement

- [ ] **Page détail location mutualisée** : pas livrée en V2.3.3 (socle backend uniquement). Quand la UI viendra, brancher `<BoutonReserverOffre offreType="location_mutualisee" />`.
- [ ] **Calendrier graphique** : pour l'instant `<input type="datetime-local">` natif. Une vue calendrier visuelle (façon Airbnb) demande un composant dédié — chantier UX V2 ultérieur.
- [ ] **Envoi réel du message d'amorce dans la messagerie interne** : la `messageAmorce` est stockée dans la ligne `reservation` mais aucun `message_reseau` n'est créé automatiquement. À brancher quand la messagerie V2 sera consolidée.
- [ ] **Acceptation/refus côté propriétaire de l'offre** : la UI n'expose pas encore le tableau de bord des réservations reçues. Le helper `listerReservationsParOffre` est posé en V2.2.2 ; la UI vient dans un chantier dédié.

## Décisions techniques prises

- **`offre.type === 'pret_objet'` → `OffreTypeReservation: 'pret'`** : l'enum interne de la V1 utilise `pret_objet`, l'enum V2 du composant `Réservation` utilise `pret`. Mapping explicit côté Server Action et page.
- **Anti-auto-réservation côté Server Action** : refuse explicitement `createurId === session.userId`. Pas dans la RLS (la RLS ne sait pas faire de sous-relation polymorphe), mais en première ligne applicative.
- **Pas de validation `date_debut < date_fin` plus stricte** : la migration V2.2.2 a déjà un CHECK SQL `creneau_fin IS NULL OR creneau_fin >= creneau_debut`. La Server Action duplique en TS pour un retour d'erreur lisible.

## Écarts V1→V2 appliqués

- **Mise en relation par email caché → réservation structurée** : avant V2.3.5, la page offre disait « Crée un compte pour pouvoir contacter directement les auteur·ices (la mise en relation sera activée avec la messagerie interne) ». Désormais, le bouton de réservation crée une ligne dans `reservation` qui sera consommée par la future messagerie interne. Aucune donnée perdue, pattern progressif.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (pas de nouveau test — le helper `genererMessageAmorce` était déjà couvert en V2.2.2, idem `transitionAutorisee`).
- **Lint Biome** : 454 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Brancher la création d'un `message_reseau`** dans la Server Action : après création de la réservation, créer un message dans la messagerie interne du créateur avec le contenu `message_amorce`. Demande de coordonner avec la table `message_reseau` (V1 chantier 7.5).
- **Dashboard « Mes réservations »** côté profil : 2 onglets « En tant que demandeur » et « En tant que propriétaire d'offre ».
- **Acceptation/refus côté propriétaire** : Server Action `changerStatutReservation` (helper existe déjà) + composant UI dans le dashboard.
- **Filtrage des offres disponibles** : exclure les offres déjà réservées sur le créneau demandé (chantier UX V2).
