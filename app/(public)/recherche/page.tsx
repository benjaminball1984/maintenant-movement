import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { libelleType, rechercherGlobalement } from '@/lib/recherche-globale';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Recherche',
  description: 'Rechercher dans pétitions, mobilisations, cagnottes, communes, articles, sondages…',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

/**
 * Page `/recherche` — Recherche globale du site (V2.4.24).
 *
 * Form GET avec input texte (?q=). Si q présent, lance la recherche
 * agrégée sur 11 types d'entités en parallèle. Sinon, affiche la page
 * d'accueil avec hints.
 */
export default async function PageRechercheGlobale({ searchParams }: Props) {
  const { q } = await searchParams;
  const requete = (q ?? '').trim();
  const [resultats, estAdmin, ...lectures] = await Promise.all([
    requete.length >= 2 ? rechercherGlobalement(requete) : Promise.resolve([]),
    estAdminCourant(),
    lireContenuEditorial('recherche.titre', { valeurMd: 'Rechercher' }),
    lireContenuEditorial('recherche.intro', {
      valeurMd:
        "Pétitions, mobilisations, cagnottes, communes, fédérations, articles, sondages, salles Décider, journal-affiche, groupes d'entraide, campagnes.",
    }),
    lireContenuEditorial('recherche.placeholder', { valeurMd: 'Tape au moins 2 lettres…' }),
    lireContenuEditorial('recherche.cta', { valeurMd: 'Rechercher' }),
    lireContenuEditorial('recherche.alert_vide_titre', {
      valeurMd: 'Tape un mot-clé pour démarrer',
    }),
    lireContenuEditorial('recherche.alert_vide_corps', {
      valeurMd:
        'La recherche couvre tous les espaces publics du site. Les résultats sont filtrés par RLS selon ton périmètre.',
    }),
    lireContenuEditorial('recherche.alert_court_titre', { valeurMd: 'Trop court' }),
    lireContenuEditorial('recherche.alert_court_corps', {
      valeurMd: 'Tape au moins 2 caractères.',
    }),
    lireContenuEditorial('recherche.alert_aucun_titre', { valeurMd: 'Aucun résultat' }),
    lireContenuEditorial('recherche.alert_aucun_amorce', {
      valeurMd: 'Aucune entité publique ne correspond à',
    }),
    lireContenuEditorial('recherche.alert_aucun_milieu', {
      valeurMd: '. Essaie un autre mot-clé ou consulte le',
    }),
    lireContenuEditorial('recherche.alert_aucun_lien', { valeurMd: 'réseau social' }),
    lireContenuEditorial('recherche.alert_aucun_fin', { valeurMd: 'pour chercher des personnes.' }),
    lireContenuEditorial('recherche.resultats_label', { valeurMd: 'résultat' }),
    lireContenuEditorial('recherche.resultats_pour', { valeurMd: 'pour' }),
  ]);
  const [
    titre,
    intro,
    placeholder,
    cta,
    alertVideTitre,
    alertVideCorps,
    alertCourtTitre,
    alertCourtCorps,
    alertAucunTitre,
    alertAucunAmorce,
    alertAucunMilieu,
    alertAucunLien,
    alertAucunFin,
    resultatsLabel,
    resultatsPour,
  ] = lectures;

  return (
    <Container taille="lg" className="py-12">
      <header>
        <Heading niveau={1}>
          <Search size={26} className="-mt-1 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="recherche.titre"
            valeurInitiale={titre?.valeurMd ?? 'Rechercher'}
            estAdmin={estAdmin}
            libelle="titre page recherche"
            longueurMax={30}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Heading>
        <TexteEditableAdmin
          cle="recherche.intro"
          valeurInitiale={intro?.valeurMd ?? ''}
          estAdmin={estAdmin}
          libelle="intro page recherche"
          multilignes
          longueurMax={400}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <form method="get" action="/recherche" className="mt-6 flex flex-wrap gap-2">
        <label htmlFor="q-input" className="sr-only">
          Mots-clés
        </label>
        <input
          id="q-input"
          name="q"
          type="search"
          defaultValue={requete}
          placeholder={placeholder?.valeurMd ?? ''}
          className="flex-1 rounded-md border border-border bg-surface p-3"
          minLength={2}
        />
        <TexteEditableAdmin
          cle="recherche.cta"
          valeurInitiale={cta?.valeurMd ?? 'Rechercher'}
          estAdmin={estAdmin}
          libelle="CTA Rechercher"
          longueurMax={30}
        >
          {(t) => (
            <button
              type="submit"
              className="rounded-md bg-brand px-6 py-3 font-bold text-white hover:brightness-110"
            >
              {t}
            </button>
          )}
        </TexteEditableAdmin>
      </form>

      {requete.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="recherche.alert_vide_titre"
              valeurInitiale={alertVideTitre?.valeurMd ?? ''}
              estAdmin={estAdmin}
              libelle="titre alerte vide"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
          className="mt-8"
        >
          <TexteEditableAdmin
            cle="recherche.alert_vide_corps"
            valeurInitiale={alertVideCorps?.valeurMd ?? ''}
            estAdmin={estAdmin}
            libelle="corps alerte vide"
            multilignes
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : requete.length < 2 ? (
        <Alert
          variant="warning"
          titre={
            <TexteEditableAdmin
              cle="recherche.alert_court_titre"
              valeurInitiale={alertCourtTitre?.valeurMd ?? ''}
              estAdmin={estAdmin}
              libelle="titre alerte trop court"
              longueurMax={40}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
          className="mt-8"
        >
          <TexteEditableAdmin
            cle="recherche.alert_court_corps"
            valeurInitiale={alertCourtCorps?.valeurMd ?? ''}
            estAdmin={estAdmin}
            libelle="corps alerte trop court"
            longueurMax={100}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : resultats.length === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="recherche.alert_aucun_titre"
              valeurInitiale={alertAucunTitre?.valeurMd ?? ''}
              estAdmin={estAdmin}
              libelle="titre alerte aucun resultat"
              longueurMax={40}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
          className="mt-8"
        >
          <TexteEditableAdmin
            cle="recherche.alert_aucun_amorce"
            valeurInitiale={alertAucunAmorce?.valeurMd ?? ''}
            estAdmin={estAdmin}
            libelle="amorce alerte aucun (avant la requete)"
            longueurMax={150}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          « <strong>{requete}</strong> »
          <TexteEditableAdmin
            cle="recherche.alert_aucun_milieu"
            valeurInitiale={alertAucunMilieu?.valeurMd ?? ''}
            estAdmin={estAdmin}
            libelle="milieu alerte aucun (avant le lien)"
            longueurMax={150}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>{' '}
          <TexteEditableAdmin
            cle="recherche.alert_aucun_lien"
            valeurInitiale={alertAucunLien?.valeurMd ?? ''}
            estAdmin={estAdmin}
            libelle="lien reseau social"
            longueurMax={40}
          >
            {(t) => (
              <Link href="/s-informer/reseau/recherche" className="underline">
                {t}
              </Link>
            )}
          </TexteEditableAdmin>{' '}
          <TexteEditableAdmin
            cle="recherche.alert_aucun_fin"
            valeurInitiale={alertAucunFin?.valeurMd ?? ''}
            estAdmin={estAdmin}
            libelle="fin alerte aucun"
            longueurMax={100}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <section className="mt-8">
          <p className="mb-3 text-sm text-text-3">
            {resultats.length} {resultatsLabel?.valeurMd ?? 'résultat'}
            {resultats.length > 1 ? 's' : ''} {resultatsPour?.valeurMd ?? 'pour'} «{' '}
            <strong>{requete}</strong> »
          </p>
          <ul className="grid gap-2">
            {resultats.map((r) => (
              <li key={`${r.type}-${r.href}`}>
                <Link href={r.href} className="block hover:opacity-90">
                  <Card variant="ombre" className="flex items-start gap-3">
                    {r.imageUrl !== null ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2">
                        <Image
                          src={r.imageUrl}
                          alt=""
                          fill
                          unoptimized
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-md bg-surface-2" />
                    )}
                    <div className="grid flex-1 gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info">{libelleType(r.type)}</Badge>
                      </div>
                      <h3 className="font-bold text-text-1">{r.titre}</h3>
                      {r.sousTitre !== null && r.sousTitre.trim() !== '' ? (
                        <p className="line-clamp-2 text-sm text-text-2">{r.sousTitre}</p>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
