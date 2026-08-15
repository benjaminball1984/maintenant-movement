# Plan — curation de cagnottes externes (revue des collectes solidaires)

**Date** : 2026-06-15
**Demande Ben** : en plus des cagnottes créées sur la plateforme, curer des
collectes issues des principaux sites de cagnotte/financement participatif
utilisés en France. « D'abord un plan, en allant de la manière la plus
exhaustive possible sélectionner les plateformes de collecte, y compris un peu
moins connues. »

Statut : **PLAN à valider**. Aucune ligne de code ni de migration n'est écrite
tant que Ben n'a pas tranché les décisions de la section 7.

---

## 1. Principe

Réutiliser le moteur d'import déjà éprouvé pour la revue de presse (un
adaptateur par source + un cron + des cartes qui renvoient vers la source).
Une section « collectes solidaires ailleurs » à côté des cagnottes maison, qui
relaie des causes en cohérence avec le mouvement (écologie, solidarité,
luttes, médias indépendants…) et renvoie vers la plateforme d'origine.

**Différence majeure avec la presse** : les sites de collecte n'ont presque
jamais de flux RSS. L'accès se fait par API (interface de programmation, quand
elle existe) ou par lecture de page (scraping, plus fragile). C'est ce qui
détermine la faisabilité, plateforme par plateforme (section 3).

---

## 1bis. Périmètre éditorial à curer (fond fourni par Ben, 2026-06-15)

La curation se fait sur deux axes combinés : **des thèmes** (les causes) et
**des types de contenus** (les formats de collecte). Listes **éditables par
Ben** (le fond politique lui revient).

**Thèmes / mots-clés** (liste de départ, à compléter) : écologie, féminisme,
LGBTQIA+, lanceur·euses d'alerte, écoféminisme, enfantisme, antiracisme,
décroissance, décolonial, géopolitique, antiguerre, droits humains, droit du
travail, justice sociale, soutien aux peuples autochtones, protection animale,
droits des paysan·nes, autodétermination des peuples, anarchisme, communalisme,
marxisme, trotskisme, écologie populaire, altermondialisme, démocratie,
anti-répression, droit au logement, droit à la santé, libertés publiques,
libertés associatives, défense des personnes exilées, lutte contre l'extrême
droite… (etc., enrichissable).

**Types de collectes recherchés** :
- **Jeux militants** (ex. « Antifa le jeu », La Horde / Libertalia).
- **Livres militants** sur les thèmes ci-dessus (édition indépendante, auto-édition).
- **Caisses de grève / caisses de lutte**.
- **Cantines solidaires** et lieux d'entraide.
- **Collectes relayées par la presse engagée** : leurs propres appels, ceux
  qu'elles relaient, et ceux de leurs auteur·ices (ex. le livre de Denis Robert
  sur Ulule). C'est une mine, voir le croisement presse ↔ collectes au §6bis.

## 1ter. Où vivent réellement ces types (sondé 2026-06-15)

