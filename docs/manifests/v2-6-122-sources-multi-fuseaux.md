# Manifest — V2.6.122 : sources « autres fuseaux » pour combler la nuit

**Date de fin** : 2026-06-15
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Durée approximative** : 1 session Claude Code

## Contexte (question puis demande Ben, 2026-06-15)

Ben : « pourquoi sur le site il y a régulièrement des moments sans imports ? »
Diagnostic posé, puis sa solution : « on cherche d'autres sources francophones,
anglophones ou hispanophones qui publient sur d'autres fuseaux horaires » +
« n'oublie pas les québécois, il doit y en avoir des biens » + (arbitrages)
« tout [y compris mainstream], et va chercher les DOM-TOM parce qu'en fait ils
sont francophones et sur d'autres fuseaux » + « oui » aux sources espagnoles.

## Diagnostic (cause des trous)

La règle de fraîcheur « moins de 2 h » (V2.6.121) ne prend, à chaque heure, que
les contenus publiés dans les 2 dernières heures. Or ~90 % des sources étaient
en fuseau européen (UTC+1/+2). La nuit parisienne (≈ 1h-7h), la presse
française/européenne ne publie plus : l'import tourne mais ne trouve rien, et le
fil se fige (les contenus en tête vieillissent à 9-11 h). Ce n'était pas une
panne de cron (vérifié à de multiples reprises) mais l'effet attendu de la
fraîcheur, sans source active à cette heure-là.

## Solution (idée Ben)

Garder la règle stricte des 2 h, mais s'assurer qu'il y a toujours une source en
train de publier quelque part : ajouter des médias engagés des Amériques (qui
sont en plein après-midi/soirée pendant notre nuit) et surtout des DOM-TOM
francophones, qui couvrent tous les fuseaux de la planète en français.

## Livré et fonctionnel

- [x] **38 sources ajoutées** dans `lib/import-breves/sources.ts`, toutes
  **vérifiées vivantes le 2026-06-15** (flux + heure de publication réelle) :
  - Francophone Amériques : Le Devoir, Ricochet (Québec), Radio-Canada Info,
    Pivot, Presse-toi à gauche !, La Presse, AlterPresse (Haïti).
  - Anglophone : Jacobin, The Intercept, Truthout, Common Dreams, The Nation,
    Democracy Now!, ProPublica, Mother Jones, In These Times, The Real News,
    Grist, Labor Notes, Inside Climate News, The Breach, rabble.ca, The Tyee,
    The Maple, National Observer.
  - Hispanophone Amérique latine : El Ciudadano, La Izquierda Diario, Resumen
    Latinoamericano, La Jornada.
  - Hispanophone Espagne (fuseau européen, n'aide pas la nuit mais enrichit) :
    El Salto, Pikara Magazine, Sin Permiso.
  - **DOM-TOM francophones** (couvrent tout le globe) : Zinfos974 (Réunion,
    comble l'aube 04h-07h), Karib'Info (Guadeloupe, soirée/début de nuit),
    Tahiti Infos (Polynésie, cœur de nuit 00h-03h), Les Nouvelles
    Calédoniennes (nuit profonde).
- [x] **Tirage horaire conscient de l'heure** (`tirerSourceHoraire`) : ajout
  d'un champ `zone` (`ameriques` / `outre-mer`, absent = Europe) + helpers
  `heureParisCourante`, `estHeureCreuseParis` (23h-6h59) + liste dérivée
  `SOURCES_NUIT`. La NUIT, le tirage puise à 85 % dans les sources d'autres
  fuseaux (15 % de repli sur l'ensemble pour un contenu européen tardif) ; le
  JOUR garde le 80 % prioritaires / 20 % complémentaires inchangé.
- [x] **`maxEssaisSources` relevé 4 → 6** dans `importerBreveHoraire` : la nuit,
  on essaie un peu plus de sources avant d'abandonner pour atteindre une qui a
  du frais.
- [x] **Tests** : `tests/unit/import-breves/import-breves.test.ts` mis à jour
  (heure de jour fixée pour rester déterministe) + 5 nouveaux tests (heure
  creuse, tirage nuit/jour/repli, zones). **1161 tests verts** au total.

## Logique de prévention (consigne Ben « corriger l'import »)

| Défaut | Correctif d'import durable |
|---|---|
| Trous de nuit (fraîcheur 2 h + sources euro seules) | sources d'autres fuseaux + tirage horaire conscient de l'heure de Paris |

Les URL sont vérifiables/réactualisables via `data-migration/verifier-sources-fuseaux.mjs`,
`verif-quebec.mjs`, `verif-domtom.mjs` (gitignorés).

## Non livré / limites

- [ ] **Médias non textuels** (podcasts/vidéos/dessins) : le même trou de nuit
  existe côté `import-medias` (sources YouTube/podcast majoritairement
  françaises). Non traité ici (demanderait des chaînes étrangères) ; à faire si
  Ben le souhaite.
- [ ] Flux **écartés** car morts/illisibles le 2026-06-15 : Página/12,
  El Desconcierto, Desinformémonos, CTXT, Canadian Dimension, L'aut'journal,
  + les flux RSS « La 1ère » de France Télévisions (renvoient une page, pas un
  flux). Détail dans `docs/sources-fuseaux-ameriques-proposition.md`.
- [ ] La fenêtre « heure creuse » est fixée à 23h-6h59 ; ajustable si besoin.

## Vérifications

- Unitaires : **1161 tests verts** (`vitest run`).
- `tsc --noEmit` vert ; Biome propre sur les fichiers touchés.
- Sources testées en réseau réel (statut HTTP + heure de publication Paris).
