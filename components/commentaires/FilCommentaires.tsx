import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { type ObjetCommentable, listerCommentairesObjet } from '@/lib/commentaires';
import { formaterDateHeure } from '@/lib/format-date';
import Link from 'next/link';
import { FormulaireCommentaire } from './FormulaireCommentaire';

interface FilCommentairesProps {
  objetType: ObjetCommentable;
  objetId: string;
  /** Chemin de la page hôte, pour la revalidation après publication. */
  cheminRevalidation: string;
  /** Titre de la section (défaut « Discussion »). */
  titre?: string;
}

/**
 * Fil de commentaires sous un contenu (Chantier A, V2.6). Server Component.
 *
 * Chaque commentaire affiche son auteurice avec un pseudo CLIQUABLE vers son
 * profil réseau (`/s-informer/reseau/[numero]`), où l'on peut le/la suivre :
 * la « double connexion » comme hameçon vers le réseau social. La saisie est
 * réservée aux connecté·es (cf. `FormulaireCommentaire`).
 */
export async function FilCommentaires({
  objetType,
  objetId,
  cheminRevalidation,
  titre = 'Discussion',
}: FilCommentairesProps) {
  const [commentaires, session] = await Promise.all([
    listerCommentairesObjet(objetType, objetId),
    getSession(),
  ]);

  return (
    <section className="grid gap-4 border-t border-border pt-6">
      <Heading niveau={2} apparenceComme={3}>
        {titre}
        {commentaires.length > 0 ? (
          <span className="ml-2 font-normal text-base text-text-3">({commentaires.length})</span>
        ) : null}
      </Heading>

      {commentaires.length > 0 ? (
        <ul className="grid gap-4">
          {commentaires.map((c) => {
            const nom =
              [c.auteur.prenom, c.auteur.nom].filter((s) => s !== null && s !== '').join(' ') ||
              'Membre Maintenant!';
            return (
              <li key={c.id} className="flex gap-3">
                <AvatarReseau nom={nom} photoUrl={c.auteur.photoUrl} taillePx={40} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    {c.auteur.numero !== null ? (
                      <Link
                        href={`/s-informer/reseau/${c.auteur.numero}`}
                        className="font-bold text-text-1 hover:text-brand"
                      >
                        {nom}
                      </Link>
                    ) : (
                      <span className="font-bold text-text-1">{nom}</span>
                    )}
                    <time dateTime={c.createdAt} className="text-text-3 text-xs">
                      {formaterDateHeure(c.createdAt)}
                    </time>
                  </p>
                  <p className="whitespace-pre-line text-text-2 leading-relaxed">{c.texte}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-text-3 italic">
          Aucun commentaire pour l'instant. Lance la discussion !
        </p>
      )}

      <FormulaireCommentaire
        objetType={objetType}
        objetId={objetId}
        connecte={session !== null}
        cheminRevalidation={cheminRevalidation}
      />
    </section>
  );
}
