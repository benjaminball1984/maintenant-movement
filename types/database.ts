/**
 * Types TypeScript miroir du schéma Supabase posé au chantier 1.1.
 *
 * Format compatible avec `supabase gen types typescript --linked` : une
 * fois le projet Supabase créé et lié au CLI, on régénère ce fichier
 * automatiquement et il remplacera le contenu manuel ci-dessous.
 *
 * Conventions :
 * - Les unions de string literals (statut, niveau, type) viennent des
 *   CHECK constraints SQL.
 * - `Row` = ce qu'on lit (toutes colonnes obligatoires, sauf nullable).
 * - `Insert` = ce qu'on écrit en INSERT (les colonnes à default sont
 *   optionnelles).
 * - `Update` = patch (tout est optionnel).
 */

/** Type JSON récursif standard Supabase. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ============================================================
// Unions de statuts (depuis CHECK constraints SQL)
// ============================================================

export type StatutPersonne = 'actif' | 'pending_deletion' | 'anonymise';
export type ModeTheme = 'auto' | 'light' | 'dark';
export type StatutCreationCommune = 'pre_creee' | 'auto_creee';
export type TypeFederation = 'geographique' | 'thematique' | 'mixte';
export type NiveauDroitAdmin =
  | 'national'
  | 'admin'
  | 'moderation'
  | 'tresorerie'
  | 'animation'
  | 'dpd';

export type StatutPetition = 'en_moderation' | 'publiee' | 'rejetee' | 'archivee';
export type StatutMobilisation = 'publiee' | 'retiree';
export type StatutCampagne = 'en_moderation' | 'publiee' | 'rejetee' | 'archivee';
export type TypeModuleCampagne =
  | 'petition'
  | 'mobilisation'
  | 'cagnotte'
  | 'sondage'
  | 'page_editoriale';
export type TypeCagnotte = 'ouverte' | 'lutte' | 'cotisation';
export type StatutCagnotte = 'publiee' | 'suspendue' | 'cloturee';
export type MonnaieDon = 'EUR' | 'T99CP';
export type StatutDon = 'en_attente' | 'confirme' | 'echoue' | 'rembourse';
export type TypeOffreEntraide = 'hebergement' | 'transport' | 'pret_objet' | 'fruits_terre';
export type SensOffreEntraide = 'propose' | 'cherche';
export type StatutOffreEntraide = 'publiee' | 'retiree' | 'cloturee';
export type CategorieServiceSel = 'service' | 'volontariat';
export type SensServiceSel = 'propose' | 'cherche';
export type StatutServiceSel = 'publie' | 'retire' | 'cloture';
export type StatutPrestationSel =
  | 'en_attente'
  | 'en_moderation'
  | 'creditee'
  | 'contestee'
  | 'annulee';

// Chantier 4.3 — Marché solidaire (3 onglets : Produit / Boutique / Minimarché).
export type ModeProduitMarche = 'vente' | 'don';
export type StatutProduitMarche = 'disponible' | 'reserve' | 'vendu' | 'retire' | 'expire';
export type SensBoutiqueMarche = 'propose' | 'cherche';
export type StatutBoutiqueMarche = 'ouverte' | 'fermee' | 'retiree';
export type StatutMinimarche = 'annonce' | 'en_cours' | 'termine' | 'annule' | 'retire';
/**
 * Catalogue des monnaies acceptées en physique (minimarché).
 * Cf. spec §6F : 4 monnaies acceptées (T99CP, Euros, Ğ1, Monnaies
 * locales complémentaires). Ğ1 et MNLC réservées au physique.
 */
export type MonnaieMarcheMinimarche = 'T99CP' | 'EUR' | 'G1' | 'MNLC';

// Chantier 5.1 — Adhérer (3 chemins).
export type CheminAdhesion = 'gratuit' | 'euros' | 't99cp';
export type StatutAdhesion = 'active' | 'expiree' | 'annulee';

// Chantier 5.2 — Assemblée Confédérale.
export type EntiteConfederal = 'commune' | 'federation' | 'confederation';
export type StatutMandat = 'actif' | 'libere';

