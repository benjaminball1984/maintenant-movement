import { Alert, Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { listerMesSignatures } from '@/lib/petitions/requetes';
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
  await getPersonneOuRediriger('/profil/contributions');
  const signatures = await listerMesSignatures();

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
        Tes mobilisations, cagnottes, votes Décider et services SEL viendront s’ajouter à cette page
        au fur et à mesure que tu y participes.
      </Alert>
    </article>
  );
}
