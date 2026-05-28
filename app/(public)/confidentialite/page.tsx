import { PageEditorialeCMS } from '@/components/contenu/PageEditorialeCMS';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
};

/**
 * Fallback de la politique de confidentialité. Le CMS peut sur-écrire
 * intégralement (cf. directive 0bis.8 d'éditabilité). Le cadre juridique
 * suit le Master Plan V2.6 §4.3 et reste conforme au RGPD européen.
 */
const FALLBACK = `Maintenant! collecte le strict nécessaire au fonctionnement du mouvement. Nous ne vendons pas vos données et ne les transmettons pas à des tiers à des fins commerciales.

## Responsable de traitement

Le responsable de traitement est le **Collectif Maintenant**, association de fait portant le mouvement Maintenant!, représentée à ce jour par Ben (LIFE BENJAMIN BALL, cosec gé). Le collectif sera prochainement constitué en association loi 1901 et ces informations seront mises à jour à cette date.

Pour toute demande relative à vos données, contactez : [adresse à compléter — courriel DPD ou contact général].

## Délégué·e à la protection des données

[À désigner — désignation collégiale par le collectif. Courriel dédié : dpd@maintenant-le-mouvement.org]

## Principes

- **Pas de traceur publicitaire ni de cookie tiers à des fins de profilage.** Les seuls cookies posés sont fonctionnels (session, préférences d'affichage).
- **Hébergement en Union européenne** (Supabase, région Francfort, Allemagne).
- **Consentement granulaire et révocable** : vous choisissez par finalité ce que vous acceptez de partager (visibilité publique, partage interne au mouvement, agrégation statistique). Voir /profil/confidentialite.
- **Minimisation** : nous ne demandons que ce qui est nécessaire à l'action que vous voulez mener (signer une pétition n'exige pas votre adresse postale, par exemple).
- **Aucune revente, aucun partage à des tiers** à des fins commerciales.

## Quelles données collectons-nous ?

Selon votre niveau d'engagement, nous collectons :

- **À la signature d'une pétition** : prénom, nom (ou pseudonyme), code postal, courriel, consentement explicite. C'est le minimum permettant de garantir qu'une signature correspond à une personne réelle et distincte.
- **À l'adhésion** : en complément, date de naissance (pour vérifier la majorité), téléphone optionnel, montant et mode de cotisation.
- **À la création de contenu** (publication, commentaire, annonce) : auteur·rice, contenu publié, métadonnées techniques (date, IP transitoirement pour la modération anti-spam).
- **À la participation à un sondage** : votre réponse et, progressivement et de façon optionnelle, des éléments de qualification du profil sociologique (CSP, type de commune, etc.) sur un panel limité de questions. Religion et origine ethnique exclues par principe.
- **Pour les paiements** : les données nécessaires sont gérées par notre prestataire de paiement (Stripe), nous n'avons pas accès à votre numéro de carte. Nous conservons uniquement la trace de la transaction (montant, date, finalité).

## Combien de temps conservons-nous ces données ?

- **Données de compte** : tant que le compte est actif, plus 12 mois après la dernière connexion. Puis anonymisation automatique.
- **Données de pétition** : conservées 5 ans pour permettre l'usage historique (mémoire du mouvement, attestation de campagne).
- **Données comptables et fiscales** : conservées 10 ans (obligation légale).
- **Logs techniques** : 12 mois maximum.
- **Données anonymisées** (statistiques agrégées) : conservées sans limite, car elles ne permettent plus de vous identifier.

## Vos droits

Conformément au Règlement général sur la protection des données (RGPD, règlement UE 2016/679), vous pouvez à tout moment :

- **Accéder à vos données** (export ZIP complet via /profil/confidentialite)
- **Les rectifier** (édition directe depuis votre espace profil)
- **Les supprimer** : suppression différée de 30 jours pour permettre la récupération en cas d'erreur, puis anonymisation irréversible
- **Vous opposer à un traitement** (par exemple aux relances par courriel)
- **Retirer un consentement** précédemment donné, à tout moment, sans avoir à vous justifier
- **Demander la portabilité** de vos données vers un autre service
- **Définir des directives relatives au sort de vos données après votre décès**

Pour exercer ces droits : écrivez au DPD (courriel ci-dessus), nous répondons sous 30 jours maximum.

## Réclamation

En cas de désaccord persistant, vous avez le droit d'introduire une réclamation auprès de la **CNIL** (Commission Nationale de l'Informatique et des Libertés, 3 place de Fontenoy, 75007 Paris, www.cnil.fr).

## Cookies

Nous posons uniquement des cookies fonctionnels :

- **Session d'authentification** : pour vous garder connecté·e d'une page à l'autre. Durée : la session, puis effacé à la déconnexion ou après 30 jours d'inactivité.
- **Préférences d'affichage** : mode clair/sombre, langue. Durée : 1 an.

Aucun cookie tiers de mesure d'audience ou de publicité n'est posé.

## Modifications

Cette politique peut évoluer (notamment lors de la constitution officielle de l'association). Toute modification substantielle sera signalée par courriel aux personnes ayant un compte, et la date de la dernière mise à jour figurera en bas de cette page.

[Date de dernière mise à jour : à inscrire automatiquement par le CMS]
`;

export default function PagePolitiqueConfidentialite() {
  return (
    <PageEditorialeCMS
      surtitre="Vie privée"
      titreParDefaut="Politique de confidentialité"
      cle="page.confidentialite"
      loremFallback={FALLBACK}
    />
  );
}
