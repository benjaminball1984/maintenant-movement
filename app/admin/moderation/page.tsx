import { Badge, Card, Heading } from '@/components/ui';
import { chargerCompteursFileModeration } from '@/lib/admin/file-moderation';
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
  const c = await chargerCompteursFileModeration();

  const lignes: LigneFile[] = [
    {
      cle: 'petitions',
      libelle: 'Pétitions à modérer',
      href: '/admin/moderation/petitions',
      nb: c.petitionsEnModeration,
      icone: PenSquare,
    },
    {
      cle: 'campagnes',
      libelle: 'Campagnes à modérer',
      href: '/admin/moderation/campagnes',
      nb: c.campagnesEnModeration,
      icone: Flag,
    },
    {
      cle: 'mobilisations',
      libelle: 'Mobilisations retirées (à examiner)',
      href: '/admin/moderation/mobilisations',
      nb: c.mobilisationsRetirees,
      icone: CalendarRange,
    },
    {
      cle: 'cagnottes',
      libelle: 'Cagnottes suspendues (à examiner)',
      href: '/admin/moderation/cagnottes',
      nb: c.cagnottesSuspendues,
      icone: Wallet,
    },
    {
      cle: 'media',
      libelle: 'Médias non publiés (à modérer)',
      href: '/admin/moderation/media',
      nb: c.mediasEnAttente,
      icone: IconeImage,
    },
    {
      cle: 'sondages',
      libelle: 'Sondages en modération',
      href: '/admin/moderation/sondages',
      nb: c.sondagesEnModeration,
      icone: Vote,
    },
    {
      cle: 'reservations',
      libelle: 'Réservations en litige (à arbitrer)',
      href: '/admin/moderation/reservations',
      nb: c.reservationsEnLitige,
      icone: AlertTriangle,
    },
    {
      cle: 'reseau-posts',
      libelle: 'Posts réseau signalés',
      href: '/admin/moderation/reseau',
      nb: c.reseauPostsSignales,
      icone: MessageSquare,
    },
    {
      cle: 'reseau-messages',
      libelle: 'Messages réseau signalés',
      href: '/admin/moderation/reseau',
      nb: c.reseauMessagesSignales,
      icone: MessageSquare,
    },
    {
      cle: 'sel-contestees',
      libelle: 'Prestations SEL contestées',
      href: '/admin/moderation/sel',
      nb: c.selPrestationsContestees,
      icone: Package,
    },
    {
      cle: 'sel-moderation',
      libelle: 'Prestations SEL en modération',
      href: '/admin/moderation/sel',
      nb: c.selPrestationsEnModeration,
      icone: Package,
    },
    {
      cle: 'groupes-entraide',
      libelle: 'Groupes d’entraide à modérer',
      href: '/admin/moderation/groupes-locaux',
      nb: c.groupesEntraideEnModeration,
      icone: Users,
    },
    {
      cle: 'marche',
      libelle: 'Produits marché retirés (à examiner)',
      href: '/admin/moderation/marche',
      nb: c.marcheProduitsSignales,
      icone: ShoppingBag,
    },
    {
      cle: 'moments',
      libelle: 'Moments solidaires retirés (à examiner)',
      href: '/admin/moderation/moments',
      nb: c.momentsAModerer,
      icone: CalendarRange,
    },
    {
      cle: 'contenus',
      libelle: 'Pages éditoriales à rédiger',
      href: '/admin/national/contenus',
      nb: c.contenusEditoriauxARediger,
      icone: FileText,
    },
  ];

  const lignesTriees = [...lignes].sort((a, b) => b.nb - a.nb);
  const totalEnAttente = lignes.reduce((acc, l) => acc + l.nb, 0);

  return (
    <>
      <header className="mb-6">
        <Heading niveau={1}>
          <Flag size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
          File de modération
        </Heading>
        <p className="mt-1 text-sm text-text-3">
          Vue agrégée de tout ce qui est en attente d'action côté modération. Cliquer une ligne
          ouvre la console spécialisée du module.
        </p>
      </header>

      <Card variant="ombre" className="mb-6 grid gap-1">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">Total en attente</p>
        <p className="font-display text-3xl text-text-1">{FORMATEUR_NB.format(totalEnAttente)}</p>
        {totalEnAttente === 0 ? (
          <p className="text-sm text-success">
            <CheckCircle size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
            Aucune action de modération en attente. Tu peux respirer.
          </p>
        ) : null}
      </Card>

      <ul className="grid gap-2">
        {lignesTriees.map((l) => {
          const Icone = l.icone;
          return (
            <li key={l.cle}>
              <Link href={l.href} className="block">
                <Card
                  variant={l.nb > 0 ? 'ombre' : 'plat'}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 hover:bg-surface-2"
                >
                  <Icone
                    size={18}
                    className={l.nb > 0 ? 'text-brand' : 'text-text-3'}
                    aria-hidden="true"
                  />
                  <p className={l.nb > 0 ? 'font-bold text-text-1' : 'text-text-2'}>{l.libelle}</p>
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
