import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { BadgesMonnaies } from '@/components/marche/BadgesMonnaies';
import { Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { minimarcheParSlug } from '@/lib/marche/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { CalendarRange, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const minimarche = await minimarcheParSlug(slug);
  if (minimarche === null) return { title: 'Minimarché introuvable' };
  return metadataPourPartage({
    objet: {
      titre: minimarche.titre,
      description: minimarche.description,
      image_url: minimarche.image_url,
      type_objet: 'minimarche_solidaire',
    },
    cheminPage: `/s-entraider/marche/minimarches/${slug}`,
  });
}

export default async function PageDetailMinimarche({ params }: PageDetailProps) {
  const { slug } = await params;
  const minimarche = await minimarcheParSlug(slug);
  if (minimarche === null) notFound();

  const [
    estAdmin,
    retour,
    statutEnCours,
    statutAnnonce,
    statutTermine,
    statutAnnule,
    labelDates,
    labelDu,
    labelAu,
    labelLieu,
    labelMonnaies,
    sectionDescription,
    footerAmorce,
  ] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('minimarche.fiche.retour', { valeurMd: '← Minimarchés' }),
    lireContenuEditorial('minimarche.fiche.statut_en_cours', { valeurMd: 'En cours' }),
    lireContenuEditorial('minimarche.fiche.statut_annonce', { valeurMd: 'Annoncé' }),
    lireContenuEditorial('minimarche.fiche.statut_termine', { valeurMd: 'Terminé' }),
    lireContenuEditorial('minimarche.fiche.statut_annule', { valeurMd: 'Annulé' }),
    lireContenuEditorial('minimarche.fiche.label_dates', { valeurMd: 'Dates' }),
    lireContenuEditorial('minimarche.fiche.label_du', { valeurMd: 'Du' }),
    lireContenuEditorial('minimarche.fiche.label_au', { valeurMd: 'au' }),
    lireContenuEditorial('minimarche.fiche.label_lieu', { valeurMd: 'Lieu' }),
    lireContenuEditorial('minimarche.fiche.label_monnaies', { valeurMd: 'Monnaies acceptées' }),
    lireContenuEditorial('minimarche.fiche.section_description', {
      valeurMd: "Description et conseils d'organisation",
    }),
    lireContenuEditorial('minimarche.fiche.footer_amorce', { valeurMd: 'Organisé par' }),
  ]);

  const statutAffiche =
    minimarche.statut === 'en_cours'
      ? statutEnCours.valeurMd
      : minimarche.statut === 'annonce'
        ? statutAnnonce.valeurMd
        : minimarche.statut === 'termine'
          ? statutTermine.valeurMd
          : statutAnnule.valeurMd;

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="minimarche.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour minimarches"
          longueurMax={30}
        >
          {(t) => (
            <Link href="/s-entraider/marche/minimarches" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={minimarche.statut === 'en_cours' ? 'success' : 'brand'}>
              {statutAffiche}
            </Badge>
          </div>
          <Heading niveau={1}>{minimarche.titre}</Heading>
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
                cle="minimarche.fiche.label_dates"
                valeurInitiale={labelDates.valeurMd}
                estAdmin={estAdmin}
                libelle="label Dates"
                longueurMax={20}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
              </TexteEditableAdmin>
              <p className="text-text-1">
                {labelDu.valeurMd} {FORMATEUR.format(new Date(minimarche.commence_le))}
                <br />
                {labelAu.valeurMd} {FORMATEUR.format(new Date(minimarche.termine_le))}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" aria-hidden="true" />
            <div>
              <TexteEditableAdmin
                cle="minimarche.fiche.label_lieu"
                valeurInitiale={labelLieu.valeurMd}
                estAdmin={estAdmin}
                libelle="label Lieu"
                longueurMax={20}
              >
                {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
              </TexteEditableAdmin>
              <p className="text-text-1">{minimarche.lieu}</p>
            </div>
          </div>
          <div>
            <TexteEditableAdmin
              cle="minimarche.fiche.label_monnaies"
              valeurInitiale={labelMonnaies.valeurMd}
              estAdmin={estAdmin}
              libelle="label Monnaies acceptees"
              longueurMax={40}
            >
              {(t) => (
                <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>
              )}
            </TexteEditableAdmin>
            <BadgesMonnaies monnaies={minimarche.monnaies_acceptees} />
          </div>
        </Card>

        <section className="grid gap-3">
          <TexteEditableAdmin
            cle="minimarche.fiche.section_description"
            valeurInitiale={sectionDescription.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section description et conseils"
            longueurMax={60}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={3}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {minimarche.description}
          </div>
        </section>

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {minimarche.createurice_prenom !== null || minimarche.createurice_nom !== null ? (
            <p>
              <TexteEditableAdmin
                cle="minimarche.fiche.footer_amorce"
                valeurInitiale={footerAmorce.valeurMd}
                estAdmin={estAdmin}
                libelle="amorce footer (Organise par)"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>{' '}
              <strong className="text-text-2">
                {[minimarche.createurice_prenom, minimarche.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>
              .
            </p>
          ) : null}
        </footer>
      </article>
    </>
  );
}
