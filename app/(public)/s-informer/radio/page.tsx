import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { PlayerAzuraCast } from '@/components/radio/PlayerAzuraCast';
import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenant Radio',
  description: 'Radio en direct de Maintenant!. Flux AzuraCast auto-hébergé.',
};

const FALLBACKS = {
  intro:
    'Radio en direct. Infrastructure AzuraCast auto-hébergée par Maintenant! (pas de captation par les plateformes). Cf. doctrine §4B.',
  alertTitre: 'Radio pas encore branchée',
  pourquoiTitre: 'Pourquoi AzuraCast auto-hébergé',
  pourquoiCorps:
    "Pas Spotify, pas Apple Music. La radio est hébergée par le mouvement, sans intermédiaire qui capte les données d'audience. Le code est libre, le serveur peut être migré n'importe quand.",
};

/**
 * Page `/s-informer/radio` — Maintenant Radio (chantier 7.2).
 *
 * Cf. spec §4B : « Onglet live unique. Infrastructure : AzuraCast
 * auto-hébergé. Player intégré + métadonnées de l'émission en cours. »
 *
 * Les URLs du flux + métadonnées sont des variables d'env. Tant que
 * l'instance AzuraCast n'est pas hébergée, on affiche une bannière
 * explicite et un player désactivé qui pointe sur une URL factice.
 */
export default async function PageRadio() {
  const fluxUrl = process.env.AZURACAST_FLUX_URL ?? '';
  const metadataUrl = process.env.AZURACAST_METADATA_URL ?? '';
  const branche = fluxUrl !== '';

  const [estAdmin, intro, alertTitre, pourquoiTitre, pourquoiCorps] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('s-informer.radio.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('s-informer.radio.alert_titre', { valeurMd: FALLBACKS.alertTitre }),
    lireContenuEditorial('s-informer.radio.pourquoi_titre', {
      valeurMd: FALLBACKS.pourquoiTitre,
    }),
    lireContenuEditorial('s-informer.radio.pourquoi_corps', {
      valeurMd: FALLBACKS.pourquoiCorps,
    }),
  ]);

  return (
    <Container taille="md" className="py-12">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
        <Heading niveau={1}>Maintenant Radio</Heading>
        <TexteEditableAdmin
          cle="s-informer.radio.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro page radio"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      {!branche ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="s-informer.radio.alert_titre"
              valeurInitiale={alertTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre alerte radio pas branchee"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
        >
          L'instance AzuraCast sera mise en ligne au moment du lancement public. Le player
          ci-dessous est posé mais inactif tant que les variables d'env{' '}
          <code className="rounded bg-surface-2 px-1 text-xs">AZURACAST_FLUX_URL</code> et{' '}
          <code className="rounded bg-surface-2 px-1 text-xs">AZURACAST_METADATA_URL</code> ne sont
          pas renseignées.
        </Alert>
      ) : (
        <PlayerAzuraCast fluxUrl={fluxUrl} metadataUrl={metadataUrl === '' ? null : metadataUrl} />
      )}

      <section className="mt-8 grid gap-3 rounded-md border border-border bg-surface-2 p-6 text-sm text-text-2">
        <TexteEditableAdmin
          cle="s-informer.radio.pourquoi_titre"
          valeurInitiale={pourquoiTitre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section pourquoi AzuraCast"
          longueurMax={60}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={4}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="s-informer.radio.pourquoi_corps"
          valeurInitiale={pourquoiCorps.valeurMd}
          estAdmin={estAdmin}
          libelle="corps section pourquoi AzuraCast"
          multilignes
          longueurMax={400}
        >
          {(t) => <p>{t}</p>}
        </TexteEditableAdmin>
      </section>
    </Container>
  );
}
