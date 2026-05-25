/**
 * Avatar rond du réseau social : photo si disponible, sinon initiales sur fond
 * de marque. Composant présentationnel (utilisable côté serveur et client).
 */
export function AvatarReseau({
  nom,
  photoUrl,
  taillePx = 40,
}: {
  /** Nom affiché (sert aux initiales de repli). */
  nom: string;
  /** URL de la photo, ou null. */
  photoUrl: string | null;
  /** Diamètre en pixels. */
  taillePx?: number;
}) {
  if (photoUrl !== null && photoUrl !== '') {
    return (
      <img
        src={photoUrl}
        alt=""
        width={taillePx}
        height={taillePx}
        className="shrink-0 rounded-full object-cover"
        style={{ width: taillePx, height: taillePx }}
      />
    );
  }

  const initiales =
    nom
      .split(' ')
      .filter((m) => m.trim() !== '')
      .slice(0, 2)
      .map((m) => m[0]?.toUpperCase() ?? '')
      .join('') || 'M';

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand/15 font-bold text-brand"
      style={{ width: taillePx, height: taillePx, fontSize: Math.round(taillePx * 0.4) }}
    >
      {initiales}
    </span>
  );
}
