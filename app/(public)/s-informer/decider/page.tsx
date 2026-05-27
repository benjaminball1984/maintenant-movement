import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  LIBELLE_MODE,
  LIBELLE_STATUT,
  listerDernieresReunionsAvecPV,
  listerProchainesReunionsToutesSalles,
  listerSallesDecider,
} from '@/lib/decider';
import { CalendarRange, CheckCircle, Clock, Globe, Lock, Users, Video } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

const FALLBACKS = {
  intro:
    'Infrastructure technique de la décision en réunion. Salles dédiées par espace, ordres du jour, 3 modes de décision hiérarchisés.',
  mode1Label: 'Mode 1',
  mode1Titre: 'Consensus',
  mode1Description: 'Accord plein de toutes les personnes présentes.',
  mode2Label: 'Mode 2',
  mode2Titre: "Levée d'objections",
  mode2Description: "Décision validée si aucune objection bloquante n'est levée.",
  mode3Label: 'Mode 3',
  mode3Titre: 'Jugement majoritaire',
  mode3Description: 'Méthode Balinski-Laraki. 7 mentions, médiane retenue.',
  sectionProchaines: 'Prochaines réunions',
  sectionSalles: 'Salles de décision',
  emptySallesTitre: 'Aucune salle pour le moment',
  emptySallesCorps:
    'Les salles seront créées au fur et à mesure que les espaces (communes, fédérations, GT) ouvriront leurs assemblées. Les admins nationaux peuvent en créer depuis la console.',
  sectionRecentes: 'Décisions récentes',
  sectionRecentesSousTitre: 'Dernières réunions terminées avec procès-verbal publié.',
  liveKitTitre: 'LiveKit pas encore branché',
  liveKitAmorce:
    "L'infrastructure visio (LiveKit self-hosted ou Cloud) sera connectée dans un chantier dédié. En attendant, les réunions sont annoncées ici, les PV publiés, et la visio se fait sur une plateforme externe au choix de chaque collectif. Cf.",
  liveKitLien: 'gouvernance',
  agendaLien: "Voir toutes les prochaines réunions dans l'agenda",
};

export const metadata: Metadata = {
  title: 'Décider',
  description:
    "Infrastructure de la décision en réunion : salles dédiées, 3 modes (consensus, levée d'objections, jugement majoritaire).",
};

const LIBELLE_ESPACE: Record<string, string> = {
  commune: 'Commune',
  federation: 'Fédération',
  confederation: 'Confédération',
  gt_thematique: 'GT thématique',
  campagne: 'Campagne',
  groupe_entraide_local: 'Groupe d’entraide',
  national: 'National',
};

const ICONE_VISIBILITE: Record<string, typeof Lock> = {
  membres: Lock,
  fedeere: Users,
  public: Globe,
};

const LIBELLE_VISIBILITE: Record<string, string> = {
  membres: 'Membres uniquement',
  fedeere: 'Périmètre fédéré',
  public: 'Public (enregistré)',
};

/**
 * Page `/s-informer/decider` V2.4.10.
 *
 * Liste des salles de décision créées dans le mouvement. Chaque salle
 * appartient à un espace (commune, fédération, GT, etc.) et a une
 * politique de visibilité.
 *
 * LiveKit pas encore branché : les boutons « Rejoindre » apparaîtront
 * quand `LIVEKIT_PROVIDER=livekit` sera défini en env. En attendant,
 * cette page sert de hub d'annonce + accès aux PV des réunions passées.
 */
