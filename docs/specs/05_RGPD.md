# Contraintes RGPD techniques — Site Maintenant!

**Source** : politique de confidentialité v3 (session 7, 19 mai 2026), décisions S6 + S7.
**Doctrine** : RGPD minimale légale.

---

## 1. Principes structurants

1. **Minimisation** : on ne collecte que les données strictement nécessaires à chaque fonction.
2. **Transparence** : politique de confidentialité publique, claire, à jour.
3. **Pas de cookie publicitaire**, jamais. Pas de traceur tiers.
4. **Pas de bandeau de consentement** (cookies strictement techniques, recommandation CNIL).
5. **Souveraineté maximale** : prestataires UE en priorité (Supabase région UE, Brevo FR), DPF pour les acteurs US assumés (Cloudflare, Stripe).
6. **Droits effectifs** : accès, rectification, suppression, portabilité, opposition opérationnels depuis le profil.

---

## 2. Données collectées (matrice complète)

| Quand | Données | Pourquoi | Base légale | Durée |
|---|---|---|---|---|
| Inscription | Nom, prénom, pronom, email, code postal, téléphone (optionnel) | Créer compte, communiquer | Exécution contrat | Tant qu'actif |
| Newsletter | Email + tags (origine, action, département) | Envoyer mardi récap + vendredi newsletter | Consentement | Tant qu'inscrit·e |
| Signature pétition | Nom, prénom, email, code postal | Donner du poids au signal politique | Intérêt légitime | Jusqu'à archivage pétition |
| Adhésion | Données ci-dessus + paiement (Stripe) | Acter adhésion, émettre reçu | Contrat + obligation comptable | 10 ans (comptable) |
| Cotisation | Idem adhésion | Acter versement | Idem | 10 ans |
| Don | Idem | Acter don | Idem | 10 ans |
| Cagnotte (bénéficiaire) | Pièce d'identité, RIB, justificatifs | Verser fonds, anti-blanchiment | Contrat + obligation légale | 10 ans |
| Espace Décider | Pseudonyme/identifiant, votes, prises de parole | Décision démocratique | Exécution contrat | Selon politique de la salle (voir §6) |
| Sondage | Réponses pondérées | Statistique politique | Consentement | Selon paramétrage sondage |
| Consultation | IP, cookies techniques | Sécurité (Turnstile), fonctionnement | Intérêt légitime | 12 mois max (logs) |
| Photo profil, bio | Optionnelles | Personnalisation | Consentement | Tant qu'actif |
| Wallet T99CP | Adresse Polygon publique | Vérification adhésion T99CP | Contrat | Tant qu'actif |

---

## 3. Sous-traitants (à déclarer dans la politique publique)

| Prestataire | Rôle | Où | Cadre transfert |
|---|---|---|---|
| Cloudflare | Hébergement + anti-bot Turnstile | UE + US | Data Privacy Framework |
| Supabase | BDD + Auth + Storage | UE (Francfort) | Pas de transfert |
| Brevo | Email + newsletter | France | Pas de transfert |
| Stripe | Paiements + KYC Connect | UE + US | Data Privacy Framework |
| LiveKit (autohébergé) | Visio Décider | Infra Maintenant! | Pas de transfert |

**Contrats de sous-traitance RGPD** à signer avec chaque prestataire (DPA = Data Processing Agreement). Cloudflare, Supabase, Brevo, Stripe en proposent en ligne, à intégrer au dossier.

---

## 4. Durées de conservation

