import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getImageObjet } from '@/lib/images';
import { formaterPlage, formaterRelativeAVenir } from '@/lib/mobilisations/dates';
import { mobilisationAlaUne } from '@/lib/mobilisations/requetes';
import { compter } from '@/lib/pluriel';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { UneNonEpinglee } from './UneNonEpinglee';

const FALLBACKS = {
  badge: 'Mobilisation à venir',
  voirTous: 'Voir toutes les mobilisations',
  cta: 'Rejoindre',
  participantLabel: 'participant·e',
};

/**
 * Une « mobilisation à venir » de la page d'accueil (chantier 3.2).
 *
 * Branchée sur la mobilisation **épinglée par l'administration** (décision
 * Lilou/Ben du 15/08/2026 : plus aucune mise à la une automatique). Le
 * bassin de candidates ne contient que les mobilisations à venir : une
 * mobilisation épinglée qui vient de passer libère donc l'emplacement.
 *
 * CTA principal : Rejoindre (mène à la fiche détail où le BoutonParticiper
 * permet de cliquer « je participe » d'un seul geste).
 */
export async function UneMobilisation() {
  const [mobilisation, estAdmin, badge, voirTous, cta, participantLabel] = await Promise.all([
    mobilisationAlaUne(),
    estAdminCourant(),
    lireContenuEditorial('home.une.mobilisation.badge', { valeurMd: FALLBACKS.badge }),
    lireContenuEditorial('home.une.mobilisation.voir_tous', { valeurMd: FALLBACKS.voirTous }),
    lireContenuEditorial('home.une.mobilisation.cta', { valeurMd: FALLBACKS.cta }),
    lireContenuEditorial('home.une.mobilisation.participant_label', {
      valeurMd: FALLBACKS.participantLabel,
    }),
  ]);

  if (mobilisation === null) {
    return estAdmin ? <UneNonEpinglee type={badge.valeurMd} couleur="hue" /> : null;
  }

  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <TexteEditableAdmin
          cle="home.une.mobilisation.badge"
          valeurInitiale={badge.valeurMd}
          estAdmin={estAdmin}
          libelle="texte du badge Une mobilisation"
          longueurMax={40}
        >
          {(t) => <Badge variant="hue">{t}</Badge>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="home.une.mobilisation.voir_tous"
          valeurInitiale={voirTous.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle Voir toutes les mobilisations"
          longueurMax={60}
        >
          {(t) => (
            <Link href="/mobiliser/mobilisations" className="text-xs text-text-3 hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </header>

      <Link
        href={`/mobiliser/mobilisations/${mobilisation.slug}`}
        className="relative block aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-surface-2"
      >
        <Image
          src={getImageObjet({ image_url: mobilisation.image_url, type_objet: 'mobilisation' })}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 896px) 100vw, 800px"
          className="object-cover"
        />
      </Link>

      <Heading niveau={2} apparenceComme={3} className="text-2xl">
        <Link
          href={`/mobiliser/mobilisations/${mobilisation.slug}`}
          className="text-text-1 underline-offset-4 hover:underline"
        >
          {mobilisation.titre}
        </Link>
      </Heading>

      <p className="line-clamp-2 text-sm text-text-2">
        {mobilisation.description.length > 200
          ? `${mobilisation.description.slice(0, 200).trimEnd()}...`
          : mobilisation.description}
      </p>

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
          <dd>{compter(mobilisation.nombre_participant_es, participantLabel.valeurMd)}</dd>
        </div>
      </dl>

      <TexteEditableAdmin
        cle="home.une.mobilisation.cta"
        valeurInitiale={cta.valeurMd}
        estAdmin={estAdmin}
        libelle="libelle du CTA principal (Rejoindre)"
        longueurMax={40}
      >
        {(t) => (
          <Link
            href={`/mobiliser/mobilisations/${mobilisation.slug}`}
            className={cn(
              'inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-5',
              'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
            )}
          >
            {t}
          </Link>
        )}
      </TexteEditableAdmin>
    </Card>
  );
}
