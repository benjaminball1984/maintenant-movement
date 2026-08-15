import { BoutonMettreALaUne } from '@/components/home/BoutonMettreALaUne';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { type EmplacementUne, idEpingleUneHome } from '@/lib/home/une';
import { getSupabaseServer } from '@/lib/supabase';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'À la une de l’accueil : Console admin',
};

/**
 * Console « À la une » (revue 2026-06-11, demande Lilou/Ben).
 *
 * Un seul endroit pour choisir ce qui s'affiche dans les blocs « à la
 * une » de la page d'accueil : pétition, mobilisation, sondage, article
 * (Maintenant Médias), cagnotte. Pour chaque emplacement :
 *   - l'élément actuellement épinglé, s'il y en a un ;
 *   - la liste des contenus publiés candidats, avec le bouton d'épinglage.
 *
 * Depuis le 15/08/2026 (décision Lilou/Ben), **un emplacement sans
 * épinglage reste vide sur la page d'accueil** : plus rien n'y monte
 * automatiquement. Cette console devient donc le seul endroit qui décide
 * de ce que voit un visiteur en arrivant sur le site.
 *
 * Réutilise la même table `une_home` et les mêmes Server Actions que les
 * boutons « Mettre à la une » présents sur les fiches. L'accès admin est
 * garanti par le layout `/admin`.
 */

interface Candidat {
  id: string;
  titre: string;
  href: string;
  detail: string | null;
}

interface SectionUne {
  emplacement: EmplacementUne;
  libelle: string;
  candidats: Candidat[];
  idEpingle: string | null;
}

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Paris',
});

export default async function PageAdminUne() {
  const supabase = await getSupabaseServer();

  const [
    petitions,
    medias,
    mobilisations,
    cagnottes,
    sondages,
    ePetition,
    eArticle,
    eMobilisation,
    eCagnotte,
    eSondage,
  ] = await Promise.all([
    supabase
      .from('petition')
      .select('id, titre, slug, created_at')
      .eq('statut', 'publiee')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('media')
      .select('id, titre, slug, publie_le')
      .eq('statut', 'publie')
      .order('publie_le', { ascending: false })
      .limit(20),
    supabase
      .from('mobilisation')
      .select('id, titre, slug, date_debut')
      .eq('statut', 'publiee')
      .gte('date_debut', new Date().toISOString())
      .order('date_debut', { ascending: true })
      .limit(30),
    supabase
      .from('cagnotte')
      .select('id, titre, slug, created_at')
      .eq('statut', 'publiee')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('sondage')
      .select('id, titre, slug, statut, created_at')
      .in('statut', ['ouvert', 'ferme'])
      .order('created_at', { ascending: false })
      .limit(20),
    idEpingleUneHome('petition'),
    idEpingleUneHome('article'),
    idEpingleUneHome('mobilisation'),
    idEpingleUneHome('cagnotte'),
    idEpingleUneHome('sondage'),
  ]);

  // Ordre des sections = ordre d'affichage des blocs sur la page d'accueil.
  const sections: SectionUne[] = [
    {
      emplacement: 'petition',
      libelle: 'Pétition à la une',
      idEpingle: ePetition,
      candidats: (petitions.data ?? []).map((p) => ({
        id: p.id,
        titre: p.titre,
        href: `/mobiliser/petitions/${p.slug}`,
        detail: null,
      })),
    },
    {
      emplacement: 'mobilisation',
      libelle: 'Mobilisation à la une',
      idEpingle: eMobilisation,
      candidats: (mobilisations.data ?? []).map((m) => ({
        id: m.id,
        titre: m.titre,
        href: `/mobiliser/mobilisations/${m.slug}`,
        detail: FORMAT_DATE.format(new Date(m.date_debut)),
      })),
    },
    {
      emplacement: 'sondage',
      libelle: 'Sondage à la une',
      idEpingle: eSondage,
      candidats: (sondages.data ?? []).map((s) => ({
        id: s.id,
        titre: s.titre,
        href: `/s-informer/sondages/${s.slug}`,
        detail: s.statut === 'ferme' ? 'fermé' : null,
      })),
    },
    {
      emplacement: 'article',
      libelle: 'Article à la une (Maintenant Médias)',
      idEpingle: eArticle,
      candidats: (medias.data ?? []).map((m) => ({
        id: m.id,
        titre: m.titre,
        href: `/s-informer/media/${m.slug}`,
        detail: m.publie_le !== null ? FORMAT_DATE.format(new Date(m.publie_le)) : null,
      })),
    },
    {
      emplacement: 'cagnotte',
      libelle: 'Cagnotte à la une',
      idEpingle: eCagnotte,
      candidats: (cagnottes.data ?? []).map((c) => ({
        id: c.id,
        titre: c.titre,
        href: `/mobiliser/cagnottes/${c.slug}`,
        detail: null,
      })),
    },
  ];

  return (
    <section className="grid gap-8">
      <header>
        <Heading niveau={1} apparenceComme={2}>
          À la une de l’accueil
        </Heading>
        <p className="mt-2 text-text-2">
          Choisis ce qui s’affiche dans chaque bloc « à la une » de la page d’accueil. Rien n’y
          monte tout seul : <strong>sans épinglage, le bloc n’apparaît pas</strong> pour les
          visiteur·ses (toi, en administration, tu vois un cadre en pointillés à la place). Une
          mobilisation épinglée dont la date est passée libère son emplacement.
        </p>
      </header>

      {sections.map((section) => (
        <Card key={section.emplacement} variant="ombre" className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Heading niveau={2} apparenceComme={4}>
              {section.libelle}
            </Heading>
            {section.idEpingle === null ? (
              <Badge variant="default">Rien d’épinglé : bloc masqué</Badge>
            ) : (
              <Badge variant="brand">Épinglé</Badge>
            )}
          </div>

          {section.candidats.length === 0 ? (
            <Alert variant="info" titre="Aucun contenu publié">
              Rien à épingler ici pour l’instant : ce bloc n’apparaîtra pas sur l’accueil.
            </Alert>
          ) : (
            <ul className="grid gap-2">
              {section.candidats.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <Link href={c.href} className="font-bold text-text-1 hover:underline">
                      {c.titre}
                    </Link>
                    {c.detail !== null ? (
                      <span className="ml-2 text-xs text-text-3">{c.detail}</span>
                    ) : null}
                  </span>
                  <BoutonMettreALaUne
                    emplacement={section.emplacement}
                    objetId={c.id}
                    estEpingleInitial={section.idEpingle === c.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </section>
  );
}
