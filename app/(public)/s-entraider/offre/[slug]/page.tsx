import { Alert, Badge, Card, Heading } from '@/components/ui';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import { offreParSlug } from '@/lib/entraide/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
  const offre = await offreParSlug(slug);
  if (offre === null) notFound();

  const config = SOUS_ESPACES[offre.type];
  const estPubliee = offre.statut === 'publiee';

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href={`/s-entraider/${config.slug}`} className="hover:text-brand">
          ← {config.titre}
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={offre.sens === 'propose' ? 'success' : 'info'}>
              {offre.sens === 'propose' ? 'Offre' : 'Demande'}
            </Badge>
            {offre.statut === 'cloturee' ? <Badge variant="default">Clôturée</Badge> : null}
            {offre.statut === 'retiree' ? <Badge variant="warning">Retirée</Badge> : null}
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
            titre={offre.statut === 'retiree' ? 'Offre retirée' : 'Offre clôturée'}
          >
            {offre.statut === 'retiree'
              ? `Raison : ${offre.raison_retrait ?? 'non précisée'}.`
              : "L'auteur·ice a clôturé cette offre."}
          </Alert>
        ) : null}

        <Card variant="ombre" className="grid gap-2">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Lieu</p>
          <p className="text-text-1">{offre.lieu}</p>
          {offre.latitude !== null && offre.longitude !== null ? (
            <p className="text-xs text-text-3">
              Coordonnées : {offre.latitude.toFixed(4)}, {offre.longitude.toFixed(4)} ·{' '}
              <Link href="/carte" className="text-brand hover:underline">
                voir sur la carte
              </Link>
            </p>
          ) : null}
        </Card>

        <section className="grid gap-3">
          <Heading niveau={2} apparenceComme={3}>
            Description
          </Heading>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {offre.description}
          </div>
        </section>

        <Card variant="ombre">
          <Heading niveau={2} apparenceComme={4}>
            Prendre contact
          </Heading>
          <p className="mt-2 text-sm text-text-2">
            Contact direct par email avec la personne qui a publié l'offre. La messagerie interne
            est en cours de construction (chantier 7.5) ; en attendant, écris à l'adresse fournie
            ci-dessous.
          </p>
          {/* On n'affiche pas l'email en clair pour le moment : la table `personne`
              ne l'expose pas via une RLS lisible publiquement. Une route serveur
              dédiée (POST → envoi via Brevo) viendra avec la messagerie interne. */}
          <p className="mt-3 text-xs text-text-3">
            Crée un compte pour pouvoir contacter directement les auteur·ices (la mise en relation
            sera activée avec la messagerie interne).
          </p>
        </Card>

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {offre.createurice_prenom !== null || offre.createurice_nom !== null ? (
            <p>
              Publiée par{' '}
              <strong className="text-text-2">
                {[offre.createurice_prenom, offre.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>{' '}
              le{' '}
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
      </article>
    </>
  );
}
