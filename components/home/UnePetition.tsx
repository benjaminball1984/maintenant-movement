import { signerPetition } from '@/app/(public)/mobiliser/petitions/actions';
import { ModaleSignaturePetition } from '@/components/modales/ModaleSignaturePetition';
import { CompteurStretch } from '@/components/petitions/CompteurStretch';
import { Badge, Card, Heading } from '@/components/ui';
import { petitionAlaUne } from '@/lib/petitions/requetes';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UneSection } from './UneSection';

/**
 * Une « pétition » de la page d'accueil (chantier 2.1 + 3.1).
 *
 * Branche désormais sur la pétition publiée la plus récente. Si aucune
 * n'existe, on retombe sur l'état vide hérité du chantier 2.1 (lien
 * `voir toutes` qui pointe sur la liste).
 *
 * Le CTA principal est un bouton qui ouvre `<ModaleSignaturePetition>`,
 * le secondaire est un lien vers la fiche détail. Cohérent avec la spec
 * §3 : « Signer en modale + Voir toutes ».
 */
export async function UnePetition() {
  const petition = await petitionAlaUne();

  if (petition === null) {
    return (
      <UneSection
        type="Pétition en cours"
        couleur="brand"
        titre={null}
        voirTousHref="/mobiliser/petitions"
        voirTousLibelle="Voir toutes les pétitions"
        enAttente={
          <p>
            Aucune pétition publiée pour le moment.{' '}
            <Link href="/mobiliser/petitions/nouvelle" className="text-brand hover:underline">
              Lance la première
            </Link>
            .
          </p>
        }
      />
    );
  }

  const createuricePrenomAffiche =
    petition.createurice_prenom !== null && petition.createurice_prenom.trim() !== ''
      ? petition.createurice_prenom
      : 'la personne créatrice';

  return (
    <Card variant="ombre" className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <Badge variant="brand">Pétition en cours</Badge>
        <Link href="/mobiliser/petitions" className="text-xs text-text-3 hover:text-brand">
          Voir toutes les pétitions →
        </Link>
      </header>

      <Heading niveau={3} className="text-2xl">
        <Link
          href={`/mobiliser/petitions/${petition.slug}`}
          className="text-text-1 underline-offset-4 hover:underline"
        >
          {petition.titre}
        </Link>
      </Heading>

      <p className="text-sm text-text-3">
        À <strong className="text-text-2">{petition.destinataire}</strong>
      </p>

      <CompteurStretch
        signatures={petition.nombre_signatures}
        objectif={petition.objectif}
        taille="sm"
      />

      <div className="flex flex-wrap items-center gap-3">
        <ModaleSignaturePetition
          petitionId={petition.id}
          petitionTitre={petition.titre}
          createuricePrenom={createuricePrenomAffiche}
          signerPetition={signerPetition}
          declencheur={
            <span
              className={cn(
                'inline-flex h-11 items-center justify-center rounded-md bg-grad px-5',
                'font-body text-sm font-bold text-white shadow-brand transition hover:brightness-110',
              )}
            >
              Signer en quelques secondes
            </span>
          }
        />
        <Link
          href={`/mobiliser/petitions/${petition.slug}`}
          className="text-sm text-brand underline-offset-4 hover:underline"
        >
          Lire la pétition →
        </Link>
      </div>
    </Card>
  );
}
