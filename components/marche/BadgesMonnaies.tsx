import { Badge } from '@/components/ui';
import { MONNAIES, formaterEuros, formaterT99CP } from '@/lib/marche/config';
import type { MonnaieMarcheMinimarche } from '@/types/database';

interface DoubleAffichagePrixProps {
  /** Centimes d'euros. 0 = pas de prix EUR. */
  prixEurosCentimes: number;
  /** Plus petite unité T99CP (string bigint-safe). '0' = pas de prix T99CP. */
  prixT99CPUnites: string;
  /** Mode du produit : `don` affiche « Don » à la place du prix. */
  mode: 'vente' | 'don';
}

/**
 * `<DoubleAffichagePrix>` — affiche EUR + T99CP côte à côte, ou « Don »
 * gratuit selon le mode. Cf. spec §6F : « la personne acheteuse choisit ».
 */
export function DoubleAffichagePrix({
  prixEurosCentimes,
  prixT99CPUnites,
  mode,
}: DoubleAffichagePrixProps) {
  if (mode === 'don') {
    return <Badge variant="success">Don gratuit</Badge>;
  }
  const eur = formaterEuros(prixEurosCentimes);
  const t99cp = formaterT99CP(prixT99CPUnites);
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-text-1">
      {eur !== '' ? <span>{eur}</span> : null}
      {eur !== '' && t99cp !== '' ? <span className="text-text-3">ou</span> : null}
      {t99cp !== '' ? <span>{t99cp}</span> : null}
    </span>
  );
}

interface BadgesMonnaiesProps {
  /** Liste des codes monnaie acceptés (sous-ensemble du catalogue). */
  monnaies: MonnaieMarcheMinimarche[];
}

/**
 * `<BadgesMonnaies>` — pour les fiches de minimarché : affiche les
 * 1 à 4 monnaies acceptées sous forme de petits badges.
 */
export function BadgesMonnaies({ monnaies }: BadgesMonnaiesProps) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {monnaies.map((code) => {
        const config = MONNAIES[code];
        if (config === undefined) return null;
        return (
          <li key={code}>
            <Badge variant={config.enLigne ? 'brand' : 'default'} title={config.aide}>
              {config.libelle}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
