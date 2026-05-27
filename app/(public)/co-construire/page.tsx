import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { getSupabaseServer } from '@/lib/supabase';
import { Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Co-construire — Groupes de travail thématiques',
  description: 'Tous les groupes de travail thématiques (GT) du mouvement Maintenant!.',
};

/**
 * Page index « Co-construire » (cycle V2 V2.3.39).
 *
 * Liste tous les GT thématiques. Lecture seule. Chaque carte renvoie
 * vers la page individuelle V2.3.38.
 */
export default async function PageCoConstruireIndex() {
  const supabase = await getSupabaseServer();
  const { data: gts } = await supabase
    .from('gt_thematique')
    .select('id, slug, nom, sujet, description, image_url')
    .order('nom', { ascending: true });

  const liste = gts ?? [];

  return (
    <Container taille="lg" className="py-12">
      <Heading niveau={1}>Co-construire</Heading>
      <p className="mt-2 text-text-2">
        Les groupes de travail thématiques (GT) explorent les chantiers transversaux du mouvement :
        éducation, écologie, démocratie, monnaie 99-coin, etc. Chaque GT a ses membres, son fil de
        discussion, ses productions.
      </p>

      {liste.length === 0 ? (
        <Alert variant="info" titre="Aucun GT publié" className="mt-8">
          La liste des GT thématiques apparaîtra ici quand le référentiel sera initialisé.
        </Alert>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((gt) => (
            <li key={gt.id}>
              <Link href={`/co-construire/${gt.slug}`} className="block hover:opacity-90">
                <Card variant="ombre" className="grid h-full gap-3">
                  {gt.image_url !== null ? (
                    <div className="relative aspect-[16/9] overflow-hidden rounded-md">
                      <Image
                        src={gt.image_url}
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <Badge variant="info">
                    <Users size={12} aria-hidden="true" />
                    GT thématique
                  </Badge>
                  <h2 className="font-display font-bold text-lg text-text-1">{gt.nom}</h2>
                  <p className="text-sm text-text-2">{gt.sujet}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
