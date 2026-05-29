import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { formaterDateCourte } from '@/lib/format-date';
import { getSupabaseServer } from '@/lib/supabase';
import { FileText, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireCreerEdition } from './FormulaireCreerEdition';
import { LigneEditionAdmin } from './LigneEditionAdmin';

export const metadata: Metadata = {
  title: 'Maintenant Médias — Console admin',
};

/**
 * Console admin / Maintenant Médias (V2.4.13).
 *
 * Liste toutes les éditions (tous statuts confondus), permet de créer
 * une nouvelle édition + bascule de statut brouillon/publié/archivé.
 */
export default async function PageAdminJournal() {
  const supabase = await getSupabaseServer();
  const { data: editions } = await supabase
    .from('journal_affiche')
    .select('id, slug, titre, sous_titre, numero, format, statut, publie_le, created_at')
    .order('numero', { ascending: false });

  // Numéro suggéré = max + 1
  const numeroSuggere =
    editions && editions.length > 0 ? Math.max(...editions.map((e) => e.numero)) + 1 : 1;

  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.journal.titre', {
      valeurMd: 'Maintenant Médias — Console admin',
    }),
    lireContenuEditorial('admin.national.journal.intro', {
      valeurMd: 'Gestion des éditions du journal-affiche. Création, publication, archivage.',
    }),
  ]);

  return (
    <>
      <Heading niveau={1}>
        <FileText size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="admin.national.journal.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console journal admin"
          longueurMax={60}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <TexteEditableAdmin
        cle="admin.national.journal.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console journal admin"
        longueurMax={200}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          <Plus size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Nouvelle édition (n° suggéré {numeroSuggere})
        </Heading>
        <div className="mt-4">
          <FormulaireCreerEdition numeroSuggere={numeroSuggere} />
        </div>
      </section>

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          Éditions ({editions?.length ?? 0})
        </Heading>
        {!editions || editions.length === 0 ? (
          <Alert variant="info" titre="Aucune édition" className="mt-3">
            Crée la première édition ci-dessus.
          </Alert>
        ) : (
          <ul className="mt-3 grid gap-2">
            {editions.map((e) => (
              <li key={e.id}>
                <Card variant="ombre" className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default">N°{e.numero}</Badge>
                      <Badge variant="info">{e.format}</Badge>
                      <Badge
                        variant={
                          e.statut === 'publie'
                            ? 'success'
                            : e.statut === 'archive'
                              ? 'default'
                              : 'warning'
                        }
                      >
                        {e.statut}
                      </Badge>
                    </div>
                    <h3 className="mt-1 font-display font-bold text-text-1">{e.titre}</h3>
                    {e.sous_titre !== null ? (
                      <p className="text-sm text-text-2">{e.sous_titre}</p>
                    ) : null}
                    <p className="text-text-3 text-xs">
                      {e.publie_le !== null
                        ? `Publié le ${formaterDateCourte(e.publie_le)}`
                        : `Créé le ${formaterDateCourte(e.created_at)}`}{' '}
                      ·{' '}
                      <Link
                        href={`/s-informer/journal/${e.slug}`}
                        className="text-brand hover:underline"
                      >
                        page publique
                      </Link>
                    </p>
                  </div>
                  <LigneEditionAdmin
                    id={e.id}
                    statut={
                      e.statut === 'publie' || e.statut === 'archive' ? e.statut : 'brouillon'
                    }
                  />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
