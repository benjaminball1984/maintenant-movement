import {
  palierRejoindreCommune,
  quitterCommune,
  rejoindreCommune,
} from '@/app/(public)/agir/communes/actions';
import { BoutonRejoindreCommune } from '@/components/communes/BoutonRejoindreCommune';
import { ListeMembres } from '@/components/communes/ListeMembres';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { type MembreCommune, listerMembresCommune } from '@/lib/communes/membres';
import { communeParSlug } from '@/lib/communes/requetes';
import { getSupabaseServer } from '@/lib/supabase';
import { MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const commune = await communeParSlug(slug);
  if (commune === null) return { title: 'Commune introuvable' };
  return {
    title: commune.nom,
    description: commune.description_courte ?? `Commune ${commune.nom}`,
  };
}

export default async function PageDetailCommune({ params }: PageDetailProps) {
  const { slug } = await params;
  const commune = await communeParSlug(slug);
  if (commune === null) notFound();

  const session = await getSession();
  let dejaMembre = false;
  let palier: 'direct' | 'deuxieme' | 'troisieme' | 'refus' = 'direct';

  if (session !== null) {
    const supabase = await getSupabaseServer();
    const { count } = await supabase
      .from('appartenance_commune')
      .select('id', { count: 'exact', head: true })
      .eq('personne_id', session.userId)
      .eq('commune_id', commune.id)
      .eq('est_active', true);
    dejaMembre = (count ?? 0) > 0;

    const palierResultat = await palierRejoindreCommune();
    if (palierResultat.ok) palier = palierResultat.palier;
  }

  // Décision A : la liste nominative des membres n'existe qu'entre membres.
  let membres: MembreCommune[] = [];
  if (session !== null && dejaMembre) {
    membres = await listerMembresCommune(commune.id);
  }

  const estLibre = commune.statut_creation === 'auto_creee';

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/communes" className="hover:text-brand">
          ← Communes
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={estLibre ? 'accent' : 'brand'}>
              {estLibre ? 'Commune libre' : 'Commune'}
            </Badge>
          </div>
          <Heading niveau={1}>{commune.nom}</Heading>
          {commune.description_courte !== null && commune.description_courte.trim() !== '' ? (
            <p className="text-text-2">{commune.description_courte}</p>
          ) : null}
        </header>

        <Card variant="ombre" className="grid gap-3">
          {commune.code_postal_principal !== null ? (
            <div className="flex items-start gap-3">
              <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
              <div>
                <p className="text-xs font-bold uppercase tracking-cap text-text-3">Code postal</p>
                <p className="text-text-1">{commune.code_postal_principal}</p>
              </div>
            </div>
          ) : null}
          <div className="flex items-start gap-3">
            <Users size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">Adhérent·es</p>
              <p className="text-text-1">{commune.nombre_adherents}</p>
            </div>
          </div>
        </Card>

        {session === null ? (
          <Alert variant="info" titre="Connecte-toi pour rejoindre">
            <Link
              href={`/connexion?prochaine=/agir/communes/${commune.slug}`}
              className="underline"
            >
              Connexion
            </Link>{' '}
            pour rejoindre cette commune ou la quitter.
          </Alert>
        ) : (
          <BoutonRejoindreCommune
            communeId={commune.id}
            palier={palier}
            dejaMembre={dejaMembre}
            rejoindreCommune={rejoindreCommune}
            quitterCommune={quitterCommune}
          />
        )}

        {session !== null && dejaMembre && membres.length > 0 ? (
          <section className="grid gap-3">
            <Heading niveau={2} className="text-lg">
              Membres ({membres.length})
            </Heading>
            <p className="text-sm text-text-3">
              Visible uniquement par les membres de cette commune. Clique sur un nom pour voir le
              profil, ou envoie un message.
            </p>
            <ListeMembres membres={membres} moiId={session.userId} />
          </section>
        ) : null}
      </article>
    </Container>
  );
}
