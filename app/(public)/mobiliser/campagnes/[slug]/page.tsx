import { archiverCampagneAction } from '@/app/actions/archivage';
import { BoutonAdminEditer } from '@/components/admin/BoutonAdminEditer';
import { BoutonArchiverEntite } from '@/components/admin/BoutonArchiverEntite';
import { BoutonSupprimerEntite } from '@/components/admin/BoutonSupprimerEntite';
import { BoutonAppartenanceCampagne } from '@/components/campagnes/BoutonAppartenanceCampagne';
import { FilCommentaires } from '@/components/commentaires/FilCommentaires';
import { FilDeGroupe } from '@/components/fil-groupe/FilDeGroupe';
import { BoutonSuivreEspace } from '@/components/reseau/BoutonSuivreEspace';
import { LienAuteurReseau } from '@/components/reseau/LienAuteurReseau';
import { RenduRiche } from '@/components/rich-text/RenduRiche';
import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import { type ModuleResolu, campagneParSlug } from '@/lib/campagnes/requetes';
import { compterMembresEspace, formaterMembres } from '@/lib/compter-membres';
import { metadataPourPartage } from '@/lib/og-metadata';
import { jeSuisCetEspace } from '@/lib/reseau/abonnement';
import { getSupabaseServer } from '@/lib/supabase';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

const LIBELLE_TYPE_MODULE: Record<string, string> = {
  petition: 'Pétition',
  mobilisation: 'Mobilisation',
  cagnotte: 'Cagnotte',
  sondage: 'Sondage',
  page_editoriale: 'Page éditoriale',
};

const ROUTE_TYPE_MODULE: Record<string, (slug: string) => string> = {
  petition: (slug) => `/mobiliser/petitions/${slug}`,
  mobilisation: (slug) => `/mobiliser/mobilisations/${slug}`,
  cagnotte: (slug) => `/mobiliser/cagnottes/${slug}`,
  sondage: (slug) => `/decider/sondages/${slug}`,
};

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const campagne = await campagneParSlug(slug);
  if (campagne === null) {
    return { title: 'Campagne introuvable' };
  }
  return metadataPourPartage({
    objet: {
      titre: campagne.titre,
      description: campagne.texte,
      image_url: campagne.image_url,
      type_objet: 'campagne',
    },
    cheminPage: `/mobiliser/campagnes/${slug}`,
  });
}

/**
 * Fiche détail d'une campagne avec ses modules.
 *
 * Pour chaque module, on rend une carte cliquable vers la cible
 * (pétition, mobilisation, ...) ou le texte intégral pour les pages
 * éditoriales. Les modules d'un type pas encore implémenté (cagnotte,
 * sondage) s'affichent avec un état « bientôt disponible ».
 */
