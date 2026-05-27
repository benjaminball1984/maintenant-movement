# Manifest — V2 Vague 3, Chantier V2.3.21 : Bouton « Signaler un litige » côté propriétaire

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-21-signaler-litige-proprietaire`
**Base** : `main` (tip `96eebf2`, V2.3.20)

---

## Livré et fonctionnel

Symétrique côté propriétaire d'offre du chantier V2.3.16. Le propriétaire peut désormais signaler un litige sur une réservation `acceptee` (cas : demandeur absent au RDV, comportement inapproprié, dégradation matérielle sur un prêt, etc.). Transition D8 `acceptee → litige`.

- [x] **`app/actions/reservation.ts` — `signalerLitigeProprietaireAction({reservationId, motif, cheminRevalidation?})`** : vérifie session, propriétaire de l'offre (`chargerReservationCommeProprietaire` V2.3.13), motif obligatoire 10-1000 caractères, transition autorisée par D8. Appelle `changerStatutReservation` avec `auteurId: session.userId` — journal D8bis automatique.
- [x] **`components/reservation/BoutonSignalerLitigeProprietaire.tsx`** : composant client UX 2 étapes (bouton ghost → encadré danger avec textarea + bouton de confirmation), aligné avec V2.3.16 (texte ajusté pour le contexte propriétaire).
- [x] **`components/reservation/BoutonsProprietaireReservation.tsx`** : intègre le nouveau bouton dans la branche `acceptee`, en dessous de « Marquer comme réalisée ». Les deux options coexistent visuellement pour permettre soit de clore positivement (marquer réalisée), soit de signaler un problème.

## Non livré (et pourquoi)

- [ ] **Factorisation `FormulaireSignalementLitige`** : `BoutonSignalerLitigeReservation` (V2.3.16) et `BoutonSignalerLitigeProprietaire` partagent 90 % du code. Pas factorisé maintenant — la duplication reste lisible et personnalisable (textes différents pour le contexte demandeur vs propriétaire). À factoriser si une 3ᵉ instance apparaît (par exemple côté admin pour signaler un litige observé).
- [ ] **Notif aux deux parties** : pareil que V2.3.16 — attend `notification` V2.
- [ ] **Bouton litige côté admin** : pas livré non plus. Si la modération observe un problème externe (signalement extérieur, plainte par mail), elle pourrait basculer une réservation en litige sans passer par les parties. Cas d'usage rare, à voir au besoin.

## Décisions techniques prises

- **Pas de factorisation prématurée** : avec 2 occurrences, la duplication coûte ~70 lignes. Le code se lit ; mieux que d'introduire une abstraction qui dérangera la 3ᵉ instance. Cohérent avec la doctrine projet (CLAUDE.md §1 sur l'élégance lisible).
- **Position du bouton** : sous « Marquer comme réalisée », pas avant. La voie « positive » reste prééminente visuellement, le litige est un fallback.
- **Réutilisation de `chargerReservationCommeProprietaire`** : helper V2.3.13 qui vérifie déjà la propriété + retourne le statut. Pas besoin de dupliquer.
- **Pas d'accès à l'admin via cette UI** : la transition `acceptee → litige` reste une action des parties (demandeur ou propriétaire). L'admin a sa propre Server Action `resoudreLitigeReservationAction` (V2.3.17) pour arbitrer ensuite.

## Écarts V1→V2 appliqués

- **Greffe additive pure** : pas de migration, pas de schéma touché.

## Tests

- **Unitaires (Vitest)** : 38 fichiers, **413 tests verts** (inchangés ; la transition `acceptee → litige` est déjà couverte par les tests V2.2.2).
- **Lint Biome** : 470 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.

## Notes pour les chantiers suivants

- **Factorisation à la 3ᵉ instance** : si on ajoute le signalement admin externe (cas évoqué plus haut), créer alors `components/reservation/FormulaireSignalementLitige.tsx` qui prend `action: (motif) => Promise<{ok, message?}>` en prop et délègue.
- **Symétrie D8 désormais complète** : demandeur peut signaler `realisee → litige` (V2.3.16), propriétaire peut signaler `acceptee → litige` (V2.3.21). Admin peut arbitrer `litige → confirmee | annulee` (V2.3.17). Tous les états sont navigables des deux côtés.
