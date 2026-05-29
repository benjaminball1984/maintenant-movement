import { FilCommentaires } from '@/components/commentaires/FilCommentaires';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { BoutonReserverOffre } from '@/components/reservation/BoutonReserverOffre';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import { offreParSlug } from '@/lib/entraide/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import type { OffreTypeReservation } from '@/lib/reservation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const FALLBACKS = {
  retourPrefix: '←',
  badgeOffre: 'Offre',
  badgeDemande: 'Demande',
  badgeCloturee: 'Clôturée',
  badgeRetiree: 'Retirée',
  alertRetireeTitre: 'Offre retirée',
  alertClotureeTitre: 'Offre clôturée',
  alertRetireeAmorce: 'Raison :',
  alertRetireeNonPrecisee: 'non précisée',
  alertClotureeCorps: "L'auteur·ice a clôturé cette offre.",
  labelLieu: 'Lieu',
  coordonneesPrefix: 'Coordonnées :',
  voirCarte: 'voir sur la carte',
  sectionDescription: 'Description',
  sectionReserver: 'Demander une réservation',
  reserverHint:
    'Propose un créneau et la quantité souhaitée. Un message d’amorce sera pré-rempli et envoyé à l’auteur·ice via la messagerie interne (chantier réseau social).',
  footerAmorce: 'Publiée par',
  footerMilieu: 'le',
};

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const offre = await offreParSlug(slug);
  if (offre === null) return { title: 'Offre introuvable' };
  // Mapping fin offre.type → TypeObjet pour la matrice d'images par défaut.
  // En V2 la bibliothèque mutualise les sous-types (transport/hébergement/prêt)
  // sur la même image générique `offre-entraide.svg` (cf. images-defaut.ts).
  const typeObjet =
    offre.type === 'transport'
      ? 'offre_transport'
      : offre.type === 'hebergement'
        ? 'offre_hebergement'
        : offre.type === 'pret_objet'
          ? 'offre_pret'
          : 'offre_entraide';
  return metadataPourPartage({
    objet: {
      titre: offre.titre,
      description: offre.description,
      image_url: offre.image_url,
      type_objet: typeObjet,
    },
    cheminPage: `/s-entraider/offre/${slug}`,
  });
}