// Chantier 5.3 — Moments solidaires (8 types).
export type TypeMomentSolidaire =
  | 'porte_a_porte'
  | 'maraude'
  | 'vide_grenier_solidaire'
  | 'soutien'
  | 'manifestation'
  | 'rencontre'
  | 'concert_solidaire'
  | 'repas_solidaire';
export type StatutMomentSolidaire = 'annonce' | 'en_cours' | 'termine' | 'annule' | 'retire';
export type StatutTupperware = 'emporte' | 'rendu' | 'perdu';
/**
 * Sous-types du porte-à-porte solidaire en 7 moments (cf. spec §7C).
 * Pour les autres types, `sous_type` est null.
 */
export type SousTypeMomentPaP =
  | 'pap_1er_passage'
  | 'pap_2e_passage'
  | 'pap_tri'
  | 'pap_distribution'
  | 'pap_maraude_invit'
  | 'pap_repas'
  | 'pap_volontaires';

// Chantier 5.4 — D'autres moyens d'agir.
export type StatutOrganisationPartenaire = 'affichee' | 'retiree';

// Chantier 7.1 — Maintenant Médias (9 types couvrant la spec §4A).
export type TypeMedia =
  | 'edito'
  | 'tribune'
  | 'article'
  | 'breve'
  | 'dessin'
  | 'podcast'
  | 'video'
  | 'live'
  | 'newsletter';
export type StatutMedia = 'brouillon' | 'publie' | 'retire' | 'archive';

// Chantier 7.4 — Sondages (2 modes).
export type ModeSondage = 'classique' | 'pondere';
export type StatutSondage = 'ouvert' | 'ferme' | 'archive' | 'retire';
export type TrancheAge = 'moins_18' | '18_24' | '25_34' | '35_49' | '50_64' | '65_plus';

// ============================================================
// Database
// ============================================================

