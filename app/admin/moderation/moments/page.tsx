import { Alert, Badge, Card, Heading } from '@/components/ui';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';

export default async function PageModerationMoments() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('moment_solidaire')
    .select('id, slug, titre, type, statut, commence_le')
    .is('parent_id', null)
    .order('commence_le', { ascending: true })
    .limit(100);
  const moments = data ?? [];
  return (
    <>
      <Heading niveau={1}>Modération — Moments solidaires</Heading>
      {moments.length === 0 ? (
        <Alert variant="info" titre="Aucun moment">
          Pas de moment programmé pour l'instant.
        </Alert>
      ) : (
        <ul className="mt-6 grid gap-2">
          {moments.map((m) => (
            <li key={m.id}>
              <Card variant="ombre" className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Badge variant="default">{m.type}</Badge>
                  <p className="mt-1 font-bold text-text-1">
                    <Link
                      href={`/agir/moments-solidaires/${m.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {m.titre}
                    </Link>
                  </p>
                  <p className="text-xs text-text-3">
                    {new Date(m.commence_le).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Badge variant={m.statut === 'annonce' ? 'info' : 'default'}>{m.statut}</Badge>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
