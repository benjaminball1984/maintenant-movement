import { JaugeT99CPEuros } from '@/components/cagnottes/JaugeT99CPEuros';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { cagnotteAlaUne } from '@/lib/cagnottes/requetes';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UneSection } from './UneSection';

const FALLBACKS = {
  badge: 'Cagnotte solidaire',
  voirTous: 'Voir toutes les cagnottes',
  cta: 'Soutenir',
  emptyAvant: 'Aucune cagnotte mise en avant pour le moment.',
  emptyLien: 'Ouvre la première',
};

/**
 * Une « cagnotte solidaire » de la page d'accueil (chantier 3.3).
 *
 * Branchée sur `cagnotteAlaUne()` qui retourne la plus récente cagnotte
 * publiée de type `ouverte` ou `lutte` (les cotisations restent dans
 * leur page dédiée, pas en une).
 */
export async function UneCagnotte() {
  const [cagnotte, estAdmin, badge, voirTous, cta, emptyAvant, emptyLien] = await Promise.all([
    cagnotteAlaUne(),
    estAdminCourant(),
    lireContenuEditorial('home.une.cagnotte.badge', { valeurMd: FALLBACKS.badge }),
    lireContenuEditorial('home.une.cagnotte.voir_tous', { valeurMd: FALLBACKS.voirTous }),
    lireContenuEditorial('home.une.cagnotte.cta', { valeurMd: FALLBACKS.cta }),
    lireContenuEditorial('home.une.cagnotte.empty_avant', { valeurMd: FALLBACKS.emptyAvant }),
    lireContenuEditorial('home.une.cagnotte.empty_lien', { valeurMd: FALLBACKS.emptyLien }),
  ]);

  if (cagnotte === null) {
    return (
      <UneSection
        type={badge.valeurMd}
        cleBadge="home.une.cagnotte.badge"
        couleur="vous"
        titre={null}
        voirTousHref="/mobiliser/cagnottes"
        voirTousLibelle={voirTous.valeurMd}
        cleVoirTous="home.une.cagnotte.voir_tous"
        estAdmin={estAdmin}
        enAttente={
          <p>
            <TexteEditableAdmin
              cle="home.une.cagnotte.empty_avant"
              valeurInitiale={emptyAvant.valeurMd}
              estAdmin={estAdmin}
              libelle="empty state cagnotte texte avant le lien"
              longueurMax={150}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="home.une.cagnotte.empty_lien"
              valeurInitiale={emptyLien.valeurMd}
              estAdmin={estAdmin}
              libelle="empty state cagnotte libelle du lien"
              longueurMax={50}
            >
              {(t) => (
                <Link href="/mobiliser/cagnottes/nouvelle" className="text-brand hover:underline">
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
            .
          </p>
        }
      />
    );
  }

  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <TexteEditableAdmin
          cle="home.une.cagnotte.badge"
          valeurInitiale={badge.valeurMd}
          estAdmin={estAdmin}
          libelle="texte du badge Une cagnotte"
          longueurMax={40}
        >
          {(t) => <Badge variant="success">{t}</Badge>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="home.une.cagnotte.voir_tous"
          valeurInitiale={voirTous.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle Voir toutes les cagnottes"
          longueurMax={60}
        >
          {(t) => (
            <Link href="/mobiliser/cagnottes" className="text-xs text-text-3 hover:text-brand">
              {t} →
            </Link>
          )}
        </TexteEditableAdmin>
      </header>

      <Heading niveau={2} apparenceComme={3} className="text-2xl">
        <Link
          href={`/mobiliser/cagnottes/${cagnotte.slug}`}
          className="text-text-1 underline-offset-4 hover:underline"
        >
          {cagnotte.titre}
        </Link>
      </Heading>

      <JaugeT99CPEuros
        totalEurosCentimes={cagnotte.total_euros_centimes}
        totalT99CPUnites={cagnotte.total_t99cp_unites}
        objectifEuros={cagnotte.objectif_euros}
        nombreDons={cagnotte.nombre_dons}
        taille="sm"
      />

      <TexteEditableAdmin
        cle="home.une.cagnotte.cta"
        valeurInitiale={cta.valeurMd}
        estAdmin={estAdmin}
        libelle="libelle du CTA principal (Soutenir)"
        longueurMax={40}
      >
        {(t) => (
          <Link
            href={`/mobiliser/cagnottes/${cagnotte.slug}`}
            className={cn(
              'inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-5',
              'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
            )}
          >
            {t}
          </Link>
        )}
      </TexteEditableAdmin>
    </Card>
  );
}
