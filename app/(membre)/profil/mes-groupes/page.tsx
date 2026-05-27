import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSessionOuRediriger } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { type AppartenanceGroupe, listerMesAppartenances } from '@/lib/mes-groupes';
import { Building, Globe, HandHelping, Megaphone, Network, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mes groupes',
  description:
    'Mes appartenances dans le mouvement : communes libres, fédérations, confédérations, GT thématiques.',
};

const FALLBACKS = {
  titre: 'Mes groupes',
  intro:
    'Toutes les appartenances actives dans le mouvement (communes libres, fédérations, confédérations, groupes de travail thématiques).',
  emptyAmorce:
    'Tu n’es membre d’aucun groupe pour le moment. Pour rejoindre une commune libre, va sur la',
  emptyLien: 'carte des communes',
  emptyFin:
    '. Les groupes de travail thématiques (GT) sont en cours de construction côté UI ; en attendant, l’inscription se fait depuis un GT particulier quand sa page sera livrée.',
  sectionCommunes: 'Communes libres',
  videCommunes: 'Pas encore membre d’une commune libre.',
  sectionFederations: 'Fédérations',
  videFederations:
    'Aucune fédération rattachée (les fédérations sont indirectes : il faut être membre d’une commune fédérée).',
  sectionConfederations: 'Confédérations',
  videConfederations: 'Aucune confédération rattachée (indirecte via les fédérations).',
  sectionGt: 'Groupes de travail thématiques',
  videGt: 'Pas encore membre d’un GT thématique.',
  sectionCampagnes: 'Campagnes',
  videCampagnes: 'Pas encore membre d’une campagne.',
  sectionGroupesEntraide: 'Groupes d’entraide locaux',
  videGroupesEntraide: 'Pas encore membre d’un groupe d’entraide local.',
  membreDepuisLe: 'membre depuis le',
};

/**
 * Page « Mes groupes » côté profil (cycle V2 V2.3.22).
 *
 * 4 axes couverts par les tables V1 existantes : communes libres
 * (direct), fédérations (indirect via commune), confédérations (indirect
 * via fédération), GT thématiques (direct).
 *
 * Lecture seule. Chaque entrée est un lien direct vers la page de
 * l'espace (commune, GT, etc.).
 */
