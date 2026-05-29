'use client';

import {
  basculerSoutien,
  chargerCommentaires,
  commenter,
  supprimerPost,
} from '@/app/(public)/s-informer/reseau/actions';
import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { Button, Textarea } from '@/components/ui';
import { nomAffiche } from '@/lib/reseau/affichage';
import type { CommentaireAffiche, PostAffiche } from '@/lib/reseau/requetes';
import { Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Format court « 25 mai 2026, 14:30 » en français. */
function formaterDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso));
}

/**
 * Carte d'une publication du réseau social : auteur·ice (lien vers son profil),
 * texte, image, soutien (toggle), commentaires (chargés à la demande), et
 * suppression pour sa propre publication.
 */
export function CartePost({
  post,
  connecte,
  estMien,
}: {
  post: PostAffiche;
  connecte: boolean;
  estMien: boolean;
}) {
  const router = useRouter();
  const nom = nomAffiche(post.auteur.prenom, post.auteur.nom);

  const [soutenu, setSoutenu] = useState(post.jaiSoutenu);
  const [nbSoutiens, setNbSoutiens] = useState(post.nbSoutiens);
  const [ouvertCommentaires, setOuvertCommentaires] = useState(false);
  const [commentaires, setCommentaires] = useState<CommentaireAffiche[] | null>(null);
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [enCours, setEnCours] = useState(false);
  // Confirmation inline en 2 étapes pour la suppression (remplace window.confirm).
  const [confirmerSuppression, setConfirmerSuppression] = useState(false);
  // Message d'état annoncé aux lecteurs d'écran (région live masquée).
  const [messageStatut, setMessageStatut] = useState('');
  // Identifiant de la zone commentaires (pour aria-controls / aria-expanded).
  const idCommentaires = `commentaires-${post.id}`;

  const soutenir = async () => {
    if (!connecte) {
      router.push('/connexion?prochaine=/s-informer/reseau');
      return;
    }
    const avant = soutenu;
    setSoutenu(!avant);
    setNbSoutiens((n) => n + (avant ? -1 : 1));
    const resultat = await basculerSoutien({ cible_id: post.id });
    if (resultat.ok) {
      setMessageStatut(avant ? 'Soutien retiré' : 'Soutien ajouté');
    } else {
      setSoutenu(avant);
      setNbSoutiens((n) => n + (avant ? 1 : -1));
      setMessageStatut('Échec, réessaie');
    }
  };

  const basculerCommentaires = async () => {
    const ouvrir = !ouvertCommentaires;
    setOuvertCommentaires(ouvrir);
    if (ouvrir && commentaires === null) {
      setCommentaires(await chargerCommentaires(post.id));
    }
  };

  const publierCommentaire = async (evenement: React.FormEvent) => {
    evenement.preventDefault();
    setEnCours(true);
    const resultat = await commenter({ post_id: post.id, texte: nouveauCommentaire });
    setEnCours(false);
    if (resultat.ok) {
      setNouveauCommentaire('');
      setCommentaires(await chargerCommentaires(post.id));
      setMessageStatut('Commentaire publié');
      router.refresh();
    }
  };

  const supprimer = async () => {
    const resultat = await supprimerPost({ cible_id: post.id });
    if (resultat.ok) {
      setConfirmerSuppression(false);
      setMessageStatut('Publication supprimée');
      router.refresh();
    }
  };

  // V2.5.10 Phase H — si le post est publié AU NOM d'un espace, on met
  // l'espace en avant (avatar/photo + nom cliquable) et l'auteurice
  // personne devient un sous-titre fin « publié par X ».
  const espace = post.espacePublieur;

  return (
    <article className="grid gap-3 rounded-lg border border-border bg-surface p-5 transition hover:border-brand/40 hover:shadow-sm">
      <header className="flex items-center gap-3">
        {espace !== null ? (
          <>
            <AvatarReseau nom={espace.nom} photoUrl={espace.imageUrl} taillePx={40} />
            <div className="min-w-0">
              <Link href={espace.cheminPublic} className="font-bold text-text-1 hover:text-brand">
                {espace.nom}
              </Link>
              <p className="text-xs text-text-3">
                publié par {nom} · {formaterDate(post.createdAt)}
              </p>
            </div>
          </>
        ) : (
          <>
            <AvatarReseau nom={nom} photoUrl={post.auteur.photoUrl} taillePx={40} />
            <div className="min-w-0">
              {post.auteur.numero !== null ? (
                <Link
                  href={`/s-informer/reseau/${post.auteur.numero}`}
                  className="font-bold text-text-1 hover:text-brand"
                >
                  {nom}
                </Link>
              ) : (
                <p className="font-bold text-text-1">{nom}</p>
              )}
              <p className="text-xs text-text-3">{formaterDate(post.createdAt)}</p>
            </div>
          </>
        )}
      </header>

      <p className="whitespace-pre-wrap break-words text-text-1">{post.texte}</p>
      {post.imageUrl !== null ? (
        <img src={post.imageUrl} alt="" className="max-h-96 w-full rounded-md object-cover" />
      ) : null}

      <footer className="flex items-center gap-5 border-t border-border pt-3 text-sm">
        <button
          type="button"
          onClick={soutenir}
          className={`group inline-flex items-center gap-1.5 transition ${soutenu ? 'text-danger' : 'text-text-3 hover:text-danger'}`}
          aria-pressed={soutenu}
          aria-label={soutenu ? 'Retirer mon soutien' : 'Soutenir cette publication'}
        >
          <Heart
            size={18}
            strokeWidth={1.5}
            fill={soutenu ? 'currentColor' : 'none'}
            className="transition-transform group-active:scale-90"
          />
          <span className="font-medium">{nbSoutiens}</span>
          <span className="hidden sm:inline">soutien{nbSoutiens > 1 ? 's' : ''}</span>
        </button>
        <button
          type="button"
          onClick={basculerCommentaires}
          className="inline-flex items-center gap-1.5 text-text-3 transition hover:text-brand"
          aria-expanded={ouvertCommentaires}
          aria-controls={idCommentaires}
        >
          <MessageCircle size={18} strokeWidth={1.5} />
          <span className="font-medium">{post.nbCommentaires}</span>
          <span className="hidden sm:inline">commentaire{post.nbCommentaires > 1 ? 's' : ''}</span>
        </button>
        {estMien && !confirmerSuppression ? (
          <button
            type="button"
            onClick={() => setConfirmerSuppression(true)}
            className="ml-auto text-text-3 transition hover:text-danger"
            aria-label="Supprimer cette publication"
          >
            Supprimer
          </button>
        ) : null}
      </footer>

      {estMien && confirmerSuppression ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm">
          <span className="text-text-2">Confirmer la suppression ?</span>
          <Button variant="primary" taille="sm" onClick={supprimer}>
            Confirmer
          </Button>
          <Button variant="ghost" taille="sm" onClick={() => setConfirmerSuppression(false)}>
            Annuler
          </Button>
        </div>
      ) : null}

      {ouvertCommentaires ? (
        <div id={idCommentaires} className="grid gap-3 border-t border-border pt-3">
          {commentaires === null ? (
            <p className="text-sm text-text-3">Chargement...</p>
          ) : commentaires.length === 0 ? (
            <p className="text-sm text-text-3">Aucun commentaire pour l’instant.</p>
          ) : (
            commentaires.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <AvatarReseau
                  nom={nomAffiche(c.auteur.prenom, c.auteur.nom)}
                  photoUrl={c.auteur.photoUrl}
                  taillePx={28}
                />
                <div className="min-w-0 rounded-md bg-surface-2 px-3 py-2">
                  <p className="text-sm font-bold text-text-1">
                    {nomAffiche(c.auteur.prenom, c.auteur.nom)}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm text-text-2">{c.texte}</p>
                </div>
              </div>
            ))
          )}

          {connecte ? (
            <form onSubmit={publierCommentaire} className="grid gap-2">
              <Textarea
                rows={2}
                value={nouveauCommentaire}
                onChange={(e) => setNouveauCommentaire(e.target.value)}
                placeholder="Écrire un commentaire..."
                maxLength={2000}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  taille="sm"
                  disabled={enCours || nouveauCommentaire.trim() === ''}
                >
                  {enCours ? 'Envoi...' : 'Commenter'}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-text-3">
              <Link href="/connexion?prochaine=/s-informer/reseau" className="underline">
                Connecte-toi
              </Link>{' '}
              pour commenter.
            </p>
          )}
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {messageStatut}
      </span>
    </article>
  );
}
