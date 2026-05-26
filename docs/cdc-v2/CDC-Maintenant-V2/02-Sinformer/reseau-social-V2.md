# Réseau social (7.5) — Spécifications V2

> **Espace** : S'informer
> **Fichier** : reseau-social-V2.md
> **Version** : 1.0
> **Session** : 2026-05-26
> Signature : LIFE BENJAMIN BALL.
> Dépend de : principes-transversaux-V2.md (lire en premier).

---

## 0. Socle (rappel — acté sessions antérieures)
- **Relations** : ami·e (bidirectionnel, demande + acceptation) et follower (unidirectionnel), compteur « Suivi·e par X ».
- **Messagerie** type Messenger (asynchrone + instantané, individuel ET fil de groupe — cf. principes §18).
- **Confidentialité des publications** : choix au moment de publier.
- **Événements** : invitations une par une, pas de lien de masse.
- **Pas de pub.** Encart de financement permanent discret (« sans publicité, financé par ses membres » → modale don, 99-coin ou euros).

---

## 1. Algorithme du flux (le cœur politique)

**5 rangs, grille de composition sur 20 contenus** (dégradé : plus on s'éloigne de soi, plus c'est rare) :
- **Rang 1 — ses propres publications** : 7/20
- **Rang 2 — les amis** : 5/20
- **Rang 3 — amis d'amis, personnes et pages suivies** : 4/20
- **Rang 4 — contenus du site** (pétitions, mobilisations, cagnottes, sondages, articles, campagnes) : 3/20
- **Rang 5 — algorithmique pur + annonces d'entraide** : 1/20

**Rang 5, deux sous-types au même degré de rareté** : (a) contenu **purement algorithmique** (hors réseau, sérendipité, anti-bulle) ; (b) **annonces du système d'entraide** (marché solidaire, covoiturage, hébergement). Reléguées en rang 5 et limitées car trop en avant = allure commerciale. Cohérent §16 (pas de mise en avant par simple proximité).

**Report proportionnel** : quand un rang ne peut remplir son quota (rang vide/maigre, ex. nouvel inscrit sans amis), ses places libres sont redistribuées entre les autres rangs **au prorata de leur poids**. Auto-adaptatif, aucune règle spéciale, se rééquilibre quand la personne tisse son réseau.

**Tri intra-rang — multiplicateur logarithmique** :
- Joue **à l'intérieur d'un rang seulement** (jamais entre rangs : la grille 7-5-4-3-1 est intouchable).
- Score d'interaction pondéré : **commentaire = 3 pts, partage = 2 pts, like = 1 pt**. (Vues passives NON comptées.)
- Multiplicateur entre **1** (moins interagi) et **3** (plus interagi), échelonné par **courbe log** (tasse les grands écarts : 10 000 interactions ≠ 100× plus visible que 100, mais 3× max). Bornes **relatives au fil du moment** (auto-adaptatif, type A).
- Garde-fous anti-emballement (CONTRAINTE Claude Code) : **calcul par snapshot** (pas de réorganisation en direct pendant le scroll) + **scores en cache** (recalculés seulement à chaque nouvelle interaction) + **log borné** (ne peut pas diverger).

---

## 2. Lives
- **Pas d'hébergement de live** en V2 (streaming auto-hébergé = trop lourd, reporté).
- **Lives intégrés autorisés** (embed, on affiche sans héberger) depuis : **LiveKit interne, PeerTube, YouTube, Twitch**.
- Embed **respectueux de la vie privée par défaut** : modes sans cookie (ex. youtube-nocookie), pas de pistage avant clic. Limite la contradiction avec « sans pub/sans tracking ».

---

