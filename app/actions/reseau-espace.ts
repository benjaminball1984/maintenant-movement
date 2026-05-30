'use server';

/**
 * Server Actions pour publier dans le flux du réseau social au nom d'un
 * espace collectif (V2.5.18 — finition Phase H, sous-chantier V2.5.10.b).
 *
 * Permissions :
 *   - L'utilisateur·rice doit être connecté·e.
 *   - L'utilisateur·rice doit être membre actif·ve de l'espace (vérifié
 *     via `estMembreActifEspace`), OU être admin général de plateforme.
 *   - Federation et confederation : restreints aux admins de plateforme
 *     (pas de table d'appartenance personne ↔ espace en V1).
 *
 * Modération : la publication créée a `statut = 'publie'` directement (pas
 * de modération a priori), cohérent avec la doctrine V1 des posts réseau.
 * La modération a posteriori reste la voie standard.
 */

import { estAdminCourant } from '@/lib/auth/admin';
import { getSession } from '@/lib/auth/session';
import {
  type TypeEspacePostable,
  creerPostEspace,
  estMembreActifEspace,
} from '@/lib/reseau/espace';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const publierSchema = z.object({
  espaceType: z.enum([
    'commune',
    'federation',
    'confederation',
    'gt_thematique',
    'groupe_entraide_local',
    'campagne',
    'organisation',
  ]),
  espaceId: z.string().uuid(),
  texte: z.string().trim().min(5, 'Le message doit faire au moins 5 caractères.').max(5000),
  /** Chemin à revalider (page de l'espace) après publication. */
  cheminRevalidation: z.string().startsWith('/'),
});

type Resultat = { ok: true; postId: string } | { ok: false; message: string };

/**
 * Publie un message au nom de l'espace dans le flux du réseau social.
 *
 * Vérifie l'appartenance pour les 4 types qui ont une table d'appartenance
 * (commune, gt_thematique, groupe_entraide_local, campagne). Pour les 2
 * autres (federation, confederation), seul un admin général peut publier.
 */
export async function publierAuNomDeLEspaceAction(donneesBrutes: unknown): Promise<Resultat> {
  const parse = publierSchema.safeParse(donneesBrutes);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Données invalides.' };
  }
  const donnees = parse.data;

  const session = await getSession();
  if (session === null) {
    return { ok: false, message: 'Tu dois être connecté·e pour publier.' };
  }

  const estAdmin = await estAdminCourant();
  const espaceType = donnees.espaceType as TypeEspacePostable;

  // Federation et confederation : admin général uniquement (cf. notes
  // dans lib/reseau/espace.ts > estMembreActifEspace).
  if (espaceType === 'federation' || espaceType === 'confederation') {
    if (!estAdmin) {
      return {
        ok: false,
        message:
          "Seul un admin général peut publier au nom d'une fédération ou confédération en V1.",
      };
    }
  } else if (!estAdmin) {
    // 4 autres types : vérifier l'appartenance active.
    const estMembre = await estMembreActifEspace(espaceType, donnees.espaceId, session.userId);
    if (!estMembre) {
      return {
        ok: false,
        message:
          'Tu dois être membre actif·ve de cet espace pour publier en son nom (ou être admin général).',
      };
    }
  }

  const resultat = await creerPostEspace({
    espaceType,
    espaceId: donnees.espaceId,
    auteuriceId: session.userId,
    texte: donnees.texte,
  });

  if (!resultat.ok || !resultat.postId) {
    return { ok: false, message: resultat.message ?? 'Publication impossible.' };
  }

  revalidatePath(donnees.cheminRevalidation);
  revalidatePath('/s-informer/reseau');
  return { ok: true, postId: resultat.postId };
}
