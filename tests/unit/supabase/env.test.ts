import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Vérifie que les getters de variables Supabase :
 * 1. lèvent une erreur claire pointant `.env.example` quand la variable
 *    est absente ou vide,
 * 2. retournent la valeur quand elle est définie.
 *
 * C'est ce qui garantit qu'un déploiement mal configuré échoue tôt et
 * lisiblement, plutôt qu'un crash obscur côté Supabase SDK.
 */
const variables = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

describe('lib/supabase/env', () => {
  const sauvegarde: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const variable of variables) {
      sauvegarde[variable] = process.env[variable];
      delete process.env[variable];
    }
  });

  afterEach(() => {
    for (const variable of variables) {
      const ancienneValeur = sauvegarde[variable];
      if (ancienneValeur === undefined) {
        delete process.env[variable];
      } else {
        process.env[variable] = ancienneValeur;
      }
    }
  });

  describe('quand la variable est absente', () => {
    it('getSupabaseUrl throw avec message pointant .env.example', () => {
      expect(() => getSupabaseUrl()).toThrow(/NEXT_PUBLIC_SUPABASE_URL.*\.env\.example/);
    });

    it('getSupabaseAnonKey throw avec message pointant .env.example', () => {
      expect(() => getSupabaseAnonKey()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY.*\.env\.example/);
    });

    it('getSupabaseServiceRoleKey throw avec message pointant .env.example', () => {
      expect(() => getSupabaseServiceRoleKey()).toThrow(
        /SUPABASE_SERVICE_ROLE_KEY.*\.env\.example/,
      );
    });
  });

  describe('quand la variable est vide', () => {
    it('getSupabaseUrl throw aussi sur chaîne vide', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      expect(() => getSupabaseUrl()).toThrow(/manquante/);
    });
  });

  describe('quand la variable est définie', () => {
    it('getSupabaseUrl retourne la valeur', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://exemple.supabase.co';
      expect(getSupabaseUrl()).toBe('https://exemple.supabase.co');
    });

    it('getSupabaseAnonKey retourne la valeur', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'cle-anon-test';
      expect(getSupabaseAnonKey()).toBe('cle-anon-test');
    });

    it('getSupabaseServiceRoleKey retourne la valeur', () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'cle-service-test';
      expect(getSupabaseServiceRoleKey()).toBe('cle-service-test');
    });
  });
});
