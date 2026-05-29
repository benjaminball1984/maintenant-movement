import { numeroReseauDe } from '@/lib/reseau/lien';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LienAuteurReseauProps {
  /** Identifiant de la personne (createurice_id, proposeur, vendeur·euse…). */
  personneId: string | null | undefined;
  /** Nom à afficher (souvent dénormalisé sur le contenu). */
  nom: string;
  className?: string;
}

/**
 * Affiche le nom d'un·e auteurice/proposeur·euse, cliquable vers son profil
 * réseau si elle a un numéro public (chantier A.2b — « tout auteur devient une
 * présence suivable »). Server Component : résout le numéro public via
 * `numeroReseauDe`. Sans numéro (pas encore de profil unifié), affiche le nom
 * en clair sans lien — dégradation propre.
 */
export async function LienAuteurReseau({ personneId, nom, className }: LienAuteurReseauProps) {
  const numero = await numeroReseauDe(personneId);
  if (numero === null) {
    return <span className={className}>{nom}</span>;
  }
  return (
    <Link href={`/s-informer/reseau/${numero}`} className={cn('hover:text-brand', className)}>
      {nom}
    </Link>
  );
}
