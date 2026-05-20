import { JaugeT99CPEuros } from '@/components/cagnottes/JaugeT99CPEuros';
import { Badge, Card, Heading } from '@/components/ui';
import { cagnotteAlaUne } from '@/lib/cagnottes/requetes';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UneSection } from './UneSection';

/**
 * Une « cagnotte solidaire » de la page d'accueil (chantier 3.3).
 *
 * Branchée sur `cagnotteAlaUne()` qui retourne la plus récente cagnotte
 * publiée de type `ouverte` ou `lutte` (les cotisations restent dans
 * leur page dédiée, pas en une).
 */
export async function UneCagnotte() {
  const cagnotte = await cagnotteAlaUne();

  if (cagnotte === null) {
    return (
      <UneSection
        type="Cagnotte solidaire"
        couleur="vous"
        titre={null}
        voirTousHref="/mobiliser/cagnottes"
        voirTousLibelle="Voir toutes les cagnottes"
        enAttente={
          <p>
            Aucune cagnotte mise en avant pour le moment.{' '}
            <Link href="/mobiliser/cagnottes/nouvelle" className="text-brand hover:underline">
              Ouvre la première
            </Link>
            .
          </p>
        }
      />
    );
  }

  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <Badge variant="success">Cagnotte solidaire</Badge>
        <Link href="/mobiliser/cagnottes" className="text-xs text-text-3 hover:text-brand">
          Voir toutes les cagnottes →
        </Link>
      </header>

      <Heading niveau={3} className="text-2xl">
        <Link
          href={`/mobiliser/cagnottes/${cagnotte.slug}`}
          className="text-text-1 underline-offset-4 hover:underline"
        >
          {cagnotte.titre}
        </Link>
      </Heading>

      <JaugeT99CPEuros
        totalEurosCentimes={cagnotte.total_euros_centimes}
        totalT99CPUnites={cagnotte.total_t99cp_unites}
        objectifEuros={cagnotte.objectif_euros}
        nombreDons={cagnotte.nombre_dons}
        taille="sm"
      />

      <Link
        href={`/mobiliser/cagnottes/${cagnotte.slug}`}
        className={cn(
          'inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-5',
          'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
        )}
      >
        Soutenir
      </Link>
    </Card>
  );
}
