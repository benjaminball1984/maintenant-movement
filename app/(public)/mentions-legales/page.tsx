import { PageEditorialeStub } from '@/components/home/PageEditorialeStub';
import { Alert } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
};

export default function PageMentionsLegales() {
  return (
    <PageEditorialeStub
      surtitre="Légal"
      titre="Mentions légales"
      placeholder={
        <Alert variant="info" titre="[TEXTE À FAIRE — mentions légales]">
          Contenu attendu : éditeur (association Maintenant!), adresse, numéro RNA, directeur·rice
          de publication, hébergeur (Cloudflare Pages + Supabase Francfort), contact. À rédiger par
          Lilou/Ben au chantier 2.2 dès que les données associatives (adresse, RNA, DPD) sont
          fournies.
        </Alert>
      }
    />
  );
}
