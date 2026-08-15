# Manifeste — Mise en sommeil des rubriques et branchement de Stripe

**Date** : 01/08/2026
**Demande de Lilou/Ben** : « ne garder que les fonctionnalités cagnotte, média Maintenant,
mobilisation et pétition, afin qu'il n'y ait pas l'effet déceptif d'arriver sur un site et de
naviguer sans rien trouver, ou de trouver des espaces en construction. »
Complétée en cours de séance par : garder aussi les **sondages**, l'**adhésion** et la
**newsletter**.

---

## 1. Ce qui est allumé

Menu principal, dans cet ordre (du geste le plus facile au plus contemplatif) :

| Rubrique | Adresse | Contenu au 01/08 |
|---|---|---|
| Pétitions | `/mobiliser/petitions` | ✅ publié |
| Mobilisations | `/mobiliser/mobilisations` | ✅ publié |
| Sondages | `/s-informer/sondages` | ✅ publié |
| Maintenant Médias | `/s-informer/media` | ✅ 4 articles |

Plus : bouton **Adhérer** en haut à droite, bloc **newsletter** en bas de chaque page,
`/agenda`, `/cartes`, `/recherche`, `/contact`, `/mentions-legales`, `/confidentialite`,
les parcours de compte et l'administration.

## 2. Ce qui est endormi

Tout est listé dans `config/rubriques.ts`, chaque ligne portant sa raison. En résumé :
l'espace S'entraider entier (~30 pages), le réseau social, la radio, le journal, Décider,
les campagnes, les communes libres, les fédérations, les moments solidaires, l'espace
Comprendre, les organisations, `/a-propos`, `/co-construire`, le chemin d'adhésion en
99-coin, le simulateur de paiement `/dons/mock`, la page de démonstration des composants,
et sept onglets de l'espace membre (ramené de 11 à 4).

**Les cagnottes ont été endormies en fin de chantier** : vérification faite en ligne, aucune
cagnotte n'est publiée et l'encaissement n'était pas branché. La rubrique aurait été la seule
impasse du site. Décision de Lilou/Ben : rallumer à la première cagnotte publiée. La marche à
suivre est écrite en commentaire au-dessus de `RUBRIQUES_MENU`.

**Rien n'a été supprimé** : aucun fichier de page effacé, aucune table ni colonne touchée
(doctrine de greffe, CLAUDE.md §0.3). Rallumer une rubrique = déplacer une ligne entre deux
listes de `config/rubriques.ts`.

## 3. Mécanique

Une seule source de vérité, `config/rubriques.ts`, lue par cinq endroits :

- `middleware.ts` — renvoie toute adresse endormie vers l'accueil en **307** (temporaire :
  la rubrique dort, elle n'est pas supprimée ; on ne veut pas qu'un moteur de recherche
  grave la redirection).
- `components/layout/Header.tsx` — menu à plat.
- `components/layout/Footer.tsx` — colonne « Rubriques ».
- `lib/recherche-globale.ts` — un résultat vers une page endormie est écarté.
- `lib/carte/donnees.ts` — un point de carte vers une fiche endormie est écarté.
- `app/sitemap.xml/route.ts` — le plan du site n'annonce plus de page endormie à Google.

Les trois derniers filtrent **sur l'adresse**, pas sur le type : rallumer une rubrique la
remet automatiquement dans la recherche, sur la carte et dans le sitemap.

Règle de résolution : le préfixe le plus long gagne (`/mobiliser` dort, mais
`/mobiliser/petitions` reste allumé). Ce qui n'est listé nulle part reste allumé — on
n'éteint jamais par accident. 10 tests unitaires verrouillent cette règle
(`tests/unit/rubriques.test.ts`).

## 4. Stripe — le vrai sujet trouvé en route

**Constat** : `StripePaymentService` était un stub qui levait « non implémenté », et aucune
clé Stripe n'existait en ligne. Le site tournait donc sur `MockPaymentService` : un don
« confirmé » s'enregistrait en base **sans qu'un centime ne bouge**, via une page
`/dons/mock/…` à deux boutons. Plus grave qu'une page vide — quelqu'un pouvait croire avoir
donné.

**Fait** :

