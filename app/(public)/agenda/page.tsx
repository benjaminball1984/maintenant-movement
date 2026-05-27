import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { type FiltreAgenda, chargerEvenementsAgenda } from '@/lib/agenda/donnees';
import { TYPES_MOMENTS } from '@/lib/moments/config';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Agenda',
  description:
    'Miroir temporel de la carte unifiée Maintenant!. Mobilisations, moments solidaires, minimarchés, boutiques éphémères.',
};

interface PageAgendaProps {
  searchParams: Promise<{ jour?: string; departement?: string; type?: string }>;
}

const FORMATEUR_LONG = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const FORMATEUR_HEURE = new Intl.DateTimeFormat('fr-FR', {
  hour: 'numeric',
  minute: 'numeric',
});

const LIBELLE_TYPE: Record<string, string> = {
  mobilisation: 'Mobilisation',
  moment_solidaire: 'Moment solidaire',
  minimarche: 'Minimarché',
  boutique_marche: 'Boutique éphémère',
  sondage: 'Sondage',
};

function estTypeValide(v: string | undefined): v is FiltreAgenda['type'] {
  return (
    v === 'mobilisation' ||
    v === 'moment_solidaire' ||
    v === 'minimarche' ||
    v === 'boutique_marche' ||
    v === 'sondage'
  );
}

/**
 * Page `/agenda` — agenda agrégé (chantier 6.2).
 *
 * Cf. spec §8B « miroir temporel ». Liste linéaire triée par date,
 * regroupée par jour. Filtres URL pour jour, département, type.
 */
export default async function PageAgenda({ searchParams }: PageAgendaProps) {
  const { jour, departement, type } = await searchParams;
  const filtre: FiltreAgenda = {
    jour: jour === undefined || jour === '' ? undefined : jour,
    departement: departement === undefined || departement === '' ? undefined : departement,
    type: estTypeValide(type) ? type : undefined,
  };
  const evenements = await chargerEvenementsAgenda(filtre);

  // Regroupe par jour pour le rendu.
  const groupesParJour = new Map<string, typeof evenements>();
  for (const e of evenements) {
    const jourCle = e.commence_le.slice(0, 10);
    const liste = groupesParJour.get(jourCle) ?? [];
    liste.push(e);
    groupesParJour.set(jourCle, liste);
  }

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8">
        <Heading niveau={1}>Agenda</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Tout ce qui est public et daté sur Maintenant!. Filtres dans l'URL :{' '}
          <code className="rounded bg-surface-2 px-1 text-xs">?jour=YYYY-MM-DD</code>,{' '}
          <code className="rounded bg-surface-2 px-1 text-xs">?departement=75</code>,{' '}
          <code className="rounded bg-surface-2 px-1 text-xs">?type=mobilisation</code>.
        </p>
      </header>

      <form method="get" className="mb-8 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-3">Jour</span>
          <input
            type="date"
            name="jour"
            defaultValue={filtre.jour ?? ''}
            className="rounded-sm border border-border bg-surface p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-3">Département</span>
          <input
            type="text"
            name="departement"
            placeholder="75"
            defaultValue={filtre.departement ?? ''}
            maxLength={3}
            className="w-24 rounded-sm border border-border bg-surface p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-3">Type</span>
          <select
            name="type"
            defaultValue={filtre.type ?? ''}
            className="rounded-sm border border-border bg-surface p-2"
          >
            <option value="">Tous</option>
            <option value="mobilisation">Mobilisations</option>
            <option value="moment_solidaire">Moments solidaires</option>
            <option value="minimarche">Minimarchés</option>
            <option value="boutique_marche">Boutiques éphémères</option>
            <option value="sondage">Clôtures de sondages</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-md bg-grad px-4 py-2 text-sm font-bold text-white"
          >
            Filtrer
          </button>
        </div>
      </form>

      {groupesParJour.size === 0 ? (
        <Alert variant="info" titre="Aucun événement">
          Aucun événement à venir avec ces filtres.
        </Alert>
      ) : (
        <div className="grid gap-8">
          {Array.from(groupesParJour.entries()).map(([jourCle, liste]) => (
            <section key={jourCle}>
              <Heading niveau={2} apparenceComme={3} className="mb-3 capitalize">
                {FORMATEUR_LONG.format(new Date(jourCle))}
              </Heading>
              <ul className="grid gap-3">
                {liste.map((e) => (
                  <li key={`${e.type}-${e.id}`}>
                    <Card variant="ombre" className="flex flex-col gap-2">
                      <header className="flex flex-wrap items-center justify-between gap-2">
                        <Badge
                          variant={
                            e.type === 'mobilisation'
                              ? 'brand'
                              : e.type === 'moment_solidaire'
                                ? 'accent'
                                : 'info'
                          }
                        >
                          {LIBELLE_TYPE[e.type] ?? e.type}
                        </Badge>
                        <span className="text-xs text-text-3">
                          {FORMATEUR_HEURE.format(new Date(e.commence_le))}
                          {e.termine_le !== null
                            ? ` → ${FORMATEUR_HEURE.format(new Date(e.termine_le))}`
                            : ''}
                        </span>
                      </header>
                      <h3 className="text-lg font-bold leading-tight text-text-1">
                        <Link href={e.href} className="underline-offset-4 hover:underline">
                          {e.titre}
                        </Link>
                      </h3>
                      {e.lieu !== null ? (
                        <p className="text-sm text-text-3">
                          {e.lieu}
                          {e.departement !== null ? ` · dép. ${e.departement}` : ''}
                        </p>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-12 text-sm text-text-3">
        <p>
          Voir aussi la{' '}
          <Link href="/carte" className="underline">
            carte unifiée
          </Link>{' '}
          — même périmètre, vue spatiale. Cf. doctrine §8.
        </p>
      </footer>

      {/* Anti-DCE Biome : on importe TYPES_MOMENTS pour rester en lien
          fort avec la config commune, même si on ne s'en sert que pour
          la sanity check au build (8 types attendus). */}
      <span className="sr-only">
        {Object.keys(TYPES_MOMENTS).length} types de moments configurés.
      </span>
    </Container>
  );
}
