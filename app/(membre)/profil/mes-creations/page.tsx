import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSessionOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { type TypeCreation, chargerMesCreations } from '@/lib/mes-creations';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mes créations',
  description: 'Tout ce que tu as créé sur Maintenant! : pétitions, cagnottes, offres, posts, …',
};

const FALLBACKS = {
  titre: 'Mes créations',
  introAmorce: 'Tout ce que tu as créé sur Maintenant! (',
  introFin: ' au total). Regroupé par type, trié par date décroissante.',
  emptyTitre: 'Tu n’as encore rien créé',
  emptyCorps:
    "Crée ta première pétition, cagnotte, mobilisation, offre d'entraide ou publication réseau. Tout apparaîtra ici.",
  creeLe: 'Créé le',
};

const LIBELLE_TYPE: Record<TypeCreation, string> = {
  petition: 'Pétitions',
  mobilisation: 'Mobilisations',
  campagne: 'Campagnes',
  cagnotte: 'Cagnottes',
  offre_entraide: 'Offres d’entraide',
  service_sel: 'Services SEL',
  produit_marche: 'Produits du marché',
  boutique_marche: 'Boutiques éphémères',
  minimarche: 'Minimarchés',
  moment_solidaire: 'Moments solidaires',
  sondage: 'Sondages',
  post_reseau: 'Publications réseau',
  groupe_entraide_local: 'Groupes d’entraide',
  commune_libre: 'Communes libres',
};

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Page « Mes créations » (V2.4.7).
 *
 * Liste tout ce que la personne connectée a créé sur la plateforme,
 * regroupé par type, trié par date décroissante. Permet de retrouver
 * d'un coup d'œil ses propres pétitions, cagnottes, offres, posts, etc.
 */
export default async function PageMesCreations() {
  const session = await getSessionOuRediriger('/profil/mes-creations');
  const [data, estAdmin, titre, introAmorce, introFin, emptyTitre, emptyCorps, creeLe] =
    await Promise.all([
      chargerMesCreations(session.userId),
      estAdminCourant(),
      lireContenuEditorial('profil.mes_creations.titre', { valeurMd: FALLBACKS.titre }),
      lireContenuEditorial('profil.mes_creations.intro_amorce', {
        valeurMd: FALLBACKS.introAmorce,
      }),
      lireContenuEditorial('profil.mes_creations.intro_fin', { valeurMd: FALLBACKS.introFin }),
      lireContenuEditorial('profil.mes_creations.empty_titre', {
        valeurMd: FALLBACKS.emptyTitre,
      }),
      lireContenuEditorial('profil.mes_creations.empty_corps', {
        valeurMd: FALLBACKS.emptyCorps,
      }),
      lireContenuEditorial('profil.mes_creations.cree_le', { valeurMd: FALLBACKS.creeLe }),
    ]);
  const { total, parType } = data;

  // Liste les types qui ont au moins une création.
  const typesNonVides = (Object.keys(parType) as TypeCreation[]).filter(
    (t) => parType[t].length > 0,
  );

  return (
    <Container taille="md" className="py-12">
      <Heading niveau={1}>
        <Sparkles size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="profil.mes_creations.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre page mes creations"
          longueurMax={40}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <p className="mt-2 text-text-2">
        <TexteEditableAdmin
          cle="profil.mes_creations.intro_amorce"
          valeurInitiale={introAmorce.valeurMd}
          estAdmin={estAdmin}
          libelle="amorce intro (avant le total)"
          longueurMax={150}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
        {total}
        <TexteEditableAdmin
          cle="profil.mes_creations.intro_fin"
          valeurInitiale={introFin.valeurMd}
          estAdmin={estAdmin}
          libelle="fin intro (apres le total)"
          longueurMax={200}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </p>

      {total === 0 ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="profil.mes_creations.empty_titre"
              valeurInitiale={emptyTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre empty mes creations"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
          className="mt-8"
        >
          <TexteEditableAdmin
            cle="profil.mes_creations.empty_corps"
            valeurInitiale={emptyCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps empty mes creations"
            multilignes
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : (
        <div className="mt-8 grid gap-8">
          {typesNonVides.map((type) => (
            <section key={type}>
              <Heading niveau={2} apparenceComme={3} className="mb-3">
                {LIBELLE_TYPE[type]} ({parType[type].length})
              </Heading>
              <ul className="grid gap-2">
                {parType[type].map((c) => (
                  <li key={c.id}>
                    <Link href={c.href} className="block hover:opacity-90">
                      <Card variant="ombre" className="grid gap-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-medium text-text-1">{c.titre}</h3>
                          {c.statut !== null ? (
                            <Badge variant={variantStatut(c.statut)}>{c.statut}</Badge>
                          ) : null}
                        </div>
                        <p className="text-text-3 text-xs">
                          {creeLe.valeurMd} {FORMATEUR.format(new Date(c.createdAt))}
                        </p>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}

function variantStatut(statut: string): 'success' | 'warning' | 'danger' | 'default' {
  if (
    statut === 'publiee' ||
    statut === 'publie' ||
    statut === 'ouvert' ||
    statut === 'disponible' ||
    statut === 'ouverte' ||
    statut === 'en_cours' ||
    statut === 'cree'
  ) {
    return 'success';
  }
  if (statut === 'en_moderation' || statut === 'annonce' || statut === 'brouillon') {
    return 'warning';
  }
  if (
    statut === 'rejetee' ||
    statut === 'suspendue' ||
    statut === 'fermee' ||
    statut === 'cloturee' ||
    statut === 'retire' ||
    statut === 'pre_creee'
  ) {
    return 'default';
  }
  return 'default';
}