1. `StripePaymentService` réellement écrit (SDK `stripe` 22.4, client HTTP `fetch` imposé par
   Cloudflare Workers, version d'API épinglée). Checkout, vérification de paiement, et
   onboarding Connect Express.
2. Garde-fou `paiementReelDisponible()` (`lib/payments/disponibilite.ts`, module sans aucune
   dépendance pour être importable depuis le middleware) : tant que `PAYMENT_PROVIDER` n'est
   pas `stripe_test`/`stripe_live` **et** que `STRIPE_SECRET_KEY` n'est pas posée, les
   interfaces de paiement se masquent au lieu de retomber sur le simulateur.
3. Ce garde-fou agit dans le middleware (fermeture nette, avant tout rendu) **et** dans les
   pages (carte « 12 € » masquée, formulaire de don masqué).

**Reste à faire par Lilou/Ben** : poser les deux clés (voir §6). Le paiement s'allumera seul.

## 5. Autres changements

- **Mentions de futur supprimées** : boutons « OAuth éthique (bientôt) » de la page de
  connexion, encart « Bientôt ici aussi » de Mes contributions, « la rédaction publiera
  bientôt » sur Médias, colonne « Sur les réseaux » du pied de page (qui n'annonçait que des
  comptes à venir).
- **Ton des états vides** : plus jamais « reviens bientôt » (qui dit que le site dort), mais
  une invitation à agir.
- **Après une signature ou un don** : proposition d'adhérer (le tunnel pointait vers
  `/agir/depuis-petition`, aujourd'hui endormie).
- **Newsletter** : nouveau bloc en bas de chaque page publique
  (`components/layout/BlocNewsletter.tsx` + `app/actions/newsletter.ts`), en plus de la case
  à cocher au moment de signer. L'adresse part chez Brevo, rien n'est dupliqué en base.
- **`/cartes` et `/carte`** fusionnées : `/cartes` **est** la carte (l'index de trois cartes
  n'aurait plus proposé qu'une destination).
- **Administration** : modération ramenée à 5 files, console nationale à 11 entrées.
- **Accueil** : une une par rubrique allumée, dans l'ordre du menu.

## 6. À faire par Lilou/Ben pour activer le paiement

Deux commandes, dans le dossier du projet. Chacune demande la valeur ensuite : la clé est
tapée dans le terminal, elle n'apparaît pas dans l'historique et personne d'autre ne la voit.

```bash
npx wrangler secret put STRIPE_SECRET_KEY
```

```bash
npx wrangler secret put PAYMENT_PROVIDER
```

Valeur attendue pour la seconde : `stripe_test` pour essayer avec des cartes de test,
`stripe_live` pour encaisser vraiment. Puis redéployer :

```bash
npm run cf:deploy
```

## 7. Vérifications faites

- 1185 tests unitaires verts (103 fichiers), dont 15 nouveaux sur les interrupteurs et le
  garde-fou de paiement.
- `tsc --noEmit` sans erreur, Biome sans erreur (8 avertissements antérieurs au chantier).
- Build Next.js réussi (157 pages).
- **En ligne, sur `maintenant-le-mouvement.org`** : les 12 adresses gardées répondent 200 ;
  les 16 adresses endormies renvoient 307 vers l'accueil ; la carte « 12 € » est absente de
  la page d'adhésion ; `/agir/adherer/euros` renvoie vers `/agir/adherer` ; les 4 unes de
  l'accueil affichent du contenu réel ; aucun état vide sur l'accueil.

## 8. Écarts et points ouverts

- **Compteurs** : Lilou/Ben a corrigé les chiffres que j'avais cités (10 631 newsletter,
  470 membres, 17 747 signataires). Ces compteurs se lisent directement en base, aucun code
  n'était en cause. Petit écart non tranché : le message parlait de « 10747 signataires »
  alors que la capture affichait 17 747 — c'est la capture qui a été retenue.
- **Emails Brevo** : les clés sont bien présentes en ligne, mais l'envoi réel n'a pas été
  testé de bout en bout dans ce chantier. À confirmer avant de compter sur les emails de
  confirmation.
- **Une « sondage »** : non épinglable par l'administration (la table `une_home` n'accepte
  que quatre emplacements). On prend le sondage ouvert le plus récent. Une migration serait
  nécessaire pour l'épinglage — non demandée, non faite.
