import { participerMoment } from '@/app/(public)/agir/moments-solidaires/actions';
import { annulerMomentAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { FilCommentaires } from '@/components/commentaires/FilCommentaires';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { BoutonParticiperMoment } from '@/components/moments/BoutonParticiperMoment';
import { LienAuteurReseau } from '@/components/reseau/LienAuteurReseau';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { TYPES_MOMENTS, gabaritFlyerPortAPorte } from '@/lib/moments/config';
import { listerTupperwaresDuMoment, momentSolidaireParSlug } from '@/lib/moments/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { CalendarRange, MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const FALLBACKS = {
  retour: '← Moments solidaires',
  labelQuand: 'Quand',
  labelJusquau: "Jusqu'au",
  labelOu: 'Où',
  labelParticipants: 'Participant·es',
  sectionDescription: 'Description',
  sectionRdvAmorce: 'Les',
  sectionRdvFin: 'RDV de ce cycle',
  flyerTitre: 'Flyer généré (sans écriture inclusive — accessibilité tactique §7C)',
  flyerNote:
    "Microcopie volontairement non-inclusive pour l'usage flyer (cf. doctrine §7C). Le reste du site reste inclusif.",
  sectionParticiper: 'Participer',
  alertNonConnecteAmorce: 'Tu peux participer sans laisser tes coordonnées, ou',
  alertNonConnecteLien: 'te connecter',
  alertNonConnecteFin: 'pour suivre tes engagements.',
  trackerTitre: 'Tracker Tupperwares (organisateurice uniquement)',
  trackerEmptyTitre: 'Aucun Tupperware emporté',
  trackerEmptyCorps:
    "Le tracker note les Tupperwares emportés par les participant·es au repas solidaire pour la boucle d'engagement (cf. doctrine §7C).",
  adminSectionTitre: 'Actions admin',
};

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
  const { slug } = await params;
  const [
    estAdmin,
    moment,
    session,
    retour,
    labelQuand,
    labelJusquau,
    labelOu,
    labelParticipants,
    sectionDescription,
    sectionRdvAmorce,
    sectionRdvFin,
    flyerTitre,
    flyerNote,
    sectionParticiper,
    alertNonConnecteAmorce,
    alertNonConnecteLien,
    alertNonConnecteFin,
    trackerTitre,
    trackerEmptyTitre,
    trackerEmptyCorps,
    adminSectionTitre,
  ] = await Promise.all([
    estAdminCourant(),
    momentSolidaireParSlug(slug),
    getSession(),
    lireContenuEditorial('moments.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('moments.fiche.label_quand', { valeurMd: FALLBACKS.labelQuand }),
    lireContenuEditorial('moments.fiche.label_jusquau', { valeurMd: FALLBACKS.labelJusquau }),
    lireContenuEditorial('moments.fiche.label_ou', { valeurMd: FALLBACKS.labelOu }),
    lireContenuEditorial('moments.fiche.label_participants', {
      valeurMd: FALLBACKS.labelParticipants,
    }),
    lireContenuEditorial('moments.fiche.section_description', {
      valeurMd: FALLBACKS.sectionDescription,
    }),
    lireContenuEditorial('moments.fiche.section_rdv_amorce', {
      valeurMd: FALLBACKS.sectionRdvAmorce,
    }),
    lireContenuEditorial('moments.fiche.section_rdv_fin', { valeurMd: FALLBACKS.sectionRdvFin }),
    lireContenuEditorial('moments.fiche.flyer_titre', { valeurMd: FALLBACKS.flyerTitre }),
    lireContenuEditorial('moments.fiche.flyer_note', { valeurMd: FALLBACKS.flyerNote }),
    lireContenuEditorial('moments.fiche.section_participer', {
      valeurMd: FALLBACKS.sectionParticiper,
    }),
    lireContenuEditorial('moments.fiche.alert_non_connecte_amorce', {
      valeurMd: FALLBACKS.alertNonConnecteAmorce,
    }),
    lireContenuEditorial('moments.fiche.alert_non_connecte_lien', {
      valeurMd: FALLBACKS.alertNonConnecteLien,
    }),
    lireContenuEditorial('moments.fiche.alert_non_connecte_fin', {
      valeurMd: FALLBACKS.alertNonConnecteFin,
    }),
    lireContenuEditorial('moments.fiche.tracker_titre', { valeurMd: FALLBACKS.trackerTitre }),
    lireContenuEditorial('moments.fiche.tracker_empty_titre', {
      valeurMd: FALLBACKS.trackerEmptyTitre,
    }),
    lireContenuEditorial('moments.fiche.tracker_empty_corps', {
      valeurMd: FALLBACKS.trackerEmptyCorps,
    }),
    lireContenuEditorial('moments.fiche.admin_section_titre', {
      valeurMd: FALLBACKS.adminSectionTitre,
    }),
  ]);

  if (moment === null) notFound();

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
        <TexteEditableAdmin
          cle="moments.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour vers liste moments"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/agir/moments-solidaires" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
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
            <CalendarRange
              size={18}
              strokeWidth={1.5}
              className="mt-0.5 text-text-3"
              aria-hidden="true"
            />
            <div>
              <TexteEditableAdmin
                cle="moments.fiche.label_quand"
                valeurInitiale={labelQuand.valeurMd}
                estAdmin={estAdmin}
                libelle="label Quand"
                longueurMax={20}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
              </TexteEditableAdmin>
              <p className="text-text-1">{FORMATEUR_LONG.format(new Date(moment.commence_le))}</p>
              {moment.termine_le !== null ? (
                <p className="text-sm text-text-3">
                  <TexteEditableAdmin
                    cle="moments.fiche.label_jusquau"
                    valeurInitiale={labelJusquau.valeurMd}
                    estAdmin={estAdmin}
                    libelle="prefixe 'Jusqu'au'"
                    longueurMax={20}
                  >
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>{' '}
                  {FORMATEUR_LONG.format(new Date(moment.termine_le))}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" aria-hidden="true" />
            <div>
              <TexteEditableAdmin
                cle="moments.fiche.label_ou"
                valeurInitiale={labelOu.valeurMd}
                estAdmin={estAdmin}
                libelle="label Ou"
                longueurMax={20}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
              </TexteEditableAdmin>
              <p className="text-text-1">{moment.lieu}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" aria-hidden="true" />
            <div>
              <TexteEditableAdmin
                cle="moments.fiche.label_participants"
                valeurInitiale={labelParticipants.valeurMd}
                estAdmin={estAdmin}
                libelle="label Participant·es"
                longueurMax={30}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
              </TexteEditableAdmin>
              <p className="text-text-1">
                {moment.nombre_participants}
                {moment.capacite_max !== null ? ` / ${moment.capacite_max}` : ''}
              </p>
            </div>
          </div>
        </Card>

        <section className="grid gap-3">
          <TexteEditableAdmin
            cle="moments.fiche.section_description"
            valeurInitiale={sectionDescription.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section description"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={3}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {moment.description}
          </div>
        </section>

        {moment.enfants.length > 0 ? (
          <section className="grid gap-3">
            <Heading niveau={2} apparenceComme={3}>
              <TexteEditableAdmin
                cle="moments.fiche.section_rdv_amorce"
                valeurInitiale={sectionRdvAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce titre RDV (avant le compteur)"
                longueurMax={20}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              {moment.enfants.length}{' '}
              <TexteEditableAdmin
                cle="moments.fiche.section_rdv_fin"
                valeurInitiale={sectionRdvFin.valeurMd}
                estAdmin={estAdmin}
                libelle="fin titre RDV (apres le compteur)"
                longueurMax={50}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
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
            <TexteEditableAdmin
              cle="moments.fiche.flyer_titre"
              valeurInitiale={flyerTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section flyer genere"
              longueurMax={100}
            >
              {(t) => (
                <Heading niveau={2} apparenceComme={4}>
                  {t}
                </Heading>
              )}
            </TexteEditableAdmin>
            <pre className="whitespace-pre-wrap font-mono text-xs text-text-2">{flyer}</pre>
            <TexteEditableAdmin
              cle="moments.fiche.flyer_note"
              valeurInitiale={flyerNote.valeurMd}
              estAdmin={estAdmin}
              libelle="note bas du flyer"
              multilignes
              longueurMax={300}
            >
              {(t) => <p className="text-xs text-text-3">{t}</p>}
            </TexteEditableAdmin>
          </Card>
        ) : null}

        {session !== null && !estOrganisateurice && moment.statut === 'annonce' ? (
          <Card variant="eleve" className="grid gap-3">
            <TexteEditableAdmin
              cle="moments.fiche.section_participer"
              valeurInitiale={sectionParticiper.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section Participer (connecte)"
              longueurMax={30}
            >
              {(t) => (
                <Heading niveau={2} apparenceComme={4}>
                  {t}
                </Heading>
              )}
            </TexteEditableAdmin>
            <BoutonParticiperMoment momentId={moment.id} participerMoment={participerMoment} />
          </Card>
        ) : null}

        {session === null ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="moments.fiche.section_participer"
                valeurInitiale={sectionParticiper.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte Participer (non connecte) - cle partagee avec section connectee"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="moments.fiche.alert_non_connecte_amorce"
              valeurInitiale={alertNonConnecteAmorce.valeurMd}
              estAdmin={estAdmin}
              libelle="amorce alerte (avant le lien)"
              multilignes
              longueurMax={200}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="moments.fiche.alert_non_connecte_lien"
              valeurInitiale={alertNonConnecteLien.valeurMd}
              estAdmin={estAdmin}
              libelle="libelle du lien (te connecter)"
              longueurMax={40}
            >
              {(t) => (
                <Link
                  href={`/connexion?prochaine=/agir/moments-solidaires/${moment.slug}`}
                  className="underline"
                >
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="moments.fiche.alert_non_connecte_fin"
              valeurInitiale={alertNonConnecteFin.valeurMd}
              estAdmin={estAdmin}
              libelle="fin alerte (apres le lien)"
              longueurMax={100}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : null}

        {estOrganisateurice ? (
          <section className="grid gap-3">
            <TexteEditableAdmin
              cle="moments.fiche.tracker_titre"
              valeurInitiale={trackerTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section tracker Tupperwares"
              longueurMax={80}
            >
              {(t) => (
                <Heading niveau={2} apparenceComme={3}>
                  {t}
                </Heading>
              )}
            </TexteEditableAdmin>
            {tupperwares.length === 0 ? (
              <Alert
                variant="info"
                titre={
                  <TexteEditableAdmin
                    cle="moments.fiche.tracker_empty_titre"
                    valeurInitiale={trackerEmptyTitre.valeurMd}
                    estAdmin={estAdmin}
                    libelle="titre alerte tracker vide"
                    longueurMax={60}
                  >
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>
                }
              >
                <TexteEditableAdmin
                  cle="moments.fiche.tracker_empty_corps"
                  valeurInitiale={trackerEmptyCorps.valeurMd}
                  estAdmin={estAdmin}
                  libelle="corps alerte tracker vide"
                  multilignes
                  longueurMax={300}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>
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

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          Organisé·e par{' '}
          <LienAuteurReseau
            personneId={moment.createurice_id}
            nom={
              [moment.createurice_prenom, moment.createurice_nom]
                .filter((s) => s !== null && s.trim() !== '')
                .join(' ') || 'un membre'
            }
            className="font-bold text-text-2"
          />
        </footer>

        <FilCommentaires
          objetType="moment_solidaire"
          objetId={moment.id}
          cheminRevalidation={`/agir/moments-solidaires/${slug}`}
        />
      </article>

      {estAdmin ? (
        <section
          aria-label="Actions admin"
          className="mt-12 grid gap-3 border-t border-border pt-8"
        >
          <TexteEditableAdmin
            cle="moments.fiche.admin_section_titre"
            valeurInitiale={adminSectionTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section actions admin"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={4}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
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