export default async function PageOffreDetail({ params }: PageDetailProps) {
  const { slug } = await params;
  const [
    offre,
    estAdmin,
    session,
    retourPrefix,
    badgeOffre,
    badgeDemande,
    badgeCloturee,
    badgeRetiree,
    alertRetireeTitre,
    alertClotureeTitre,
    alertRetireeAmorce,
    alertRetireeNonPrecisee,
    alertClotureeCorps,
    labelLieu,
    coordonneesPrefix,
    voirCarte,
    sectionDescription,
    sectionReserver,
    reserverHint,
    footerAmorce,
    footerMilieu,
  ] = await Promise.all([
    offreParSlug(slug),
    estAdminCourant(),
    getSession(),
    lireContenuEditorial('offre.fiche.retour_prefix', { valeurMd: FALLBACKS.retourPrefix }),
    lireContenuEditorial('offre.fiche.badge_offre', { valeurMd: FALLBACKS.badgeOffre }),
    lireContenuEditorial('offre.fiche.badge_demande', { valeurMd: FALLBACKS.badgeDemande }),
    lireContenuEditorial('offre.fiche.badge_cloturee', { valeurMd: FALLBACKS.badgeCloturee }),
    lireContenuEditorial('offre.fiche.badge_retiree', { valeurMd: FALLBACKS.badgeRetiree }),
    lireContenuEditorial('offre.fiche.alert_retiree_titre', {
      valeurMd: FALLBACKS.alertRetireeTitre,
    }),
    lireContenuEditorial('offre.fiche.alert_cloturee_titre', {
      valeurMd: FALLBACKS.alertClotureeTitre,
    }),
    lireContenuEditorial('offre.fiche.alert_retiree_amorce', {
      valeurMd: FALLBACKS.alertRetireeAmorce,
    }),
    lireContenuEditorial('offre.fiche.alert_retiree_non_precisee', {
      valeurMd: FALLBACKS.alertRetireeNonPrecisee,
    }),
    lireContenuEditorial('offre.fiche.alert_cloturee_corps', {
      valeurMd: FALLBACKS.alertClotureeCorps,
    }),
    lireContenuEditorial('offre.fiche.label_lieu', { valeurMd: FALLBACKS.labelLieu }),
    lireContenuEditorial('offre.fiche.coordonnees_prefix', {
      valeurMd: FALLBACKS.coordonneesPrefix,
    }),
    lireContenuEditorial('offre.fiche.voir_carte', { valeurMd: FALLBACKS.voirCarte }),
    lireContenuEditorial('offre.fiche.section_description', {
      valeurMd: FALLBACKS.sectionDescription,
    }),
    lireContenuEditorial('offre.fiche.section_reserver', {
      valeurMd: FALLBACKS.sectionReserver,
    }),
    lireContenuEditorial('offre.fiche.reserver_hint', { valeurMd: FALLBACKS.reserverHint }),
    lireContenuEditorial('offre.fiche.footer_amorce', { valeurMd: FALLBACKS.footerAmorce }),
    lireContenuEditorial('offre.fiche.footer_milieu', { valeurMd: FALLBACKS.footerMilieu }),
  ]);
  if (offre === null) notFound();

  const config = SOUS_ESPACES[offre.type];
  const estPubliee = offre.statut === 'publiee';
  const offreTypeReservation: OffreTypeReservation =
    offre.type === 'transport'
      ? 'transport_covoiturage'
      : offre.type === 'hebergement'
        ? 'hebergement'
        : offre.type === 'pret_objet'
          ? 'pret'
          : 'autre';

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href={`/s-entraider/${config.slug}`} className="hover:text-brand">
          <TexteEditableAdmin
            cle="offre.fiche.retour_prefix"
            valeurInitiale={retourPrefix.valeurMd}
            estAdmin={estAdmin}
            libelle="prefixe retour (defaut : ←). Le titre du sous-espace s'ajoute apres."
            longueurMax={10}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          {config.titre}
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            {offre.sens === 'propose' ? (
              <TexteEditableAdmin
                cle="offre.fiche.badge_offre"
                valeurInitiale={badgeOffre.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Offre"
                longueurMax={20}
              >
                {(t) => <Badge variant="success">{t}</Badge>}
              </TexteEditableAdmin>
            ) : (
              <TexteEditableAdmin
                cle="offre.fiche.badge_demande"
                valeurInitiale={badgeDemande.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Demande"
                longueurMax={20}
              >
                {(t) => <Badge variant="info">{t}</Badge>}
              </TexteEditableAdmin>
            )}
            {offre.statut === 'cloturee' ? (
              <TexteEditableAdmin
                cle="offre.fiche.badge_cloturee"
                valeurInitiale={badgeCloturee.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Cloturee"
                longueurMax={20}
              >
                {(t) => <Badge variant="default">{t}</Badge>}
              </TexteEditableAdmin>
            ) : null}
            {offre.statut === 'retiree' ? (
              <TexteEditableAdmin
                cle="offre.fiche.badge_retiree"
                valeurInitiale={badgeRetiree.valeurMd}
                estAdmin={estAdmin}
                libelle="badge Retiree"
                longueurMax={20}
              >
                {(t) => <Badge variant="warning">{t}</Badge>}
              </TexteEditableAdmin>
            ) : null}
          </div>
          <Heading niveau={1}>{offre.titre}</Heading>

          {offre.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={offre.image_url}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}
        </header>

        {!estPubliee ? (
          <Alert
            variant={offre.statut === 'retiree' ? 'danger' : 'info'}
            titre={
              offre.statut === 'retiree' ? (
                <TexteEditableAdmin
                  cle="offre.fiche.alert_retiree_titre"
                  valeurInitiale={alertRetireeTitre.valeurMd}
                  estAdmin={estAdmin}
                  libelle="titre alerte offre retiree"
                  longueurMax={40}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>
              ) : (
                <TexteEditableAdmin
                  cle="offre.fiche.alert_cloturee_titre"
                  valeurInitiale={alertClotureeTitre.valeurMd}
                  estAdmin={estAdmin}
                  libelle="titre alerte offre cloturee"
                  longueurMax={40}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>
              )
            }
          >
            {offre.statut === 'retiree' ? (
              <>
                <TexteEditableAdmin
                  cle="offre.fiche.alert_retiree_amorce"
                  valeurInitiale={alertRetireeAmorce.valeurMd}
                  estAdmin={estAdmin}
                  libelle="amorce alerte retiree (Raison :)"
                  longueurMax={30}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>{' '}
                {offre.raison_retrait ?? (
                  <TexteEditableAdmin
                    cle="offre.fiche.alert_retiree_non_precisee"
                    valeurInitiale={alertRetireeNonPrecisee.valeurMd}
                    estAdmin={estAdmin}
                    libelle="fallback si pas de raison"
                    longueurMax={30}
                  >
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>
                )}
                .
              </>
            ) : (
              <TexteEditableAdmin
                cle="offre.fiche.alert_cloturee_corps"
                valeurInitiale={alertClotureeCorps.valeurMd}
                estAdmin={estAdmin}
                libelle="corps alerte offre cloturee"
                longueurMax={200}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            )}
          </Alert>
        ) : null}

        <Card variant="ombre" className="grid gap-2">
          <TexteEditableAdmin
            cle="offre.fiche.label_lieu"
            valeurInitiale={labelLieu.valeurMd}
            estAdmin={estAdmin}
            libelle="label Lieu"
            longueurMax={20}
          >
            {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
          </TexteEditableAdmin>
          <p className="text-text-1">{offre.lieu}</p>
          {offre.latitude !== null && offre.longitude !== null ? (
            <p className="text-xs text-text-3">
              <TexteEditableAdmin
                cle="offre.fiche.coordonnees_prefix"
                valeurInitiale={coordonneesPrefix.valeurMd}
                estAdmin={estAdmin}
                libelle="prefixe coordonnees"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              {offre.latitude.toFixed(4)}, {offre.longitude.toFixed(4)} ·{' '}
              <TexteEditableAdmin
                cle="offre.fiche.voir_carte"
                valeurInitiale={voirCarte.valeurMd}
                estAdmin={estAdmin}
                libelle="libelle lien voir sur la carte"
                longueurMax={40}
              >
                {(t) => (
                  <Link href="/carte" className="text-brand hover:underline">
                    {t}
                  </Link>
                )}
              </TexteEditableAdmin>
            </p>
          ) : null}
        </Card>

        <section className="grid gap-3">
          <TexteEditableAdmin
            cle="offre.fiche.section_description"
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
            {offre.description}
          </div>
        </section>

        {estPubliee && offreTypeReservation !== 'autre' ? (
          <Card variant="ombre">
            <TexteEditableAdmin
              cle="offre.fiche.section_reserver"
              valeurInitiale={sectionReserver.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section Demander une reservation"
              longueurMax={60}
            >
              {(t) => (
                <Heading niveau={2} apparenceComme={4}>
                  {t}
                </Heading>
              )}
            </TexteEditableAdmin>
            <TexteEditableAdmin
              cle="offre.fiche.reserver_hint"
              valeurInitiale={reserverHint.valeurMd}
              estAdmin={estAdmin}
              libelle="hint section reservation"
              multilignes
              longueurMax={400}
            >
              {(t) => <p className="mt-2 mb-4 text-sm text-text-2">{t}</p>}
            </TexteEditableAdmin>
            <BoutonReserverOffre
              offreType={offreTypeReservation}
              offreId={offre.id}
              estConnecte={session !== null}
              estCreateur={session?.userId === offre.createurice_id}
              cheminRevalidation={`/s-entraider/offre/${slug}`}
            />
          </Card>
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {offre.createurice_prenom !== null || offre.createurice_nom !== null ? (
            <p>
              <TexteEditableAdmin
                cle="offre.fiche.footer_amorce"
                valeurInitiale={footerAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce footer (Publiee par)"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <strong className="text-text-2">
                {[offre.createurice_prenom, offre.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>{' '}
              <TexteEditableAdmin
                cle="offre.fiche.footer_milieu"
                valeurInitiale={footerMilieu.valeurMd}
                estAdmin={estAdmin}
                libelle="conjonction (le)"
                longueurMax={10}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <time dateTime={offre.created_at}>
                {new Date(offre.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              .
            </p>
          ) : null}
        </footer>

        <FilCommentaires
          objetType="offre_entraide"
          objetId={offre.id}
          cheminRevalidation={`/s-entraider/offre/${slug}`}
        />
      </article>
    </>
  );
}
