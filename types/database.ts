export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      adhesion: {
        Row: {
          chemin: string;
          created_at: string;
          debute_le: string;
          expire_le: string;
          id: string;
          montant_euros_centimes: number;
          montant_t99cp_unites: string;
          personne_id: string;
          relance_envoyee_le: string | null;
          statut: string;
          stripe_session_id: string | null;
          tx_hash: string | null;
          updated_at: string;
        };
        Insert: {
          chemin: string;
          created_at?: string;
          debute_le?: string;
          expire_le?: string;
          id?: string;
          montant_euros_centimes?: number;
          montant_t99cp_unites?: string;
          personne_id: string;
          relance_envoyee_le?: string | null;
          statut?: string;
          stripe_session_id?: string | null;
          tx_hash?: string | null;
          updated_at?: string;
        };
        Update: {
          chemin?: string;
          created_at?: string;
          debute_le?: string;
          expire_le?: string;
          id?: string;
          montant_euros_centimes?: number;
          montant_t99cp_unites?: string;
          personne_id?: string;
          relance_envoyee_le?: string | null;
          statut?: string;
          stripe_session_id?: string | null;
          tx_hash?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'adhesion_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      journal_affiche: {
        Row: {
          id: string;
          slug: string;
          titre: string;
          sous_titre: string | null;
          numero: number;
          format: string;
          contenu_md: string;
          /** V2.5.33 — HTML riche optionnel. */
          contenu_html: string | null;
          image_couverture_url: string | null;
          statut: string;
          perimetre_type: string;
          perimetre_id: string | null;
          createurice_id: string | null;
          publie_le: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titre: string;
          sous_titre?: string | null;
          numero?: number;
          format?: string;
          contenu_md?: string;
          contenu_html?: string | null;
          image_couverture_url?: string | null;
          statut?: string;
          perimetre_type?: string;
          perimetre_id?: string | null;
          createurice_id?: string | null;
          publie_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          titre?: string;
          sous_titre?: string | null;
          numero?: number;
          format?: string;
          contenu_md?: string;
          contenu_html?: string | null;
          image_couverture_url?: string | null;
          statut?: string;
          perimetre_type?: string;
          perimetre_id?: string | null;
          createurice_id?: string | null;
          publie_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      salle_decider: {
        Row: {
          id: string;
          slug: string;
          nom: string;
          description: string | null;
          espace_type: string;
          espace_id: string | null;
          type_visibilite: string;
          livekit_room_name: string | null;
          metadata: Json;
          createurice_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nom: string;
          description?: string | null;
          espace_type: string;
          espace_id?: string | null;
          type_visibilite?: string;
          livekit_room_name?: string | null;
          metadata?: Json;
          createurice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nom?: string;
          description?: string | null;
          espace_type?: string;
          espace_id?: string | null;
          type_visibilite?: string;
          livekit_room_name?: string | null;
          metadata?: Json;
          createurice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reunion_decider: {
        Row: {
          id: string;
          salle_id: string;
          titre: string;
          ordre_jour_md: string;
          debut_le: string;
          fin_le: string | null;
          mode_decision: string;
          statut: string;
          enregistree: boolean;
          pv_md: string | null;
          convoque_par_personne_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salle_id: string;
          titre: string;
          ordre_jour_md?: string;
          debut_le: string;
          fin_le?: string | null;
          mode_decision?: string;
          statut?: string;
          enregistree?: boolean;
          pv_md?: string | null;
          convoque_par_personne_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salle_id?: string;
          titre?: string;
          ordre_jour_md?: string;
          debut_le?: string;
          fin_le?: string | null;
          mode_decision?: string;
          statut?: string;
          enregistree?: boolean;
          pv_md?: string | null;
          convoque_par_personne_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reunion_decider_salle_id_fkey';
            columns: ['salle_id'];
            isOneToOne: false;
            referencedRelation: 'salle_decider';
            referencedColumns: ['id'];
          },
        ];
      };
      vote_decider: {
        Row: {
          id: string;
          reunion_id: string;
          question: string;
          mode: string;
          options: string[];
          statut: string;
          resultat: string | null;
          recapitulatif_md: string | null;
          ouvert_le: string;
          clos_le: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reunion_id: string;
          question: string;
          mode: string;
          options?: string[];
          statut?: string;
          resultat?: string | null;
          recapitulatif_md?: string | null;
          ouvert_le?: string;
          clos_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reunion_id?: string;
          question?: string;
          mode?: string;
          options?: string[];
          statut?: string;
          resultat?: string | null;
          recapitulatif_md?: string | null;
          ouvert_le?: string;
          clos_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vote_decider_reunion_id_fkey';
            columns: ['reunion_id'];
            isOneToOne: false;
            referencedRelation: 'reunion_decider';
            referencedColumns: ['id'];
          },
        ];
      };
      contenu_editorial: {
        Row: {
          cle: string;
          valeur_md: string;
          valeur_html: string | null;
          titre: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          cle: string;
          valeur_md?: string;
          valeur_html?: string | null;
          titre?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          cle?: string;
          valeur_md?: string;
          valeur_html?: string | null;
          titre?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contenu_editorial_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      appartenance_campagne: {
        Row: {
          id: string;
          personne_id: string;
          campagne_id: string;
          rejointe_le: string;
          quittee_le: string | null;
          est_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          personne_id: string;
          campagne_id: string;
          rejointe_le?: string;
          quittee_le?: string | null;
          est_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          personne_id?: string;
          campagne_id?: string;
          rejointe_le?: string;
          quittee_le?: string | null;
          est_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appartenance_campagne_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appartenance_campagne_campagne_id_fkey';
            columns: ['campagne_id'];
            isOneToOne: false;
            referencedRelation: 'campagne';
            referencedColumns: ['id'];
          },
        ];
      };
      appartenance_commune: {
        Row: {
          commune_id: string;
          created_at: string;
          est_active: boolean;
          id: string;
          personne_id: string;
          quittee_le: string | null;
          rejointe_le: string;
        };
        Insert: {
          commune_id: string;
          created_at?: string;
          est_active?: boolean;
          id?: string;
          personne_id: string;
          quittee_le?: string | null;
          rejointe_le?: string;
        };
        Update: {
          commune_id?: string;
          created_at?: string;
          est_active?: boolean;
          id?: string;
          personne_id?: string;
          quittee_le?: string | null;
          rejointe_le?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appartenance_commune_commune_id_fkey';
            columns: ['commune_id'];
            isOneToOne: false;
            referencedRelation: 'commune';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appartenance_commune_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      appartenance_confederation: {
        Row: {
          confederation_id: string;
          created_at: string;
          est_active: boolean;
          federation_id: string;
          id: string;
          quittee_le: string | null;
          rejointe_le: string;
        };
        Insert: {
          confederation_id: string;
          created_at?: string;
          est_active?: boolean;
          federation_id: string;
          id?: string;
          quittee_le?: string | null;
          rejointe_le?: string;
        };
        Update: {
          confederation_id?: string;
          created_at?: string;
          est_active?: boolean;
          federation_id?: string;
          id?: string;
          quittee_le?: string | null;
          rejointe_le?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appartenance_confederation_confederation_id_fkey';
            columns: ['confederation_id'];
            isOneToOne: false;
            referencedRelation: 'confederation';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appartenance_confederation_federation_id_fkey';
            columns: ['federation_id'];
            isOneToOne: false;
            referencedRelation: 'federation';
            referencedColumns: ['id'];
          },
        ];
      };
      appartenance_federation: {
        Row: {
          commune_id: string;
          created_at: string;
          est_active: boolean;
          federation_id: string;
          id: string;
          quittee_le: string | null;
          rejointe_le: string;
        };
        Insert: {
          commune_id: string;
          created_at?: string;
          est_active?: boolean;
          federation_id: string;
          id?: string;
          quittee_le?: string | null;
          rejointe_le?: string;
        };
        Update: {
          commune_id?: string;
          created_at?: string;
          est_active?: boolean;
          federation_id?: string;
          id?: string;
          quittee_le?: string | null;
          rejointe_le?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appartenance_federation_commune_id_fkey';
            columns: ['commune_id'];
            isOneToOne: false;
            referencedRelation: 'commune';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appartenance_federation_federation_id_fkey';
            columns: ['federation_id'];
            isOneToOne: false;
            referencedRelation: 'federation';
            referencedColumns: ['id'];
          },
        ];
      };
      appartenance_gt: {
        Row: {
          created_at: string;
          est_active: boolean;
          gt_thematique_id: string;
          id: string;
          personne_id: string;
          quittee_le: string | null;
          rejointe_le: string;
        };
        Insert: {
          created_at?: string;
          est_active?: boolean;
          gt_thematique_id: string;
          id?: string;
          personne_id: string;
          quittee_le?: string | null;
          rejointe_le?: string;
        };
        Update: {
          created_at?: string;
          est_active?: boolean;
          gt_thematique_id?: string;
          id?: string;
          personne_id?: string;
          quittee_le?: string | null;
          rejointe_le?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appartenance_gt_gt_thematique_id_fkey';
            columns: ['gt_thematique_id'];
            isOneToOne: false;
            referencedRelation: 'gt_thematique';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appartenance_gt_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      bloc_espace: {
        Row: {
          contenu_json: Json;
          cree_le: string;
          cree_par: string | null;
          espace_id: string;
          espace_type: string;
          id: string;
          ordre: number;
          type: string;
          updated_at: string;
        };
        Insert: {
          contenu_json?: Json;
          cree_le?: string;
          cree_par?: string | null;
          espace_id: string;
          espace_type: string;
          id?: string;
          ordre?: number;
          type: string;
          updated_at?: string;
        };
        Update: {
          contenu_json?: Json;
          cree_le?: string;
          cree_par?: string | null;
          espace_id?: string;
          espace_type?: string;
          id?: string;
          ordre?: number;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bloc_espace_cree_par_fkey';
            columns: ['cree_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      boutique_marche: {
        Row: {
          created_at: string;
          createurice_id: string;
          description: string;
          id: string;
          image_url: string | null;
          latitude: number | null;
          lieu: string | null;
          longitude: number | null;
          nom: string;
          ouverte_au: string | null;
          ouverte_du: string | null;
          sens: string;
          slug: string;
          statut: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          createurice_id: string;
          description: string;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu?: string | null;
          longitude?: number | null;
          nom: string;
          ouverte_au?: string | null;
          ouverte_du?: string | null;
          sens: string;
          slug: string;
          statut?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          createurice_id?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu?: string | null;
          longitude?: number | null;
          nom?: string;
          ouverte_au?: string | null;
          ouverte_du?: string | null;
          sens?: string;
          slug?: string;
          statut?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'boutique_marche_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      cagnotte: {
        Row: {
          created_at: string;
          createurice_id: string;
          id: string;
          image_url: string | null;
          objectif_euros: number;
          raison_suspension: string | null;
          slug: string;
          statut: string;
          stripe_account_id: string | null;
          suspendue_le: string | null;
          suspendue_par: string | null;
          texte: string;
          titre: string;
          type: string;
          updated_at: string;
          wallet_t99cp: string | null;
        };
        Insert: {
          created_at?: string;
          createurice_id: string;
          id?: string;
          image_url?: string | null;
          objectif_euros?: number;
          raison_suspension?: string | null;
          slug: string;
          statut?: string;
          stripe_account_id?: string | null;
          suspendue_le?: string | null;
          suspendue_par?: string | null;
          texte: string;
          titre: string;
          type: string;
          updated_at?: string;
          wallet_t99cp?: string | null;
        };
        Update: {
          created_at?: string;
          createurice_id?: string;
          id?: string;
          image_url?: string | null;
          objectif_euros?: number;
          raison_suspension?: string | null;
          slug?: string;
          statut?: string;
          stripe_account_id?: string | null;
          suspendue_le?: string | null;
          suspendue_par?: string | null;
          texte?: string;
          titre?: string;
          type?: string;
          updated_at?: string;
          wallet_t99cp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cagnotte_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cagnotte_suspendue_par_fkey';
            columns: ['suspendue_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      campagne: {
        Row: {
          created_at: string;
          createurice_id: string;
          id: string;
          image_url: string | null;
          modere_le: string | null;
          modere_par: string | null;
          raison_rejet: string | null;
          slug: string;
          statut: string;
          texte: string;
          titre: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          createurice_id: string;
          id?: string;
          image_url?: string | null;
          modere_le?: string | null;
          modere_par?: string | null;
          raison_rejet?: string | null;
          slug: string;
          statut?: string;
          texte: string;
          titre: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          createurice_id?: string;
          id?: string;
          image_url?: string | null;
          modere_le?: string | null;
          modere_par?: string | null;
          raison_rejet?: string | null;
          slug?: string;
          statut?: string;
          texte?: string;
          titre?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'campagne_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campagne_modere_par_fkey';
            columns: ['modere_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      commune: {
        Row: {
          code_insee: string | null;
          code_postal_principal: string | null;
          created_at: string;
          createurice_id: string | null;
          departement: string | null;
          description_courte: string | null;
          id: string;
          image_url: string | null;
          latitude: number | null;
          longitude: number | null;
          nom: string;
          region: string | null;
          slug: string;
          statut_creation: string;
          updated_at: string;
        };
        Insert: {
          code_insee?: string | null;
          code_postal_principal?: string | null;
          created_at?: string;
          createurice_id?: string | null;
          departement?: string | null;
          description_courte?: string | null;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          nom: string;
          region?: string | null;
          slug: string;
          statut_creation?: string;
          updated_at?: string;
        };
        Update: {
          code_insee?: string | null;
          code_postal_principal?: string | null;
          created_at?: string;
          createurice_id?: string | null;
          departement?: string | null;
          description_courte?: string | null;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          nom?: string;
          region?: string | null;
          slug?: string;
          statut_creation?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'commune_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      confederation: {
        Row: {
          created_at: string;
          createurice_id: string | null;
          description_courte: string | null;
          id: string;
          image_url: string | null;
          nom: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          createurice_id?: string | null;
          description_courte?: string | null;
          id?: string;
          image_url?: string | null;
          nom: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          createurice_id?: string | null;
          description_courte?: string | null;
          id?: string;
          image_url?: string | null;
          nom?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'confederation_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      don: {
        Row: {
          accepte_contact_createurice: boolean;
          accepte_newsletter: boolean;
          cagnotte_id: string;
          code_postal: string | null;
          confirme_le: string | null;
          created_at: string;
          email: string | null;
          frais_centimes: number;
          id: string;
          monnaie: string;
          montant_centimes: number;
          nom: string | null;
          personne_id: string | null;
          prenom: string | null;
          statut: string;
          stripe_payment_intent_id: string | null;
          tx_hash: string | null;
        };
        Insert: {
          accepte_contact_createurice?: boolean;
          accepte_newsletter?: boolean;
          cagnotte_id: string;
          code_postal?: string | null;
          confirme_le?: string | null;
          created_at?: string;
          email?: string | null;
          frais_centimes?: number;
          id?: string;
          monnaie: string;
          montant_centimes: number;
          nom?: string | null;
          personne_id?: string | null;
          prenom?: string | null;
          statut?: string;
          stripe_payment_intent_id?: string | null;
          tx_hash?: string | null;
        };
        Update: {
          accepte_contact_createurice?: boolean;
          accepte_newsletter?: boolean;
          cagnotte_id?: string;
          code_postal?: string | null;
          confirme_le?: string | null;
          created_at?: string;
          email?: string | null;
          frais_centimes?: number;
          id?: string;
          monnaie?: string;
          montant_centimes?: number;
          nom?: string | null;
          personne_id?: string | null;
          prenom?: string | null;
          statut?: string;
          stripe_payment_intent_id?: string | null;
          tx_hash?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'don_cagnotte_id_fkey';
            columns: ['cagnotte_id'];
            isOneToOne: false;
            referencedRelation: 'cagnotte';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'don_cagnotte_id_fkey';
            columns: ['cagnotte_id'];
            isOneToOne: false;
            referencedRelation: 'cagnotte_compteur';
            referencedColumns: ['cagnotte_id'];
          },
          {
            foreignKeyName: 'don_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      droit_admin: {
        Row: {
          accorde_le: string;
          accorde_par: string | null;
          id: string;
          niveau: string;
          perimetre_onglet: string[] | null;
          personne_id: string;
          retire_le: string | null;
          retire_par: string | null;
          scope_commune_id: string | null;
        };
        Insert: {
          accorde_le?: string;
          accorde_par?: string | null;
          id?: string;
          niveau: string;
          perimetre_onglet?: string[] | null;
          personne_id: string;
          retire_le?: string | null;
          retire_par?: string | null;
          scope_commune_id?: string | null;
        };
        Update: {
          accorde_le?: string;
          accorde_par?: string | null;
          id?: string;
          niveau?: string;
          perimetre_onglet?: string[] | null;
          personne_id?: string;
          retire_le?: string | null;
          retire_par?: string | null;
          scope_commune_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'droit_admin_accorde_par_fkey';
            columns: ['accorde_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'droit_admin_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'droit_admin_retire_par_fkey';
            columns: ['retire_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'droit_admin_scope_commune_id_fkey';
            columns: ['scope_commune_id'];
            isOneToOne: false;
            referencedRelation: 'commune';
            referencedColumns: ['id'];
          },
        ];
      };
      federation: {
        Row: {
          created_at: string;
          createurice_id: string | null;
          description_courte: string | null;
          id: string;
          image_url: string | null;
          nom: string;
          slug: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          createurice_id?: string | null;
          description_courte?: string | null;
          id?: string;
          image_url?: string | null;
          nom: string;
          slug: string;
          type?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          createurice_id?: string | null;
          description_courte?: string | null;
          id?: string;
          image_url?: string | null;
          nom?: string;
          slug?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'federation_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      gt_thematique: {
        Row: {
          created_at: string;
          createurice_id: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          nom: string;
          slug: string;
          sujet: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          createurice_id?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          nom: string;
          slug: string;
          sujet: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          createurice_id?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          nom?: string;
          slug?: string;
          sujet?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gt_thematique_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      journal_admin: {
        Row: {
          action: string;
          admin_id: string | null;
          ancien_etat: Json | null;
          cible_id: string | null;
          cible_table: string | null;
          cree_le: string;
          id: number;
          ip: string | null;
          nouvel_etat: Json | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          admin_id?: string | null;
          ancien_etat?: Json | null;
          cible_id?: string | null;
          cible_table?: string | null;
          cree_le?: string;
          id?: number;
          ip?: string | null;
          nouvel_etat?: Json | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          admin_id?: string | null;
          ancien_etat?: Json | null;
          cible_id?: string | null;
          cible_table?: string | null;
          cree_le?: string;
          id?: number;
          ip?: string | null;
          nouvel_etat?: Json | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'journal_admin_admin_id_fkey';
            columns: ['admin_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      mandat_confederal: {
        Row: {
          created_at: string;
          entite_id: string;
          entite_type: string;
          id: string;
          libere_le: string | null;
          personne_id: string;
          raison_liberation: string | null;
          statut: string;
          tirage_seed: string | null;
          tire_le: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          entite_id: string;
          entite_type: string;
          id?: string;
          libere_le?: string | null;
          personne_id: string;
          raison_liberation?: string | null;
          statut?: string;
          tirage_seed?: string | null;
          tire_le?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          entite_id?: string;
          entite_type?: string;
          id?: string;
          libere_le?: string | null;
          personne_id?: string;
          raison_liberation?: string | null;
          statut?: string;
          tirage_seed?: string | null;
          tire_le?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mandat_confederal_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      media: {
        Row: {
          auteurice_id: string | null;
          corps: string;
          created_at: string;
          id: string;
          media_url: string | null;
          provenance_externe: string | null;
          publie_le: string | null;
          raison_retrait: string | null;
          retire_le: string | null;
          retire_par: string | null;
          slug: string;
          source_url: string | null;
          statut: string;
          tags: string[] | null;
          titre: string;
          type: string;
          updated_at: string;
          vignette_url: string | null;
        };
        Insert: {
          auteurice_id?: string | null;
          corps: string;
          created_at?: string;
          id?: string;
          media_url?: string | null;
          provenance_externe?: string | null;
          publie_le?: string | null;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          slug: string;
          source_url?: string | null;
          statut?: string;
          tags?: string[] | null;
          titre: string;
          type: string;
          updated_at?: string;
          vignette_url?: string | null;
        };
        Update: {
          auteurice_id?: string | null;
          corps?: string;
          created_at?: string;
          id?: string;
          media_url?: string | null;
          provenance_externe?: string | null;
          publie_le?: string | null;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          slug?: string;
          source_url?: string | null;
          statut?: string;
          tags?: string[] | null;
          titre?: string;
          type?: string;
          updated_at?: string;
          vignette_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'media_auteurice_id_fkey';
            columns: ['auteurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'media_retire_par_fkey';
            columns: ['retire_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      minimarche_solidaire: {
        Row: {
          commence_le: string;
          created_at: string;
          createurice_id: string;
          description: string;
          id: string;
          image_url: string | null;
          latitude: number | null;
          lieu: string;
          longitude: number | null;
          monnaies_acceptees: string[];
          slug: string;
          statut: string;
          termine_le: string;
          titre: string;
          updated_at: string;
        };
        Insert: {
          commence_le: string;
          created_at?: string;
          createurice_id: string;
          description: string;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu: string;
          longitude?: number | null;
          monnaies_acceptees?: string[];
          slug: string;
          statut?: string;
          termine_le: string;
          titre: string;
          updated_at?: string;
        };
        Update: {
          commence_le?: string;
          created_at?: string;
          createurice_id?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu?: string;
          longitude?: number | null;
          monnaies_acceptees?: string[];
          slug?: string;
          statut?: string;
          termine_le?: string;
          titre?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'minimarche_solidaire_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      mobilisation: {
        Row: {
          created_at: string;
          createurice_id: string;
          date_debut: string;
          date_fin: string | null;
          description: string;
          id: string;
          image_url: string | null;
          latitude: number | null;
          lieu: string;
          longitude: number | null;
          raison_retrait: string | null;
          retire_le: string | null;
          retire_par: string | null;
          slug: string;
          statut: string;
          titre: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          createurice_id: string;
          date_debut: string;
          date_fin?: string | null;
          description: string;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu: string;
          longitude?: number | null;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          slug: string;
          statut?: string;
          titre: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          createurice_id?: string;
          date_debut?: string;
          date_fin?: string | null;
          description?: string;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu?: string;
          longitude?: number | null;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          slug?: string;
          statut?: string;
          titre?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mobilisation_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mobilisation_retire_par_fkey';
            columns: ['retire_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      module_campagne: {
        Row: {
          campagne_id: string;
          cible_id: string | null;
          contenu_editorial: string | null;
          created_at: string;
          id: string;
          ordre: number;
          type_module: string;
        };
        Insert: {
          campagne_id: string;
          cible_id?: string | null;
          contenu_editorial?: string | null;
          created_at?: string;
          id?: string;
          ordre?: number;
          type_module: string;
        };
        Update: {
          campagne_id?: string;
          cible_id?: string | null;
          contenu_editorial?: string | null;
          created_at?: string;
          id?: string;
          ordre?: number;
          type_module?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'module_campagne_campagne_id_fkey';
            columns: ['campagne_id'];
            isOneToOne: false;
            referencedRelation: 'campagne';
            referencedColumns: ['id'];
          },
        ];
      };
      moment_solidaire: {
        Row: {
          capacite_max: number | null;
          cause_locale: string | null;
          commence_le: string;
          commune_id: string | null;
          created_at: string;
          createurice_id: string;
          description: string;
          id: string;
          latitude: number | null;
          lieu: string;
          longitude: number | null;
          meta: Json;
          parent_id: string | null;
          slug: string;
          sous_type: string | null;
          statut: string;
          termine_le: string | null;
          titre: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          capacite_max?: number | null;
          cause_locale?: string | null;
          commence_le: string;
          commune_id?: string | null;
          created_at?: string;
          createurice_id: string;
          description: string;
          id?: string;
          latitude?: number | null;
          lieu: string;
          longitude?: number | null;
          meta?: Json;
          parent_id?: string | null;
          slug: string;
          sous_type?: string | null;
          statut?: string;
          termine_le?: string | null;
          titre: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          capacite_max?: number | null;
          cause_locale?: string | null;
          commence_le?: string;
          commune_id?: string | null;
          created_at?: string;
          createurice_id?: string;
          description?: string;
          id?: string;
          latitude?: number | null;
          lieu?: string;
          longitude?: number | null;
          meta?: Json;
          parent_id?: string | null;
          slug?: string;
          sous_type?: string | null;
          statut?: string;
          termine_le?: string | null;
          titre?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'moment_solidaire_commune_id_fkey';
            columns: ['commune_id'];
            isOneToOne: false;
            referencedRelation: 'commune';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'moment_solidaire_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'moment_solidaire_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'moment_solidaire';
            referencedColumns: ['id'];
          },
        ];
      };
      notation_marche: {
        Row: {
          acheteureuse_id: string;
          commentaire: string | null;
          created_at: string;
          etoiles: number;
          id: string;
          produit_id: string;
          updated_at: string;
          vendeureuse_id: string;
        };
        Insert: {
          acheteureuse_id: string;
          commentaire?: string | null;
          created_at?: string;
          etoiles: number;
          id?: string;
          produit_id: string;
          updated_at?: string;
          vendeureuse_id: string;
        };
        Update: {
          acheteureuse_id?: string;
          commentaire?: string | null;
          created_at?: string;
          etoiles?: number;
          id?: string;
          produit_id?: string;
          updated_at?: string;
          vendeureuse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notation_marche_acheteureuse_id_fkey';
            columns: ['acheteureuse_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notation_marche_produit_id_fkey';
            columns: ['produit_id'];
            isOneToOne: false;
            referencedRelation: 'produit_marche';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notation_marche_vendeureuse_id_fkey';
            columns: ['vendeureuse_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      notification: {
        Row: {
          cible_id: string | null;
          cible_table: string | null;
          created_at: string;
          destinataire_id: string;
          href: string | null;
          id: string;
          lue: boolean;
          lue_le: string | null;
          message: string | null;
          titre: string;
          type: string;
        };
        Insert: {
          cible_id?: string | null;
          cible_table?: string | null;
          created_at?: string;
          destinataire_id: string;
          href?: string | null;
          id?: string;
          lue?: boolean;
          lue_le?: string | null;
          message?: string | null;
          titre: string;
          type: string;
        };
        Update: {
          cible_id?: string | null;
          cible_table?: string | null;
          created_at?: string;
          destinataire_id?: string;
          href?: string | null;
          id?: string;
          lue?: boolean;
          lue_le?: string | null;
          message?: string | null;
          titre?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_destinataire_id_fkey';
            columns: ['destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      objet_demo: {
        Row: {
          cree_le: string;
          id_ligne: string;
          nom_table: string;
        };
        Insert: {
          cree_le?: string;
          id_ligne: string;
          nom_table: string;
        };
        Update: {
          cree_le?: string;
          id_ligne?: string;
          nom_table?: string;
        };
        Relationships: [];
      };
      offre_entraide: {
        Row: {
          created_at: string;
          createurice_id: string;
          description: string;
          id: string;
          image_url: string | null;
          latitude: number | null;
          lieu: string;
          longitude: number | null;
          meta: Json;
          raison_retrait: string | null;
          retire_le: string | null;
          retire_par: string | null;
          sens: string;
          slug: string;
          statut: string;
          titre: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          createurice_id: string;
          description: string;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu: string;
          longitude?: number | null;
          meta?: Json;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          sens: string;
          slug: string;
          statut?: string;
          titre: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          createurice_id?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu?: string;
          longitude?: number | null;
          meta?: Json;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          sens?: string;
          slug?: string;
          statut?: string;
          titre?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'offre_entraide_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'offre_entraide_retire_par_fkey';
            columns: ['retire_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      organisation_partenaire: {
        Row: {
          ajoute_par: string;
          categorie_slug: string | null;
          created_at: string;
          description_courte: string | null;
          id: string;
          nom: string;
          raison_retrait: string | null;
          retire_le: string | null;
          retire_par: string | null;
          slug: string;
          statut: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          ajoute_par: string;
          categorie_slug?: string | null;
          created_at?: string;
          description_courte?: string | null;
          id?: string;
          nom: string;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          slug: string;
          statut?: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          ajoute_par?: string;
          categorie_slug?: string | null;
          created_at?: string;
          description_courte?: string | null;
          id?: string;
          nom?: string;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          slug?: string;
          statut?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organisation_partenaire_ajoute_par_fkey';
            columns: ['ajoute_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organisation_partenaire_retire_par_fkey';
            columns: ['retire_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      participation_mobilisation: {
        Row: {
          accepte_notifications: boolean;
          code_postal: string | null;
          created_at: string;
          id: string;
          mobilisation_id: string;
          personne_id: string | null;
        };
        Insert: {
          accepte_notifications?: boolean;
          code_postal?: string | null;
          created_at?: string;
          id?: string;
          mobilisation_id: string;
          personne_id?: string | null;
        };
        Update: {
          accepte_notifications?: boolean;
          code_postal?: string | null;
          created_at?: string;
          id?: string;
          mobilisation_id?: string;
          personne_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'participation_mobilisation_mobilisation_id_fkey';
            columns: ['mobilisation_id'];
            isOneToOne: false;
            referencedRelation: 'mobilisation';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'participation_mobilisation_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      participation_moment: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          moment_id: string;
          personne_id: string | null;
          prenom: string | null;
          telephone: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          moment_id: string;
          personne_id?: string | null;
          prenom?: string | null;
          telephone?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          moment_id?: string;
          personne_id?: string | null;
          prenom?: string | null;
          telephone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'participation_moment_moment_id_fkey';
            columns: ['moment_id'];
            isOneToOne: false;
            referencedRelation: 'moment_solidaire';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'participation_moment_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      personne: {
        Row: {
          anonymise_le: string | null;
          bio: string | null;
          code_postal: string | null;
          cover_url: string | null;
          created_at: string;
          date_naissance: string | null;
          derniere_connexion_le: string | null;
          email: string | null;
          email_verifie: boolean;
          id: string;
          mode_theme: string | null;
          nom: string | null;
          photo_url: string | null;
          preferences_visibilite: Json;
          prenom: string | null;
          pronom: string | null;
          statut: string;
          suppression_demandee_le: string | null;
          telephone: string | null;
          totp_secret: string | null;
          updated_at: string;
        };
        Insert: {
          anonymise_le?: string | null;
          bio?: string | null;
          code_postal?: string | null;
          cover_url?: string | null;
          created_at?: string;
          date_naissance?: string | null;
          derniere_connexion_le?: string | null;
          email?: string | null;
          email_verifie?: boolean;
          id: string;
          mode_theme?: string | null;
          nom?: string | null;
          photo_url?: string | null;
          preferences_visibilite?: Json;
          prenom?: string | null;
          pronom?: string | null;
          statut?: string;
          suppression_demandee_le?: string | null;
          telephone?: string | null;
          totp_secret?: string | null;
          updated_at?: string;
        };
        Update: {
          anonymise_le?: string | null;
          bio?: string | null;
          code_postal?: string | null;
          cover_url?: string | null;
          created_at?: string;
          date_naissance?: string | null;
          derniere_connexion_le?: string | null;
          email?: string | null;
          email_verifie?: boolean;
          id?: string;
          mode_theme?: string | null;
          nom?: string | null;
          photo_url?: string | null;
          preferences_visibilite?: Json;
          prenom?: string | null;
          pronom?: string | null;
          statut?: string;
          suppression_demandee_le?: string | null;
          telephone?: string | null;
          totp_secret?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      petition: {
        Row: {
          created_at: string;
          createurice_id: string;
          date_echeance: string | null;
          date_lancement: string | null;
          destinataire: string;
          id: string;
          image_url: string | null;
          modere_le: string | null;
          modere_par: string | null;
          objectif: number;
          raison_rejet: string | null;
          slug: string;
          statut: string;
          texte: string;
          titre: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          createurice_id: string;
          date_echeance?: string | null;
          date_lancement?: string | null;
          destinataire: string;
          id?: string;
          image_url?: string | null;
          modere_le?: string | null;
          modere_par?: string | null;
          objectif: number;
          raison_rejet?: string | null;
          slug: string;
          statut?: string;
          texte: string;
          titre: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          createurice_id?: string;
          date_echeance?: string | null;
          date_lancement?: string | null;
          destinataire?: string;
          id?: string;
          image_url?: string | null;
          modere_le?: string | null;
          modere_par?: string | null;
          objectif?: number;
          raison_rejet?: string | null;
          slug?: string;
          statut?: string;
          texte?: string;
          titre?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'petition_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'petition_modere_par_fkey';
            columns: ['modere_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      preference_notification: {
        Row: {
          cloche_active: boolean;
          created_at: string;
          mail_recap_mardi_active: boolean;
          newsletter_vendredi_active: boolean;
          personne_id: string;
          preferences_par_type: Json;
          push_active: boolean;
          updated_at: string;
        };
        Insert: {
          cloche_active?: boolean;
          created_at?: string;
          mail_recap_mardi_active?: boolean;
          newsletter_vendredi_active?: boolean;
          personne_id: string;
          preferences_par_type?: Json;
          push_active?: boolean;
          updated_at?: string;
        };
        Update: {
          cloche_active?: boolean;
          created_at?: string;
          mail_recap_mardi_active?: boolean;
          newsletter_vendredi_active?: boolean;
          personne_id?: string;
          preferences_par_type?: Json;
          push_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'preference_notification_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: true;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      prestation_sel: {
        Row: {
          annulee_le: string | null;
          beneficiaire_id: string;
          contestee_le: string | null;
          created_at: string;
          creditee_le: string | null;
          declaree_realisee_le: string | null;
          duree_minutes_reelle: number | null;
          id: string;
          prestataire_id: string;
          reservee_le: string;
          service_id: string;
          statut: string;
          tx_hash_credit: string | null;
          updated_at: string;
        };
        Insert: {
          annulee_le?: string | null;
          beneficiaire_id: string;
          contestee_le?: string | null;
          created_at?: string;
          creditee_le?: string | null;
          declaree_realisee_le?: string | null;
          duree_minutes_reelle?: number | null;
          id?: string;
          prestataire_id: string;
          reservee_le?: string;
          service_id: string;
          statut?: string;
          tx_hash_credit?: string | null;
          updated_at?: string;
        };
        Update: {
          annulee_le?: string | null;
          beneficiaire_id?: string;
          contestee_le?: string | null;
          created_at?: string;
          creditee_le?: string | null;
          declaree_realisee_le?: string | null;
          duree_minutes_reelle?: number | null;
          id?: string;
          prestataire_id?: string;
          reservee_le?: string;
          service_id?: string;
          statut?: string;
          tx_hash_credit?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prestation_sel_beneficiaire_id_fkey';
            columns: ['beneficiaire_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestation_sel_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestation_sel_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'service_sel';
            referencedColumns: ['id'];
          },
        ];
      };
      produit_boutique: {
        Row: {
          boutique_id: string;
          id: string;
          produit_id: string;
          rattache_le: string;
          rattache_par: string;
        };
        Insert: {
          boutique_id: string;
          id?: string;
          produit_id: string;
          rattache_le?: string;
          rattache_par: string;
        };
        Update: {
          boutique_id?: string;
          id?: string;
          produit_id?: string;
          rattache_le?: string;
          rattache_par?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'produit_boutique_boutique_id_fkey';
            columns: ['boutique_id'];
            isOneToOne: false;
            referencedRelation: 'boutique_marche';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'produit_boutique_produit_id_fkey';
            columns: ['produit_id'];
            isOneToOne: false;
            referencedRelation: 'produit_marche';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'produit_boutique_rattache_par_fkey';
            columns: ['rattache_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      produit_marche: {
        Row: {
          categorie_slug: string | null;
          created_at: string;
          derniere_activite_le: string;
          description: string;
          envoi_postal: boolean;
          id: string;
          image_url: string | null;
          latitude: number | null;
          lieu: string;
          longitude: number | null;
          mode: string;
          prix_euros_centimes: number;
          prix_t99cp_unites: string;
          remise_main_propre: boolean;
          slug: string;
          statut: string;
          titre: string;
          updated_at: string;
          vendeureuse_id: string;
        };
        Insert: {
          categorie_slug?: string | null;
          created_at?: string;
          derniere_activite_le?: string;
          description: string;
          envoi_postal?: boolean;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu: string;
          longitude?: number | null;
          mode: string;
          prix_euros_centimes?: number;
          prix_t99cp_unites?: string;
          remise_main_propre?: boolean;
          slug: string;
          statut?: string;
          titre: string;
          updated_at?: string;
          vendeureuse_id: string;
        };
        Update: {
          categorie_slug?: string | null;
          created_at?: string;
          derniere_activite_le?: string;
          description?: string;
          envoi_postal?: boolean;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          lieu?: string;
          longitude?: number | null;
          mode?: string;
          prix_euros_centimes?: number;
          prix_t99cp_unites?: string;
          remise_main_propre?: boolean;
          slug?: string;
          statut?: string;
          titre?: string;
          updated_at?: string;
          vendeureuse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'produit_marche_vendeureuse_id_fkey';
            columns: ['vendeureuse_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      reponse_sondage: {
        Row: {
          code_postal: string | null;
          created_at: string;
          genre_declare: string | null;
          id: string;
          option_index: number;
          personne_id: string;
          pronom: string | null;
          sondage_id: string;
          tranche_age: string | null;
        };
        Insert: {
          code_postal?: string | null;
          created_at?: string;
          genre_declare?: string | null;
          id?: string;
          option_index: number;
          personne_id: string;
          pronom?: string | null;
          sondage_id: string;
          tranche_age?: string | null;
        };
        Update: {
          code_postal?: string | null;
          created_at?: string;
          genre_declare?: string | null;
          id?: string;
          option_index?: number;
          personne_id?: string;
          pronom?: string | null;
          sondage_id?: string;
          tranche_age?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reponse_sondage_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reponse_sondage_sondage_id_fkey';
            columns: ['sondage_id'];
            isOneToOne: false;
            referencedRelation: 'sondage';
            referencedColumns: ['id'];
          },
        ];
      };
      service_sel: {
        Row: {
          categorie: string;
          created_at: string;
          createurice_id: string;
          description: string;
          duree_minutes_estimee: number;
          id: string;
          latitude: number | null;
          lieu: string;
          longitude: number | null;
          sens: string;
          slug: string;
          statut: string;
          titre: string;
          updated_at: string;
        };
        Insert: {
          categorie: string;
          created_at?: string;
          createurice_id: string;
          description: string;
          duree_minutes_estimee: number;
          id?: string;
          latitude?: number | null;
          lieu: string;
          longitude?: number | null;
          sens: string;
          slug: string;
          statut?: string;
          titre: string;
          updated_at?: string;
        };
        Update: {
          categorie?: string;
          created_at?: string;
          createurice_id?: string;
          description?: string;
          duree_minutes_estimee?: number;
          id?: string;
          latitude?: number | null;
          lieu?: string;
          longitude?: number | null;
          sens?: string;
          slug?: string;
          statut?: string;
          titre?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_sel_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      signature_petition: {
        Row: {
          accepte_contact_createurice: boolean;
          accepte_newsletter: boolean;
          code_postal: string;
          created_at: string;
          email: string;
          id: string;
          nom: string;
          personne_id: string | null;
          petition_id: string;
          prenom: string;
          profil_unifie_id: string | null;
          telephone: string | null;
        };
        Insert: {
          accepte_contact_createurice?: boolean;
          accepte_newsletter?: boolean;
          code_postal: string;
          created_at?: string;
          email: string;
          id?: string;
          nom: string;
          personne_id?: string | null;
          petition_id: string;
          prenom: string;
          profil_unifie_id?: string | null;
          telephone?: string | null;
        };
        Update: {
          accepte_contact_createurice?: boolean;
          accepte_newsletter?: boolean;
          code_postal?: string;
          created_at?: string;
          email?: string;
          id?: string;
          nom?: string;
          personne_id?: string | null;
          petition_id?: string;
          prenom?: string;
          profil_unifie_id?: string | null;
          telephone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'signature_petition_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'signature_petition_profil_unifie_id_fkey';
            columns: ['profil_unifie_id'];
            isOneToOne: false;
            referencedRelation: 'profil_unifie';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'signature_petition_petition_id_fkey';
            columns: ['petition_id'];
            isOneToOne: false;
            referencedRelation: 'petition';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'signature_petition_petition_id_fkey';
            columns: ['petition_id'];
            isOneToOne: false;
            referencedRelation: 'petition_compteur';
            referencedColumns: ['petition_id'];
          },
        ];
      };
      sondage: {
        Row: {
          commune_id: string | null;
          created_at: string;
          createurice_id: string;
          ferme_le: string | null;
          id: string;
          image_url: string | null;
          latitude: number | null;
          longitude: number | null;
          mode: string;
          options: string[];
          question: string;
          slug: string;
          statut: string;
          titre: string;
          updated_at: string;
        };
        Insert: {
          commune_id?: string | null;
          created_at?: string;
          createurice_id: string;
          ferme_le?: string | null;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          mode?: string;
          options: string[];
          question: string;
          slug: string;
          statut?: string;
          titre: string;
          updated_at?: string;
        };
        Update: {
          commune_id?: string | null;
          created_at?: string;
          createurice_id?: string;
          ferme_le?: string | null;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          mode?: string;
          options?: string[];
          question?: string;
          slug?: string;
          statut?: string;
          titre?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sondage_commune_id_fkey';
            columns: ['commune_id'];
            isOneToOne: false;
            referencedRelation: 'commune';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sondage_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      tupperware: {
        Row: {
          contenu: string | null;
          created_at: string;
          emporte_le: string;
          id: string;
          moment_id: string;
          notes: string | null;
          porteureuse_email: string | null;
          porteureuse_prenom: string;
          porteureuse_telephone: string | null;
          rendu_le: string | null;
          statut: string;
          updated_at: string;
        };
        Insert: {
          contenu?: string | null;
          created_at?: string;
          emporte_le?: string;
          id?: string;
          moment_id: string;
          notes?: string | null;
          porteureuse_email?: string | null;
          porteureuse_prenom: string;
          porteureuse_telephone?: string | null;
          rendu_le?: string | null;
          statut?: string;
          updated_at?: string;
        };
        Update: {
          contenu?: string | null;
          created_at?: string;
          emporte_le?: string;
          id?: string;
          moment_id?: string;
          notes?: string | null;
          porteureuse_email?: string | null;
          porteureuse_prenom?: string;
          porteureuse_telephone?: string | null;
          rendu_le?: string | null;
          statut?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tupperware_moment_id_fkey';
            columns: ['moment_id'];
            isOneToOne: false;
            referencedRelation: 'moment_solidaire';
            referencedColumns: ['id'];
          },
        ];
      };
      commune_reference: {
        Row: {
          code_departement: string | null;
          code_insee: string;
          created_at: string;
          latitude: number | null;
          longitude: number | null;
          nom: string;
          population: number | null;
          region: string | null;
          type: string;
        };
        Insert: {
          code_departement?: string | null;
          code_insee: string;
          created_at?: string;
          latitude?: number | null;
          longitude?: number | null;
          nom: string;
          population?: number | null;
          region?: string | null;
          type?: string;
        };
        Update: {
          code_departement?: string | null;
          code_insee?: string;
          created_at?: string;
          latitude?: number | null;
          longitude?: number | null;
          nom?: string;
          population?: number | null;
          region?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      correspondance_cp_insee: {
        Row: {
          code_insee: string;
          code_postal: string;
          created_at: string;
          nom_commune: string | null;
        };
        Insert: {
          code_insee: string;
          code_postal: string;
          created_at?: string;
          nom_commune?: string | null;
        };
        Update: {
          code_insee?: string;
          code_postal?: string;
          created_at?: string;
          nom_commune?: string | null;
        };
        Relationships: [];
      };
      profil_unifie: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          numero_unique: string;
          personne_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          numero_unique?: string;
          personne_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          numero_unique?: string;
          personne_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profil_unifie_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: true;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      abonnement_espace_reseau: {
        Row: {
          cree_le: string;
          espace_id: string;
          espace_type: string;
          id: string;
          suiveur_id: string;
        };
        Insert: {
          cree_le?: string;
          espace_id: string;
          espace_type: string;
          id?: string;
          suiveur_id: string;
        };
        Update: {
          cree_le?: string;
          espace_id?: string;
          espace_type?: string;
          id?: string;
          suiveur_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'abonnement_espace_reseau_suiveur_id_fkey';
            columns: ['suiveur_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      relation_reseau: {
        Row: {
          created_at: string;
          suiveur_id: string;
          suivi_id: string;
        };
        Insert: {
          created_at?: string;
          suiveur_id: string;
          suivi_id: string;
        };
        Update: {
          created_at?: string;
          suiveur_id?: string;
          suivi_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'relation_reseau_suiveur_id_fkey';
            columns: ['suiveur_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'relation_reseau_suivi_id_fkey';
            columns: ['suivi_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      post_reseau: {
        Row: {
          auteurice_id: string;
          created_at: string;
          espace_id: string | null;
          espace_type: string | null;
          id: string;
          image_url: string | null;
          raison_retrait: string | null;
          retire_le: string | null;
          retire_par: string | null;
          statut: string;
          texte: string;
          updated_at: string;
        };
        Insert: {
          auteurice_id: string;
          created_at?: string;
          espace_id?: string | null;
          espace_type?: string | null;
          id?: string;
          image_url?: string | null;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          statut?: string;
          texte: string;
          updated_at?: string;
        };
        Update: {
          auteurice_id?: string;
          created_at?: string;
          espace_id?: string | null;
          espace_type?: string | null;
          id?: string;
          image_url?: string | null;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          statut?: string;
          texte?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_reseau_auteurice_id_fkey';
            columns: ['auteurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_reseau_retire_par_fkey';
            columns: ['retire_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      commentaire_reseau: {
        Row: {
          auteurice_id: string;
          created_at: string;
          id: string;
          post_id: string;
          raison_retrait: string | null;
          retire_le: string | null;
          retire_par: string | null;
          statut: string;
          texte: string;
        };
        Insert: {
          auteurice_id: string;
          created_at?: string;
          id?: string;
          post_id: string;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          statut?: string;
          texte: string;
        };
        Update: {
          auteurice_id?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          raison_retrait?: string | null;
          retire_le?: string | null;
          retire_par?: string | null;
          statut?: string;
          texte?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'commentaire_reseau_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'post_reseau';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'commentaire_reseau_auteurice_id_fkey';
            columns: ['auteurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      reaction_reseau: {
        Row: {
          created_at: string;
          personne_id: string;
          post_id: string;
        };
        Insert: {
          created_at?: string;
          personne_id: string;
          post_id: string;
        };
        Update: {
          created_at?: string;
          personne_id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reaction_reseau_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'post_reseau';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reaction_reseau_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      message_reseau: {
        Row: {
          created_at: string;
          destinataire_id: string;
          expediteur_id: string;
          id: string;
          lu: boolean;
          lu_le: string | null;
          texte: string;
        };
        Insert: {
          created_at?: string;
          destinataire_id: string;
          expediteur_id: string;
          id?: string;
          lu?: boolean;
          lu_le?: string | null;
          texte: string;
        };
        Update: {
          created_at?: string;
          destinataire_id?: string;
          expediteur_id?: string;
          id?: string;
          lu?: boolean;
          lu_le?: string | null;
          texte?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_reseau_expediteur_id_fkey';
            columns: ['expediteur_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_reseau_destinataire_id_fkey';
            columns: ['destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      t99cp_hash_consomme: {
        Row: {
          tx_hash: string;
          consomme_par_type: string;
          consomme_par_id: string | null;
          consomme_par_profil_id: string | null;
          consomme_le: string;
          metadata: Json;
        };
        Insert: {
          tx_hash: string;
          consomme_par_type: string;
          consomme_par_id?: string | null;
          consomme_par_profil_id?: string | null;
          consomme_le?: string;
          metadata?: Json;
        };
        Update: {
          tx_hash?: string;
          consomme_par_type?: string;
          consomme_par_id?: string | null;
          consomme_par_profil_id?: string | null;
          consomme_le?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      consentement: {
        Row: {
          id: string;
          profil_unifie_id: string;
          type_consentement: string;
          objet_type: string | null;
          objet_id: string | null;
          valeur: boolean;
          date_consentement: string;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profil_unifie_id: string;
          type_consentement: string;
          objet_type?: string | null;
          objet_id?: string | null;
          valeur: boolean;
          date_consentement?: string;
          source: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profil_unifie_id?: string;
          type_consentement?: string;
          objet_type?: string | null;
          objet_id?: string | null;
          valeur?: boolean;
          date_consentement?: string;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'consentement_profil_unifie_id_fkey';
            columns: ['profil_unifie_id'];
            isOneToOne: false;
            referencedRelation: 'profil_unifie';
            referencedColumns: ['id'];
          },
        ];
      };
      droit: {
        Row: {
          id: string;
          personne_id: string;
          cible_type: string | null;
          cible_id: string | null;
          type_droit: string;
          accorde_par: string | null;
          accorde_le: string;
          retire_par: string | null;
          retire_le: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          personne_id: string;
          cible_type?: string | null;
          cible_id?: string | null;
          type_droit: string;
          accorde_par?: string | null;
          accorde_le?: string;
          retire_par?: string | null;
          retire_le?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          personne_id?: string;
          cible_type?: string | null;
          cible_id?: string | null;
          type_droit?: string;
          accorde_par?: string | null;
          accorde_le?: string;
          retire_par?: string | null;
          retire_le?: string | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'droit_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'droit_accorde_par_fkey';
            columns: ['accorde_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'droit_retire_par_fkey';
            columns: ['retire_par'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      fil_groupe_message: {
        Row: {
          id: string;
          espace_type: string;
          espace_id: string;
          auteur_id: string;
          contenu: string;
          parent_id: string | null;
          supprime_le: string | null;
          supprime_par: string | null;
          motif_suppression: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          espace_type: string;
          espace_id: string;
          auteur_id: string;
          contenu: string;
          parent_id?: string | null;
          supprime_le?: string | null;
          supprime_par?: string | null;
          motif_suppression?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          espace_type?: string;
          espace_id?: string;
          auteur_id?: string;
          contenu?: string;
          parent_id?: string | null;
          supprime_le?: string | null;
          supprime_par?: string | null;
          motif_suppression?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fil_groupe_message_auteur_id_fkey';
            columns: ['auteur_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fil_groupe_message_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'fil_groupe_message';
            referencedColumns: ['id'];
          },
        ];
      };
      reservation: {
        Row: {
          id: string;
          offre_type: string;
          offre_id: string;
          demandeur_personne_id: string;
          creneau_debut: string;
          creneau_fin: string | null;
          quantite: number;
          message_amorce: string;
          statut: string;
          motif_decision: string | null;
          transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          offre_type: string;
          offre_id: string;
          demandeur_personne_id: string;
          creneau_debut: string;
          creneau_fin?: string | null;
          quantite?: number;
          message_amorce: string;
          statut?: string;
          motif_decision?: string | null;
          transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          offre_type?: string;
          offre_id?: string;
          demandeur_personne_id?: string;
          creneau_debut?: string;
          creneau_fin?: string | null;
          quantite?: number;
          message_amorce?: string;
          statut?: string;
          motif_decision?: string | null;
          transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reservation_demandeur_personne_id_fkey';
            columns: ['demandeur_personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      transaction_entrante: {
        Row: {
          id: string;
          caisse_id: string;
          receptacle_id: string | null;
          source_type: string;
          source_id: string | null;
          montant: number;
          canal: string;
          statut: string;
          motif: string | null;
          payeur_personne_id: string | null;
          payeur_externe_nom: string | null;
          payeur_externe_email: string | null;
          metadata: Json;
          recue_le: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          caisse_id: string;
          receptacle_id?: string | null;
          source_type: string;
          source_id?: string | null;
          montant: number;
          canal: string;
          statut?: string;
          motif?: string | null;
          payeur_personne_id?: string | null;
          payeur_externe_nom?: string | null;
          payeur_externe_email?: string | null;
          metadata?: Json;
          recue_le?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          caisse_id?: string;
          receptacle_id?: string | null;
          source_type?: string;
          source_id?: string | null;
          montant?: number;
          canal?: string;
          statut?: string;
          motif?: string | null;
          payeur_personne_id?: string | null;
          payeur_externe_nom?: string | null;
          payeur_externe_email?: string | null;
          metadata?: Json;
          recue_le?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_entrante_caisse_id_fkey';
            columns: ['caisse_id'];
            isOneToOne: false;
            referencedRelation: 'caisse';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_entrante_receptacle_id_fkey';
            columns: ['receptacle_id'];
            isOneToOne: false;
            referencedRelation: 'receptacle_caisse';
            referencedColumns: ['id'];
          },
        ];
      };
      reservation_journal: {
        Row: {
          id: string;
          reservation_id: string;
          statut_avant: string;
          statut_apres: string;
          motif: string | null;
          auteur_id: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          statut_avant: string;
          statut_apres: string;
          motif?: string | null;
          auteur_id?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          reservation_id?: string;
          statut_avant?: string;
          statut_apres?: string;
          motif?: string | null;
          auteur_id?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reservation_journal_reservation_id_fkey';
            columns: ['reservation_id'];
            isOneToOne: false;
            referencedRelation: 'reservation';
            referencedColumns: ['id'];
          },
        ];
      };
      caisse: {
        Row: {
          id: string;
          type_caisse: string;
          libelle: string;
          objet_type: string | null;
          objet_id: string | null;
          statut: string;
          metadata: Json;
          ouverte_le: string;
          fermee_le: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type_caisse: string;
          libelle: string;
          objet_type?: string | null;
          objet_id?: string | null;
          statut?: string;
          metadata?: Json;
          ouverte_le?: string;
          fermee_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type_caisse?: string;
          libelle?: string;
          objet_type?: string | null;
          objet_id?: string | null;
          statut?: string;
          metadata?: Json;
          ouverte_le?: string;
          fermee_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      receptacle_caisse: {
        Row: {
          id: string;
          caisse_id: string;
          canal: string;
          identifiant_receptacle: string;
          metadata: Json;
          valide_du: string;
          valide_au: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          caisse_id: string;
          canal: string;
          identifiant_receptacle: string;
          metadata?: Json;
          valide_du?: string;
          valide_au?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          caisse_id?: string;
          canal?: string;
          identifiant_receptacle?: string;
          metadata?: Json;
          valide_du?: string;
          valide_au?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'receptacle_caisse_caisse_id_fkey';
            columns: ['caisse_id'];
            isOneToOne: false;
            referencedRelation: 'caisse';
            referencedColumns: ['id'];
          },
        ];
      };
      transaction_sortante: {
        Row: {
          id: string;
          caisse_id: string;
          receptacle_id: string;
          beneficiaire_personne_id: string | null;
          beneficiaire_externe_nom: string | null;
          beneficiaire_externe_iban_ou_wallet: string | null;
          montant: number;
          canal: string;
          statut: string;
          motif: string;
          justificatif_storage_path: string;
          justificatif_nom_original: string;
          justificatif_mime_type: string;
          initie_par_personne_id: string;
          initie_le: string;
          confirme_par_personne_id: string | null;
          confirme_le: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          caisse_id: string;
          receptacle_id: string;
          beneficiaire_personne_id?: string | null;
          beneficiaire_externe_nom?: string | null;
          beneficiaire_externe_iban_ou_wallet?: string | null;
          montant: number;
          canal: string;
          statut?: string;
          motif: string;
          justificatif_storage_path: string;
          justificatif_nom_original: string;
          justificatif_mime_type: string;
          initie_par_personne_id: string;
          initie_le?: string;
          confirme_par_personne_id?: string | null;
          confirme_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          caisse_id?: string;
          receptacle_id?: string;
          beneficiaire_personne_id?: string | null;
          beneficiaire_externe_nom?: string | null;
          beneficiaire_externe_iban_ou_wallet?: string | null;
          montant?: number;
          canal?: string;
          statut?: string;
          motif?: string;
          justificatif_storage_path?: string;
          justificatif_nom_original?: string;
          justificatif_mime_type?: string;
          initie_par_personne_id?: string;
          initie_le?: string;
          confirme_par_personne_id?: string | null;
          confirme_le?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_sortante_caisse_id_fkey';
            columns: ['caisse_id'];
            isOneToOne: false;
            referencedRelation: 'caisse';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_sortante_receptacle_id_fkey';
            columns: ['receptacle_id'];
            isOneToOne: false;
            referencedRelation: 'receptacle_caisse';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_sortante_beneficiaire_personne_id_fkey';
            columns: ['beneficiaire_personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_sortante_initie_par_personne_id_fkey';
            columns: ['initie_par_personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      groupe_entraide_local: {
        Row: {
          id: string;
          slug: string;
          nom: string;
          description_courte: string;
          description: string;
          zone_geographique: string;
          latitude: number | null;
          longitude: number | null;
          image_url: string | null;
          statut: string;
          createurice_id: string;
          outil_pret_active: boolean;
          outil_marche_active: boolean;
          outil_sel_active: boolean;
          outil_fruits_active: boolean;
          outil_hebergement_active: boolean;
          outil_transport_active: boolean;
          outil_moments_active: boolean;
          outil_mobilisations_active: boolean;
          outil_petitions_active: boolean;
          outil_decider_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nom: string;
          description_courte: string;
          description: string;
          zone_geographique: string;
          latitude?: number | null;
          longitude?: number | null;
          image_url?: string | null;
          statut?: string;
          createurice_id: string;
          outil_pret_active?: boolean;
          outil_marche_active?: boolean;
          outil_sel_active?: boolean;
          outil_fruits_active?: boolean;
          outil_hebergement_active?: boolean;
          outil_transport_active?: boolean;
          outil_moments_active?: boolean;
          outil_mobilisations_active?: boolean;
          outil_petitions_active?: boolean;
          outil_decider_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nom?: string;
          description_courte?: string;
          description?: string;
          zone_geographique?: string;
          latitude?: number | null;
          longitude?: number | null;
          image_url?: string | null;
          statut?: string;
          createurice_id?: string;
          outil_pret_active?: boolean;
          outil_marche_active?: boolean;
          outil_sel_active?: boolean;
          outil_fruits_active?: boolean;
          outil_hebergement_active?: boolean;
          outil_transport_active?: boolean;
          outil_moments_active?: boolean;
          outil_mobilisations_active?: boolean;
          outil_petitions_active?: boolean;
          outil_decider_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groupe_entraide_local_createurice_id_fkey';
            columns: ['createurice_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      appartenance_groupe_entraide_local: {
        Row: {
          id: string;
          groupe_id: string;
          personne_id: string;
          role_groupe: string;
          rejoint_le: string;
          quitte_le: string | null;
          est_active: boolean;
        };
        Insert: {
          id?: string;
          groupe_id: string;
          personne_id: string;
          role_groupe?: string;
          rejoint_le?: string;
          quitte_le?: string | null;
          est_active?: boolean;
        };
        Update: {
          id?: string;
          groupe_id?: string;
          personne_id?: string;
          role_groupe?: string;
          rejoint_le?: string;
          quitte_le?: string | null;
          est_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'appartenance_groupe_entraide_local_groupe_id_fkey';
            columns: ['groupe_id'];
            isOneToOne: false;
            referencedRelation: 'groupe_entraide_local';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appartenance_groupe_entraide_local_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      location_mutualisee: {
        Row: {
          id: string;
          slug: string;
          organisateur_personne_id: string;
          type_location: string;
          titre: string;
          description: string;
          prestataire: string;
          lieu: string;
          date_evenement: string;
          date_limite_engagement: string;
          montant_total_centimes: number;
          nb_parts_max: number;
          prix_par_part_centimes: number;
          canal: string;
          statut: string;
          image_url: string | null;
          avertissement_juridique_accepte: boolean;
          avertissement_accepte_le: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          organisateur_personne_id: string;
          type_location: string;
          titre: string;
          description: string;
          prestataire: string;
          lieu: string;
          date_evenement: string;
          date_limite_engagement: string;
          montant_total_centimes: number;
          nb_parts_max: number;
          prix_par_part_centimes: number;
          canal?: string;
          statut?: string;
          image_url?: string | null;
          avertissement_juridique_accepte: boolean;
          avertissement_accepte_le?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          organisateur_personne_id?: string;
          type_location?: string;
          titre?: string;
          description?: string;
          prestataire?: string;
          lieu?: string;
          date_evenement?: string;
          date_limite_engagement?: string;
          montant_total_centimes?: number;
          nb_parts_max?: number;
          prix_par_part_centimes?: number;
          canal?: string;
          statut?: string;
          image_url?: string | null;
          avertissement_juridique_accepte?: boolean;
          avertissement_accepte_le?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'location_mutualisee_organisateur_personne_id_fkey';
            columns: ['organisateur_personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      engagement_location_mutualisee: {
        Row: {
          id: string;
          location_id: string;
          participant_personne_id: string;
          nb_parts: number;
          montant_engage_centimes: number;
          statut: string;
          stripe_payment_intent_id: string | null;
          engage_le: string;
          paye_le: string | null;
          annule_le: string | null;
        };
        Insert: {
          id?: string;
          location_id: string;
          participant_personne_id: string;
          nb_parts: number;
          montant_engage_centimes: number;
          statut?: string;
          stripe_payment_intent_id?: string | null;
          engage_le?: string;
          paye_le?: string | null;
          annule_le?: string | null;
        };
        Update: {
          id?: string;
          location_id?: string;
          participant_personne_id?: string;
          nb_parts?: number;
          montant_engage_centimes?: number;
          statut?: string;
          stripe_payment_intent_id?: string | null;
          engage_le?: string;
          paye_le?: string | null;
          annule_le?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'engagement_location_mutualisee_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'location_mutualisee';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'engagement_location_mutualisee_participant_personne_id_fkey';
            columns: ['participant_personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      adherent_actif: {
        Row: {
          adhesion_id: string | null;
          chemin: string | null;
          debute_le: string | null;
          expire_le: string | null;
          personne_id: string | null;
          statut: string | null;
        };
        Insert: {
          adhesion_id?: string | null;
          chemin?: string | null;
          debute_le?: string | null;
          expire_le?: string | null;
          personne_id?: string | null;
          statut?: string | null;
        };
        Update: {
          adhesion_id?: string | null;
          chemin?: string | null;
          debute_le?: string | null;
          expire_le?: string | null;
          personne_id?: string | null;
          statut?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'adhesion_personne_id_fkey';
            columns: ['personne_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      cagnotte_compteur: {
        Row: {
          cagnotte_id: string | null;
          nombre_dons: number | null;
          objectif_euros: number | null;
          slug: string | null;
          total_euros_centimes: number | null;
          total_t99cp_unites: number | null;
        };
        Relationships: [];
      };
      notation_marche_stats: {
        Row: {
          moyenne_etoiles: number | null;
          nombre_notations: number | null;
          vendeureuse_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notation_marche_vendeureuse_id_fkey';
            columns: ['vendeureuse_id'];
            isOneToOne: false;
            referencedRelation: 'personne';
            referencedColumns: ['id'];
          },
        ];
      };
      petition_compteur: {
        Row: {
          nombre_signatures: number | null;
          objectif: number | null;
          petition_id: string | null;
          slug: string | null;
          statut: string | null;
          titre: string | null;
        };
        Relationships: [];
      };
      sondage_resultats: {
        Row: {
          nombre_votes: number | null;
          option_index: number | null;
          sondage_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reponse_sondage_sondage_id_fkey';
            columns: ['sondage_id'];
            isOneToOne: false;
            referencedRelation: 'sondage';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      adhesions_a_relancer: {
        Args: { seuil_jours?: number };
        Returns: {
          chemin: string;
          created_at: string;
          debute_le: string;
          expire_le: string;
          id: string;
          montant_euros_centimes: number;
          montant_t99cp_unites: string;
          personne_id: string;
          relance_envoyee_le: string | null;
          statut: string;
          stripe_session_id: string | null;
          tx_hash: string | null;
          updated_at: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'adhesion';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      candidates_pour_assemblee: {
        Args: { entite_id_recherche: string; entite_type_recherche: string };
        Returns: string[];
      };
      compteurs_cagnotte: {
        Args: { cagnotte_a_compter: string };
        Returns: {
          nombre_dons: number;
          total_euros_centimes: number;
          total_t99cp_unites: number;
        }[];
      };
      est_admin_general: { Args: never; Returns: boolean };
      est_admin_national: { Args: never; Returns: boolean };
      est_animation_commune: {
        Args: { commune_a_verifier: string };
        Returns: boolean;
      };
      est_dpd: { Args: never; Returns: boolean };
      est_membre_commune: {
        Args: { commune_a_verifier: string };
        Returns: boolean;
      };
      est_moderateurice: { Args: { onglet_demande?: string }; Returns: boolean };
      nombre_communes_actives: {
        Args: { personne_a_compter: string };
        Returns: number;
      };
      nombre_participant_es: {
        Args: { mobilisation_a_compter: string };
        Returns: number;
      };
      compteurs_commune: {
        Args: { cible_insee: string };
        Returns: {
          inscrits: number;
          signataires: number;
          abonnes: number;
        }[];
      };
      nombre_signatures: {
        Args: { petition_a_compter: string };
        Returns: number;
      };
      rattacher_profil_unifie: {
        Args: never;
        Returns: string;
      };
      trouver_ou_creer_profil_unifie: {
        Args: { email_cible: string };
        Returns: string;
      };
      champ_reseau_visible: {
        Args: { niveau: string; est_soi: boolean; est_ami: boolean; est_connecte: boolean };
        Returns: boolean;
      };
      personne_affichage: {
        Args: { cible: string };
        Returns: {
          id: string;
          numero_unique: string | null;
          prenom: string | null;
          nom: string | null;
          pronom: string | null;
          photo_url: string | null;
          bio: string | null;
        }[];
      };
      personne_cover_url: {
        Args: { cible: string };
        Returns: string;
      };
      peut_editer_cms: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      est_ami_reseau: {
        Args: { cible: string };
        Returns: boolean;
      };
      personne_id_par_numero: {
        Args: { numero_cible: string };
        Returns: string;
      };
      membres_commune: {
        Args: { commune_cible: string };
        Returns: {
          personne_id: string;
          numero_unique: string | null;
          prenom: string | null;
          nom: string | null;
          photo_url: string | null;
          rejoint_le: string;
        }[];
      };
      prestations_a_crediter: {
        Args: { seuil_minutes?: number };
        Returns: {
          annulee_le: string | null;
          beneficiaire_id: string;
          contestee_le: string | null;
          created_at: string;
          creditee_le: string | null;
          declaree_realisee_le: string | null;
          duree_minutes_reelle: number | null;
          id: string;
          prestataire_id: string;
          reservee_le: string;
          service_id: string;
          statut: string;
          tx_hash_credit: string | null;
          updated_at: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'prestation_sel';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

// ============================================================
// Unions de statuts (depuis CHECK constraints SQL)
// ============================================================
// `supabase gen types typescript` ne traduit pas les CHECK constraints
// en unions TypeScript : il renvoie `string` pour ces colonnes. On
// rÃ©tablit ici les unions exactes, puis on en sert les alias de Row
// (Personne, Adhesion, etc.) plus bas avec les colonnes narrowÃ©es.

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
  | 'dpd'
  | 'cms';

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

// Chantier 4.3 - Marche solidaire (3 onglets : Produit / Boutique / Minimarche).
export type ModeProduitMarche = 'vente' | 'don';
export type StatutProduitMarche = 'disponible' | 'reserve' | 'vendu' | 'retire' | 'expire';
export type SensBoutiqueMarche = 'propose' | 'cherche';
export type StatutBoutiqueMarche = 'ouverte' | 'fermee' | 'retiree';
export type StatutMinimarche = 'annonce' | 'en_cours' | 'termine' | 'annule' | 'retire';
export type MonnaieMarcheMinimarche = 'T99CP' | 'EUR' | 'G1' | 'MNLC';

export type CheminAdhesion = 'gratuit' | 'euros' | 't99cp';
export type StatutAdhesion = 'active' | 'expiree' | 'annulee';

export type EntiteConfederal = 'commune' | 'federation' | 'confederation';
export type StatutMandat = 'actif' | 'libere';

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
export type SousTypeMomentPaP =
  | 'pap_1er_passage'
  | 'pap_2e_passage'
  | 'pap_tri'
  | 'pap_distribution'
  | 'pap_maraude_invit'
  | 'pap_repas'
  | 'pap_volontaires';

export type StatutOrganisationPartenaire = 'affichee' | 'retiree';

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

export type ModeSondage = 'classique' | 'pondere';
export type StatutSondage = 'ouvert' | 'ferme' | 'archive' | 'retire';
export type TrancheAge = 'moins_18' | '18_24' | '25_34' | '35_49' | '50_64' | '65_plus';

export type CanalNotification = 'cloche' | 'push' | 'mail_mardi' | 'newsletter_vendredi';

// ============================================================
// Alias pratiques (raccourcis exportes pour usage applicatif)
// ============================================================
// Chaque alias narrow les colonnes CHECK-contraintes vers leur union.
// Les requetes Supabase renvoient le `Row` brut (avec `string`) :
// dans lib/*/requetes.ts on fait un cast `as <Alias>[]` au moment du
// `return`. Le runtime est garanti par les CHECK SQL.

type RowOf<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type ViewOf<V extends keyof Database['public']['Views']> = Database['public']['Views'][V]['Row'];

export type Personne = Omit<RowOf<'personne'>, 'statut' | 'mode_theme'> & {
  statut: StatutPersonne;
  mode_theme: ModeTheme | null;
};
export type Commune = Omit<RowOf<'commune'>, 'statut_creation'> & {
  statut_creation: StatutCreationCommune;
};
export type AppartenanceCommune = RowOf<'appartenance_commune'>;
export type Federation = Omit<RowOf<'federation'>, 'type'> & {
  type: TypeFederation;
};
export type Confederation = RowOf<'confederation'>;
export type GtThematique = RowOf<'gt_thematique'>;
export type DroitAdmin = Omit<RowOf<'droit_admin'>, 'niveau'> & {
  niveau: NiveauDroitAdmin;
};
export type JournalAdmin = RowOf<'journal_admin'>;
export type Petition = Omit<RowOf<'petition'>, 'statut'> & {
  statut: StatutPetition;
};
export type SignaturePetition = RowOf<'signature_petition'>;
export type ProfilUnifie = RowOf<'profil_unifie'>;
export type RelationReseau = RowOf<'relation_reseau'>;
export type PostReseau = RowOf<'post_reseau'>;
export type CommentaireReseau = RowOf<'commentaire_reseau'>;
export type ReactionReseau = RowOf<'reaction_reseau'>;
export type MessageReseau = RowOf<'message_reseau'>;
export type PetitionCompteur = ViewOf<'petition_compteur'>;
export type Mobilisation = Omit<RowOf<'mobilisation'>, 'statut'> & {
  statut: StatutMobilisation;
};
export type ParticipationMobilisation = RowOf<'participation_mobilisation'>;
export type Campagne = Omit<RowOf<'campagne'>, 'statut'> & {
  statut: StatutCampagne;
};
export type ModuleCampagne = Omit<RowOf<'module_campagne'>, 'type_module'> & {
  type_module: TypeModuleCampagne;
};
export type Cagnotte = Omit<RowOf<'cagnotte'>, 'type' | 'statut'> & {
  type: TypeCagnotte;
  statut: StatutCagnotte;
};
export type Don = Omit<RowOf<'don'>, 'monnaie' | 'statut'> & {
  monnaie: MonnaieDon;
  statut: StatutDon;
};
export type CagnotteCompteur = ViewOf<'cagnotte_compteur'>;
export type OffreEntraide = Omit<RowOf<'offre_entraide'>, 'type' | 'sens' | 'statut'> & {
  type: TypeOffreEntraide;
  sens: SensOffreEntraide;
  statut: StatutOffreEntraide;
};
export type ServiceSel = Omit<RowOf<'service_sel'>, 'categorie' | 'sens' | 'statut'> & {
  categorie: CategorieServiceSel;
  sens: SensServiceSel;
  statut: StatutServiceSel;
};
export type PrestationSel = Omit<RowOf<'prestation_sel'>, 'statut'> & {
  statut: StatutPrestationSel;
};
export type ProduitMarche = Omit<RowOf<'produit_marche'>, 'mode' | 'statut'> & {
  mode: ModeProduitMarche;
  statut: StatutProduitMarche;
};
export type BoutiqueMarche = Omit<RowOf<'boutique_marche'>, 'sens' | 'statut'> & {
  sens: SensBoutiqueMarche;
  statut: StatutBoutiqueMarche;
};
export type ProduitBoutique = RowOf<'produit_boutique'>;
export type MinimarcheSolidaire = Omit<
  RowOf<'minimarche_solidaire'>,
  'statut' | 'monnaies_acceptees'
> & {
  statut: StatutMinimarche;
  monnaies_acceptees: MonnaieMarcheMinimarche[];
};
export type NotationMarche = RowOf<'notation_marche'>;
export type NotationMarcheStats = ViewOf<'notation_marche_stats'>;
export type Adhesion = Omit<RowOf<'adhesion'>, 'chemin' | 'statut'> & {
  chemin: CheminAdhesion;
  statut: StatutAdhesion;
};
export type AdherentActif = ViewOf<'adherent_actif'>;
export type MandatConfederal = Omit<RowOf<'mandat_confederal'>, 'entite_type' | 'statut'> & {
  entite_type: EntiteConfederal;
  statut: StatutMandat;
};
export type MomentSolidaire = Omit<RowOf<'moment_solidaire'>, 'type' | 'sous_type' | 'statut'> & {
  type: TypeMomentSolidaire;
  sous_type: SousTypeMomentPaP | null;
  statut: StatutMomentSolidaire;
};
export type ParticipationMoment = RowOf<'participation_moment'>;
export type Tupperware = Omit<RowOf<'tupperware'>, 'statut'> & {
  statut: StatutTupperware;
};
export type OrganisationPartenaire = Omit<RowOf<'organisation_partenaire'>, 'statut'> & {
  statut: StatutOrganisationPartenaire;
};
export type Media = Omit<RowOf<'media'>, 'type' | 'statut'> & {
  type: TypeMedia;
  statut: StatutMedia;
};
export type Sondage = Omit<RowOf<'sondage'>, 'mode' | 'statut'> & {
  mode: ModeSondage;
  statut: StatutSondage;
};
export type ReponseSondage = Omit<RowOf<'reponse_sondage'>, 'tranche_age'> & {
  tranche_age: TrancheAge | null;
};
export type SondageResultats = ViewOf<'sondage_resultats'>;
export type Notification = RowOf<'notification'>;
export type PreferenceNotification = RowOf<'preference_notification'>;