export interface Database {
  public: {
    Tables: {
      personne: {
        Row: {
          id: string;
          email: string | null;
          nom: string | null;
          prenom: string | null;
          pronom: string | null;
          date_naissance: string | null;
          code_postal: string | null;
          telephone: string | null;
          photo_url: string | null;
          bio: string | null;
          statut: StatutPersonne;
          email_verifie: boolean;
          totp_secret: string | null;
          preferences_visibilite: Json;
          mode_theme: ModeTheme | null;
          suppression_demandee_le: string | null;
          anonymise_le: string | null;
          derniere_connexion_le: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          nom?: string | null;
          prenom?: string | null;
          pronom?: string | null;
          date_naissance?: string | null;
          code_postal?: string | null;
          telephone?: string | null;
          photo_url?: string | null;
          bio?: string | null;
          statut?: StatutPersonne;
          email_verifie?: boolean;
          totp_secret?: string | null;
          preferences_visibilite?: Json;
          mode_theme?: ModeTheme | null;
          suppression_demandee_le?: string | null;
          anonymise_le?: string | null;
          derniere_connexion_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['personne']['Insert']>;
        Relationships: [];
      };

      commune: {
        Row: {
          id: string;
          slug: string;
          nom: string;
          code_insee: string | null;
          code_postal_principal: string | null;
          departement: string | null;
          region: string | null;
          latitude: number | null;
          longitude: number | null;
          description_courte: string | null;
          image_url: string | null;
          statut_creation: StatutCreationCommune;
          createurice_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nom: string;
          code_insee?: string | null;
          code_postal_principal?: string | null;
          departement?: string | null;
          region?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          description_courte?: string | null;
          image_url?: string | null;
          statut_creation?: StatutCreationCommune;
          createurice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['commune']['Insert']>;
        Relationships: [];
      };

      appartenance_commune: {
        Row: {
          id: string;
          personne_id: string;
          commune_id: string;
          rejointe_le: string;
          quittee_le: string | null;
          est_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          personne_id: string;
          commune_id: string;
          rejointe_le?: string;
          quittee_le?: string | null;
          est_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appartenance_commune']['Insert']>;
        Relationships: [];
      };

      federation: {
        Row: {
          id: string;
          slug: string;
          nom: string;
          type: TypeFederation;
          description_courte: string | null;
          image_url: string | null;
          createurice_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nom: string;
          type?: TypeFederation;
          description_courte?: string | null;
          image_url?: string | null;
          createurice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['federation']['Insert']>;
        Relationships: [];
      };

      appartenance_federation: {
        Row: {
          id: string;
          commune_id: string;
          federation_id: string;
          rejointe_le: string;
          quittee_le: string | null;
          est_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          commune_id: string;
          federation_id: string;
          rejointe_le?: string;
          quittee_le?: string | null;
          est_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appartenance_federation']['Insert']>;
        Relationships: [];
      };

      confederation: {
        Row: {
          id: string;
          slug: string;
          nom: string;
          description_courte: string | null;
          image_url: string | null;
          createurice_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nom: string;
          description_courte?: string | null;
          image_url?: string | null;
          createurice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['confederation']['Insert']>;
        Relationships: [];
      };

      appartenance_confederation: {
        Row: {
          id: string;
          federation_id: string;
          confederation_id: string;
          rejointe_le: string;
          quittee_le: string | null;
          est_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          federation_id: string;
          confederation_id: string;
          rejointe_le?: string;
          quittee_le?: string | null;
          est_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appartenance_confederation']['Insert']>;
        Relationships: [];
      };

      gt_thematique: {
        Row: {
          id: string;
          slug: string;
          nom: string;
          sujet: string;
          description: string | null;
          image_url: string | null;
          createurice_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nom: string;
          sujet: string;
          description?: string | null;
          image_url?: string | null;
          createurice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gt_thematique']['Insert']>;
        Relationships: [];
      };

      appartenance_gt: {
        Row: {
          id: string;
          personne_id: string;
          gt_thematique_id: string;
          rejointe_le: string;
          quittee_le: string | null;
          est_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          personne_id: string;
          gt_thematique_id: string;
          rejointe_le?: string;
          quittee_le?: string | null;
          est_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appartenance_gt']['Insert']>;
        Relationships: [];
      };

      droit_admin: {
        Row: {
          id: string;
          personne_id: string;
          niveau: NiveauDroitAdmin;
          scope_commune_id: string | null;
          perimetre_onglet: string[] | null;
          accorde_par: string | null;
          accorde_le: string;
          retire_par: string | null;
          retire_le: string | null;
        };
        Insert: {
          id?: string;
          personne_id: string;
          niveau: NiveauDroitAdmin;
          scope_commune_id?: string | null;
          perimetre_onglet?: string[] | null;
          accorde_par?: string | null;
          accorde_le?: string;
          retire_par?: string | null;
          retire_le?: string | null;
        };
        Update: Partial<Database['public']['Tables']['droit_admin']['Insert']>;
        Relationships: [];
      };

      journal_admin: {
        Row: {
          id: number;
          admin_id: string | null;
          action: string;
          cible_table: string | null;
          cible_id: string | null;
          ancien_etat: Json | null;
          nouvel_etat: Json | null;
          ip: string | null;
          user_agent: string | null;
          cree_le: string;
        };
        Insert: {
          id?: number;
          admin_id?: string | null;
          action: string;
          cible_table?: string | null;
          cible_id?: string | null;
          ancien_etat?: Json | null;
          nouvel_etat?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          cree_le?: string;
        };
        Update: Partial<Database['public']['Tables']['journal_admin']['Insert']>;
        Relationships: [];
      };

      petition: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          texte: string;
          destinataire: string;
          image_url: string | null;
          objectif: number;
          createurice_id: string;
          statut: StatutPetition;
          modere_par: string | null;
          modere_le: string | null;
          raison_rejet: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          texte: string;
          destinataire: string;
          image_url?: string | null;
          objectif: number;
          createurice_id: string;
          statut?: StatutPetition;
          modere_par?: string | null;
          modere_le?: string | null;
          raison_rejet?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['petition']['Insert']>;
        Relationships: [];
      };

      signature_petition: {
        Row: {
          id: string;
          petition_id: string;
          personne_id: string | null;
          nom: string;
          prenom: string;
          email: string;
          code_postal: string;
          telephone: string | null;
          accepte_newsletter: boolean;
          accepte_contact_createurice: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          petition_id: string;
          personne_id?: string | null;
          nom: string;
          prenom: string;
          email: string;
          code_postal: string;
          telephone?: string | null;
          accepte_newsletter?: boolean;
          accepte_contact_createurice?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['signature_petition']['Insert']>;
        Relationships: [];
      };

      mobilisation: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          description: string;
          image_url: string | null;
          lieu: string;
          latitude: number | null;
          longitude: number | null;
          date_debut: string;
          date_fin: string | null;
          createurice_id: string;
          statut: StatutMobilisation;
          retire_par: string | null;
          retire_le: string | null;
          raison_retrait: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          description: string;
          image_url?: string | null;
          lieu: string;
          latitude?: number | null;
          longitude?: number | null;
          date_debut: string;
          date_fin?: string | null;
          createurice_id: string;
          statut?: StatutMobilisation;
          retire_par?: string | null;
          retire_le?: string | null;
          raison_retrait?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mobilisation']['Insert']>;
        Relationships: [];
      };

      participation_mobilisation: {
        Row: {
          id: string;
          mobilisation_id: string;
          personne_id: string | null;
          code_postal: string | null;
          accepte_notifications: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          mobilisation_id: string;
          personne_id?: string | null;
          code_postal?: string | null;
          accepte_notifications?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['participation_mobilisation']['Insert']>;
        Relationships: [];
      };

      campagne: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          texte: string;
          image_url: string | null;
          createurice_id: string;
          statut: StatutCampagne;
          modere_par: string | null;
          modere_le: string | null;
          raison_rejet: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          texte: string;
          image_url?: string | null;
          createurice_id: string;
          statut?: StatutCampagne;
          modere_par?: string | null;
          modere_le?: string | null;
          raison_rejet?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['campagne']['Insert']>;
        Relationships: [];
      };

      module_campagne: {
        Row: {
          id: string;
          campagne_id: string;
          type_module: TypeModuleCampagne;
          cible_id: string | null;
          contenu_editorial: string | null;
          ordre: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          campagne_id: string;
          type_module: TypeModuleCampagne;
          cible_id?: string | null;
          contenu_editorial?: string | null;
          ordre?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['module_campagne']['Insert']>;
        Relationships: [];
      };

      cagnotte: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          texte: string;
          image_url: string | null;
          type: TypeCagnotte;
          objectif_euros: number;
          createurice_id: string;
          stripe_account_id: string | null;
          wallet_t99cp: string | null;
          statut: StatutCagnotte;
          suspendue_par: string | null;
          suspendue_le: string | null;
          raison_suspension: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          texte: string;
          image_url?: string | null;
          type: TypeCagnotte;
          objectif_euros?: number;
          createurice_id: string;
          stripe_account_id?: string | null;
          wallet_t99cp?: string | null;
          statut?: StatutCagnotte;
          suspendue_par?: string | null;
          suspendue_le?: string | null;
          raison_suspension?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cagnotte']['Insert']>;
        Relationships: [];
      };

      offre_entraide: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          description: string;
          image_url: string | null;
          type: TypeOffreEntraide;
          sens: SensOffreEntraide;
          lieu: string;
          latitude: number | null;
          longitude: number | null;
          meta: Json;
          createurice_id: string;
          statut: StatutOffreEntraide;
          retire_par: string | null;
          retire_le: string | null;
          raison_retrait: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          description: string;
          image_url?: string | null;
          type: TypeOffreEntraide;
          sens: SensOffreEntraide;
          lieu: string;
          latitude?: number | null;
          longitude?: number | null;
          meta?: Json;
          createurice_id: string;
          statut?: StatutOffreEntraide;
          retire_par?: string | null;
          retire_le?: string | null;
          raison_retrait?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['offre_entraide']['Insert']>;
        Relationships: [];
      };

      service_sel: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          description: string;
          categorie: CategorieServiceSel;
          sens: SensServiceSel;
          duree_minutes_estimee: number;
          lieu: string;
          latitude: number | null;
          longitude: number | null;
          createurice_id: string;
          statut: StatutServiceSel;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          description: string;
          categorie: CategorieServiceSel;
          sens: SensServiceSel;
          duree_minutes_estimee: number;
          lieu: string;
          latitude?: number | null;
          longitude?: number | null;
          createurice_id: string;
          statut?: StatutServiceSel;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['service_sel']['Insert']>;
        Relationships: [];
      };

      prestation_sel: {
        Row: {
          id: string;
          service_id: string;
          prestataire_id: string;
          beneficiaire_id: string;
          duree_minutes_reelle: number | null;
          statut: StatutPrestationSel;
          reservee_le: string;
          declaree_realisee_le: string | null;
          creditee_le: string | null;
          contestee_le: string | null;
          annulee_le: string | null;
          tx_hash_credit: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          prestataire_id: string;
          beneficiaire_id: string;
          duree_minutes_reelle?: number | null;
          statut?: StatutPrestationSel;
          reservee_le?: string;
          declaree_realisee_le?: string | null;
          creditee_le?: string | null;
          contestee_le?: string | null;
          annulee_le?: string | null;
          tx_hash_credit?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['prestation_sel']['Insert']>;
        Relationships: [];
      };

      don: {
        Row: {
          id: string;
          cagnotte_id: string;
          personne_id: string | null;
          prenom: string | null;
          nom: string | null;
          email: string | null;
          code_postal: string | null;
          monnaie: MonnaieDon;
          montant_centimes: number;
          frais_centimes: number;
          stripe_payment_intent_id: string | null;
          tx_hash: string | null;
          statut: StatutDon;
          accepte_newsletter: boolean;
          accepte_contact_createurice: boolean;
          created_at: string;
          confirme_le: string | null;
        };
        Insert: {
          id?: string;
          cagnotte_id: string;
          personne_id?: string | null;
          prenom?: string | null;
          nom?: string | null;
          email?: string | null;
          code_postal?: string | null;
          monnaie: MonnaieDon;
          montant_centimes: number;
          frais_centimes?: number;
          stripe_payment_intent_id?: string | null;
          tx_hash?: string | null;
          statut?: StatutDon;
          accepte_newsletter?: boolean;
          accepte_contact_createurice?: boolean;
          created_at?: string;
          confirme_le?: string | null;
        };
        Update: Partial<Database['public']['Tables']['don']['Insert']>;
        Relationships: [];
      };

      // ============================================================
      // Chantier 4.3 — Marché solidaire
      // ============================================================

      produit_marche: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          description: string;
          mode: ModeProduitMarche;
          prix_euros_centimes: number;
          /** Plus petite unité T99CP, sérialisée en string (bigint-safe). */
          prix_t99cp_unites: string;
          categorie_slug: string | null;
          image_url: string | null;
          lieu: string;
          latitude: number | null;
          longitude: number | null;
          remise_main_propre: boolean;
          envoi_postal: boolean;
          vendeureuse_id: string;
          statut: StatutProduitMarche;
          derniere_activite_le: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          description: string;
          mode: ModeProduitMarche;
          prix_euros_centimes?: number;
          prix_t99cp_unites?: string;
          categorie_slug?: string | null;
          image_url?: string | null;
          lieu: string;
          latitude?: number | null;
          longitude?: number | null;
          remise_main_propre?: boolean;
          envoi_postal?: boolean;
          vendeureuse_id: string;
          statut?: StatutProduitMarche;
          derniere_activite_le?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['produit_marche']['Insert']>;
        Relationships: [];
      };

      boutique_marche: {
        Row: {
          id: string;
          slug: string;
          nom: string;
          description: string;
          image_url: string | null;
          sens: SensBoutiqueMarche;
          ouverte_du: string | null;
          ouverte_au: string | null;
          lieu: string | null;
          latitude: number | null;
          longitude: number | null;
          createurice_id: string;
          statut: StatutBoutiqueMarche;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nom: string;
          description: string;
          image_url?: string | null;
          sens: SensBoutiqueMarche;
          ouverte_du?: string | null;
          ouverte_au?: string | null;
          lieu?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          createurice_id: string;
          statut?: StatutBoutiqueMarche;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['boutique_marche']['Insert']>;
        Relationships: [];
      };

      produit_boutique: {
        Row: {
          id: string;
          produit_id: string;
          boutique_id: string;
          rattache_le: string;
          rattache_par: string;
        };
        Insert: {
          id?: string;
          produit_id: string;
          boutique_id: string;
          rattache_le?: string;
          rattache_par: string;
        };
        Update: Partial<Database['public']['Tables']['produit_boutique']['Insert']>;
        Relationships: [];
      };

      minimarche_solidaire: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          description: string;
          image_url: string | null;
          lieu: string;
          latitude: number | null;
          longitude: number | null;
          commence_le: string;
          termine_le: string;
          monnaies_acceptees: MonnaieMarcheMinimarche[];
          createurice_id: string;
          statut: StatutMinimarche;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          description: string;
          image_url?: string | null;
          lieu: string;
          latitude?: number | null;
          longitude?: number | null;
          commence_le: string;
          termine_le: string;
          monnaies_acceptees?: MonnaieMarcheMinimarche[];
          createurice_id: string;
          statut?: StatutMinimarche;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['minimarche_solidaire']['Insert']>;
        Relationships: [];
      };

      sondage: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          question: string;
          options: string[];
          image_url: string | null;
          mode: ModeSondage;
          commune_id: string | null;
          latitude: number | null;
          longitude: number | null;
          createurice_id: string;
          statut: StatutSondage;
          ferme_le: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          question: string;
          options: string[];
          image_url?: string | null;
          mode?: ModeSondage;
          commune_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          createurice_id: string;
          statut?: StatutSondage;
          ferme_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sondage']['Insert']>;
        Relationships: [];
      };

      reponse_sondage: {
        Row: {
          id: string;
          sondage_id: string;
          personne_id: string;
          option_index: number;
          code_postal: string | null;
          tranche_age: TrancheAge | null;
          pronom: string | null;
          genre_declare: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sondage_id: string;
          personne_id: string;
          option_index: number;
          code_postal?: string | null;
          tranche_age?: TrancheAge | null;
          pronom?: string | null;
          genre_declare?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reponse_sondage']['Insert']>;
        Relationships: [];
      };

      media: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          corps: string;
          type: TypeMedia;
          auteurice_id: string | null;
          provenance_externe: string | null;
          source_url: string | null;
          media_url: string | null;
          vignette_url: string | null;
          tags: string[] | null;
          statut: StatutMedia;
          publie_le: string | null;
          retire_par: string | null;
          retire_le: string | null;
          raison_retrait: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          corps: string;
          type: TypeMedia;
          auteurice_id?: string | null;
          provenance_externe?: string | null;
          source_url?: string | null;
          media_url?: string | null;
          vignette_url?: string | null;
          tags?: string[] | null;
          statut?: StatutMedia;
          publie_le?: string | null;
          retire_par?: string | null;
          retire_le?: string | null;
          raison_retrait?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['media']['Insert']>;
        Relationships: [];
      };

      organisation_partenaire: {
        Row: {
          id: string;
          nom: string;
          slug: string;
          description_courte: string | null;
          url: string;
          categorie_slug: string | null;
          statut: StatutOrganisationPartenaire;
          raison_retrait: string | null;
          retire_par: string | null;
          retire_le: string | null;
          ajoute_par: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          slug: string;
          description_courte?: string | null;
          url: string;
          categorie_slug?: string | null;
          statut?: StatutOrganisationPartenaire;
          raison_retrait?: string | null;
          retire_par?: string | null;
          retire_le?: string | null;
          ajoute_par: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organisation_partenaire']['Insert']>;
        Relationships: [];
      };

      moment_solidaire: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          description: string;
          type: TypeMomentSolidaire;
          sous_type: string | null;
          parent_id: string | null;
          lieu: string;
          latitude: number | null;
          longitude: number | null;
          commence_le: string;
          termine_le: string | null;
          commune_id: string | null;
          cause_locale: string | null;
          capacite_max: number | null;
          meta: Json;
          createurice_id: string;
          statut: StatutMomentSolidaire;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          description: string;
          type: TypeMomentSolidaire;
          sous_type?: string | null;
          parent_id?: string | null;
          lieu: string;
          latitude?: number | null;
          longitude?: number | null;
          commence_le: string;
          termine_le?: string | null;
          commune_id?: string | null;
          cause_locale?: string | null;
          capacite_max?: number | null;
          meta?: Json;
          createurice_id: string;
          statut?: StatutMomentSolidaire;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['moment_solidaire']['Insert']>;
        Relationships: [];
      };

      participation_moment: {
        Row: {
          id: string;
          moment_id: string;
          personne_id: string | null;
          prenom: string | null;
          email: string | null;
          telephone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          moment_id: string;
          personne_id?: string | null;
          prenom?: string | null;
          email?: string | null;
          telephone?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['participation_moment']['Insert']>;
        Relationships: [];
      };

      tupperware: {
        Row: {
          id: string;
          moment_id: string;
          porteureuse_prenom: string;
          porteureuse_email: string | null;
          porteureuse_telephone: string | null;
          contenu: string | null;
          emporte_le: string;
          rendu_le: string | null;
          statut: StatutTupperware;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          moment_id: string;
          porteureuse_prenom: string;
          porteureuse_email?: string | null;
          porteureuse_telephone?: string | null;
          contenu?: string | null;
          emporte_le?: string;
          rendu_le?: string | null;
          statut?: StatutTupperware;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tupperware']['Insert']>;
        Relationships: [];
      };

      mandat_confederal: {
        Row: {
          id: string;
          personne_id: string;
          entite_type: EntiteConfederal;
          entite_id: string;
          tire_le: string;
          tirage_seed: string | null;
          statut: StatutMandat;
          libere_le: string | null;
          raison_liberation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          personne_id: string;
          entite_type: EntiteConfederal;
          entite_id: string;
          tire_le?: string;
          tirage_seed?: string | null;
          statut?: StatutMandat;
          libere_le?: string | null;
          raison_liberation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mandat_confederal']['Insert']>;
        Relationships: [];
      };

      adhesion: {
        Row: {
          id: string;
          personne_id: string;
          chemin: CheminAdhesion;
          montant_euros_centimes: number;
          /** Plus petite unité T99CP (string bigint-safe). */
          montant_t99cp_unites: string;
          debute_le: string;
          expire_le: string;
          statut: StatutAdhesion;
          stripe_session_id: string | null;
          tx_hash: string | null;
          relance_envoyee_le: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          personne_id: string;
          chemin: CheminAdhesion;
          montant_euros_centimes?: number;
          montant_t99cp_unites?: string;
          debute_le?: string;
          expire_le?: string;
          statut?: StatutAdhesion;
          stripe_session_id?: string | null;
          tx_hash?: string | null;
          relance_envoyee_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['adhesion']['Insert']>;
        Relationships: [];
      };

      notation_marche: {
        Row: {
          id: string;
          produit_id: string;
          acheteureuse_id: string;
          vendeureuse_id: string;
          etoiles: number;
          commentaire: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          produit_id: string;
          acheteureuse_id: string;
          vendeureuse_id: string;
          etoiles: number;
          commentaire?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notation_marche']['Insert']>;
        Relationships: [];
      };
    };

    Views: {
      petition_compteur: {
        Row: {
          petition_id: string;
          slug: string;
          titre: string;
          objectif: number;
          statut: StatutPetition;
          nombre_signatures: number;
        };
        Relationships: [];
      };
      cagnotte_compteur: {
        Row: {
          cagnotte_id: string;
          slug: string;
          objectif_euros: number;
          total_euros_centimes: number;
          total_t99cp_unites: number;
          nombre_dons: number;
        };
        Relationships: [];
      };
      sondage_resultats: {
        Row: {
          sondage_id: string;
          option_index: number;
          nombre_votes: number;
        };
        Relationships: [];
      };
      notation_marche_stats: {
        Row: {
          vendeureuse_id: string;
          moyenne_etoiles: number;
          nombre_notations: number;
        };
        Relationships: [];
      };
      adherent_actif: {
        Row: {
          personne_id: string;
          adhesion_id: string;
          chemin: CheminAdhesion;
          debute_le: string;
          expire_le: string;
          statut: StatutAdhesion;
        };
        Relationships: [];
      };
    };

    Functions: {
      est_admin_national: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      est_admin_general: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      est_moderateurice: {
        Args: { onglet_demande?: string | null };
        Returns: boolean;
      };
      est_animation_commune: {
        Args: { commune_a_verifier: string };
        Returns: boolean;
      };
      est_membre_commune: {
        Args: { commune_a_verifier: string };
        Returns: boolean;
      };
      est_dpd: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      nombre_signatures: {
        Args: { petition_a_compter: string };
        Returns: number;
      };
      nombre_participant_es: {
        Args: { mobilisation_a_compter: string };
        Returns: number;
      };
      compteurs_cagnotte: {
        Args: { cagnotte_a_compter: string };
        Returns: {
          total_euros_centimes: number;
          total_t99cp_unites: number;
          nombre_dons: number;
        }[];
      };
      prestations_a_crediter: {
        Args: { seuil_minutes?: number };
        Returns: Array<Database['public']['Tables']['prestation_sel']['Row']>;
      };
      adhesions_a_relancer: {
        Args: { seuil_jours?: number };
        Returns: Array<Database['public']['Tables']['adhesion']['Row']>;
      };
      nombre_communes_actives: {
        Args: { personne_a_compter: string };
        Returns: number;
      };
      candidates_pour_assemblee: {
        Args: { entite_type_recherche: string; entite_id_recherche: string };
        Returns: string[];
      };
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================
// Alias pratiques (raccourcis exportés pour usage applicatif)
// ============================================================

export type Personne = Database['public']['Tables']['personne']['Row'];
export type Commune = Database['public']['Tables']['commune']['Row'];
export type AppartenanceCommune = Database['public']['Tables']['appartenance_commune']['Row'];
export type Federation = Database['public']['Tables']['federation']['Row'];
export type Confederation = Database['public']['Tables']['confederation']['Row'];
export type GtThematique = Database['public']['Tables']['gt_thematique']['Row'];
export type DroitAdmin = Database['public']['Tables']['droit_admin']['Row'];
export type JournalAdmin = Database['public']['Tables']['journal_admin']['Row'];
export type Petition = Database['public']['Tables']['petition']['Row'];
export type SignaturePetition = Database['public']['Tables']['signature_petition']['Row'];
export type PetitionCompteur = Database['public']['Views']['petition_compteur']['Row'];
export type Mobilisation = Database['public']['Tables']['mobilisation']['Row'];
export type ParticipationMobilisation =
  Database['public']['Tables']['participation_mobilisation']['Row'];
export type Campagne = Database['public']['Tables']['campagne']['Row'];
export type ModuleCampagne = Database['public']['Tables']['module_campagne']['Row'];
export type Cagnotte = Database['public']['Tables']['cagnotte']['Row'];
export type Don = Database['public']['Tables']['don']['Row'];
export type CagnotteCompteur = Database['public']['Views']['cagnotte_compteur']['Row'];
export type OffreEntraide = Database['public']['Tables']['offre_entraide']['Row'];
export type ServiceSel = Database['public']['Tables']['service_sel']['Row'];
export type PrestationSel = Database['public']['Tables']['prestation_sel']['Row'];
export type ProduitMarche = Database['public']['Tables']['produit_marche']['Row'];
export type BoutiqueMarche = Database['public']['Tables']['boutique_marche']['Row'];
export type ProduitBoutique = Database['public']['Tables']['produit_boutique']['Row'];
export type MinimarcheSolidaire = Database['public']['Tables']['minimarche_solidaire']['Row'];
export type NotationMarche = Database['public']['Tables']['notation_marche']['Row'];
export type NotationMarcheStats = Database['public']['Views']['notation_marche_stats']['Row'];
export type Adhesion = Database['public']['Tables']['adhesion']['Row'];
export type AdherentActif = Database['public']['Views']['adherent_actif']['Row'];
export type MandatConfederal = Database['public']['Tables']['mandat_confederal']['Row'];
export type MomentSolidaire = Database['public']['Tables']['moment_solidaire']['Row'];
export type ParticipationMoment = Database['public']['Tables']['participation_moment']['Row'];
export type Tupperware = Database['public']['Tables']['tupperware']['Row'];
export type OrganisationPartenaire = Database['public']['Tables']['organisation_partenaire']['Row'];
export type Media = Database['public']['Tables']['media']['Row'];
export type Sondage = Database['public']['Tables']['sondage']['Row'];
export type ReponseSondage = Database['public']['Tables']['reponse_sondage']['Row'];
export type SondageResultats = Database['public']['Views']['sondage_resultats']['Row'];
