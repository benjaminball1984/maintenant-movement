import { distanceKmArrondie, distanceMetres, formaterDistance } from '@/lib/distance-gps';
import { describe, expect, it } from 'vitest';

// Points de référence.
const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const LYON = { latitude: 45.764, longitude: 4.8357 };
const MARSEILLE = { latitude: 43.2965, longitude: 5.3698 };

describe('distanceMetres', () => {
  it('retourne 0 pour deux points identiques', () => {
    expect(distanceMetres(PARIS, PARIS)).toBe(0);
  });

  it('Paris → Lyon ~392 km', () => {
    const d = distanceMetres(PARIS, LYON);
    expect(d).toBeGreaterThan(390_000);
    expect(d).toBeLessThan(395_000);
  });

  it('Paris → Marseille ~660 km', () => {
    const d = distanceMetres(PARIS, MARSEILLE);
    expect(d).toBeGreaterThan(655_000);
    expect(d).toBeLessThan(665_000);
  });

  it('Lyon → Marseille ~278 km', () => {
    const d = distanceMetres(LYON, MARSEILLE);
    expect(d).toBeGreaterThan(275_000);
    expect(d).toBeLessThan(282_000);
  });

  it('symétrique : d(A,B) === d(B,A)', () => {
    const dAB = distanceMetres(PARIS, LYON);
    const dBA = distanceMetres(LYON, PARIS);
    expect(Math.abs(dAB - dBA)).toBeLessThan(0.001);
  });

  it('petites distances : 2 points proches dans Paris (~1.4 km)', () => {
    const tourEiffel = { latitude: 48.8584, longitude: 2.2945 };
    const arcTriomphe = { latitude: 48.8738, longitude: 2.295 };
    const d = distanceMetres(tourEiffel, arcTriomphe);
    expect(d).toBeGreaterThan(1500);
    expect(d).toBeLessThan(2000);
  });
});

describe('distanceKmArrondie', () => {
  it('arrondit à 1 décimale', () => {
    const d = distanceKmArrondie(PARIS, LYON);
    expect(d).toBeGreaterThan(390);
    expect(d).toBeLessThan(395);
    // Doit avoir au plus 1 décimale
    expect((d * 10) % 1).toBeCloseTo(0, 5);
  });
});

describe('formaterDistance', () => {
  it('formate en m si < 1 km', () => {
    const a = { latitude: 48.8584, longitude: 2.2945 };
    const b = { latitude: 48.8585, longitude: 2.2946 };
    expect(formaterDistance(a, b)).toMatch(/^\d+ m$/);
  });

  it('formate en km avec virgule décimale si < 10 km', () => {
    const tourEiffel = { latitude: 48.8584, longitude: 2.2945 };
    const arcTriomphe = { latitude: 48.8738, longitude: 2.295 };
    const r = formaterDistance(tourEiffel, arcTriomphe);
    expect(r).toMatch(/^\d+,\d km$/);
  });

  it('formate en km sans décimale si >= 10 km', () => {
    const r = formaterDistance(PARIS, LYON);
    expect(r).toMatch(/^\d+ km$/);
  });
});
