import { FormulaireDonEuros } from '@/components/cagnottes/FormulaireDonEuros';
import { FormulaireDonT99CP } from '@/components/cagnottes/FormulaireDonT99CP';
import { JaugeT99CPEuros } from '@/components/cagnottes/JaugeT99CPEuros';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { cagnotteParSlug } from '@/lib/cagnottes/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { faireDonEuros, faireDonT99CP } from '../actions';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ annule?: string; succes?: string }>;
}

const LIBELLE_TYPE: Record<string, string> = {
  ouverte: 'Cagnotte ouverte',
  lutte: 'Caisse de lutte',
  cotisation: 'Cotisation',
};

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const cagnotte = await cagnotteParSlug(slug);
  if (cagnotte === null) {
    return { title: 'Cagnotte introuvable' };
  }
  return metadataPourPartage({
    objet: {
      titre: cagnotte.titre,
      description: cagnotte.texte,
      image_url: cagnotte.image_url,
      type_objet: 'cagnotte',
    },
    cheminPage: `/mobiliser/cagnottes/${slug}`,
  });
}

export default async function PageCagnotteDetail({ params, searchParams }: PageDetailProps) {
  const { slug } = await params;
  const { annule, succes } = await searchParams;
  const cagnotte = await cagnotteParSlug(slug);
  if (cagnotte === null) {
    notFound();
  }

  const estPubliee = cagnotte.statut === 'publiee';
  const peutRecevoirEuros = cagnotte.stripe_account_id !== null;
  const peutRecevoirT99CP = cagnotte.wallet_t99cp !== null;

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/mobiliser/cagnottes" className="hover:text-brand">
          ← Toutes les cagnottes
        </Link>
      </p>

      <article className="grid gap-8">
        <header className="grid gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={cagnotte.type === 'cotisation' ? 'accent' : 'success'}>
              {LIBELLE_TYPE[cagnotte.type] ?? cagnotte.type}
            </Badge>
            {cagnotte.statut === 'suspendue' ? <Badge variant="warning">Suspendue</Badge> : null}
            {cagnotte.statut === 'cloturee' ? <Badge variant="default">Clôturée</Badge> : null}
          </div>
          <Heading niveau={1}>{cagnotte.titre}</Heading>

          {cagnotte.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={cagnotte.image_url}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}
        </header>

        {cagnotte.statut === 'suspendue' ? (
          <Alert variant="warning" titre="Cagnotte suspendue">
            Raison : {cagnotte.raison_suspension ?? 'non précisée'}. Les dons sont temporairement
            bloqués. La porteuse peut contacter l'équipe Maintenant! pour discuter du
            rétablissement.
          </Alert>
        ) : null}

        {cagnotte.statut === 'cloturee' ? (
          <Alert variant="info" titre="Cagnotte clôturée">
            Cette cagnotte n'accepte plus de dons. Merci aux contributeur·ices.
          </Alert>
        ) : null}

        {annule === '1' ? (
          <Alert variant="info" titre="Don annulé">
            Tu as interrompu le paiement. Aucune somme n'a été débitée.
          </Alert>
        ) : null}

        {succes === '1' ? (
          <Alert variant="success" titre="Merci !">
            Ton don est enregistré et abonde la cagnotte. Reçu envoyé par email si tu l'as
            renseigné.
          </Alert>
        ) : null}

        <Card variant="ombre">
          <JaugeT99CPEuros
            totalEurosCentimes={cagnotte.total_euros_centimes}
            totalT99CPUnites={cagnotte.total_t99cp_unites}
            objectifEuros={cagnotte.objectif_euros}
            nombreDons={cagnotte.nombre_dons}
            taille="md"
          />
        </Card>

        <section className="grid gap-4">
          <Heading niveau={2} apparenceComme={3}>
            Présentation
          </Heading>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {cagnotte.texte}
          </div>
        </section>

        {estPubliee && (peutRecevoirEuros || peutRecevoirT99CP) ? (
          <section className="grid gap-6 border-t border-border pt-6">
            <Heading niveau={2} apparenceComme={3}>
              Soutenir
            </Heading>

            {peutRecevoirEuros ? (
              <Card variant="ombre" className="grid gap-3">
                <header className="flex items-center justify-between">
                  <Heading niveau={3} apparenceComme={4}>
                    Don en euros
                  </Heading>
                  <Badge variant="default">Frais 5 %</Badge>
                </header>
                <FormulaireDonEuros cagnotteId={cagnotte.id} faireDonEuros={faireDonEuros} />
              </Card>
            ) : (
              <Alert variant="info" titre="Don en euros indisponible">
                Le KYC Stripe Connect du porteur n'est pas encore complété. En attendant, le don
                T99CP reste possible si la cagnotte expose une adresse wallet.
              </Alert>
            )}

            {peutRecevoirT99CP && cagnotte.wallet_t99cp !== null ? (
              <Card variant="ombre" className="grid gap-3">
                <header className="flex items-center justify-between">
                  <Heading niveau={3} apparenceComme={4}>
                    Don en 99-coin
                  </Heading>
                  <Badge variant="success">Frais 0 %</Badge>
                </header>
                <FormulaireDonT99CP
                  cagnotteId={cagnotte.id}
                  walletPorteur={cagnotte.wallet_t99cp}
                  faireDonT99CP={faireDonT99CP}
                />
              </Card>
            ) : null}
          </section>
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {cagnotte.createurice_prenom !== null || cagnotte.createurice_nom !== null ? (
            <p>
              Portée par{' '}
              <strong className="text-text-2">
                {[cagnotte.createurice_prenom, cagnotte.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>{' '}
              · ouverte le{' '}
              <time dateTime={cagnotte.created_at}>
                {new Date(cagnotte.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              .
            </p>
          ) : null}
        </footer>
      </article>
    </Container>
  );
}
