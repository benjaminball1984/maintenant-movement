import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Heading } from '@/components/ui';
import { chargerCompteursFileModeration } from '@/lib/admin/file-moderation';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle,
  FileText,
  Flag,
  Image as IconeImage,
  MessageSquare,
  Package,
  PenSquare,
  ShoppingBag,
  Users,
  Vote,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Modération — File d’attente',
};

const FORMATEUR_NB = new Intl.NumberFormat('fr-FR');

interface LigneFile {
  cle: string;
  libelle: string;
  href: string;
  nb: number;
  icone: LucideIcon;
}

/**
 * Page `/admin/moderation` — File de modération globale (V2.4.14).
 *
 * Agrège tous les compteurs « en attente d'action » par module et les
 * affiche en un coup d'œil, classés du plus urgent au moins urgent.
 * Chaque ligne pointe directement vers la console spécialisée du module.
 */
export default async function PageModerationGlobale() {
  const [c, estAdmin, titre, intro, totalLabel, videMessage] = await Promise.all([
    chargerCompteursFileModeration(),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.titre', { valeurMd: 'File de modération' }),
    lireContenuEditorial('admin.moderation.intro', {
      valeurMd:
        "Vue agrégée de tout ce qui est en attente d'action côté modération. Cliquer une ligne ouvre la console spécialisée du module.",
    }),
    lireContenuEditorial('admin.moderation.total_label', { valeurMd: 'Total en attente' }),
    lireContenuEditorial('admin.moderation.vide_message', {
      valeurMd: 'Aucune action de modération en attente. Tu peux respirer.',
    }),
  ]);

  // Definition des 15 lignes : slug stable + fallback libelle + href + compteur + icone.
  // Chaque libelle est editable admin via cle CMS `admin.moderation.ligne.{slug}.libelle`.
  const LIGNES_CONFIG = [
    {
      slug: 'petitions',
      libelle: 'Pétitions à modérer',
      href: '/admin/moderation/petitions',
      nb: c.petitionsEnModeration,
      icone: PenSquare,
    },
    {
      slug: 'campagnes',
      libelle: 'Campagnes à modérer',
      href: '/admin/moderation/campagnes',
      nb: c.campagnesEnModeration,
      icone: Flag,
    },
    {
      slug: 'mobilisations',
      libelle: 'Mobilisations retirées (à examiner)',
      href: '/admin/moderation/mobilisations',
      nb: c.mobilisationsRetirees,
      icone: CalendarRange,
    },
    {
      slug: 'cagnottes',
      libelle: 'Cagnottes suspendues (à examiner)',
      href: '/admin/moderation/cagnottes',
      nb: c.cagnottesSuspendues,
      icone: Wallet,
    },
    {
      slug: 'media',
      libelle: 'Médias non publiés (à modérer)',
      href: '/admin/moderation/media',
      nb: c.mediasEnAttente,
      icone: IconeImage,
    },
    {
      slug: 'sondages',
      libelle: 'Sondages en modération',
      href: '/admin/moderation/sondages',
      nb: c.sondagesEnModeration,
      icone: Vote,
    },
    {
      slug: 'reservations',
      libelle: 'Réservations en litige (à arbitrer)',
      href: '/admin/moderation/reservations',
      nb: c.reservationsEnLitige,
      icone: AlertTriangle,
    },
    {
      slug: 'reseau-posts',
      libelle: 'Posts réseau signalés',
      href: '/admin/moderation/reseau',
      nb: c.reseauPostsSignales,
      icone: MessageSquare,
    },
    {
      slug: 'reseau-messages',
      libelle: 'Messages réseau signalés',
      href: '/admin/moderation/reseau',
      nb: c.reseauMessagesSignales,
      icone: MessageSquare,
    },
    {
      slug: 'sel-contestees',
      libelle: 'Prestations SEL contestées',
      href: '/admin/moderation/sel',
      nb: c.selPrestationsContestees,
      icone: Package,
    },
    {
      slug: 'sel-moderation',
      libelle: 'Prestations SEL en modération',
      href: '/admin/moderation/sel',
      nb: c.selPrestationsEnModeration,
      icone: Package,
    },
    {
      slug: 'groupes-entraide',
      libelle: 'Groupes d’entraide à modérer',
      href: '/admin/moderation/groupes-locaux',
      nb: c.groupesEntraideEnModeration,
      icone: Users,
    },
    {
      slug: 'marche',
      libelle: 'Produits marché retirés (à examiner)',
      href: '/admin/moderation/marche',
      nb: c.marcheProduitsSignales,
      icone: ShoppingBag,
    },
    {
      slug: 'moments',
      libelle: 'Moments solidaires retirés (à examiner)',
      href: '/admin/moderation/moments',
      nb: c.momentsAModerer,
      icone: CalendarRange,
    },
    {
      slug: 'contenus',
      libelle: 'Pages éditoriales à rédiger',
      href: '/admin/national/contenus',
      nb: c.contenusEditoriauxARediger,
      icone: FileText,
    },
  ];

  // Lecture des 15 libelles via CMS, en parallele.
  const libellesCms = await Promise.all(
    LIGNES_CONFIG.map((l) =>
      lireContenuEditorial(`admin.moderation.ligne.${l.slug}.libelle`, { valeurMd: l.libelle }),
    ),
  );

  const lignes: LigneFile[] = LIGNES_CONFIG.map((l, i) => ({
    cle: l.slug,
    libelle: libellesCms[i]?.valeurMd ?? l.libelle,
    href: l.href,
    nb: l.nb,
    icone: l.icone,
  }));

  const lignesTriees = [...lignes].sort((a, b) => b.nb - a.nb);
  const totalEnAttente = lignes.reduce((acc, l) => acc + l.nb, 0);

  return (
    <>
      <header className="mb-6">
        <Heading niveau={1}>
          <Flag size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="admin.moderation.titre"
            valeurInitiale={titre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre file moderation"
            longueurMax={40}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Heading>
        <TexteEditableAdmin
          cle="admin.moderation.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro file moderation"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mt-1 text-sm text-text-3">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <Card variant="ombre" className="mb-6 grid gap-1">
        <TexteEditableAdmin
          cle="admin.moderation.total_label"
          valeurInitiale={totalLabel.valeurMd}
          estAdmin={estAdmin}
          libelle="label Total en attente"
          longueurMax={40}
        >
          {(t) => <p className="text-xs font-bold uppercase tracking-cap text-text-3">{t}</p>}
        </TexteEditableAdmin>
        <p className="font-display text-3xl text-text-1">{FORMATEUR_NB.format(totalEnAttente)}</p>
        {totalEnAttente === 0 ? (
          <p className="text-sm text-success">
            <CheckCircle size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
            <TexteEditableAdmin
              cle="admin.moderation.vide_message"
              valeurInitiale={videMessage.valeurMd}
              estAdmin={estAdmin}
              libelle="message si file vide"
              longueurMax={150}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </p>
        ) : null}
      </Card>

      <ul className="grid gap-2">
        {lignesTriees.map((l) => {
          const Icone = l.icone;
          return (
            <li key={l.cle}>
              <Link
                href={l.href}
                className="block"
                aria-label={`${l.libelle} : ${FORMATEUR_NB.format(l.nb)} en attente`}
              >
                <Card
                  variant={l.nb > 0 ? 'ombre' : 'plat'}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 hover:bg-surface-2"
                >
                  <Icone
                    size={18}
                    className={l.nb > 0 ? 'text-brand' : 'text-text-3'}
                    aria-hidden="true"
                  />
                  <TexteEditableAdmin
                    cle={`admin.moderation.ligne.${l.cle}.libelle`}
                    valeurInitiale={l.libelle}
                    estAdmin={estAdmin}
                    libelle={`libelle ligne ${l.cle}`}
                    longueurMax={100}
                  >
                    {(t) => (
                      <p className={l.nb > 0 ? 'font-bold text-text-1' : 'text-text-2'}>{t}</p>
                    )}
                  </TexteEditableAdmin>
                  {l.nb > 0 ? (
                    <Badge variant={l.nb >= 5 ? 'danger' : 'warning'}>
                      {FORMATEUR_NB.format(l.nb)}
                    </Badge>
                  ) : (
                    <Badge variant="default">{FORMATEUR_NB.format(l.nb)}</Badge>
                  )}
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
