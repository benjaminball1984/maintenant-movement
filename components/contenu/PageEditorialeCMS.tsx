import { Alert, Container, Heading } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import Link from 'next/link';
import { ContenuEditableAdmin } from './ContenuEditableAdmin';

/**
 * Squelette d'une page éditoriale (V2.4.2). Affiche un titre, le
 * surtitre, et le contenu chargé depuis `contenu_editorial` (CMS V2.4.1).
 *
 * - Si la clé n'existe pas en base : affiche le `loremFallback`.
 * - Visiteur non admin : rendu Markdown léger en lecture seule.
 * - Admin : bouton « Modifier » au hover, édition inline.
 *
 * Remplace `PageEditorialeStub` (qui affichait juste un placeholder).
 */

interface Props {
  surtitre: string;
  titreParDefaut: string;
  cle: string;
  loremFallback: string;
}

export async function PageEditorialeCMS({ surtitre, titreParDefaut, cle, loremFallback }: Props) {
  const [contenu, estAdmin] = await Promise.all([
    lireContenuEditorial(cle, { titre: titreParDefaut, valeurMd: loremFallback }),
    estAdminCourant(),
  ]);

  const titre = contenu.titre ?? titreParDefaut;

  return (
    <Container taille="md" className="py-16">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-cap text-text-3">{surtitre}</p>
        <Heading niveau={1} className="mt-1">
          {titre}
        </Heading>
        {estAdmin ? (
          <Alert variant="info" titre="Édition admin" className="mt-4">
            Tu es connecté·e en admin national. Survole le bloc de contenu et clique sur « Modifier
            » pour le mettre à jour. Le contenu est stocké dans <code>contenu_editorial.{cle}</code>
            .
          </Alert>
        ) : null}
      </header>

      <article className="prose-maintenant">
        <ContenuEditableAdmin
          cle={cle}
          valeurInitiale={contenu.valeurMd}
          estAdmin={estAdmin}
          titre={titre}
        />
      </article>

      <p className="mt-12 text-sm text-text-3">
        <Link href="/" className="text-brand underline-offset-4 hover:underline">
          ← Retour à l'accueil
        </Link>
      </p>
    </Container>
  );
}
