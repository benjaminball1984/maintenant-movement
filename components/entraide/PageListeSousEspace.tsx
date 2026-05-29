import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { CarteOffre } from '@/components/entraide/CarteOffre';
import { Alert, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { SOUS_ESPACES } from '@/lib/entraide/config';
import { listerOffresPubliees } from '@/lib/entraide/requetes';
import { cn } from '@/lib/utils';
import type { TypeOffreEntraide } from '@/types/database';
import Link from 'next/link';

interface PageListeSousEspaceProps {
  type: TypeOffreEntraide;
}

const FALLBACKS = {
  ctaConnecte: 'Publier une offre',
  ctaDeconnecte: 'Connecte-toi pour publier',
  emptyProposeTitre: 'Aucune offre publiée pour le moment',
  emptyProposeCorps: 'Tu peux en publier une.',
  emptyChercheTitre: 'Aucune demande publiée',
  emptyChercheCorps: 'Tu peux en publier une si tu as besoin de cette entraide.',
  footerAmorce: 'Modération',
  footerStrong: 'a posteriori',
  footerSuite: '. Contact via la messagerie interne du',
  footerLien: 'réseau social',
  footerFin: '.',
};

/**
 * Vue liste partagée pour les 4 sous-espaces S'entraider (chantier 4.1).
 *
 * Évite d'écrire 4 pages quasi-identiques : chaque page de sous-espace
 * appelle simplement `<PageListeSousEspace type="hebergement" />`.
 *
 * Filtre par défaut sur `sens = 'propose'` (les offres), pivot vers les
 * demandes via deux sections distinctes : Offres / Demandes.
 */
export async function PageListeSousEspace({ type }: PageListeSousEspaceProps) {
  const config = SOUS_ESPACES[type];
  const prefix = `s-entraider.${config.slug}`;

  const [
    offres,
    session,
    estAdmin,
    intro,
    verbeOffre,
    verbeDemande,
    ctaConnecte,
    ctaDeconnecte,
    emptyProposeTitre,
    emptyProposeCorps,
    emptyChercheTitre,
    emptyChercheCorps,
    footerAmorce,
    footerStrong,
    footerSuite,
    footerLien,
    footerFin,
  ] = await Promise.all([
    listerOffresPubliees(type),
    getSession(),
    estAdminCourant(),
    // L'intro est partagee avec la page hub (V2.4.107 : `s-entraider.carte.{slug}.description`).
    // On reutilise donc la meme cle : modifier l'intro sur la sous-page met aussi a jour la
    // description dans la hub. C'est intentionnel, ca evite la divergence.
    lireContenuEditorial(`s-entraider.carte.${config.slug}.description`, {
      valeurMd: config.description,
    }),
    lireContenuEditorial(`${prefix}.verbe_offre`, { valeurMd: config.verbeOffre }),
    lireContenuEditorial(`${prefix}.verbe_demande`, { valeurMd: config.verbeDemande }),
    lireContenuEditorial(`${prefix}.cta_connecte`, { valeurMd: FALLBACKS.ctaConnecte }),
    lireContenuEditorial(`${prefix}.cta_deconnecte`, { valeurMd: FALLBACKS.ctaDeconnecte }),
    lireContenuEditorial(`${prefix}.empty_propose_titre`, {
      valeurMd: FALLBACKS.emptyProposeTitre,
    }),
    lireContenuEditorial(`${prefix}.empty_propose_corps`, {
      valeurMd: FALLBACKS.emptyProposeCorps,
    }),
    lireContenuEditorial(`${prefix}.empty_cherche_titre`, {
      valeurMd: FALLBACKS.emptyChercheTitre,
    }),
    lireContenuEditorial(`${prefix}.empty_cherche_corps`, {
      valeurMd: FALLBACKS.emptyChercheCorps,
    }),
    lireContenuEditorial(`${prefix}.footer.amorce`, { valeurMd: FALLBACKS.footerAmorce }),
    lireContenuEditorial(`${prefix}.footer.strong`, { valeurMd: FALLBACKS.footerStrong }),
    lireContenuEditorial(`${prefix}.footer.suite`, { valeurMd: FALLBACKS.footerSuite }),
    lireContenuEditorial(`${prefix}.footer.lien`, { valeurMd: FALLBACKS.footerLien }),
    lireContenuEditorial(`${prefix}.footer.fin`, { valeurMd: FALLBACKS.footerFin }),
  ]);
  const personneConnectee = session !== null;

  const offresProposees = offres.filter((o) => o.sens === 'propose');
  const offresCherchees = offres.filter((o) => o.sens === 'cherche');

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading niveau={1}>{config.titre}</Heading>
          <TexteEditableAdmin
            cle={`s-entraider.carte.${config.slug}.description`}
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle={`intro du sous-espace ${config.titre} (cle partagee avec la hub)`}
            multilignes
            longueurMax={400}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </div>
        <TexteEditableAdmin
          cle={personneConnectee ? `${prefix}.cta_connecte` : `${prefix}.cta_deconnecte`}
          valeurInitiale={personneConnectee ? ctaConnecte.valeurMd : ctaDeconnecte.valeurMd}
          estAdmin={estAdmin}
          libelle={`CTA principal ${config.titre} (${personneConnectee ? 'connecte' : 'deconnecte'})`}
          longueurMax={60}
        >
          {(t) => (
            <Link
              href={`/s-entraider/${config.slug}/nouvelle`}
              className={cn(
                'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
                'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
              )}
            >
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </header>

      <section aria-labelledby="titre-propose" className="mb-12">
        <TexteEditableAdmin
          cle={`${prefix}.verbe_offre`}
          valeurInitiale={verbeOffre.valeurMd}
          estAdmin={estAdmin}
          libelle="verbe d'offre (« J'heberge », « Je prete »...)"
          longueurMax={50}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={3} className="mb-4" id="titre-propose">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        {offresProposees.length === 0 ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle={`${prefix}.empty_propose_titre`}
                valeurInitiale={emptyProposeTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre empty state section propose"
                longueurMax={80}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle={`${prefix}.empty_propose_corps`}
              valeurInitiale={emptyProposeCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps empty state section propose"
              longueurMax={200}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {offresProposees.map((offre, index) => (
              <li key={offre.id}>
                <CarteOffre offre={offre} enAvant={index === 0} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titre-cherche">
        <TexteEditableAdmin
          cle={`${prefix}.verbe_demande`}
          valeurInitiale={verbeDemande.valeurMd}
          estAdmin={estAdmin}
          libelle="verbe de demande (« Je cherche... »)"
          longueurMax={50}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={3} className="mb-4" id="titre-cherche">
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        {offresCherchees.length === 0 ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle={`${prefix}.empty_cherche_titre`}
                valeurInitiale={emptyChercheTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre empty state section cherche"
                longueurMax={80}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
          >
            <TexteEditableAdmin
              cle={`${prefix}.empty_cherche_corps`}
              valeurInitiale={emptyChercheCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps empty state section cherche"
              longueurMax={200}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {offresCherchees.map((offre) => (
              <li key={offre.id}>
                <CarteOffre offre={offre} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-12 border-t border-border pt-6 text-sm text-text-3">
        <p>
          <TexteEditableAdmin
            cle={`${prefix}.footer.amorce`}
            valeurInitiale={footerAmorce.valeurMd}
            estAdmin={estAdmin}
            libelle="amorce footer (avant le terme en gras)"
            longueurMax={50}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          <strong>
            <TexteEditableAdmin
              cle={`${prefix}.footer.strong`}
              valeurInitiale={footerStrong.valeurMd}
              estAdmin={estAdmin}
              libelle="terme en gras (a posteriori)"
              longueurMax={30}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </strong>
          <TexteEditableAdmin
            cle={`${prefix}.footer.suite`}
            valeurInitiale={footerSuite.valeurMd}
            estAdmin={estAdmin}
            libelle="suite footer (apres le gras, avant le lien)"
            longueurMax={150}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          <TexteEditableAdmin
            cle={`${prefix}.footer.lien`}
            valeurInitiale={footerLien.valeurMd}
            estAdmin={estAdmin}
            libelle="libelle du lien dans le footer"
            longueurMax={40}
          >
            {(t) => (
              <a href="/s-informer/reseau/messages" className="underline">
                {t}
              </a>
            )}
          </TexteEditableAdmin>
          <TexteEditableAdmin
            cle={`${prefix}.footer.fin`}
            valeurInitiale={footerFin.valeurMd}
            estAdmin={estAdmin}
            libelle="fin footer (point final)"
            longueurMax={20}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </p>
      </footer>
    </>
  );
}
