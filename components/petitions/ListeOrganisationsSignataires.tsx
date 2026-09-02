import { Card, Heading } from '@/components/ui';
import type { OrganisationSignataire } from '@/lib/petitions/requetes';
import {
  CATEGORIES_ORGANISATION,
  type CategorieOrganisation,
  LIBELLES_CATEGORIE_ORGANISATION,
} from '@/lib/validations/petition';

/**
 * Liste publique des organisations qui ont co-signé une pétition ou un appel
 * (V2.6.134).
 *
 * C'est la contrepartie visible de la signature au nom d'une organisation :
 * une assemblée, un collectif, un syndicat qui signe attend de voir son nom
 * apparaître. Seules figurent ici les organisations ayant coché l'affichage
 * public ; aucune donnée personnelle n'est affichée (la fonction SQL
 * `signataires_organisations` ne les renvoie même pas).
 *
 * Les organisations sont regroupées par famille, dans l'ordre où l'appel les
 * nomme : assemblées, collectifs, syndicats, organisations.
 */
interface ListeOrganisationsSignatairesProps {
  organisations: OrganisationSignataire[];
  /** Titre du bloc. */
  titre?: string;
  /** Texte affiché tant qu'aucune organisation n'a signé. */
  messageVide?: string;
}

const TITRE_DEFAUT = 'Organisations signataires';
const MESSAGE_VIDE_DEFAUT =
  'Aucune organisation n’a encore signé. Assemblées, collectifs, syndicats et organisations peuvent le faire depuis le bouton de signature.';

/** Libellé pluriel de chaque famille, pour les sous-titres de groupes. */
const LIBELLES_PLURIEL: Record<CategorieOrganisation, string> = {
  assemblee: 'Assemblées',
  collectif: 'Collectifs',
  syndicat: 'Syndicats',
  organisation: 'Organisations',
};

export function ListeOrganisationsSignataires({
  organisations,
  titre = TITRE_DEFAUT,
  messageVide = MESSAGE_VIDE_DEFAUT,
}: ListeOrganisationsSignatairesProps) {
  return (
    <section className="grid gap-4">
      <Heading niveau={2} apparenceComme={3}>
        {titre}
        {organisations.length > 0 ? (
          <span className="ml-2 text-base font-normal text-text-3">({organisations.length})</span>
        ) : null}
      </Heading>

      {organisations.length === 0 ? (
        <p className="text-sm text-text-3">{messageVide}</p>
      ) : (
        <div className="grid gap-6">
          {CATEGORIES_ORGANISATION.map((categorie) => {
            const duGroupe = organisations.filter((o) => o.categorie === categorie);
            if (duGroupe.length === 0) return null;
            return (
              <div key={categorie} className="grid gap-2">
                <p className="text-xs font-bold uppercase tracking-cap text-text-3">
                  {LIBELLES_PLURIEL[categorie]}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {duGroupe.map((organisation) => (
                    <li key={`${categorie}-${organisation.nom}`}>
                      <Card
                        variant="ombre"
                        className="px-3 py-2 text-sm"
                        // Une organisation par « pastille » : lisible en liste
                        // longue, et ça reste sobre (pas de logo, pas de lien).
                      >
                        <span className="font-bold text-text-1">{organisation.nom}</span>
                        {organisation.territoire !== null &&
                        organisation.territoire.trim() !== '' ? (
                          <span className="text-text-3"> · {organisation.territoire}</span>
                        ) : null}
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Filet de sécurité : une catégorie inconnue (donnée importée, ou
              valeur ajoutée en base sans passer par l'app) ne doit pas faire
              disparaître silencieusement une organisation de la liste. */}
          {(() => {
            const connues = new Set<string>(CATEGORIES_ORGANISATION);
            const orphelines = organisations.filter((o) => !connues.has(o.categorie));
            if (orphelines.length === 0) return null;
            return (
              <div className="grid gap-2">
                <p className="text-xs font-bold uppercase tracking-cap text-text-3">
                  {LIBELLES_CATEGORIE_ORGANISATION.organisation}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {orphelines.map((organisation) => (
                    <li key={`autre-${organisation.nom}`}>
                      <Card variant="ombre" className="px-3 py-2 text-sm">
                        <span className="font-bold text-text-1">{organisation.nom}</span>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
