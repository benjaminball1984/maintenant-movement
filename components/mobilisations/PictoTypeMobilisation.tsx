import {
  LIBELLE_TYPE_MOBILISATION,
  type TypeMobilisation,
} from '@/lib/mobilisations/type-mobilisation';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  Footprints,
  GraduationCap,
  type LucideIcon,
  Megaphone,
  MessagesSquare,
  Music,
  Projector,
  Tent,
  TrafficCone,
} from 'lucide-react';

/**
 * Pictogramme de type de mobilisation (revue 2026-06-11).
 *
 * Système de pictos MAISON : icônes lucide (le langage iconographique du
 * site entier) + teinte par famille d'action. Volontairement distinct des
 * pictogrammes d'agendas militants externes : aucune reprise graphique.
 *
 * - manifestation : des pas (le cortège qui marche)
 * - rassemblement : le mégaphone (la prise de parole sur la place)
 * - blocage / grève : le cône (le flux interrompu)
 * - assemblée / réunion : les bulles de discussion
 * - projection / débat : le projecteur
 * - concert / fête : la note de musique
 * - formation / atelier : la toque (on apprend)
 * - occupation / village : la tente
 * - autre : le calendrier
 */

interface ConfigPicto {
  icone: LucideIcon;
  classes: string;
}

const PICTOS: Record<TypeMobilisation, ConfigPicto> = {
  manifestation: { icone: Footprints, classes: 'bg-brand-light text-brand' },
  rassemblement: { icone: Megaphone, classes: 'bg-brand-light text-brand' },
  blocage_greve: { icone: TrafficCone, classes: 'bg-warning-light text-warning' },
  assemblee_reunion: { icone: MessagesSquare, classes: 'bg-info-light text-info' },
  projection_debat: { icone: Projector, classes: 'bg-info-light text-info' },
  concert_fete: { icone: Music, classes: 'bg-accent-light text-accent' },
  formation_atelier: { icone: GraduationCap, classes: 'bg-info-light text-info' },
  occupation_village: { icone: Tent, classes: 'bg-warning-light text-warning' },
  autre: { icone: CalendarDays, classes: 'bg-surface-2 text-text-2' },
};

export interface PictoTypeMobilisationProps {
  type: TypeMobilisation;
  /** Si true, n'affiche que l'icône (avec libellé en title/aria). */
  compact?: boolean;
  className?: string;
}

export function PictoTypeMobilisation({
  type,
  compact = false,
  className,
}: PictoTypeMobilisationProps) {
  const config = PICTOS[type];
  const Icone = config.icone;
  const libelle = LIBELLE_TYPE_MOBILISATION[type];

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full',
          config.classes,
          className,
        )}
        title={libelle}
        aria-label={libelle}
      >
        <Icone size={15} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        config.classes,
        className,
      )}
    >
      <Icone size={14} aria-hidden="true" />
      {libelle}
    </span>
  );
}
