import { ConsoleContenusCMS, type ContenuListe } from '@/components/contenu/ConsoleContenusCMS';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';
import { FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contenus éditoriaux',
};

/**
 * Console admin des contenus éditoriaux CMS (V2.5.15 — Master Plan V2.6 Phase K).
 *
 * Refonte : passage d'une liste plate de 10 pages connues + dump du reste à
 * une console organisée et cherchable. Voir `<ConsoleContenusCMS>`.
 *
 * Liste TOUS les contenus en base, groupés par préfixe d'espace (`home.*`,
 * `footer.*`, `s-entraider.*`, etc.), avec recherche full-text instantanée
 * sur clé + valeur + titre de page connue. Les pages connues qui n'ont pas
 * encore de contenu personnalisé apparaissent en alerte en haut.
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

/**
 * Mapping additionnel cle → chemin public, pour les libellés UI que l'on
 * sait localiser facilement. Sert au bouton « Éditer en place » de la
 * console. Pas exhaustif : seules les clés dont on connaît la page sont
 * listées. Les autres clés s'affichent sans lien (l'admin sait où aller).
 */
function devinerCheminPublic(cle: string): string | undefined {
  // Préfixe → chemin canonique
  const REGLES: Array<{ prefix: string; chemin: string }> = [
    { prefix: 'home.', chemin: '/' },
    { prefix: 'footer.', chemin: '/' },
    { prefix: 's-informer.reseau.', chemin: '/s-informer/reseau' },
    { prefix: 's-informer.decider.', chemin: '/s-informer/decider' },
    { prefix: 's-informer.journal.', chemin: '/s-informer/journal' },
    { prefix: 's-informer.medias.', chemin: '/s-informer/medias' },
    { prefix: 's-entraider.', chemin: '/s-entraider' },
    { prefix: 'mobiliser.petitions.', chemin: '/mobiliser/petitions' },
    { prefix: 'mobiliser.mobilisations.', chemin: '/mobiliser/mobilisations' },
    { prefix: 'mobiliser.cagnottes.', chemin: '/mobiliser/cagnottes' },
    { prefix: 'mobiliser.campagnes.', chemin: '/mobiliser/campagnes' },
    { prefix: 'mobiliser.', chemin: '/mobiliser' },
    { prefix: 'agir.adherer.', chemin: '/agir/adherer' },
    { prefix: 'agir.communes.', chemin: '/agir/communes' },
    { prefix: 'agir.federations.', chemin: '/agir/federations' },
    { prefix: 'agir.', chemin: '/agir' },
    { prefix: 'comprendre.', chemin: '/comprendre' },
    { prefix: 'decider.sondages.', chemin: '/decider/sondages' },
    { prefix: 'decider.', chemin: '/decider' },
    { prefix: 'cartes.', chemin: '/cartes' },
    { prefix: 'agenda.', chemin: '/agenda' },
    { prefix: 'recherche.', chemin: '/recherche' },
    { prefix: 'communes.fiche.', chemin: '/agir/communes' },
    { prefix: 'federations.fiche.', chemin: '/agir/federations' },
    { prefix: 'petitions.fiche.', chemin: '/mobiliser/petitions' },
    { prefix: 'cagnottes.fiche.', chemin: '/mobiliser/cagnottes' },
    { prefix: 'mobilisations.fiche.', chemin: '/mobiliser/mobilisations' },
    { prefix: 'co-construire.', chemin: '/co-construire' },
    { prefix: 'profil.', chemin: '/profil' },
    { prefix: 'admin.', chemin: '/admin' },
  ];
  for (const r of REGLES) {
    if (cle.startsWith(r.prefix)) return r.chemin;
  }
  // Pages éditoriales explicitement listées
  const direct = PAGES_EDITORIALES_CONNUES.find((p) => p.cle === cle);
  return direct?.chemin;
}

export default async function PageContenusEditoriaux() {
  const supabase = await getSupabaseServer();
  const { data: contenus } = await supabase
    .from('contenu_editorial')
    .select('cle, titre, valeur_md, updated_at')
    .order('updated_at', { ascending: false });

  const titresParCle = new Map(PAGES_EDITORIALES_CONNUES.map((p) => [p.cle, p.titre]));
  const cleesEnBase = new Set((contenus ?? []).map((c) => c.cle));
  const pagesNonEditees = PAGES_EDITORIALES_CONNUES.filter((p) => !cleesEnBase.has(p.cle));

  const contenusListe: ContenuListe[] = (contenus ?? []).map((c) => ({
    cle: c.cle,
    valeurMd: c.valeur_md,
    // V2.5.25 — valeur_html optionnelle, peut ne pas exister sur le distant
    // si la migration 20260530500000 n'a pas encore été appliquée (Master
    // Plan local strict). On caste defensivement.
    valeurHtml: (c as { valeur_html?: string | null }).valeur_html ?? null,
    updatedAt: c.updated_at,
    cheminPublic: devinerCheminPublic(c.cle),
    titrePage: titresParCle.get(c.cle),
  }));

  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.contenus.titre', { valeurMd: 'Contenus éditoriaux' }),
    lireContenuEditorial('admin.national.contenus.intro', {
      valeurMd:
        "Console CMS V2.5.15. Cherche n'importe quel libellé du site par sa clé ou par son contenu, puis va l'éditer en place en cliquant sur ✏️ sur la page publique correspondante.",
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

      <div className="mt-8">
        <ConsoleContenusCMS contenus={contenusListe} pagesNonEditees={pagesNonEditees} />
      </div>
    </>
  );
}
