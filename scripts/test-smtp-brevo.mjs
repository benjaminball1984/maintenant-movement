// Test SMTP Brevo : envoie un email simple en utilisant les identifiants
// de .env.local. Permet de discriminer (a) creds mauvais / (b) config
// Supabase pas appliquee.
import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const destinataire = process.argv[2] ?? 'lifebenjaminaeron.ball@gmail.com';

console.info('[test-smtp] Connexion SMTP Brevo...');
console.info('  Host: smtp-relay.brevo.com:587');
console.info(`  Login: ${env.BREVO_SMTP_USER}`);
console.info('  From:  benjamin.ball1984@gmail.com');
console.info(`  To:    ${destinataire}`);

const transport = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: { user: env.BREVO_SMTP_USER, pass: env.BREVO_SMTP_PASS },
});

try {
  const info = await transport.sendMail({
    from: '"Maintenant! Test" <benjamin.ball1984@gmail.com>',
    to: destinataire,
    subject: 'Test SMTP Brevo depuis Maintenant!',
    text: 'Si tu lis ce mail, la chaine SMTP Brevo marche. Sinon, voir les logs serveur.',
  });
  console.info('[test-smtp] OK envoye.');
  console.info(`  messageId: ${info.messageId}`);
  console.info(`  response: ${info.response}`);
} catch (err) {
  console.error('[test-smtp] ECHEC :');
  console.error(`  message: ${err.message}`);
  if (err.code) console.error(`  code: ${err.code}`);
  if (err.response) console.error(`  response: ${err.response}`);
  process.exit(1);
}
