# Point de reprise — 2026-06-09 (câblage + mise en ligne + revue)

> Document de reprise pour une nouvelle session. Résume où on en est, ce qui
> est fait, ce qui attend, et comment continuer. La mémoire Claude
> (`projet-maintenant-movement`, `decision-commission-stripe`,
> `deployer-sur-vrai-domaine`) se recharge automatiquement à la session
> suivante ; ce fichier est la version lisible côté humain.

**Branche** : `feature/phase-0-chantier-0.1-deploiement-cloudflare`
**Dernier commit** : `97d9747` (tout est committé, rien en suspens).

---

## 1. État global : le site est EN LIGNE et fonctionnel

Le vrai domaine **https://maintenant-le-mouvement.org** sert le site (Worker
Cloudflare `maintenant-movement`, déployé via OpenNext). `npm run cf:deploy`
met à jour ce Worker = le vrai site en direct.

**Un visiteur peut s'inscrire et se connecter** (auth + email de validation +
captcha + redirections OK).

---

## 2. Fait cette session

### Câblage des services en ligne
- **Cloudflare** : token API + account dans `.env.local`. Déploiement débloqué.
- **Supabase** : clés (URL, anon, service_role) posées en **secrets Worker** →
  serveur connecté à la base en ligne (`/api/health` = ok).
- **Auth Supabase** : `site_url` corrigé (était localhost) → vrai domaine ;
  liste de redirections autorisées mise à jour.
- **Turnstile (anti-robot)** : widget créé, clés en `.env.local` + secrets
  Worker, `*_PROVIDER=cloudflare`. Captcha réel et fiable.
- **Brevo (emails)** : SMTP (emails de compte) OK ; API applicative branchée
  (`BREVO_API_KEY` + `EMAIL_PROVIDER=brevo` en secret Worker). Envoi testé OK.
- **Expéditeur de TOUS les emails** : `benjamin.ball@maintenant-le-mouvement.org`
  (app via `EMAIL_FROM`, et Supabase via `smtp_admin_email`).
- **Stockage images** : `IMAGE_STORAGE_PROVIDER=supabase` (bucket `media`).

### Décision métier
- **Frais Stripe** : **3 % + 0,30 €** sur tous les paiements euros, à la charge
  du payeur (remplace l'ancien 5 %). 99-coin : 0 frais. Implémenté + testé
  (commit V2.6.73). Détail : `docs/manifests/frais-stripe-3pct-030.md`.

### Revue du site par Ben (corrections livrées)
- **Favicon** : icône d'onglet = symbole du logo (coquelicot + poing) (V2.6.75).
- **Connexion mot de passe fiable** : captcha toujours visible, bouton bloqué
  tant que non validé, message clair (V2.6.76).
- **Captcha qui n'apparaissait qu'après rafraîchissement** : corrigé, attente
  active de l'API Cloudflare (V2.6.77).
- **Liens d'auth pointant vers localhost** (lien magique, validation
  d'inscription, reset mot de passe) : corrigé, garde-fou anti-localhost en
  prod dans `config/site.ts:getSiteUrl()` (V2.6.78).

---

## 3. En attente / à faire (par ordre logique)

1. ~~**Vérifier le lien magique**~~ ✅ FAIT (2026-06-09) : Ben a confirmé que le
   nouveau lien magique fonctionne et pointe bien vers le vrai domaine.
2. **Stripe (paiements)** — BLOQUÉ : Ben a un compte
   (`lifebenjaminaeron.ball@gmail.com`) mais le 2FA (passkey « Multipass ») ne
   passe pas. Il a lancé la **réinitialisation 2FA Stripe** → email de suivi
   **sous 12 h**. Dès qu'il récupère l'accès : récupérer les clés `sk_test` →
   implémenter `lib/payments/StripePaymentService.ts` (aujourd'hui un stub) →
   brancher en mode test.
3. **Connexion avec Google** (« Continuer avec Google » ne marche pas) : à
   configurer (Google OAuth côté Google Cloud + Supabase). Ben veut s'en
   occuper « après ».
4. **Lenteur d'arrivée des emails** (Supabase → Brevo SMTP) : à diagnostiquer.
5. **Plan Workers Paid (~5 $/mois)** : recommandé pour la fiabilité (éviter le
   retour de l'erreur 1102 sous charge). Paiement à faire par Ben. Non bloquant
   (les pages répondent actuellement en 200).
6. ~~**Propager le fix « bouton bloqué tant que captcha non validé »**~~ ✅ FAIT
   (2026-06-09, V2.6.80) : propagé aux 29 formulaires restants. Manifest :
   `docs/manifests/v2-6-80-propagation-fix-captcha.md`.
7. **Services encore en stub** : LiveKit (visio), Polygon/99-coin.
8. **Bucket `justificatifs`** (stockage privé) : à créer + règles d'accès.

---

## 4. Comment reprendre (mémo technique)

- **Déployer** (toujours sur le vrai domaine, jamais preview seul) :
  ```bash
  # Piège Windows : supprimer .open-next AVANT chaque build (verrou EPERM).
  # (via PowerShell : Remove-Item .open-next -Recurse -Force)
  cd C:/Users/lilou/projets/maintenant-movement
  export CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' .env.local | cut -d= -f2-)
  export CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' .env.local | cut -d= -f2-)
  npm run cf:deploy
  ```
- **Secrets / clés** : toutes dans `.env.local` (jamais committé). Les secrets
  runtime du Worker sont posés via `wrangler secret put` (Supabase, Turnstile,
  Brevo, EMAIL_FROM, IMAGE_STORAGE_PROVIDER). `NEXT_PUBLIC_*` = figées au build.
- **Config Auth Supabase** (sensible) : modifiable via l'API Management
  (`SUPABASE_ACCESS_TOKEN`), mais le classificateur exige une autorisation
  explicite de Ben pour chaque changement.
- **Paiement** (carte) : Claude ne peut PAS saisir de carte ; Ben fait la
  partie paiement lui-même.

---

## 5. Autre (hors site)

- **Livre « Tout Changer Maintenant »** : dernière version finalisée = **v14**,
  copiée sur le Bureau dans `LIVRE-TCM-v14-FINAL` (PDF + Word). Le fichier
  « v15 supermarkdown » n'est PAS le livre (c'est un plan de finalisation).