| Type de collecte | Plateformes qui les hébergent | Curable sans HelloAsso ? |
|---|---|---|
| **Livres militants** | **Ulule** (maisons d'édition indé, auto-édition) | ✅ oui (Ulule, scraping) |
| **Jeux militants** | **Ulule** (catégorie Jeux) | ✅ oui — ⚠️ la catégorie héberge AUSSI des jeux d'extrême droite (« Vive la France ! ») → filtre + modération indispensables |
| **Écologie/agri/transition** | MiiMOSA, LITA, Blue Bees, Zeste | ✅ oui (scraping / JSON-LD) |
| **Caisses de grève / lutte** | **CotizUp, Leetchi, Le Pot Commun**, sites de syndicats | ⚠️ DIFFICILE : surtout sur les plateformes qui bloquent les robots / sans catalogue public, ou des pages éparses. Mieux capté via le croisement presse (§6bis). |
| **Cantines solidaires / assos** | **surtout HelloAsso**, un peu Leetchi / La Cagnotte des Proches | ⚠️ FAIBLE sans HelloAsso (c'est là qu'elles sont) |

**Conséquence honnête** : « tout sauf HelloAsso » capte très bien les **livres
et jeux militants (Ulule)** et l'**écologie** (MiiMOSA/LITA), mais attrapera
**peu de caisses de grève et de cantines solidaires** au départ : celles-ci
vivent surtout sur HelloAsso et sur des pots privés non catalogués (CotizUp,
Leetchi). Voir le point d'arbitrage en fin de document.

## 2. Recensement exhaustif (sondé techniquement le 2026-06-15)

Légende accès : 🟢 facile (flux RSS ou API propre) · 🟡 moyen (API à clé, ou
données structurées JSON-LD lisibles dans la page) · 🔴 difficile (page HTML/JS
à parser, fragile) · ⚫ inutilisable (bloque les robots et/ou aucun catalogue
public). Pertinence = adéquation à la ligne du mouvement.

### a. Associations (LE pilier)
| Plateforme | Accès | Pertinence | Note |
|---|---|---|---|
| **HelloAsso** | 🟡 API (OAuth) | ★★★ | Gratuit, LA plateforme des associations militantes. API « directory » qui cherche les collectes publiques par thème. Anchor recommandé. |

### b. Don / récompense généraliste
| Plateforme | Accès | Pertinence | Note |
|---|---|---|---|
| **Ulule** | 🟡 API bridée + 🔴 HTML | ★★★ | Leader FR, projets engagés/créatifs/solidaires. API v1 non publique aujourd'hui (404) ; a racheté KissKissBankBank. |
| **Okpal** (groupe Ulule) | 🔴 HTML | ★★ | Bras « don » d'Ulule. Possible API commune à confirmer. |
| **GoFundMe** | 🔴 HTML (anti-robot) | ★★ | International, causes/solidarité. Conditions d'utilisation strictes. |
| ~~KissKissBankBank~~ | — | — | **Fermé** (racheté par Ulule fin 2024, service arrêté). À écarter. |

### c. Écologie / agriculture / transition (très dans la ligne)
| Plateforme | Accès | Pertinence | Note |
|---|---|---|---|
| **MiiMOSA** | 🔴 HTML | ★★★ | Agriculture, alimentation, transition. |
| **Zeste** (La Nef) | 🟡 à confirmer | ★★★ | Dons, transition écologique et sociale, banque éthique. URL de listing à retrouver. |
| **Blue Bees** | 🔴 HTML | ★★★ | 100 % transition écologique (~14 M€ depuis 2014). Activité à vérifier. |
| **LITA.co** | 🟡 JSON-LD | ★★★ | Écologie, ESS, conso responsable (investissement à impact). Données structurées lisibles. |
| **Lendosphère / Lumo / Lendopolis** | 🔴 HTML | ★★ | Énergies renouvelables citoyennes (prêt/investissement, pas du don). |
| **Enerfip** | ⚫ 403 | ★★ | Énergie renouvelable, bloque les robots. |
| **Tudigo** | 🔴 HTML | ★★ | Projets locaux/régionaux à impact. |
| **Kocoriko** (Crédit Mutuel) | 🟢 RSS | ★★ | A un flux RSS (rare !) ; orientation locale. |
| **WE DO GOOD** | 🟢 RSS | ★★ | Innovation à impact ; a un flux RSS. |

### d. Médias / créateurs (le mouvement valorise les médias indé)
| Plateforme | Accès | Pertinence | Note |
|---|---|---|---|
| **Tipeee** | 🔴 HTML (Nuxt/JS) | ★★ | Soutien récurrent de créateurs/médias indépendants (modèle différent du projet ponctuel). |
| **Patreon** | 🔴 API/HTML | ★ | International, idem Tipeee. |

### e. Solidarité / logement
| Plateforme | Accès | Pertinence | Note |
|---|---|---|---|
| **Les Petites Pierres** (Fondation Abbé Pierre) | 🔴 HTML | ★★★ | Mal-logement, dons abondés. Très dans la ligne. |

### f. Culture / patrimoine
| Plateforme | Accès | Pertinence | Note |
|---|---|---|---|
| **Commeon** | 🔴 HTML | ★ | Mécénat culturel. |
| **Proarti** | 🔴 HTML | ★ | Artistes. |
| **Dartagnans** | ⚫ 404 | ★ | Patrimoine. |

### g. Cagnottes (pots) — contenu très mélangé, à fort filtrage
| Plateforme | Accès | Pertinence | Note |
|---|---|---|---|
| **Le Pot Commun** | 🟡 JSON-LD | ★ | Beaucoup de pots privés (anniversaires…) ; peu de catalogue solidaire public. |
| **Papayoux** | 🟡 JSON-LD | ★★ | Volet solidaire identifiable. |
| **La Cagnotte des Proches** | 🟡 JSON-LD | ★★ | Solidarité de proximité. |
| **Tribee** | 🔴 HTML | ★★ | Reverse 5 % à des assos ; modèle solidaire. |
| **Cotizup** | ⚫ 403 | ★★ | 80 % humanitaire mais bloque les robots. |
| **Leetchi** | ⚫ 403 | ★ | Pots privés, aucun catalogue public, bloque les robots. |
| **Credofunding** | 🔴 HTML | ✗ | Orientation confessionnelle : probablement hors ligne éditoriale. |

**Conclusion du recensement** : sur ~25 plateformes, **1 a une vraie API
propre et dans la ligne (HelloAsso)**, **2 ont un flux RSS** (Kocoriko, WE DO
GOOD, mais peu centrales), **~5 exposent du JSON-LD** lisible (LITA, Papayoux,
La Cagnotte des Proches, Le Pot Commun), le reste demande du scraping fragile,
et **3-4 sont inutilisables** (pots privés et/ou blocage robots : Leetchi,
Cotizup, Enerfip). Les pures cagnottes généralistes apportent surtout du bruit.

---

## 3. Faisabilité technique, par tier

1. **API HelloAsso (recommandé en pilier)** : nécessite d'enregistrer une
   « application partenaire » (gratuit) pour obtenir une clé. Permet de chercher
   les collectes publiques par thème, proprement, sans scraping. Couvre l'essentiel
   des causes associatives militantes.
2. **Flux RSS** (Kocoriko, WE DO GOOD) : import identique à la revue de presse,
   trivial, mais plateformes peu centrales.
3. **JSON-LD** (LITA, Papayoux, La Cagnotte des Proches) : on lit la balise de
   données structurées de la page, plus stable qu'un scraping de mise en page.
4. **Scraping HTML/JS** (Ulule, MiiMOSA, GoFundMe, Tipeee…) : faisable mais
   fragile (casse à chaque refonte) et sensible juridiquement.
5. **Inutilisable** (Leetchi, Cotizup, Enerfip) : on les écarte.

---

## 4. Architecture proposée (calquée sur l'existant, mock d'abord)

```
lib/import-cagnottes/
├── types.ts                      // CagnotteExterne, AdaptateurCollecte
├── adaptateurs/
│   ├── helloasso.ts              // API (réel) + mock
│   ├── rss-generique.ts          // Kocoriko, WE DO GOOD (réutilise l'analyseur RSS)
│   ├── jsonld-generique.ts       // LITA, Papayoux, La Cagnotte des Proches
│   └── ...                        // un fichier par source ajoutée
├── sources-cagnottes.ts          // registre {nom, plateforme, accès, thèmes, actif}
├── themes.ts                     // thèmes + mots-clés du pré-filtre (éditables)
├── curation.ts                   // pré-filtre thématique + dédup + score de pertinence
└── importer.ts                   // orchestration (idempotent par url source)
app/api/cron/import-cagnottes/route.ts          // protégé par CRON_SECRET
app/admin/moderation/cagnottes-externes/page.tsx // FILE DE PROPOSITIONS (a priori)
infra/cron-cagnottes/                            // Worker Cloudflare (cadence quotidienne)
```

Le cron ne **publie jamais** directement : il dépose des **propositions** dans
une file de modération. Rien n'est visible du public tant que Ben n'a pas validé.

Comme pour tout service externe (directive projet) : chaque adaptateur a une
implémentation **mock par défaut**, le site tourne sans aucune clé ; HelloAsso
s'allume quand Ben fournit la clé partenaire.

---

## 5. Modèle de données (table additive — DÉCISION BASE DISTANTE)

Nouvelle table légère `cagnotte_externe`, à côté de l'existant (doctrine de
greffe : on n'additionne, on ne touche pas aux tables actuelles) :

| colonne | rôle |
|---|---|
| `id`, `slug`, `created_at` | technique |
| `titre`, `resume` | affichage (résumé court, pas de copie longue) |
| `organisateur` | qui collecte (association, collectif…) |
| `plateforme` | HelloAsso, Ulule… (badge + lien) |
| `source_url` | lien sortant (idempotence) |
| `objectif_centimes`, `collecte_centimes`, `echeance` | jauge (si exposés) |
| `vignette_url` | optionnel (voir §6 juridique) |
| `themes` | thèmes détectés par le pré-filtre (aide à la modération) |
| `statut` | **`propose` par défaut (NON public)** → `publie` (validé) / `refuse` |
| `modere_par`, `modere_le`, `raison_refus` | trace de la modération a priori |

Créer cette table = une **migration sur la base distante de Francfort**, donc
une porte : rien ne part sans le feu vert explicite de Ben.

---

## 6. Modération A PRIORI (demande Ben 2026-06-15) + juridique

Workflow voulu par Ben : **le système propose, Ben valide avant publication.**
Rien n'est public sans son feu vert.

1. **Pré-filtre automatique (réduit le volume à modérer)** : le cron ne ramène
   que les collectes qui matchent des **thèmes/mots-clés** alignés sur le
   mouvement (climat, logement, paysan·nes, féminisme, antiracisme, médias
   libres, caisses de grève, solidarité migrant·es…). Liste **éditable par Ben**
   (`themes.ts` / CMS), enrichie au fil de l'eau. Optionnel : une liste
   d'organisateurs de confiance qui passent en priorité.
2. **File de propositions** : chaque candidat retenu est inséré en
   `statut='propose'` (invisible du public).
3. **Validation a priori** : écran `/admin/moderation/cagnottes-externes` qui
   liste les propositions (titre, organisateur, plateforme, thèmes détectés,
   montant, lien source). Pour chacune : **Approuver** (→ `publie`, devient
   public), **Rejeter** (→ `refuse`, motif facultatif), éventuellement **ajuster**
   titre/thèmes avant publication. Tout est tracé (`modere_par`, `modere_le`).
4. **Anti-réapparition** : un candidat rejeté n'est jamais re-proposé (mémorisé
   par `source_url`), pour ne pas te refaire modérer deux fois la même chose.
