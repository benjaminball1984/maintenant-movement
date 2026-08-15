'use client';

import { inscrireALaNewsletter } from '@/app/actions/newsletter';
import { Alert, Button, Input, Label } from '@/components/ui';
import { useState, useTransition } from 'react';

/**
 * Bloc d'inscription à la newsletter, posé en bas de toutes les pages
 * publiques (juste avant le pied de page).
 *
 * Décision de Lilou/Ben (01/08/2026) : la newsletter doit se croiser
 * quelle que soit la page lue, sans jamais interrompre la lecture. D'où
 * ce bandeau sobre plutôt qu'une fenêtre surgissante.
 *
 * Client Component parce qu'il garde un état local (message de retour,
 * envoi en cours). L'inscription elle-même se fait côté serveur, dans
 * `app/actions/newsletter.ts` : la clé Brevo ne quitte jamais le serveur.
 *
 * Accessibilité : le message de retour est annoncé aux lecteurs d'écran
 * (`role="status"`), et le champ porte un vrai `<Label>` — masqué à
 * l'œil, présent pour les technologies d'assistance.
 */
export function BlocNewsletter() {
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();

  function gererEnvoi(donnees: FormData) {
    demarrer(async () => {
      const resultat = await inscrireALaNewsletter(donnees);
      setMessage({ ok: resultat.ok, texte: resultat.message });
    });
  }

  return (
    <section aria-labelledby="newsletter-titre" className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-4xl gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <h2 id="newsletter-titre" className="font-display text-xl font-bold text-text-1">
            Recevoir les nouvelles
          </h2>
          <p className="mt-1 text-sm text-text-2">
            Le récap du mardi, l'édito du vendredi. Désinscription en un clic, jamais de revente
            d'adresse.
          </p>
        </div>

        {message !== null ? (
          <Alert variant={message.ok ? 'success' : 'warning'}>{message.texte}</Alert>
        ) : null}

        <form action={gererEnvoi} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="newsletter-email" className="sr-only">
              Adresse email
            </Label>
            <Input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="prenom@exemple.fr"
            />
          </div>
          <Button type="submit" disabled={enCours}>
            {enCours ? 'Envoi…' : 'Je m’inscris'}
          </Button>
        </form>
      </div>
    </section>
  );
}
