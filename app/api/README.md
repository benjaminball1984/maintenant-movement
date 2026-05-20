# app/api

Route handlers Next.js (webhooks et endpoints serveur).

À venir au fil des chantiers :
- `stripe/webhook/route.ts` (chantier 3.3, cagnottes)
- `brevo/webhook/route.ts` (chantier 1.2, validation email)
- `livekit/token/route.ts` (chantier 7.6, salles Décider)

Note : on privilégie les **Server Actions** pour les mutations simples. Ce dossier reste réservé aux webhooks et aux endpoints publics typés.