export default async function PageCampagneDetail({ params }: PageDetailProps) {
  const estAdmin = await estAdminCourant();
  const { slug } = await params;
  const campagne = await campagneParSlug(slug);

  if (campagne === null) {
    notFound();
  }

  const estPubliee = campagne.statut === 'publiee';
  const session = await getSession();
  const nbMembres = estPubliee ? await compterMembresEspace('campagne', campagne.id) : 0;

  // V2.3.34 : appartenance courante (pour le bouton Rejoindre/Quitter).
  let estMembre = false;
  if (session !== null && estPubliee) {
    const supabase = await getSupabaseServer();
    const { data: appartenance } = await supabase
      .from('appartenance_campagne')
      .select('id')
      .eq('personne_id', session.userId)
      .eq('campagne_id', campagne.id)
      .eq('est_active', true)
      .maybeSingle();
    estMembre = appartenance !== null;
  }

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/mobiliser/campagnes" className="hover:text-brand">
          ← Toutes les campagnes
        </Link>
      </p>

      <article className="grid gap-8">
        <header className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-cap text-text-3">
              Campagne {estPubliee ? `· ${formaterMembres(nbMembres)}` : ''}
            </p>
            <BoutonAdminEditer href="/admin/moderation/campagnes">Admin</BoutonAdminEditer>
          </div>
          <Heading niveau={1}>{campagne.titre}</Heading>

          {campagne.image_url !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
              <Image
                src={campagne.image_url}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}

          {session !== null && estPubliee ? (
            <BoutonAppartenanceCampagne campagneId={campagne.id} estMembreInitial={estMembre} />
          ) : null}

          {/* Chantier C : suivre la campagne dans le réseau social, distinct de
              l'appartenance (suivre ses publications sans la rejoindre). */}
          {session !== null && estPubliee ? (
            <BoutonSuivreEspace
              espaceType="campagne"
              espaceId={campagne.id}
              espaceNom={campagne.titre}
              jeSuisInitial={await jeSuisCetEspace('campagne', campagne.id)}
              cheminRevalidation={`/mobiliser/campagnes/${slug}`}
            />
          ) : null}
        </header>

        {!estPubliee ? (
          <Alert
            variant={campagne.statut === 'rejetee' ? 'danger' : 'warning'}
            titre={
              campagne.statut === 'en_moderation'
                ? 'En attente de modération'
                : campagne.statut === 'rejetee'
                  ? 'Campagne rejetée'
                  : 'Campagne archivée'
            }
          >
            {campagne.statut === 'en_moderation' ? (
              <>L'équipe Maintenant! examine ta campagne. Délai habituel : 24 à 48 heures.</>
            ) : campagne.statut === 'rejetee' ? (
              <>
                Raison : {campagne.raison_rejet ?? 'non précisée'}. Tu peux soumettre une nouvelle
                version.
              </>
            ) : (
              <>Cette campagne est archivée.</>
            )}
          </Alert>
        ) : null}

        <section className="grid gap-4">
          <Heading niveau={2} apparenceComme={3}>
            Présentation
          </Heading>
          {(() => {
            // V2.5.50 — priorité au HTML riche s'il est posé (déjà sanitizé
            // au save). Fallback texte brut whitespace-pre-line.
            const html = (campagne as { texte_html?: string | null }).texte_html ?? null;
            if (html !== null && html.trim() !== '') {
              return <RenduRiche valeurHtml={html} className="text-text-2 leading-relaxed" />;
            }
            return (
              <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
                {campagne.texte}
              </div>
            );
          })()}
        </section>

        {campagne.modules.length > 0 ? (
          <section className="grid gap-4">
            <Heading niveau={2} apparenceComme={3}>
              Modules de la campagne
            </Heading>
            <ul className="grid gap-3">
              {campagne.modules.map((module) => (
                <li key={module.id}>
                  <RenduModule module={module} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {campagne.createurice_prenom !== null || campagne.createurice_nom !== null ? (
            <p>
              Lancée par{' '}
              <LienAuteurReseau
                personneId={campagne.createurice_id}
                nom={[campagne.createurice_prenom, campagne.createurice_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
                className="font-bold text-text-2"
              />
              .
            </p>
          ) : null}
        </footer>

        {/* Fil de discussion de la campagne (cycle V2 §18, V2.2.1 + V2.3.6).
            En V2.2.1, est_membre_espace('campagne', id) renvoie true pour
            tout authentifié faute de table d'appartenance dédiée à la
            campagne — donc le fil est ouvert à tous les comptes. À
            durcir quand une table d'appartenance campagne sera créée. */}
        {estPubliee && session !== null ? (
          <FilDeGroupe
            espaceType="campagne"
            espaceId={campagne.id}
            cheminRevalidation={`/mobiliser/campagnes/${slug}`}
          />
        ) : null}

        <FilCommentaires
          objetType="campagne"
          objetId={campagne.id}
          cheminRevalidation={`/mobiliser/campagnes/${slug}`}
        />
      </article>

      {estAdmin ? (
        <section
          aria-label="Actions admin"
          className="mt-12 grid gap-3 border-t border-border pt-8"
        >
          <Heading niveau={2} apparenceComme={4}>
            Actions admin
          </Heading>
          {campagne.statut !== 'archivee' ? (
            <BoutonArchiverEntite
              id={campagne.id}
              action={archiverCampagneAction}
              verbe="Archiver la campagne"
              description="Statut → 'archivee'. La campagne disparaît de la liste publique."
              labelRaison="Raison de l'archivage (optionnelle)"
            />
          ) : null}
          <BoutonSupprimerEntite
            table="campagne"
            id={campagne.id}
            redirigerVers="/mobiliser/campagnes"
          />
        </section>
      ) : null}
    </Container>
  );
}

function RenduModule({ module }: { module: ModuleResolu }) {
  if (module.type_module === 'page_editoriale') {
    return (
      <Card variant="ombre" className="grid gap-2">
        <Badge variant="default">{LIBELLE_TYPE_MODULE.page_editoriale}</Badge>
        <div className="whitespace-pre-line text-sm text-text-2 leading-relaxed">
          {module.contenu_editorial}
        </div>
      </Card>
    );
  }

  const route = ROUTE_TYPE_MODULE[module.type_module];
  const cibleIndisponible = module.titre_cible === null;

  return (
    <Card variant="ombre" className="flex flex-col gap-2">
      <Badge variant="default">
        {LIBELLE_TYPE_MODULE[module.type_module] ?? module.type_module}
      </Badge>
      {cibleIndisponible ? (
        <p className="text-sm text-text-3">
          La cible de ce module n'est pas (encore) disponible publiquement (cf. chantiers 3.3 et 7.5
          pour les cagnottes et sondages).
        </p>
      ) : (
        <h4 className="text-base font-bold text-text-1">
          {route !== undefined && module.slug_cible !== null ? (
            <Link href={route(module.slug_cible)} className="underline-offset-4 hover:underline">
              {module.titre_cible} →
            </Link>
          ) : (
            module.titre_cible
          )}
        </h4>
      )}
    </Card>
  );
}
