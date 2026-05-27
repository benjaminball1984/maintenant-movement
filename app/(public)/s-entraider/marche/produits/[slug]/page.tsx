import { acheterProduit, noterVendeureuse } from '@/app/(public)/s-entraider/marche/actions';
import { DoubleAffichagePrix } from '@/components/marche/BadgesMonnaies';
import { FormulaireAchat } from '@/components/marche/FormulaireAchat';
import { FormulaireNotation } from '@/components/marche/FormulaireNotation';
import { NotationEtoiles } from '@/components/marche/NotationEtoiles';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerNotationsProduit, produitParSlug } from '@/lib/marche/requetes';
import { metadataPourPartage } from '@/lib/og-metadata';
import { MapPin, Package, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const produit = await produitParSlug(slug);
  if (produit === null) return { title: 'Produit introuvable' };
  return metadataPourPartage({
    objet: {
      titre: produit.titre,
      description: produit.description,
      image_url: produit.image_url,
      type_objet: 'produit_marche',
    },
    cheminPage: `/s-entraider/marche/produits/${slug}`,
  });
}

/**
 * Fiche détail d'un produit. Conditionne :
 *   - bouton « Acheter » si statut `disponible` + visiteureuse ≠ vendeureuse + mode `vente` ;
 *   - bandeau « Don gratuit » + bouton contact (mock) si mode `don` ;
 *   - bloc « Noter la vendeureuse » si statut `vendu` + visiteureuse ≠ vendeureuse.
 */
export default async function PageDetailProduit({ params }: PageDetailProps) {
  const { slug } = await params;
  const produit = await produitParSlug(slug);
  if (produit === null) notFound();

  const [session, notations] = await Promise.all([
    getSession(),
    listerNotationsProduit(produit.id),
  ]);
  const estVendeureuse = session?.userId === produit.vendeureuse_id;
  const peutAcheter =
    session !== null &&
    !estVendeureuse &&
    produit.statut === 'disponible' &&
    produit.mode === 'vente';
  const peutNoter = session !== null && !estVendeureuse && produit.statut === 'vendu';

  return (
    <>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-entraider/marche/produits" className="hover:text-brand">
          ← Produits
        </Link>
      </p>

      <article className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={produit.mode === 'don' ? 'success' : 'brand'}>
              {produit.mode === 'don' ? 'Don gratuit' : 'Vente'}
            </Badge>
            {produit.statut !== 'disponible' ? (
              <Badge variant="default">
                {{
                  reserve: 'Réservé',
                  vendu: 'Vendu',
                  retire: 'Retiré',
                  expire: 'Expiré',
                }[produit.statut] ?? produit.statut}
              </Badge>
            ) : null}
          </div>
          <Heading niveau={1}>{produit.titre}</Heading>
          <DoubleAffichagePrix
            mode={produit.mode}
            prixEurosCentimes={produit.prix_euros_centimes}
            prixT99CPUnites={produit.prix_t99cp_unites}
          />
        </header>

        <Card variant="ombre" className="grid gap-3">
          <div className="flex items-start gap-3">
            <MapPin size={18} strokeWidth={1.5} className="mt-0.5 text-text-3" />
            <div>
              <p className="text-xs font-bold uppercase tracking-cap text-text-3">Retrait</p>
              <p className="text-text-1">{produit.lieu}</p>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-3">
                {produit.remise_main_propre ? (
                  <span className="inline-flex items-center gap-1">
                    <Package size={12} strokeWidth={1.5} /> Main propre
                  </span>
                ) : null}
                {produit.envoi_postal ? (
                  <span className="inline-flex items-center gap-1">
                    <Truck size={12} strokeWidth={1.5} /> Envoi postal (port acheteureuse)
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </Card>

        <section className="grid gap-3">
          <Heading niveau={2} apparenceComme={3}>
            Description
          </Heading>
          <div className="grid gap-4 whitespace-pre-line text-text-2 leading-relaxed">
            {produit.description}
          </div>
        </section>

        {peutAcheter ? (
          <Card variant="eleve" className="grid gap-3">
            <Heading niveau={2} apparenceComme={4}>
              Acheter ce produit
            </Heading>
            <FormulaireAchat
              produitId={produit.id}
              prixEurosCentimes={produit.prix_euros_centimes}
              prixT99CPUnites={produit.prix_t99cp_unites}
              acheterProduit={acheterProduit}
            />
          </Card>
        ) : null}

        {produit.mode === 'don' && produit.statut === 'disponible' && !estVendeureuse ? (
          <Alert variant="info" titre="Produit offert">
            Ce produit est en don gratuit : entre en contact avec la personne via la{' '}
            <a href="/s-informer/reseau/messages" className="underline">
              messagerie interne du réseau social
            </a>
            .
          </Alert>
        ) : null}

        {peutNoter ? (
          <Card variant="ombre" className="grid gap-3">
            <Heading niveau={2} apparenceComme={4}>
              Noter la vendeureuse (5 étoiles)
            </Heading>
            <p className="text-sm text-text-3">
              Notation unilatérale (cf. doctrine §6F) : seule l'acheteureuse note.
            </p>
            <FormulaireNotation produitId={produit.id} noterVendeureuse={noterVendeureuse} />
          </Card>
        ) : null}

        {notations.length > 0 ? (
          <section className="grid gap-3">
            <Heading niveau={2} apparenceComme={4}>
              Notations
            </Heading>
            <ul className="grid gap-3">
              {notations.map((n) => (
                <li key={n.id}>
                  <Card variant="ombre" className="grid gap-2">
                    <header className="flex items-center justify-between gap-2">
                      <NotationEtoiles note={n.etoiles} taille={14} />
                      <span className="text-xs text-text-3">
                        {[n.acheteureuse_prenom, n.acheteureuse_nom]
                          .filter((s) => s !== null && s.trim() !== '')
                          .join(' ') || 'Acheteureuse'}
                      </span>
                    </header>
                    {n.commentaire !== null && n.commentaire.trim() !== '' ? (
                      <p className="text-sm text-text-2">{n.commentaire}</p>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="border-t border-border pt-4 text-sm text-text-3">
          {produit.vendeureuse_prenom !== null || produit.vendeureuse_nom !== null ? (
            <p>
              Publié par{' '}
              <strong className="text-text-2">
                {[produit.vendeureuse_prenom, produit.vendeureuse_nom]
                  .filter((s) => s !== null && s.trim() !== '')
                  .join(' ')}
              </strong>
              .{' '}
              <NotationEtoiles
                note={produit.moyenne_etoiles}
                nombre={produit.nombre_notations}
                taille={12}
              />
            </p>
          ) : null}
        </footer>
      </article>
    </>
  );
}
