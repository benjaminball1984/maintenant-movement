'use client';

import { Pause, Play, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PlayerAzuraCastProps {
  /** URL du flux audio en direct (Icecast/HLS). */
  fluxUrl: string;
  /** URL JSON `nowplaying` (AzuraCast) pour les métadonnées de l'émission en cours. */
  metadataUrl?: string | null;
}

/**
 * Player Maintenant Radio (chantier 7.2).
 *
 * Cf. `docs/specs/01_ARCHITECTURE.md §4B` :
 *   « Onglet live unique. Infrastructure : AzuraCast auto-hébergé.
 *     Player intégré + métadonnées de l'émission en cours. »
 *
 * Le player utilise l'élément `<audio>` natif (pas de bibliothèque) pour
 * rester léger et accessible (lecteur d'écran natif, contrôles clavier).
 * Les métadonnées de `nowplaying` sont rafraîchies toutes les 30 s.
 */
export function PlayerAzuraCast({ fluxUrl, metadataUrl }: PlayerAzuraCastProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [enCours, setEnCours] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [emission, setEmission] = useState<{ titre: string; artiste: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (audioRef.current === null) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (metadataUrl === null || metadataUrl === undefined) return undefined;
    let actif = true;
    const charger = async () => {
      try {
        const r = await fetch(metadataUrl, { cache: 'no-store' });
        if (!r.ok) return;
        const data = (await r.json()) as {
          now_playing?: { song?: { title?: string; artist?: string } };
        };
        if (!actif) return;
        const titre = data.now_playing?.song?.title ?? null;
        const artiste = data.now_playing?.song?.artist ?? null;
        if (titre !== null && titre !== '') {
          setEmission({ titre, artiste: artiste ?? '' });
        }
      } catch {
        // Silencieux : on ne casse pas le player si les métadonnées échouent.
      }
    };
    void charger();
    const interval = window.setInterval(charger, 30_000);
    return () => {
      actif = false;
      window.clearInterval(interval);
    };
  }, [metadataUrl]);

  function basculer() {
    const audio = audioRef.current;
    if (audio === null) return;
    if (enCours) {
      audio.pause();
      setEnCours(false);
      return;
    }
    audio
      .play()
      .then(() => setEnCours(true))
      .catch((e) => setErreur(`Lecture impossible : ${e?.message ?? 'erreur inconnue'}`));
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={basculer}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-grad text-white shadow-brand transition hover:brightness-110"
          aria-label={enCours ? 'Mettre en pause' : 'Lancer la lecture'}
        >
          {enCours ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="flex-1">
          <p className="font-bold text-text-1">
            {emission?.titre ?? 'Maintenant Radio — en direct'}
          </p>
          {emission?.artiste !== undefined && emission.artiste !== '' ? (
            <p className="text-sm text-text-3">{emission.artiste}</p>
          ) : (
            <p className="text-sm text-text-3">Flux live AzuraCast</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-text-3" aria-hidden />
          <label className="sr-only" htmlFor="radio-volume">
            Volume
          </label>
          <input
            id="radio-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24 accent-brand"
          />
        </div>
      </div>
      {erreur !== null ? <p className="text-xs text-danger">{erreur}</p> : null}
      <audio ref={audioRef} src={fluxUrl} preload="none">
        <track kind="captions" />
      </audio>
    </div>
  );
}
