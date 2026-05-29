import { voterSondage } from '@/app/(public)/s-informer/sondages/actions';
import { fermerSondageAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { BoutonAttacherACampagne } from '@/components/campagnes/BoutonAttacherACampagne';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { FormulaireVote } from '@/components/sondages/FormulaireVote';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { listerCampagnesPubliees } from '@/lib/campagnes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { metadataPourPartage } from '@/lib/og-metadata';
import { aVotePersonne, sondageParSlugAvecResultats } from '@/lib/sondages/requetes';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const FALLBACKS = {
  retour: '← Sondages',
  alertConnecteTitre: 'Vote connecté obligatoire',
  alertConnecteLien: 'Connecte-toi',
  alertConnecteFin: 'pour voter (cf. doctrine §4D).',
  alertVoteTitre: 'Vote enregistré',
  alertVoteCorps: 'Tu as déjà voté pour ce sondage. Merci. Les résultats sont visibles ci-dessous.',
  sectionResultats: 'Résultats',
  voteLabel: 'vote',
  seuilAtteint: '· seuil 300 atteint, pondération par quotas applicable.',
  adminSectionTitre: 'Actions admin',
};

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const sondage = await sondageParSlugAvecResultats(slug);
  if (sondage === null) return { title: 'Sondage introuvable' };
  return metadataPourPartage({
    objet: {
      titre: sondage.titre,
      description: sondage.question,
      // Pas d'image_url en V1 sur sondage : on tombe sur l'image par défaut.
      image_url: null,
      type_objet: 'sondage',
    },
    cheminPage: `/s-informer/sondages/${slug}`,
  });
}

