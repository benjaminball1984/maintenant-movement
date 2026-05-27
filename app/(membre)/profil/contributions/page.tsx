import { Alert, Badge, Card, Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import {
  type ContributionFinanciere,
  calculerRecap,
  listerMesContributions,
} from '@/lib/mes-contributions';
import { listerMesSignatures } from '@/lib/petitions/requetes';
import { Coins, HandCoins } from 'lucide-react';
import type { Metadata } from 'next';
import { ListeMesSignatures } from './ListeMesSignatures';

export const metadata: Metadata = {
  title: 'Mes contributions',
};

/**
 * Espace « Mes contributions » (chantiers 1.3 puis 13.3-D).
 *
 * Affiche les pétitions signées par la personne connectée, avec pour chacune
 * le réglage de recontact modifiable (RGPD : consentement granulaire).
 *
 * Limite connue : ne remontent que les signatures faites EN ÉTANT CONNECTÉ·E
 * (`personne_id`). Les signatures importées (faites avant d'avoir un compte,
 * rattachables par email) n'apparaissent pas encore : le rattachement par
 * email est une décision d'architecture/RGPD en attente (cf. manifest).
 *
 * Les autres types de contributions (mobilisations, cagnottes, votes, SEL)
 * viendront enrichir cette page à mesure que les flux correspondants sont
 * utilisés.
 */
export default async function PageContributions() {
  const { personne } = await getPersonneOuRediriger('/profil/contributions');
  const [signatures, contributionsFinancieres] = await Promise.all([
    listerMesSignatures(),
    listerMesContributions(personne.id),
  ]);
  const recap = calculerRecap(contributionsFinancieres);

  return (
    <article className="grid gap-6">
      <header>
        <Heading niveau={1}>Mes contributions</Heading>
        <p className="mt-2 text-text-2">
          Pétitions signées, mobilisations rejointes, articles écrits, cagnottes contribuées, votes
          Décider, services SEL : tout ce que tu fais sur le mouvement apparaît ici.
        </p>
      </header>

      <section className="grid gap-3">
        <Heading niveau={2} apparenceComme={3}>
          <HandCoins size={20} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Mes contributions financières
        </Heading>

        {contributionsFinancieres.length === 0 ? (
          <Alert variant="info" titre="Aucun don ou adhésion enregistré">
            Quand tu feras un don sur une cagnotte ou que tu adhéreras, l’opération apparaîtra ici
            avec son montant et son canal.
          </Alert>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {recap.parCanal.euro.nb > 0 ? (
                <Card variant="ombre">
                  <p className="font-bold text-text-3 text-xs uppercase tracking-cap">
                    Total contribué en €
                  </p>
                  <p className="mt-1 font-display font-bold text-2xl text-text-1">
                    {FORMATEUR_EURO.format(recap.parCanal.euro.somme)}
                  </p>
                  <p className="text-text-3 text-xs">
                    {recap.parCanal.euro.nb} contribution{recap.parCanal.euro.nb > 1 ? 's' : ''}
                  </p>
                </Card>
              ) : null}
              {recap.parCanal.coin99.nb > 0 ? (
                <Card variant="ombre">
                  <p className="font-bold text-text-3 text-xs uppercase tracking-cap">
                    Total contribué en 99-coin
                  </p>
                  <p className="mt-1 font-display font-bold text-2xl text-text-1">
                    {recap.parCanal.coin99.somme.toLocaleString('fr-FR')} 99c
                  </p>
                  <p className="text-text-3 text-xs">
                    {recap.parCanal.coin99.nb} contribution
                    {recap.parCanal.coin99.nb > 1 ? 's' : ''}
                  </p>
                </Card>
              ) : null}
            </div>

            <ul className="mt-2 flex flex-col gap-2">
              {contributionsFinancieres.map((c) => (
                <li key={c.id}>
                  <LigneContribution contribution={c} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="grid gap-3">
        <Heading niveau={2} apparenceComme={3}>
          Pétitions signées
        </Heading>

        {signatures.length === 0 ? (
          <Alert variant="info" titre="Aucune pétition signée pour l’instant">
            Quand tu signeras une pétition en étant connecté·e, elle apparaîtra ici, avec le réglage
            pour autoriser ou non la créatrice à te recontacter.
          </Alert>
        ) : (
          <ListeMesSignatures signatures={signatures} />
        )}
      </section>

      <Alert variant="info" titre="Bientôt ici aussi">
        Tes mobilisations, votes Décider et services SEL viendront s’ajouter à cette page au fur et
        à mesure que tu y participes.
      </Alert>
    </article>
  );
}

const FORMATEUR_EURO = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const LIBELLE_SOURCE = {
  don: 'Don',
  adhesion: 'Adhésion',
  cagnotte: 'Cagnotte',
  cotisation_solidaire: 'Cotisation solidaire',
  autre: 'Autre',
  regularisation_manuelle: 'Régularisation',
} as const;

function LigneContribution({ contribution }: { contribution: ContributionFinanciere }) {
  const montant =
    contribution.canal === 'euro'
      ? FORMATEUR_EURO.format(contribution.montant)
      : `${contribution.montant.toLocaleString('fr-FR')} 99c`;
  return (
    <Card variant="ombre" className="grid gap-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">{LIBELLE_SOURCE[contribution.sourceType]}</Badge>
          <Badge variant="info">
            <Coins size={12} aria-hidden="true" />
            {contribution.canal === 'euro' ? '€' : '99c'}
          </Badge>
          {contribution.statut === 'initiee' ? <Badge variant="warning">En attente</Badge> : null}
        </div>
        <span className="font-display font-bold text-lg text-text-1">{montant}</span>
      </div>
      {contribution.motif !== null ? (
        <p className="text-sm text-text-2">{contribution.motif}</p>
      ) : null}
      <p className="text-text-3 text-xs">
        Le {FORMATEUR_DATE.format(new Date(contribution.recueLe))}
      </p>
    </Card>
  );
}
