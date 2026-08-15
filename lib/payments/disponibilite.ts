/**
 * Le paiement réel est-il branché ?
 *
 * Garde-fou posé le 01/08/2026. Le site a tourné en ligne avec le
 * simulateur : un don « confirmé » s'enregistrait alors qu'aucun euro
 * n'avait bougé. Plutôt qu'un site qui encaisse pour de faux, on préfère
 * un site qui n'affiche pas le bouton.
 *
 * Toute interface proposant de payer (don à une cagnotte, adhésion à
 * 12 €) doit appeler cette fonction et se masquer si elle renvoie
 * `false`. Le middleware s'en sert aussi pour fermer les adresses de
 * paiement avant tout rendu. Le simulateur reste utilisable en
 * développement local, où c'est utile et où personne ne croit donner de
 * l'argent.
 *
 * ## Pourquoi ce fichier est séparé de `./index`
 *
 * Même raison que `./frais` : `index.ts` importe `MockPaymentService`,
 * qui utilise `node:crypto`. Or le middleware ne tourne pas dans un
 * environnement Node complet — l'import ferait échouer toutes les pages
 * du site. Ce module n'a donc **aucune dépendance** : il ne lit que des
 * variables d'environnement, et peut être importé de partout.
 *
 * @returns `true` si un vrai encaissement est possible.
 */
export function paiementReelDisponible(): boolean {
  const provider = process.env.PAYMENT_PROVIDER;
  const cle = process.env.STRIPE_SECRET_KEY;
  const providerStripe = provider === 'stripe_test' || provider === 'stripe_live';
  return providerStripe && cle !== undefined && cle !== '';
}
