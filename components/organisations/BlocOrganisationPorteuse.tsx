import { getSession } from '@/lib/auth/session';
import {
  type TypeContenuOrganisation,
  listerOrganisationsGereesPar,
  organisationDuContenu,
} from '@/lib/organisations/liaisons';
import { BadgeCheck, Building2 } from 'lucide-react';
import Link from 'next/link';
import { RattacherContenuOrganisation } from './RattacherContenuOrganisation';

interface Props {
  objetType: TypeContenuOrganisation;
  objetId: string;
}

/**
 * Bloc « Porté par [organisation] » d'un contenu (épopée réseau V2, chantier
 * B.4). Server Component :
 * - affiche l'organisation porteuse (cliquable, avec badge officiel) si elle
 *   existe, à tout le monde ;
 * - propose aux personnes qui gèrent au moins une organisation le contrôle de
 *   rattachement / retrait.
 *
 * Ne rend rien si aucune organisation porteuse ET le lecteur ne gère aucune
 * organisation (pas de pollution visuelle).
 */
export async function BlocOrganisationPorteuse({ objetType, objetId }: Props) {
  const porteuse = await organisationDuContenu(objetType, objetId);
  const session = await getSession();
  const mesOrganisations =
    session !== null ? await listerOrganisationsGereesPar(session.userId) : [];

  if (porteuse === null && mesOrganisations.length === 0) return null;

  return (
    <div className="grid gap-1">
      {porteuse !== null ? (
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-text-2">
          <Building2 size={15} strokeWidth={1.5} aria-hidden="true" className="text-text-3" />
          Porté par{' '}
          <Link href={`/organisations/${porteuse.slug}`} className="font-bold hover:text-brand">
            {porteuse.nom}
          </Link>
          {porteuse.badgeOfficiel ? (
            <BadgeCheck
              size={14}
              strokeWidth={2}
              aria-label="Organisation officielle"
              className="text-brand"
            />
          ) : null}
        </p>
      ) : null}

      {mesOrganisations.length > 0 ? (
        <RattacherContenuOrganisation
          objetType={objetType}
          objetId={objetId}
          mesOrganisations={mesOrganisations}
          organisationActuelleId={porteuse?.id ?? null}
        />
      ) : null}
    </div>
  );
}
