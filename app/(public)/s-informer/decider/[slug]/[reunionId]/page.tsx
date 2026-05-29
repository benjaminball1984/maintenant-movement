import { MarkdownLeger } from '@/components/contenu/MarkdownLeger';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { RenduRiche } from '@/components/rich-text/RenduRiche';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  LIBELLE_MODE,
  LIBELLE_STATUT,
  chargerReunionParId,
  chargerSalleParSlug,
} from '@/lib/decider';
import { formaterDateLongueHeure } from '@/lib/format-date';
import { ArrowLeft, CalendarRange, FileText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormulaireMajReunion } from './FormulaireMajReunion';

interface Props {
  params: Promise<{ slug: string; reunionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, reunionId } = await params;
  const [salle, reunion] = await Promise.all([
    chargerSalleParSlug(slug),
    chargerReunionParId(reunionId),
  ]);
  if (salle === null || reunion === null) return { title: 'Réunion introuvable' };
  return {
    title: `${reunion.titre} — ${salle.nom}`,
    description: reunion.ordreJourMd.slice(0, 200),
  };
}

/**
 * Page individuelle d'une réunion Décider (V2.4.18).
 *
 * Affiche l'OJ et le PV (rendus Markdown). Les admins voient un
 * formulaire d'édition inline (OJ, PV, transition de statut).
 */
