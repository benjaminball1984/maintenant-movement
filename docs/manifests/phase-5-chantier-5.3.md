# Manifest : Phase 5, Chantier 5.3 — Moments solidaires (8 types + porte-à-porte 7 RDV + tracker Tupperwares)

**Date de fin** : 2026-05-20
**Branche** : `feature/phase-5-chantier-5.3-moments`
**Commit final** : `43ac44d`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migration 029)

- [x] **Table `moment_solidaire`** : polymorphe via `type` (8 valeurs : porte_a_porte, maraude, vide_grenier_solidaire, soutien, manifestation, rencontre, concert_solidaire, repas_solidaire). `sous_type` + `parent_id` pour modéliser les 7 RDV enfants du porte-à-porte. Plage temporelle (`commence_le` obligatoire, `termine_le` optionnel). Géolocalisation, capacité maximale, cause locale en texte libre v1, métadonnées `jsonb`. Statut `annonce | en_cours | termine | annule | retire`. RLS modération a posteriori.
- [x] **Table `participation_moment`** : pattern identique à `participation_mobilisation` 3.2. Anonyme ou connectée, UNIQUE par couple (moment, personne). Lecture réservée à l'organisateurice + admin (coordonnées personnelles).
- [x] **Table `tupperware`** : tracker des Tupperwares à ramener (boucle d'engagement par dette légère, cf. spec §7C). Statuts `emporte | rendu | perdu`. Lecture réservée à l'organisateurice + admin.

### Code applicatif

- [x] **Types Database** : `MomentSolidaire`, `ParticipationMoment`, `Tupperware`, unions `TypeMomentSolidaire | StatutMomentSolidaire | StatutTupperware | SousTypeMomentPaP`.
- [x] **Config centralisée** (`lib/moments/config.ts`) : `TYPES_MOMENTS` (catalogue des 8 types), `SEPT_RDV` (les 7 sous-types du porte-à-porte avec leurs décalages en jours), `gabaritFlyerPortAPorte` (générateur de texte SANS écriture inclusive — cf. spec §7C « Flyer SANS écriture inclusive (accessibilité tactique) »).
- [x] **Validations Zod** (`lib/validations/moments.ts`) : `creerMomentSolidaire` avec refinement géo + dates cohérentes, `participerMoment` (anonyme OK), `ajouterTupperware`, `marquerTupperwareRendu`.
- [x] **Server Actions** (`app/(public)/agir/moments-solidaires/actions.ts`) :
  - `creerMomentSolidaire` : vérifie `est_membre_commune` si une commune est précisée (cf. spec §7C « organiser = membre de la commune territoriale »). Génère automatiquement les 7 RDV enfants quand `type = 'porte_a_porte'` en utilisant les décalages de `SEPT_RDV`.
  - `participerMoment` : anonyme OK ; UNIQUE en BDD empêche le double-engagement d'une même personne connectée.
  - `ajouterTupperware`, `marquerTupperwareRendu` : réservés à l'organisateurice (RLS).
- [x] **Couche de requêtes** (`lib/moments/requetes.ts`) : `listerMomentsSolidaires` (avec filtre type + flag `parentsSeulement`), `momentSolidaireParSlug`, `listerTupperwaresDuMoment`. Hydratation des personnes + comptage participations + chargement des RDV enfants en un seul passage.

### Composants

- [x] **`<CarteMomentSolidaire>`** : badge type + titre + accroche + date + lieu + compteur de participant·es + indication « Cycle de 7 RDV » pour les porte-à-porte.
- [x] **`<FormulaireCreationMoment>`** : 8 radios pour le type, alert info quand on choisit `porte_a_porte` (« 7 RDV générés automatiquement »), date/heure de début + fin optionnelle, cause locale en texte libre, capacité maximale optionnelle.
- [x] **`<BoutonParticiperMoment>`** : composant client avec champs prénom / email / téléphone optionnels + Turnstile. Note explicite que les coordonnées sont vues par l'organisateurice uniquement.

### Pages

- [x] **`/agir/moments-solidaires`** : liste avec onglets (Tous + 8 types). Bouton « Organiser » contextuel selon auth.
- [x] **`/agir/moments-solidaires/[slug]`** : fiche détail avec :
  - infos pratiques (date, lieu, capacité, participant·es) ;
  - description ;
  - sous-liste des 7 RDV enfants (pour les porte-à-porte parents) avec dates calculées ;
  - flyer généré sans écriture inclusive (visible pour les porte-à-porte) ;
  - bouton « Je participe » (visible pour les non-organisateurices) ;
  - tracker Tupperwares (visible pour l'organisateurice uniquement).
- [x] **`/agir/moments-solidaires/nouveau`** : auth requise, formulaire.

### Tests

- [x] **14 nouveaux tests unitaires** (`tests/unit/validations/moments.test.ts`) : 3 schémas Zod + structure `SEPT_RDV` (7 RDV, décalages croissants, J=0 au début) + catalogue `TYPES_MOMENTS` (8 types, un seul génère 7 RDV) + gabarit flyer (contient « Entrez dans nous », sans point médian). Total **226 tests verts** (+14).
- [x] **E2E Playwright** (`tests/e2e/moments-solidaires.spec.ts`) : 4 scénarios (liste, 9 onglets, redirection auth, 404).
- [x] **Lint Biome + typecheck tsc + build Next.js** : tous verts.

## Livré partiellement

- [ ] **Édition des Tupperwares (statut perdu, notes)** : la Server Action `marquerTupperwareRendu` est posée, l'UI pour ajouter un Tupperware ou le marquer « perdu » côté fiche moment n'a pas été exposée en v1. L'organisateurice voit la liste mais ne peut pas encore les modifier depuis l'UI publique. Sera complétée en polish.
- [ ] **Carte unifiée** : les moments solidaires avec géoloc sont exposés via l'index `moment_geo_idx` mais le composant `<CarteUnifiee>` (3.2) n'est pas mis à jour pour les afficher. Sera intégré au chantier 6.1 (carte unifiée).

## Non livré (et pourquoi)

- [ ] **Modèle de mail d'invitation au repas du soir** : la spec §7C mentionne plusieurs envois (« appels pour les absent·es », invitations maraude). Ces flux dépendent du chantier 8.1 (notifications) et du wiring Brevo réel.
- [ ] **Détection automatique du passage `annonce → en_cours → termine`** : un cron simple (toutes les heures) suffira ; reporté au chantier 11.3 avec les autres crons Cloudflare Worker.
- [ ] **Ciblage newsletter par proximité** (« les gens s'engagent plus facilement pour ce qui leur est proche », cf. spec §7C) : c'est une feature transverse newsletter à activer au chantier 7.1 (Maintenant Médias) ou 8.1.

## Contenus à arbitrer

- [ ] **Gabarit du flyer** (`lib/moments/config.ts:gabaritFlyerPortAPorte`) : le texte est posé avec « Entrez dans nous, le mouvement Maintenant! » + microcopy fonctionnelle. Sans écriture inclusive (cf. spec §7C accessibilité tactique). Lilou/Ben peut affiner avant impression réelle ; à arbitrer côté chantier 11.x.

## Décisions techniques prises

- **Polymorphisme via `type` + `sous_type` + `parent_id`** : modèle unique pour les 8 types + les 7 RDV enfants du porte-à-porte. Évite une table dédiée `porte_a_porte_rdv`. Cohérent avec le pattern `offre_entraide` (4.1).
- **Génération auto des 7 RDV dans la Server Action** plutôt qu'en trigger BDD : visible côté code, facile à ajuster (la spec peut évoluer sur les décalages), et le seed/seedage n'est pas nécessaire ici.
- **Permission `est_membre_commune` vérifiée applicativement** : la RLS d'insertion ne peut pas facilement valider le `commune_id` de NEW ; le check est dans la Server Action. Le helper SQL `est_membre_commune` (chantier 1.1) est réutilisé tel quel.
- **Coordonnées de participation isolées par RLS** : la table `participation_moment` est lisible uniquement par l'organisateurice + admin + la personne elle-même. Cohérent avec la RGPD spec §05 (minimisation des accès).
- **Flyer SANS écriture inclusive enforced en code** : le test `gabaritFlyerPortAPorte` vérifie explicitement l'absence de point médian. Si quelqu'un·e ajoute par erreur de l'inclusif dans le gabarit, le test échoue.

## Tests

- Unitaires : **226 tests verts** (+14 pour 5.3).
- E2E Playwright : 4 scénarios couvrant la navigation + redirect auth + 404.
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Chantier 5.4 (D'autres moyens d'agir)** : page sobre, liste de redirections externes. Indépendant des moments solidaires.
- **Chantier 6.1 (Carte unifiée)** : ajouter les marqueurs `moment_solidaire` géolocalisés (statuts `annonce` ou `en_cours`).
- **Chantier 6.2 (Agenda agrégé)** : intégrer les moments dans le miroir temporel, par localité/département/date.
- **Chantier 7.1 (Maintenant Médias)** : ciblage newsletter par proximité géographique (les gens s'engagent pour ce qui leur est proche).
- **Chantier 8.1 (Notifications)** : invitation maraude (« appels pour les absent·es »), rappel J-1 du repas solidaire.
- **Chantier 11.3 (Cron prod)** : cron horaire pour transition automatique `annonce → en_cours → termine` selon les dates.
