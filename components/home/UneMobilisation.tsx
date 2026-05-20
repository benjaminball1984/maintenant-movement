import { Badge, Card, Heading } from '@/components/ui';
import { formaterPlage, formaterRelativeAVenir } from '@/lib/mobilisations/dates';
import { mobilisationAlaUne } from '@/lib/mobilisations/requetes';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { UneSection } from './UneSection';

/**
 * Une « mobilisation à venir » de la page d'accueil (chantier 3.2).
 *
 * Branchée sur la mobilisation la plus proche (publiee, date_debut >= now).
 * CTA principal : Rejoindre (mène à la fiche détail où le BoutonParticiper
 * permet de cliquer « je participe » d'un seul geste).
 */
export async function UneMobilisation() {
  const mobilisation = await mobilisationAlaUne();

  if (mobilisation === null) {
    return (
      <UneSection
        type="Mobilisation à venir"
        couleur="hue"
        titre={null}
        voirTousHref="/mobiliser/mobilisations"
        voirTousLibelle="Voir toutes les mobilisations"
        enAttente={
          <p>
            Aucune mobilisation annoncée pour le moment.{' '}
            <Link href="/mobiliser/mobilisations/nouvelle" className="text-brand hover:underline">
              Annonce la prochaine
            </Link>
            .
          </p>
        }
      />
    );
  }

  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <Badge variant="hue">Mobilisation à venir</Badge>
        <Link href="/mobiliser/mobilisations" className="text-xs text-text-3 hover:text-brand">
          Voir toutes les mobilisations →
        </Link>
      </header>

      <Heading niveau={3} className="text-2xl">
        <Link
          href={`/mobiliser/mobilisations/${mobilisation.slug}`}
          className="text-text-1 underline-offset-4 hover:underline"
        >
          {mobilisation.titre}
        </Link>
      </Heading>

      <dl className="grid gap-1 text-sm text-text-2">
        <div className="flex items-start gap-2">
          <Calendar size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-text-3" />
          <dd>
            {formaterPlage(mobilisation.date_debut, mobilisation.date_fin)} ·{' '}
            <span className="text-brand">{formaterRelativeAVenir(mobilisation.date_debut)}</span>
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-text-3" />
          <dd>{mobilisation.lieu}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Users size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-text-3" />
          <dd>
            {mobilisation.nombre_participant_es} participant·e
            {mobilisation.nombre_participant_es > 1 ? 's' : ''}
          </dd>
        </div>
      </dl>

      <Link
        href={`/mobiliser/mobilisations/${mobilisation.slug}`}
        className={cn(
          'inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-5',
          'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
        )}
      >
        Rejoindre
      </Link>
    </Card>
  );
}
