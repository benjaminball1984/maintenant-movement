'use client';

import { definirBadgeOfficielAction, traiterRevendicationAction } from '@/app/actions/organisation';
import { Alert, Badge, Button, Card } from '@/components/ui';
import type { OrganisationAffichee } from '@/lib/organisations/requetes';
import type { RevendicationAffichee } from '@/lib/organisations/revendications';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface Props {
  revendications: RevendicationAffichee[];
  organisations: OrganisationAffichee[];
}

/**
 * Console admin des organisations (épopée réseau V2, chantier B.3) :
 * - arbitrer les revendications de gestion (accepter → gestionnaire / refuser) ;
 * - accorder ou retirer le badge officiel.
 */
export function ConsoleOrganisationsAdmin({ revendications, organisations }: Props) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function agir(action: () => Promise<{ ok: boolean; message?: string }>) {
    setErreur(null);
    demarrer(async () => {
      const r = await action();
      if (!r.ok) setErreur(r.message ?? 'Action impossible.');
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-8">
      {erreur !== null ? <Alert variant="danger">{erreur}</Alert> : null}

      {/* File d'attente des revendications */}
      <section>
        <h2 className="mb-3 font-bold text-lg text-text-1">
          Revendications en attente ({revendications.length})
        </h2>
        {revendications.length === 0 ? (
          <p className="text-sm text-text-3">Aucune revendication à arbitrer.</p>
        ) : (
          <ul className="grid gap-3">
            {revendications.map((r) => (
              <li key={r.id}>
                <Card variant="ombre">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-text-1">
                        <a
                          href={`/organisations/${r.organisationSlug}`}
                          className="hover:text-brand"
                        >
                          {r.organisationNom}
                        </a>
                      </p>
                      <p className="text-sm text-text-2">
                        Demandé par {r.nom}
                        {r.numero !== null ? (
                          <span className="ml-1 font-mono text-text-3 text-xs">{r.numero}</span>
                        ) : null}
                      </p>
                      {r.message !== null && r.message.trim() !== '' ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-text-3">
                          « {r.message} »
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        taille="sm"
                        disabled={enCours}
                        onClick={() =>
                          agir(() =>
                            traiterRevendicationAction({ revendication_id: r.id, accepter: true }),
                          )
                        }
                      >
                        Accepter
                      </Button>
                      <Button
                        variant="ghost"
                        taille="sm"
                        disabled={enCours}
                        onClick={() =>
                          agir(() =>
                            traiterRevendicationAction({ revendication_id: r.id, accepter: false }),
                          )
                        }
                      >
                        Refuser
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Badge officiel par organisation */}
      <section>
        <h2 className="mb-3 font-bold text-lg text-text-1">
          Organisations ({organisations.length})
        </h2>
        {organisations.length === 0 ? (
          <p className="text-sm text-text-3">Aucune organisation.</p>
        ) : (
          <ul className="grid gap-2">
            {organisations.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3"
              >
                <span className="flex items-center gap-2">
                  <a
                    href={`/organisations/${o.slug}`}
                    className="font-bold text-text-1 hover:text-brand"
                  >
                    {o.nom}
                  </a>
                  {o.badgeOfficiel ? (
                    <Badge variant="brand">Officielle</Badge>
                  ) : (
                    <span className="text-text-3 text-xs">non officielle</span>
                  )}
                </span>
                <Button
                  variant="outline"
                  taille="sm"
                  disabled={enCours}
                  onClick={() =>
                    agir(() =>
                      definirBadgeOfficielAction({ org_id: o.id, officiel: !o.badgeOfficiel }),
                    )
                  }
                >
                  {o.badgeOfficiel ? 'Retirer le badge' : 'Accorder le badge'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
