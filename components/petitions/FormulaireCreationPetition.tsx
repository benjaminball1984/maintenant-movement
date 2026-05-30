'use client';

import { declarerOrganisationInitiatriceAction } from '@/app/actions/organisation';
import { CaptchaTurnstile } from '@/components/formulaires/CaptchaTurnstile';
import {
  ChampOrganisationInitiatrice,
  DECLARATION_ORG_DEFAUT,
  type DeclarationOrgInitiatrice,
} from '@/components/organisations/ChampOrganisationInitiatrice';
import { Alert, Button, ChampImageObjet, Input, Label, Textarea } from '@/components/ui';
import {
  MESSAGES_VALIDATION_PETITION_DEFAUT,
  type MessagesValidationPetition,
} from '@/lib/messages-validation';
import type { OrganisationGeree } from '@/lib/organisations/liaisons';
import { type DonneesCreerPetition, creerPetitionFactory } from '@/lib/validations/petition';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

/** Libelles surchargeables admin via CMS (V2.4.149). */
export interface LibellesCreationPetition {
  alertErreurTitre: string;
  labelTitre: string;
  placeholderTitre: string;
  labelDestinataire: string;
  placeholderDestinataire: string;
  hintDestinataire: string;
  labelImage: string;
  labelTexte: string;
  placeholderTexte: string;
  labelObjectif: string;
  hintObjectif: string;
  ctaSubmit: string;
  ctaEnCours: string;
}

const LIBELLES_DEFAUT: LibellesCreationPetition = {
  alertErreurTitre: 'Création impossible',
  labelTitre: 'Titre',
  placeholderTitre: 'Exemple : Pour le retour des trains de nuit en Auvergne',
  labelDestinataire: 'Destinataire',
  placeholderDestinataire: 'Exemple : Ministre des Transports',
  hintDestinataire: "À qui s'adresse cette pétition (institution, élu·e, entreprise).",
  labelImage: 'Image illustrative (optionnelle)',
  labelTexte: 'Texte de la pétition',
  placeholderTexte: 'Décris le problème et la demande. Argumente. 100 à 10000 caractères.',
  labelObjectif: 'Objectif chiffré (nombre de signataires)',
  hintObjectif: "Entre 100 et 1 000 000. Au franchissement de 90 %, l'objectif sera étiré ×1,5.",
  ctaSubmit: 'Soumettre pour modération',
  ctaEnCours: 'Envoi en cours...',
};

interface FormulaireCreationPetitionProps {
  /**
   * Server Action de création. Reçue par prop pour conserver une
   * frontière nette client/serveur (cf. ADR-002 sur les Server Actions
   * passées en props plutôt qu'importées côté client).
   */
  creerPetition: (
    donnees: unknown,
  ) => Promise<{ ok: true; slug: string; id: string } | { ok: false; message: string }>;
  /** Organisations gérées par la personne (B.4 : déclarer une orga porteuse). */
  mesOrganisations?: OrganisationGeree[];
  libelles?: LibellesCreationPetition;
  messages?: MessagesValidationPetition;
}

/**
 * Formulaire de création d'une pétition (composant client).
 *
 * Champs (cf. `lib/validations/petition.ts`) :
 *   - titre (5-200)
 *   - texte (100-5000)
 *   - destinataire (5-200)
 *   - image_url (optionnel)
 *   - objectif (entier 100-1 000 000)
 *
 * Sur succès, redirige vers la fiche détail. La pétition apparaîtra en
 * attente de modération : la créatrice la voit grâce à la RLS, le reste
 * du public ne la voit qu'une fois publiée.
 */
