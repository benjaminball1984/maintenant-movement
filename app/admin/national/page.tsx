import { Badge, Card, Heading } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Console nationale',
};

/**
 * Accueil de la console nationale (« super admin »).
 *
 * Hub vers les outils réservés au niveau `national`. Les modules livrés
 * sont des liens actifs ; les modules à venir sont affichés sans lien
 * (pas de chemin mort) avec un badge explicite, conformément à la règle
 * d'exhaustivité du projet.
 */
export default function PageConsoleNationale() {
  return (
    <section className="grid gap-8">
      <header>
        <Heading niveau={1} apparenceComme={2}>
          Console nationale
        </Heading>
        <p className="mt-2 text-text-2">
          Outils d’administration réservés au niveau national. Chaque action sensible est consignée
          dans le journal d’audit.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((module) =>
          module.href !== null ? (
            <Link key={module.titre} href={module.href} className="group">
              <Card variant="ombre" className="h-full transition-shadow group-hover:shadow-brand">
                <Heading niveau={2} apparenceComme={4}>
                  {module.titre}
                </Heading>
                <p className="mt-2 text-sm text-text-2">{module.description}</p>
              </Card>
            </Link>
          ) : (
            <Card key={module.titre} className="h-full opacity-70">
              <div className="flex items-center gap-2">
                <Heading niveau={2} apparenceComme={4}>
                  {module.titre}
                </Heading>
                <Badge>À venir</Badge>
              </div>
              <p className="mt-2 text-sm text-text-2">{module.description}</p>
            </Card>
          ),
        )}
      </div>
    </section>
  );
}

/**
 * Modules de la console nationale. `href: null` = pas encore livré
 * (affiché sans lien). On ajoutera les chemins au fur et à mesure des
 * paliers (personnes, modération active, opérations système, audit).
 */
const MODULES: ReadonlyArray<{ titre: string; description: string; href: string | null }> = [
  {
    titre: 'Personnes',
    description:
      'Rechercher / filtrer par mot-clé (email, prénom, nom), filtrer par statut (actif, anonymisé, suppression demandée). Export CSV.',
    href: '/admin/national/personnes',
  },
  {
    titre: 'Communes',
    description:
      '35 011 communes pré-créées + actives. Filtres par nom, code INSEE, code postal, département, statut. Export CSV.',
    href: '/admin/national/communes',
  },
  {
    titre: 'Fédérations',
    description: 'Référentiel des fédérations avec compteur de communes rattachées. Export CSV.',
    href: '/admin/national/federations',
  },
  {
    titre: 'Groupes d’entraide',
    description:
      'Référentiel des groupes d’entraide locaux avec leurs outils activés (prêt, marché, SEL).',
    href: '/admin/national/groupes-entraide',
  },
  {
    titre: 'Sondages',
    description: 'Liste tous statuts, filtres mode + statut. Export CSV.',
    href: '/admin/national/sondages',
  },
  {
    titre: 'Moments solidaires',
    description: 'Filtres par type (porte-à-porte, maraude, etc.) + statut. Export CSV.',
    href: '/admin/national/moments',
  },
  {
    titre: 'Médias',
    description: 'Articles, brèves, podcasts, vidéos. Filtres statut + type. Export CSV.',
    href: '/admin/national/medias',
  },
  {
    titre: 'Campagnes',
    description: 'Liste des campagnes avec raison de rejet visible si présente.',
    href: '/admin/national/campagnes',
  },
  {
    titre: 'Réservations',
    description: 'Vue globale du cycle D8 complet (8 statuts) + type d’offre.',
    href: '/admin/national/reservations',
  },
  {
    titre: 'Décider (salles)',
    description: 'Liste des salles de décision + création de salle + compteur de réunions.',
    href: '/admin/national/decider',
  },
  {
    titre: 'Journal-affiche',
    description: 'Gestion des éditions Maintenant Médias : créer, publier, brouillon, archiver.',
    href: '/admin/national/journal',
  },
  {
    titre: 'Contenus éditoriaux',
    description:
      'CMS minimal : 10 pages éditoriales personnalisables, statut « rédigé » vs « lorem ipsum ».',
    href: '/admin/national/contenus',
  },
  {
    titre: 'Bibliothèque images',
    description:
      'Tous les fichiers du bucket Supabase Storage, filtrables par dossier (journal, pétitions, etc.).',
    href: '/admin/national/images',
  },
  {
    titre: 'Trésorerie',
    description:
      'Lecture des caisses (régime B), réceptacles datés et reversements avec justificatif obligatoire.',
    href: '/admin/national/tresorerie',
  },
  {
    titre: 'Journal d’audit',
    description:
      'Consulter l’historique horodaté des 200 dernières transitions D8 sur les réservations.',
    href: '/admin/national/audit',
  },
  {
    titre: 'Gestion des droits',
    description:
      'Accorder et retirer les droits d’administration (national, admin, modération, trésorerie, animation, DPD).',
    href: '/admin/national/droits',
  },
  {
    titre: 'Opérations système',
    description:
      'Déclencher à la main les tâches périodiques (relances d’adhésion, crédits SEL, tirages au sort, transitions moments).',
    href: null,
  },
];
