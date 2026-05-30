import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Console nationale',
};

const FALLBACK_TITRE = 'Console nationale';
const FALLBACK_INTRO =
  'Outils d’administration réservés au niveau national. Chaque action sensible est consignée dans le journal d’audit.';
const FALLBACK_BADGE_A_VENIR = 'À venir';

/**
 * Accueil de la console nationale (« super admin »).
 *
 * Hub vers les outils réservés au niveau `national`. Les modules livrés
 * sont des liens actifs ; les modules à venir sont affichés sans lien
 * (pas de chemin mort) avec un badge explicite, conformément à la règle
 * d'exhaustivité du projet.
 */
export default async function PageConsoleNationale() {
  // 1 estAdmin + 1 titre + 1 intro + 1 badge + 17 * 2 (titre + description par module) = 38 lectures
  // CMS en parallele. Ne ralentit pas la page (Promise.all + Supabase pool).
  const [estAdmin, titre, intro, badgeAVenir, ...modulesLus] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.titre', { valeurMd: FALLBACK_TITRE }),
    lireContenuEditorial('admin.national.intro', { valeurMd: FALLBACK_INTRO }),
    lireContenuEditorial('admin.national.badge_a_venir', { valeurMd: FALLBACK_BADGE_A_VENIR }),
    ...MODULES.flatMap((m) => [
      lireContenuEditorial(`admin.national.module.${m.slug}.titre`, { valeurMd: m.titre }),
      lireContenuEditorial(`admin.national.module.${m.slug}.description`, {
        valeurMd: m.description,
      }),
    ]),
  ]);

  // Reconstitue par module : 2 entrees CMS par module (titre + description),
  // dans l'ordre du flatMap ci-dessus.
  const modulesAvecCms = MODULES.map((m, i) => ({
    ...m,
    titreCms: modulesLus[i * 2]?.valeurMd ?? m.titre,
    descriptionCms: modulesLus[i * 2 + 1]?.valeurMd ?? m.description,
  }));

  return (
    <section className="grid gap-8">
      <header>
        <TexteEditableAdmin
          cle="admin.national.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre de la console nationale"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={1} apparenceComme={2}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="admin.national.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro de la console nationale"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {modulesAvecCms.map((module) =>
          module.href !== null ? (
            <Link key={module.slug} href={module.href} className="group">
              <Card variant="ombre" className="h-full transition-shadow group-hover:shadow-brand">
                <TexteEditableAdmin
                  cle={`admin.national.module.${module.slug}.titre`}
                  valeurInitiale={module.titreCms}
                  estAdmin={estAdmin}
                  libelle={`titre du module admin ${module.slug}`}
                  longueurMax={60}
                >
                  {(t) => (
                    <Heading niveau={2} apparenceComme={4}>
                      {t}
                    </Heading>
                  )}
                </TexteEditableAdmin>
                <TexteEditableAdmin
                  cle={`admin.national.module.${module.slug}.description`}
                  valeurInitiale={module.descriptionCms}
                  estAdmin={estAdmin}
                  libelle={`description du module admin ${module.slug}`}
                  multilignes
                  longueurMax={400}
                >
                  {(t) => <p className="mt-2 text-sm text-text-2">{t}</p>}
                </TexteEditableAdmin>
              </Card>
            </Link>
          ) : (
            <Card key={module.slug} className="h-full opacity-70">
              <div className="flex items-center gap-2">
                <TexteEditableAdmin
                  cle={`admin.national.module.${module.slug}.titre`}
                  valeurInitiale={module.titreCms}
                  estAdmin={estAdmin}
                  libelle={`titre du module admin ${module.slug}`}
                  longueurMax={60}
                >
                  {(t) => (
                    <Heading niveau={2} apparenceComme={4}>
                      {t}
                    </Heading>
                  )}
                </TexteEditableAdmin>
                <TexteEditableAdmin
                  cle="admin.national.badge_a_venir"
                  valeurInitiale={badgeAVenir.valeurMd}
                  estAdmin={estAdmin}
                  libelle="texte du badge 'A venir'"
                  longueurMax={30}
                >
                  {(t) => <Badge>{t}</Badge>}
                </TexteEditableAdmin>
              </div>
              <TexteEditableAdmin
                cle={`admin.national.module.${module.slug}.description`}
                valeurInitiale={module.descriptionCms}
                estAdmin={estAdmin}
                libelle={`description du module admin ${module.slug}`}
                multilignes
                longueurMax={400}
              >
                {(t) => <p className="mt-2 text-sm text-text-2">{t}</p>}
              </TexteEditableAdmin>
            </Card>
          ),
        )}
      </div>
    </section>
  );
}

