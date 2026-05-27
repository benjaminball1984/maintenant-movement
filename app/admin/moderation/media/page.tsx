import { publierMedia, retirerMedia } from '@/app/(public)/s-informer/media/actions';
import { ControleModeration } from '@/components/admin/moderation/ControleModeration';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';

export default async function PageModerationMedia() {
  const supabase = await getSupabaseServer();
  const [{ data }, estAdmin, titre, intro] = await Promise.all([
    supabase
      .from('media')
      .select('id, slug, titre, type, statut, publie_le, provenance_externe')
      .order('created_at', { ascending: false })
      .limit(100),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.media.titre', { valeurMd: 'Modération — Médias' }),
    lireContenuEditorial('admin.moderation.media.intro', {
      valeurMd:
        'Liste des médias avec leur statut. Publie les brouillons prêts ou retire un média problématique (un motif est demandé au retrait).',
    }),
  ]);
  const medias = data ?? [];
  return (
    <>
      <TexteEditableAdmin
        cle="admin.moderation.media.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre console media"
        longueurMax={60}
      >
        {(t) => <Heading niveau={1}>{t}</Heading>}
      </TexteEditableAdmin>
      <TexteEditableAdmin
        cle="admin.moderation.media.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console media"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>
      {medias.length === 0 ? (
        <Alert variant="info" titre="Aucun média">
          Aucun média créé pour l'instant.
        </Alert>
      ) : (
        <ul className="mt-6 grid gap-2">
          {medias.map((m) => (
            <li key={m.id}>
              <Card variant="ombre" className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Badge variant="default">{m.type}</Badge>
                    <p className="mt-1 font-bold text-text-1">
                      <Link
                        href={`/s-informer/media/${m.slug}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {m.titre}
                      </Link>
                    </p>
                    {m.provenance_externe !== null ? (
                      <p className="text-xs text-text-3">via {m.provenance_externe}</p>
                    ) : null}
                  </div>
                  <Badge variant={m.statut === 'publie' ? 'success' : 'default'}>{m.statut}</Badge>
                </div>

                {m.statut === 'brouillon' ? (
                  <ControleModeration
                    actions={[
                      {
                        libelle: 'Publier',
                        variant: 'outline',
                        action: publierMedia,
                        champId: 'media_id',
                        id: m.id,
                        messageSucces: 'Média publié.',
                      },
                    ]}
                  />
                ) : null}
                {m.statut === 'publie' ? (
                  <ControleModeration
                    actions={[
                      {
                        libelle: 'Retirer',
                        action: retirerMedia,
                        champId: 'media_id',
                        id: m.id,
                        champRaison: 'raison_retrait',
                        placeholderRaison: 'Motif du retrait, au moins 10 caractères.',
                        messageSucces: 'Média retiré.',
                      },
                    ]}
                  />
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
