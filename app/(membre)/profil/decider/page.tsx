import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  LIBELLE_MODE,
  LIBELLE_STATUT,
  listerDernieresReunionsAvecPV,
  listerProchainesReunionsToutesSalles,
} from '@/lib/decider';
import { ArrowLeft, CheckCircle, Clock, Video } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Mes prochaines réunions Décider',
};

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Page `/profil/decider` — Vue personnelle des réunions Décider visibles
 * à la personne (V2.4.22).
 *
 * RLS Supabase filtre déjà les salles selon la visibilité (membres /
 * fedeere / public). Cette page propose donc juste un agrégat tri à
 * destination de la personne connectée : prochaines réunions + dernières
 * décisions, sans filtre supplémentaire côté applicatif. C'est le RLS
 * qui sécurise.
 */
export default async function PageMesReunions() {
  const session = await getSession();
  if (session === null) redirect('/connexion?prochaine=/profil/decider');

  const [
    prochaines,
    recentes,
    estAdmin,
    retourLien,
    titre,
    intro,
    sectionProchaines,
    sectionRecentes,
    emptyProchainesTitre,
    emptyProchainesAmorce,
    emptyProchainesLien,
    emptyProchainesFin,
    emptyRecentes,
  ] = await Promise.all([
    listerProchainesReunionsToutesSalles(20),
    listerDernieresReunionsAvecPV(10),
    estAdminCourant(),
    lireContenuEditorial('profil.decider.retour_lien', { valeurMd: 'Mon dashboard' }),
    lireContenuEditorial('profil.decider.titre', { valeurMd: 'Mes réunions Décider' }),
    lireContenuEditorial('profil.decider.intro', {
      valeurMd:
        'Toutes les réunions visibles selon ton périmètre (les salles sont filtrées par RLS selon leur visibilité).',
    }),
    lireContenuEditorial('profil.decider.section_prochaines', {
      valeurMd: 'Prochaines réunions',
    }),
    lireContenuEditorial('profil.decider.section_recentes', { valeurMd: 'Dernières décisions' }),
    lireContenuEditorial('profil.decider.empty_prochaines_titre', {
      valeurMd: 'Aucune réunion à venir',
    }),
    lireContenuEditorial('profil.decider.empty_prochaines_amorce', {
      valeurMd: 'Reviens bientôt. Tu peux aussi explorer',
    }),
    lireContenuEditorial('profil.decider.empty_prochaines_lien', {
      valeurMd: 'toutes les salles Décider',
    }),
    lireContenuEditorial('profil.decider.empty_prochaines_fin', {
      valeurMd: 'pour voir celles publiques.',
    }),
    lireContenuEditorial('profil.decider.empty_recentes', {
      valeurMd: 'Aucun PV publié pour le moment.',
    }),
  ]);

  return (
    <Container taille="md" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="profil.decider.retour_lien"
          valeurInitiale={retourLien.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour dashboard"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/profil/dashboard" className="hover:text-brand">
              <ArrowLeft size={12} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>

      <Heading niveau={1}>
        <Video size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="profil.decider.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre page Mes reunions Decider"
          longueurMax={50}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <TexteEditableAdmin
        cle="profil.decider.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro page Mes reunions"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          <Clock size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="profil.decider.section_prochaines"
            valeurInitiale={sectionProchaines.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section prochaines"
            longueurMax={40}
          >
            {(t) => (
              <>
                {t} ({prochaines.length})
              </>
            )}
          </TexteEditableAdmin>
        </Heading>
        {prochaines.length === 0 ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="profil.decider.empty_prochaines_titre"
                valeurInitiale={emptyProchainesTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre empty prochaines"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
            className="mt-3"
          >
            <TexteEditableAdmin
              cle="profil.decider.empty_prochaines_amorce"
              valeurInitiale={emptyProchainesAmorce.valeurMd}
              estAdmin={estAdmin}
              libelle="amorce empty (avant le lien)"
              longueurMax={150}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="profil.decider.empty_prochaines_lien"
              valeurInitiale={emptyProchainesLien.valeurMd}
              estAdmin={estAdmin}
              libelle="lien vers salles Decider"
              longueurMax={60}
            >
              {(t) => (
                <Link href="/s-informer/decider" className="underline">
                  {t}
                </Link>
              )}
            </TexteEditableAdmin>{' '}
            <TexteEditableAdmin
              cle="profil.decider.empty_prochaines_fin"
              valeurInitiale={emptyProchainesFin.valeurMd}
              estAdmin={estAdmin}
              libelle="fin apres le lien"
              longueurMax={100}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : (
          <ul className="mt-3 grid gap-2">
            {prochaines.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/s-informer/decider/${r.salleSlug}/${r.id}`}
                  className="block hover:opacity-90"
                >
                  <Card variant="ombre" className="grid gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-text-3 text-xs">{r.salleNom}</span>
                      <span className="font-bold text-brand text-xs">
                        {FORMATEUR.format(new Date(r.debutLe))}
                      </span>
                    </div>
                    <h3 className="font-bold text-text-1">{r.titre}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={r.statut === 'en_cours' ? 'success' : 'warning'}>
                        {LIBELLE_STATUT[r.statut]}
                      </Badge>
                      <Badge variant="info">{LIBELLE_MODE[r.modeDecision]}</Badge>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          <CheckCircle size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="profil.decider.section_recentes"
            valeurInitiale={sectionRecentes.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section recentes"
            longueurMax={40}
          >
            {(t) => (
              <>
                {t} ({recentes.length})
              </>
            )}
          </TexteEditableAdmin>
        </Heading>
        {recentes.length === 0 ? (
          <TexteEditableAdmin
            cle="profil.decider.empty_recentes"
            valeurInitiale={emptyRecentes.valeurMd}
            estAdmin={estAdmin}
            libelle="empty recentes"
            longueurMax={100}
          >
            {(t) => <p className="mt-3 text-sm text-text-3">{t}</p>}
          </TexteEditableAdmin>
        ) : (
          <ul className="mt-3 grid gap-2">
            {recentes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/s-informer/decider/${r.salleSlug}/${r.id}`}
                  className="block hover:opacity-90"
                >
                  <Card variant="plat" className="grid gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-text-3 text-xs">{r.salleNom}</span>
                      <Badge variant="info">{LIBELLE_MODE[r.modeDecision]}</Badge>
                    </div>
                    <h3 className="font-bold text-text-1">{r.titre}</h3>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
