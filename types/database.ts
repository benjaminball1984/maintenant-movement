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
