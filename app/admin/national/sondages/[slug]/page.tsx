import { Alert, Badge, Card, Heading } from '@/components/ui';
import { type AnalyseSondage, analyserSondage } from '@/lib/admin/analyse-sondage';
import { SEUIL_CELLULE } from '@/lib/sondages/fiabilite';
import { BarChart3, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Analyse d’un sondage : Admin',
};

interface Props {
  params: Promise<{ slug: string }>;
}

/** Pourcentage entier d'une part (0–1). */
function pct(part: number): string {
  return `${Math.round(part * 100)} %`;
}

/** Couleur de tendance : écart entre le redressé et le brut (en points). */
function ecartPts(brutPart: number, pondPart: number): string {
  const d = Math.round((pondPart - brutPart) * 100);
  if (d === 0) return '—';
  return d > 0 ? `+${d}` : `${d}`;
}

function ResultatGlobal({ a }: { a: AnalyseSondage }) {
  return (
    <Card variant="ombre" className="mt-4 grid gap-3">
      <h2 className="font-bold text-text-1">Résultat global — brut vs redressé</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-border border-b text-left text-text-3 text-xs">
              <th className="py-1 pr-3">Option</th>
              <th className="py-1 pr-3 text-right">Votes</th>
              <th className="py-1 pr-3 text-right">Brut</th>
              <th className="py-1 pr-3 text-right">Redressé</th>
              <th className="py-1 text-right">Écart (pts)</th>
            </tr>
          </thead>
          <tbody>
            {a.options.map((opt, i) => {
              const brutPart = a.totalBrut > 0 ? (a.brut[i] ?? 0) / a.totalBrut : 0;
              const pondPart = a.totalPondere > 0 ? (a.pondere[i] ?? 0) / a.totalPondere : 0;
              return (
                <tr key={opt} className="border-border/50 border-b">
                  <td className="py-1.5 pr-3 text-text-1">{opt}</td>
                  <td className="py-1.5 pr-3 text-right text-text-3">{a.brut[i] ?? 0}</td>
                  <td className="py-1.5 pr-3 text-right text-text-2">{pct(brutPart)}</td>
                  <td className="py-1.5 pr-3 text-right font-bold text-text-1">{pct(pondPart)}</td>
                  <td className="py-1.5 text-right text-text-3">{ecartPts(brutPart, pondPart)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Fiabilite({ a }: { a: AnalyseSondage }) {
  const items: Array<{ label: string; valeur: string }> = [
    { label: 'Votes (n brut)', valeur: String(a.totalBrut) },
    { label: 'Taille effective (n eff.)', valeur: a.nEffectif.toFixed(1) },
    { label: 'Effet de plan', valeur: `× ${a.effetDePlan.toFixed(2)}` },
    { label: 'Marge d’erreur (95 %)', valeur: `± ${a.margeGlobalePts.toFixed(1)} pts` },
    { label: 'Variables de profil utilisées', valeur: String(a.variablesRenseignees) },
    { label: 'Calage', valeur: a.convergence ? `convergé (${a.iterations} it.)` : 'non convergé' },
  ];
  return (
    <Card variant="ombre" className="mt-4 grid gap-3">
      <h2 className="font-bold text-text-1">Fiabilité</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-md border border-border bg-surface-2 p-3">
            <dt className="text-text-3 text-xs">{it.label}</dt>
            <dd className="font-bold text-text-1">{it.valeur}</dd>
          </div>
        ))}
      </dl>
      <p className="text-text-3 text-xs">
        Toutes les marges sont calculées sur le n effectif (le redressement réduit la précision).
        Une marge de profil sous {SEUIL_CELLULE} répondant·es est grisée (fiabilité + anonymat).
      </p>
    </Card>
  );
}

function Croisements({ a }: { a: AnalyseSondage }) {
  if (a.croisements.length === 0) {
    return (
      <Alert variant="info" titre="Pas encore de croisements" className="mt-4">
        Aucune variable de profil n’est renseignée par les votant·es de ce sondage (les réponses au
        questionnaire de profil alimenteront les croisements au fil des votes).
      </Alert>
    );
  }
  return (
    <div className="mt-4 grid gap-4">
      <h2 className="font-bold text-text-1">Croisements (qui a voté quoi) — admin</h2>
      {a.croisements.map((cr) => (
        <Card key={cr.cle} variant="ombre" className="grid gap-2">
          <h3 className="font-bold text-sm text-text-1">{cr.intitule}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-border border-b text-left text-text-3 text-xs">
                  <th className="py-1 pr-3">Groupe</th>
                  <th className="py-1 pr-3 text-right">n</th>
                  {a.options.map((opt) => (
                    <th key={opt} className="py-1 pr-3 text-right">
                      {opt}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cr.colonnes.map((col) => (
                  <tr
                    key={col.modalite}
                    className={`border-border/50 border-b ${col.fiable ? '' : 'text-text-3 opacity-60'}`}
                  >
                    <td className="py-1.5 pr-3">
                      {col.modalite}
                      {col.fiable ? null : (
                        <Badge variant="warning" className="ml-2">
                          n &lt; {SEUIL_CELLULE}
                        </Badge>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-text-3">{col.nBrut}</td>
                    {col.pourcentages.map((p, i) => (
                      <td key={a.options[i] ?? i} className="py-1.5 pr-3 text-right">
                        {col.fiable ? pct(p) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default async function PageAnalyseSondage({ params }: Props) {
  const { slug } = await params;
  const analyse = await analyserSondage(slug);

  if (analyse === null) {
    return (
      <Alert variant="warning" titre="Indisponible">
        Sondage introuvable, ou accès réservé à l’administration.
      </Alert>
    );
  }

  return (
    <>
      <Link href="/admin/national/sondages" className="text-brand text-sm hover:underline">
        ← Tous les sondages
      </Link>
      <Heading niveau={1} className="mt-2">
        <BarChart3 size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        {analyse.titre}
      </Heading>
      <p className="mt-2 text-text-2">{analyse.question}</p>
      <Link
        href={`/s-informer/sondages/${analyse.slug}`}
        className="mt-1 inline-flex items-center gap-1 text-brand text-sm hover:underline"
      >
        <ExternalLink size={12} aria-hidden="true" />
        Page publique
      </Link>

      <ResultatGlobal a={analyse} />
      <Fiabilite a={analyse} />
      <Croisements a={analyse} />
    </>
  );
}
