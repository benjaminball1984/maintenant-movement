import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormulaireMajEdition } from './FormulaireMajEdition';

const FALLBACKS = {
  retour: '← Tous les numéros',
  publieLePrefix: 'Publié le',
  contenuVide: 'Contenu non encore rédigé.',
  adminSection: 'Administration (réservé admins)',
};

interface Props {
  params: Promise<{ slug: string }>;
}

async function chargerEdition(slug: string) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('journal_affiche')
    .select(
      'id, slug, titre, sous_titre, numero, format, contenu_md, contenu_html, image_couverture_url, publie_le, statut',
    )
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = await chargerEdition(slug);
  if (e === null) return { title: 'Édition introuvable' };
  return {
    title: `${e.titre} (n°${e.numero}) — Maintenant Médias`,
    description: e.sous_titre ?? undefined,
  };
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Page individuelle d'une édition de journal-affiche (V2.4.11).
 */
export default async function PageEditionJournal({ params }: Props) {
  const { slug } = await params;
  const [e, estAdmin, retour, publieLePrefix, contenuVide, adminSection] = await Promise.all([
    chargerEdition(slug),
    estAdminCourant(),
    lireContenuEditorial('journal.fiche.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('journal.fiche.publie_le_prefix', {
      valeurMd: FALLBACKS.publieLePrefix,
    }),
    lireContenuEditorial('journal.fiche.contenu_vide', { valeurMd: FALLBACKS.contenuVide }),
    lireContenuEditorial('journal.fiche.admin_section', { valeurMd: FALLBACKS.adminSection }),
  ]);
  if (e === null) notFound();

  return (
    <Container taille="md" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="journal.fiche.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour vers liste journal"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/s-informer/journal" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Heading niveau={1}>{e.titre}</Heading>
        <BoutonAdminEditer href="/admin/national">Admin</BoutonAdminEditer>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="default">N°{e.numero}</Badge>
        <Badge variant="info">{e.format}</Badge>
        {e.publie_le !== null ? (
          <span className="text-text-3 text-xs">
            <TexteEditableAdmin
              cle="journal.fiche.publie_le_prefix"
              valeurInitiale={publieLePrefix.valeurMd}
              estAdmin={estAdmin}
              libelle="prefixe 'Publie le' (la date s'ajoute apres)"
              longueurMax={30}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            {FORMATEUR.format(new Date(e.publie_le))}
          </span>
        ) : null}
      </div>

      {e.sous_titre !== null ? <p className="mt-3 text-text-2">{e.sous_titre}</p> : null}

      {e.image_couverture_url !== null ? (
        <div className="relative mt-6 aspect-[210/297] max-w-md overflow-hidden rounded-lg border border-border">
          <Image
            src={e.image_couverture_url}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
          />
        </div>
      ) : null}

      <article className="prose-maintenant mt-8 font-body text-text-1">
        {(() => {
          // V2.5.33 — priorité au HTML riche s'il est posé (déjà sanitizé
          // au save côté Server Action via sanitizeRichHtml). Sinon
          // fallback Markdown léger. Si les deux sont vides, message
          // placeholder éditable.
          const html = (e as { contenu_html?: string | null }).contenu_html ?? null;
          if (html !== null && html.trim() !== '') {
            return (
              <div
                className="prose prose-sm max-w-none [&_a]:text-brand [&_a]:underline [&_blockquote]:border-brand [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h1]:mt-4 [&_h1]:font-bold [&_h1]:text-2xl [&_h2]:mt-3 [&_h2]:font-bold [&_h2]:text-xl [&_h3]:mt-2 [&_h3]:font-bold [&_h3]:text-lg [&_img]:my-4 [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: déjà sanitizé côté Server Action via sanitizeRichHtml
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          if (e.contenu_md !== '') return <MarkdownLeger texte={e.contenu_md} />;
          return (
            <TexteEditableAdmin
              cle="journal.fiche.contenu_vide"
              valeurInitiale={contenuVide.valeurMd}
              estAdmin={estAdmin}
              libelle="message contenu vide"
              longueurMax={100}
            >
              {(t) => <p className="text-text-3 italic">{t}</p>}
            </TexteEditableAdmin>
          );
        })()}
      </article>

      {estAdmin ? (
        <section className="mt-12">
          <TexteEditableAdmin
            cle="journal.fiche.admin_section"
            valeurInitiale={adminSection.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section administration"
            longueurMax={80}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={3}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <FormulaireMajEdition
            id={e.id}
            titreInitial={e.titre}
            sousTitreInitial={e.sous_titre ?? ''}
            contenuInitial={e.contenu_md}
            contenuHtmlInitial={(e as { contenu_html?: string | null }).contenu_html ?? null}
            imageInitial={e.image_couverture_url ?? ''}
            numeroInitial={e.numero}
            formatInitial={e.format === 'A4' ? 'A4' : 'A3'}
          />
        </section>
      ) : null}
    </Container>
  );
}
