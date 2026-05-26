import { MockImageStorage } from '@/lib/storage/MockImageStorage';
import { TAILLE_MAX_OCTETS } from '@/lib/storage/types';
import { describe, expect, it } from 'vitest';

/**
 * Tests du mock du service Image Storage. Le mock convertit le fichier en
 * data URL base64 ; il valide MIME et taille comme l'implémentation
 * Supabase (deuxième ligne de défense côté serveur).
 */

function fichierFactice(nom: string, mime: string, octets: number): File {
  const bytes = new Uint8Array(octets);
  for (let i = 0; i < octets; i++) bytes[i] = (i * 37) & 0xff;
  return new File([bytes], nom, { type: mime });
}

describe('MockImageStorage.televerser', () => {
  it('accepte un JPEG valide et renvoie un data URL', async () => {
    const storage = new MockImageStorage();
    const fichier = fichierFactice('photo.jpg', 'image/jpeg', 1024);
    const resultat = await storage.televerser(fichier, 'couverture');
    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect(resultat.url.startsWith('data:image/jpeg;base64,')).toBe(true);
      expect(resultat.cheminBucket).toContain('couverture');
    }
  });

  it('accepte un PNG valide', async () => {
    const storage = new MockImageStorage();
    const fichier = fichierFactice('img.png', 'image/png', 500);
    const resultat = await storage.televerser(fichier, 'vignette');
    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect(resultat.url.startsWith('data:image/png;base64,')).toBe(true);
    }
  });

  it('accepte un WebP valide', async () => {
    const storage = new MockImageStorage();
    const fichier = fichierFactice('img.webp', 'image/webp', 500);
    const resultat = await storage.televerser(fichier, 'icone');
    expect(resultat.ok).toBe(true);
  });

  it('refuse un PDF (MIME non autorisé)', async () => {
    const storage = new MockImageStorage();
    const fichier = fichierFactice('doc.pdf', 'application/pdf', 200);
    const resultat = await storage.televerser(fichier, 'couverture');
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) {
      expect(resultat.message).toMatch(/format non supporté/i);
    }
  });

  it('refuse un GIF (pas dans la liste blanche actuelle)', async () => {
    const storage = new MockImageStorage();
    const fichier = fichierFactice('anim.gif', 'image/gif', 200);
    const resultat = await storage.televerser(fichier, 'couverture');
    expect(resultat.ok).toBe(false);
  });

  it('refuse un fichier sans type MIME déclaré', async () => {
    const storage = new MockImageStorage();
    const fichier = fichierFactice('mystere', '', 200);
    const resultat = await storage.televerser(fichier, 'couverture');
    expect(resultat.ok).toBe(false);
  });

  it('refuse un fichier qui dépasse la taille maximale', async () => {
    const storage = new MockImageStorage();
    const fichier = fichierFactice('lourd.jpg', 'image/jpeg', TAILLE_MAX_OCTETS + 1);
    const resultat = await storage.televerser(fichier, 'couverture');
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) {
      expect(resultat.message).toMatch(/volumineux/i);
    }
  });

  it('accepte un fichier exactement à la taille maximale', async () => {
    const storage = new MockImageStorage();
    const fichier = fichierFactice('limite.jpg', 'image/jpeg', TAILLE_MAX_OCTETS);
    const resultat = await storage.televerser(fichier, 'couverture');
    expect(resultat.ok).toBe(true);
  });

  it('intègre le préfixe dans le chemin retourné', async () => {
    const storage = new MockImageStorage();
    const fichier = fichierFactice('p.jpg', 'image/jpeg', 100);
    const resultat = await storage.televerser(fichier, 'couverture', 'petitions/42');
    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect(resultat.cheminBucket).toContain('petitions/42');
    }
  });
});

describe('MockImageStorage.supprimer', () => {
  it('renvoie ok=true (no-op) quel que soit le chemin', async () => {
    const storage = new MockImageStorage();
    expect(await storage.supprimer('peu_importe')).toEqual({ ok: true });
    expect(await storage.supprimer('mock://couverture/x.jpg')).toEqual({ ok: true });
  });
});