## 3. Uploads — types autorisés et limites
- **Texte** : oui. **Emojis** : oui. **Stickers** : oui (pas de pack maison à produire). **GIF** : oui (image animée légère).
- **Image** (photo, dessin) : oui, hébergée, plafond ~10 Mo (compression à l'upload).
- **Audio** : oui, hébergé, **max 10 min / ~15 Mo** (vocaux, petits enregistrements ; les podcasts longs → radio/Maintenant Médias).
- **Documents** : oui (PDF, docx, odt, rtf…), plafond ~10 Mo.
- **Vidéo** : **NON hébergée** (coût bande passante insoutenable à 100k membres) → **embed externe uniquement** (PeerTube/YouTube/Twitch). Dimensionnement : héberger images+léger ≈ 200-400 €/mois sur un an ; héberger vidéo = plusieurs milliers/mois (écarté).

### Sécurité des fichiers (CONTRAINTE Claude Code)
- **Liste blanche stricte** : seuls les formats autorisés passent, tout le reste refusé par défaut (plus sûr qu'une liste noire).
- **Vérifier le type réel** du fichier (signature), pas l'extension (un .exe renommé .pdf doit être bloqué).
- **Assainir** : retirer le JS des PDF, nettoyer les SVG, refuser les macros (.docm/.xlsm/.pptm).
- **Bloquer** : exécutables/scripts (.exe, .bat, .sh, .js, .apk…), HTML/SVG non nettoyé.
- **Scan antivirus** (type ClamAV) recommandé, surtout à l'échelle.

---

## 4. Méga-édito vidéo (exception admin)
- **Vidéo native hébergée RÉSERVÉE admin/rédaction**, usage **rarissime** : pousser un contenu fort à tous (alerte, appel au soutien, mobilisation). Un « méga-édito ».
- Justification politique : espace **non neutre**, militant ; se réserver d'occasionnellement faire résonner un message fort à toute la communauté.
- **Hébergement via Cloudflare Stream** (pas Supabase) : absorbe la bande passante d'une vidéo vue par 100k personnes (≈10 To/vidéo) à coût raisonnable.
- **Emplacement** : en **bouchon au-dessus de tout le flux** (hors grille 7-5-4-3-1), pendant sa durée de vie. **Dans le réseau social uniquement** (pas ailleurs).
- **Option supplémentaire** : push dans la **messagerie de tout le mouvement** (chacun reçoit un message — via le canal messagerie interne haute priorité). Le plus intrusif → **écran de confirmation** (« vous allez notifier X membres »).
- **Droit** : techniquement ouvert à tous les admins, mais **décision collective de fait, sur mandat de l'équipe**. **Blocage humain, pas dans le code.** Aucune limite de fréquence codée — parcimonie garantie par la collégialité croissante (cf. §1 principes : cooptation auto-limitante).

---

## 5. Confidentialité et blocage
- **Bloquer un utilisateur** : indispensable. Coupe tout contact (messages, apparition réciproque, interaction). Protection anti-harcèlement.
- **Profil entièrement privé** possible (publications visibles des seul·es ami·es accepté·es) OU profil public, au choix. Coexiste avec le réglage par publication.
- **Règle du plus restrictif** : profil privé + publication « public » = reste limité aux amis (le cadre global prime, pas de fuite involontaire).

---

## 6. Signalement, modération, notes factuelles

### Menu déroulant (petite flèche) sur chaque contenu — 4 actions
1. **Mettre une note factuelle** (sources obligatoires)
2. **Enregistrer** (télécharger/sauvegarder)
3. **Signaler**
4. **Partager en externe** (WhatsApp/Telegram/X/Mastodon/mail…)

### Partage natif (bouton visible, hors menu)
- Destinations internes : **messagerie · groupes/pages · son propre profil**.
- **Taguer une personne autorisé**, mais **déposer un contenu sur le profil d'autrui INTERDIT** (pas de contenu imposé — cohérent « pas de contenu subi »).

### Modération organique
- Modérateur·ices **recrutés par cooptation** (j'en recrute, ils/elles en recrutent — §1 principes).
- **Modération a posteriori** : contenu signalé **reste visible**, mais **remonte dans un flux de modération**. Plus signalé = plus haut = traité plus vite. Le nombre de signalements donne une **priorité**, pas un masquage auto.
- **Anti-meute (humain)** : un modérateur peut cocher **« pas de problème »** sur un contenu légitime signalé par une meute → les signalements suivants ne le font plus remonter (il reste bas, déjà jugé). Protection humaine, pas d'algorithme de pondération.

### Notes factuelles (version Maintenant!, anti « ministère de la vérité »)
- **PAS une alerte sur le contenu** (contrairement à X) → un **système de commentaires annexe** : sous le contenu, les commentaires normaux + un **mini-onglet** donnant accès aux notes factuelles.
- La note **n'écrase pas** le contenu, elle ajoute une couche consultable. Le lecteur garde sa liberté de jugement.
- **Sources obligatoires** : pas de note factuelle sans source.
- Une note factuelle **est un contenu signalable et modérable** comme un autre (sinon faille).

---

## 7. Notifications (rappel — acté 19/05, ne pas rouvrir)
5 canaux : **cloche in-app** (universel, archive vivante) · **messagerie interne** (haute priorité : DM, désignations, objectifs atteints, modération me concernant) · **mail récap hebdo** (mardi, regroupement intelligent) · **newsletter** (vendredi, éditoriale) · **push** (badge numérique, pas de son/vibration par défaut, opt-in). Philosophie : **on respecte l'attention, on ne la capte pas.** Rien d'agressif par défaut.

---

## Reste à faire / à produire
- Recherche (personnes, contenus), page de profil : à border si besoin (non traité, considéré standard).
- Bibliothèque d'images par défaut (cf. §11 principes).
