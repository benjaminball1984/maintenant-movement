import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonAttacherACampagne } from '@/components/campagnes/BoutonAttacherACampagne';
import { FilCommentaires } from '@/components/commentaires/FilCommentaires';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { ModaleSignaturePetition } from '@/components/modales/ModaleSignaturePetition';
import { BlocOrganisationPorteuse } from '@/components/organisations/BlocOrganisationPorteuse';
import { BoutonsPartage } from '@/components/partage/BoutonsPartage';
import { CompteurStretch } from '@/components/petitions/CompteurStretch';
import { LienAuteurReseau } from '@/components/reseau/LienAuteurReseau';
import { RenduRiche } from '@/components/rich-text/RenduRiche';
import { Alert, Card, Container, Heading } from '@/components/ui';
import { getSiteUrl } from '@/config/site';
import { estAdminCourant } from '@/lib/auth/admin';
import { listerCampagnesPubliees } from '@/lib/campagnes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { metadataPourPartage } from '@/lib/og-metadata';
import { petitionParSlug } from '@/lib/petitions/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { signerPetition } from '../actions';

const FALLBACKS = {
  retour: '← Toutes les pétitions',
  preheaderAmorce: 'Pétition à',
  alertModerationTitre: 'En attente de modération',
  alertModerationCorps:
    "L'équipe Maintenant! examine ta pétition. Délai habituel : 24 à 48 heures.",
  alertRejeteeTitre: 'Pétition rejetée',
  alertRejeteeAmorce: 'Raison :',
  alertRejeteeNonPrecisee: 'non précisée',
  alertRejeteeFin: '. Tu peux soumettre une nouvelle version corrigée.',
  alertArchiveeTitre: 'Pétition archivée',
  alertArchiveeCorps: "Cette pétition n'accepte plus de signatures (archivage manuel).",
  ctaSigner: 'Signer cette pétition',
  sectionTexte: 'Le texte',
  footerAmorce: 'Lancée par',
  footerMilieu: 'le',
};

interface ParamsPetition {
  slug: string;
}

interface PagePetitionProps {
  params: Promise<ParamsPetition>;
}

/**
 * Page détail d'une pétition (`/mobiliser/petitions/[slug]`, chantier 3.1).
 *
 * - Lit la pétition par slug ; 404 si absente ou non lisible (RLS : seules
 *   les pétitions publiées sont visibles publiquement).
 * - Affiche image, titre, destinataire, compteur stretch, texte intégral,
 *   créatrice, et la modale de signature.
 * - La modale est ouverte par un CTA proéminent ; elle gère l'état
 *   « anonyme ou connectée » côté Server Action.
 */
export async function generateMetadata({ params }: PagePetitionProps): Promise<Metadata> {
  const { slug } = await params;
  const petition = await petitionParSlug(slug);
  if (petition === null) {
    return { title: 'Pétition introuvable' };
  }
  return metadataPourPartage({
    objet: {
      titre: petition.titre,
      description: petition.texte,
      image_url: petition.image_url,
      type_objet: 'petition',
    },
    cheminPage: `/mobiliser/petitions/${slug}`,
  });
}

