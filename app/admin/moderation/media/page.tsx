import { Alert, Badge, Card, Heading } from '@/components/ui';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';

export default async function PageModerationMedia() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('media')
    .select('id, slug, titre, type, statut, publie_le, provenance_externe')
    .order('created_at', { ascending: false })
    .limit(100);
  const medias = data ?? [];
  return (
    <>
      <Heading niveau={1}>Modération — Médias</Heading>
      <p className="mt-2 text-sm text-text-3">
        Liste des médias avec leur statut. Cliquer sur un titre pour ouvrir la fiche publique. La
        publication / le retrait passent par les Server Actions ; une UI dédiée viendra en polish.
      </p>
      {medias.length === 0 ? (
        <Alert variant="info" titre="Aucun média">
          Aucun média créé pour l'instant.
        </Alert>
      ) : (
        <ul className="mt-6 grid gap-2">
          {medias.map((m) => (
            <li key={m.id}>
              <Card variant="ombre" className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Badge variant="default">{m.type}</Badge>
                  <p className="mt-1 font-bold text-text-1">
                    <Link
                      href={`/s-informer/media/${m.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {m.titre}
                    </Link>
                  </p>
                  {m.provenance_externe !== null ? (
                    <p className="text-xs text-text-3">via {m.provenance_externe}</p>
                  ) : null}
                </div>
                <Badge variant={m.statut === 'publie' ? 'success' : 'default'}>{m.statut}</Badge>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
