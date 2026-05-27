import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  LIBELLE_MODE,
  LIBELLE_STATUT,
  chargerSalleParSlug,
  listerReunionsSalle,
} from '@/lib/decider';
import { CalendarRange, FileText, Video } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormulairePlanifierReunion } from './FormulairePlanifierReunion';

const FALLBACKS = {
  retour: '← Toutes les salles',
  sectionAVenir: 'Réunions à venir',
  alertVideTitre: 'Aucune réunion planifiée',
  alertVideCorps:
    'Reviens bientôt — les réunions sont annoncées au moins 15 jours avant (cf. gouvernance assemblée confédérale).',
  sectionPassees: 'Réunions passées',
  passeesVide: 'Aucune réunion passée à afficher.',
  pvDisponible: 'PV disponible — cliquer pour lire.',
  pvAbsent: 'PV pas encore publié.',
};

interface Props {
  params: Promise<{ slug: string }>;
}

const FORMATEUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const salle = await chargerSalleParSlug(slug);
  return {
    title: salle !== null ? `Décider — ${salle.nom}` : 'Salle introuvable',
    description: salle?.description ?? undefined,
  };
}

/**
 * Page individuelle d'une salle Décider (V2.4.10).
 */
export default async function PageSalleDecider({ params }: Props) {
  const { slug } = await params;
  const salle = await chargerSalleParSlug(slug);
  if (salle === null) notFound();

  const [
    aVenir,
    passees,
    estAdmin,
    retour,
    sectionAVenir,
    alertVideTitre,
    alertVideCorps,
    sectionPassees,
    passeesVide,
    pvDisponible,
    pvAbsent,
  ] = await Promise.all([
    listerReunionsSalle(salle.id, { aVenir: true, limite: 10 }),
    listerReunionsSalle(salle.id, { aVenir: false, limite: 20 }),
    estAdminCourant(),
    lireContenuEditorial('decider.salle.retour', { valeurMd: FALLBACKS.retour }),
    lireContenuEditorial('decider.salle.section_a_venir', {
      valeurMd: FALLBACKS.sectionAVenir,
    }),
    lireContenuEditorial('decider.salle.alert_vide_titre', {
      valeurMd: FALLBACKS.alertVideTitre,
    }),
    lireContenuEditorial('decider.salle.alert_vide_corps', {
      valeurMd: FALLBACKS.alertVideCorps,
    }),
    lireContenuEditorial('decider.salle.section_passees', {
      valeurMd: FALLBACKS.sectionPassees,
    }),
    lireContenuEditorial('decider.salle.passees_vide', { valeurMd: FALLBACKS.passeesVide }),
    lireContenuEditorial('decider.salle.pv_disponible', { valeurMd: FALLBACKS.pvDisponible }),
    lireContenuEditorial('decider.salle.pv_absent', { valeurMd: FALLBACKS.pvAbsent }),
  ]);
  // Sépare passées : statut terminee/annulee
  const reunionsPassees = passees.filter((r) => r.statut === 'terminee' || r.statut === 'annulee');

  return (
    <Container taille="md" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">
        <TexteEditableAdmin
          cle="decider.salle.retour"
          valeurInitiale={retour.valeurMd}
          estAdmin={estAdmin}
          libelle="lien retour vers liste salles"
          longueurMax={40}
        >
          {(t) => (
            <Link href="/s-informer/decider" className="hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Heading niveau={1}>
          <Video size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
          {salle.nom}
        </Heading>
        <BoutonAdminEditer href="/admin/national">Admin</BoutonAdminEditer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="info">{salle.espaceType}</Badge>
        <Badge variant="default">{salle.typeVisibilite}</Badge>
      </div>
      {salle.description !== null ? <p className="mt-4 text-text-2">{salle.description}</p> : null}

      {estAdmin ? <FormulairePlanifierReunion salleId={salle.id} /> : null}

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          <CalendarRange size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="decider.salle.section_a_venir"
            valeurInitiale={sectionAVenir.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section reunions a venir"
            longueurMax={40}
          >
            {(t) => (
              <>
                {t} ({aVenir.length})
              </>
            )}
          </TexteEditableAdmin>
        </Heading>
        {aVenir.length === 0 ? (
          <Alert
            variant="info"
            titre={
              <TexteEditableAdmin
                cle="decider.salle.alert_vide_titre"
                valeurInitiale={alertVideTitre.valeurMd}
                estAdmin={estAdmin}
                libelle="titre alerte aucune reunion planifiee"
                longueurMax={60}
              >
                {(t) => <>{t}</>}
              </TexteEditableAdmin>
            }
            className="mt-3"
          >
            <TexteEditableAdmin
              cle="decider.salle.alert_vide_corps"
              valeurInitiale={alertVideCorps.valeurMd}
              estAdmin={estAdmin}
              libelle="corps alerte aucune reunion planifiee"
              multilignes
              longueurMax={400}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          </Alert>
        ) : (
          <ul className="mt-3 grid gap-2">
            {aVenir.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/s-informer/decider/${slug}/${r.id}`}
                  className="block hover:opacity-90"
                >
                  <Card variant="ombre" className="grid gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="success">{LIBELLE_STATUT[r.statut]}</Badge>
                      <Badge variant="info">{LIBELLE_MODE[r.modeDecision]}</Badge>
                    </div>
                    <h3 className="font-display font-bold text-lg text-text-1">{r.titre}</h3>
                    <p className="text-text-3 text-xs">
                      {FORMATEUR.format(new Date(r.debutLe))}
                      {r.finLe !== null ? ` → ${FORMATEUR.format(new Date(r.finLe))}` : ''}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          <FileText size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="decider.salle.section_passees"
            valeurInitiale={sectionPassees.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section reunions passees"
            longueurMax={40}
          >
            {(t) => (
              <>
                {t} ({reunionsPassees.length})
              </>
            )}
          </TexteEditableAdmin>
        </Heading>
        {reunionsPassees.length === 0 ? (
          <TexteEditableAdmin
            cle="decider.salle.passees_vide"
            valeurInitiale={passeesVide.valeurMd}
            estAdmin={estAdmin}
            libelle="message empty reunions passees"
            longueurMax={100}
          >
            {(t) => <p className="mt-3 text-sm text-text-3">{t}</p>}
          </TexteEditableAdmin>
        ) : (
          <ul className="mt-3 grid gap-2">
            {reunionsPassees.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/s-informer/decider/${slug}/${r.id}`}
                  className="block hover:opacity-90"
                >
                  <Card variant="plat" className="grid gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant={r.statut === 'terminee' ? 'success' : 'default'}>
                        {LIBELLE_STATUT[r.statut]}
                      </Badge>
                      <span className="text-text-3 text-xs">
                        {FORMATEUR.format(new Date(r.debutLe))}
                      </span>
                    </div>
                    <h3 className="font-bold text-text-1">{r.titre}</h3>
                    {r.pvMd !== null && r.pvMd !== '' ? (
                      <TexteEditableAdmin
                        cle="decider.salle.pv_disponible"
                        valeurInitiale={pvDisponible.valeurMd}
                        estAdmin={estAdmin}
                        libelle="indication PV disponible"
                        longueurMax={100}
                      >
                        {(t) => <p className="text-text-2 text-sm">{t}</p>}
                      </TexteEditableAdmin>
                    ) : (
                      <TexteEditableAdmin
                        cle="decider.salle.pv_absent"
                        valeurInitiale={pvAbsent.valeurMd}
                        estAdmin={estAdmin}
                        libelle="indication PV pas encore publie"
                        longueurMax={100}
                      >
                        {(t) => <p className="text-text-3 text-xs">{t}</p>}
                      </TexteEditableAdmin>
                    )}
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
