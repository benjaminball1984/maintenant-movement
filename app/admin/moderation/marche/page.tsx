import { retirerProduit } from '@/app/(public)/s-entraider/marche/actions';
import { ControleModeration } from '@/components/admin/moderation/ControleModeration';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';
import Link from 'next/link';

export default async function PageModerationMarche() {
  const supabase = await getSupabaseServer();
  const [{ data: produits }, { data: notations }, estAdmin, titre, intro] = await Promise.all([
    supabase
      .from('produit_marche')
      .select('id, slug, titre, mode, statut')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('notation_marche')
      .select('id, produit_id, etoiles, created_at')
      .lt('etoiles', 3)
      .order('created_at', { ascending: false })
      .limit(50),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.marche.titre', {
      valeurMd: 'Modération — Marché solidaire',
    }),
    lireContenuEditorial('admin.moderation.marche.intro', {
      valeurMd: 'Produits récents et notations 1-2 étoiles (à examiner en priorité).',
    }),
  ]);
  return (
    <>
      <TexteEditableAdmin
        cle="admin.moderation.marche.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre console marche"
        longueurMax={60}
      >
        {(t) => <Heading niveau={1}>{t}</Heading>}
      </TexteEditableAdmin>
      <TexteEditableAdmin
        cle="admin.moderation.marche.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console marche"
        longueurMax={200}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      <section className="mt-6">
        <h2 className="mb-2 font-bold">Notations basses ({(notations ?? []).length})</h2>
        {(notations ?? []).length === 0 ? (
          <Alert variant="info" titre="Aucune notation basse récente">
            Toutes les notations récentes sont à 3★ ou plus.
          </Alert>
        ) : (
          <ul className="grid gap-2">
            {(notations ?? []).map((n) => (
              <li key={n.id}>
                <Card variant="ombre" className="flex items-center justify-between gap-2">
                  <p className="text-sm">
                    Notation {n.etoiles}★ produit {n.produit_id.slice(0, 8)}
                  </p>
                  <Badge variant="warning">{n.etoiles}/5</Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-bold">Produits ({(produits ?? []).length})</h2>
        <ul className="grid gap-2">
          {(produits ?? []).map((p) => (
            <li key={p.id}>
              <Card variant="ombre" className="grid gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p>
                    <Badge variant={p.mode === 'don' ? 'success' : 'brand'}>{p.mode}</Badge>{' '}
                    <Link
                      href={`/s-entraider/marche/produits/${p.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {p.titre}
                    </Link>
                  </p>
                  <Badge variant="default">{p.statut}</Badge>
                </div>
                {p.statut === 'disponible' || p.statut === 'reserve' ? (
                  <ControleModeration
                    actions={[
                      {
                        libelle: 'Retirer',
                        action: retirerProduit,
                        champId: 'produit_id',
                        id: p.id,
                        champRaison: 'raison',
                        placeholderRaison: 'Motif du retrait, au moins 10 caractères.',
                        messageSucces: 'Produit retiré.',
                      },
                    ]}
                  />
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