/**
 * Modules de la console nationale. `href: null` = pas encore livré
 * (affiche sans lien, badge « A venir »). Titres et descriptions tout
 * deux editables admin via CMS (cles `admin.national.module.{slug}.*`).
 * Le `slug` est l'identifiant stable utilise par les cles CMS (ne change
 * jamais meme si le titre est renomme en admin).
 */
interface ModuleAdmin {
  slug: string;
  titre: string;
  description: string;
  href: string | null;
}

const MODULES: ReadonlyArray<ModuleAdmin> = [
  {
    slug: 'personnes',
    titre: 'Personnes',
    description:
      'Rechercher / filtrer par mot-clé (email, prénom, nom), filtrer par statut (actif, anonymisé, suppression demandée). Export CSV.',
    href: '/admin/national/personnes',
  },
  {
    slug: 'communes',
    titre: 'Communes',
    description:
      '35 011 communes pré-créées + actives. Filtres par nom, code INSEE, code postal, département, statut. Export CSV.',
    href: '/admin/national/communes',
  },
  {
    slug: 'federations',
    titre: 'Fédérations',
    description: 'Référentiel des fédérations avec compteur de communes rattachées. Export CSV.',
    href: '/admin/national/federations',
  },
  {
    slug: 'groupes-entraide',
    titre: 'Groupes d’entraide',
    description:
      'Référentiel des groupes d’entraide locaux avec leurs outils activés (prêt, marché, SEL).',
    href: '/admin/national/groupes-entraide',
  },
  {
    slug: 'organisations',
    titre: 'Organisations',
    description:
      'Pages d’organisation : accorder le badge officiel, arbitrer les revendications de gestion concurrentes.',
    href: '/admin/national/organisations',
  },
  {
    slug: 'sondages',
    titre: 'Sondages',
    description: 'Liste tous statuts, filtres mode + statut. Export CSV.',
    href: '/admin/national/sondages',
  },
  {
    slug: 'moments',
    titre: 'Moments solidaires',
    description: 'Filtres par type (porte-à-porte, maraude, etc.) + statut. Export CSV.',
    href: '/admin/national/moments',
  },
  {
    slug: 'medias',
    titre: 'Médias',
    description: 'Articles, brèves, podcasts, vidéos. Filtres statut + type. Export CSV.',
    href: '/admin/national/medias',
  },
  {
    slug: 'campagnes',
    titre: 'Campagnes',
    description: 'Liste des campagnes avec raison de rejet visible si présente.',
    href: '/admin/national/campagnes',
  },
  {
    slug: 'reservations',
    titre: 'Réservations',
    description: 'Vue globale du cycle D8 complet (8 statuts) + type d’offre.',
    href: '/admin/national/reservations',
  },
  {
    slug: 'decider',
    titre: 'Décider (salles)',
    description: 'Liste des salles de décision + création de salle + compteur de réunions.',
    href: '/admin/national/decider',
  },
  {
    slug: 'journal',
    titre: 'Journal-affiche',
    description: 'Gestion des éditions Maintenant Médias : créer, publier, brouillon, archiver.',
    href: '/admin/national/journal',
  },
  {
    slug: 'contenus',
    titre: 'Contenus éditoriaux',
    description:
      'CMS minimal : 10 pages éditoriales personnalisables, statut « rédigé » vs « lorem ipsum ».',
    href: '/admin/national/contenus',
  },
  {
    slug: 'images',
    titre: 'Bibliothèque images',
    description:
      'Tous les fichiers du bucket Supabase Storage, filtrables par dossier (journal, pétitions, etc.).',
    href: '/admin/national/images',
  },
  {
    slug: 'tresorerie',
    titre: 'Trésorerie',
    description:
      'Lecture des caisses (régime B), réceptacles datés et reversements avec justificatif obligatoire.',
    href: '/admin/national/tresorerie',
  },
  {
    slug: 'audit',
    titre: 'Journal d’audit',
    description:
      'Consulter l’historique horodaté des 200 dernières transitions D8 sur les réservations.',
    href: '/admin/national/audit',
  },
  {
    slug: 'droits',
    titre: 'Gestion des droits',
    description:
      'Accorder et retirer les droits d’administration (national, admin, modération, trésorerie, animation, DPD).',
    href: '/admin/national/droits',
  },
  {
    slug: 'operations',
    titre: 'Opérations système',
    description:
      'Déclencher à la main les tâches périodiques (relances d’adhésion, crédits SEL, tirages au sort, transitions moments).',
    href: null,
  },
];
