# Plan de travail guidé — Maintenant! (de la base au go-live)

> Ce fichier est ton plan de travail, Claude Code. Lis-le en entier et suis-le à la lettre. La posture de guide pas à pas (section 2) prime sur tout le reste.

---

## 1. Contexte

Tu as livré une phase 12 de polish (nettoyage, design, tests responsive, CSP, doc, `CONTENUS-A-ARBITRER.md`), c'est bien. Mais le bloc 1 de la revue de code n'a pas été fait :

- les migrations ne sont pas appliquées sur la vraie base Supabase,
- le bug critique d'inscription (INSERT `personne` bloqué par la RLS juste après le `signUp`) n'est pas corrigé,
- aucun flux réel n'a jamais été testé (tout tourne en mock).

On va maintenant aller jusqu'au bout ensemble, dans l'ordre, jusqu'à la mise en ligne.

---

## 2. Posture impérative (le plus important)

La personne avec qui tu parles (Lilou/Ben) n'est PAS développeuse. Tu es son guide pas à pas. Règles absolues :

- **UNE seule action à la fois.** Jamais un bloc dense de commandes enchaînées.
- Pour chaque étape :
  1. explique en une phrase simple ce qu'on fait et pourquoi ;
  2. si c'est du code ou une commande locale, fais-la toi-même et montre le résultat ;
  3. si c'est à Lilou/Ben de faire quelque chose (récupérer une clé dans un dashboard, cliquer quelque part, fournir un texte, valider à l'écran), guide précisément : « Copie ceci : [bloc] », « Va dans [tel outil] », « Colle (clic droit) puis Entrée » ou « Clique sur [tel bouton] », puis « Dis-moi ce que tu vois ».
- Après chaque étape qui dépend de Lilou/Ben, **ARRÊTE-TOI et attends sa réponse** avant de continuer. Ce n'est pas un marathon en autonomie, c'est un dialogue.
- Si une étape échoue, on s'arrête, on comprend, on corrige avant d'avancer.

### Ce que tu fais toi-même / ce que tu demandes

- **Toi** : le code, les commandes locales (git, npm, supabase CLI), les fichiers. Tu montres le résultat.
- **Lilou/Ben** : récupérer clés et accès dans les dashboards externes (Supabase, Brevo, Stripe, Cloudflare), cliquer dans ces interfaces, fournir les contenus éditoriaux et les données de l'association, valider visuellement à l'écran.

---

## 3. Le parcours (phases séquentielles, point d'étape après chaque phase)

Commence par me donner une vue d'ensemble courte de ces phases, puis attaque la phase A étape par étape.

### Phase A — Faire vivre la base et lever le bloquant

- **A1.** Corrige le bug d'inscription en code (INSERT `personne` via le client admin service_role après le `signUp`). Tu fais ça seul, tu me montres.
- **A2.** Vérifie la connexion à mon projet Supabase (`qehmwcozanujotexnsqw`) : guide-moi pour vérifier ou fournir les clés dans `.env.local` et le token d'accès.
- **A3.** Applique les migrations (`supabase db push`), en m'expliquant, une étape à la fois.
- **A4.** Régénère les types TypeScript depuis la base réelle.
- **A5.** Guide-moi pour configurer l'envoi d'emails (Brevo SMTP dans Supabase Auth) afin que la validation d'email fonctionne.
- **A6. LE TEST** : on lance le site en local sur la vraie base, je crée un compte, je valide l'email, je crée puis je signe une pétition. Tu me guides, je te dis ce que je vois. C'est le moment de vérité : si ça marche, on continue ; sinon on debug avant tout le reste.

### Phase B — Sécurité

Audit des fonctions `SECURITY DEFINER` (search_path figé), test des RLS en conditions réelles, scan de fuite de secrets, vérification que `.env.local` n'est pas committé. Wallet T99CP : reste en MOCK, ne branche rien de réel sans mon accord explicite.

### Phase C — Dette d'architecture restante

Ce que la phase 12 n'a pas couvert : le N+1 des compteurs, la protection des clés étrangères polymorphes. Évalue ce qui reste vraiment à faire.

### Phase D — Contenus et données manquantes

Reprends `docs/CONTENUS-A-ARBITRER.md`. Demande-moi, un bloc à la fois, les contenus éditoriaux, les données de l'association (RNA, adresse, DPD), le CSV des communes, et intègre-les au fur et à mesure.

### Phase E — Services externes réels

Guide-moi pour fournir et brancher les clés live (Brevo, Stripe avec webhook réel, Turnstile, Supabase). Mets en place le webhook Stripe réel pour les paiements euros.

### Phase F — Déploiement Cloudflare + crons + migration Base44

Prépare et vérifie la config Cloudflare Pages, guide-moi pour un déploiement preview, teste la CSP en réel, configure les crons, et guide-moi pour la migration des données Base44 (946 membres, 9000 newsletter, 16000 signataires) en dry-run d'abord.

### Phase G — Mise en ligne

Bascule en prod, DNS du domaine, vérifications finales.

---

## 4. Garde-fous permanents

- Le repo est **PUBLIC** : aucun secret dans le code, jamais. Tout dans `.env.local`.
- Wallet T99CP en **mock** jusqu'à audit et accord explicite.
- Hébergement : **Cloudflare Pages**.
- Le pack `docs/specs/` prime sur tout le reste. Pour chaque point « à confirmer » de la revue, revérifie la spec avant d'agir.

---

## 5. Commence maintenant

1. Confirme-moi en deux lignes que tu as compris la posture de guide pas à pas (une action à la fois, tu m'attends).
2. Donne-moi la vue d'ensemble des phases.
3. Attaque A1 (le fix d'inscription, que tu fais seul) et montre-moi le résultat.
