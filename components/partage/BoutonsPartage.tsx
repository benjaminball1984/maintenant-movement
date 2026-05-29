/**
 * Boutons de partage vers les messageries et réseaux (V2.5.7 Phase F).
 *
 * Server Component : aucune logique côté client, juste des `<a>` qui
 * ouvrent l'URL de partage dans une nouvelle fenêtre (le navigateur
 * mobile bascule vers l'app native quand elle existe).
 *
 * Usage :
 *   <BoutonsPartage
 *     titre={petition.titre}
 *     url={`${SITE.urlBase}/mobiliser/petitions/${petition.slug}`}
 *     message="Je viens de signer cette pétition. Tu peux la signer aussi :"
 *   />
 *
 * Le message est passé en props. La page parente lit le message éditable
 * via CMS (cf. directive 0bis.8 du CLAUDE.md).
 */

import { InvitationInterne } from '@/components/partage/InvitationInterne';
import { FABRICANTS_PARTAGE, type ParamsPartage } from '@/lib/partage/liens';

interface BoutonsPartageProps extends ParamsPartage {
  /** Titre du bloc (par défaut « Partager »). Éditable via CMS côté parent. */
  titreBloc?: string;
  /** Intro courte au-dessus des boutons. Éditable via CMS côté parent. */
  intro?: string;
  /** Si vrai, ajoute le bouton « Inviter mes contacts Maintenant! » (voie interne). */
  avecInvitationInterne?: boolean;
}

/**
 * Émojis SVG inline neutres (pas d'iconographie inventée). On utilise
 * un caractère emoji pour chaque service : universel, accessible, et
 * sans dépendance à une bibliothèque d'icônes.
 */
const EMOJI_PAR_ID: Record<string, string> = {
  whatsapp: '💬',
  telegram: '✈️',
  messenger: '📨',
  signal: '🔒',
  email: '✉️',
  mastodon: '🐘',
};

export function BoutonsPartage({
  titre,
  url,
  message,
  titreBloc = 'Partager',
  intro = 'Aide à diffuser, en un clic, vers les personnes qui pourraient être intéressées.',
  avecInvitationInterne = true,
}: BoutonsPartageProps) {
  return (
    <section aria-label="Partager cette page" className="grid gap-3">
      <header className="grid gap-1">
        <p className="font-display text-base font-bold text-text-1">{titreBloc}</p>
        <p className="text-sm text-text-2">{intro}</p>
      </header>
      {/* V2.5.20 sous-chantier V2.5.7.a — voie interne d'invitation à côté
          des partages externes. La voie interne est mise en premier pour
          encourager le contact direct avec les ami·es Maintenant! plutôt
          que de relayer vers des plateformes captatrices. */}
      {avecInvitationInterne ? (
        <div>
          <InvitationInterne messagePrerempli={message} url={url} />
        </div>
      ) : null}
      <ul className="flex flex-wrap gap-2">
        {FABRICANTS_PARTAGE.map((f) => {
          const href = f.fabricant({ titre, url, message });
          return (
            <li key={f.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-4 font-body text-sm font-bold text-text-1 transition hover:border-brand hover:text-brand"
              >
                <span aria-hidden="true">{EMOJI_PAR_ID[f.id] ?? '🔗'}</span>
                {f.libelle}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