| Donnée | Durée |
|---|---|
| Compte actif | Tant que pas de demande de suppression |
| Après demande de suppression | **30 jours de grâce** (réversible), puis anonymisation définitive |
| Newsletter (après désinscription) | Suppression immédiate de l'email de la liste |
| Signatures de pétition | Jusqu'à archivage de la pétition |
| Données comptables (adhésions, dons, cagnottes) | **10 ans** (obligation comptable française) |
| Logs techniques | **12 mois** maximum |
| Logs admin (journal d'audit) | **3 ans** |
| Enregistrements vidéo Décider (Assemblée Confédérale, GT fédéré) | À définir avec Lilou/Ben (proposition : 3 ans accessible, archivage froid après) |
| Tokens de vote anonymes | Conservés sans lien avec la personne (anonyme par construction) |

---

## 5. Implémentation technique

### A. Suppression différée 30 jours

Schema SQL :

```sql
alter table personne add column statut text default 'actif';
-- statuts possibles : 'actif', 'pending_deletion', 'anonymise'

alter table personne add column suppression_demandee_le timestamp;
```

Flux :
1. Personne demande suppression depuis `/profil/confidentialite`.
2. `update personne set statut = 'pending_deletion', suppression_demandee_le = now() where id = ...`
3. Mail de confirmation à la personne (avec lien d'annulation).
4. Pendant 30 jours, la personne peut se reconnecter pour annuler.
5. Cron quotidien (Edge Function Supabase) : recherche les comptes en `pending_deletion` depuis plus de 30 jours, lance l'anonymisation.

### B. Anonymisation

Objectif : effacer les données identifiantes, **préserver les contributions** sous un pseudo « Membre anonyme ».

```sql
-- Fonction d'anonymisation (Supabase Edge Function)
update personne set
  email = null,
  nom = 'Anonyme',
  prenom = 'Membre',
  pronom = null,
  telephone = null,
  code_postal = null,
  photo_url = null,
  bio = null,
  statut = 'anonymise',
  anonymise_le = now()
where id = ...;
```

Les FK vers `personne.id` restent valides. Les contributions (pétitions signées, articles, votes Décider) affichent « Membre anonyme ».

### C. Export ZIP des données

Avant anonymisation, ou à la demande à tout moment depuis `/profil/confidentialite` → bouton « Télécharger mes données ».

Format ZIP contenant :
- `profil.json` (identité)
- `contributions.json` (pétitions, articles, posts, etc.)
- `paiements.json` (historique adhésions/cotisations/dons)
- `messages.json` (messagerie interne)
- `media/` (fichiers uploadés par la personne)
- `README.md` (explication du format)

Génération asynchrone, lien envoyé par mail quand prêt.

### D. RLS Supabase

Toutes les tables qui contiennent des données personnelles ont RLS activée. Politiques types :

```sql
-- Personne peut lire et modifier son propre profil
create policy "Soi-même : lecture profil" on personne
  for select using (auth.uid() = id);

create policy "Soi-même : update profil" on personne
  for update using (auth.uid() = id);

-- Modérateurices ne voient JAMAIS l'email d'une personne, sauf dans la console modération
-- (gérée par une vue spécifique avec colonnes masquées)

-- Admin national : accès complet mais journalisé
create policy "Admin : lecture personne" on personne
  for select using (
    exists (select 1 from droit_admin where personne_id = auth.uid() and niveau = 'national')
  );
```

### E. Validation email systématique

À l'inscription : `email_verifie = false`. Mail avec lien magique. Au clic → `email_verifie = true`. **Tant que l'email n'est pas vérifié**, le compte ne peut pas :
- adhérer
- créer du contenu
- signer une pétition (en tant que personne authentifiée)

Mais peut consulter le site en lecture.

### F. 2FA

- **Optionnelle** pour toustes les comptes (TOTP : Google Authenticator, Aegis, etc.).
- **Obligatoire** pour les comptes administration (animation, modération, trésorerie). Détection au login : si `personne.role in ('moderation', 'admin', 'tresorerie')` et `personne.totp_secret is null`, redirection vers `/profil/securite/2fa` à la première connexion suivant l'attribution du droit.

### G. Mineur·es (15 ans minimum)

- Champ `date_naissance` obligatoire à l'inscription.
- Validation : `date_naissance` ≤ `now() - interval '15 years'`. Si non, refus avec message clair.
- Pas d'accord parental (volontairement, doctrine).
- Contrôles a posteriori sur signalement : si doute raisonnable, suspension du compte, demande de justificatif d'âge, suppression si non confirmé.

### H. Cookies (politique minimaliste)

Cookies utilisés :
1. **Cookie de session Supabase** : authentification. Strictement nécessaire. Pas de consentement requis.
2. **Cookie Cloudflare Turnstile** : anti-bot. Strictement nécessaire. Pas de consentement requis.
3. **Cookie Stripe** : uniquement lors du paiement, sur la page Stripe Checkout (hébergée par Stripe). Pas notre responsabilité directe.

**Pas de bandeau de consentement** (recommandation CNIL pour ces 3 cookies strictement techniques).

### I. Cloudflare Turnstile

Sur **tous les formulaires publics** :
- Inscription
- Connexion
- Signature de pétition
- Création de contenu (mais aussi avec auth, redondance)
- Contact

Implémentation côté client + vérification côté serveur (`/api/turnstile/verify`).

### J. Webhooks signés

- **Stripe** : vérifier signature `Stripe-Signature` avec `STRIPE_WEBHOOK_SECRET`.
- **Brevo** : vérifier la signature ou utiliser des IPs autorisées + secret.
- **T99CP** : vérifier les confirmations on-chain via le RPC Polygon.

### K. Audit log (journal_admin)

Toute action admin journalisée :

```sql
create table journal_admin (
  id bigserial primary key,
  admin_id uuid references personne(id),
  action text not null,           -- ex: 'moderation_suppression_petition'
  cible_table text,               -- ex: 'petition'
  cible_id uuid,                  -- id de l'entité touchée
  ancien_etat jsonb,
  nouvel_etat jsonb,
  ip text,
  user_agent text,
  cree_le timestamp default now()
);
```

Conservation 3 ans. Consultable par DPD et cosec gé.

---

## 6. Décider et RGPD (cas particulier)

### Votes anonymes

Les votes sont **anonymes par construction** : table `vote` avec `proposition_id`, `mention`, `token_id`, **pas de `personne_id`**. Le `token_id` est lié à la personne dans une table séparée `token_emis` qui est purgée à la fin du vote.

### Procès-verbaux

Conservés au sein de la commune/GT/fédération. Privacy selon périmètre (voir `01_ARCHITECTURE.md` §4F). Les personnes mentionnées dans un PV peuvent demander suppression de leur nom (anonymisation rétroactive).

### Enregistrements vidéo

- Commune locale : pas par défaut. Si enregistré sur demande, téléchargement aux participant·es, **pas de stockage sur les serveurs Maintenant!**.
- Assemblée Confédérale : enregistrement systématique, public. Mention claire avant le début de la séance.
- Groupe fédéré thématique : live transparent + replay. Mention claire.

Conservation 3 ans accessible, archivage froid après (à confirmer en S8).

---

## 7. DPD (Délégué·e à la protection des données)

- **Bénévole interne**, désigné·e par les cosec gé en collégial.
- **Pas Lilou** (conflit d'intérêt structurel : cosec gé + décision technique).
- Formation **MOOC CNIL « L'atelier RGPD »** (5h, gratuit) obligatoire avant prise de fonction.
- Déclaration CNIL formelle.
- Email dédié : `dpd@maintenant-le-mouvement.org` (ou équivalent).
- Reçoit toutes les demandes d'exercice de droits dans un délai max d'**un mois**.

---

## 8. Procédure d'exercice des droits

Depuis `/profil/confidentialite` :

| Droit | Action UI | Implémentation |
|---|---|---|
| Accès | « Voir mes données » | Affichage récap consolidé |
| Rectification | « Modifier mes informations » | Édition directe profil |
| Effacement | « Supprimer mon compte » | Flux 30j décrit §5A |
| Portabilité | « Télécharger mes données » | Export ZIP §5C |
| Opposition | « Désactiver newsletter / contact » | Toggles dans préférences |
| Limitation | « Suspendre temporairement » | À implémenter (flag `actif: false`) |

Pour les droits qui ne peuvent pas être exercés en self-service (rare), formulaire vers le DPD.

---

## 9. Notifications RGPD

- **À la création de compte** : lien clair vers la politique de confidentialité, case à cocher « J'ai lu et j'accepte ».
- **Aux changements substantiels de la politique** : mail à toustes les inscrit·es avec résumé des changements.
- **À la fin de période de grâce 30 j** : mail rappel avant suppression définitive.
- **À l'envoi de l'export ZIP** : mail avec lien temporaire (24h).

---

## 10. Migration Base44 (cas particulier)

- 946 membres + ~9k newsletter + ~16k signataires importés.
- **Pas de notification individuelle obligatoire** (décision S7, doctrine RGPD minimale légale).
- **MAJ de la politique de confidentialité** sur le nouveau site = obligation suffisante.
- Préserver les consentements explicites (newsletter, etc.) tels qu'ils ont été donnés sur Base44 (à exporter avec les comptes).

---

## 11. Checklist avant mise en ligne

- [ ] Politique de confidentialité v3 publiée, tous les placeholders remplis (adresse, DPD, RNA, dates).
- [ ] DPD désigné·e, formé·e, déclaré·e à la CNIL.
- [ ] Tous les DPA signés (Cloudflare, Supabase, Brevo, Stripe).
- [ ] RLS activée sur toutes les tables avec données personnelles.
- [ ] Test de suppression différée 30 j en environnement préprod.
- [ ] Test export ZIP en environnement préprod.
- [ ] 2FA testée pour comptes admin.
- [ ] Audit log opérationnel.
- [ ] Cron d'anonymisation déployé et monitoré.
- [ ] Cloudflare Turnstile en place sur tous les formulaires publics.
- [ ] Mention RGPD dans le footer du site.
- [ ] Page contact DPD opérationnelle.
