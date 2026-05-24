import { readFileSync } from 'node:fs';
// Test direct du signUp Supabase pour isoler le probleme de la chaine SMTP.
// Tente une inscription email puis loggue le retour brut.
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const email = process.argv[2] ?? `test-${Date.now()}@example.com`;
const password = `TestSmtp${Date.now()}`;

console.info(`[test-signup] email=${email}`);

const { data, error } = await supabase.auth.signUp({ email, password });

console.info('[test-signup] error:', error);
console.info('[test-signup] data:', JSON.stringify(data, null, 2));