export default async function PageMesGroupes() {
  const session = await getSessionOuRediriger('/profil/mes-groupes');
  const [
    appartenances,
    estAdmin,
    titre,
    intro,
    emptyAmorce,
    emptyLien,
    emptyFin,
    sectionCommunes,
    videCommunes,
    sectionFederations,
    videFederations,
    sectionConfederations,
    videConfederations,
    sectionGt,
    videGt,
    sectionCampagnes,
    videCampagnes,
    sectionGroupesEntraide,
    videGroupesEntraide,
    membreDepuisLe,
  ] = await Promise.all([
    listerMesAppartenances(session.userId),
    estAdminCourant(),
    lireContenuEditorial('profil.mes_groupes.titre', { valeurMd: FALLBACKS.titre }),
    lireContenuEditorial('profil.mes_groupes.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('profil.mes_groupes.empty_amorce', { valeurMd: FALLBACKS.emptyAmorce }),
    lireContenuEditorial('profil.mes_groupes.empty_lien', { valeurMd: FALLBACKS.emptyLien }),
    lireContenuEditorial('profil.mes_groupes.empty_fin', { valeurMd: FALLBACKS.emptyFin }),
    lireContenuEditorial('profil.mes_groupes.section_communes', {
      valeurMd: FALLBACKS.sectionCommunes,
    }),
    lireContenuEditorial('profil.mes_groupes.vide_communes', { valeurMd: FALLBACKS.videCommunes }),
    lireContenuEditorial('profil.mes_groupes.section_federations', {
      valeurMd: FALLBACKS.sectionFederations,
    }),
    lireContenuEditorial('profil.mes_groupes.vide_federations', {
      valeurMd: FALLBACKS.videFederations,
    }),
    lireContenuEditorial('profil.mes_groupes.section_confederations', {
      valeurMd: FALLBACKS.sectionConfederations,
    }),
    lireContenuEditorial('profil.mes_groupes.vide_confederations', {
      valeurMd: FALLBACKS.videConfederations,
    }),
    lireContenuEditorial('profil.mes_groupes.section_gt', { valeurMd: FALLBACKS.sectionGt }),
    lireContenuEditorial('profil.mes_groupes.vide_gt', { valeurMd: FALLBACKS.videGt }),
    lireContenuEditorial('profil.mes_groupes.section_campagnes', {
      valeurMd: FALLBACKS.sectionCampagnes,
    }),
    lireContenuEditorial('profil.mes_groupes.vide_campagnes', {
      valeurMd: FALLBACKS.videCampagnes,
    }),
    lireContenuEditorial('profil.mes_groupes.section_groupes_entraide', {
      valeurMd: FALLBACKS.sectionGroupesEntraide,
    }),
    lireContenuEditorial('profil.mes_groupes.vide_groupes_entraide', {
      valeurMd: FALLBACKS.videGroupesEntraide,
    }),
    lireContenuEditorial('profil.mes_groupes.membre_depuis_le', {
      valeurMd: FALLBACKS.membreDepuisLe,
    }),
  ]);
  const { communes, federations, confederations, gtThematiques, campagnes, groupesEntraide } =
    appartenances;

  const total =
    communes.length +
    federations.length +
    confederations.length +
    gtThematiques.length +
    campagnes.length +
    groupesEntraide.length;

  return (
    <Container taille="md" className="py-12">
      <TexteEditableAdmin
        cle="profil.mes_groupes.titre"
        valeurInitiale={titre.valeurMd}
        estAdmin={estAdmin}
        libelle="titre page mes groupes"
        longueurMax={40}
      >
        {(t) => <Heading niveau={1}>{t}</Heading>}
      </TexteEditableAdmin>
      <TexteEditableAdmin
        cle="profil.mes_groupes.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro page mes groupes"
        multilignes
        longueurMax={400}
      >
        {(t) => <p className="mt-2 text-text-2">{t}</p>}
      </TexteEditableAdmin>

      {total === 0 ? (
        <Card variant="ombre" className="mt-8">
          <p className="text-text-2">
            <TexteEditableAdmin
              cle="profil.mes_groupes.empty_amorce"
              valeurInitiale={emptyAmorce.valeurMd}
              estAdmin={estAdmin}
              libelle="amorce empty state mes groupes"
              multilignes
              longueurMax={300}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="profil.mes_groupes.empty_lien"
              valeurInitiale={emptyLien.valeurMd}
              estAdmin={estAdmin}
              libelle="lien empty (carte des communes)"
              longueurMax={50}
            >
              {(t) => (
                <Link href="/communes" className="text-brand hover:underline">
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>
            <TexteEditableAdmin
              cle="profil.mes_groupes.empty_fin"
              valeurInitiale={emptyFin.valeurMd}
              estAdmin={estAdmin}
              libelle="fin empty state mes groupes"
              multilignes
              longueurMax={400}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-8">
          <SectionAppartenance
            titre={sectionCommunes.valeurMd}
            icone={<Building size={20} aria-hidden="true" />}
            appartenances={communes}
            vide={videCommunes.valeurMd}
            membreDepuisLe={membreDepuisLe.valeurMd}
          />
          <SectionAppartenance
            titre={sectionFederations.valeurMd}
            icone={<Network size={20} aria-hidden="true" />}
            appartenances={federations}
            vide={videFederations.valeurMd}
            membreDepuisLe={membreDepuisLe.valeurMd}
          />
          <SectionAppartenance
            titre={sectionConfederations.valeurMd}
            icone={<Globe size={20} aria-hidden="true" />}
            appartenances={confederations}
            vide={videConfederations.valeurMd}
            membreDepuisLe={membreDepuisLe.valeurMd}
          />
          <SectionAppartenance
            titre={sectionGt.valeurMd}
            icone={<Users size={20} aria-hidden="true" />}
            appartenances={gtThematiques}
            vide={videGt.valeurMd}
            membreDepuisLe={membreDepuisLe.valeurMd}
          />
          <SectionAppartenance
            titre={sectionCampagnes.valeurMd}
            icone={<Megaphone size={20} aria-hidden="true" />}
            appartenances={campagnes}
            vide={videCampagnes.valeurMd}
            membreDepuisLe={membreDepuisLe.valeurMd}
          />
          <SectionAppartenance
            titre={sectionGroupesEntraide.valeurMd}
            icone={<HandHelping size={20} aria-hidden="true" />}
            appartenances={groupesEntraide}
            vide={videGroupesEntraide.valeurMd}
            membreDepuisLe={membreDepuisLe.valeurMd}
          />
        </div>
      )}
    </Container>
  );
}

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function SectionAppartenance({
  titre,
  icone,
  appartenances,
  vide,
  membreDepuisLe,
}: {
  titre: string;
  icone: React.ReactNode;
  appartenances: AppartenanceGroupe[];
  vide: string;
  membreDepuisLe: string;
}) {
  return (
    <section>
      <Heading niveau={2}>
        <span className="-mt-0.5 mr-2 inline-block align-middle text-text-3">{icone}</span>
        {titre} ({appartenances.length})
      </Heading>
      {appartenances.length === 0 ? (
        <p className="mt-2 text-sm text-text-3">{vide}</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {appartenances.map((a) => (
            <li key={a.id}>
              <Card variant="ombre" className="grid gap-1">
                <h3 className="font-display font-bold text-text-1">
                  {a.href !== '' ? (
                    <Link href={a.href} className="hover:text-brand">
                      {a.nom}
                    </Link>
                  ) : (
                    a.nom
                  )}
                </h3>
                <p className="text-text-3 text-xs">
                  {a.typeLibelle} · {membreDepuisLe} {FORMATEUR_DATE.format(new Date(a.depuisLe))}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
