import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import {
  LIBELLE_MODE,
  LIBELLE_STATUT,
  chargerReunionParId,
  chargerSalleParSlug,
} from '@/lib/decider';
import { ArrowLeft, CalendarRange, FileText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormulaireMajReunion } from './FormulaireMajReunion';

interface Props {
  params: Promise<{ slug: string; reunionId: string }>;
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, reunionId } = await params;
  const [salle, reunion] = await Promise.all([
    chargerSalleParSlug(slug),
    chargerReunionParId(reunionId),
  ]);
  if (salle === null || reunion === null) return { title: 'Réunion introuvable' };
  return {
    title: `${reunion.titre} — ${salle.nom}`,
    description: reunion.ordreJourMd.slice(0, 200),
  };
}

/**
 * Page individuelle d'une réunion Décider (V2.4.18).
 *
 * Affiche l'OJ et le PV (rendus Markdown). Les admins voient un
 * formulaire d'édition inline (OJ, PV, transition de statut).
 */
export default async function PageReunion({ params }: Props) {
  const { slug, reunionId } = await params;
  const [salle, reunion, estAdmin] = await Promise.all([
    chargerSalleParSlug(slug),
    chargerReunionParId(reunionId),
    estAdminCourant(),
  ]);
  if (salle === null || reunion === null) notFound();
  if (reunion.salleId !== salle.id) notFound();

  const couleurBadgeStatut: Record<typeof reunion.statut, 'success' | 'warning' | 'default'> = {
    planifiee: 'warning',
    en_cours: 'success',
    terminee: 'default',
    annulee: 'default',
  };

  return (
    <Container taille="md" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href={`/s-informer/decider/${slug}`} className="hover:text-brand">
          <ArrowLeft size={12} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          {salle.nom}
        </Link>
      </p>

      <header className="mt-2 grid gap-3">
        <Heading niveau={1}>{reunion.titre}</Heading>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={couleurBadgeStatut[reunion.statut]}>
            {LIBELLE_STATUT[reunion.statut]}
          </Badge>
          <Badge variant="info">{LIBELLE_MODE[reunion.modeDecision]}</Badge>
        </div>
        <p className="text-sm text-text-3">
          <CalendarRange size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          {FORMATEUR.format(new Date(reunion.debutLe))}
          {reunion.finLe !== null ? ` → ${FORMATEUR.format(new Date(reunion.finLe))}` : ''}
        </p>
      </header>

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          Ordre du jour
        </Heading>
        <Card variant="ombre" className="mt-3">
          {reunion.ordreJourMd === '' ? (
            <p className="text-sm text-text-3 italic">Pas d'ordre du jour publié.</p>
          ) : (
            <MarkdownLeger texte={reunion.ordreJourMd} />
          )}
        </Card>
      </section>

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          <FileText size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Procès-verbal
        </Heading>
        <Card variant="ombre" className="mt-3">
          {reunion.pvMd === null || reunion.pvMd === '' ? (
            <p className="text-sm text-text-3 italic">
              {reunion.statut === 'terminee'
                ? 'PV pas encore publié.'
                : reunion.statut === 'annulee'
                  ? 'Réunion annulée, pas de PV.'
                  : 'PV publié après la réunion.'}
            </p>
          ) : (
            <MarkdownLeger texte={reunion.pvMd} />
          )}
        </Card>
      </section>

      {estAdmin ? (
        <section className="mt-8">
          <Heading niveau={2} apparenceComme={3}>
            Administration (réservé admins)
          </Heading>
          <FormulaireMajReunion
            reunionId={reunion.id}
            ordreJourInitial={reunion.ordreJourMd}
            pvInitial={reunion.pvMd ?? ''}
            statutInitial={reunion.statut}
          />
        </section>
      ) : null}

      {reunion.modeDecision === 'jugement_majoritaire' && reunion.statut === 'en_cours' ? (
        <Alert variant="info" titre="Vote en jugement majoritaire" className="mt-8">
          L'interface de vote (7 mentions Balinski-Laraki) arrive dans un chantier dédié. En
          attendant, le vote se tient en visio.
        </Alert>
      ) : null}
    </Container>
  );
}
