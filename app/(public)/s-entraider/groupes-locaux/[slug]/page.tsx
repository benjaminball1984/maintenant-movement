import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { FilDeGroupe } from '@/components/fil-groupe/FilDeGroupe';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  estMembreDuGroupe,
  groupeEntraideParSlug,
  listerMembresGroupe,
} from '@/lib/groupe-entraide-local';
import { getImageObjet } from '@/lib/images';
import { metadataPourPartage } from '@/lib/og-metadata';
import { MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BoutonsAdhesion } from './BoutonsAdhesion';

const FALLBACKS = {
  retour: '← Tous les groupes',
  badgeEnModeration: 'En modération',
  sectionLeGroupe: 'Le groupe',
  sectionOutilsActives: 'Outils activés',
  outilsNote:
    'Outils politiques (pétitions, Décider) désactivés par défaut. Le groupe peut les activer plus tard s’il en exprime le besoin.',
  cardMembres: 'Membres',
  membresLabel: 'membre',
  actifLabel: 'actif',
  membresEmpty: 'Rejoins le groupe pour voir les co-membres.',
};

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const groupe = await groupeEntraideParSlug(slug);
  if (groupe === null) return { title: 'Groupe introuvable' };
  return metadataPourPartage({
    objet: {
      titre: groupe.nom,
      description: groupe.descriptionCourte,
      image_url: groupe.imageUrl,
      type_objet: 'generique',
    },
    cheminPage: `/s-entraider/groupes-locaux/${slug}`,
  });
}

/**
 * Page détail d'un groupe d'entraide local (cycle V2 V2.3.2).
 *
 * Sections :
 * 1. En-tête : image, nom, zone, description, badges des outils activés.
 * 2. Boutons « Rejoindre / Quitter » selon l'état d'appartenance.
 * 3. Fil de discussion du groupe (composant `FilDeGroupe` de V2.2.1).
 *    Visible uniquement par les membres (RLS de `fil_groupe_message` +
 *    `est_membre_espace('groupe_entraide_local', ...)` mis à jour en
 *    V2.3.2 pour lire la vraie table d'appartenance).
 */
