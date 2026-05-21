# app/(auth)

Routes d'authentification publiques. Implémenté au **chantier 1.2** :

- `connexion/` : connexion par email + mot de passe, magic link, OAuth (selon providers branchés).
- `inscription/` : inscription email + mot de passe avec Cloudflare Turnstile et validation email.
- `verifier-email/` : page d'attente après inscription, instructions et lien de renvoi.
- `actions.ts` : Server Actions partagées (connexion, inscription, vérification, déconnexion).
- `layout.tsx` : layout commun aux pages d'auth (centrage, branding minimal).

Le rappel d'envoi du magic link et les flux OAuth GAFAM / éthiques se câblent dans `lib/auth/` et `lib/email/`.
