import { getSupabaseServer } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Endpoint de healthcheck (V2.4.46).
 *
 * GET `/api/health` — public, retourne 200 si l'app tourne ET si
 * Supabase répond. Sinon retourne 503.
 *
 * Pour utilisation par les sondes externes (UptimeRobot, Cloudflare
 * Health Checks, etc.). Pas de cache, pas d'info sensible (juste un
 * timestamp et le statut de chaque sous-système).
 */

interface ReponseHealth {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime_seconds: number;
  checks: {
    supabase: 'ok' | 'fail';
  };
}

const T_DEMARRAGE = Date.now();

export async function GET() {
  let supabaseOk: 'ok' | 'fail' = 'fail';
  try {
    const supabase = await getSupabaseServer();
    // Ping minimal : lecture publique d'une vue agrégée existante.
    // RLS autorise tout le monde à lire ces compteurs publics.
    const { error } = await supabase
      .from('petition_compteur')
      .select('petition_id', { head: true, count: 'exact' })
      .limit(1);
    if (error === null) supabaseOk = 'ok';
  } catch {
    supabaseOk = 'fail';
  }

  const corps: ReponseHealth = {
    status: supabaseOk === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - T_DEMARRAGE) / 1000),
    checks: { supabase: supabaseOk },
  };

  return NextResponse.json(corps, {
    status: supabaseOk === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
