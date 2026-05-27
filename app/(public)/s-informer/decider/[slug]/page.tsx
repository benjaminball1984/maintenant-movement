import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import {
  LIBELLE_MODE,
  LIBELLE_STATUT,
  chargerSalleParSlug,
  listerReunionsSalle,
} from '@/lib/decider';
import { CalendarRange, FileText, Video } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const salle = await chargerSalleParSlug(slug);
  return {
    title: salle !== null ? `Décider — ${salle.nom}` : 'Salle introuvable',
    description: salle?.description ?? undefined,
  };
}

/**
 * Page individuelle d'une salle Décider (V2.4.10).
 */
export default async function PageSalleDecider({ params }: Props) {
  const { slug } = await params;
  const salle = await chargerSalleParSlug(slug);
  if (salle === null) notFound();

  const [aVenir, passees] = await Promise.all([
    listerReunionsSalle(salle.id, { aVenir: true, limite: 10 }),
    listerReunionsSalle(salle.id, { aVenir: false, limite: 20 }),
  ]);
  // Sépare passées : statut terminee/annulee
  const reunionsPassees = passees.filter((r) => r.statut === 'terminee' || r.statut === 'annulee');

  return (
    <Container taille="md" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/decider" className="hover:text-brand">
          ← Toutes les salles
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Heading niveau={1}>
          <Video size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
          {salle.nom}
        </Heading>
        <BoutonAdminEditer href="/admin/national">Admin</BoutonAdminEditer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="info">{salle.espaceType}</Badge>
        <Badge variant="default">{salle.typeVisibilite}</Badge>
      </div>
      {salle.description !== null ? <p className="mt-4 text-text-2">{salle.description}</p> : null}

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          <CalendarRange size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Réunions à venir ({aVenir.length})
        </Heading>
        {aVenir.length === 0 ? (
          <Alert variant="info" titre="Aucune réunion planifiée" className="mt-3">
            Reviens bientôt — les réunions sont annoncées au moins 15 jours avant (cf. gouvernance
            assemblée confédérale).
          </Alert>
        ) : (
          <ul className="mt-3 grid gap-2">
            {aVenir.map((r) => (
              <li key={r.id}>
                <Card variant="ombre" className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="success">{LIBELLE_STATUT[r.statut]}</Badge>
                    <Badge variant="info">{LIBELLE_MODE[r.modeDecision]}</Badge>
                  </div>
                  <h3 className="font-display font-bold text-lg text-text-1">{r.titre}</h3>
                  <p className="text-text-3 text-xs">
                    {FORMATEUR.format(new Date(r.debutLe))}
                    {r.finLe !== null ? ` → ${FORMATEUR.format(new Date(r.finLe))}` : ''}
                  </p>
                  {r.ordreJourMd !== '' ? (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-text-2">Ordre du jour</summary>
                      <pre className="mt-2 whitespace-pre-wrap font-body text-text-1">
                        {r.ordreJourMd}
                      </pre>
                    </details>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          <FileText size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Réunions passées ({reunionsPassees.length})
        </Heading>
        {reunionsPassees.length === 0 ? (
          <p className="mt-3 text-sm text-text-3">Aucune réunion passée à afficher.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {reunionsPassees.map((r) => (
              <li key={r.id}>
                <Card variant="plat" className="grid gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={r.statut === 'terminee' ? 'success' : 'default'}>
                      {LIBELLE_STATUT[r.statut]}
                    </Badge>
                    <span className="text-text-3 text-xs">
                      {FORMATEUR.format(new Date(r.debutLe))}
                    </span>
                  </div>
                  <h3 className="font-bold text-text-1">{r.titre}</h3>
                  {r.pvMd !== null && r.pvMd !== '' ? (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-text-2">Procès-verbal</summary>
                      <pre className="mt-2 whitespace-pre-wrap font-body text-text-1">{r.pvMd}</pre>
                    </details>
                  ) : (
                    <p className="text-text-3 text-xs">PV pas encore publié.</p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
