import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { listerSallesDecider } from '@/lib/decider';
import { getSupabaseServer } from '@/lib/supabase';
import { ExternalLink, Plus, Video } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireCreerSalle } from './FormulaireCreerSalle';

export const metadata: Metadata = {
  title: 'Décider — Console admin',
};

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Console admin national / Décider (V2.4.12).
 *
 * Liste les salles existantes + permet d'en créer une nouvelle via
 * formulaire inline. La création d'une réunion se fait depuis la page
 * individuelle de la salle (V2.4+ ultérieur).
 */
export default async function PageAdminDecider() {
  const salles = await listerSallesDecider();

  // Charge le nombre de réunions par salle pour info.
  const supabase = await getSupabaseServer();
  const { data: comptes } = await supabase
    .from('reunion_decider')
    .select('salle_id')
    .in('statut', ['planifiee', 'en_cours', 'terminee']);

  const nbParSalle = new Map<string, number>();
  for (const c of comptes ?? []) {
    nbParSalle.set(c.salle_id, (nbParSalle.get(c.salle_id) ?? 0) + 1);
  }

  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.decider.titre', { valeurMd: 'Décider — Console admin' }),
    lireContenuEditorial('admin.national.decider.intro', {
      valeurMd:
        "Gestion des salles de décision et des réunions. LiveKit pas encore branché ; l'infrastructure stocke salles + ordres du jour + PV.",
    }),
  ]);

  return (
    <>
      <Heading niveau={1}>
        <Video size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        <TexteEditableAdmin
          cle="admin.national.decider.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console decider admin"
          longueurMax={60}
        >
          {(t) => <>{t}</>}
        </TexteEditableAdmin>
      </Heading>
      <TexteEditableAdmin
        cle="admin.national.decider.intro"
        valeurInitiale={intro.valeurMd}
        estAdmin={estAdmin}
        libelle="intro console decider admin"
        multilignes
        longueurMax={300}
      >
        {(t) => <p className="mt-2 text-sm text-text-3">{t}</p>}
      </TexteEditableAdmin>

      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          <Plus size={18} className="-mt-0.5 mr-2 inline" aria-hidden="true" />
          Créer une salle
        </Heading>
        <div className="mt-4">
          <FormulaireCreerSalle />
        </div>
      </section>

      <section className="mt-12">
        <Heading niveau={2} apparenceComme={3}>
          Salles existantes ({salles.length})
        </Heading>
        {salles.length === 0 ? (
          <Alert variant="info" titre="Aucune salle créée" className="mt-3">
            Crée la première salle ci-dessus.
          </Alert>
        ) : (
          <ul className="mt-3 grid gap-2">
            {salles.map((s) => (
              <li key={s.id}>
                <Card variant="ombre" className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{s.espaceType}</Badge>
                      <Badge variant="default">{s.typeVisibilite}</Badge>
                    </div>
                    <span className="text-text-3 text-xs">
                      Créée le {FORMATEUR_DATE.format(new Date(s.createdAt))}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-text-1">{s.nom}</h3>
                  {s.description !== null ? (
                    <p className="text-sm text-text-2">{s.description}</p>
                  ) : null}
                  <p className="text-text-3 text-xs">
                    {nbParSalle.get(s.id) ?? 0} réunion(s) ·{' '}
                    <code className="font-mono">{s.slug}</code>
                  </p>
                  <Link
                    href={`/s-informer/decider/${s.slug}`}
                    className="inline-flex items-center gap-1 text-brand text-sm hover:underline"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Voir la page publique
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
