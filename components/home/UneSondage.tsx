import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Badge, Card, Heading, ImageAffiche } from '@/components/ui';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import { getImageObjet } from '@/lib/images';
import { sondageAlaUne } from '@/lib/sondages/requetes';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UneNonEpinglee } from './UneNonEpinglee';

const FALLBACKS = {
  badge: 'Sondage ouvert',
  voirTous: 'Voir tous les sondages',
  cta: 'Donner mon avis',
};

/**
 * Une « sondage » de la page d'accueil.
 *
 * Ajoutée le 01/08/2026 : après la mise en sommeil, la page d'accueil
 * doit montrer une entrée par rubrique gardée.
 *
 * Deux évolutions du 15/08/2026 (demandes Lilou/Ben) :
 *
 *   1. **Le sondage est épinglé comme les autres.** Il prenait d'office
 *      le dernier sondage ouvert ; il passe sur le même mécanisme que la
 *      pétition, la mobilisation, l'article et la cagnotte (`une_home`,
 *      emplacement `sondage`, ajouté par la migration
 *      `20260815100000_une_home_sondage.sql`).
 *   2. **Le visuel du sondage s'affiche.** Chaque sondage porte une image
 *      de couverture : soit celle téléversée à la création, soit la
 *      mosaïque des options générée automatiquement (chantier V2.6.111).
 *      Elle n'était visible que sur la fiche du sondage ; la une montrait
 *      seulement du texte, alors que les quatre autres blocs ont une
 *      image. Elle est donc affichée ici, au même format 16/9.
 */
export async function UneSondage() {
  const [sondage, estAdmin, badge, voirTous, cta] = await Promise.all([
    sondageAlaUne(),
    estAdminCourant(),
    lireContenuEditorial('home.une.sondage.badge', { valeurMd: FALLBACKS.badge }),
    lireContenuEditorial('home.une.sondage.voir_tous', { valeurMd: FALLBACKS.voirTous }),
    lireContenuEditorial('home.une.sondage.cta', { valeurMd: FALLBACKS.cta }),
  ]);

  if (sondage === null) {
    return estAdmin ? <UneNonEpinglee type={badge.valeurMd} couleur="brand" /> : null;
  }

  const lienSondage = `/s-informer/sondages/${sondage.slug}`;

  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <TexteEditableAdmin
          cle="home.une.sondage.badge"
          valeurInitiale={badge.valeurMd}
          estAdmin={estAdmin}
          libelle="texte du badge Une sondage"
          longueurMax={40}
        >
          {(t) => <Badge variant="brand">{t}</Badge>}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="home.une.sondage.voir_tous"
          valeurInitiale={voirTous.valeurMd}
          estAdmin={estAdmin}
          libelle="libelle du lien Voir tous les sondages"
          longueurMax={60}
        >
          {(t) => (
            <Link href="/s-informer/sondages" className="text-xs text-text-3 hover:text-brand">
              {t}
            </Link>
          )}
        </TexteEditableAdmin>
      </header>

      {/* Couverture du sondage : image téléversée ou mosaïque des options
          (V2.6.111). `getImageObjet` retombe sur l'illustration par défaut
          du site si le sondage n'en a aucune, donc jamais de trou blanc. */}
      <Link href={lienSondage} className="block">
        <ImageAffiche
          src={getImageObjet({ image_url: sondage.image_url, type_objet: 'sondage' })}
          sizes="(max-width: 896px) 100vw, 800px"
          className="aspect-[16/9] w-full rounded-md border border-border bg-surface-2"
        />
      </Link>

      <Heading niveau={2} apparenceComme={3} className="text-2xl">
        <Link href={lienSondage} className="text-text-1 underline-offset-4 hover:underline">
          {sondage.titre}
        </Link>
      </Heading>

      {/* La question n'est répétée que si elle apporte quelque chose :
          beaucoup de sondages ont un titre identique à leur question. */}
      {sondage.question.trim() !== sondage.titre.trim() ? (
        <p className="text-text-2">{sondage.question}</p>
      ) : null}

      <TexteEditableAdmin
        cle="home.une.sondage.cta"
        valeurInitiale={cta.valeurMd}
        estAdmin={estAdmin}
        libelle="libelle du CTA principal (Donner mon avis)"
        longueurMax={50}
      >
        {(t) => (
          <Link
            href={lienSondage}
            className={cn(
              'inline-flex h-11 w-fit items-center justify-center rounded-md bg-grad px-5',
              'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
            )}
          >
            {t}
          </Link>
        )}
      </TexteEditableAdmin>
    </Card>
  );
}