export default async function PageReunion({ params }: Props) {
  const { slug, reunionId } = await params;
  const [
    salle,
    reunion,
    estAdmin,
    sectionOj,
    ojVide,
    sectionPv,
    pvAttenteFin,
    pvAnnule,
    pvPlanifie,
    sectionAdmin,
    alertJugementTitre,
    alertJugementCorps,
  ] = await Promise.all([
    chargerSalleParSlug(slug),
    chargerReunionParId(reunionId),
    estAdminCourant(),
    lireContenuEditorial('reunion.fiche.section_oj', { valeurMd: 'Ordre du jour' }),
    lireContenuEditorial('reunion.fiche.oj_vide', { valeurMd: "Pas d'ordre du jour publié." }),
    lireContenuEditorial('reunion.fiche.section_pv', { valeurMd: 'Procès-verbal' }),
    lireContenuEditorial('reunion.fiche.pv_attente_fin', {
      valeurMd: 'PV pas encore publié.',
    }),
    lireContenuEditorial('reunion.fiche.pv_annule', {
      valeurMd: 'Réunion annulée, pas de PV.',
    }),
    lireContenuEditorial('reunion.fiche.pv_planifie', {
      valeurMd: 'PV publié après la réunion.',
    }),
    lireContenuEditorial('reunion.fiche.section_admin', {
      valeurMd: 'Administration (réservé admins)',
    }),
    lireContenuEditorial('reunion.fiche.alert_jugement_titre', {
      valeurMd: 'Vote en jugement majoritaire',
    }),
    lireContenuEditorial('reunion.fiche.alert_jugement_corps', {
      valeurMd:
        "L'interface de vote (7 mentions Balinski-Laraki) arrive dans un chantier dédié. En attendant, le vote se tient en visio.",
    }),
  ]);
  if (salle === null || reunion === null) notFound();
  if (reunion.salleId !== salle.id) notFound();

  const couleurBadgeStatut: Record<typeof reunion.statut, 'success' | 'warning' | 'default'> = {
    planifiee: 'warning',
    en_cours: 'success',
    terminee: 'default',
    annulee: 'default',
  };

  return (
    <Container taille="md" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href={`/s-informer/decider/${slug}`} className="hover:text-brand">
          <ArrowLeft size={12} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          {salle.nom}
        </Link>
      </p>

      <header className="mt-2 grid gap-3">
        <Heading niveau={1}>{reunion.titre}</Heading>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={couleurBadgeStatut[reunion.statut]}>
            {LIBELLE_STATUT[reunion.statut]}
          </Badge>
          <Badge variant="info">{LIBELLE_MODE[reunion.modeDecision]}</Badge>
        </div>
        <p className="text-sm text-text-3">
          <CalendarRange size={14} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
          {formaterDateLongueHeure(reunion.debutLe)}
          {reunion.finLe !== null ? ` → ${formaterDateLongueHeure(reunion.finLe)}` : ''}
        </p>
      </header>

      <section className="mt-8">
        <TexteEditableAdmin
          cle="reunion.fiche.section_oj"
          valeurInitiale={sectionOj.valeurMd}
          estAdmin={estAdmin}
          libelle="titre section Ordre du jour"
          longueurMax={40}
        >
          {(t) => (
            <Heading niveau={2} apparenceComme={3}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <Card variant="ombre" className="mt-3">
          {(() => {
            // V2.5.37 — priorité au HTML riche s'il est posé (déjà sanitizé
            // au save). Fallback Markdown léger. Sinon message vide éditable.
            if (reunion.ordreJourHtml !== null && reunion.ordreJourHtml.trim() !== '') {
              return <RenduRiche valeurHtml={reunion.ordreJourHtml} />;
            }
            if (reunion.ordreJourMd !== '') return <MarkdownLeger texte={reunion.ordreJourMd} />;
            return (
              <TexteEditableAdmin
                cle="reunion.fiche.oj_vide"
                valeurInitiale={ojVide.valeurMd}
                estAdmin={estAdmin}
                libelle="message OJ vide"
                longueurMax={100}
              >
                {(t) => <p className="text-sm text-text-3 italic">{t}</p>}
              </TexteEditableAdmin>
            );
          })()}
        </Card>
      </section>

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          <FileText size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          <TexteEditableAdmin
            cle="reunion.fiche.section_pv"
            valeurInitiale={sectionPv.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section PV"
            longueurMax={30}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Heading>
        <Card variant="ombre" className="mt-3">
          {(() => {
            // V2.5.37 — priorité au HTML riche.
            if (reunion.pvHtml !== null && reunion.pvHtml.trim() !== '') {
              return <RenduRiche valeurHtml={reunion.pvHtml} />;
            }
            if (reunion.pvMd !== null && reunion.pvMd !== '') {
              return <MarkdownLeger texte={reunion.pvMd} />;
            }
            return (
              <p className="text-sm text-text-3 italic">
                {reunion.statut === 'terminee'
                  ? pvAttenteFin.valeurMd
                  : reunion.statut === 'annulee'
                    ? pvAnnule.valeurMd
                    : pvPlanifie.valeurMd}
              </p>
            );
          })()}
        </Card>
      </section>

      {estAdmin ? (
        <section className="mt-8">
          <TexteEditableAdmin
            cle="reunion.fiche.section_admin"
            valeurInitiale={sectionAdmin.valeurMd}
            estAdmin={estAdmin}
            libelle="titre section administration"
            longueurMax={60}
          >
            {(t) => (
              <Heading niveau={2} apparenceComme={3}>
                {t}
              </Heading>
            )}
          </TexteEditableAdmin>
          <FormulaireMajReunion
            reunionId={reunion.id}
            ordreJourInitial={reunion.ordreJourMd}
            ordreJourHtmlInitial={reunion.ordreJourHtml}
            pvInitial={reunion.pvMd ?? ''}
            pvHtmlInitial={reunion.pvHtml}
            statutInitial={reunion.statut}
          />
        </section>
      ) : null}

      {reunion.modeDecision === 'jugement_majoritaire' && reunion.statut === 'en_cours' ? (
        <Alert
          variant="info"
          titre={
            <TexteEditableAdmin
              cle="reunion.fiche.alert_jugement_titre"
              valeurInitiale={alertJugementTitre.valeurMd}
              estAdmin={estAdmin}
              libelle="titre alerte jugement majoritaire"
              longueurMax={60}
            >
              {(t) => <>{t}</>}
            </TexteEditableAdmin>
          }
          className="mt-8"
        >
          <TexteEditableAdmin
            cle="reunion.fiche.alert_jugement_corps"
            valeurInitiale={alertJugementCorps.valeurMd}
            estAdmin={estAdmin}
            libelle="corps alerte jugement majoritaire"
            multilignes
            longueurMax={300}
          >
            {(t) => <>{t}</>}
          </TexteEditableAdmin>
        </Alert>
      ) : null}
    </Container>
  );
}
