/**
 * Configure les modèles d'email d'authentification Supabase (chantier 13.1).
 *
 * Pourquoi ce script existe
 * -------------------------
 * Le flux d'authentification côté serveur (Next.js App Router) repose sur
 * des liens d'email au format `token_hash` + `type`, vérifiés par
 * `verifyOtp` dans `app/auth/callback/route.ts`. Or, par défaut, Supabase
 * envoie des liens `{{ .ConfirmationURL }}` qui passent par son endpoint
 * `/auth/v1/verify` et renvoient le jeton dans le fragment d'URL (`#...`),
 * illisible côté serveur. Résultat : le callback ne voit aucun jeton et
 * rejette la connexion (« code-manquant »).
 *
 * Ce script réécrit les modèles concernés pour pointer directement sur
 * notre route de callback avec `token_hash`. La partie `{{ .RedirectTo }}`
 * réutilise l'URL fournie par l'application (cf. `getSiteUrl()`), donc le
 * même modèle fonctionne en local ET en production sans modification.
 *
 * Idempotent : ré-exécuter ce script ne fait que re-poser les mêmes modèles.
 *
 * Usage :
 *   node scripts/configure-supabase-email-templates.mjs
 *
 * Pré-requis dans `.env.local` :
 *   - NEXT_PUBLIC_SUPABASE_URL   (pour en déduire le `project ref`)
 *   - SUPABASE_ACCESS_TOKEN      (jeton d'accès personnel, API de gestion)
 */

import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const accessToken = env.SUPABASE_ACCESS_TOKEN;
const ref = (env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\./) ?? [])[1];

if (!accessToken || !ref) {
  console.error(
    '[email-templates] Manque SUPABASE_ACCESS_TOKEN ou NEXT_PUBLIC_SUPABASE_URL dans .env.local.',
  );
  process.exit(1);
}

/**
 * Les modèles. Chaque lien réutilise `{{ .RedirectTo }}` (déjà porteur du
 * paramètre `next` posé par l'application) et y ajoute `token_hash` + `type`.
 */
const config = {
  mailer_subjects_confirmation: 'Confirme ton inscription à Maintenant!',
  mailer_templates_confirmation_content: `<h2>Confirme ton inscription à Maintenant!</h2>
<p>Bonjour,</p>
<p>Pour activer ton compte, clique sur le lien ci-dessous :</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=signup">Confirmer mon adresse email</a></p>
<p>Si tu n'es pas à l'origine de cette inscription, ignore ce message.</p>`,

  mailer_subjects_magic_link: 'Ton lien de connexion à Maintenant!',
  mailer_templates_magic_link_content: `<h2>Ton lien de connexion à Maintenant!</h2>
<p>Bonjour,</p>
<p>Clique sur le lien ci-dessous pour te connecter (valable une seule fois) :</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink">Me connecter</a></p>
<p>Si tu n'es pas à l'origine de cette demande, ignore ce message.</p>`,

  mailer_subjects_recovery: 'Réinitialise ton mot de passe Maintenant!',
  mailer_templates_recovery_content: `<h2>Réinitialise ton mot de passe</h2>
<p>Bonjour,</p>
<p>Tu as demandé à réinitialiser ton mot de passe. Clique sur le lien ci-dessous :</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Choisir un nouveau mot de passe</a></p>
<p>Si tu n'es pas à l'origine de cette demande, ignore ce message : ton mot de passe reste inchangé.</p>`,
};

const endpoint = `https://api.supabase.com/v1/projects/${ref}/config/auth`;

const reponse = await fetch(endpoint, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(config),
});

if (!reponse.ok) {
  console.error('[email-templates] Échec HTTP', reponse.status, await reponse.text());
  process.exit(1);
}

// Vérification : on relit la config et on confirme la présence de `token_hash`.
const verif = await (
  await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } })
).json();
const ok =
  verif.mailer_templates_confirmation_content.includes('TokenHash') &&
  verif.mailer_templates_magic_link_content.includes('TokenHash') &&
  verif.mailer_templates_recovery_content.includes('TokenHash');

console.info(
  `[email-templates] Projet ${ref} : modèles ${ok ? 'appliqués ✔' : 'NON conformes ✖'}.`,
);
process.exit(ok ? 0 : 1);
