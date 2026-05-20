# lib/

Logique partagée du site. Organisation :

- `supabase/` : trois clients distincts (server, client, admin) — chantier 1.1.
- `email/` : EmailService (Brevo) avec mock par défaut — pattern adapter.
- `stripe/` : PaymentService (Stripe Checkout + Connect) avec mock — pattern adapter.
- `t99cp/` : T99CPService (Polygon) avec mock — pattern adapter.
- `livekit/` : LiveKitService (self-hosted) avec mock — pattern adapter.
- `turnstile/` : TurnstileService (Cloudflare) avec mock — pattern adapter.
- `brevo/` : helpers Brevo spécifiques (newsletter, tags) — chantier 1.2.
- `permissions/` : helpers RLS et droits métier — chantiers 1.3+ et 9.1.
- `i18n/` : configuration `next-intl` (français par défaut).
- `vocabulaire.ts` : lexique des termes fixés (cf. `docs/specs/03_VOCABULAIRE.md`).
- `utils.ts` : helpers transverses minuscules.

**Règle pattern adapter** : tous les services externes ont une interface, un mock par défaut, une implémentation réelle. Switch via variable d'env `*_PROVIDER`. Le site fonctionne à 100 % en local sans clé d'API.
