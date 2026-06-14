import { assignerTags } from '@/lib/import-breves/tags';
import { getTwitchService } from '@/lib/twitch';
import { SOURCES_TWITCH } from '@/lib/twitch/sources-twitch';

/**
 * Import des directs Twitch pour la rubrique « Lives » (demande Ben
 * 2026-06-14). À chaque exécution :
 *   1. on demande à l'API Twitch qui est EN DIRECT parmi nos chaînes engagées ;
 *   2. on crée/met à jour un `media type='live'` (embed `player.twitch.tv`)
 *      pour chaque direct en cours (idempotent par slug `twitch-<handle>`) ;
 *   3. on RETIRE (statut='retire', réversible) les lives Twitch précédemment
 *      publiés qui ne sont plus en direct.
 *
 * Résultat : la rubrique Lives montre en permanence les directs en cours, et
 * reste vide quand personne ne streame. Sans clé Twitch, l'adapter mock
 * renvoie [] (rien à faire).
 */

/** Slug d'un live Twitch, conforme au CHECK SQL (^[a-z0-9]+(-[a-z0-9]+)*$). */
export function slugTwitch(handle: string): string {
  const base = handle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `twitch-${base}`;
}

export interface RapportTwitch {
  enDirect: string[];
  retires: string[];
}

export async function importerTwitchLives(urlSb: string, cle: string): Promise<RapportTwitch> {
  const entetes = { apikey: cle, Authorization: `Bearer ${cle}` };
  const parHandle = new Map(SOURCES_TWITCH.map((s) => [s.handle, s]));
  const lives = await getTwitchService().chainesEnDirect(SOURCES_TWITCH.map((s) => s.handle));

  const maintenant = new Date().toISOString();
  const slugsEnDirect = new Set<string>();
  const lignes = lives
    .map((live) => {
      const src = parHandle.get(live.handle);
      if (src === undefined) return null;
      const slug = slugTwitch(live.handle);
      slugsEnDirect.add(slug);
      const corps = [live.titre.trim(), live.jeu.trim() !== '' ? `Catégorie : ${live.jeu}` : '']
        .filter((x) => x !== '')
        .join(' — ')
        .slice(0, 650);
      return {
        slug,
        titre: live.titre.trim() !== '' ? live.titre.slice(0, 200) : `${src.nom} est en direct`,
        corps,
        type: 'live',
        statut: 'publie',
        publie_le: maintenant,
        auteurice_id: null,
        provenance_externe: src.nom,
        source_url: `https://www.twitch.tv/${live.handle}`,
        media_url: `https://player.twitch.tv/?channel=${live.handle}`,
        vignette_url: live.vignetteUrl,
        tags: assignerTags(`${src.nom} ${live.titre} ${live.jeu}`),
        langue: src.langue,
        importante: true,
        // Réactivation propre si la chaîne avait été retirée à un live précédent.
        retire_le: null,
        raison_retrait: null,
        retire_par: null,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  // 1-2. Upsert (fusion sur slug) des directs en cours.
  if (lignes.length > 0) {
    const r = await fetch(`${urlSb}/rest/v1/media?on_conflict=slug`, {
      method: 'POST',
      headers: {
        ...entetes,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(lignes),
    });
    if (!r.ok) throw new Error(`upsert lives Twitch : ${r.status} ${await r.text()}`);
  }

  // 3. Retirer les lives Twitch publiés qui ne sont plus en direct.
  const retires: string[] = [];
  const rExist = await fetch(
    `${urlSb}/rest/v1/media?type=eq.live&statut=eq.publie&slug=like.twitch-*&select=id,slug`,
    { headers: entetes },
  );
  if (rExist.ok) {
    const existants = (await rExist.json()) as Array<{ id: string; slug: string }>;
    const aRetirer = existants.filter((m) => !slugsEnDirect.has(m.slug));
    if (aRetirer.length > 0) {
      const ids = aRetirer.map((m) => m.id).join(',');
      const rp = await fetch(`${urlSb}/rest/v1/media?id=in.(${ids})`, {
        method: 'PATCH',
        headers: { ...entetes, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          statut: 'retire',
          retire_le: new Date().toISOString(),
          raison_retrait: 'Live Twitch terminé.',
        }),
      });
      if (rp.ok) for (const m of aRetirer) retires.push(m.slug);
    }
  }

  return { enDirect: [...slugsEnDirect], retires };
}
