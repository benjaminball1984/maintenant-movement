import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { listerPropositionsCagnottes } from '@/lib/cagnottes-externes';
import { formaterEurosDepuisCentimes } from '@/lib/format-euros';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BoutonsModeration } from './BoutonsModeration';

export const metadata: Metadata = { title: 'Modération : collectes externes' };
export const dynamic = 'force-dynamic';

/**
 * File de modération A PRIORI des collectes externes (V2.6.124, demande Ben).
 * Les propositions (statut `propose`) sont invisibles du public : l'admin
 * approuve (publie) ou rejette (jamais re-proposé) chaque collecte.
 */
export default async function PageModerationCagnottesExternes() {
  if (!(await estAdminCourant())) notFound();
  const propositions = await listerPropositionsCagnottes();

  return (
    <Container taille="lg" className="py-12">
      <p className="text-xs font-bold uppercase tracking-cap text-text-3">Modération</p>
      <Heading niveau={1} className="mt-1">
        Collectes externes à modérer
      </Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        {propositions.length} proposition{propositions.length > 1 ? 's' : ''} en attente. Repérées
        sur d'autres plateformes (Ulule…) et pré-filtrées par thèmes. Rien n'est public tant que
        vous n'avez pas approuvé. Un rejet est définitif (la collecte ne sera plus reproposée).
      </p>

      {propositions.length === 0 ? (
        <Alert variant="info" titre="Rien à modérer" className="mt-8">
          Aucune proposition en attente. Le prochain import en déposera de nouvelles.
        </Alert>
      ) : (
        <ul className="mt-8 grid gap-4">
          {propositions.map((c) => {
            const pct = c.pourcentage !== null ? Math.round(c.pourcentage) : null;
            return (
              <li key={c.id}>
                <article className="grid gap-3 rounded-lg border border-border bg-surface p-4 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="grid gap-2">
                    <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-cap">
                      <span className="rounded-sm bg-brand/10 px-1.5 py-0.5 text-brand">
                        {c.plateforme}
                      </span>
                      {c.type_collecte !== null ? (
                        <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-text-2">
                          {c.type_collecte}
                        </span>
                      ) : null}
                      {c.organisateur !== null ? (
                        <span className="text-text-3">{c.organisateur}</span>
                      ) : null}
                    </p>
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      <h2 className="text-lg font-bold leading-snug text-text-1">{c.titre}</h2>
                    </a>
                    {c.resume !== null ? (
                      <p className="line-clamp-3 text-sm text-text-2">{c.resume}</p>
                    ) : null}
                    <p className="text-xs text-text-3">
                      {c.collecte_centimes !== null
                        ? `${formaterEurosDepuisCentimes(c.collecte_centimes)} collectés`
                        : 'montant inconnu'}
                      {c.objectif_centimes !== null
                        ? ` · objectif ${formaterEurosDepuisCentimes(c.objectif_centimes)}`
                        : ''}
                      {pct !== null ? ` · ${pct} %` : ''}
                      {c.echeance !== null ? ` · échéance ${c.echeance.slice(0, 10)}` : ''}
                    </p>
                    {c.themes.length > 0 ? (
                      <p className="flex flex-wrap gap-1.5">
                        {c.themes.map((t) => (
                          <span
                            key={t}
                            className="rounded-pill border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-text-3"
                          >
                            {t}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-brand hover:underline"
                    >
                      Ouvrir sur {c.plateforme} ↗
                    </a>
                  </div>
                  <BoutonsModeration id={c.id} />
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
