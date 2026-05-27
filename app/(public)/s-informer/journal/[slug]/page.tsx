import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { Badge, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSupabaseServer } from '@/lib/supabase';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormulaireMajEdition } from './FormulaireMajEdition';

interface Props {
  params: Promise<{ slug: string }>;
}

async function chargerEdition(slug: string) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('journal_affiche')
    .select(
      'id, slug, titre, sous_titre, numero, format, contenu_md, image_couverture_url, publie_le, statut',
    )
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = await chargerEdition(slug);
  if (e === null) return { title: 'Édition introuvable' };
  return {
    title: `${e.titre} (n°${e.numero}) — Maintenant Médias`,
    description: e.sous_titre ?? undefined,
  };
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Page individuelle d'une édition de journal-affiche (V2.4.11).
 */
export default async function PageEditionJournal({ params }: Props) {
  const { slug } = await params;
  const [e, estAdmin] = await Promise.all([chargerEdition(slug), estAdminCourant()]);
  if (e === null) notFound();

  return (
    <Container taille="md" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/journal" className="hover:text-brand">
          ← Tous les numéros
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Heading niveau={1}>{e.titre}</Heading>
        <BoutonAdminEditer href="/admin/national">Admin</BoutonAdminEditer>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="default">N°{e.numero}</Badge>
        <Badge variant="info">{e.format}</Badge>
        {e.publie_le !== null ? (
          <span className="text-text-3 text-xs">
            Publié le {FORMATEUR.format(new Date(e.publie_le))}
          </span>
        ) : null}
      </div>

      {e.sous_titre !== null ? <p className="mt-3 text-text-2">{e.sous_titre}</p> : null}

      {e.image_couverture_url !== null ? (
        <div className="relative mt-6 aspect-[210/297] max-w-md overflow-hidden rounded-lg border border-border">
          <Image
            src={e.image_couverture_url}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
          />
        </div>
      ) : null}

      <article className="prose-maintenant mt-8 font-body text-text-1">
        {e.contenu_md === '' ? (
          <p className="text-text-3 italic">Contenu non encore rédigé.</p>
        ) : (
          <MarkdownLeger texte={e.contenu_md} />
        )}
      </article>

      {estAdmin ? (
        <section className="mt-12">
          <Heading niveau={2} apparenceComme={3}>
            Administration (réservé admins)
          </Heading>
          <FormulaireMajEdition
            id={e.id}
            titreInitial={e.titre}
            sousTitreInitial={e.sous_titre ?? ''}
            contenuInitial={e.contenu_md}
            imageInitial={e.image_couverture_url ?? ''}
            numeroInitial={e.numero}
            formatInitial={e.format === 'A4' ? 'A4' : 'A3'}
          />
        </section>
      ) : null}
    </Container>
  );
}
