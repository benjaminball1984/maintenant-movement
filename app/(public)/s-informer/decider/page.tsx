import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { listerSallesDecider } from '@/lib/decider';
import { CalendarRange, Globe, Lock, Users, Video } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Décider',
  description:
    "Infrastructure de la décision en réunion : salles dédiées, 3 modes (consensus, levée d'objections, jugement majoritaire).",
};

const LIBELLE_ESPACE: Record<string, string> = {
  commune: 'Commune',
  federation: 'Fédération',
  confederation: 'Confédération',
  gt_thematique: 'GT thématique',
  campagne: 'Campagne',
  groupe_entraide_local: 'Groupe d’entraide',
  national: 'National',
};

const ICONE_VISIBILITE: Record<string, typeof Lock> = {
  membres: Lock,
  fedeere: Users,
  public: Globe,
};

const LIBELLE_VISIBILITE: Record<string, string> = {
  membres: 'Membres uniquement',
  fedeere: 'Périmètre fédéré',
  public: 'Public (enregistré)',
};

/**
 * Page `/s-informer/decider` V2.4.10.
 *
 * Liste des salles de décision créées dans le mouvement. Chaque salle
 * appartient à un espace (commune, fédération, GT, etc.) et a une
 * politique de visibilité.
 *
 * LiveKit pas encore branché : les boutons « Rejoindre » apparaîtront
 * quand `LIVEKIT_PROVIDER=livekit` sera défini en env. En attendant,
 * cette page sert de hub d'annonce + accès aux PV des réunions passées.
 */
export default async function PageDecider() {
  const salles = await listerSallesDecider();

  return (
    <Container taille="lg" className="py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <header>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
          <Heading niveau={1}>Décider</Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Infrastructure technique de la décision en réunion. Salles dédiées par espace, ordres du
            jour, 3 modes de décision hiérarchisés.
          </p>
        </header>
        <BoutonAdminEditer href="/admin/national">Admin</BoutonAdminEditer>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card variant="ombre" className="grid gap-1">
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Mode 1</p>
          <p className="font-bold text-text-1">Consensus</p>
          <p className="text-sm text-text-2">Accord plein de toutes les personnes présentes.</p>
        </Card>
        <Card variant="ombre" className="grid gap-1">
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Mode 2</p>
          <p className="font-bold text-text-1">Levée d'objections</p>
          <p className="text-sm text-text-2">
            Décision validée si aucune objection bloquante n'est levée.
          </p>
        </Card>
        <Card variant="ombre" className="grid gap-1">
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Mode 3</p>
          <p className="font-bold text-text-1">Jugement majoritaire</p>
          <p className="text-sm text-text-2">
            Méthode Balinski-Laraki. 7 mentions, médiane retenue.
          </p>
        </Card>
      </section>

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          <Video size={20} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Salles de décision ({salles.length})
        </Heading>

        {salles.length === 0 ? (
          <Alert variant="info" titre="Aucune salle pour le moment" className="mt-4">
            Les salles seront créées au fur et à mesure que les espaces (communes, fédérations, GT)
            ouvriront leurs assemblées. Les admins nationaux peuvent en créer depuis la console.
          </Alert>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {salles.map((s) => {
              const IconeVisibilite = ICONE_VISIBILITE[s.typeVisibilite] ?? Lock;
              return (
                <li key={s.id}>
                  <Link href={`/s-informer/decider/${s.slug}`} className="block hover:opacity-90">
                    <Card variant="ombre" className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info">{LIBELLE_ESPACE[s.espaceType] ?? s.espaceType}</Badge>
                        <Badge variant="default">
                          <IconeVisibilite size={12} aria-hidden="true" />
                          {LIBELLE_VISIBILITE[s.typeVisibilite] ?? s.typeVisibilite}
                        </Badge>
                      </div>
                      <h3 className="font-display font-bold text-lg text-text-1">{s.nom}</h3>
                      {s.description !== null ? (
                        <p className="line-clamp-2 text-sm text-text-2">{s.description}</p>
                      ) : null}
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Alert variant="info" titre="LiveKit pas encore branché" className="mt-12">
        L'infrastructure visio (LiveKit self-hosted ou Cloud) sera connectée dans un chantier dédié.
        En attendant, les réunions sont annoncées ici, les PV publiés, et la visio se fait sur une
        plateforme externe au choix de chaque collectif. Cf.{' '}
        <Link href="/comprendre/assemblee-confederale" className="text-brand hover:underline">
          gouvernance
        </Link>
        .
      </Alert>

      <section className="mt-8 flex items-center gap-2 text-sm text-text-3">
        <CalendarRange size={14} aria-hidden="true" />
        <Link href="/agenda" className="hover:underline">
          Voir toutes les prochaines réunions dans l'agenda
        </Link>
      </section>
    </Container>
  );
}