export default async function PageDetailGroupeEntraide({ params }: PageDetailProps) {
  const { slug } = await params;
  const [
    groupe,
    estAdmin,
    session,
    retour,
    badgeEnModeration,
    sectionLeGroupe,
    sectionOutilsActives,
    outilsNote,
    cardMembres,
    membresLabel,
    actifLabel,
    membresEmpty,
  ] = await Promise.all([
    groupeEntraideParSlug(slug),
    estAdminCourant(),
    getSession(),
    lireContenuEditorial('groupes_locaux.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('groupes_locaux.fiche.badge_en_moderation', {
      valeurMd: FALLBACKS.badgeEnModeration,
    }),
    lireContenuEditorial('groupes_locaux.fiche.section_le_groupe', {
      valeurMd: FALLBACKS.sectionLeGroupe,
    }),
    lireContenuEditorial('groupes_locaux.fiche.section_outils_actives', {
      valeurMd: FALLBACKS.sectionOutilsActives,
    }),
    lireContenuEditorial('groupes_locaux.fiche.outils_note', {
      valeurMd: FALLBACKS.outilsNote,
    }),
    lireContenuEditorial('groupes_locaux.fiche.card_membres', {
      valeurMd: FALLBACKS.cardMembres,
    }),
    lireContenuEditorial('groupes_locaux.fiche.membres_label', {
      valeurMd: FALLBACKS.membresLabel,
    }),
    lireContenuEditorial('groupes_locaux.fiche.actif_label', { valeurMd: FALLBACKS.actifLabel }),
    lireContenuEditorial('groupes_locaux.fiche.membres_empty', {
      valeurMd: FALLBACKS.membresEmpty,
    }),
  ]);
  if (groupe === null) notFound();

  const estMembre = session !== null ? await estMembreDuGroupe(groupe.id, session.userId) : false;
  const membres = estMembre ? await listerMembresGroupe(groupe.id) : [];

  const image = getImageObjet({ image_url: groupe.imageUrl, type_objet: 'generique' });
  const pluriel = membres.length > 1 ? 's' : '';

  return (
    <Container taille="lg" className="py-12">
      <TexteEditableAdmin
        cle="groupes_locaux.fiche.retour"
        valeurInitiale={retour.valeurMd}
        estAdmin={estAdmin}
        libelle="lien retour groupes locaux"
        longueurMax={40}
      >
        {(t) => (
          <Link
            href="/s-entraider/groupes-locaux"
            className="mb-4 inline-flex text-sm text-text-3 hover:text-brand"
          >
            {t}
          </Link>
        )}
      </TexteEditableAdmin>

      <header className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="relative aspect-video overflow-hidden rounded-md bg-surface-2">
          <Image
            src={image}
            alt={groupe.nom}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            {groupe.statut === 'en_moderation' && (
              <TexteEditableAdmin
                cle="groupes_locaux.fiche.badge_en_moderation"
                valeurInitiale={badgeEnModeration.valeurMd}
                estAdmin={estAdmin}
                libelle="badge En moderation"
                longueurMax={30}
              >
                {(t) => <Badge variant="warning">{t}</Badge>}
              </TexteEditableAdmin>
            )}
            <BoutonAdminEditer href={`/admin/moderation/groupes-locaux?id=${groupe.id}`}>
              Admin
            </BoutonAdminEditer>
          </div>
          <Heading niveau={1}>{groupe.nom}</Heading>
          <div className="flex items-center gap-2 text-sm text-text-3">
            <MapPin size={16} aria-hidden="true" />
            <span>{groupe.zoneGeographique}</span>
          </div>
          <BoutonsAdhesion
            groupeId={groupe.id}
            estMembre={estMembre}
            estConnecte={session !== null}
          />
        </div>
      </header>

      <section className="mt-8 grid gap-8 md:grid-cols-[2fr_1fr]">
        <div>
          <TexteEditableAdmin
            cle="groupes_locaux.fiche.section_le_groupe"
            valeurInitiale={sectionLeGroupe.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section Le groupe"
            longueurMax={40}
          >
            {(t) => <Heading niveau={2}>{t}</Heading>}
          </TexteEditableAdmin>
          <p className="mt-2 whitespace-pre-wrap text-text-2">{groupe.description}</p>

          <TexteEditableAdmin
            cle="groupes_locaux.fiche.section_outils_actives"
            valeurInitiale={sectionOutilsActives.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section Outils actives"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} className="mt-8">
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <div className="mt-3 flex flex-wrap gap-2">
            {groupe.outilPretActive && <Badge variant="default">Prêt d’objets</Badge>}
            {groupe.outilMarcheActive && <Badge variant="default">Marché solidaire</Badge>}
            {groupe.outilSelActive && <Badge variant="default">SEL</Badge>}
            {groupe.outilFruitsActive && <Badge variant="default">Fruits de la terre</Badge>}
            {groupe.outilHebergementActive && <Badge variant="default">Hébergement</Badge>}
            {groupe.outilTransportActive && <Badge variant="default">Covoiturage</Badge>}
            {groupe.outilMomentsActive && <Badge variant="default">Moments solidaires</Badge>}
            {groupe.outilMobilisationsActive && <Badge variant="default">Mobilisations</Badge>}
          </div>
          <TexteEditableAdmin
            cle="groupes_locaux.fiche.outils_note"
            valeurInitiale={outilsNote.valeurMd}
            estAdmin={estAdmin}
            libelle="note outils politiques desactives par defaut"
            multilignes
            longueurMax={300}
          >
            {(t) => <p className="mt-2 text-text-3 text-xs">{t}</p>}
          </TexteEditableAdmin>
        </div>

        <aside className="flex flex-col gap-4">
          <Card variant="ombre">
            <h3 className="flex items-center gap-2 font-bold text-text-1">
              <Users size={16} aria-hidden="true" />
              <TexteEditableAdmin
                cle="groupes_locaux.fiche.card_membres"
                valeurInitiale={cardMembres.valeurMd}
                estAdmin={estAdmin}
                libelle="titre card Membres"
                longueurMax={30}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            </h3>
            {estMembre ? (
              <p className="mt-2 text-sm text-text-2">
                {membres.length}{' '}
                <TexteEditableAdmin
                  cle="groupes_locaux.fiche.membres_label"
                  valeurInitiale={membresLabel.valeurMd}
                  estAdmin={estAdmin}
                  libelle="label membre (singulier, 's' auto)"
                  longueurMax={20}
                >
                  {(t) => (
                    <>
                      {t}
                      {pluriel}
                    </>
                  )}
                </TexteEditableAdmin>{' '}
                <TexteEditableAdmin
                  cle="groupes_locaux.fiche.actif_label"
                  valeurInitiale={actifLabel.valeurMd}
                  estAdmin={estAdmin}
                  libelle="label actif (singulier, 's' auto)"
                  longueurMax={20}
                >
                  {(t) => (
                    <>
                      {t}
                      {pluriel}
                    </>
                  )}
                </TexteEditableAdmin>
                .
              </p>
            ) : (
              <TexteEditableAdmin
                cle="groupes_locaux.fiche.membres_empty"
                valeurInitiale={membresEmpty.valeurMd}
                estAdmin={estAdmin}
                libelle="message non-membre"
                longueurMax={200}
              >
                {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
              </TexteEditableAdmin>
            )}
          </Card>
        </aside>
      </section>

      {estMembre && (
        <section className="mt-10">
          <FilDeGroupe
            espaceType="groupe_entraide_local"
            espaceId={groupe.id}
            cheminRevalidation={`/s-entraider/groupes-locaux/${groupe.slug}`}
          />
        </section>
      )}
    </Container>
  );
}
