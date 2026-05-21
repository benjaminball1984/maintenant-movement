'use client';

import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import { ChampMotDePasse } from '@/components/formulaires/ChampMotDePasse';
import { Alert, Button, Input, Label } from '@/components/ui';
import { type DonneesInscription, inscriptionSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { inscrire } from '../actions';

/**
 * Formulaire d'inscription : nom, prénom, pronom, email, code postal,
 * téléphone optionnel, date de naissance (15 ans min), mot de passe,
 * Turnstile, case CGU obligatoire.
 *
 * Validation côté client par Zod + react-hook-form, puis revalidation
 * côté serveur dans la Server Action `inscrire`.
 */
export function FormulaireInscription() {
  const router = useRouter();
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  // Si Supabase signale que l'email est deja en base, on affiche en
  // plus du message d'erreur deux liens d'action utiles : aller a la
  // connexion ou demander un reset de mot de passe.
  const [dejaInscrit, setDejaInscrit] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  // `hydrate` reste a false tant que le useEffect cote client n'a pas
  // tourne. Tant qu'il vaut false on desactive le bouton de submit, ce
  // qui empeche un clic premature de tomber en GET natif et d'exposer
  // le mot de passe dans l'URL (cf. incident chantier 13.1).
  const [hydrate, setHydrate] = useState(false);
  useEffect(() => {
    setHydrate(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesInscription>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      token_turnstile: '',
      cgu_acceptees: false,
    },
  });

  async function onSubmit(donnees: DonneesInscription) {
    setErreurServeur(null);
    setDejaInscrit(false);
    setEnvoiEnCours(true);
    const resultat = await inscrire(donnees);
    setEnvoiEnCours(false);

    if (!resultat.ok) {
      setErreurServeur(resultat.message);
      if (resultat.dejaInscrit === true) {
        setDejaInscrit(true);
      }
      return;
    }
    if (resultat.redirectVers !== undefined) {
      router.push(resultat.redirectVers);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4"
      aria-label="Formulaire d'inscription"
    >
      {erreurServeur !== null ? (
        <Alert
          variant={dejaInscrit ? 'info' : 'danger'}
          titre={dejaInscrit ? 'Email déjà inscrit' : 'Erreur'}
        >
          <p>{erreurServeur}</p>
          {dejaInscrit ? (
            <p className="mt-2 flex flex-wrap gap-3 text-sm">
              <Link href="/connexion" className="text-brand underline-offset-4 hover:underline">
                Aller à la connexion
              </Link>
              <Link
                href="/mot-de-passe-oublie"
                className="text-brand underline-offset-4 hover:underline"
              >
                Réinitialiser mon mot de passe
              </Link>
            </p>
          ) : null}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ins-prenom" obligatoire>
            Prénom
          </Label>
          <Input
            id="ins-prenom"
            autoComplete="given-name"
            aria-invalid={errors.prenom !== undefined}
            {...register('prenom')}
          />
          {errors.prenom !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.prenom.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="ins-nom" obligatoire>
            Nom
          </Label>
          <Input
            id="ins-nom"
            autoComplete="family-name"
            aria-invalid={errors.nom !== undefined}
            {...register('nom')}
          />
          {errors.nom !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <Label htmlFor="ins-pronom" obligatoire>
          Pronom
        </Label>
        <Input
          id="ins-pronom"
          placeholder="ex : elle, il, iel, elle/il..."
          aria-invalid={errors.pronom !== undefined}
          aria-describedby="ins-pronom-aide"
          {...register('pronom')}
        />
        <p id="ins-pronom-aide" className="mt-1 text-xs text-text-3">
          Demandé pour te genrer correctement dans la newsletter et les communications.
        </p>
        {errors.pronom !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.pronom.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="ins-email" obligatoire>
          Adresse email
        </Label>
        <Input
          id="ins-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email !== undefined}
          {...register('email')}
        />
        {errors.email !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ins-code-postal" obligatoire>
            Code postal
          </Label>
          <Input
            id="ins-code-postal"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            aria-invalid={errors.code_postal !== undefined}
            {...register('code_postal')}
          />
          {errors.code_postal !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.code_postal.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="ins-telephone">Téléphone (optionnel)</Label>
          <Input
            id="ins-telephone"
            type="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            aria-invalid={errors.telephone !== undefined}
            {...register('telephone')}
          />
          {errors.telephone !== undefined ? (
            <p className="mt-1 text-xs text-danger">{errors.telephone.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <Label htmlFor="ins-date-naissance" obligatoire>
          Date de naissance
        </Label>
        <Input
          id="ins-date-naissance"
          type="date"
          aria-invalid={errors.date_naissance !== undefined}
          aria-describedby="ins-date-aide"
          {...register('date_naissance')}
        />
        <p id="ins-date-aide" className="mt-1 text-xs text-text-3">
          15 ans révolus minimum (recommandation CNIL).
        </p>
        {errors.date_naissance !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.date_naissance.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="ins-mdp" obligatoire>
          Mot de passe
        </Label>
        <ChampMotDePasse
          id="ins-mdp"
          autoComplete="new-password"
          aria-invalid={errors.mot_de_passe !== undefined}
          aria-describedby="ins-mdp-aide"
          {...register('mot_de_passe')}
        />
        <p id="ins-mdp-aide" className="mt-1 text-xs text-text-3">
          12 caractères minimum, au moins 1 minuscule, 1 majuscule et 1 chiffre.
        </p>
        {errors.mot_de_passe !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.mot_de_passe.message}</p>
        ) : null}
      </div>

      <div className="flex items-start gap-2">
        <input
          id="ins-cgu"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded-xs accent-brand"
          aria-invalid={errors.cgu_acceptees !== undefined}
          {...register('cgu_acceptees')}
        />
        <Label htmlFor="ins-cgu" className="m-0 text-sm font-normal text-text-2" obligatoire>
          J'accepte la politique de confidentialité de Maintenant!.
        </Label>
      </div>
      {errors.cgu_acceptees !== undefined ? (
        <p className="-mt-2 text-xs text-danger">{errors.cgu_acceptees.message}</p>
      ) : null}

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />
      {errors.token_turnstile !== undefined ? (
        <p className="text-xs text-danger">{errors.token_turnstile.message}</p>
      ) : null}

      <Button type="submit" disabled={envoiEnCours || !hydrate}>
        {envoiEnCours ? 'Envoi en cours...' : !hydrate ? 'Chargement…' : 'Créer mon compte'}
      </Button>
    </form>
  );
}
