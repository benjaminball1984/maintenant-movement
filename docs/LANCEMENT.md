# Runbook de lancement — Maintenant!

Ce document liste les étapes ordonnées pour passer du code local à un site en production sur `maintenant-le-mouvement.org`. Il est destiné à Lilou/Ben et à l'équipe technique d'astreinte.

Pour le détail de chaque chantier livré, voir `docs/manifests/`.

---

## 0. Prérequis externes à valider

Avant tout, vérifier qu'on a :

- [ ] Accès **Supabase** (projet créé, région Francfort, 3 clés en main : URL, ANON, SERVICE_ROLE).
- [ ] Accès **Cloudflare** (compte avec Pages activé, accès DNS de `maintenant-le-mouvement.org`).
- [ ] Compte **Brevo** (clé SMTP + clé API pour newsletter).
- [ ] Compte **Stripe** (clés `sk_live_...` + Stripe Connect activé pour les cagnottes).
- [ ] Compte **Anthropic** (clé API pour le journal-affiche, chantier 7.3 ultérieur).
- [ ] Serveur **LiveKit** auto-hébergé (chantier 7.6 ultérieur).
- [ ] Serveur **AzuraCast** auto-hébergé (chantier 7.2).
- [ ] Compte **Cloudflare Turnstile** (site keys + secret).
- [ ] Compte **Sentry** en mode anonymisé.

---

## 1. Schéma BDD

Pousser toutes les migrations 1.1 → 033 dans Supabase :

```sh
supabase db push
```

Vérifier dans Supabase Studio que les 33 migrations sont passées et que toutes les tables ont RLS activée. Lancer le script de test RLS :

```sh
npx tsx scripts/tester-rls.ts
```

---

## 2. Import des données

### 2.1 Communes pré-créées (2100-2300 communes)

Quand Lilou/Ben fournit le CSV :

```sh
npx tsx scripts/import-communes.ts data/communes.csv
```

### 2.2 Migration Base44 (946 membres + 9k newsletter + 16k signataires)

1. Export depuis l'admin Base44 vers `data/base44/{membres,newsletter,petitions,signatures}.csv`.
2. Dry-run du rapport :
   ```sh
   npx tsx scripts/migrer-base44.ts data/base44/
   ```
3. Vérifier que les comptages correspondent (~946 / ~9000 / ~16000).
4. Lancer la création effective des `auth.users` via Admin API (script supplémentaire à écrire en complément, qui appelle `supabase.auth.admin.createUser` pour chaque membre + envoi du magic link).
5. Pousser les 9000 emails newsletter dans Brevo avec le tag `origine: base44-newsletter`.

---

## 3. Variables d'environnement de production

Dans Cloudflare Pages → Settings → Environment Variables :

```dotenv
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # secret

# Brevo
EMAIL_PROVIDER=brevo
BREVO_API_KEY=...  # secret

# Stripe
PAYMENT_PROVIDER=stripe_live
STRIPE_SECRET_KEY=sk_live_...  # secret
STRIPE_WEBHOOK_SECRET=...  # secret
STRIPE_TRESORERIE_ACCOUNT_ID=acct_...
STRIPE_MARCHE_ACCOUNT_ID=acct_...

# Turnstile
TURNSTILE_PROVIDER=cloudflare
TURNSTILE_SECRET_KEY=...  # secret

# AzuraCast (chantier 7.2)
AZURACAST_FLUX_URL=https://...
AZURACAST_METADATA_URL=https://.../api/nowplaying/...

# T99CP
T99CP_NETWORK=polygon_mainnet
T99CP_TRESORERIE_WALLET_ADRESSE=0x...

# LiveKit (chantier 7.6 ultérieur)
LIVEKIT_PROVIDER=livekit
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...  # secret

# Anthropic (chantier 7.3 ultérieur)
ANTHROPIC_API_KEY=...  # secret
```

---

## 4. Build et déploiement

```sh
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Si tout est vert, déployer via Cloudflare Pages :

```sh
npx @cloudflare/next-on-pages
# puis suivre les instructions pour pousser l'artefact via la GitHub integration
```

---

## 5. DNS

Pointer `maintenant-le-mouvement.org` vers Cloudflare Pages.
Configurer aussi les sous-domaines : `radio.`, `livekit.`, `azuracast.` selon les besoins.

---

## 6. Crons Cloudflare Workers

Programmer les jobs suivants (Cloudflare Workers Cron Triggers ou Pages Functions + scheduled) :

| Nom | Fréquence | Server Action appelée |
|---|---|---|
| Crédit SEL | toutes les heures | `crediterPrestationsEnAttente` |
| Expirer annonces marché | quotidien à 04:00 | (à implémenter — passe `produit_marche.statut` à `expire` après 3 mois d'inactivité) |
| Relance adhésions | quotidien à 09:00 | `envoyerRelancesAdhesion(14)` |
| Transition moments | toutes les heures | (à implémenter — `annonce → en_cours → termine`) |
| Récap mardi | hebdo mardi 18:00 | (à implémenter — envoi groupé via EmailService) |
| Newsletter vendredi | hebdo vendredi 18:00 | (à implémenter — envoi groupé Brevo avec médias publiés sur la semaine) |

---

## 7. Monitoring

- **Sentry** : configurer le projet avec scrubbing des données personnelles (`beforeSend` qui retire emails, IPs, noms).
- **Logs Cloudflare** : activer la conservation 7 jours.
- **Supabase logs** : vérifier qu'aucune fuite RLS n'apparaît en erreurs.

---

## 8. Astreinte

Tableau partagé (Notion ou équivalent) avec :
- Rotation des personnes d'astreinte.
- Numéro d'appel d'urgence (téléphone d'astreinte).
- Procédure d'escalade.

---

## 9. Post-lancement

- [ ] Annoncer le lancement sur les réseaux + newsletter.
- [ ] Surveiller les métriques pendant les 48 premières heures.
- [ ] Récolter les premiers signalements via la page contact et la console modération.
- [ ] Programmer un pentest interne dans le mois suivant le lancement.

---

## Annexe : checklist pré-lancement

- [ ] Toutes les migrations passées.
- [ ] Toutes les variables d'env configurées en prod.
- [ ] Build vert localement et en CI.
- [ ] 245 tests unitaires verts.
- [ ] E2E Playwright vert.
- [ ] Lighthouse perf mobile ≥ 90.
- [ ] CSP testée (pas d'erreur console).
- [ ] RLS testée par script (`scripts/tester-rls.ts`).
- [ ] Backup BDD effectif (1er dump réalisé).
- [ ] Politique de confidentialité à jour (mention migration Base44).
- [ ] Mentions légales à jour (adresse, RNA, DPD).
- [ ] DNS pointé.
- [ ] Monitoring activé.
- [ ] Astreinte en place.

Quand toutes les cases sont cochées : on peut lancer.
