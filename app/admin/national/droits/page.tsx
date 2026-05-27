import { BoutonRetirerDroit } from '@/components/admin/national/BoutonRetirerDroit';
import { FormulaireAccorderDroit } from '@/components/admin/national/FormulaireAccorderDroit';
import { TexteEditableAdmin } from '@/components/contenu/TexteEditableAdmin';
import { Alert, Badge, Card, Heading } from '@/components/ui';
import { type DroitAdminAffichage, listerDroitsActifs } from '@/lib/admin/national/droits';
import { estAdminCourant } from '@/lib/auth/admin';
import { lireContenuEditorial } from '@/lib/contenu-editorial';
import {
  LIBELLES_ONGLET,
  type OngletModeration,
  libelleNiveau,
} from '@/lib/validations/droit-admin';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestion des droits',
};

/**
 * Gestion des droits d'administration (console nationale).
 *
 * Affiche tous les droits actifs (bénéficiaire, niveau, périmètre) et
 * permet d'en accorder de nouveaux ou d'en retirer. Réservé au niveau
 * `national` : le layout parent (`/admin/national`) garantit déjà l'accès.
 */
export default async function PageGestionDroits() {
  const droits = await listerDroitsActifs();
  const [estAdmin, titre, intro] = await Promise.all([
    estAdminCourant(),
    lireContenuEditorial('admin.national.droits.titre', { valeurMd: 'Gestion des droits' }),
    lireContenuEditorial('admin.national.droits.intro', {
      valeurMd:
        'Accorde ou retire les droits d’administration. Chaque action est consignée dans le journal d’audit.',
    }),
  ]);

  return (
    <section className="grid gap-8">
      <header>
        <TexteEditableAdmin
          cle="admin.national.droits.titre"
          valeurInitiale={titre.valeurMd}
          estAdmin={estAdmin}
          libelle="titre console droits"
          longueurMax={40}
        >
          {(t) => (
            <Heading niveau={1} apparenceComme={2}>
              {t}
            </Heading>
          )}
        </TexteEditableAdmin>
        <TexteEditableAdmin
          cle="admin.national.droits.intro"
          valeurInitiale={intro.valeurMd}
          estAdmin={estAdmin}
          libelle="intro console droits"
          multilignes
          longueurMax={300}
        >
          {(t) => <p className="mt-2 text-text-2">{t}</p>}
        </TexteEditableAdmin>
      </header>

      <FormulaireAccorderDroit />

      <div className="grid gap-4">
        <Heading niveau={2} apparenceComme={3}>
          Droits actifs ({droits.length})
        </Heading>

        {droits.length === 0 ? (
          <Alert variant="info" titre="Aucun droit actif">
            Personne n’a encore de droit d’administration. Utilise le formulaire ci-dessus pour en
            accorder un.
          </Alert>
        ) : (
          <ul className="grid gap-3">
            {droits.map((droit) => (
              <li key={droit.id}>
                <Card className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <p className="font-bold text-text-1">{nomBeneficiaire(droit)}</p>
                    {droit.beneficiaire?.email != null ? (
                      <p className="text-sm text-text-3">{droit.beneficiaire.email}</p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge>{libelleNiveau(droit.niveau)}</Badge>
                      <span className="text-xs text-text-3">{descriptionPerimetre(droit)}</span>
                    </div>
                    <p className="mt-1 text-xs text-text-3">
                      Accordé le {dateFr(droit.accorde_le)}
                    </p>
                  </div>
                  <BoutonRetirerDroit droitId={droit.id} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ============================================================
// Helpers d'affichage
// ============================================================

/** Nom affichable du·de la bénéficiaire (fallback email puis « Personne inconnue »). */
function nomBeneficiaire(droit: DroitAdminAffichage): string {
  const b = droit.beneficiaire;
  if (b === null) return 'Personne inconnue';
  const complet = [b.prenom, b.nom].filter((s) => s && s.trim() !== '').join(' ');
  return complet !== '' ? complet : (b.email ?? 'Personne inconnue');
}

/** Décrit le périmètre d'un droit : onglets de modération ou commune animée. */
function descriptionPerimetre(droit: DroitAdminAffichage): string {
  if (droit.niveau === 'moderation') {
    const onglets = droit.perimetre_onglet;
    if (onglets === null || onglets.length === 0) return 'Tous les onglets';
    return onglets.map((o) => LIBELLES_ONGLET[o as OngletModeration] ?? o).join(', ');
  }
  if (droit.niveau === 'animation') {
    return droit.commune?.nom != null ? `Commune : ${droit.commune.nom}` : 'Commune non précisée';
  }
  return '';
}

/** Formate une date ISO en français lisible. */
function dateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