5. **Affichage public** : seules les collectes `publie` apparaissent, dans une
   section **distincte** des cagnottes maison (« Soutenir des causes
   solidaires »), badge plateforme, jauge si dispo, bouton « Soutenir sur
   [plateforme] ↗ ». Aucune confusion possible avec une cagnotte Maintenant!.

**Juridique / conditions d'utilisation** : on **renvoie vers la source**, on
n'héberge pas la collecte. Aperçu **minimal** (titre, organisateur, plateforme,
montant, lien) ; on évite de recopier les visuels des plateformes. On respecte
les `robots.txt` et on n'aspire pas les sites qui l'interdisent.

**Pourquoi le pré-filtre + ta validation sont indispensables** : exemple réel,
la catégorie « Jeux » d'Ulule héberge « Antifa le jeu » (dans la ligne) MAIS
aussi des jeux d'extrême droite (« Vive la France ! »). Importer « les jeux
d'Ulule » sans filtre ni validation, ce serait risquer d'afficher du contenu
fasciste. D'où : mots-clés + thèmes en amont, et TON feu vert avant publication.

## 6bis. Croisement presse ↔ collectes (idée Ben : la presse est une mine)

La presse engagée qu'on importe déjà relaie en permanence des appels à collecte
(les leurs, ceux qu'ils soutiennent, ceux de leurs auteur·ices : ex. le livre
de Denis Robert sur Ulule). On peut donc **détecter les liens de collecte dans
les articles de la revue de presse** (repérage des URL vers ulule.com,
helloasso.com, cotizup.com, leetchi.com… dans le corps des brèves/articles
déjà importés) et les proposer à la même file de modération. C'est souvent **le
meilleur moyen d'attraper les caisses de grève et les campagnes d'auteur·ices**
qui, elles, n'ont pas de catalogue public parcourable. À prévoir en Phase 2.

