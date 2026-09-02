# Manifest — V2.6.134 : appel « Faisons Front par la Rue ! » + signature au nom d'une organisation

**Date de fin** : 2026-09-02
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Commit final** : (voir `git log`)
**Durée approximative** : 1 session Claude Code

Demande de Lilou/Ben, en trois points : (1) mettre en ligne le texte d'appel
« Faisons Front par la Rue ! », (2) permettre de le signer au nom d'une
organisation, (3) vérifier que tout fonctionne.

---

## Livré et fonctionnel

- [x] **Le texte d'appel est en ligne**, publié, à l'adresse
      `/mobiliser/petitions/faisons-front-par-la-rue`. Texte enregistré **mot pour
      mot**, sans reformulation — seules les deux coquilles signalées plus bas
      ont été corrigées, sur demande. Fichier de contenu rejouable :
      `scripts/sql/appel-faisons-front-par-la-rue.sql`.

- [x] **Un appel est une pétition, avec un autre habillage.** Migration
      `20260902100000_signature_organisation_et_appel.sql` : deux colonnes
      ajoutées à `petition`, `est_appel` (booléen) et `propose_par` (auteur
      collectif). Quand `est_appel` est vrai, la fiche affiche « Appel ouvert à
      la signature » au lieu de « Pétition à X », « Texte proposé par la
      Coordination nationale Bloquons Tout » sous le titre, un décompte simple
      au lieu de la jauge d'objectif, et le bouton dit « Signer l'appel ».
      **Aucune pétition existante n'est modifiée** : `est_appel` vaut `false`
      par défaut, tout leur affichage est inchangé (vérifié sur `/cuba`).

- [x] **Signature au nom d'une organisation**, sur l'appel comme sur n'importe
      quelle pétition. La fenêtre de signature propose deux onglets : « En mon
      nom » / « Au nom d'une organisation ». Le second ajoute : nom de
      l'organisation (obligatoire), type (obligatoire — assemblée, collectif,
      syndicat, organisation : les quatre familles nommées par l'appel
      lui-même), territoire (optionnel), fonction de la personne qui signe
      (optionnel), et une case « le nom de l'organisation peut figurer
      publiquement », cochée d'office.
      Fichiers : `components/modales/ModaleSignaturePetition.tsx`,
      `lib/validations/petition.ts`, `lib/messages-validation.ts`,
      `app/(public)/mobiliser/petitions/actions.ts`.

- [x] **Liste publique des organisations signataires**, sous le texte, groupée
      par famille (Assemblées / Collectifs / Syndicats / Organisations), avec le
      territoire quand il est renseigné. Elle s'affiche toujours sur un appel,
      même vide, avec un message qui explique que les organisations peuvent
      signer. Composant `components/petitions/ListeOrganisationsSignataires.tsx`.
      **Aucune donnée personnelle n'y transite** : la fonction SQL
      `signataires_organisations` ne renvoie que nom, type, territoire et date.

- [x] **Anti-doublon adapté.** L'ancienne règle (« une adresse email ne signe
      qu'une fois ») est conservée à l'identique pour les signatures
      individuelles. Pour les organisations, l'unicité porte sur le **nom de
      l'organisation** (insensible à la casse et aux espaces) : une même
      personne peut donc signer en son nom propre **puis** au nom de son
      syndicat, ce qui était bloqué avant.

- [x] **Export CSV des signatures d'une pétition ou d'un appel**, admin
      seulement : `/admin/petitions/<slug>/signatures.csv`, avec un lien depuis
      `/admin/petitions`. Il porte le type de signataire, l'organisation (nom,
      type, territoire, accord d'affichage), la fonction, et le contact de la
      personne. Sans lui, les organisations signataires étaient enregistrées
      mais irrécupérables par l'équipe.

- [x] **Tous les textes affichés sont éditables** depuis l'admin (directive
      §0bis.8) : nouvelles clés CMS `petitions.fiche.preheader_appel`,
      `propose_par_amorce`, `cta_signer_appel`, `organisations_titre`,
      `organisations_vide`, `compteur_appel_signataires`,
      `compteur_appel_signataire_singulier`, `compteur_appel_organisations`, et
      les six messages de validation `validation.petition.organisation*`.

