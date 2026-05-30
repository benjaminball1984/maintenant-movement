import { AvatarReseau } from '@/components/reseau/AvatarReseau';
import { BoutonAmitie } from '@/components/reseau/BoutonAmitie';
import { Container, Heading } from '@/components/ui';
import { getSession } from '@/lib/auth/session';
import { listerDemandesAmiRecues } from '@/lib/reseau/amitie';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Demandes d’ami·e' };

/** Format court d'une date. */
function formaterDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
}

/**
 * Page `/s-informer/reseau/amis` — demandes d'ami·e reçues (épopée réseau V2,
 * chantier D.1).
 *
 * Liste les demandes en attente adressées au lecteur courant, avec les boutons
 * Accepter / Refuser (composant `BoutonAmitie` en état `demande_recue`).
 * Accepter force le suivi mutuel et débloque la messagerie.
 */
export default async function PageDemandesAmi() {
  const session = await getSession();
  if (session === null) {
    redirect('/connexion?prochaine=/s-informer/reseau/amis');
  }

  const demandes = await listerDemandesAmiRecues();

  return (
    <Container taille="md" className="py-12">
      <p className="mb-4 text-xs font-bold uppercase tracking-cap text-text-3">
        <Link href="/s-informer/reseau" className="hover:text-brand">
          ← Réseau social
        </Link>
      </p>
      <Heading niveau={1} className="mb-6">
        Demandes d’ami·e
      </Heading>

      {demandes.length === 0 ? (
        <p className="py-12 text-center text-text-3">
          Aucune demande en attente. Quand quelqu’un te demandera en ami·e, ça s’affichera ici.
        </p>
      ) : (
        <ul className="grid gap-3">
          {demandes.map((d) => (
            <li
              key={d.amitieId}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <AvatarReseau nom={d.nom} photoUrl={null} taillePx={44} />
              <div className="min-w-0 flex-1">
                {d.numero !== null ? (
                  <Link
                    href={`/s-informer/reseau/${d.numero}`}
                    className="font-bold text-text-1 hover:text-brand"
                  >
                    {d.nom}
                  </Link>
                ) : (
                  <p className="font-bold text-text-1">{d.nom}</p>
                )}
                <p className="text-xs text-text-3">Demande reçue le {formaterDate(d.creeLe)}</p>
              </div>
              <BoutonAmitie
                cibleId={d.demandeurId}
                etat={{ statut: 'demande_recue', amitieId: d.amitieId, peutDemander: false }}
              />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
