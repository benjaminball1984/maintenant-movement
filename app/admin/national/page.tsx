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
    titre: 'Gestion des droits',
    description:
      'Accorder et retirer les droits d’administration (national, admin, modération, trésorerie, animation, DPD).',
    href: '/admin/national/droits',
  },
  {
    titre: 'Gestion des personnes',
    description: 'Rechercher une personne, consulter sa fiche, gérer ses données (RGPD).',
    href: null,
  },
  {
    titre: 'Opérations système',
    description:
      'Déclencher à la main les tâches périodiques (relances d’adhésion, crédits SEL, tirages au sort).',
    href: null,
  },
  {
    titre: 'Journal d’audit',
    description: 'Consulter l’historique horodaté de toutes les actions d’administration.',
    href: null,
  },
];
