import { PageEditorialeStub } from '@/components/home/PageEditorialeStub';
import { Alert } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
};

export default function PagePolitiqueConfidentialite() {
  return (
    <PageEditorialeStub
      surtitre="Vie privée"
      titre="Politique de confidentialité"
      placeholder={
        <Alert variant="info" titre="[TEXTE À FAIRE — politique de confidentialité v3]">
          Contenu attendu : politique de confidentialité v3 (cf. session 7, mai 2026) finalisée avec
          adresse, RNA, DPD (à désigner). Doctrine RGPD minimale légale, pas de cookie publicitaire,
          pas de traceur tiers, données en région UE (Supabase Francfort). À publier au chantier 2.2
          puis tenir à jour à chaque changement substantiel (cf. 05_RGPD.md §9).
        </Alert>
      }
    />
  );
}