## Livré partiellement

- [ ] **Les libellés de la fenêtre de signature** (« Je signe », « Au nom d'une
      organisation », etc.) sont dans le composant, surchargeables par le prop
      `libelles`, mais **aucun chargeur CMS n'est branché sur ce composant** —
      c'était déjà le cas avant ce chantier pour tous ses libellés. Les
      modifier demande donc encore une intervention dans le code. À traiter
      globalement pour cette modale, pas seulement pour les nouveaux champs.

## Non livré (et pourquoi)

- [ ] **Adresse courte pour l'appel** (type `/appel`) : non demandée, non faite.
      L'adresse actuelle est `/mobiliser/petitions/faisons-front-par-la-rue`.
      Si Lilou/Ben la veut plus courte pour la diffusion, c'est une redirection
      à ajouter — dire lequel.

## Mise en ligne

- [x] **Déployé sur maintenant-le-mouvement.org** le 02/09/2026, sur demande
      explicite de Lilou/Ben (`npx opennextjs-cloudflare deploy`, version
      `351934f1`). Vérifié en ligne : surtitre « Appel ouvert à la signature »,
      auteur collectif, photo, texte corrigé, et la fenêtre de signature qui
      bascule bien sur les champs d'organisation.

      **Piège constaté** : pendant environ une minute après le déploiement, le
      domaine servait encore l'ANCIENNE page, alors que l'adresse
      `*.workers.dev` servait déjà la nouvelle. Les en-têtes annoncent pourtant
      `no-cache`. Ne pas conclure à un échec : recharger, ou vérifier avec un
      paramètre bidon dans l'adresse.

## Contenus à arbitrer

- [ ] **`destinataire` de l'appel** : le champ est obligatoire en base et sert
      d'ordinaire à dire qui on interpelle. Un appel n'interpelle personne : j'y
      ai mis « Aux assemblées, collectifs, syndicats et organisations », **qui
      n'est jamais affiché publiquement** (il ne sert plus qu'en admin et dans
      l'export). À changer dans `/admin/petitions` si le mot ne convient pas.

- [ ] **`objectif` de l'appel** : fixé à 100, le minimum autorisé, et **jamais
      affiché** — un appel ne montre pas de jauge, seulement son nombre de
      signataires. Je n'ai pas inventé d'objectif chiffré public. Si Lilou/Ben
      veut afficher une jauge avec un cap (« 500 organisations »), c'est une
      décision politique à prendre, et ça se recode en peu de temps.

- [x] **Les deux coquilles du texte source ont été corrigées**, sur demande
      explicite de Lilou/Ben le 02/09/2026, et elles seules : le point manquant
      avant « Avec une réponse commune », et la majuscule au milieu de
      « Mobilisons-nous Le 20 septembre ». Aucun autre mot n'a bougé.

- [x] **Photo de couverture posée** (fournie par Lilou/Ben le 02/09/2026) :
      vue aérienne d'un rassemblement. Téléversée dans le bucket Supabase
      `media`, chemin `petitions/couverture/faisons-front-par-la-rue.jpg`.
      Elle est affichée entière (`object-contain` sur fond flouté), donc aucun
      recadrage ne coupe l'image, et elle sert aussi de visuel de partage sur
      les réseaux sociaux.

## Décisions techniques prises

- **Un appel n'est pas un nouvel objet.** Le CDC V2 ne prévoit aucun espace
  « appels » ; en créer un aurait été inventer de l'architecture (§3). J'ai donc
  qualifié l'objet existant avec un drapeau `est_appel`, ce qui fait hériter
  l'appel de toute la machinerie déjà éprouvée : modération, compteur,
  commentaires, partage, mise à la une, export, page admin.

