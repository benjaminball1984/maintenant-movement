import { FilDeGroupe } from '@/components/fil-groupe/FilDeGroupe';
import { BoutonAppartenanceGT } from '@/components/gt/BoutonAppartenanceGT';
import { Alert, Badge, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { compterMembresEspace, formaterMembres } from '@/lib/compter-membres';
import { metadataPourPartage } from '@/lib/og-metadata';
import { getSupabaseServer } from '@/lib/supabase';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

/**
 * Page individuelle d'un GT thématique (cycle V2 V2.3.38).
 *
 * Lecture seule + bouton Rejoindre/Quitter + FilDeGroupe (V2.2.1) si
 * la personne est membre. Permet enfin de cliquer depuis la page
 * « Mes groupes » sur un GT (lien resté vide depuis V2.3.22).
 *
 * Pas de modération éditoriale propre aux GT pour l'instant : la
 * publication des messages relève du fil de groupe transversal.
 */

async function chargerGT(slug: string) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('gt_thematique')
    .select('id, slug, nom, sujet, description, image_url')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const gt = await chargerGT(slug);
  if (gt === null) return { title: 'GT introuvable' };
  return metadataPourPartage({
    objet: {
      titre: gt.nom,
      description: gt.description ?? gt.sujet,
      image_url: gt.image_url,
      type_objet: 'gt_thematique',
    },
    cheminPage: `/co-construire/${slug}`,
  });
}

export default async function PageGTDetail({ params }: PageDetailProps) {
  const { slug } = await params;
  const gt = await chargerGT(slug);
  if (gt === null) notFound();

  const session = await getSession();
  const nbMembres = await compterMembresEspace('gt_thematique', gt.id);
  let estMembre = false;
  if (session !== null) {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('appartenance_gt')
      .select('id')
      .eq('personne_id', session.userId)
      .eq('gt_thematique_id', gt.id)
      .eq('est_active', true)
      .maybeSingle();
    estMembre = data !== null;
  }

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/co-construire" className="hover:text-brand">
          ← Tous les GT
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">GT thématique</Badge>
            <span className="text-text-3 text-xs">· {formaterMembres(nbMembres)}</span>
          </div>
          <Heading niveau={1}>{gt.nom}</Heading>
          <p className="text-text-2">{gt.sujet}</p>

          {gt.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={gt.image_url}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}

          {session !== null ? (
            <BoutonAppartenanceGT gtId={gt.id} estMembreInitial={estMembre} />
          ) : (
            <Alert variant="info" titre="Connexion requise pour rejoindre">
              <Link href="/connexion" className="text-brand hover:underline">
                Se connecter
              </Link>{' '}
              ou{' '}
              <Link href="/inscription" className="text-brand hover:underline">
                créer un compte
              </Link>{' '}
              pour rejoindre ce GT.
            </Alert>
          )}
        </header>

        {gt.description !== null ? (
          <section>
            <Heading niveau={2} apparenceComme={3}>
              Description
            </Heading>
            <p className="mt-2 whitespace-pre-wrap text-text-1">{gt.description}</p>
          </section>
        ) : null}

        {estMembre ? (
          <section>
            <Heading niveau={2} apparenceComme={3}>
              Fil du groupe
            </Heading>
            <p className="mt-1 mb-4 text-sm text-text-3">
              Discussion collective entre les membres du GT (cf. V2.2.1).
            </p>
            <FilDeGroupe espaceType="gt_thematique" espaceId={gt.id} />
          </section>
        ) : session !== null ? (
          <Alert variant="info" titre="Fil du GT réservé aux membres">
            Rejoins le GT pour accéder à son fil de discussion.
          </Alert>
        ) : null}
      </article>
    </Container>
  );
}
