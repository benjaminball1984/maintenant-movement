import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { ModaleSignaturePetition } from '@/components/modales/ModaleSignaturePetition';
import { CompteurStretch } from '@/components/petitions/CompteurStretch';
import { Alert, Card, Container, Heading } from '@/components/ui';
import { metadataPourPartage } from '@/lib/og-metadata';
import { petitionParSlug } from '@/lib/petitions/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { signerPetition } from '../actions';

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
  const petition = await petitionParSlug(slug);

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
        <Link href="/mobiliser/petitions" className="hover:text-brand">
          ← Toutes les pétitions
        </Link>
      </p>

      <article className="grid gap-8">
        <header className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">
              Pétition à <strong className="text-text-2">{petition.destinataire}</strong>
            </p>
            <BoutonAdminEditer href={`/admin/petitions?id=${petition.id}`}>Admin</BoutonAdminEditer>
          </div>
          <Heading niveau={1}>{petition.titre}</Heading>

          {petition.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              {/*
                On utilise <Image /> avec `unoptimized` parce que les URL
                proviennent d'uploads externes non connus au build (cf.
                Supabase Storage, chantier ultérieur).
              */}
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
              petition.statut === 'en_moderation'
                ? 'En attente de modération'
                : petition.statut === 'rejetee'
                  ? 'Pétition rejetée'
                  : 'Pétition archivée'
            }
          >
            {petition.statut === 'en_moderation' ? (
              <>L'équipe Maintenant! examine ta pétition. Délai habituel : 24 à 48 heures.</>
            ) : petition.statut === 'rejetee' ? (
              <>
                Raison : {petition.raison_rejet ?? 'non précisée'}. Tu peux soumettre une nouvelle
                version corrigée.
              </>
            ) : (
              <>Cette pétition n'accepte plus de signatures (archivage manuel).</>
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
                <span
                  className={cn(
                    'inline-flex h-12 items-center justify-center rounded-md bg-grad px-6',
                    'font-body text-base font-bold text-white shadow-brand transition hover:brightness-110',
                  )}
                >
                  Signer cette pétition
                </span>
              }
            />
          ) : null}
        </Card>

        <section className="grid gap-4">
          <Heading niveau={2} apparenceComme={3}>
            Le texte
          </Heading>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {petition.texte}
          </div>
        </section>

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {petition.createurice_prenom !== null || petition.createurice_nom !== null ? (
            <p>
              Lancée par{' '}
              <strong className="text-text-2">
                {[petition.createurice_prenom, petition.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>{' '}
              le{' '}
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
      </article>
    </Container>
  );
}
