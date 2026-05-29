import { retirerMobilisationAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { BoutonAttacherACampagne } from '@/components/campagnes/BoutonAttacherACampagne';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { BoutonParticiper } from '@/components/mobilisations/BoutonParticiper';
import { BoutonsPartage } from '@/components/partage/BoutonsPartage';
import { Alert, Card, Container, Heading } from '@/components/ui';
import { getSiteUrl } from '@/config/site';
import { estAdminCourant } from '@/lib/auth/admin';
import { listerCampagnesPubliees } from '@/lib/campagnes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterPlage, formaterRelativeAVenir } from '@/lib/mobilisations/dates';
import { dejaParticipante, mobilisationParSlug } from '@/lib/mobilisations/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { Calendar, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { participerMobilisation } from '../actions';

const FALLBACKS = {
  retour: '← Toutes les mobilisations',
  preheader: 'Mobilisation',
  alertRetireeTitre: 'Mobilisation retirée',
  alertRetireeAmorce: 'Raison :',
  alertRetireeNonPrecisee: 'non précisée',
  alertRetireeFin: '. Tu peux republier une version corrigée si tu en es la créateurice.',
  labelQuand: 'Quand',
  labelOu: 'Où',
  coordonneesPrefix: 'Coordonnées :',
  voirCarte: 'voir sur la carte',
  sectionDescription: 'Description',
  footerAmorce: 'Organisée par',
  adminSectionTitre: 'Actions admin',
};

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const mobilisation = await mobilisationParSlug(slug);
  if (mobilisation === null) {
    return { title: 'Mobilisation introuvable' };
  }
  return metadataPourPartage({
    objet: {
      titre: mobilisation.titre,
      description: mobilisation.description,
      image_url: mobilisation.image_url,
      type_objet: 'mobilisation',
    },
    cheminPage: `/mobiliser/mobilisations/${slug}`,
  });
}

/**
 * Fiche détail d'une mobilisation (`/mobiliser/mobilisations/[slug]`).
 *
 * - 404 si introuvable / non lisible (RLS : seules les publiées sont
 *   accessibles publiquement).
 * - Affiche image, titre, plage de dates, lieu, description.
 * - `<BoutonParticiper>` géré côté client (cookie anonyme + Server Action).
 * - Si la mobilisation est retirée et la personne connectée en est la
 *   créateurice, affiche la raison du retrait.
 */
