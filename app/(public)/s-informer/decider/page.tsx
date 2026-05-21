import { Alert, Card, Container, Heading } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Décider',
  description:
    "Infrastructure de la décision en réunion. Salles dédiées, 3 modes (consensus, levée d'objections, jugement majoritaire). LiveKit self-hosted.",
};

/**
 * Page `/s-informer/decider` — Décider (chantier 7.6).
 *
 * Cf. spec §4F. Chantier complet : salles permanentes/temporaires +
 * 3 modes de décision (consensus, levée d'objections, jugement
 * majoritaire Balinski-Laraki) + bot Décider tokens + privacy par
 * périmètre + enregistrement selon type + LiveKit self-hosted.
 *
 * Le chantier 7.6 est très volumineux (LiveKit serveur, tables
 * `salle_decider`, `reunion`, `vote`, `bulletin`, algorithme du
 * jugement majoritaire avec mention médiane, etc.). On laisse en
 * stub explicite — sera livré dans une session dédiée.
 */
export default function PageDecider() {
  return (
    <Container taille="md" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
        <Heading niveau={1}>Décider</Heading>
        <p className="mt-3 max-w-2xl text-text-2">
          Infrastructure technique de la décision en réunion. Couvre toutes les assemblées :
          communes, groupes de travail, fédérations, confédérations, Assemblée Confédérale. Cf.
          doctrine §4F.
        </p>
      </header>

      <Alert variant="info" titre="Chantier en construction (7.6)">
        Décider est un chantier majeur qui demande une infrastructure dédiée. Sera livré dans une
        session dédiée au chantier 7.6.
      </Alert>

      <section className="mt-8 grid gap-4">
        <Card variant="ombre">
          <Heading niveau={2} apparenceComme={4}>
            3 modes de décision hiérarchisés
          </Heading>
          <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm text-text-2">
            <li>
              <strong>Consensus</strong> : accord plein de toutes les personnes présentes.
            </li>
            <li>
              <strong>Levée d'objections</strong> : décision validée si aucune objection bloquante
              n'est levée. (On ne dit pas « consentement ».)
            </li>
            <li>
              <strong>Vote au jugement majoritaire</strong> : méthode Balinski-Laraki, max 10
              propositions, mentions Excellent / Très bien / Bien / Assez bien / Passable /
              Insuffisant / À rejeter. La mention médiane désigne la gagnante.
            </li>
          </ol>
        </Card>

        <Card variant="ombre">
          <Heading niveau={2} apparenceComme={4}>
            Stack technique
          </Heading>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-text-2">
            <li>Visio + chat : LiveKit self-hosted (moderne, scalable, ouvert).</li>
            <li>
              Couche métier maison : interface salles, chat Décider (bot), votes, tokens, archivage
              chiffré, permissions.
            </li>
            <li>Pas Zoom, pas Meet, pas Teams.</li>
          </ul>
        </Card>

        <Card variant="ombre">
          <Heading niveau={2} apparenceComme={4}>
            Privacy par périmètre
          </Heading>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-text-2">
            <li>Groupe de travail local : membres du groupe + de la commune.</li>
            <li>Plénière commune : membres de la commune uniquement.</li>
            <li>Groupe fédéré thématique : membres du groupe fédéré.</li>
            <li>Assemblée Confédérale : public (enregistrement systématique).</li>
          </ul>
        </Card>
      </section>
    </Container>
  );
}
