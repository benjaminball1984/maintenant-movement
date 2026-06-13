import { Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FormulaireEditionMedia, type MediaEditable } from './FormulaireEditionMedia';

/**
 * Page d'édition admin d'un média (demande Ben 2026-06-13). Réservée aux
 * admins (sinon redirection). Charge le média par id et affiche le
 * formulaire d'édition complet.
 */
export default async function PageEditionMedia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await estAdminCourant())) {
    redirect('/connexion');
  }

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('media')
    .select(
      'id, slug, titre, corps, type, vignette_url, media_url, tags, provenance_externe, source_url',
    )
    .eq('id', id)
    .maybeSingle();
  if (data === null) {
    notFound();
  }

  return (
    <Container taille="md" className="py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Administration</p>
        <Heading niveau={1}>Modifier le contenu</Heading>
        <Link
          href={`/s-informer/media/${data.slug}`}
          className="mt-2 inline-block text-sm text-brand underline underline-offset-2"
        >
          ← Voir la fiche publique
        </Link>
      </header>
      <FormulaireEditionMedia media={data as MediaEditable} />
    </Container>
  );
}
