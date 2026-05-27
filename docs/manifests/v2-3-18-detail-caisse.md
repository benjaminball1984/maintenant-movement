# Manifest — V2 Vague 3, Chantier V2.3.18 : Page de détail caisse (admin trésorerie)

**Date de fin** : 2026-05-27 (nuit)
**Branche** : `feature/v2-3-18-detail-caisse`
**Base** : `main` (tip `189130a`, V2.3.17)

---

## Livré et fonctionnel

Drill-down depuis le dashboard trésorerie V2.3.10 : `/admin/national/tresorerie/[caisseId]` lecture seule. Manquait pour passer du « liste des caisses » au « historique complet d'une caisse ».

- [x] **`app/admin/national/tresorerie/[caisseId]/page.tsx`** : Server Component avec 3 sections.
  - Entête : badges (type, statut, objet), dates ouverture/fermeture, breadcrumb retour.
  - Réceptacles (`receptacle_caisse`) triés par `valide_du` décroissant. Badges canal (euro Stripe vs 99-coin Polygon) + statut (actif si `valide_au IS NULL`, fermé sinon). Identifiant en mono.
  - Transactions sortantes (`transaction_sortante`) triées par `initie_le` décroissant. Montant formaté (`Intl.NumberFormat` en EUR ou 99c), badges statut (initiee/confirmee/annulee/litige), bénéficiaire (interne ID tronqué ou externe), motif, fragment justificatif (nom + type MIME + chemin Storage tronqué — le téléchargement viendra avec le bucket).
- [x] **`lib/admin/tresorerie.ts` — `chargerCaissePourDetail(caisseId)`** : 3 requêtes parallèles (caisse, réceptacles, transactions) avec `Promise.all`. Retourne `CaisseDetail | null`. Mapping snake_case → camelCase. Helper `ligneEnCaisse` extrait et réutilisé par `listerCaissesPourDashboard`.
- [x] **Types `Receptacle`, `TransactionSortante`, `CaisseDetail`** exportés depuis `lib/admin/tresorerie.ts` pour usage par la page.
- [x] **`app/admin/national/tresorerie/page.tsx`** : titre de chaque caisse rendu en `<Link>` vers la page de détail.

## Non livré (et pourquoi)

- [ ] **Solde courant** : pas calculé (déjà noté V2.3.10). Demande de jointure avec les flux d'entrée V1 (don, adhésion, cagnotte) qui ne sont pas encore consommés par les Caisses V2. Le manifest V2.3.10 le notait déjà comme chantier d'intégration.
- [ ] **Téléchargement du justificatif** : pas branché. Affichage placeholder uniquement (nom + MIME + chemin tronqué). Demande le bucket Supabase Storage `justificatifs` et une Server Action `signerUrlJustificatif(transactionId)` qui retourne une URL signée 60s côté admin. Chantier dédié à venir.
- [ ] **UI d'écriture** : pas dans ce chantier (toujours hors scope V2.3.10/V2.3.18). Les actions (poser réceptacle, initier transaction, confirmer transaction) demandent toujours le bucket Storage + `ChampDocument`.
- [ ] **Affichage des bénéficiaires nommés** : `beneficiairePersonneId` affiché en ID tronqué, pas en prénom/nom. Pareil que ailleurs — attend le helper `nomAffichageRespectantVisibilite`. Le bénéficiaire externe est déjà nominatif (texte brut).
- [ ] **Pagination** : pas pour ce chantier (volumes typiques par caisse modérés ; pagination viendra si une caisse devient longue).

## Décisions techniques prises

- **3 requêtes parallèles avec `Promise.all`** : la latence du `chargerCaissePourDetail` est dominée par la requête la plus lente, pas par la somme. Acceptable pour un drill-down.
- **`ligneEnCaisse` extrait en helper privé** : factorisé entre `listerCaissesPourDashboard` et `chargerCaissePourDetail`, évite la duplication des 12 mappings de colonnes. Pas exporté (usage interne au module).
- **`Metadata` dynamique** : `generateMetadata` charge la caisse pour mettre son libellé dans le titre. Coût : 1 requête supplémentaire au build/render. Acceptable parce que la page est admin (volume faible, cache page activé par Next).
- **Format du montant** : `Intl.NumberFormat` pour les euros (`fr-FR` style currency). Pour le 99-coin (entiers), `toLocaleString` simple + suffixe « 99c ». Le type DB est `numeric` → arrivé en `number` côté Supabase JS, pas en `string` (corrigé après le typecheck).
- **Pas de Server Action ici** : la page est strictement lecture seule. Aucun bouton d'action. Les ajouts viendront avec leurs propres chantiers (et leurs propres Server Actions).
- **Breadcrumb minimaliste** : juste `← Trésorerie` au-dessus du H1. Pas de fil complet (`Console > Trésorerie > Caisse X`) — le layout d'admin a déjà une nav latérale qui sert de repère.

## Écarts V1→V2 appliqués

- **Greffe additive pure** : pas de migration. Réutilise les tables V2.2.3.

## Tests

- **Unitaires (Vitest)** : 37 fichiers, **406 tests verts** (inchangés).
- **Lint Biome** : 467 fichiers, 0 issue.
- **Typecheck (tsc)** : 0 erreur.
- **Build / E2E** : non lancés.

## Notes pour les chantiers suivants

- **Téléchargement justificatif** : préalable = bucket Supabase Storage `justificatifs` (privé, RLS) + Server Action `signerUrlJustificatif` qui retourne une URL signée 60s. Brancher dans cette page en `<a href={url} download>`.
- **Bouton « Nouveau reversement »** : préalable = `ChampDocument` (variante de `ChampImageObjet` pour PDF) + `initierTransactionSortanteAction`. Placé en haut de la section transactions.
- **Bouton « Confirmer la transaction »** : pour passer `initiee → confirmee`. Server Action vérifiant double-signature trésorier (si on impose une double validation D12) ou simplement admin national.
- **Vue agrégée des soldes** : `calculerSoldeCaisse(caisseId)` = entrées (encore non branchées) − sorties confirmées. À placer dans l'entête de cette page.
- **Filtres transactions** : par statut (`initiee`/`confirmee`/`annulee`/`litige`), par canal, par période. À ajouter quand le volume le justifiera.
