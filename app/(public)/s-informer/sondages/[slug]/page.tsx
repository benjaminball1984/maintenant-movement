import { voterSondage } from '@/app/(public)/s-informer/sondages/actions';
import { FormulaireVote } from '@/components/sondages/FormulaireVote';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { metadataPourPartage } from '@/lib/og-metadata';
import { aVotePersonne, sondageParSlugAvecResultats } from '@/lib/sondages/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const sondage = await sondageParSlugAvecResultats(slug);
  if (sondage === null) return { title: 'Sondage introuvable' };
  return metadataPourPartage({
    objet: {
      titre: sondage.titre,
      description: sondage.question,
      // Pas d'image_url en V1 sur sondage : on tombe sur l'image par défaut.
      image_url: null,
      type_objet: 'sondage',
    },
    cheminPage: `/s-informer/sondages/${slug}`,
  });
}

export default async function PageDetailSondage({ params }: PageDetailProps) {
  const { slug } = await params;
  const sondage = await sondageParSlugAvecResultats(slug);
  if (sondage === null) notFound();

  const session = await getSession();
  const dejaVote = session !== null ? await aVotePersonne(sondage.id, session.userId) : false;

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/sondages" className="hover:text-brand">
          ← Sondages
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={sondage.mode === 'pondere' ? 'accent' : 'brand'}>
              {sondage.mode === 'pondere' ? 'Pondéré' : 'Classique'}
            </Badge>
            {sondage.statut !== 'ouvert' ? <Badge variant="default">{sondage.statut}</Badge> : null}
          </div>
          <Heading niveau={1}>{sondage.titre}</Heading>
          <p className="text-text-2">{sondage.question}</p>
        </header>

        {session === null ? (
          <Alert variant="info" titre="Vote connecté obligatoire">
            <Link
              href={`/connexion?prochaine=/s-informer/sondages/${sondage.slug}`}
              className="underline"
            >
              Connecte-toi
            </Link>{' '}
            pour voter (cf. doctrine §4D).
          </Alert>
        ) : dejaVote || sondage.statut !== 'ouvert' ? null : (
          <Card variant="eleve">
            <FormulaireVote
              sondageId={sondage.id}
              options={sondage.options}
              mode={sondage.mode}
              voterSondage={voterSondage}
            />
          </Card>
        )}

        {dejaVote ? (
          <Alert variant="success" titre="Vote enregistré">
            Tu as déjà voté pour ce sondage. Merci. Les résultats sont visibles ci-dessous.
          </Alert>
        ) : null}

        <section className="grid gap-3">
          <Heading niveau={2} apparenceComme={3}>
            Résultats
          </Heading>
          <p className="text-sm text-text-3">
            {sondage.total_votes} vote{sondage.total_votes > 1 ? 's' : ''}
            {sondage.pondere_disponible
              ? ' · seuil 300 atteint, pondération par quotas applicable.'
              : sondage.mode === 'pondere'
                ? ` · seuil 300 non atteint (${sondage.total_votes}/300), résultats bruts pour l'instant.`
                : ''}
          </p>
          <ul className="grid gap-2">
            {sondage.options.map((opt, index) => {
              const compte = sondage.resultats_par_option[index] ?? 0;
              const pct =
                sondage.total_votes === 0 ? 0 : Math.round((compte / sondage.total_votes) * 100);
              return (
                <li key={`${index}-${opt}`}>
                  <Card variant="ombre" className="grid gap-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-bold text-text-1">{opt}</p>
                      <span className="text-sm text-text-3">
                        {compte} ({pct}%)
                      </span>
                    </div>
                    <progress
                      value={pct}
                      max={100}
                      className="h-2 w-full overflow-hidden rounded-pill bg-surface-2 [&::-webkit-progress-bar]:bg-surface-2 [&::-webkit-progress-value]:bg-grad-r [&::-moz-progress-bar]:bg-grad-r"
                      aria-label={`${opt} : ${pct}%`}
                    />
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      </article>
    </Container>
  );
}
