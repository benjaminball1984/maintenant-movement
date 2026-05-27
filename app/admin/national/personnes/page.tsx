import { Alert, Badge, Card, Heading, Pagination } from '@/components/ui';
import { type OptionsListePersonnes, listerPersonnesAdminPagine } from '@/lib/admin/personnes';
import { lirePageDepuisParams, paginer } from '@/lib/pagination';
import { compter } from '@/lib/pluriel';
import { CheckCircle, Mail, ShieldOff, UserX, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Personnes — Admin',
};

const FORMATEUR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const STATUTS: Array<{ value: NonNullable<OptionsListePersonnes['statut']>; label: string }> = [
  { value: 'tous', label: 'Tous' },
  { value: 'actif', label: 'Actifs' },
  { value: 'anonymise', label: 'Anonymisés' },
  { value: 'suppression_demandee', label: 'Suppression demandée' },
];

interface Props {
  searchParams: Promise<{ q?: string; statut?: string; page?: string }>;
}

const PAR_PAGE = 50;

/**
 * Page `/admin/national/personnes` (V2.4.29).
 *
 * Liste les comptes personne avec recherche par mot-clé (email / prénom /
 * nom) et filtre par statut. Lecture seule pour le moment ; les actions
 * d'anonymisation / suppression se font ailleurs (RGPD §5).
 */
export default async function PageAdminPersonnes({ searchParams }: Props) {
  const sp = await searchParams;
  const motCle = sp.q?.trim() ?? '';
  const statutFiltre = (STATUTS.find((s) => s.value === sp.statut)?.value ?? 'tous') as
    | 'tous'
    | 'actif'
    | 'anonymise'
    | 'suppression_demandee';

  const pageDemandee = lirePageDepuisParams(sp);
  // 1er appel pour connaître le total : on demande la 1ʳᵉ page avec count exact.
  const premier = await listerPersonnesAdminPagine({
    motCle: motCle === '' ? undefined : motCle,
    statut: statutFiltre,
    limite: PAR_PAGE,
    debutIdx: 0,
  });
  const pagination = paginer({
    page: pageDemandee,
    parPage: PAR_PAGE,
    total: premier.total,
  });
  // Si la page demandée n'est pas la 1ʳᵉ, on refait un appel avec le bon range.
  const resultat =
    pagination.page === 1
      ? premier
      : await listerPersonnesAdminPagine({
          motCle: motCle === '' ? undefined : motCle,
          statut: statutFiltre,
          limite: PAR_PAGE,
          debutIdx: pagination.debutIdx,
        });
  const personnes = resultat.lignes;

  return (
    <>
      <Heading niveau={1}>
        <Users size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Personnes
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        Lecture seule. Recherche par email / prénom / nom. Limite 100 résultats par page.{' '}
        <a
          href="/admin/national/personnes/export.csv"
          className="text-brand hover:underline"
          download
        >
          Export CSV (5000 max) ↓
        </a>
      </p>

      <form
        method="get"
        action="/admin/national/personnes"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={motCle}
          placeholder="email, prénom, nom…"
          className="rounded-md border border-border bg-surface p-2"
        />
        <select
          name="statut"
          defaultValue={statutFiltre}
          className="rounded-md border border-border bg-surface p-2"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 font-bold text-white hover:brightness-110"
        >
          Filtrer
        </button>
      </form>

      <p className="mt-4 text-text-3 text-xs">
        {compter(premier.total, 'résultat')} · page {pagination.page} sur {pagination.nbPages}
      </p>

      {personnes.length === 0 ? (
        <Alert variant="info" titre="Aucune personne" className="mt-3">
          Aucune personne ne correspond aux critères. Essaie un autre filtre.
        </Alert>
      ) : (
        <ul className="mt-3 grid gap-2">
          {personnes.map((p) => {
            const nomAffiche =
              [p.prenom, p.nom].filter((s) => s !== null && s.trim() !== '').join(' ') ||
              p.email ||
              '(sans nom)';
            return (
              <li key={p.id}>
                <Card variant="ombre" className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-bold text-text-1">{nomAffiche}</p>
                    <p className="text-text-3 text-xs">
                      <code className="font-mono">{p.email ?? '(pas d’email)'}</code> ·{' '}
                      <code className="font-mono">{p.id}</code>
                    </p>
                    <p className="mt-1 text-text-3 text-xs">
                      Inscrit le {FORMATEUR_DATE.format(new Date(p.createdAt))}
                      {p.derniereConnexionLe !== null
                        ? ` · dernière connexion ${FORMATEUR_DATE.format(new Date(p.derniereConnexionLe))}`
                        : ' · jamais connecté·e'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-center">
                    {p.emailVerifie ? (
                      <Badge variant="success">
                        <CheckCircle size={12} aria-hidden="true" />
                        Email vérifié
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Mail size={12} aria-hidden="true" />
                        Email non vérifié
                      </Badge>
                    )}
                    {p.anonymiseLe !== null ? (
                      <Badge variant="default">
                        <ShieldOff size={12} aria-hidden="true" />
                        Anonymisé
                      </Badge>
                    ) : null}
                    {p.suppressionDemandeeLe !== null ? (
                      <Badge variant="danger">
                        <UserX size={12} aria-hidden="true" />
                        Suppression demandée
                      </Badge>
                    ) : null}
                    <Link
                      href={`/admin/national/droits?personne=${p.id}`}
                      className="text-brand text-xs hover:underline"
                    >
                      Droits →
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={pagination.page}
        nbPages={pagination.nbPages}
        href="/admin/national/personnes"
        paramsAPreserver={{ q: motCle, statut: statutFiltre }}
      />
    </>
  );
}
