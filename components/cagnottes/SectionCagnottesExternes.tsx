import { listerCagnottesExternesPubliees } from '@/lib/cagnottes-externes';
import { formaterEurosDepuisCentimes } from '@/lib/format-euros';

/**
 * Section publique « Soutenir des causes solidaires ailleurs » (V2.6.124,
 * demande Ben) : collectes curées sur d'autres plateformes (Ulule…), validées
 * a priori par l'admin. DISTINCTE des cagnottes Maintenant! : ce sont des
 * liens sortants, le don se fait sur la plateforme d'origine. Rien n'est
 * affiché tant qu'aucune collecte n'est validée (la section disparaît).
 */
export async function SectionCagnottesExternes() {
  const items = await listerCagnottesExternesPubliees();
  if (items.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-xs font-bold uppercase tracking-cap text-text-3">
        Soutenir des causes solidaires ailleurs
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-text-2">
        Des collectes repérées sur d'autres plateformes, en cohérence avec le mouvement. Elles ne
        sont pas portées par Maintenant! : le soutien se fait sur la plateforme d'origine.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => {
          const pct = c.pourcentage !== null ? Math.min(100, Math.max(0, c.pourcentage)) : null;
          return (
            <li key={c.id}>
              <article className="flex h-full flex-col gap-2 rounded-lg border border-border bg-surface p-4">
                <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-cap">
                  <span className="rounded-sm bg-brand/10 px-1.5 py-0.5 text-brand">
                    {c.plateforme}
                  </span>
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
                  <h3 className="text-base font-bold leading-snug text-text-1">{c.titre}</h3>
                </a>
                {c.resume !== null ? (
                  <p className="line-clamp-3 text-sm text-text-2">{c.resume}</p>
                ) : null}

                {pct !== null || c.objectif_centimes !== null ? (
                  <div className="mt-auto grid gap-1 pt-2">
                    {pct !== null ? (
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-2"
                        aria-hidden="true"
                      >
                        <div className="h-full rounded-pill bg-grad" style={{ width: `${pct}%` }} />
                      </div>
                    ) : null}
                    <p className="text-xs text-text-3">
                      {c.collecte_centimes !== null
                        ? `${formaterEurosDepuisCentimes(c.collecte_centimes)} collectés`
                        : ''}
                      {c.objectif_centimes !== null
                        ? ` · objectif ${formaterEurosDepuisCentimes(c.objectif_centimes)}`
                        : ''}
                      {pct !== null ? ` · ${Math.round(pct)} %` : ''}
                    </p>
                  </div>
                ) : null}

                {c.themes.length > 0 ? (
                  <p className="flex flex-wrap gap-1.5">
                    {c.themes.slice(0, 4).map((t) => (
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
                  className="text-sm font-bold text-brand hover:underline"
                >
                  Soutenir sur {c.plateforme} ↗
                </a>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
