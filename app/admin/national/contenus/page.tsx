import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';
import { ExternalLink, FileText, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contenus éditoriaux',
};

/**
 * Console admin des contenus éditoriaux CMS V2.4.1 / V2.4.6.
 *
 * Liste tous les blocs `contenu_editorial` en base, avec leur date de
 * modification, leur taille, et un lien direct vers la page publique
 * où ils s'éditent. Pour modifier un contenu, l'admin va sur la page
 * publique et clique sur « Modifier ».
 *
 * Les blocs « non encore en base » (pages où le fallback lorem ipsum
 * n'a pas été remplacé) sont listés à part en bas.
 */

const PAGES_EDITORIALES_CONNUES: Array<{ cle: string; chemin: string; titre: string }> = [
  { cle: 'page.comprendre.doctrine', chemin: '/comprendre/doctrine', titre: 'Doctrine fondatrice' },
  {
    cle: 'page.comprendre.commune-libre',
    chemin: '/comprendre/commune-libre',
    titre: 'Commune libre',
  },
  {
    cle: 'page.comprendre.assemblee-confederale',
    chemin: '/comprendre/assemblee-confederale',
    titre: 'Assemblée Confédérale',
  },
  { cle: 'page.comprendre.faq', chemin: '/comprendre/faq', titre: 'FAQ' },
  { cle: 'page.comprendre.monnaie', chemin: '/comprendre/monnaie', titre: 'Monnaie 99-coin' },
  { cle: 'page.comprendre.ressources', chemin: '/comprendre/ressources', titre: 'Ressources' },
  { cle: 'page.a-propos', chemin: '/a-propos', titre: 'À propos' },
  { cle: 'page.mentions-legales', chemin: '/mentions-legales', titre: 'Mentions légales' },
  { cle: 'page.confidentialite', chemin: '/confidentialite', titre: 'Confidentialité' },
  { cle: 'page.contact', chemin: '/contact', titre: 'Contact' },
];

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function PageContenusEditoriaux() {
  const supabase = await getSupabaseServer();
  const { data: contenus } = await supabase
    .from('contenu_editorial')
    .select('cle, titre, valeur_md, updated_at, updated_by')
    .order('updated_at', { ascending: false });

  const enBaseParCle = new Map((contenus ?? []).map((c) => [c.cle, c]));

  const editees: typeof PAGES_EDITORIALES_CONNUES = [];
  const nonEditees: typeof PAGES_EDITORIALES_CONNUES = [];
  for (const p of PAGES_EDITORIALES_CONNUES) {
    if (enBaseParCle.has(p.cle)) editees.push(p);
    else nonEditees.push(p);
  }

  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.contenus.titre', { valeurMd: 'Contenus éditoriaux' }),
    lireContenuEditorial('admin.national.contenus.intro', {
      valeurMd:
        "CMS minimal V2.4.1. Pour modifier un contenu, va sur la page publique correspondante et clique sur « Modifier » (visible uniquement en tant qu'admin).",
    }),
  ]);

  return (
    <>
      <Heading niveau={1}>
        <FileText size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="admin.national.contenus.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console contenus editoriaux"
          longueurMax={50}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <TexteEditableAdmin
        cle="admin.national.contenus.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console contenus editoriaux"
        multilignes
        longueurMax={400}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          Pages déjà personnalisées ({editees.length})
        </Heading>
        {editees.length === 0 ? (
          <p className="mt-2 text-sm text-text-3">
            Aucune page n'a encore été personnalisée. Toutes affichent du lorem ipsum.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {editees.map((p) => {
              const c = enBaseParCle.get(p.cle);
              return (
                <li key={p.cle}>
                  <Card variant="ombre" className="grid gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{p.titre}</p>
                      <Badge variant="success">Personnalisé</Badge>
                    </div>
                    <p className="text-text-3 text-xs">
                      <code className="font-mono">{p.cle}</code> · {c?.valeur_md.length ?? 0}{' '}
                      caractères ·{' '}
                      {c?.updated_at !== undefined
                        ? `modifié le ${FORMATEUR_DATE.format(new Date(c.updated_at))}`
                        : ''}
                    </p>
                    <Link
                      href={p.chemin}
                      className="inline-flex items-center gap-1 text-brand text-sm hover:underline"
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                      Voir / modifier sur {p.chemin}
                    </Link>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          Pages avec lorem ipsum par défaut ({nonEditees.length})
        </Heading>
        {nonEditees.length === 0 ? (
          <p className="mt-2 text-sm text-text-3">Toutes les pages connues sont personnalisées.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {nonEditees.map((p) => (
              <li key={p.cle}>
                <Card variant="plat" className="grid gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{p.titre}</p>
                    <Badge variant="warning">
                      <Plus size={12} aria-hidden="true" />À rédiger
                    </Badge>
                  </div>
                  <p className="text-text-3 text-xs">
                    <code className="font-mono">{p.cle}</code>
                  </p>
                  <Link
                    href={p.chemin}
                    className="inline-flex items-center gap-1 text-brand text-sm hover:underline"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Aller éditer sur {p.chemin}
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(contenus ?? []).filter((c) => !PAGES_EDITORIALES_CONNUES.some((p) => p.cle === c.cle))
        .length > 0 ? (
        <section className="mt-8">
          <Heading niveau={2} apparenceComme={3}>
            Autres contenus en base (non listés)
          </Heading>
          <ul className="mt-4 grid gap-2">
            {(contenus ?? [])
              .filter((c) => !PAGES_EDITORIALES_CONNUES.some((p) => p.cle === c.cle))
              .map((c) => (
                <li key={c.cle}>
                  <Card variant="plat" className="grid gap-1">
                    <p className="font-mono text-text-1 text-sm">{c.cle}</p>
                    <p className="text-text-3 text-xs">
                      {c.valeur_md.length} caractères · modifié le{' '}
                      {FORMATEUR_DATE.format(new Date(c.updated_at))}
                    </p>
                  </Card>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
