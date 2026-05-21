import { readFileSync } from 'node:fs';
// Diagnostic ponctuel : liste les comptes auth.users via l'API admin.
// Optionnel : passe `--delete <email>` pour supprimer un compte.
// Lance avec : node scripts/check-auth-user.mjs [--delete <email>]
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const indexDelete = args.indexOf('--delete');
if (indexDelete !== -1 && args[indexDelete + 1]) {
  const emailAsupprimer = args[indexDelete + 1];
  const { data: liste } = await supabase.auth.admin.listUsers();
  const cible = liste.users.find((u) => u.email === emailAsupprimer);
  if (!cible) {
    console.info(`Aucun compte avec l'email ${emailAsupprimer}.`);
    process.exit(0);
  }
  const { error } = await supabase.auth.admin.deleteUser(cible.id);
  if (error) {
    console.error('ERREUR SUPPRESSION:', error.message);
    process.exit(1);
  }
  console.info(`Compte ${emailAsupprimer} (id=${cible.id}) supprime.`);
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.listUsers();
if (error) {
  console.error('ERREUR:', error.message);
  process.exit(1);
}

console.info(`Total users: ${data.users.length}`);
for (const u of data.users) {
  console.info(
    `- ${u.email} | created: ${u.created_at} | confirmed: ${u.email_confirmed_at ?? 'NO'} | last_sign_in: ${u.last_sign_in_at ?? 'never'}`,
  );
}
