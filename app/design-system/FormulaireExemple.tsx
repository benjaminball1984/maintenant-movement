'use client';

import { Button, Input, Label, Textarea } from '@/components/ui';
import type { FormEvent } from 'react';

/**
 * Formulaire de démonstration interne à `/design-system`.
 *
 * Isolé en Client Component parce qu'il a un handler `onSubmit` qui
 * empêche la vraie soumission (ce n'est pas un vrai endpoint). Le reste
 * du showcase reste Server Component.
 */
export function FormulaireExemple() {
  function intercepter(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
  }

  return (
    <form className="grid max-w-xl gap-4" onSubmit={intercepter} aria-label="Exemple de formulaire">
      <div>
        <Label htmlFor="ds-prenom" obligatoire>
          Prénom
        </Label>
        <Input id="ds-prenom" name="prenom" placeholder="Camille" required />
      </div>
      <div>
        <Label htmlFor="ds-email" obligatoire>
          Adresse email
        </Label>
        <Input id="ds-email" name="email" type="email" placeholder="camille@exemple.fr" required />
      </div>
      <div>
        <Label htmlFor="ds-email-err">Email (état d'erreur, démo statique)</Label>
        <Input
          id="ds-email-err"
          name="email-err"
          type="email"
          aria-invalid="true"
          defaultValue="pas-un-email"
        />
        <p className="mt-1 text-xs text-danger">Le format de l'email semble incorrect.</p>
      </div>
      <div>
        <Label htmlFor="ds-message">Message</Label>
        <Textarea id="ds-message" name="message" placeholder="Votre message..." />
      </div>
      <div className="flex gap-3">
        <Button type="submit">Envoyer</Button>
        <Button variant="ghost" type="reset">
          Réinitialiser
        </Button>
      </div>
    </form>
  );
}
