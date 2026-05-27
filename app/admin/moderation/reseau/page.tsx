import { retirerCommentaire, retirerPost } from '@/app/(public)/s-informer/reseau/actions';
import { ControleModeration } from '@/components/admin/moderation/ControleModeration';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';

/** Tronque un texte pour l'aperçu de modération. */
function apercu(texte: string, max = 240): string {
  return texte.length > max ? `${texte.slice(0, max)}…` : texte;
}

/**
 * Page `/admin/moderation/reseau` — modération A POSTERIORI du réseau social
 * (chantier 7.5). Liste les publications et commentaires récents ; permet le
 * retrait avec motif (tracé dans le journal d'audit). L'accès est gardé par le
 * layout `/admin` et par la RLS (retrait réservé modération/admin).
 */
export default async function PageModerationReseau() {
  const supabase = await getSupabaseServer();
  const [{ data: posts }, { data: commentaires }, estAdmin, titre, intro] = await Promise.all([
    supabase
      .from('post_reseau')
      .select('id, texte, statut, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('commentaire_reseau')
      .select('id, texte, statut, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.reseau.titre', {
      valeurMd: 'Modération — Réseau social',
    }),
    lireContenuEditorial('admin.moderation.reseau.intro', {
      valeurMd:
        'Modération a posteriori : les contenus sont publiés immédiatement, retirés ici en cas de problème (motif obligatoire, tracé dans le journal d’audit).',
    }),
  ]);

  return (
    <>
      <TexteEditableAdmin
        cle="admin.moderation.reseau.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre console reseau"
        longueurMax={60}
      >
        {(t) => <Heading niveau={1}>{t}</Heading>}
      </TexteEditableAdmin>
      <TexteEditableAdmin
        cle="admin.moderation.reseau.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console reseau"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      <section className="mt-6">
        <h2 className="mb-2 font-bold">Publications ({(posts ?? []).length})</h2>
        {(posts ?? []).length === 0 ? (
          <Alert variant="info" titre="Aucune publication">
            Rien à modérer pour l’instant.
          </Alert>
        ) : (
          <ul className="grid gap-2">
            {(posts ?? []).map((p) => (
              <li key={p.id}>
                <Card variant="ombre" className="grid gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap break-words text-sm text-text-1">
                      {apercu(p.texte)}
                    </p>
                    <Badge variant={p.statut === 'retire' ? 'danger' : 'default'}>{p.statut}</Badge>
                  </div>
                  {p.statut === 'publie' ? (
                    <ControleModeration
                      actions={[
                        {
                          libelle: 'Retirer',
                          action: retirerPost,
                          champId: 'cible_id',
                          id: p.id,
                          champRaison: 'raison',
                          placeholderRaison: 'Motif du retrait, au moins 10 caractères.',
                          messageSucces: 'Publication retirée.',
                        },
                      ]}
                    />
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-bold">Commentaires ({(commentaires ?? []).length})</h2>
        {(commentaires ?? []).length === 0 ? (
          <Alert variant="info" titre="Aucun commentaire">
            Rien à modérer pour l’instant.
          </Alert>
        ) : (
          <ul className="grid gap-2">
            {(commentaires ?? []).map((c) => (
              <li key={c.id}>
                <Card variant="ombre" className="grid gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap break-words text-sm text-text-1">
                      {apercu(c.texte)}
                    </p>
                    <Badge variant={c.statut === 'retire' ? 'danger' : 'default'}>{c.statut}</Badge>
                  </div>
                  {c.statut === 'publie' ? (
                    <ControleModeration
                      actions={[
                        {
                          libelle: 'Retirer',
                          action: retirerCommentaire,
                          champId: 'cible_id',
                          id: c.id,
                          champRaison: 'raison',
                          placeholderRaison: 'Motif du retrait, au moins 10 caractères.',
                          messageSucces: 'Commentaire retiré.',
                        },
                      ]}
                    />
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
