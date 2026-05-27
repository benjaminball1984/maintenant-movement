import {
  palierRejoindreCommune,
  quitterCommune,
  rejoindreCommune,
} from '@/app/(public)/agir/communes/actions';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonRejoindreCommune } from '@/components/communes/BoutonRejoindreCommune';
import { ListeMembres } from '@/components/communes/ListeMembres';
import { FilDeGroupe } from '@/components/fil-groupe/FilDeGroupe';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { type MembreCommune, listerMembresCommune } from '@/lib/communes/membres';
import { communeParSlug } from '@/lib/communes/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
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
  return metadataPourPartage({
    objet: {
      titre: commune.nom,
      description: commune.description_courte ?? `Commune libre de ${commune.nom}`,
      // Pas de champ image_url en V1 sur `commune` (cf. types/database) :
      // on tombe sur l'image par défaut `commune.svg` de la bibliothèque ET1.
      image_url: null,
      type_objet: 'commune_libre',
    },
    cheminPage: `/agir/communes/${slug}`,
  });
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant={estLibre ? 'accent' : 'brand'}>
              {estLibre ? 'Commune libre' : 'Commune'}
            </Badge>
            <BoutonAdminEditer href={`/admin/national?onglet=communes&id=${commune.id}`}>
              Admin
            </BoutonAdminEditer>
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

        {/* Fil de discussion du groupe (cycle V2 §18, V2.2.1 + V2.3.6).
            Visible aux seuls membres : la RLS de fil_groupe_message filtre
            via est_membre_espace('commune', commune.id). */}
        {session !== null && dejaMembre ? (
          <FilDeGroupe
            espaceType="commune"
            espaceId={commune.id}
            cheminRevalidation={`/agir/communes/${commune.slug}`}
          />
        ) : null}
      </article>
    </Container>
  );
}
