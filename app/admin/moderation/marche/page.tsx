import { Alert, Badge, Card, Heading } from '@/components/ui';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';

export default async function PageModerationMarche() {
  const supabase = await getSupabaseServer();
  const [{ data: produits }, { data: notations }] = await Promise.all([
    supabase
      .from('produit_marche')
      .select('id, slug, titre, mode, statut')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('notation_marche')
      .select('id, produit_id, etoiles, created_at')
      .lt('etoiles', 3)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  return (
    <>
      <Heading niveau={1}>Modération — Marché solidaire</Heading>
      <p className="mt-2 text-sm text-text-3">
        Produits récents et notations 1-2 étoiles (à examiner en priorité).
      </p>

      <section className="mt-6">
        <h2 className="mb-2 font-bold">Notations basses ({(notations ?? []).length})</h2>
        {(notations ?? []).length === 0 ? (
          <Alert variant="info" titre="Aucune notation basse récente">
            Toutes les notations récentes sont à 3★ ou plus.
          </Alert>
        ) : (
          <ul className="grid gap-2">
            {(notations ?? []).map((n) => (
              <li key={n.id}>
                <Card variant="ombre" className="flex items-center justify-between gap-2">
                  <p className="text-sm">
                    Notation {n.etoiles}★ produit {n.produit_id.slice(0, 8)}
                  </p>
                  <Badge variant="warning">{n.etoiles}/5</Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-bold">Produits ({(produits ?? []).length})</h2>
        <ul className="grid gap-2">
          {(produits ?? []).map((p) => (
            <li key={p.id}>
              <Card variant="ombre" className="flex items-center justify-between gap-2">
                <p>
                  <Badge variant={p.mode === 'don' ? 'success' : 'brand'}>{p.mode}</Badge>{' '}
                  <Link
                    href={`/s-entraider/marche/produits/${p.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {p.titre}
                  </Link>
                </p>
                <Badge variant="default">{p.statut}</Badge>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
