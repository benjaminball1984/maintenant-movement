import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { CarteMobilisation } from '@/components/mobilisations/CarteMobilisation';
import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  listerMobilisationsAVenir,
  listerMobilisationsPassees,
} from '@/lib/mobilisations/requetes';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACKS = {
  intro:
    'Rassemblements, assemblées, actions de rue. Géolocalisé. Un clic suffit pour dire « je participe » — anonyme par défaut.',
  ctaCarte: 'Voir sur la carte',
  ctaConnecte: 'Créer une mobilisation',
  ctaDeconnecte: 'Connecte-toi pour créer',
  sectionAVenir: 'À venir',
  sectionPassees: 'Passées récentes',
  emptyAVenirTitre: 'Aucune mobilisation à venir',
  emptyAVenirCorps: 'La prochaine mobilisation à venir apparaîtra ici. Tu peux lancer la tienne.',
  footer:
    "Les mobilisations sont modérées **a posteriori** : elles sont publiées immédiatement et l'équipe Maintenant! peut les retirer en cas de problème (propos haineux, lieu mensonger, etc.).",
};

export const metadata: Metadata = {
  title: 'Mobilisations',
  description:
    'Mobilisations citoyennes (rassemblements, AG, actions) géolocalisées. Agenda à venir, clic je participe anonyme.',
};

/**
 * Page liste des mobilisations (`/mobiliser/mobilisations`, chantier 3.2).
 *
 * - Section principale « À venir » : agenda chronologique des mobilisations
 *   publiées dont `date_debut >= now`.
 * - Section « Passées » : repli historique en bas (max 20 entrées).
 * - CTA création : auth requise, redirection vers `/connexion?prochaine=...`
 *   géré par la page de création elle-même.
 * - Renvoi vers la carte unifiée pour la vue géographique.
 *
 * Modération a posteriori : pas de file d'attente, les mobilisations
 * apparaissent immédiatement après création (cf. spec §5C et §11).
 */
export default async function PageMobilisations() {
  const [
    aVenir,
    passees,
    session,
    estAdmin,
    intro,
    ctaCarte,
    ctaConnecte,
    ctaDeconnecte,
    sectionAVenir,
    sectionPassees,
    emptyAVenirTitre,
    emptyAVenirCorps,
    footer,
  ] = await Promise.all([
    listerMobilisationsAVenir(),
    listerMobilisationsPassees(),
    getSession(),
    estAdminCourant(),
    lireContenuEditorial('mobiliser.mobilisations.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('mobiliser.mobilisations.cta_carte', { valeurMd: FALLBACKS.ctaCarte }),
    lireContenuEditorial('mobiliser.mobilisations.cta_connecte', {
      valeurMd: FALLBACKS.ctaConnecte,
    }),
    lireContenuEditorial('mobiliser.mobilisations.cta_deconnecte', {
      valeurMd: FALLBACKS.ctaDeconnecte,
    }),
    lireContenuEditorial('mobiliser.mobilisations.section_a_venir', {
      valeurMd: FALLBACKS.sectionAVenir,
    }),
    lireContenuEditorial('mobiliser.mobilisations.section_passees', {
      valeurMd: FALLBACKS.sectionPassees,
    }),
    lireContenuEditorial('mobiliser.mobilisations.empty_a_venir_titre', {
      valeurMd: FALLBACKS.emptyAVenirTitre,
    }),
    lireContenuEditorial('mobiliser.mobilisations.empty_a_venir_corps', {
      valeurMd: FALLBACKS.emptyAVenirCorps,
    }),
    lireContenuEditorial('mobiliser.mobilisations.footer', { valeurMd: FALLBACKS.footer }),
  ]);
  const personneConnectee = session !== null;

  return (
    <Container taille="lg" className="py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">
            <Link href="/mobiliser" className="text-text-3 hover:text-brand">
              Mobiliser
            </Link>
          </p>
          <Heading niveau={1} className="mt-1">
            Mobilisations
          </Heading>
          <TexteEditableAdmin
            cle="mobiliser.mobilisations.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro de la liste mobilisations"
            multilignes
            longueurMax={500}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <div className="flex gap-3">
          <TexteEditableAdmin
            cle="mobiliser.mobilisations.cta_carte"
            valeurInitiale={ctaCarte.valeurMd}
            estAdmin={estAdmin}
            libelle="CTA Voir sur la carte"
            longueurMax={40}
          >
            {(t) => (
              <Link
                href="/carte"
                className={cn(
                  'inline-flex h-11 items-center justify-center rounded-md border border-brand bg-transparent px-5',
                  'font-body text-sm font-bold text-brand transition hover:bg-brand-light',
                )}
              >
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
          <TexteEditableAdmin
            cle={
              personneConnectee
                ? 'mobiliser.mobilisations.cta_connecte'
                : 'mobiliser.mobilisations.cta_deconnecte'
            }
            valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
            estAdmin={estAdmin}
            libelle={`CTA principal liste mobilisations (${personneConnectee ? 'connecte' : 'deconnecte'})`}
            longueurMax={60}
          >
            {(t) => (
              <Link
                href="/mobiliser/mobilisations/nouvelle"
                className={cn(
                  'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
                  'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
                )}
              >
                {t}
              </Link>
            )}
          </TexteEditableAdmin>
        </div>
      </header>

      <section aria-labelledby="titre-a-venir" className="mb-12">
        <TexteEditableAdmin
          cle="mobiliser.mobilisations.section_a_venir"
          valeurInitiale={sectionAVenir.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section A venir"
          longueurMax={40}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={3} className="mb-4" id="titre-a-venir">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        {aVenir.length === 0 ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="mobiliser.mobilisations.empty_a_venir_titre"
                valeurInitiale={emptyAVenirTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre empty state A venir"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle="mobiliser.mobilisations.empty_a_venir_corps"
              valeurInitiale={emptyAVenirCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps empty state A venir"
              multilignes
              longueurMax={200}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aVenir.map((mobilisation, index) => (
              <li key={mobilisation.id}>
                <CarteMobilisation mobilisation={mobilisation} enAvant={index === 0} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {passees.length > 0 ? (
        <section aria-labelledby="titre-passees">
          <TexteEditableAdmin
            cle="mobiliser.mobilisations.section_passees"
            valeurInitiale={sectionPassees.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section Passees recentes"
            longueurMax={40}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={4} className="mb-4" id="titre-passees">
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {passees.map((mobilisation) => (
              <li key={mobilisation.id}>
                <CarteMobilisation mobilisation={mobilisation} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <TexteEditableAdmin
          cle="mobiliser.mobilisations.footer"
          valeurInitiale={footer.valeurMd}
          estAdmin={estAdmin}
          libelle="note bas de page liste mobilisations (Markdown leger)"
          multilignes
          longueurMax={400}
        >
          {(t) => <MarkdownLeger texte={t} />}
        </TexteEditableAdmin>
      </footer>
    </Container>
  );
}
