import { Card, Container, Heading } from '@/components/ui';
import { getSessionOuRediriger } from '@/lib/auth/session';
import { type AppartenanceGroupe, listerMesAppartenances } from '@/lib/mes-groupes';
import { Building, Globe, HandHelping, Megaphone, Network, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mes groupes',
  description:
    'Mes appartenances dans le mouvement : communes libres, fédérations, confédérations, GT thématiques.',
};

/**
 * Page « Mes groupes » côté profil (cycle V2 V2.3.22).
 *
 * 4 axes couverts par les tables V1 existantes : communes libres
 * (direct), fédérations (indirect via commune), confédérations (indirect
 * via fédération), GT thématiques (direct).
 *
 * Lecture seule. Chaque entrée est un lien direct vers la page de
 * l'espace (commune, GT, etc.).
 */
export default async function PageMesGroupes() {
  const session = await getSessionOuRediriger('/profil/mes-groupes');
  const { communes, federations, confederations, gtThematiques, campagnes, groupesEntraide } =
    await listerMesAppartenances(session.userId);

  const total =
    communes.length +
    federations.length +
    confederations.length +
    gtThematiques.length +
    campagnes.length +
    groupesEntraide.length;

  return (
    <Container taille="md" className="py-12">
      <Heading niveau={1}>Mes groupes</Heading>
      <p className="mt-2 text-text-2">
        Toutes les appartenances actives dans le mouvement (communes libres, fédérations,
        confédérations, groupes de travail thématiques).
      </p>

      {total === 0 ? (
        <Card variant="ombre" className="mt-8">
          <p className="text-text-2">
            Tu n’es membre d’aucun groupe pour le moment. Pour rejoindre une commune libre, va sur
            la{' '}
            <Link href="/communes" className="text-brand hover:underline">
              carte des communes
            </Link>
            . Les groupes de travail thématiques (GT) sont en cours de construction côté UI ; en
            attendant, l’inscription se fait depuis un GT particulier quand sa page sera livrée.
          </p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-8">
          <SectionAppartenance
            titre="Communes libres"
            icone={<Building size={20} aria-hidden="true" />}
            appartenances={communes}
            vide="Pas encore membre d’une commune libre."
          />
          <SectionAppartenance
            titre="Fédérations"
            icone={<Network size={20} aria-hidden="true" />}
            appartenances={federations}
            vide="Aucune fédération rattachée (les fédérations sont indirectes : il faut être membre d’une commune fédérée)."
          />
          <SectionAppartenance
            titre="Confédérations"
            icone={<Globe size={20} aria-hidden="true" />}
            appartenances={confederations}
            vide="Aucune confédération rattachée (indirecte via les fédérations)."
          />
          <SectionAppartenance
            titre="Groupes de travail thématiques"
            icone={<Users size={20} aria-hidden="true" />}
            appartenances={gtThematiques}
            vide="Pas encore membre d’un GT thématique."
          />
          <SectionAppartenance
            titre="Campagnes"
            icone={<Megaphone size={20} aria-hidden="true" />}
            appartenances={campagnes}
            vide="Pas encore membre d’une campagne."
          />
          <SectionAppartenance
            titre="Groupes d’entraide locaux"
            icone={<HandHelping size={20} aria-hidden="true" />}
            appartenances={groupesEntraide}
            vide="Pas encore membre d’un groupe d’entraide local."
          />
        </div>
      )}
    </Container>
  );
}

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function SectionAppartenance({
  titre,
  icone,
  appartenances,
  vide,
}: {
  titre: string;
  icone: React.ReactNode;
  appartenances: AppartenanceGroupe[];
  vide: string;
}) {
  return (
    <section>
      <Heading niveau={2}>
        <span className="-mt-0.5 mr-2 inline-block align-middle text-text-3">{icone}</span>
        {titre} ({appartenances.length})
      </Heading>
      {appartenances.length === 0 ? (
        <p className="mt-2 text-sm text-text-3">{vide}</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {appartenances.map((a) => (
            <li key={a.id}>
              <Card variant="ombre" className="grid gap-1">
                <h3 className="font-display font-bold text-text-1">
                  {a.href !== '' ? (
                    <Link href={a.href} className="hover:text-brand">
                      {a.nom}
                    </Link>
                  ) : (
                    a.nom
                  )}
                </h3>
                <p className="text-text-3 text-xs">
                  {a.typeLibelle} · membre depuis le {FORMATEUR_DATE.format(new Date(a.depuisLe))}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
