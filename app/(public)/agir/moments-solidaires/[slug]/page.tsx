import { participerMoment } from '@/app/(public)/agir/moments-solidaires/actions';
import { annulerMomentAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { BoutonParticiperMoment } from '@/components/moments/BoutonParticiperMoment';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { TYPES_MOMENTS, gabaritFlyerPortAPorte } from '@/lib/moments/config';
import { listerTupperwaresDuMoment, momentSolidaireParSlug } from '@/lib/moments/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { CalendarRange, MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

const FORMATEUR_LONG = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const FORMATEUR_COURT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
});

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const moment = await momentSolidaireParSlug(slug);
  if (moment === null) return { title: 'Moment introuvable' };
  return metadataPourPartage({
    objet: {
      titre: moment.titre,
      description: moment.description,
      // Pas de champ image en V1 sur moment_solidaire : on tombe sur l'image
      // par défaut « moment_solidaire » de la bibliothèque ET1.
      image_url: null,
      type_objet: 'moment_solidaire',
    },
    cheminPage: `/agir/moments-solidaires/${slug}`,
  });
}

export default async function PageDetailMoment({ params }: PageDetailProps) {
  const estAdmin = await estAdminCourant();
  const { slug } = await params;
  const moment = await momentSolidaireParSlug(slug);
  if (moment === null) notFound();

  const session = await getSession();
  const estOrganisateurice = session?.userId === moment.createurice_id;
  const tupperwares = estOrganisateurice ? await listerTupperwaresDuMoment(moment.id) : [];
  const config = TYPES_MOMENTS[moment.type];
  const estPap = moment.type === 'porte_a_porte' && moment.parent_id === null;

  const flyer = estPap
    ? gabaritFlyerPortAPorte({
        lieu: moment.lieu,
        dateHumaine: FORMATEUR_COURT.format(new Date(moment.commence_le)),
        contact: 'contact@maintenant-le-mouvement.org',
      })
    : null;

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/moments-solidaires" className="hover:text-brand">
          ← Moments solidaires
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={moment.type === 'porte_a_porte' ? 'brand' : 'accent'}>
                {config.libelle}
              </Badge>
              {moment.statut !== 'annonce' ? (
                <Badge variant="default">{moment.statut}</Badge>
              ) : null}
            </div>
            <BoutonAdminEditer href={`/admin/moderation/moments?id=${moment.id}`}>
              Admin
            </BoutonAdminEditer>
          </div>
          <Heading niveau={1}>{moment.titre}</Heading>
        </header>

        <Card variant="ombre" className="grid gap-3">
          <div className="flex items-start gap-3">
            <CalendarRange size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">Quand</p>
              <p className="text-text-1">{FORMATEUR_LONG.format(new Date(moment.commence_le))}</p>
              {moment.termine_le !== null ? (
                <p className="text-sm text-text-3">
                  Jusqu'au {FORMATEUR_LONG.format(new Date(moment.termine_le))}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">Où</p>
              <p className="text-text-1">{moment.lieu}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">Participant·es</p>
              <p className="text-text-1">
                {moment.nombre_participants}
                {moment.capacite_max !== null ? ` / ${moment.capacite_max}` : ''}
              </p>
            </div>
          </div>
        </Card>

        <section className="grid gap-3">
          <Heading niveau={2} apparenceComme={3}>
            Description
          </Heading>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {moment.description}
          </div>
        </section>

        {moment.enfants.length > 0 ? (
          <section className="grid gap-3">
            <Heading niveau={2} apparenceComme={3}>
              Les {moment.enfants.length} RDV de ce cycle
            </Heading>
            <ul className="grid gap-3">
              {moment.enfants.map((enfant) => (
                <li key={enfant.id}>
                  <Card variant="ombre" className="grid gap-1">
                    <p className="text-xs font-bold uppercase tracking-cap text-text-3">
                      {FORMATEUR_LONG.format(new Date(enfant.commence_le))}
                    </p>
                    <h3 className="font-bold text-text-1">
                      <Link
                        href={`/agir/moments-solidaires/${enfant.slug}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {enfant.titre}
                      </Link>
                    </h3>
                    <p className="text-sm text-text-2">{enfant.description}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {flyer !== null ? (
          <Card variant="ombre" className="grid gap-2 bg-surface-2">
            <Heading niveau={2} apparenceComme={4}>
              Flyer généré (sans écriture inclusive — accessibilité tactique §7C)
            </Heading>
            <pre className="whitespace-pre-wrap font-mono text-xs text-text-2">{flyer}</pre>
            <p className="text-xs text-text-3">
              Microcopie volontairement non-inclusive pour l'usage flyer (cf. doctrine §7C). Le
              reste du site reste inclusif.
            </p>
          </Card>
        ) : null}

        {session !== null && !estOrganisateurice && moment.statut === 'annonce' ? (
          <Card variant="eleve" className="grid gap-3">
            <Heading niveau={2} apparenceComme={4}>
              Participer
            </Heading>
            <BoutonParticiperMoment momentId={moment.id} participerMoment={participerMoment} />
          </Card>
        ) : null}

        {session === null ? (
          <Alert variant="info" titre="Participer">
            Tu peux participer sans laisser tes coordonnées, ou{' '}
            <Link
              href={`/connexion?prochaine=/agir/moments-solidaires/${moment.slug}`}
              className="underline"
            >
              te connecter
            </Link>{' '}
            pour suivre tes engagements.
          </Alert>
        ) : null}

        {estOrganisateurice ? (
          <section className="grid gap-3">
            <Heading niveau={2} apparenceComme={3}>
              Tracker Tupperwares (organisateurice uniquement)
            </Heading>
            {tupperwares.length === 0 ? (
              <Alert variant="info" titre="Aucun Tupperware emporté">
                Le tracker note les Tupperwares emportés par les participant·es au repas solidaire
                pour la boucle d'engagement (cf. doctrine §7C).
              </Alert>
            ) : (
              <ul className="grid gap-2">
                {tupperwares.map((t) => (
                  <li key={t.id}>
                    <Card
                      variant="ombre"
                      className="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-bold text-text-1">{t.porteureuse_prenom}</p>
                        {t.contenu !== null ? (
                          <p className="text-sm text-text-3">{t.contenu}</p>
                        ) : null}
                      </div>
                      <Badge
                        variant={
                          t.statut === 'rendu'
                            ? 'success'
                            : t.statut === 'perdu'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {t.statut}
                      </Badge>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </article>

      {estAdmin ? (
        <section
          aria-label="Actions admin"
          className="mt-12 grid gap-3 border-t border-border pt-8"
        >
          <Heading niveau={2} apparenceComme={4}>
            Actions admin
          </Heading>
          {moment.statut !== 'retire' ? (
            <BoutonArchiverEntite
              id={moment.id}
              action={annulerMomentAction}
              verbe="Retirer le moment"
              description="Statut → 'retire'. Le moment disparaît de la liste publique."
            />
          ) : null}
          <BoutonSupprimerEntite
            table="moment_solidaire"
            id={moment.id}
            redirigerVers="/agir/moments-solidaires"
          />
        </section>
      ) : null}
    </Container>
  );
}
