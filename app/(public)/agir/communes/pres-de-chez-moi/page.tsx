import { Alert, Button, Card, Container, Heading, Input, Label } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { MapPin, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Des gens près de chez moi',
  description: 'Trouver la commune libre la plus proche de ton code postal.',
};

interface PageProps {
  searchParams: Promise<{ cp?: string }>;
}

/**
 * Page « gens près de chez moi » (V2.5.19 — Master Plan V2.6 Phase E
 * sous-chantier V2.5.6.b).
 *
 * Version MVP avec 2 blocs (sur 4 prévus au Master Plan §E) :
 *   1. Commune libre du code postal saisi (recherche direct sur
 *      `commune.code_postal_principal`).
 *   2. Lien vers la liste complète des communes pour explorer.
 *
 * Les 2 blocs manquants (sous-préfecture la plus proche, préfecture la
 * plus proche) requièrent un mapping CP → sous-préfecture/préfecture que
 * Lilou/Ben doit fournir (référentiel INSEE des préfectures + arrondissements).
 * Reportés à V2.5.6.b.bis quand ce référentiel sera disponible.
 *
 * Pré-rempli depuis le code postal du profil connecté (chargé en lecture).
 */
export default async function PagePresDeChezMoi({ searchParams }: PageProps) {
  const { personne } = await getPersonneOuRediriger('/agir/communes/pres-de-chez-moi');
  const params = await searchParams;
  // Code postal : param URL prioritaire, sinon code postal du profil.
  const cp = params.cp ?? personne.code_postal ?? '';

  // Recherche de communes correspondant au code postal saisi.
  let communesProches: Array<{
    id: string;
    nom: string;
    slug: string;
    code_postal_principal: string | null;
    statut_creation: string;
  }> = [];
  if (cp.length === 5) {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('commune')
      .select('id, nom, slug, code_postal_principal, statut_creation')
      .eq('code_postal_principal', cp)
      .limit(5);
    communesProches = data ?? [];
  }

  return (
    <Container taille="md" className="py-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/agir/communes" className="hover:text-brand">
          ← Toutes les communes libres
        </Link>
      </p>
      <Heading niveau={1}>Des gens près de chez moi</Heading>
      <p className="mt-3 max-w-2xl text-text-2">
        Trouve la commune libre la plus proche de ton code postal. Si elle n'existe pas encore, tu
        peux la créer en quelques clics.
      </p>

      {/* Bloc 1 : saisie / changement du code postal */}
      <form
        method="GET"
        className="mt-8 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:flex sm:items-end"
      >
        <div className="flex-1">
          <Label htmlFor="cp-input">Code postal</Label>
          <Input
            id="cp-input"
            name="cp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            defaultValue={cp}
            placeholder="95100"
          />
        </div>
        <Button type="submit">
          <Search size={16} strokeWidth={1.5} className="mr-2" aria-hidden="true" />
          Chercher
        </Button>
      </form>

      {/* Bloc 2 : résultats */}
      {cp.length === 5 ? (
        <section className="mt-8 grid gap-4">
          <Heading niveau={2} apparenceComme={3}>
            Communes libres rattachées au {cp}
          </Heading>
          {communesProches.length === 0 ? (
            <Alert variant="info" titre="Aucune commune libre trouvée pour ce code postal">
              Tu peux en créer une, ou explorer les communes des départements voisins via{' '}
              <Link href="/agir/communes" className="underline">
                la liste complète
              </Link>
              .
            </Alert>
          ) : (
            <ul className="grid gap-3">
              {communesProches.map((c) => (
                <li key={c.id}>
                  <Card variant="ombre" className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={20}
                        strokeWidth={1.5}
                        className="mt-1 shrink-0 text-brand"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-bold text-text-1">{c.nom}</p>
                        <p className="text-xs text-text-3">
                          {c.statut_creation === 'auto_creee'
                            ? 'Commune libre'
                            : 'Pré-créée (en attente)'}{' '}
                          · CP {c.code_postal_principal}
                        </p>
                      </div>
                    </div>
                    <Link href={`/agir/communes/${c.slug}`}>
                      <Button variant="outline" taille="sm">
                        Voir & rejoindre
                      </Button>
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="mt-8 text-sm text-text-3">
          Renseigne un code postal de 5 chiffres pour voir les communes libres correspondantes.
        </p>
      )}

      {/* Bloc 3 : fallback exploration générale */}
      <section className="mt-8">
        <Heading niveau={2} apparenceComme={3}>
          Ou explorer toutes les communes
        </Heading>
        <p className="mt-2 text-sm text-text-2">
          Plus de 35 000 communes pré-créées et quelques centaines de communes libres déjà actives.
          Tu peux explorer par département, par région, ou par mot-clé.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/agir/communes">
            <Button variant="outline">Voir toutes les communes libres</Button>
          </Link>
          <Link href="/cartes">
            <Button variant="ghost">Voir sur la carte</Button>
          </Link>
        </div>
      </section>

      {/* Note V2.5.6.b.bis : 2 blocs manquants documentés */}
      <p className="mt-8 text-xs text-text-3 border-t border-border pt-4">
        Le Master Plan §E prévoit aussi des blocs « sous-préfecture la plus proche » et « préfecture
        la plus proche ». Ils nécessitent un référentiel CP→préfecture qui sera ajouté quand
        Lilou/Ben le fournira. Reporté à V2.5.6.b.bis.
      </p>
    </Container>
  );
}
