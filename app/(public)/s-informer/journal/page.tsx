import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { getSupabaseServer } from '@/lib/supabase';
import { FileText, Printer } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Maintenant Médias — journal-affiche',
  description:
    'Édition locale d’un journal-affiche imprimable. Patchwork de modules existants. Format A3/A4.',
};

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Page `/s-informer/journal` V2.4.11.
 *
 * Maintenant Médias — journal-affiche. Liste les éditions publiées par
 * le mouvement, classées par numéro décroissant.
 *
 * L'export PDF print-ready (Paged.js + Puppeteer) viendra dans un
 * chantier dédié.
 */
export default async function PageJournal() {
  const supabase = await getSupabaseServer();
  const { data: editions } = await supabase
    .from('journal_affiche')
    .select('id, slug, titre, sous_titre, numero, format, image_couverture_url, publie_le')
    .eq('statut', 'publie')
    .order('numero', { ascending: false })
    .limit(50);

  return (
    <Container taille="lg" className="py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <header>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
          <Heading niveau={1}>
            <FileText size={26} className="-mt-1 mr-2 inline" aria-hidden="true" />
            Maintenant Médias
          </Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Le journal-affiche du mouvement. Édition locale imprimable, à coller dans l'espace
            public. Patchwork de modules existants sur le site (articles, brèves, dessins,
            mobilisations, annonces). Format A3 ou A4.
          </p>
        </header>
        <BoutonAdminEditer href="/admin/national">Admin</BoutonAdminEditer>
      </div>

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          <Printer size={20} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Éditions publiées ({editions?.length ?? 0})
        </Heading>

        {!editions || editions.length === 0 ? (
          <Alert variant="info" titre="Aucune édition publiée pour le moment" className="mt-4">
            Quand la rédaction et les communes libres auront publié leurs premières éditions, elles
            apparaîtront ici. La V1 d'export PDF print-ready arrive avec un chantier dédié.
          </Alert>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editions.map((e) => (
              <li key={e.id}>
                <Link href={`/s-informer/journal/${e.slug}`} className="block hover:opacity-90">
                  <Card variant="ombre" className="grid h-full gap-2">
                    {e.image_couverture_url !== null ? (
                      <div className="relative aspect-[210/297] overflow-hidden rounded-md">
                        <Image
                          src={e.image_couverture_url}
                          alt=""
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[210/297] rounded-md bg-surface-2" />
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default">N°{e.numero}</Badge>
                      <Badge variant="info">{e.format}</Badge>
                    </div>
                    <h3 className="font-display font-bold text-lg text-text-1">{e.titre}</h3>
                    {e.sous_titre !== null ? (
                      <p className="text-sm text-text-2">{e.sous_titre}</p>
                    ) : null}
                    {e.publie_le !== null ? (
                      <p className="text-text-3 text-xs">
                        Publié le {FORMATEUR.format(new Date(e.publie_le))}
                      </p>
                    ) : null}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Alert variant="info" titre="Modèle économique (rappel doctrine §4C)" className="mt-12">
        Impression locale gratuite, impression à façon en T99CP ou euros (marge mutualisée), plafond
        à 100 affiches par commande. Coûts API estimés ~0,023 $ par affiche avec Claude Haiku 4.5
        quand l'agent générateur sera branché.
      </Alert>
    </Container>
  );
}
