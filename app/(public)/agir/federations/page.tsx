import { Badge, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerFederations } from '@/lib/communes/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Fédérations' };

const LIBELLE_TYPE: Record<string, string> = {
  geographique: 'Géographique',
  thematique: 'Thématique',
  mixte: 'Mixte',
};

export default async function PageFederations() {
  const [federations, session] = await Promise.all([listerFederations(), getSession()]);
  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Agir</p>
          <Heading niveau={1}>Fédérations</Heading>
          <p className="mt-3 max-w-2xl text-text-2">
            Agrègent des communes par affinité (géographique, thématique, mixte). Pas de continuité
            territoriale obligatoire, pas de limite de nombre.
          </p>
        </div>
        <Link
          href="/agir/federations/nouvelle"
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
            'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
          )}
        >
          {session !== null ? 'Créer une fédération' : 'Connecte-toi pour créer'}
        </Link>
      </header>

      {federations.length === 0 ? (
        <p className="text-sm text-text-3">Aucune fédération pour l'instant.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {federations.map((f) => (
            <li key={f.id}>
              <Card variant="ombre" className="flex flex-col gap-2">
                <Badge variant="brand">{LIBELLE_TYPE[f.type] ?? f.type}</Badge>
                <h3 className="text-lg font-bold leading-tight text-text-1">
                  <Link
                    href={`/agir/federations/${f.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {f.nom}
                  </Link>
                </h3>
                {f.description_courte !== null && f.description_courte.trim() !== '' ? (
                  <p className="text-sm text-text-2">{f.description_courte}</p>
                ) : null}
                <p className="text-xs text-text-3">
                  {f.nombre_communes} commune{f.nombre_communes > 1 ? 's' : ''} rattachée
                  {f.nombre_communes > 1 ? 's' : ''}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
