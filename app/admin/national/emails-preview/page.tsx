import { Heading } from '@/components/ui';
import { ctaEmail, gabaritEmailHTML } from '@/lib/email/gabarit';
import { Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prévisualisation des emails',
};

/**
 * Console admin de prévisualisation des gabarits d'email (V2.5.16 Phase L).
 *
 * Rend trois exemples typiques (confirmation, RGPD, adhésion) dans une
 * iframe pour voir à quoi ressemblent les emails que le site envoie.
 * Permet d'itérer sur le design sans devoir déclencher de vrais envois
 * via les Server Actions.
 *
 * Pour modifier le design : `lib/email/gabarit.ts > gabaritEmailHTML`.
 * Pour modifier les textes : passer par le CMS (clés `email.*`).
 */

interface ExemplePreview {
  titre: string;
  description: string;
  preheader: string;
  contenu: string;
}

const EXEMPLES: ExemplePreview[] = [
  {
    titre: 'Confirme ton adhésion',
    description: 'Exemple : email envoyé après une adhésion en attente de paiement.',
    preheader: 'Bienvenue dans le mouvement !',
    contenu: `
<p>Bonjour Camille,</p>
<p>Bienvenue dans le mouvement <strong>Maintenant!</strong>. Ton adhésion en euros est presque finalisée. Il te reste juste à confirmer ton paiement.</p>
${ctaEmail('Confirmer mon adhésion', 'https://maintenant-le-mouvement.org/agir/adherer/retour')}
<p>Une fois ton adhésion confirmée, tu pourras :</p>
<ul>
  <li>Rejoindre une commune libre près de chez toi</li>
  <li>Participer aux votes en assemblée confédérale</li>
  <li>Lancer tes propres pétitions et mobilisations</li>
</ul>
<p>À très vite,<br>L'équipe Maintenant!</p>
`,
  },
  {
    titre: 'Suppression de ton compte programmée dans 30 jours',
    description: 'Exemple : email RGPD envoyé après une demande de suppression.',
    preheader: 'Tu peux annuler à tout moment',
    contenu: `
<p>Bonjour,</p>
<p>Ta demande de suppression est enregistrée. Ton compte sera définitivement anonymisé dans <strong>30 jours</strong>.</p>
<p>Tu peux annuler à tout moment d'ici là en te reconnectant et en cliquant « Annuler la suppression » depuis ton profil.</p>
${ctaEmail('Annuler ma demande', 'https://maintenant-le-mouvement.org/profil/confidentialite')}
<p>Si tu n'es pas l'auteur·rice de cette demande, contacte-nous immédiatement.</p>
<p>L'équipe Maintenant!</p>
`,
  },
  {
    titre: 'Ton adhésion à Maintenant! arrive à échéance',
    description: 'Exemple : email de relance avant expiration.',
    preheader: 'Renouvelle gratuitement, en euros ou en 99-coin',
    contenu: `
<p>Bonjour Camille,</p>
<p>Ton adhésion à Maintenant! arrive à échéance dans les <strong>14 jours</strong>.</p>
<p>Si tu souhaites rester adhérent·e, tu peux renouveler en trois cliquettes :</p>
${ctaEmail('Renouveler mon adhésion', 'https://maintenant-le-mouvement.org/agir/adherer')}
<p>Trois options de cotisation au choix :</p>
<ul>
  <li><strong>Gratuit</strong> : pour celles et ceux qui n'ont pas les moyens</li>
  <li><strong>12 €</strong> par an</li>
  <li><strong>12 T99CP</strong> (99-coin)</li>
</ul>
<p>L'équipe Maintenant!</p>
`,
  },
  // V2.5.27 V2.5.16.d — Previews des templates email reseau. Pas encore
  // appeles automatiquement (anti-spam), un futur systeme de preferences
  // utilisateurice decidera quand basculer cloche → email.
  {
    titre: 'Tu as reçu un nouveau message',
    description: 'Exemple : email de notification reseau social — message direct.',
    preheader: "Camille t'a envoyé un message",
    contenu: `
<p>Bonjour,</p>
<p><strong>Camille</strong> t'a envoyé un message sur le réseau Maintenant!.</p>
${ctaEmail('Lire le message', 'https://maintenant-le-mouvement.org/s-informer/reseau/messages')}
<p>L'équipe Maintenant!</p>
`,
  },
  {
    titre: 'Ta publication a un nouveau commentaire',
    description: 'Exemple : email de notification reseau social — commentaire.',
    preheader: 'Camille a commenté ta publication',
    contenu: `
<p>Bonjour,</p>
<p><strong>Camille</strong> a commenté ta publication sur le réseau Maintenant!.</p>
${ctaEmail('Voir la conversation', 'https://maintenant-le-mouvement.org/s-informer/reseau')}
<p>L'équipe Maintenant!</p>
`,
  },
  {
    titre: 'Ta publication a un nouveau soutien',
    description: 'Exemple : email de notification reseau social — soutien.',
    preheader: 'Camille soutient ta publication',
    contenu: `
<p>Bonjour,</p>
<p><strong>Camille</strong> soutient ta publication sur le réseau Maintenant!.</p>
${ctaEmail('Voir la publication', 'https://maintenant-le-mouvement.org/s-informer/reseau')}
<p>L'équipe Maintenant!</p>
`,
  },
];

export default async function PagePreviewEmails() {
  const previews = await Promise.all(
    EXEMPLES.map(async (ex) => ({
      ex,
      html: await gabaritEmailHTML(ex.contenu, {
        titre: ex.titre,
        preheader: ex.preheader,
        avecDesinscription: false,
      }),
    })),
  );

  return (
    <>
      <Heading niveau={1}>
        <Mail size={22} className="-mt-1 mr-2 inline" aria-hidden="true" />
        Prévisualisation des emails
      </Heading>
      <p className="mt-2 text-sm text-text-3">
        Voici à quoi ressemblent les emails que le site envoie. Pour modifier la mise en page :
        <code className="ml-1 font-mono text-xs">lib/email/gabarit.ts</code>. Pour modifier les
        textes des templates : console CMS (clés <code className="font-mono text-xs">email.*</code>
        ).
      </p>

      <div className="mt-6 grid gap-8">
        {previews.map(({ ex, html }) => (
          <section
            key={ex.titre}
            className="overflow-hidden rounded-lg border border-border bg-surface"
          >
            <header className="border-b border-border bg-surface-2 px-4 py-3">
              <p className="font-bold text-text-1">{ex.titre}</p>
              <p className="text-sm text-text-3">{ex.description}</p>
            </header>
            <iframe
              srcDoc={html}
              title={`Prévisualisation : ${ex.titre}`}
              className="block w-full"
              style={{ height: 600, border: 0 }}
              sandbox=""
            />
          </section>
        ))}
      </div>
    </>
  );
}
