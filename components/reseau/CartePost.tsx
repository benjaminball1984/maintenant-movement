'use client';

import {
  basculerSoutien,
  chargerCommentaires,
  commenter,
  supprimerPost,
} from '@/app/(public)/s-informer/reseau/actions';
import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { Button, Textarea } from '@/components/ui';
import type { CommentaireAffiche, PostAffiche } from '@/lib/reseau/requetes';
import { nomAffiche } from '@/lib/reseau/requetes';
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

  const soutenir = async () => {
    if (!connecte) {
      router.push('/connexion?prochaine=/s-informer/reseau');
      return;
    }
    const avant = soutenu;
    setSoutenu(!avant);
    setNbSoutiens((n) => n + (avant ? -1 : 1));
    const resultat = await basculerSoutien({ cible_id: post.id });
    if (!resultat.ok) {
      setSoutenu(avant);
      setNbSoutiens((n) => n + (avant ? 1 : -1));
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
      router.refresh();
    }
  };

  const supprimer = async () => {
    if (!confirm('Supprimer cette publication ?')) return;
    const resultat = await supprimerPost({ cible_id: post.id });
    if (resultat.ok) router.refresh();
  };

  return (
    <article className="grid gap-3 rounded-lg border border-border bg-surface p-4">
      <header className="flex items-center gap-3">
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
      </header>

      <p className="whitespace-pre-wrap break-words text-text-1">{post.texte}</p>
      {post.imageUrl !== null ? (
        <img src={post.imageUrl} alt="" className="max-h-96 w-full rounded-md object-cover" />
      ) : null}

      <footer className="flex items-center gap-4 border-t border-border pt-2 text-sm">
        <button
          type="button"
          onClick={soutenir}
          className={`inline-flex items-center gap-1.5 ${soutenu ? 'text-brand' : 'text-text-3 hover:text-text-1'}`}
          aria-pressed={soutenu}
        >
          <Heart size={18} strokeWidth={1.5} fill={soutenu ? 'currentColor' : 'none'} />
          {nbSoutiens} soutien{nbSoutiens > 1 ? 's' : ''}
        </button>
        <button
          type="button"
          onClick={basculerCommentaires}
          className="inline-flex items-center gap-1.5 text-text-3 hover:text-text-1"
        >
          <MessageCircle size={18} strokeWidth={1.5} />
          {post.nbCommentaires} commentaire{post.nbCommentaires > 1 ? 's' : ''}
        </button>
        {estMien ? (
          <button
            type="button"
            onClick={supprimer}
            className="ml-auto text-text-3 hover:text-danger"
          >
            Supprimer
          </button>
        ) : null}
      </footer>

      {ouvertCommentaires ? (
        <div className="grid gap-3 border-t border-border pt-3">
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
    </article>
  );
}
