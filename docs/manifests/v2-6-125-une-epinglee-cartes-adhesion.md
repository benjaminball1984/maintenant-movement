# Manifest — V2.6.125 : la une ne monte plus toute seule, sondage épinglable, carte en sommeil, adhésion unique

**Date de fin** : 2026-08-15
**Branche** : `feature/phase-0-chantier-0.1-deploiement-cloudflare`
**Commit final** : voir le commit « phase 0 - chantier 0.1 - V2.6.125 » (chantiers du 01/08 et du 15/08 réunis, voir §7)

---

## Demandes Lilou/Ben (2026-08-15)

Trois demandes distinctes, traitées dans la même séance :

1. **« Rien ne doit monter à la une tout seul. »** La page d'accueil affichait le contenu
   publié le plus récent quand l'administration n'avait rien épinglé. Conséquence : une brève
   importée automatiquement chaque heure pouvait se retrouver en tête du site sans que
   personne ne l'ait choisie.
2. **« Le sondage doit être épinglable comme les autres. »** C'était le seul des cinq blocs de
   la une à ne pas l'être : il prenait d'office le dernier sondage ouvert.
3. **La carte des mobilisations en sommeil**, et **une seule adhésion, gratuite**.

---

## 1. La une est une décision éditoriale, plus jamais un automatisme

**Le cœur du chantier.** `choisirALaUne()` (`lib/home/une.ts`) ne retourne plus que le contenu
épinglé par l'administration. Un emplacement non épinglé reste **vide**, dans trois cas tous
volontaires :

- aucun épinglage pour cet emplacement ;
- le contenu épinglé n'est plus dans le bassin des candidats (retiré, dépublié, mobilisation
  passée) — on préfère un bloc vide à un remplacement choisi par la machine ;
- la liste des candidats est vide.

Même règle appliquée à la une de **Maintenant Médias** (`/s-informer/media`) : sans épinglage,
la page démarre directement sur « La rédaction » au lieu de mettre en avant le dernier contenu
maison.

**Ce que voit qui :**

- **visiteur·se** — le bloc n'existe pas. La page d'accueil est simplement plus courte. On
  n'affiche pas un cadre vide, et on ne dit pas « rien n'est publié » : ce serait faux, il y a
  du contenu, il n'est juste pas choisi ;
- **administration** — un cadre en pointillés (`components/home/UneNonEpinglee.tsx`, nouveau)
  avec le raccourci vers la console d'épinglage. C'est le seul moyen de voir depuis l'accueil
  qu'un emplacement attend une décision.

## 2. Le sondage rejoint les emplacements épinglables

- **Migration `20260815100000_une_home_sondage.sql`** — additive et idempotente : la contrainte
  `une_home_emplacement_valide` et la liste blanche de la fonction `definir_une_home()`
  acceptent `'sondage'` en plus des quatre emplacements existants. Aucun emplacement retiré,
  aucune ligne touchée (doctrine de greffe, CLAUDE.md §0.3).
- `sondageAlaUne()` (`lib/sondages/requetes.ts`) — même mécanisme que les quatre autres, bassin
  = sondages ouverts ou fermés.
- `components/home/UneSondage.tsx` — le bloc de la une.
- Bouton **« Mettre à la une »** sur la fiche de sondage (`/s-informer/sondages/[slug]`),
  réservé à l'administration, comme sur les pétitions et les mobilisations.
- Console `/admin/national/une` — cinq emplacements, **dans l'ordre d'affichage de l'accueil**
  (pétition, mobilisation, sondage, article, cagnotte), et plus de mention « automatique ».

⚠️ **Cette migration n'a pas pu être confirmée appliquée sur le distant** — voir §6.

## 3. Nettoyage des composants de la une

Les cinq blocs partageaient un enrobage générique `components/home/UneSection.tsx`. Chaque bloc
gérant désormais lui-même son cas « non épinglé », l'enrobage n'avait plus d'appelant :
`UneSection.tsx` est **supprimé** (composant sans référence, aucune page ni donnée concernée).
`UneArticle`, `UneCagnotte`, `UneMobilisation`, `UnePetition` réécrits sur le même modèle que
`UneSondage`.

## 4. Carte des mobilisations mise en sommeil

`'/cartes'` passe dans `CHEMINS_SOMMEIL` (`config/rubriques.ts`) et le lien disparaît du pied de
page. **C'est la vue cartographique qui s'éteint, pas la donnée** : les mobilisations restent
visibles dans leur rubrique et dans l'agenda, et le géocodage des mobilisations importées
continue de tourner — la carte sera donc à jour le jour où on la rallume. Marche à suivre pour
rallumer, écrite en commentaire au-dessus de la ligne : remettre `'/cartes'` dans
`CHEMINS_ACTIFS` et rétablir le lien dans `components/layout/Footer.tsx`.

