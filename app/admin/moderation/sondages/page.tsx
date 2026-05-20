import { Alert, Badge, Card, Heading } from '@/components/ui';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';

export default async function PageModerationSondages() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('sondage')
    .select('id, slug, titre, mode, statut, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  const sondages = data ?? [];
  return (
    <>
      <Heading niveau={1}>Modération — Sondages</Heading>
      {sondages.length === 0 ? (
        <Alert variant="info" titre="Aucun sondage">
          Pas de sondage publié pour l'instant.
        </Alert>
      ) : (
        <ul className="mt-6 grid gap-2">
          {sondages.map((s) => (
            <li key={s.id}>
              <Card variant="ombre" className="flex items-center justify-between gap-2">
                <div>
                  <Badge variant={s.mode === 'pondere' ? 'accent' : 'brand'}>{s.mode}</Badge>
                  <p className="mt-1 font-bold">
                    <Link
                      href={`/s-informer/sondages/${s.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {s.titre}
                    </Link>
                  </p>
                </div>
                <Badge variant="default">{s.statut}</Badge>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
