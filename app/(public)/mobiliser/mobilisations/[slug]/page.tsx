import { retirerMobilisationAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { BoutonParticiper } from '@/components/mobilisations/BoutonParticiper';
import { Alert, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { formaterPlage, formaterRelativeAVenir } from '@/lib/mobilisations/dates';
import { dejaParticipante, mobilisationParSlug } from '@/lib/mobilisations/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { Calendar, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { participerMobilisation } from '../actions';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const mobilisation = await mobilisationParSlug(slug);
  if (mobilisation === null) {
    return { title: 'Mobilisation introuvable' };
  }
  return metadataPourPartage({
    objet: {
      titre: mobilisation.titre,
      description: mobilisation.description,
      image_url: mobilisation.image_url,
      type_objet: 'mobilisation',
    },
    cheminPage: `/mobiliser/mobilisations/${slug}`,
  });
}

/**
 * Fiche détail d'une mobilisation (`/mobiliser/mobilisations/[slug]`).
 *
 * - 404 si introuvable / non lisible (RLS : seules les publiées sont
 *   accessibles publiquement).
 * - Affiche image, titre, plage de dates, lieu, description.
 * - `<BoutonParticiper>` géré côté client (cookie anonyme + Server Action).
 * - Si la mobilisation est retirée et la personne connectée en est la
 *   créateurice, affiche la raison du retrait.
 */
export default async function PageMobilisationDetail({ params }: PageDetailProps) {
  const { slug } = await params;
  const [mobilisation, estAdmin] = await Promise.all([
    mobilisationParSlug(slug),
    estAdminCourant(),
  ]);

  if (mobilisation === null) {
    notFound();
  }

  const dejaInscrite = await dejaParticipante(mobilisation.id);
  const estPubliee = mobilisation.statut === 'publiee';

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/mobiliser/mobilisations" className="hover:text-brand">
          ← Toutes les mobilisations
        </Link>
      </p>

      <article className="grid gap-8">
        <header className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">Mobilisation</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-cap text-brand">
                {formaterRelativeAVenir(mobilisation.date_debut)}
              </p>
              <BoutonAdminEditer href={`/admin/moderation/mobilisations?id=${mobilisation.id}`}>
                Admin
              </BoutonAdminEditer>
            </div>
          </div>
          <Heading niveau={1}>{mobilisation.titre}</Heading>

          {mobilisation.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={mobilisation.image_url}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}
        </header>

        {!estPubliee ? (
          <Alert variant="danger" titre="Mobilisation retirée">
            Raison : {mobilisation.raison_retrait ?? 'non précisée'}. Tu peux republier une version
            corrigée si tu en es la créateurice.
          </Alert>
        ) : null}

        <dl className="grid gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
          <div className="flex items-start gap-3">
            <Calendar size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <dt className="font-bold text-text-3">Quand</dt>
              <dd className="text-text-1">
                {formaterPlage(mobilisation.date_debut, mobilisation.date_fin)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <dt className="font-bold text-text-3">Où</dt>
              <dd className="text-text-1">{mobilisation.lieu}</dd>
              {mobilisation.latitude !== null && mobilisation.longitude !== null ? (
                <dd className="mt-1 text-xs text-text-3">
                  Coordonnées : {mobilisation.latitude.toFixed(4)},{' '}
                  {mobilisation.longitude.toFixed(4)} ·{' '}
                  <Link href="/carte" className="text-brand hover:underline">
                    voir sur la carte
                  </Link>
                </dd>
              ) : null}
            </div>
          </div>
        </dl>

        {estPubliee ? (
          <Card variant="ombre">
            <BoutonParticiper
              mobilisationId={mobilisation.id}
              participerMobilisation={participerMobilisation}
              dejaParticipanteConnectee={dejaInscrite}
              compteurInitial={mobilisation.nombre_participant_es}
            />
          </Card>
        ) : null}

        <section className="grid gap-4">
          <Heading niveau={2} apparenceComme={3}>
            Description
          </Heading>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {mobilisation.description}
          </div>
        </section>

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {mobilisation.createurice_prenom !== null || mobilisation.createurice_nom !== null ? (
            <p>
              Organisée par{' '}
              <strong className="text-text-2">
                {[mobilisation.createurice_prenom, mobilisation.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>
              .
            </p>
          ) : null}
        </footer>
      </article>

      {estAdmin ? (
        <section
          aria-label="Actions admin"
          className="mt-12 grid gap-3 border-t border-border pt-8"
        >
          <Heading niveau={2} apparenceComme={4}>
            Actions admin
          </Heading>
          {mobilisation.statut !== 'retiree' ? (
            <BoutonArchiverEntite
              id={mobilisation.id}
              action={retirerMobilisationAction}
              verbe="Retirer la mobilisation"
              description="Statut → 'retiree'. Disparaît de la liste publique. Participants conservés."
              labelRaison="Raison du retrait (optionnelle)"
            />
          ) : null}
          <BoutonSupprimerEntite
            table="mobilisation"
            id={mobilisation.id}
            redirigerVers="/mobiliser/mobilisations"
          />
        </section>
      ) : null}
    </Container>
  );
}