export default async function PageDetailSondage({ params }: PageDetailProps) {
  const { slug } = await params;
  const [
    sondage,
    estAdmin,
    retour,
    alertConnecteTitre,
    alertConnecteLien,
    alertConnecteFin,
    alertVoteTitre,
    alertVoteCorps,
    sectionResultats,
    voteLabel,
    adminSectionTitre,
  ] = await Promise.all([
    sondageParSlugAvecResultats(slug),
    estAdminCourant(),
    lireContenuEditorial('sondages.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('sondages.fiche.alert_connecte_titre', {
      valeurMd: FALLBACKS.alertConnecteTitre,
    }),
    lireContenuEditorial('sondages.fiche.alert_connecte_lien', {
      valeurMd: FALLBACKS.alertConnecteLien,
    }),
    lireContenuEditorial('sondages.fiche.alert_connecte_fin', {
      valeurMd: FALLBACKS.alertConnecteFin,
    }),
    lireContenuEditorial('sondages.fiche.alert_vote_titre', {
      valeurMd: FALLBACKS.alertVoteTitre,
    }),
    lireContenuEditorial('sondages.fiche.alert_vote_corps', {
      valeurMd: FALLBACKS.alertVoteCorps,
    }),
    lireContenuEditorial('sondages.fiche.section_resultats', {
      valeurMd: FALLBACKS.sectionResultats,
    }),
    lireContenuEditorial('sondages.fiche.vote_label', { valeurMd: FALLBACKS.voteLabel }),
    lireContenuEditorial('sondages.fiche.admin_section_titre', {
      valeurMd: FALLBACKS.adminSectionTitre,
    }),
  ]);
  if (sondage === null) notFound();

  const session = await getSession();
  const dejaVote = session !== null ? await aVotePersonne(sondage.id, session.userId) : false;
  const pluriel = sondage.total_votes > 1 ? 's' : '';

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="sondages.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour vers liste sondages"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/s-informer/sondages" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={sondage.mode === 'pondere' ? 'accent' : 'brand'}>
                {sondage.mode === 'pondere' ? 'Pondéré' : 'Classique'}
              </Badge>
              {sondage.statut !== 'ouvert' ? (
                <Badge variant="default">{sondage.statut}</Badge>
              ) : null}
            </div>
            <BoutonAdminEditer href={`/admin/moderation/sondages?id=${sondage.id}`}>
              Admin
            </BoutonAdminEditer>
          </div>
          <Heading niveau={1}>{sondage.titre}</Heading>
          <p className="text-text-2">{sondage.question}</p>

          {/* V2.5.11.c — bouton admin "Intégrer à une campagne" sur sondage. */}
          {estAdmin ? (
            <BoutonAttacherACampagne
              typeModule="sondage"
              cibleId={sondage.id}
              campagnes={(await listerCampagnesPubliees()).map((c) => ({
                id: c.id,
                titre: c.titre,
              }))}
            />
          ) : null}
        </header>

        {session === null ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="sondages.fiche.alert_connecte_titre"
                valeurInitiale={alertConnecteTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte vote connecte"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="sondages.fiche.alert_connecte_lien"
              valeurInitiale={alertConnecteLien.valeurMd}
              estAdmin={estAdmin}
              libelle="libelle lien Connecte-toi"
              longueurMax={40}
            >
              {(t) => (
                <Link
                  href={`/connexion?prochaine=/s-informer/sondages/${sondage.slug}`}
                  className="underline"
                >
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="sondages.fiche.alert_connecte_fin"
              valeurInitiale={alertConnecteFin.valeurMd}
              estAdmin={estAdmin}
              libelle="fin alerte vote connecte"
              longueurMax={100}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : dejaVote || sondage.statut !== 'ouvert' ? null : (
          <Card variant="eleve">
            <FormulaireVote
              sondageId={sondage.id}
              options={sondage.options}
              mode={sondage.mode}
              voterSondage={voterSondage}
            />
          </Card>
        )}

        {dejaVote ? (
          <Alert
            variant="success"
            titre={
              <TexteEditableAdmin
                cle="sondages.fiche.alert_vote_titre"
                valeurInitiale={alertVoteTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte vote enregistre"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="sondages.fiche.alert_vote_corps"
              valeurInitiale={alertVoteCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps alerte vote enregistre"
              multilignes
              longueurMax={300}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : null}

        <section className="grid gap-3">
          <TexteEditableAdmin
            cle="sondages.fiche.section_resultats"
            valeurInitiale={sectionResultats.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section resultats"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={3}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <p className="text-sm text-text-3">
            {sondage.total_votes}{' '}
            <TexteEditableAdmin
              cle="sondages.fiche.vote_label"
              valeurInitiale={voteLabel.valeurMd}
              estAdmin={estAdmin}
              libelle="label 'vote' (singulier, 's' ajoute automatiquement)"
              longueurMax={20}
            >
              {(t) => (
                <>
                  {t}
                  {pluriel}
                </>
              )}
            </TexteEditableAdmin>
            {sondage.pondere_disponible
              ? ' · seuil 300 atteint, pondération par quotas applicable.'
              : sondage.mode === 'pondere'
                ? ` · seuil 300 non atteint (${sondage.total_votes}/300), résultats bruts pour l'instant.`
                : ''}
          </p>
          <ul className="grid gap-2">
            {sondage.options.map((opt, index) => {
              const compte = sondage.resultats_par_option[index] ?? 0;
              const pct =
                sondage.total_votes === 0 ? 0 : Math.round((compte / sondage.total_votes) * 100);
              return (
                <li key={`${index}-${opt}`}>
                  <Card variant="ombre" className="grid gap-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-bold text-text-1">{opt}</p>
                      <span className="text-sm text-text-3">
                        {compte} ({pct}%)
                      </span>
                    </div>
                    <progress
                      value={pct}
                      max={100}
                      className="h-2 w-full overflow-hidden rounded-pill bg-surface-2 [&::-webkit-progress-bar]:bg-surface-2 [&::-webkit-progress-value]:bg-grad-r [&::-moz-progress-bar]:bg-grad-r"
                      aria-label={`${opt} : ${pct}%`}
                    />
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      </article>

      {estAdmin ? (
        <section
          aria-label="Actions admin"
          className="mt-12 grid gap-3 border-t border-border pt-8"
        >
          <TexteEditableAdmin
            cle="sondages.fiche.admin_section_titre"
            valeurInitiale={adminSectionTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section actions admin sondage"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={4}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          {sondage.statut !== 'ferme' && sondage.statut !== 'archive' ? (
            <BoutonArchiverEntite
              id={sondage.id}
              action={fermerSondageAction}
              verbe="Fermer le sondage"
              description="Statut → 'ferme'. Les résultats restent visibles, plus aucun vote possible."
            />
          ) : null}
          <BoutonSupprimerEntite
            table="sondage"
            id={sondage.id}
            redirigerVers="/s-informer/sondages"
          />
        </section>
      ) : null}
    </Container>
  );
}
