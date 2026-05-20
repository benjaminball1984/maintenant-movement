# Manifest : Phase 7, Chantier 7.1 — Maintenant Médias

**Date de fin** : 2026-05-21
**Branche** : `feature/phase-7-chantier-7.1-media`
**Commit final** : `À RENSEIGNER PAR LE COMMIT FIX SUIVANT`
**Durée approximative** : 1 session Claude Code

---

## Livré et fonctionnel

### Schéma BDD (migration 031)

- [x] **Table `media`** : polymorphe via `type` (9 valeurs couvrant la spec §4A : edito, tribune, article, breve, dessin, podcast, video, live, newsletter). Corps Markdown, auteurice optionnelle (null pour brèves importées), provenance externe + source URL (CHECK : si provenance, source obligatoire), media_url + vignette_url, tags `text[]` (GIN indexé), statut `brouillon | publie | retire | archive` avec cohérence enforced (publie_le requis si statut=publie ; raison_retrait requise si retire). RLS : publié = public, brouillon = auteurice/admin, modération par modérateurice `media`.

### Code applicatif

- [x] **Types Database** : `Media`, unions `TypeMedia | StatutMedia`.
- [x] **Validations Zod** (`lib/validations/media.ts`) : `creerMedia` (corps 30-50000 chars + refinement provenance→source), `publierMedia`, `retirerMedia` (raison ≥ 10 chars).
- [x] **Server Actions** (`app/(public)/s-informer/media/actions.ts`) :
  - `creerMedia` : Turnstile + auth, slug unique, statut `brouillon`.
  - `publierMedia` : éditos + newsletters → admin national uniquement ; tribunes/articles/etc. → auteurice OK + modé.
  - `retirerMedia` : modérateurice `media` ou admin général. Raison conservée + retire_par + retire_le.
- [x] **Couche de requêtes** (`lib/media/requetes.ts`) : `listerMediasPublies(type?)`, `mediaParSlug`. Hydratation auteurice par IN-clause.

### Pages

- [x] **`/s-informer/media`** : remplace le stub. 10 onglets (Tous + 9 types). Vignettes en cartes avec badge type, accroche 240 chars, auteurice + date. Sous-titre signale `via Reuters` pour les brèves importées.
- [x] **`/s-informer/media/[slug]`** : fiche détail Markdown + alert info pour les brèves externes (avec lien source obligatoire), vignette image, embed iframe pour vidéos/lives, balise audio pour podcasts, tags en footer.

### Tests

- [x] **6 nouveaux tests unitaires** : édito valide, type inconnu refusé, refinement provenance→source, raison retrait. Total **238 tests verts** (+6).
- [x] **E2E Playwright** : 3 scénarios (rendu, 10 onglets, 404).
- [x] **Lint Biome + typecheck tsc + build Next.js** : tous verts.

## Livré partiellement

- [ ] **Formulaire de création depuis l'UI** : la Server Action `creerMedia` est prête mais l'UI dédiée pour la rédaction d'articles/tribunes par les usager·ères n'a pas été exposée. Sera ajoutée en polish ou dans la console rédaction (chantier 9.x).
- [ ] **UI de publication / retrait depuis la console admin** : Server Actions prêtes ; l'onglet `/admin/moderation/media` viendra avec le chantier 9.1.

## Non livré (et pourquoi)

- [ ] **Import automatique des brèves Reuters / AP** : pas de clé API fournie pour 7.1. La structure BDD est prête (`provenance_externe` + `source_url`) ; un job d'import dédié viendra quand les clés seront branchées.
- [ ] **Maintenant Radio (chantier 7.2)** et **journal-affiche (7.3)** : pages stub conservées, à livrer dans les chantiers respectifs.
- [ ] **Liens entre médias et newsletter Brevo** : la newsletter envoyée vendredi (cf. spec §10) renverra vers les médias publiés sur la semaine ; la logique d'envoi viendra avec le chantier 8.1.
- [ ] **Ciblage par tags géographiques** (cf. spec §10) : la colonne `tags` accepte n'importe quel slug. Le ciblage département se branchera côté Brevo / preferences notifications (chantier 8.1).

## Contenus à arbitrer

Aucun pour 7.1. Le moteur est posé, les contenus éditoriaux (premiers éditos, articles fondateurs) seront ajoutés par la rédaction au moment du lancement.

## Décisions techniques prises

- **Une seule table `media` polymorphe** (cohérent avec `offre_entraide` 4.1 et `moment_solidaire` 5.3) plutôt qu'une table par type. Évite la duplication de RLS, des champs communs (titre, corps, auteurice, statut, tags) et du flux du réseau social (qui pourra croiser tous les médias dans un seul `SELECT`).
- **`auteurice_id` nullable** : permet l'import de brèves Reuters/AP sans auteurice locale. Pour les contenus internes, la RLS d'insertion exige `auteurice_id = auth.uid()`.
- **CHECK BDD `media_provenance_coherente`** : impossible d'inscrire une provenance externe sans URL source. Garantit la transparence des reprises (politique éditoriale §4A).
- **Éditos + newsletters réservés admin national** : enforcement applicatif dans `publierMedia` (la RLS d'update est laissée plus large pour permettre le brouillon auteurice). Cohérent avec la doctrine : la newsletter et les éditos engagent le mouvement.
- **Pas de markdown rendu côté serveur en v1** : le corps est affiché `whitespace-pre-line` (préservation des sauts de ligne) sans parsing. Un rendu Markdown complet (avec sanitisation) viendra en polish quand la rédaction le demandera.

## Tests

- Unitaires : **238 tests verts** (+6 pour 7.1).
- E2E Playwright : 3 scénarios.
- Lint, typecheck, build : tous verts.

## Notes pour les chantiers suivants

- **Chantier 7.2 (Maintenant Radio)** : player AzuraCast embarqué dans `/s-informer/radio`. Pas de table dédiée nécessaire ; la métadonnée d'émission vient de l'API AzuraCast.
- **Chantier 7.3 (Journal-affiche)** : agent Claude API + Paged.js + Puppeteer + 30 modèles Canva. Préfigure le flux d'export PDF print-ready.
- **Chantier 7.4 (Sondages)** : table `sondage` séparée (pas dans `media`) car le modèle de réponses est différent.
- **Chantier 7.5 (Réseau social)** : croise `media` (publiés) + autres entités (pétitions signées, etc.) dans le flux algorithmiquement transparent.
- **Chantier 8.1 (Notifications)** : envoi newsletter vendredi avec les médias publiés sur la semaine (`SELECT * FROM media WHERE statut='publie' AND publie_le > now() - interval '7 days'`).
- **Polish** : rendu Markdown (avec `marked` + DOMPurify pour la sanitisation), CMS-like de la rédaction dans la console admin.
