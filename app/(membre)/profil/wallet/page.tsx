import { Alert, Badge, Button, Card, Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { getT99CPService } from '@/lib/t99cp';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wallet 99-coin',
};

/**
 * Statut du wallet 99-coin (T99CP, The 99 Coin Project) de la personne.
 *
 * En 1.3, l'adresse de wallet n'est pas encore stockée en BDD (colonne à
 * ajouter au chantier API T99CP dédié). On affiche un placeholder et
 * le lien externe vers T99CP. La balance utilise `getT99CPService()` qui
 * tape sur le mock par défaut (renvoie 100 99-coin fictifs).
 *
 * Doctrine : 1 T99CP = 1 € = 1 minute. Adhésion 12 99-coin (chantier 5.1),
 * RBU 30 99-coin/mois via wallet certifié (chantier 4.2).
 */
export default async function PageWallet() {
  await getPersonneOuRediriger('/profil/wallet');

  // Adresse fictive tant que la colonne `personne.adresse_wallet_t99cp`
  // n'existe pas. La balance retournée par le mock est purement
  // illustrative et permet de tester l'UI.
  const adresseExemple = '0x0000000000000000000000000000000000000000';
  const balance = await getT99CPService().obtenirBalance(adresseExemple);

  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Mon wallet 99-coin</Heading>
        <p className="mt-2 text-text-2">
          Le 99-coin (T99CP) est la monnaie du mouvement. 1 99-coin = 1 € = 1 minute.
        </p>
      </header>

      <Alert variant="info" titre="Wallet pas encore certifié">
        L’API T99CP et la certification de wallet personnel arrivent à un chantier dédié. Pour
        l’instant, cette page affiche un wallet d’exemple. Le tien sera lié à ton compte plus tard,
        sans changement de ton profil ou de tes données.
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card variant="ombre">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Balance</p>
          <p className="mt-1 font-mono text-2xl">
            {balance.balanceLisible} <span className="text-text-3 text-base">99-coin</span>
          </p>
          <Badge variant="default" className="mt-2">
            Données fictives (mock)
          </Badge>
        </Card>
        <Card variant="ombre">
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">Réseau</p>
          <p className="mt-1 font-mono text-sm">Polygon</p>
          <p className="mt-1 break-all font-mono text-xs text-text-3">{adresseExemple}</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" disabled title="Branchement au chantier API T99CP">
          Certifier mon wallet
        </Button>
        <a
          href="https://t99cp.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand underline-offset-4 hover:underline"
        >
          En savoir plus sur T99CP
        </a>
      </div>
    </article>
  );
}
