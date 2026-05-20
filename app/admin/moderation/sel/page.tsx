import { Alert, Badge, Card, Heading } from '@/components/ui';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';

export default async function PageModerationSel() {
  const supabase = await getSupabaseServer();
  const [{ data: services }, { data: prestations }] = await Promise.all([
    supabase
      .from('service_sel')
      .select('id, slug, titre, categorie, sens, statut')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('prestation_sel')
      .select('id, service_id, statut, declaree_realisee_le, contestee_le')
      .in('statut', ['en_moderation', 'contestee'])
      .order('declaree_realisee_le', { ascending: false })
      .limit(50),
  ]);
  return (
    <>
      <Heading niveau={1}>Modération — SEL</Heading>
      <p className="mt-2 text-sm text-text-3">
        Services publiés + prestations en attente de crédit (modération 2 h) ou contestées.
      </p>

      <section className="mt-6">
        <h2 className="mb-2 font-bold">Prestations à modérer ({(prestations ?? []).length})</h2>
        {(prestations ?? []).length === 0 ? (
          <Alert variant="info" titre="Aucune prestation à modérer">
            Toutes les prestations en cours ont été créditées ou ne sont pas encore à la fenêtre de
            modération.
          </Alert>
        ) : (
          <ul className="grid gap-2">
            {(prestations ?? []).map((p) => (
              <li key={p.id}>
                <Card variant="ombre" className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-text-2">Prestation {p.id.slice(0, 8)}</p>
                  <Badge variant={p.statut === 'contestee' ? 'warning' : 'info'}>{p.statut}</Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-bold">Services publiés ({(services ?? []).length})</h2>
        <ul className="grid gap-2">
          {(services ?? []).map((s) => (
            <li key={s.id}>
              <Card variant="ombre" className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Badge variant={s.categorie === 'service' ? 'brand' : 'accent'}>
                    {s.categorie}
                  </Badge>
                  <p className="mt-1 font-bold text-text-1">
                    <Link
                      href={`/s-entraider/sel/${s.slug}`}
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
      </section>
    </>
  );
}