export default async function PagePetition({ params }: PagePetitionProps) {
  const { slug } = await params;
  const [
    petition,
    estAdmin,
    retour,
    preheaderAmorce,
    alertModerationTitre,
    alertModerationCorps,
    alertRejeteeTitre,
    alertRejeteeAmorce,
    alertRejeteeNonPrecisee,
    alertRejeteeFin,
    alertArchiveeTitre,
    alertArchiveeCorps,
    ctaSigner,
    sectionTexte,
    footerAmorce,
    footerMilieu,
  ] = await Promise.all([
    petitionParSlug(slug),
    estAdminCourant(),
    lireContenuEditorial('petitions.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('petitions.fiche.preheader_amorce', {
      valeurMd: FALLBACKS.preheaderAmorce,
    }),
    lireContenuEditorial('petitions.fiche.alert_moderation_titre', {
      valeurMd: FALLBACKS.alertModerationTitre,
    }),
    lireContenuEditorial('petitions.fiche.alert_moderation_corps', {
      valeurMd: FALLBACKS.alertModerationCorps,
    }),
    lireContenuEditorial('petitions.fiche.alert_rejetee_titre', {
      valeurMd: FALLBACKS.alertRejeteeTitre,
    }),
    lireContenuEditorial('petitions.fiche.alert_rejetee_amorce', {
      valeurMd: FALLBACKS.alertRejeteeAmorce,
    }),
    lireContenuEditorial('petitions.fiche.alert_rejetee_non_precisee', {
      valeurMd: FALLBACKS.alertRejeteeNonPrecisee,
    }),
    lireContenuEditorial('petitions.fiche.alert_rejetee_fin', {
      valeurMd: FALLBACKS.alertRejeteeFin,
    }),
    lireContenuEditorial('petitions.fiche.alert_archivee_titre', {
      valeurMd: FALLBACKS.alertArchiveeTitre,
    }),
    lireContenuEditorial('petitions.fiche.alert_archivee_corps', {
      valeurMd: FALLBACKS.alertArchiveeCorps,
    }),
    lireContenuEditorial('petitions.fiche.cta_signer', { valeurMd: FALLBACKS.ctaSigner }),
    lireContenuEditorial('petitions.fiche.section_texte', { valeurMd: FALLBACKS.sectionTexte }),
    lireContenuEditorial('petitions.fiche.footer_amorce', { valeurMd: FALLBACKS.footerAmorce }),
    lireContenuEditorial('petitions.fiche.footer_milieu', { valeurMd: FALLBACKS.footerMilieu }),
  ]);

  if (petition === null) {
    notFound();
  }

  // Les pétitions en attente / rejetées peuvent être lues par leur
  // créatrice (RLS) : on adapte le rendu pour qu'elles voient l'état.
  const estPubliee = petition.statut === 'publiee';

  const createuricePrenomAffiche =
    petition.createurice_prenom !== null && petition.createurice_prenom.trim() !== ''
      ? petition.createurice_prenom
      : 'la personne créatrice';

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="petitions.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour vers liste petitions"
          longueurMax={60}
        >
          {(t) => (
            <Link href="/mobiliser/petitions" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>

      <article className="grid gap-8">
        <header className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">
              <TexteEditableAdmin
                cle="petitions.fiche.preheader_amorce"
                valeurInitiale={preheaderAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce preheader (defaut : Petition a)"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <strong className="text-text-2">{petition.destinataire}</strong>
            </p>
            <BoutonAdminEditer href={`/admin/petitions?id=${petition.id}`}>Admin</BoutonAdminEditer>
          </div>
          <Heading niveau={1}>{petition.titre}</Heading>
          <BlocOrganisationPorteuse objetType="petition" objetId={petition.id} />

          {/* V2.5.11.b Phase G : bouton admin "Intégrer à une campagne".
              Charge la liste des campagnes publiées côté serveur, passe au
              composant client qui ouvre une modale select + Attacher. */}
          {estAdmin ? (
            <BoutonAttacherACampagne
              typeModule="petition"
              cibleId={petition.id}
              campagnes={(await listerCampagnesPubliees()).map((c) => ({
                id: c.id,
                titre: c.titre,
              }))}
            />
          ) : null}

          {petition.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={petition.image_url}
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
            variant={petition.statut === 'rejetee' ? 'danger' : 'warning'}
            titre={
              petition.statut === 'en_moderation' ? (
                <TexteEditableAdmin
                  cle="petitions.fiche.alert_moderation_titre"
                  valeurInitiale={alertModerationTitre.valeurMd}
                  estAdmin={estAdmin}
                  libelle="titre alerte 'en moderation'"
                  longueurMax={60}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>
              ) : petition.statut === 'rejetee' ? (
                <TexteEditableAdmin
                  cle="petitions.fiche.alert_rejetee_titre"
                  valeurInitiale={alertRejeteeTitre.valeurMd}
                  estAdmin={estAdmin}
                  libelle="titre alerte 'rejetee'"
                  longueurMax={60}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>
              ) : (
                <TexteEditableAdmin
                  cle="petitions.fiche.alert_archivee_titre"
                  valeurInitiale={alertArchiveeTitre.valeurMd}
                  estAdmin={estAdmin}
                  libelle="titre alerte 'archivee'"
                  longueurMax={60}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>
              )
            }
          >
            {petition.statut === 'en_moderation' ? (
              <TexteEditableAdmin
                cle="petitions.fiche.alert_moderation_corps"
                valeurInitiale={alertModerationCorps.valeurMd}
                estAdmin={estAdmin}
                libelle="corps alerte 'en moderation'"
                multilignes
                longueurMax={300}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            ) : petition.statut === 'rejetee' ? (
              <>
                <TexteEditableAdmin
                  cle="petitions.fiche.alert_rejetee_amorce"
                  valeurInitiale={alertRejeteeAmorce.valeurMd}
                  estAdmin={estAdmin}
                  libelle="amorce alerte rejetee (Raison :)"
                  longueurMax={30}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>{' '}
                {petition.raison_rejet ?? (
                  <TexteEditableAdmin
                    cle="petitions.fiche.alert_rejetee_non_precisee"
                    valeurInitiale={alertRejeteeNonPrecisee.valeurMd}
                    estAdmin={estAdmin}
                    libelle="fallback si pas de raison"
                    longueurMax={30}
                  >
                    {(t) => <>{t}</>}
                  </TexteEditableAdmin>
                )}
                <TexteEditableAdmin
                  cle="petitions.fiche.alert_rejetee_fin"
                  valeurInitiale={alertRejeteeFin.valeurMd}
                  estAdmin={estAdmin}
                  libelle="fin alerte rejetee"
                  multilignes
                  longueurMax={200}
                >
                  {(t) => <>{t}</>}
                </TexteEditableAdmin>
              </>
            ) : (
              <TexteEditableAdmin
                cle="petitions.fiche.alert_archivee_corps"
                valeurInitiale={alertArchiveeCorps.valeurMd}
                estAdmin={estAdmin}
                libelle="corps alerte 'archivee'"
                multilignes
                longueurMax={300}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            )}
          </Alert>
        ) : null}

        <Card variant="ombre" className="grid gap-6">
          <CompteurStretch
            signatures={petition.nombre_signatures}
            objectif={petition.objectif}
            taille="md"
          />

          {estPubliee ? (
            <ModaleSignaturePetition
              petitionId={petition.id}
              petitionTitre={petition.titre}
              createuricePrenom={createuricePrenomAffiche}
              signerPetition={signerPetition}
              declencheur={
                <TexteEditableAdmin
                  cle="petitions.fiche.cta_signer"
                  valeurInitiale={ctaSigner.valeurMd}
                  estAdmin={estAdmin}
                  libelle="CTA Signer (declenche la modale)"
                  longueurMax={60}
                >
                  {(t) => (
                    <span
                      className={cn(
                        'inline-flex h-12 items-center justify-center rounded-md bg-grad px-6',
                        'font-body text-base font-bold text-white shadow-brand transition hover:brightness-110',
                      )}
                    >
                      {t}
                    </span>
                  )}
                </TexteEditableAdmin>
              }
            />
          ) : null}
        </Card>

        <section className="grid gap-4">
          <TexteEditableAdmin
            cle="petitions.fiche.section_texte"
            valeurInitiale={sectionTexte.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section texte de la petition"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={3}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          {(() => {
            // V2.5.53 — priorité au HTML riche (déjà sanitizé au save).
            const html = (petition as { texte_html?: string | null }).texte_html ?? null;
            if (html !== null && html.trim() !== '') {
              return <RenduRiche valeurHtml={html} className="text-text-2 leading-relaxed" />;
            }
            return (
              <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
                {petition.texte}
              </div>
            );
          })()}
        </section>

        {/* V2.5.7 Phase F : moteur d'invitation virale.
            Affiché seulement quand la pétition est publiée (sinon rien
            à partager). Le message pré-rempli reste sobre et factuel. */}
        {estPubliee ? (
          <BoutonsPartage
            titre={petition.titre}
            url={`${getSiteUrl()}/mobiliser/petitions/${petition.slug}`}
            message={`Cette pétition mérite d'être vue : ${petition.titre}.`}
            titreBloc="Faire signer aussi"
            intro="Plus on est nombreuses et nombreux à signer, plus le message porte. Partage à celles et ceux que la cause peut toucher."
          />
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {petition.createurice_prenom !== null || petition.createurice_nom !== null ? (
            <p>
              <TexteEditableAdmin
                cle="petitions.fiche.footer_amorce"
                valeurInitiale={footerAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce footer (Lancee par)"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <LienAuteurReseau
                personneId={petition.createurice_id}
                nom={[petition.createurice_prenom, petition.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
                className="font-bold text-text-2"
              />{' '}
              <TexteEditableAdmin
                cle="petitions.fiche.footer_milieu"
                valeurInitiale={footerMilieu.valeurMd}
                estAdmin={estAdmin}
                libelle="conjonction footer (le)"
                longueurMax={10}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <time dateTime={petition.created_at}>
                {new Date(petition.created_at).toLocaleDateString('fr-FR', {
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
          objetType="petition"
          objetId={petition.id}
          cheminRevalidation={`/mobiliser/petitions/${slug}`}
        />
      </article>
    </Container>
  );
}
