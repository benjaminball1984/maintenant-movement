# Manifest — V2.6.124 : curation de cagnottes externes (Phase 1, Ulule)

**Date de fin** : 2026-06-15
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Durée approximative** : 1 session Claude Code

## Demande Ben (2026-06-15)

En plus des cagnottes maison, relayer des collectes des principales plateformes
françaises, alignées sur le mouvement. Décisions actées : **tout sauf HelloAsso**
pour l'instant (pas de clé partenaire), **modération A PRIORI** (le système
propose, Ben valide avant publication), périmètre éditorial fourni par Ben
(thèmes + types). Plan complet : `docs/plan-curation-cagnottes-externes.md`.

## Découverte clé

Ulule, censé être du scraping, expose en fait une **API publique JSON sans clé**
(`api.ulule.com/v1/search/projects?q=...`). Phase 1 bâtie dessus = source stable
(pas de scraping fragile) et riche (livres + jeux militants + écologie…).

## Livré et fonctionnel

- [x] **Table `cagnotte_externe`** (migration `20260615120000`, additive),
  **appliquée au distant** (Management API). Modération a priori intégrée :
  `statut='propose'` (NON public) → `publie` / `refuse`. RLS : lecture publique
  des seules `publie`, insertion service_role, mise à jour admin. Type ajouté à
  la main dans `types/database.ts`.
- [x] **Bibliothèque `lib/import-cagnottes/`** : `types.ts`, `themes.ts` (thèmes
  + types de collecte + EXCLUSIONS extrême droite, **matching en mots entiers**
  pour éviter les faux positifs type « trans » dans « transition »),
  `adaptateurs/ulule.ts` (API réelle, ne garde que les collectes en cours),
  `curation.ts` (dédup + pertinence), `importer.ts` (anti-re-proposition par
  `source_url`, dépôt en `propose`, plafond par run).
- [x] **Cron** `/api/cron/import-cagnottes` (CRON_SECRET) + Worker
  `infra/cron-cagnottes/` (quotidien). NE PUBLIE JAMAIS : dépose des propositions.
- [x] **Modération a priori** : écran `/admin/moderation/cagnottes-externes`
  (liste des propositions, Approuver / Rejeter+motif), actions serveur réservées
  admin (`approuver`/`rejeter`), ajout du compteur à la file de modération
  globale (`/admin/moderation`).
- [x] **Affichage public** : section « Soutenir des causes solidaires ailleurs »
  sur `/mobiliser/cagnottes`, DISTINCTE des cagnottes maison, cartes qui
  renvoient vers la source (lien sortant), badge plateforme + jauge + thèmes.
  Disparaît si aucune collecte validée.
- [x] **Import réel lancé** : 141 projets Ulule examinés → **37 candidats**
  déposés dans la file (statut `propose`, 0 publié : le public ne voit rien tant
  que Ben n'a pas validé).

## Choix et garde-fous

- **Juridique** : on renvoie vers la source (aperçu minimal), on n'héberge pas la
  collecte.
- **Anti-extrême-droite** : exclusions par mots-clés (ex. « Vive la France ! »
  écarté) + validation a priori. Cas réel motivant : la catégorie « Jeux »
  d'Ulule héberge « Antifa le jeu » MAIS aussi des jeux d'extrême droite.
- **Bruit** : la recherche Ulule étant large, du bruit écolo-lifestyle passe le
  pré-filtre ; la modération a priori est le vrai filtre, et `themes.ts` est
  éditable pour resserrer.

## Tests

- Unitaires : `tests/unit/import-cagnottes/curation.test.ts` (9 tests : mots
  entiers, détection thèmes/types, exclusions, pertinence, dédup), dont la
  non-régression « transition ≠ LGBTQIA+ ». Suite complète verte.
- typecheck + lint verts.

## Phase 2 (2026-06-16) — élargissement Ulule + scraping MiiMOSA

- [x] **Requêtes Ulule étendues** à ~30 thèmes (anarchisme, marxisme, santé,
  libertés, antispécisme, peuples autochtones, lanceur·euses d'alerte, +
  requêtes directes « caisse de grève » / « cantine solidaire » / « syndicat »).
- [x] **Scraping MiiMOSA** (demande Ben « fais le scraping, c'est important ») :
  `adaptateurs/miimosa.ts`. MiiMOSA est une appli Next.js → on lit le JSON
  structuré `__NEXT_DATA__` de la page de liste (le moins fragile possible,
  mais reste un scraping ; échec → [] sans casser le reste). Ne garde que les
  collectes de DON publiées, pagine, mappe (titre, organisateur, objectif/
  collecté/%, échéance). +25 collectes réelles à l'import.
- Recon : **MiiMOSA = Next.js (exploitable)** ; **LITA = appli JS sans données
  statiques + modèle investissement → écartée** ; **croisement presse = 1/40
  articles seulement → non rentable, abandonné**.

## Reste / suites prévues

- [ ] Autres scrapers possibles (chacun = son parseur + sa maintenance) :
  GoFundMe, Tudigo, Les Petites Pierres, Papayoux/Le Pot Commun (JSON-LD).
- [ ] HelloAsso (cantines, caisses de grève associatives) quand clé partenaire.
- [ ] Tuning de la liste de thèmes/mots-clés avec Ben selon le bruit observé.
