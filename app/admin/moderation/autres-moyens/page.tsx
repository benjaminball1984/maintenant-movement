import {
  reafficherOrganisation,
  retirerOrganisation,
} from '@/app/(public)/agir/autres-moyens/actions';
import { ControleModeration } from '@/components/admin/moderation/ControleModeration';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getSupabaseServer } from '@/lib/supabase';

export default async function PageModerationAutresMoyens() {
  const supabase = await getSupabaseServer();
  const [{ data }, estAdmin, titre, intro] = await Promise.all([
    supabase
      .from('organisation_partenaire')
      .select('id, nom, url, statut, categorie_slug, raison_retrait')
      .order('nom')
      .limit(200),
    estAdminCourant(),
    lireContenuEditorial('admin.moderation.autres_moyens.titre', {
      valeurMd: "Modération — Autres moyens d'agir",
    }),
    lireContenuEditorial('admin.moderation.autres_moyens.intro', {
      valeurMd:
        'Liste de redirections sans endossement (doctrine §7D distance protectrice). Retrait possible avec raison conservée pour audit.',
    }),
  ]);
  const orgas = data ?? [];
  return (
    <>
      <TexteEditableAdmin
        cle="admin.moderation.autres_moyens.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre console autres moyens"
        longueurMax={60}
      >
        {(t) => <Heading niveau={1}>{t}</Heading>}
      </TexteEditableAdmin>
      <TexteEditableAdmin
        cle="admin.moderation.autres_moyens.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console autres moyens"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>
      {orgas.length === 0 ? (
        <Alert variant="info" titre="Aucune organisation listée">
          L'ajout se fait via Server Action côté admin pour l'instant (UI dédiée en polish).
        </Alert>
      ) : (
        <ul className="mt-6 grid gap-2">
          {orgas.map((o) => (
            <li key={o.id}>
              <Card variant="ombre" className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">
                      <a
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-4 hover:underline"
                      >
                        {o.nom}
                      </a>
                    </p>
                    {o.categorie_slug !== null ? (
                      <p className="text-xs text-text-3">{o.categorie_slug}</p>
                    ) : null}
                    {o.raison_retrait !== null ? (
                      <p className="mt-1 text-xs text-danger">Retrait : {o.raison_retrait}</p>
                    ) : null}
                  </div>
                  <Badge variant={o.statut === 'affichee' ? 'success' : 'warning'}>
                    {o.statut}
                  </Badge>
                </div>
                {o.statut === 'affichee' ? (
                  <ControleModeration
                    libelleObjet={o.nom}
                    actions={[
                      {
                        libelle: 'Retirer',
                        action: retirerOrganisation,
                        champId: 'organisation_id',
                        id: o.id,
                        champRaison: 'raison_retrait',
                        placeholderRaison: 'Motif du retrait, au moins 10 caractères.',
                        messageSucces: 'Organisation retirée.',
                      },
                    ]}
                  />
                ) : (
                  <ControleModeration
                    libelleObjet={o.nom}
                    actions={[
                      {
                        libelle: 'Réafficher',
                        variant: 'outline',
                        action: reafficherOrganisation,
                        champId: 'organisation_id',
                        id: o.id,
                        messageSucces: 'Organisation réaffichée.',
                      },
                    ]}
                  />
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
