import { extraireMessage, extraireStack, logErreur } from '@/lib/log-erreur';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('extraireMessage', () => {
  it('extrait .message d’un Error', () => {
    expect(extraireMessage(new Error('boom'))).toBe('boom');
  });

  it('retourne une string telle quelle', () => {
    expect(extraireMessage('hello')).toBe('hello');
  });

  it('extrait .message d’un objet plain', () => {
    expect(extraireMessage({ message: 'objet message' })).toBe('objet message');
  });

  it('extrait .error d’un objet Supabase-like', () => {
    expect(extraireMessage({ error: 'supabase error' })).toBe('supabase error');
  });

  it('JSON.stringify pour objet quelconque', () => {
    expect(extraireMessage({ foo: 'bar' })).toContain('foo');
  });

  it('String() pour primitive', () => {
    expect(extraireMessage(42)).toBe('42');
    expect(extraireMessage(null)).toBe('null');
    expect(extraireMessage(undefined)).toBe('undefined');
  });
});

describe('extraireStack', () => {
  it('retourne stack pour un Error', () => {
    const stack = extraireStack(new Error('boom'));
    expect(stack).toContain('Error');
  });

  it('retourne null pour string', () => {
    expect(extraireStack('hello')).toBeNull();
  });

  it('retourne null pour objet sans stack', () => {
    expect(extraireStack({ message: 'foo' })).toBeNull();
  });

  it('retourne null pour null', () => {
    expect(extraireStack(null)).toBeNull();
  });
});

describe('logErreur', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appelle console.error avec format structuré', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logErreur(new Error('boom'), { module: 'test', operation: 'op' });
    expect(spy).toHaveBeenCalled();
    const args = spy.mock.calls[0]?.[0] as string;
    expect(args).toContain('[ERROR test/op]');
    expect(args).toContain('boom');
  });

  it('inclut les données contextuelles dans le log', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logErreur('oops', {
      module: 'test',
      operation: 'op',
      data: { userId: '123', count: 5 },
    });
    const args = spy.mock.calls[0]?.[0] as string;
    expect(args).toContain('userId');
    expect(args).toContain('123');
  });

  it('ne lance pas si erreur de log', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {
      throw new Error('console died');
    });
    // Ne doit pas re-lancer.
    expect(() => logErreur('oops', { module: 'test', operation: 'op' })).not.toThrow();
  });

  it('omet data section si vide ou absent', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logErreur('hello', { module: 'm', operation: 'o' });
    const args = spy.mock.calls[0]?.[0] as string;
    expect(args.endsWith('hello')).toBe(true); // pas de {...} après
  });
});