export default async function PageMobilisationDetail({ params }: PageDetailProps) {
  const { slug } = await params;
  const [
    mobilisation,
    estAdmin,
    retour,
    preheader,
    alertRetireeTitre,
    alertRetireeAmorce,
    alertRetireeNonPrecisee,
    alertRetireeFin,
    labelQuand,
    labelOu,
    coordonneesPrefix,
    voirCarte,
    sectionDescription,
    footerAmorce,
    adminSectionTitre,
  ] = await Promise.all([
    mobilisationParSlug(slug),
    estAdminCourant(),
    lireContenuEditorial('mobilisations.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('mobilisations.fiche.preheader', { valeurMd: FALLBACKS.preheader }),
    lireContenuEditorial('mobilisations.fiche.alert_retiree_titre', {
      valeurMd: FALLBACKS.alertRetireeTitre,
    }),
    lireContenuEditorial('mobilisations.fiche.alert_retiree_amorce', {
      valeurMd: FALLBACKS.alertRetireeAmorce,
    }),
    lireContenuEditorial('mobilisations.fiche.alert_retiree_non_precisee', {
      valeurMd: FALLBACKS.alertRetireeNonPrecisee,
    }),
    lireContenuEditorial('mobilisations.fiche.alert_retiree_fin', {
      valeurMd: FALLBACKS.alertRetireeFin,
    }),
    lireContenuEditorial('mobilisations.fiche.label_quand', { valeurMd: FALLBACKS.labelQuand }),
    lireContenuEditorial('mobilisations.fiche.label_ou', { valeurMd: FALLBACKS.labelOu }),
    lireContenuEditorial('mobilisations.fiche.coordonnees_prefix', {
      valeurMd: FALLBACKS.coordonneesPrefix,
    }),
    lireContenuEditorial('mobilisations.fiche.voir_carte', { valeurMd: FALLBACKS.voirCarte }),
    lireContenuEditorial('mobilisations.fiche.section_description', {
      valeurMd: FALLBACKS.sectionDescription,
    }),
    lireContenuEditorial('mobilisations.fiche.footer_amorce', {
      valeurMd: FALLBACKS.footerAmorce,
    }),
    lireContenuEditorial('mobilisations.fiche.admin_section_titre', {
      valeurMd: FALLBACKS.adminSectionTitre,
    }),
  ]);

  if (mobilisation === null) {
    notFound();
  }

  const dejaInscrite = await dejaParticipante(mobilisation.id);
  const estPubliee = mobilisation.statut === 'publiee';

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="mobilisations.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour vers liste mobilisations"
          longueurMax={60}
        >
          {(t) => (
            <Link href="/mobiliser/mobilisations" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>

      <article className="grid gap-8">
        <header className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <TexteEditableAdmin
              cle="mobilisations.fiche.preheader"
              valeurInitiale={preheader.valeurMd}
              estAdmin={estAdmin}
              libelle="preheader 'Mobilisation'"
              longueurMax={30}
            >
              {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
            </TexteEditableAdmin>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-cap text-brand">
                {formaterRelativeAVenir(mobilisation.date_debut)}
              </p>
              <BoutonAdminEditer href={`/admin/moderation/mobilisations?id=${mobilisation.id}`}>
                Admin
              </BoutonAdminEditer>
            </div>
          </div>
          <Heading niveau={1}>{mobilisation.titre}</Heading>

          {/* V2.5.11.c — bouton admin "Intégrer à une campagne" sur mobilisation. */}
          {estAdmin ? (
            <BoutonAttacherACampagne
              typeModule="mobilisation"
              cibleId={mobilisation.id}
              campagnes={(await listerCampagnesPubliees()).map((c) => ({
                id: c.id,
                titre: c.titre,
              }))}
            />
          ) : null}

          {mobilisation.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={mobilisation.image_url}
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
            variant="danger"
            titre={
              <TexteEditableAdmin
                cle="mobilisations.fiche.alert_retiree_titre"
                valeurInitiale={alertRetireeTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte mobilisation retiree"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="mobilisations.fiche.alert_retiree_amorce"
              valeurInitiale={alertRetireeAmorce.valeurMd}
              estAdmin={estAdmin}
              libelle="amorce alerte retiree (Raison :)"
              longueurMax={30}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            {mobilisation.raison_retrait ?? (
              <TexteEditableAdmin
                cle="mobilisations.fiche.alert_retiree_non_precisee"
                valeurInitiale={alertRetireeNonPrecisee.valeurMd}
                estAdmin={estAdmin}
                libelle="fallback si pas de raison"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            )}
            <TexteEditableAdmin
              cle="mobilisations.fiche.alert_retiree_fin"
              valeurInitiale={alertRetireeFin.valeurMd}
              estAdmin={estAdmin}
              libelle="fin alerte retiree"
              multilignes
              longueurMax={300}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : null}

        <dl className="grid gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
          <div className="flex items-start gap-3">
            <Calendar size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <TexteEditableAdmin
                cle="mobilisations.fiche.label_quand"
                valeurInitiale={labelQuand.valeurMd}
                estAdmin={estAdmin}
                libelle="label 'Quand'"
                longueurMax={20}
              >
                {(t) => <dt className="font-bold text-text-3">{t}</dt>}
              </TexteEditableAdmin>
              <dd className="text-text-1">
                {formaterPlage(mobilisation.date_debut, mobilisation.date_fin)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <TexteEditableAdmin
                cle="mobilisations.fiche.label_ou"
                valeurInitiale={labelOu.valeurMd}
                estAdmin={estAdmin}
                libelle="label 'Ou'"
                longueurMax={20}
              >
                {(t) => <dt className="font-bold text-text-3">{t}</dt>}
              </TexteEditableAdmin>
              <dd className="text-text-1">{mobilisation.lieu}</dd>
              {mobilisation.latitude !== null && mobilisation.longitude !== null ? (
                <dd className="mt-1 text-xs text-text-3">
                  <TexteEditableAdmin
                    cle="mobilisations.fiche.coordonnees_prefix"
                    valeurInitiale={coordonneesPrefix.valeurMd}
                    estAdmin={estAdmin}
                    libelle="prefixe coordonnees"
                    longueurMax={30}
                  >
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>{' '}
                  {mobilisation.latitude.toFixed(4)}, {mobilisation.longitude.toFixed(4)} ·{' '}
                  <TexteEditableAdmin
                    cle="mobilisations.fiche.voir_carte"
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
                </dd>
              ) : null}
            </div>
          </div>
        </dl>

        {estPubliee ? (
          <Card variant="ombre">
            <BoutonParticiper
              mobilisationId={mobilisation.id}
              participerMobilisation={participerMobilisation}
              dejaParticipanteConnectee={dejaInscrite}
              compteurInitial={mobilisation.nombre_participant_es}
            />
          </Card>
        ) : null}

        <section className="grid gap-4">
          <TexteEditableAdmin
            cle="mobilisations.fiche.section_description"
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
            {mobilisation.description}
          </div>
        </section>

        {/* V2.5.8 : moteur de partage applique aussi aux mobilisations
            publiees, pour aider a ramener du monde (cf. tunnel 6.6 du
            Master Plan : participer → ramener des proches). */}
        {estPubliee ? (
          <BoutonsPartage
            titre={mobilisation.titre}
            url={`${getSiteUrl()}/mobiliser/mobilisations/${mobilisation.slug}`}
            message={`Mobilisation Maintenant! : ${mobilisation.titre} le ${new Date(mobilisation.date_debut).toLocaleDateString('fr-FR')} à ${mobilisation.lieu}.`}
            titreBloc="Ramener des proches"
            intro="Partage cette mobilisation à celles et ceux qui pourraient venir avec toi."
          />
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {mobilisation.createurice_prenom !== null || mobilisation.createurice_nom !== null ? (
            <p>
              <TexteEditableAdmin
                cle="mobilisations.fiche.footer_amorce"
                valeurInitiale={footerAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce footer (Organisee par)"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <strong className="text-text-2">
                {[mobilisation.createurice_prenom, mobilisation.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>
              .
            </p>
          ) : null}
        </footer>
      </article>

      {estAdmin ? (
        <section
          aria-label="Actions admin"
          className="mt-12 grid gap-3 border-t border-border pt-8"
        >
          <TexteEditableAdmin
            cle="mobilisations.fiche.admin_section_titre"
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
          {mobilisation.statut !== 'retiree' ? (
            <BoutonArchiverEntite
              id={mobilisation.id}
              action={retirerMobilisationAction}
              verbe="Retirer la mobilisation"
              description="Statut → 'retiree'. Disparaît de la liste publique. Participants conservés."
              labelRaison="Raison du retrait (optionnelle)"
            />
          ) : null}
          <BoutonSupprimerEntite
            table="mobilisation"
            id={mobilisation.id}
            redirigerVers="/mobiliser/mobilisations"
          />
        </section>
      ) : null}
    </Container>
  );
}
