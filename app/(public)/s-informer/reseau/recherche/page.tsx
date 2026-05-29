import { Alert, Badge, Card, Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { nomAffiche } from '@/lib/reseau/affichage';
import { getSupabaseServer } from '@/lib/supabase';
import { Search, User } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Recherche — Réseau',
  description: 'Recherche dans les publications et les personnes du réseau social.',
};

/**
 * Page de recherche réseau (cycle V2 V2.3.44).
 *
 * Cf. CDC V2 §02-Sinformer/reseau-social-V2.md, point « Reste à faire »
 * mentionnant la recherche. Implémentation simple : 1 input `q` en
 * query string, 2 sections de résultats (personnes par numéro M+7 ou
 * prénom + posts par texte).
 *
 * Limite : recherche full-text basique (`ilike`). À améliorer avec une
 * fonction Postgres `tsvector` quand le volume le justifiera.
 */
export default async function PageRechercheReseau({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: qBrut } = await searchParams;
  const q = typeof qBrut === 'string' ? qBrut.trim() : '';
  const session = await getSession();

  if (session === null) {
    return (
      <Container taille="md" className="py-12">
        <Heading niveau={1}>Recherche</Heading>
        <Alert variant="info" titre="Connexion requise" className="mt-6">
          La recherche réseau est réservée aux personnes connectées.
        </Alert>
      </Container>
    );
  }

  const supabase = await getSupabaseServer();
  let personnes: Array<{ id: string; numero: string; prenom: string | null; nom: string | null }> =
    [];
  let posts: Array<{ id: string; texte: string; created_at: string }> = [];

  if (q.length >= 2) {
    // Recherche personnes par numéro M+7 (exact insensible casse) ou prénom.
    // Le numéro est dans profil_unifie, le prénom dans personne (RLS filtre
    // les invisibles). On joint en deux temps.
    const filtreNumero = q.toUpperCase().startsWith('M') ? q.toUpperCase() : null;

    if (filtreNumero !== null && /^M[A-Z]{0,7}$/.test(filtreNumero)) {
      const { data } = await supabase
        .from('profil_unifie')
        .select('personne_id, numero_unique')
        .ilike('numero_unique', `${filtreNumero}%`)
        .not('personne_id', 'is', null)
        .limit(20);
      const ids = (data ?? []).map((d) => d.personne_id).filter((id): id is string => id !== null);
      if (ids.length > 0) {
        const { data: personnesData } = await supabase
          .from('personne')
          .select('id, prenom, nom')
          .in('id', ids);
        const parId = new Map((personnesData ?? []).map((p) => [p.id, p]));
        personnes = (data ?? [])
          .filter((d) => d.personne_id !== null)
          .map((d) => ({
            id: d.personne_id as string,
            numero: d.numero_unique,
            prenom: parId.get(d.personne_id as string)?.prenom ?? null,
            nom: parId.get(d.personne_id as string)?.nom ?? null,
          }));
      }
    } else {
      const { data } = await supabase
        .from('personne')
        .select('id, prenom, nom')
        .ilike('prenom', `%${q}%`)
        .limit(20);
      const ids = (data ?? []).map((p) => p.id);
      if (ids.length > 0) {
        const { data: profilsData } = await supabase
          .from('profil_unifie')
          .select('personne_id, numero_unique')
          .in('personne_id', ids);
        const numeroParId = new Map(
          (profilsData ?? [])
            .filter((p) => p.personne_id !== null)
            .map((p) => [p.personne_id as string, p.numero_unique]),
        );
        personnes = (data ?? []).map((p) => ({
          id: p.id,
          numero: numeroParId.get(p.id) ?? '—',
          prenom: p.prenom,
          nom: p.nom,
        }));
      }
    }

    // Recherche posts par texte.
    const { data: postsData } = await supabase
      .from('post_reseau')
      .select('id, texte, created_at')
      .eq('statut', 'publie')
      .ilike('texte', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(30);
    posts = postsData ?? [];
  }

  return (
    <Container taille="md" className="py-12">
      <Heading niveau={1}>
        <Search size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Recherche réseau
      </Heading>

      <form method="get" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          aria-label="Rechercher dans le réseau (numéro, prénom)"
          defaultValue={q}
          placeholder="Numéro M+7, prénom, ou mots-clés…"
          minLength={2}
          className="flex-1 rounded-md border border-border bg-surface p-2 text-text-1"
          required
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 font-medium text-bg text-sm hover:brightness-110"
        >
          Chercher
        </button>
      </form>

      {q === '' ? (
        <p className="mt-4 text-sm text-text-3">
          Tape un numéro M+7 (ex. MABCDEFG), un prénom (≥ 2 caractères) ou des mots-clés pour
          chercher dans les publications.
        </p>
      ) : (
        <>
          <section className="mt-8">
            <Heading niveau={2} apparenceComme={3}>
              <User size={18} className="-mt-0.5 mr-1 inline" aria-hidden="true" />
              Personnes ({personnes.length})
            </Heading>
            {personnes.length === 0 ? (
              <p className="mt-3 text-text-3 text-sm">Aucune personne trouvée pour « {q} ».</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {personnes.map((p) => (
                  <li key={p.id}>
                    <Link href={`/s-informer/reseau/${p.numero}`} className="block">
                      <Card variant="ombre" className="grid gap-1">
                        <p className="font-mono text-text-3 text-xs">{p.numero}</p>
                        <p className="font-medium text-text-1">{nomAffiche(p.prenom, p.nom)}</p>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <Heading niveau={2} apparenceComme={3}>
              Publications ({posts.length})
            </Heading>
            {posts.length === 0 ? (
              <p className="mt-3 text-text-3 text-sm">Aucune publication trouvée pour « {q} ».</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Card variant="ombre" className="grid gap-1">
                      <Badge variant="default">Publication</Badge>
                      <p className="line-clamp-4 text-sm text-text-1">{p.texte}</p>
                      <p className="text-text-3 text-xs">
                        {new Date(p.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Container>
  );
}
