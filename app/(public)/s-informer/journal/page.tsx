import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterDateMoyenne } from '@/lib/format-date';
import { getSupabaseServer } from '@/lib/supabase';
import { FileText, Printer } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Le Peuple à l'Affiche : journal-affiche",
  description:
    'Édition locale d’un journal-affiche imprimable. Patchwork de modules existants. Format A3/A4.',
};

const FALLBACKS = {
  intro:
    "Le journal-affiche du mouvement. Édition locale imprimable, à coller dans l'espace public. Patchwork de modules existants sur le site (articles, brèves, dessins, mobilisations, annonces). Format A3 ou A4.",
  sectionEditions: 'Éditions publiées',
  emptyTitre: 'Aucune édition publiée pour le moment',
  emptyCorps:
    "Quand la rédaction et les communes libres auront publié leurs premières éditions, elles apparaîtront ici. L'export PDF prêt à imprimer arrive bientôt.",
  bandeauModeleTitre: 'Modèle économique',
  bandeauModeleCorps:
    'Impression locale gratuite, impression à façon en T99CP ou euros (marge mutualisée), plafond à 100 affiches par commande.',
};

/**
 * Page `/s-informer/journal` V2.4.11.
 *
 * Le Peuple à l'Affiche : le journal-affiche du mouvement (distinct du
 * média Maintenant Médias). Liste les éditions publiées, classées par
 * numéro décroissant.
 *
 * L'export PDF print-ready (Paged.js + Puppeteer) viendra dans un
 * chantier dédié.
 */
export default async function PageJournal() {
  const supabase = await getSupabaseServer();
  const [
    { data: editions },
    estAdmin,
    intro,
    sectionEditions,
    emptyTitre,
    emptyCorps,
    bandeauTitre,
    bandeauCorps,
  ] = await Promise.all([
    supabase
      .from('journal_affiche')
      .select('id, slug, titre, sous_titre, numero, format, image_couverture_url, publie_le')
      .eq('statut', 'publie')
      .order('numero', { ascending: false })
      .limit(50),
    estAdminCourant(),
    lireContenuEditorial('s-informer.journal.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('s-informer.journal.section_editions', {
      valeurMd: FALLBACKS.sectionEditions,
    }),
    lireContenuEditorial('s-informer.journal.empty_titre', { valeurMd: FALLBACKS.emptyTitre }),
    lireContenuEditorial('s-informer.journal.empty_corps', { valeurMd: FALLBACKS.emptyCorps }),
    lireContenuEditorial('s-informer.journal.bandeau_modele_titre', {
      valeurMd: FALLBACKS.bandeauModeleTitre,
    }),
    lireContenuEditorial('s-informer.journal.bandeau_modele_corps', {
      valeurMd: FALLBACKS.bandeauModeleCorps,
    }),
  ]);

  return (
    <Container taille="lg" className="py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <header>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
          <Heading niveau={1}>
            <FileText size={26} className="-mt-1 mr-2 inline" aria-hidden="true" />
            Le Peuple à l'Affiche
          </Heading>
          <TexteEditableAdmin
            cle="s-informer.journal.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro page journal-affiche"
            multilignes
            longueurMax={500}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </header>
        <BoutonAdminEditer href="/admin/national">Admin</BoutonAdminEditer>
      </div>

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          <Printer size={20} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="s-informer.journal.section_editions"
            valeurInitiale={sectionEditions.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section editions publiees (le compteur s'ajoute apres)"
            longueurMax={50}
          >
            {(t) => (
              <>
                {t} ({editions?.length ?? 0})
              </>
            )}
          </TexteEditableAdmin>
        </Heading>

        {!editions || editions.length === 0 ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="s-informer.journal.empty_titre"
                valeurInitiale={emptyTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre empty state journal"
                longueurMax={80}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
            className="mt-4"
          >
            <TexteEditableAdmin
              cle="s-informer.journal.empty_corps"
              valeurInitiale={emptyCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps empty state journal"
              multilignes
              longueurMax={400}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
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
                        Publié le {formaterDateMoyenne(e.publie_le)}
                      </p>
                    ) : null}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Alert
        variant="info"
        titre={
          <TexteEditableAdmin
            cle="s-informer.journal.bandeau_modele_titre"
            valeurInitiale={bandeauTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre bandeau modele economique"
            longueurMax={80}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        }
        className="mt-12"
      >
        <TexteEditableAdmin
          cle="s-informer.journal.bandeau_modele_corps"
          valeurInitiale={bandeauCorps.valeurMd}
          estAdmin={estAdmin}
          libelle="corps bandeau modele economique"
          multilignes
          longueurMax={500}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Alert>
    </Container>
  );
}