const FORMATEUR_REUNION = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function PageDecider() {
  const [
    salles,
    prochaines,
    recentes,
    estAdmin,
    intro,
    sectionProchaines,
    sectionSalles,
    emptySallesTitre,
    emptySallesCorps,
    sectionRecentes,
    sectionRecentesSousTitre,
    liveKitTitre,
    liveKitAmorce,
    liveKitLien,
    agendaLien,
  ] = await Promise.all([
    listerSallesDecider(),
    listerProchainesReunionsToutesSalles(10),
    listerDernieresReunionsAvecPV(6),
    estAdminCourant(),
    lireContenuEditorial('s-informer.decider.intro', { valeurMd: FALLBACKS.intro }),
    lireContenuEditorial('s-informer.decider.section_prochaines', {
      valeurMd: FALLBACKS.sectionProchaines,
    }),
    lireContenuEditorial('s-informer.decider.section_salles', {
      valeurMd: FALLBACKS.sectionSalles,
    }),
    lireContenuEditorial('s-informer.decider.empty_salles_titre', {
      valeurMd: FALLBACKS.emptySallesTitre,
    }),
    lireContenuEditorial('s-informer.decider.empty_salles_corps', {
      valeurMd: FALLBACKS.emptySallesCorps,
    }),
    lireContenuEditorial('s-informer.decider.section_recentes', {
      valeurMd: FALLBACKS.sectionRecentes,
    }),
    lireContenuEditorial('s-informer.decider.section_recentes_sous_titre', {
      valeurMd: FALLBACKS.sectionRecentesSousTitre,
    }),
    lireContenuEditorial('s-informer.decider.livekit_titre', {
      valeurMd: FALLBACKS.liveKitTitre,
    }),
    lireContenuEditorial('s-informer.decider.livekit_amorce', {
      valeurMd: FALLBACKS.liveKitAmorce,
    }),
    lireContenuEditorial('s-informer.decider.livekit_lien', { valeurMd: FALLBACKS.liveKitLien }),
    lireContenuEditorial('s-informer.decider.agenda_lien', { valeurMd: FALLBACKS.agendaLien }),
  ]);

  return (
    <Container taille="lg" className="py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <header>
          <p className="text-xs font-bold uppercase tracking-cap text-text-3">S'informer</p>
          <Heading niveau={1}>Décider</Heading>
          <TexteEditableAdmin
            cle="s-informer.decider.intro"
            valeurInitiale={intro.valeurMd}
            estAdmin={estAdmin}
            libelle="intro page decider"
            multilignes
            longueurMax={400}
          >
            {(t) => <p className="mt-3 max-w-2xl text-text-2">{t}</p>}
          </TexteEditableAdmin>
        </header>
        <BoutonAdminEditer href="/admin/national">Admin</BoutonAdminEditer>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card variant="ombre" className="grid gap-1">
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Mode 1</p>
          <p className="font-bold text-text-1">Consensus</p>
          <p className="text-sm text-text-2">Accord plein de toutes les personnes présentes.</p>
        </Card>
        <Card variant="ombre" className="grid gap-1">
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Mode 2</p>
          <p className="font-bold text-text-1">Levée d'objections</p>
          <p className="text-sm text-text-2">
            Décision validée si aucune objection bloquante n'est levée.
          </p>
        </Card>
        <Card variant="ombre" className="grid gap-1">
          <p className="font-bold text-text-3 text-xs uppercase tracking-cap">Mode 3</p>
          <p className="font-bold text-text-1">Jugement majoritaire</p>
          <p className="text-sm text-text-2">
            Méthode Balinski-Laraki. 7 mentions, médiane retenue.
          </p>
        </Card>
      </section>

      {prochaines.length > 0 ? (
        <section className="mt-12">
          <Heading niveau={2} apparenceComme={3}>
            <Clock size={20} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
            <TexteEditableAdmin
              cle="s-informer.decider.section_prochaines"
              valeurInitiale={sectionProchaines.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section prochaines reunions (le compteur s'ajoute apres)"
              longueurMax={60}
            >
              {(t) => (
                <>
                  {t} ({prochaines.length})
                </>
              )}
            </TexteEditableAdmin>
          </Heading>
          <ul className="mt-4 grid gap-2">
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
                        {FORMATEUR_REUNION.format(new Date(r.debutLe))}
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
        </section>
      ) : null}

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          <Video size={20} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="s-informer.decider.section_salles"
            valeurInitiale={sectionSalles.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section salles de decision"
            longueurMax={60}
          >
            {(t) => (
              <>
                {t} ({salles.length})
              </>
            )}
          </TexteEditableAdmin>
        </Heading>

        {salles.length === 0 ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="s-informer.decider.empty_salles_titre"
                valeurInitiale={emptySallesTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre empty state salles decider"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
            className="mt-4"
          >
            <TexteEditableAdmin
              cle="s-informer.decider.empty_salles_corps"
              valeurInitiale={emptySallesCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps empty state salles decider"
              multilignes
              longueurMax={400}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {salles.map((s) => {
              const IconeVisibilite = ICONE_VISIBILITE[s.typeVisibilite] ?? Lock;
              return (
                <li key={s.id}>
                  <Link href={`/s-informer/decider/${s.slug}`} className="block hover:opacity-90">
                    <Card variant="ombre" className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info">{LIBELLE_ESPACE[s.espaceType] ?? s.espaceType}</Badge>
                        <Badge variant="default">
                          <IconeVisibilite size={12} aria-hidden="true" />
                          {LIBELLE_VISIBILITE[s.typeVisibilite] ?? s.typeVisibilite}
                        </Badge>
                      </div>
                      <h3 className="font-display font-bold text-lg text-text-1">{s.nom}</h3>
                      {s.description !== null ? (
                        <p className="line-clamp-2 text-sm text-text-2">{s.description}</p>
                      ) : null}
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {recentes.length > 0 ? (
        <section className="mt-12">
          <Heading niveau={2} apparenceComme={3}>
            <CheckCircle size={20} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
            <TexteEditableAdmin
              cle="s-informer.decider.section_recentes"
              valeurInitiale={sectionRecentes.valeurMd}
              estAdmin={estAdmin}
              libelle="titre section decisions recentes"
              longueurMax={60}
            >
              {(t) => (
                <>
                  {t} ({recentes.length})
                </>
              )}
            </TexteEditableAdmin>
          </Heading>
          <TexteEditableAdmin
            cle="s-informer.decider.section_recentes_sous_titre"
            valeurInitiale={sectionRecentesSousTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="sous-titre section decisions recentes"
            longueurMax={200}
          >
            {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
          </TexteEditableAdmin>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
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
                    <p className="text-text-3 text-xs">
                      Terminée le {FORMATEUR_REUNION.format(new Date(r.debutLe))} · PV disponible
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Alert
        variant="info"
        titre={
          <TexteEditableAdmin
            cle="s-informer.decider.livekit_titre"
            valeurInitiale={liveKitTitre.valeurMd}
            estAdmin={estAdmin}
            libelle="titre alerte LiveKit"
            longueurMax={60}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        }
        className="mt-12"
      >
        <TexteEditableAdmin
          cle="s-informer.decider.livekit_amorce"
          valeurInitiale={liveKitAmorce.valeurMd}
          estAdmin={estAdmin}
          libelle="amorce alerte LiveKit (avant le lien gouvernance)"
          multilignes
          longueurMax={500}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>{' '}
        <TexteEditableAdmin
          cle="s-informer.decider.livekit_lien"
          valeurInitiale={liveKitLien.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle lien gouvernance"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/comprendre/assemblee-confederale" className="text-brand hover:underline">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
        .
      </Alert>

      <section className="mt-8 flex items-center gap-2 text-sm text-text-3">
        <CalendarRange size={14} aria-hidden="true" />
        <TexteEditableAdmin
          cle="s-informer.decider.agenda_lien"
          valeurInitiale={agendaLien.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle lien vers l'agenda en bas"
          longueurMax={100}
        >
          {(t) => (
            <Link href="/agenda" className="hover:underline">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </section>
    </Container>
  );
}
