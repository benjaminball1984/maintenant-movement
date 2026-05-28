import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { FilDeGroupe } from '@/components/fil-groupe/FilDeGroupe';
import { Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { federationParSlug } from '@/lib/communes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { metadataPourPartage } from '@/lib/og-metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const FALLBACKS = {
  retour: '← Fédérations',
  communeLabel: 'commune',
  rattacheeLabel: 'rattachée',
};

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

const LIBELLE_TYPE: Record<string, string> = {
  geographique: 'Géographique',
  thematique: 'Thématique',
  mixte: 'Mixte',
};

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const federation = await federationParSlug(slug);
  if (federation === null) return { title: 'Fédération introuvable' };
  return metadataPourPartage({
    objet: {
      titre: federation.nom,
      description: `Fédération ${federation.nom} du mouvement Maintenant!`,
      image_url: federation.image_url, // V2.5.4 : utilise la colonne réelle
      type_objet: 'federation',
    },
    cheminPage: `/agir/federations/${slug}`,
  });
}

export default async function PageDetailFederation({ params }: PageDetailProps) {
  const { slug } = await params;
  const [federation, session, estAdmin, retour, communeLabel, rattacheeLabel] = await Promise.all([
    federationParSlug(slug),
    getSession(),
    estAdminCourant(),
    lireContenuEditorial('federations.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('federations.fiche.commune_label', {
      valeurMd: FALLBACKS.communeLabel,
    }),
    lireContenuEditorial('federations.fiche.rattachee_label', {
      valeurMd: FALLBACKS.rattacheeLabel,
    }),
  ]);
  if (federation === null) notFound();

  const pluriel = federation.nombre_communes > 1 ? 's' : '';

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="federations.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour vers liste federations"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/agir/federations" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="brand">{LIBELLE_TYPE[federation.type] ?? federation.type}</Badge>
          <BoutonAdminEditer href={`/admin/national?onglet=federations&id=${federation.id}`}>
            Admin
          </BoutonAdminEditer>
        </div>
        <Heading niveau={1}>{federation.nom}</Heading>

        {/* V2.5.4 Phase C : image de couverture si disponible. */}
        {federation.image_url !== null && federation.image_url.trim() !== '' ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
            <Image
              src={federation.image_url}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
            />
          </div>
        ) : null}

        {federation.description_courte !== null && federation.description_courte.trim() !== '' ? (
          <p className="text-text-2">{federation.description_courte}</p>
        ) : null}
      </header>
      <Card variant="ombre" className="mt-6">
        <p className="text-sm text-text-2">
          <strong>{federation.nombre_communes}</strong>{' '}
          <TexteEditableAdmin
            cle="federations.fiche.commune_label"
            valeurInitiale={communeLabel.valeurMd}
            estAdmin={estAdmin}
            libelle="label commune (singulier, le 's' s'ajoute automatiquement au pluriel)"
            longueurMax={30}
          >
            {(t) => (
              <>
                {t}
                {pluriel}
              </>
            )}
          </TexteEditableAdmin>{' '}
          <TexteEditableAdmin
            cle="federations.fiche.rattachee_label"
            valeurInitiale={rattacheeLabel.valeurMd}
            estAdmin={estAdmin}
            libelle="label rattachee (singulier, le 's' s'ajoute automatiquement au pluriel)"
            longueurMax={30}
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
      </Card>

      {/* Fil de discussion de la fédération (cycle V2 §18, V2.2.1 + V2.3.8).
          Visible aux comptes authentifiés en attendant le helper SQL corrigé. */}
      {session !== null ? (
        <section className="mt-8">
          <FilDeGroupe
            espaceType="federation"
            espaceId={federation.id}
            cheminRevalidation={`/agir/federations/${slug}`}
          />
        </section>
      ) : null}
    </Container>
  );
}
