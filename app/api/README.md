# app/api

Route handlers Next.js (webhooks et endpoints serveur).

Au moment de la livraison du squelette technique, ce dossier ne contient pas encore de route. Les mutations passent par des **Server Actions** (cf. `app/.../actions.ts`). Les webhooks externes seront branchés au moment où les services réels seront connectés :

- `stripe/webhook/route.ts` : à câbler au go-live Stripe (sessions Checkout, payouts Connect).
- `brevo/webhook/route.ts` : événements newsletter (désabonnement, bounce).
- `livekit/token/route.ts` : génération de jetons pour les salles Décider.

Tant qu'aucun webhook n'est branché, ce dossier reste vide et c'est intentionnel. Voir `docs/LANCEMENT.md` pour la procédure de câblage.