## 5. Une seule adhésion, gratuite

La page `/agir/adherer` proposait trois chemins (gratuit, 12 €, 12 99-coin), puis deux depuis la
mise en sommeil du 99-coin. Elle n'en propose plus qu'un : **l'adhésion est gratuite, sans
barrière financière**. `'/agir/adherer/euros'` rejoint `CHEMINS_SOMMEIL` (`/agir/adherer/t99cp`
y était déjà). Les clés éditoriales du CMS suivent :
`agir.adherer.chemin_gratuit.*` / `chemin_euros.*` → `agir.adherer.adhesion.*`.

Le code de paiement n'est pas touché : il reste en place, protégé par le garde-fou
`paiementReelDisponible()` posé au chantier du 01/08.

---

## 6. Reste à faire — à traiter en premier

- [ ] **Confirmer que la migration `20260815100000` est passée sur le distant.** Elle n'a pas pu
      être vérifiée : le `SUPABASE_ACCESS_TOKEN` du `.env.local` est refusé par l'API de gestion
      Supabase (*HTTP 401 Unauthorized*, jeton expiré ou révoqué), et la table `une_home` ne
      contient à ce jour aucune ligne `sondage`. **Tant que ce n'est pas confirmé, épingler un
      sondage depuis l'administration échouera** : `definir_une_home()` retournerait `false`
      (liste blanche) ou la contrainte rejetterait l'insertion. Renouveler le jeton, puis :
      `node --env-file=.env.local --import tsx scripts/appliquer-sql-distant.ts supabase/migrations/20260815100000_une_home_sondage.sql`
      (la migration est idempotente : la rejouer ne coûte rien).
- [ ] **Déployer.** Le dernier build OpenNext date du **01/08 18h47** : ni ce chantier ni celui
      du 01/08 ne sont en ligne sur `maintenant-le-mouvement.org`. `npm run cf:deploy`.
- [ ] **Épingler les emplacements.** `une_home` ne contient aujourd'hui que trois épinglages
      (article, mobilisation, pétition). Depuis ce chantier, un emplacement non épinglé **reste
      vide** : sans épinglage de sondage et de cagnotte, ces deux blocs n'apparaîtront pas sur
      l'accueil. C'est le comportement voulu, mais il faut le savoir.
- [ ] Hérités du chantier du 01/08, toujours ouverts : poser les clés Stripe
      (`npx wrangler secret put STRIPE_SECRET_KEY` et `PAYMENT_PROVIDER`), et tester de bout en
      bout l'envoi réel des emails Brevo.

## 7. Note d'historique — pourquoi ce chantier partage un commit avec celui du 01/08

Les chantiers du 01/08 (mise en sommeil des rubriques + Stripe réel) et du 15/08 ont été menés
l'un sur l'autre **sans commit intermédiaire**. Ils sont entremêlés au point d'être
inséparables : la page d'accueil livrée le 01/08 importe `UneSondage`, qui appelle
`sondageAlaUne()` — une fonction écrite le 15/08. Un commit « 01/08 » isolé ne compilerait donc
pas. Plutôt que de fabriquer un état intermédiaire qui n'a jamais existé, les deux chantiers
sont réunis dans un seul commit, chacun gardant son manifeste :
`docs/manifests/2026-08-01-mise-en-sommeil-rubriques.md` et ce fichier.

**Leçon pour la suite** : commiter à la fin de chaque chantier. Les chantiers V2.6.122 à V2.6.125
sont restés deux mois non commités, ce qui a aussi rendu leur relecture plus difficile.

## 8. Tests et vérifications

- **1186 tests unitaires verts** (103 fichiers, `npm test`), dont `tests/unit/rubriques.test.ts`
  (les interrupteurs de rubriques) et `tests/unit/home/choisir-a-la-une.test.ts` (la règle
  « rien ne monte tout seul »).
- `tsc --noEmit` : **vert**.
- `biome check .` : **vert** (0 erreur). Deux erreurs de formatage corrigées au passage :
  `app/(public)/agir/adherer/page.tsx` (issue de ce chantier) et
  `infra/cron-twitch/wrangler.jsonc` (retour à la ligne final manquant, antérieur au chantier).
  Les 66 avertissements restants sont antérieurs et inchangés.
- **Non vérifié** : rien n'a été testé en ligne, puisque rien n'est déployé (voir §6).
