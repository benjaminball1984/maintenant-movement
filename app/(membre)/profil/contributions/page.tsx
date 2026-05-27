import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
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

const FALLBACKS = {
  titre: 'Mes contributions',
  intro:
    'Pétitions signées, mobilisations rejointes, articles écrits, cagnottes contribuées, votes Décider, services SEL : tout ce que tu fais sur le mouvement apparaît ici.',
  sectionFinancieres: 'Mes contributions financières',
  alertVideTitre: 'Aucun don ou adhésion enregistré',
  alertVideCorps:
    'Quand tu feras un don sur une cagnotte ou que tu adhéreras, l’opération apparaîtra ici avec son montant et son canal.',
  cardTotalEuro: 'Total contribué en €',
  cardTotalCoin: 'Total contribué en 99-coin',
  contributionLabel: 'contribution',
  sectionPetitions: 'Pétitions signées',
  alertPetitionsVideTitre: 'Aucune pétition signée pour l’instant',
  alertPetitionsVideCorps:
    'Quand tu signeras une pétition en étant connecté·e, elle apparaîtra ici, avec le réglage pour autoriser ou non la créatrice à te recontacter.',
  alertBientotTitre: 'Bientôt ici aussi',
  alertBientotCorps:
    'Tes mobilisations, votes Décider et services SEL viendront s’ajouter à cette page au fur et à mesure que tu y participes.',
  ligneStatutEnAttente: 'En attente',
  ligneDateLe: 'Le',
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
  const [
    signatures,
    contributionsFinancieres,
    estAdmin,
    titre,
    intro,
    sectionFinancieres,
    alertVideTitre,
    alertVideCorps,
    cardTotalEuro,
    cardTotalCoin,
    contributionLabel,
    sectionPetitions,
    alertPetitionsVideTitre,
    alertPetitionsVideCorps,
    alertBientotTitre,
    alertBientotCorps,
    ligneStatutEnAttente,
    ligneDateLe,
  ] = await Promise.all([
    listerMesSignatures(),
    listerMesContributions(personne.id),
    estAdminCourant(),
    lireContenuEditorial('profil.contributions.titre', { valeurMd: FALLBACKS.titre }),
    lireContenuEditorial('profil.contributions.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('profil.contributions.section_financieres', {
      valeurMd: FALLBACKS.sectionFinancieres,
    }),
    lireContenuEditorial('profil.contributions.alert_vide_titre', {
      valeurMd: FALLBACKS.alertVideTitre,
    }),
    lireContenuEditorial('profil.contributions.alert_vide_corps', {
      valeurMd: FALLBACKS.alertVideCorps,
    }),
    lireContenuEditorial('profil.contributions.card_total_euro', {
      valeurMd: FALLBACKS.cardTotalEuro,
    }),
    lireContenuEditorial('profil.contributions.card_total_coin', {
      valeurMd: FALLBACKS.cardTotalCoin,
    }),
    lireContenuEditorial('profil.contributions.contribution_label', {
      valeurMd: FALLBACKS.contributionLabel,
    }),
    lireContenuEditorial('profil.contributions.section_petitions', {
      valeurMd: FALLBACKS.sectionPetitions,
    }),
    lireContenuEditorial('profil.contributions.alert_petitions_vide_titre', {
      valeurMd: FALLBACKS.alertPetitionsVideTitre,
    }),
    lireContenuEditorial('profil.contributions.alert_petitions_vide_corps', {
      valeurMd: FALLBACKS.alertPetitionsVideCorps,
    }),
    lireContenuEditorial('profil.contributions.alert_bientot_titre', {
      valeurMd: FALLBACKS.alertBientotTitre,
    }),
    lireContenuEditorial('profil.contributions.alert_bientot_corps', {
      valeurMd: FALLBACKS.alertBientotCorps,
    }),
    lireContenuEditorial('profil.contributions.ligne_statut_en_attente', {
      valeurMd: FALLBACKS.ligneStatutEnAttente,
    }),
    lireContenuEditorial('profil.contributions.ligne_date_le', {
      valeurMd: FALLBACKS.ligneDateLe,
    }),
  ]);
  const recap = calculerRecap(contributionsFinancieres);

  return (
    <article className="grid gap-6">
      <header>
        <TexteEditableAdmin
          cle="profil.contributions.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre page contributions"
          longueurMax={40}
        >
          {(t) => <Heading niveau={1}>{t}</Heading>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="profil.contributions.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro page contributions"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <section className="grid gap-3">
        <Heading niveau={2} apparenceComme={3}>
          <HandCoins size={20} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="profil.contributions.section_financieres"
            valeurInitiale={sectionFinancieres.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section contributions financieres"
            longueurMax={60}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Heading>

        {contributionsFinancieres.length === 0 ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="profil.contributions.alert_vide_titre"
                valeurInitiale={alertVideTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte vide contributions"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="profil.contributions.alert_vide_corps"
              valeurInitiale={alertVideCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps alerte vide contributions"
              multilignes
              longueurMax={300}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {recap.parCanal.euro.nb > 0 ? (
                <Card variant="ombre">
                  <TexteEditableAdmin
                    cle="profil.contributions.card_total_euro"
                    valeurInitiale={cardTotalEuro.valeurMd}
                    estAdmin={estAdmin}
                    libelle="label total euros"
                    longueurMax={40}
                  >
                    {(t) => (
                      <p className="font-bold text-text-3 text-xs uppercase tracking-cap">{t}</p>
                    )}
                  </TexteEditableAdmin>
                  <p className="mt-1 font-display font-bold text-2xl text-text-1">
                    {FORMATEUR_EURO.format(recap.parCanal.euro.somme)}
                  </p>
                  <p className="text-text-3 text-xs">
                    {recap.parCanal.euro.nb} {contributionLabel.valeurMd}
                    {recap.parCanal.euro.nb > 1 ? 's' : ''}
                  </p>
                </Card>
              ) : null}
              {recap.parCanal.coin99.nb > 0 ? (
                <Card variant="ombre">
                  <TexteEditableAdmin
                    cle="profil.contributions.card_total_coin"
                    valeurInitiale={cardTotalCoin.valeurMd}
                    estAdmin={estAdmin}
                    libelle="label total 99-coin"
                    longueurMax={40}
                  >
                    {(t) => (
                      <p className="font-bold text-text-3 text-xs uppercase tracking-cap">{t}</p>
                    )}
                  </TexteEditableAdmin>
                  <p className="mt-1 font-display font-bold text-2xl text-text-1">
                    {recap.parCanal.coin99.somme.toLocaleString('fr-FR')} 99c
                  </p>
                  <p className="text-text-3 text-xs">
                    {recap.parCanal.coin99.nb} {contributionLabel.valeurMd}
                    {recap.parCanal.coin99.nb > 1 ? 's' : ''}
                  </p>
                </Card>
              ) : null}
            </div>

            <ul className="mt-2 flex flex-col gap-2">
              {contributionsFinancieres.map((c) => (
                <li key={c.id}>
                  <LigneContribution
                    contribution={c}
                    statutEnAttente={ligneStatutEnAttente.valeurMd}
                    dateLe={ligneDateLe.valeurMd}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="grid gap-3">
        <TexteEditableAdmin
          cle="profil.contributions.section_petitions"
          valeurInitiale={sectionPetitions.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section petitions signees"
          longueurMax={40}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={3}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>

        {signatures.length === 0 ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="profil.contributions.alert_petitions_vide_titre"
                valeurInitiale={alertPetitionsVideTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte petitions vide"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="profil.contributions.alert_petitions_vide_corps"
              valeurInitiale={alertPetitionsVideCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps alerte petitions vide"
              multilignes
              longueurMax={300}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : (
          <ListeMesSignatures signatures={signatures} />
        )}
      </section>

      <Alert
        variant="info"
        titre={
          <TexteEditableAdmin
            cle="profil.contributions.alert_bientot_titre"
            valeurInitiale={alertBientotTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre alerte bientot ici aussi"
            longueurMax={60}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        }
      >
        <TexteEditableAdmin
          cle="profil.contributions.alert_bientot_corps"
          valeurInitiale={alertBientotCorps.valeurMd}
          estAdmin={estAdmin}
          libelle="corps alerte bientot"
          multilignes
          longueurMax={300}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
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

function LigneContribution({
  contribution,
  statutEnAttente,
  dateLe,
}: {
  contribution: ContributionFinanciere;
  statutEnAttente: string;
  dateLe: string;
}) {
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
          {contribution.statut === 'initiee' ? (
            <Badge variant="warning">{statutEnAttente}</Badge>
          ) : null}
        </div>
        <span className="font-display font-bold text-lg text-text-1">{montant}</span>
      </div>
      {contribution.motif !== null ? (
        <p className="text-sm text-text-2">{contribution.motif}</p>
      ) : null}
      <p className="text-text-3 text-xs">
        {dateLe} {FORMATEUR_DATE.format(new Date(contribution.recueLe))}
      </p>
    </Card>
  );
}