- **Les quatre familles d'organisations viennent du texte lui-même**
  (« ouvert à la signature des assemblées, collectifs, syndicats et
  organisations ») : rien d'inventé, ni catégorie supplémentaire, ni
  hiérarchie.

- **La signature d'organisation demande quand même l'identité d'une personne.**
  Une organisation signe toujours par la main de quelqu'un·e, et c'est cette
  personne qu'on recontacte. Ses coordonnées ne sont jamais affichées ; seul le
  nom de l'organisation l'est.

- **Migration strictement additive** (doctrine de greffe §0.3) : aucune colonne
  ni table supprimée, aucune donnée réécrite. Le seul index remplacé
  (`signature_petition_unique_email`) est reconstruit à l'identique pour les
  signatures individuelles, et complété d'un second pour les organisations.

## Tests

- **Unitaires** : 1193 tests, tous verts (`npx vitest run`), dont **7 nouveaux**
  sur la validation d'une signature d'organisation (`tests/unit/validations/petition.test.ts`).
- **E2E Playwright** : `tests/e2e/petitions.spec.ts`, projet desktop —
  **5 passés**, dont **2 nouveaux** sur l'appel (habillage, bascule du
  formulaire vers l'organisation). Chromium a dû être installé sur le poste
  (`npx playwright install chromium`) : il manquait.
- **Lint et typecheck** : verts (`npx tsc --noEmit`, `npx biome check`) sur tous
  les fichiers touchés.
- **Parcours réel en local**, dans le navigateur, sur le serveur de
  développement (Turnstile passé en `mock` le temps du test, puis remis sur
  `cloudflare` — la clé Cloudflare ne valide pas sur `localhost`) :
  1. signature d'une organisation avec tous les champs → enregistrée, vérifiée
     ligne par ligne en base ;
  2. organisation sans nom ni type → refusée, avec les deux messages d'erreur ;
  3. même organisation avec une autre casse et d'autres espaces → refusée
     (« Cette organisation a déjà signé. ») ;
  4. la même personne signant ensuite **en son nom** → acceptée (le cas que
     l'ancienne règle bloquait) ;
  5. deuxième signature individuelle avec le même email → refusée ;
  6. réouverture de la fenêtre → revient bien sur « En mon nom », champs vidés ;
  7. compteur et liste publique à jour après rechargement ;
  8. `/mobiliser/petitions` : l'appel s'affiche en tête, les cinq pétitions
     existantes gardent leur jauge et leur libellé « Pétition à … » ;
  9. `/mobiliser/petitions/cuba` : aucune régression ;
  10. export `/admin/petitions/<slug>/signatures.csv` sans session → 403.
- **Nettoyage** : les 3 signatures de test et les 2 profils unifiés créés
  pendant ces essais ont été supprimés de la base. L'appel repart à 0 signataire.

## Deux tests E2E rouges, antérieurs à ce chantier

Vérifié en remisant mes modifications (`git stash`) : ces deux-là échouaient
déjà avant, ils ne viennent pas de ce chantier et n'ont pas été touchés.

- `fiche pétition introuvable › renvoie une 404` : en mode développement, une
  page inexistante renvoie 200 au lieu de 404. À regarder sur un build de
  production avant de conclure.
- `/admin/moderation/petitions redirige sans auth` : la redirection n'aboutit
  pas à l'adresse attendue par le test.

## Notes pour les chantiers suivants

- La signature d'organisation est ouverte sur **toutes** les pétitions, pas
  seulement sur l'appel (prop `autoriseOrganisation`, vrai par défaut). Si
  Lilou/Ben préfère la réserver aux appels, c'est un seul mot à changer dans
  `app/(public)/mobiliser/petitions/[slug]/page.tsx`.
- Une organisation qui décoche l'affichage public est **comptée** mais pas
  **nommée** : le compteur passe par `nombre_signatures_organisations`, la liste
  par `signataires_organisations`. Ne pas confondre les deux.
- `types/database.ts` a été complété à la main pour les nouvelles colonnes, et
  au passage pour `compte_immediatement` et `snapshot` qui manquaient depuis la
  migration du 02/06.