export function FormulaireCreationPetition({
  creerPetition,
  mesOrganisations = [],
  libelles = LIBELLES_DEFAUT,
  messages = MESSAGES_VALIDATION_PETITION_DEFAUT,
}: FormulaireCreationPetitionProps) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [declarationOrg, setDeclarationOrg] =
    useState<DeclarationOrgInitiatrice>(DECLARATION_ORG_DEFAUT);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonneesCreerPetition>({
    resolver: zodResolver(creerPetitionFactory(messages)),
    defaultValues: {
      titre: '',
      texte: '',
      destinataire: '',
      image_url: '',
      // useForm `defaultValue` doit être typé : on met 100 (le minimum)
      // pour éviter une valeur undefined transformée en NaN par Zod.
      objectif: 1000,
      token_turnstile: '',
    },
  });

  async function onSubmit(donnees: DonneesCreerPetition) {
    setErreur(null);
    setEnvoiEnCours(true);
    const resultat = await creerPetition(donnees);

    if (!resultat.ok) {
      setEnvoiEnCours(false);
      setErreur(resultat.message);
      return;
    }

    // B.4 §7.3 : déclarer l'organisation initiatrice (best-effort : un échec
    // n'empêche pas la redirection, le rattachement reste possible après coup).
    if (declarationOrg.mode !== 'aucune') {
      await declarerOrganisationInitiatriceAction({
        objet_type: 'petition',
        objet_id: resultat.id,
        mode: declarationOrg.mode,
        org_id: declarationOrg.orgId === '' ? undefined : declarationOrg.orgId,
        nom: declarationOrg.nom === '' ? undefined : declarationOrg.nom,
        type_organisation: declarationOrg.typeOrganisation,
      });
    }

    setEnvoiEnCours(false);
    router.push(`/mobiliser/petitions/${resultat.slug}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {erreur !== null ? (
        <Alert variant="danger" titre={libelles.alertErreurTitre}>
          {erreur}
        </Alert>
      ) : null}

      <div>
        <Label htmlFor="petition-titre" obligatoire>
          {libelles.labelTitre}
        </Label>
        <Input id="petition-titre" placeholder={libelles.placeholderTitre} {...register('titre')} />
        {errors.titre !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.titre.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="petition-destinataire" obligatoire>
          {libelles.labelDestinataire}
        </Label>
        <Input
          id="petition-destinataire"
          placeholder={libelles.placeholderDestinataire}
          {...register('destinataire')}
        />
        <p className="mt-1 text-xs text-text-3">{libelles.hintDestinataire}</p>
        {errors.destinataire !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.destinataire.message}</p>
        ) : null}
      </div>

      <ChampImageObjet
        name="image_url"
        libelle={libelles.labelImage}
        onChange={(url) => setValue('image_url', url ?? '')}
      />
      {errors.image_url !== undefined ? (
        <p className="-mt-2 text-xs text-danger">{errors.image_url.message}</p>
      ) : null}

      <div>
        <Label htmlFor="petition-texte" obligatoire>
          {libelles.labelTexte}
        </Label>
        <Textarea
          id="petition-texte"
          rows={10}
          placeholder={libelles.placeholderTexte}
          {...register('texte')}
        />
        {errors.texte !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.texte.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="petition-objectif" obligatoire>
          {libelles.labelObjectif}
        </Label>
        <Input
          id="petition-objectif"
          type="number"
          inputMode="numeric"
          min={100}
          max={1_000_000}
          step={100}
          // valueAsNumber : sans cela RHF renvoie une string et Zod
          // refuse au lieu de coercer.
          {...register('objectif', { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-text-3">{libelles.hintObjectif}</p>
        {errors.objectif !== undefined ? (
          <p className="mt-1 text-xs text-danger">{errors.objectif.message}</p>
        ) : null}
      </div>

      <ChampOrganisationInitiatrice
        mesOrganisations={mesOrganisations}
        value={declarationOrg}
        onChange={setDeclarationOrg}
      />

      <CaptchaTurnstile onChange={(token) => setValue('token_turnstile', token)} />

      <div className="flex gap-3">
        <Button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? libelles.ctaEnCours : libelles.ctaSubmit}
        </Button>
      </div>
    </form>
  );
}