---

## 7. Décisions

**Actés (Ben 2026-06-15)** :
- Modération **a priori** : le système propose, Ben valide avant publication (§6).
- Périmètre : **tout SAUF HelloAsso pour l'instant** (pas de clé à enregistrer ;
  HelloAsso ajouté plus tard).
- Périmètre éditorial (thèmes + types) fourni (§1bis), éditable.

À trancher avant tout code :
1. **ARBITRAGE caisses de grève / cantines solidaires** : ce sont justement les
   types les plus sur **HelloAsso** et sur des pots privés non catalogués
   (CotizUp, Leetchi). « Tout sauf HelloAsso » en attrapera donc peu au début.
   Trois options : (a) on l'assume et on les captera surtout via le croisement
   presse (§6bis) ; (b) on réintègre HelloAsso dès la Phase 1 (c'est LA source
   de ces types) ; (c) on met ces deux types de côté pour l'instant.
2. **Table distante** `cagnotte_externe` : feu vert pour la migration ?
3. **Organisateurs de confiance** : veut-on aussi une liste blanche
   d'organisateurs qui passent en priorité, en plus des mots-clés ?

---

## 8. Phasage proposé (sans HelloAsso pour l'instant)

- **Phase 1 (le cœur sans clé)** : **Ulule** (livres + jeux militants, scraping
  par mots-clés/thèmes) + **écologie** (MiiMOSA scraping, LITA JSON-LD) +
  **RSS** (Kocoriko, WE DO GOOD). Avec le pré-filtre thèmes/types, la file de
  propositions et l'écran de modération a priori, l'affichage public. Tout en
  mock testable d'abord.
- **Phase 2 (croisement presse ↔ collectes, §6bis)** : détecter les liens de
  collecte dans les articles déjà importés → attrape caisses de grève et
  campagnes d'auteur·ices, qui n'ont pas de catalogue public.
- **Phase 3** : élargir le scraping (Les Petites Pierres, Tudigo, Blue Bees,
  GoFundMe…) + **réintégrer HelloAsso** (API, quand la clé est posée) pour les
  cantines solidaires et caisses de grève associatives.

## 9. Limites / risques
- Scraping = maintenance récurrente (casse aux refontes de sites).
- Cagnottes généralistes = beaucoup de bruit (pots privés) → fort filtrage requis.
- Risque réputationnel : relayer une collecte douteuse → d'où curation + modération.
- HelloAsso/Ulule sans clé = pas de données (comme Twitch l'était).
