import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { libelleType, rechercherGlobalement } from '@/lib/recherche-globale';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Recherche',
  description: 'Rechercher dans pétitions, mobilisations, cagnottes, communes, articles, sondages…',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

/**
 * Page `/recherche` — Recherche globale du site (V2.4.24).
 *
 * Form GET avec input texte (?q=). Si q présent, lance la recherche
 * agrégée sur 11 types d'entités en parallèle. Sinon, affiche la page
 * d'accueil avec hints.
 */
export default async function PageRechercheGlobale({ searchParams }: Props) {
  const { q } = await searchParams;
  const requete = (q ?? '').trim();
  const resultats = requete.length >= 2 ? await rechercherGlobalement(requete) : [];

  return (
    <Container taille="lg" className="py-12">
      <header>
        <Heading niveau={1}>
          <Search size={26} className="-mt-1 mr-2 inline" aria-hidden="true" />
          Rechercher
        </Heading>
        <p className="mt-2 text-text-2">
          Pétitions, mobilisations, cagnottes, communes, fédérations, articles, sondages, salles
          Décider, journal-affiche, groupes d'entraide, campagnes.
        </p>
      </header>

      <form method="get" action="/recherche" className="mt-6 flex flex-wrap gap-2">
        <label htmlFor="q-input" className="sr-only">
          Mots-clés
        </label>
        <input
          id="q-input"
          name="q"
          type="search"
          defaultValue={requete}
          placeholder="Tape au moins 2 lettres…"
          className="flex-1 rounded-md border border-border bg-surface p-3"
          minLength={2}
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-6 py-3 font-bold text-white hover:brightness-110"
        >
          Rechercher
        </button>
      </form>

      {requete.length === 0 ? (
        <Alert variant="info" titre="Tape un mot-clé pour démarrer" className="mt-8">
          La recherche couvre tous les espaces publics du site. Les résultats sont filtrés par RLS
          selon ton périmètre.
        </Alert>
      ) : requete.length < 2 ? (
        <Alert variant="warning" titre="Trop court" className="mt-8">
          Tape au moins 2 caractères.
        </Alert>
      ) : resultats.length === 0 ? (
        <Alert variant="info" titre="Aucun résultat" className="mt-8">
          Aucune entité publique ne correspond à « <strong>{requete}</strong> ». Essaie un autre
          mot-clé ou consulte le{' '}
          <Link href="/s-informer/reseau/recherche" className="underline">
            réseau social
          </Link>{' '}
          pour chercher des personnes.
        </Alert>
      ) : (
        <section className="mt-8">
          <p className="mb-3 text-sm text-text-3">
            {resultats.length} résultat{resultats.length > 1 ? 's' : ''} pour «{' '}
            <strong>{requete}</strong> »
          </p>
          <ul className="grid gap-2">
            {resultats.map((r) => (
              <li key={`${r.type}-${r.href}`}>
                <Link href={r.href} className="block hover:opacity-90">
                  <Card variant="ombre" className="flex items-start gap-3">
                    {r.imageUrl !== null ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2">
                        <Image
                          src={r.imageUrl}
                          alt=""
                          fill
                          unoptimized
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-md bg-surface-2" />
                    )}
                    <div className="grid flex-1 gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info">{libelleType(r.type)}</Badge>
                      </div>
                      <h3 className="font-bold text-text-1">{r.titre}</h3>
                      {r.sousTitre !== null && r.sousTitre.trim() !== '' ? (
                        <p className="line-clamp-2 text-sm text-text-2">{r.sousTitre}</p>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
