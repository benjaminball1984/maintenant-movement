# app/(membre)

Routes accessibles aux personnes connectées. Implémenté au **chantier 1.3** et enrichi par les chantiers suivants :

- `profil/` : tableau de bord et 7 onglets thématiques (informations, communes, notifications, contributions, wallet, confidentialité, sécurité).
- `profil/dashboard/` : vue d'ensemble.
- `profil/informations/` : édition des informations personnelles.
- `profil/communes/` : appartenances aux communes.
- `profil/contributions/` : historique des pétitions signées, dons, services rendus.
- `profil/wallet/` : portefeuille 99-coin.
- `profil/notifications/` : préférences de notifications.
- `profil/confidentialite/` : visibilité par champ, export ZIP, suppression différée 30 jours.
- `profil/securite/2fa/` : enrôlement TOTP optionnel (Supabase MFA).

L'accès est protégé par `getSessionOuRediriger` (`lib/auth/session.ts`).
