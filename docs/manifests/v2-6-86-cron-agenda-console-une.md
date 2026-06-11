# Manifest : V2.6.86, import quotidien Agenda Militant + console « À la une » + photo article appel

**Date de fin** : 2026-06-11
**Branche** : feature/phase-0-chantier-0.1-deploiement-cloudflare
**Contexte** : suite des demandes de Ben : « l'import quotidien c'est super top », « en admin je puisse mettre ce que je veux à la une », et la photo de foule pour l'article de l'appel du 10 septembre.

## Livré et fonctionnel

### Import quotidien automatique de L'Agenda Militant Indépendant
- [x] `lib/import-agenda/importer-agenda-militant.ts` : portage serveur du script de peuplement, avec les 3 règles dures (à venir uniquement, jamais de passé, jamais sans affiche), idempotent (saute les événements dont l'URL source est déjà dans une description ou dont le slug existe), borné à 8 nouveaux événements par exécution (limite de sous-requêtes du Worker, le surplus passe au lendemain), affiches > 4,5 Mo signalées à traiter à la main.
- [x] `app/api/cron/import-agenda/route.ts` : endpoint GET protégé par le secret `CRON_SECRET` (401 sinon), retourne un rapport JSON (créés, déjà importés, écartés, erreurs).
- [x] `infra/cron-agenda/` : Worker Cloudflare minimal `maintenant-cron-agenda` (cron `30 4 * * *`, soit 6 h 30 à Paris l'été) qui appelle l'endpoint avec le secret. Déployé.
- [x] Secret `CRON_SECRET` posé sur les deux Workers via l'API Cloudflare (piège évité : le pipe PowerShell vers `wrangler secret put` embarquait un retour chariot, secret reposé proprement) et gardé en référence dans `.env.local`.
- [x] **Test en conditions réelles réussi** : 401 sans secret ; avec secret, l'appel a importé 1 nouvel événement publié sur l'AMI dans l'après-midi (« Ci-gît la camaraderie », avec affiche), ignoré 2 déjà importés, écarté les passés.

### Console admin « À la une »
- [x] `/admin/national/une` : un seul écran pour choisir ce qui s'affiche dans les 4 blocs « à la une » de l'accueil (pétition, article Maintenant Médias, mobilisation, cagnotte). Pour chaque emplacement : badge « Automatique (le plus récent) » ou « Épinglage manuel actif », liste des contenus publiés (mobilisations limitées aux À VENIR, triées par date), bouton « Mettre à la une » par ligne (réutilise `BoutonMettreALaUne` et la table `une_home` existantes : mêmes mécanismes que les boutons des fiches).
- [x] Carte « À la une de l'accueil » ajoutée en tête de la console nationale.
- [x] Vérifié en prod : page en ligne, accès anonyme bloqué par l'écran de connexion (aucune fuite).

### Photo de l'article appel du 10 septembre
- [x] La photo aérienne de la foule (Place des Fêtes) fournie par Ben retrouvée dans son export Facebook (c'était sa photo de couverture), téléversée dans le bucket (`peuplement/couverture/appel-10-septembre-foule.jpg`) et posée en couverture de l'article « Appel à soutenir, amplifier et prolonger la mobilisation du 10 septembre ». Vérifié en base.

## Notes pour les chantiers suivants
- Le rapport du cron est visible dans les logs du Worker (`npx wrangler tail maintenant-cron-agenda`) ; en cas de besoin, l'endpoint peut être appelé à la main avec le secret de `.env.local`.
- Si l'AMI publie un jour plus de 8 nouveaux événements avec affiche dans la même journée, le surplus est importé le lendemain (par construction).
- Les types devinés par mots-clés restent éditables par mobilisation dans la console admin.

## Tests
- Unitaires : 1045 verts. Lint : propre (18 warnings préexistants). Typecheck : vert.
- Test bout-en-bout du cron : voir ci-dessus (réel, en production).
