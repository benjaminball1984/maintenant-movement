import { Card, Heading } from '@/components/ui';
import { getPersonneOuRediriger } from '@/lib/auth/session';
import { getSupabaseServer } from '@/lib/supabase';
import { type PreferencesVisibilite, preferencesVisibiliteSchema } from '@/lib/validations/profil';
import type { Metadata } from 'next';
import { BoutonExportZip } from './BoutonExportZip';
import { FormulaireVisibilite } from './FormulaireVisibilite';
import { SectionDeuxFA } from './SectionDeuxFA';
import { SectionSuppression } from './SectionSuppression';

export const metadata: Metadata = {
  title: 'Confidentialité',
};

/**
 * Centre des paramètres RGPD + sécurité (cf. 05_RGPD.md §8) :
 * - visibilité par champ
 * - export ZIP de toutes mes données (droit à la portabilité)
 * - suppression différée 30 jours (droit à l'effacement)
 * - 2FA TOTP
 */
export default async function PageConfidentialite({
  searchParams,
}: {
  searchParams: Promise<{ '2fa'?: string }>;
}) {
  const { personne, email } = await getPersonneOuRediriger('/profil/confidentialite');
  const supabase = await getSupabaseServer();

  // Visibilité par champ : on récupère les valeurs existantes (jsonb).
  // Si la sous-structure est invalide, on retombe sur un objet vide.
  const prefs =
    typeof personne.preferences_visibilite === 'object' && personne.preferences_visibilite !== null
      ? (personne.preferences_visibilite as Record<string, unknown>)
      : {};
  // On ne passe à FormulaireVisibilite que les clés connues (les autres,
  // comme `notifications`, restent dans le jsonb mais pas dans ce form).
  const parse = preferencesVisibiliteSchema.safeParse(prefs);
  const valeursInitialesVisibilite: PreferencesVisibilite = parse.success ? parse.data : {};

  // 2FA : on liste les facteurs TOTP actifs.
  const { data: facteurs } = await supabase.auth.mfa.listFactors();
  const facteurTotp = facteurs?.totp[0];

  const params = await searchParams;
  const vientDActiverDeuxFA = params['2fa'] === 'active';

  return (
    <article className="grid gap-8">
      <header>
        <Heading niveau={1}>Confidentialité et sécurité</Heading>
        <p className="mt-2 text-text-2">
          Tes droits RGPD à un endroit : visibilité de chaque champ, export, suppression différée,
          2FA. On respecte ta vie privée par défaut.
        </p>
      </header>

      <Card variant="ombre">
        <Heading niveau={3} className="mb-4 text-lg">
          Visibilité par champ
        </Heading>
        <p className="mb-4 text-sm text-text-2">
          Pour chaque information de ton profil, choisis qui peut la voir. Défaut : visible aux
          membres connecté·es.
        </p>
        <FormulaireVisibilite valeursInitiales={valeursInitialesVisibilite} />
      </Card>

      <Card variant="ombre">
        <Heading niveau={3} className="mb-4 text-lg">
          Export de mes données
        </Heading>
        <p className="mb-4 text-sm text-text-2">
          Droit à la portabilité : récupère un ZIP avec ton profil, tes contributions, tes
          paiements, tes messages, et tes médias. Lien envoyé par mail sous 24h.
        </p>
        <BoutonExportZip />
      </Card>

      <Card variant="ombre">
        <Heading niveau={3} className="mb-4 text-lg">
          Authentification à deux facteurs (2FA)
        </Heading>
        <SectionDeuxFA factorId={facteurTotp?.id ?? null} vientDActiver={vientDActiverDeuxFA} />
      </Card>

      <Card variant="ombre">
        <Heading niveau={3} className="mb-4 text-lg">
          Suppression de mon compte
        </Heading>
        <p className="mb-4 text-sm text-text-2">
          Droit à l’effacement. 30 jours de grâce pour changer d’avis. Tes contributions sont
          préservées sous « Membre anonyme » pour ne pas effacer la trace politique.
        </p>
        <SectionSuppression
          email={email}
          suppressionDemandeeLe={personne.suppression_demandee_le}
        />
      </Card>
    </article>
  );
}
