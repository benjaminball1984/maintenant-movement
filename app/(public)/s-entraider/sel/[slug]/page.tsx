import { Alert, Badge, Card, Heading } from '@/components/ui';
import { metadataPourPartage } from '@/lib/og-metadata';
import { serviceSelParSlug } from '@/lib/sel/requetes';
import { Clock, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await serviceSelParSlug(slug);
  if (service === null) return { title: 'Service introuvable' };
  return metadataPourPartage({
    objet: {
      titre: service.titre,
      description: service.description,
      // Pas d'image_url en V1 sur service_sel : on tombe sur l'image par défaut.
      image_url: null,
      type_objet: 'service_sel',
    },
    cheminPage: `/s-entraider/sel/${slug}`,
  });
}

/**
 * Fiche détail d'un service SEL.
 *
 * Pour 4.2 v1, le bouton de réservation est posé mais déclenche un
 * appel direct à la Server Action (sans étape de planning) : on
 * réserve, le prestataire déclare ensuite la réalisation avec la durée
 * effective. La planification fine (créneaux) viendra en polish.
 */
export default async function PageDetailService({ params }: PageDetailProps) {
  const { slug } = await params;
  const service = await serviceSelParSlug(slug);
  if (service === null) notFound();

  const estPublie = service.statut === 'publie';

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/sel" className="hover:text-brand">
          ← SEL
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={service.categorie === 'service' ? 'brand' : 'accent'}>
              {service.categorie === 'service' ? 'Service' : 'Volontariat'}
            </Badge>
            <Badge variant={service.sens === 'propose' ? 'success' : 'info'}>
              {service.sens === 'propose' ? 'Offre' : 'Demande'}
            </Badge>
            {!estPublie ? <Badge variant="default">{service.statut}</Badge> : null}
          </div>
          <Heading niveau={1}>{service.titre}</Heading>
        </header>

        {!estPublie ? (
          <Alert variant="info" titre="Ce service n'est plus actif">
            Tu peux consulter la fiche mais la réservation est désactivée.
          </Alert>
        ) : null}

        <Card variant="ombre" className="grid gap-3">
          <div className="flex items-start gap-3">
            <Clock size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">Durée</p>
              <p className="text-text-1">
                {service.duree_minutes_estimee} minutes ·{' '}
                <span className="text-text-3">
                  {service.duree_minutes_estimee} 99-coin attendus
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">Lieu</p>
              <p className="text-text-1">{service.lieu}</p>
            </div>
          </div>
        </Card>

        <section className="grid gap-3">
          <Heading niveau={2} apparenceComme={3}>
            Description
          </Heading>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {service.description}
          </div>
        </section>

        <Card variant="ombre" className="grid gap-2">
          <Heading niveau={2} apparenceComme={4}>
            Comment ça marche
          </Heading>
          <ul className="ml-4 list-disc space-y-1 text-sm text-text-2">
            <li>Tu réserves ce service depuis ton profil (chantier polish à venir).</li>
            <li>La personne prestataire déclare la durée réelle après réalisation.</li>
            <li>
              2 h plus tard sans contestation : crédit automatique en 99-coin (1 min = 1 unité).
            </li>
            <li>Tu peux contester pendant ces 2 h si la prestation pose problème.</li>
          </ul>
        </Card>

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {service.createurice_prenom !== null || service.createurice_nom !== null ? (
            <p>
              Publié par{' '}
              <strong className="text-text-2">
                {[service.createurice_prenom, service.createurice_nom]
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
