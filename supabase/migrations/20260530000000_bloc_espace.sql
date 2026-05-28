-- ============================================================================
-- Chantier V2.5.5 — Master Plan V2.6 Phase D : blocs personnalisables
--                  façon newsletter pour les espaces collectifs
-- ============================================================================
--
-- Conforme à la doctrine de greffe (CLAUDE.md §0.3) : nouvelle table autonome,
-- aucune table existante touchée.
--
-- Permet à un admin d'un espace collectif (commune, fédération, GT, groupe
-- d'entraide, campagne) d'ajouter de petits blocs réutilisables (texte,
-- image, lien, bouton) qu'il arrange à la manière d'une newsletter.
--
-- Polymorphisme : `(espace_type, espace_id)` désigne l'espace propriétaire.
-- Pas de FK polymorphe stricte côté Postgres, on s'appuie sur une CHECK
-- liste fermée + nettoyage applicatif (cf. caisse_flux V2.3.27, reservation
-- V2.2.2 pour le même pattern).
--
-- Quatre types de blocs supportés en V2.5.5 :
--   - `texte`   : contenu_json = { texte: string }                    (Markdown léger autorisé)
--   - `image`   : contenu_json = { url: string, alt: string, legende?: string }
--   - `lien`    : contenu_json = { url: string, libelle: string, externe?: boolean }
--   - `bouton`  : contenu_json = { url: string, libelle: string, variante?: 'primary'|'ghost'|'outline' }
--
-- Ces 4 types couvrent l'exemple cible du Master Plan §3.4 (bloc « lien
-- WhatsApp pour la commune d'Argenteuil »). Extension à d'autres types
-- via simple ajout dans la CHECK liste, sans casser l'existant.
-- ============================================================================

CREATE TABLE IF NOT EXISTS bloc_espace (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    espace_type   text NOT NULL,
    espace_id     uuid NOT NULL,
    ordre         int  NOT NULL DEFAULT 0,
    type          text NOT NULL,
    contenu_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
    cree_par      uuid REFERENCES public.personne(id) ON DELETE SET NULL,
    cree_le       timestamptz NOT NULL DEFAULT now(),
    mis_a_jour_le timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT bloc_espace_type_valide
        CHECK (espace_type IN ('commune', 'federation', 'confederation', 'gt_thematique', 'groupe_entraide_local', 'campagne')),
    CONSTRAINT bloc_espace_bloc_type_valide
        CHECK (type IN ('texte', 'image', 'lien', 'bouton'))
);

COMMENT ON TABLE bloc_espace IS
    'Blocs personnalisables (texte, image, lien, bouton) attachés à un espace collectif via (espace_type, espace_id). Cf. CLAUDE.md §11 (Master Plan V2.6 Phase D).';
COMMENT ON COLUMN bloc_espace.ordre IS
    'Ordre d''affichage croissant. Permet le réagencement sans réécrire tous les blocs (on insère à mi-distance entre deux entiers).';
COMMENT ON COLUMN bloc_espace.contenu_json IS
    'Contenu typé par la colonne `type`. Validation Zod côté applicatif (lib/blocs-espace/validation.ts).';

-- Index pour la lecture publique : la requête principale est
-- « tous les blocs d'un espace, ordonnés ».
CREATE INDEX IF NOT EXISTS bloc_espace_espace_idx
    ON bloc_espace (espace_type, espace_id, ordre);

-- Trigger updated_at générique (réutilise `public.tg_set_updated_at` posée
-- en migration 20260520120002_personne.sql).
DROP TRIGGER IF EXISTS bloc_espace_updated_at ON bloc_espace;
CREATE TRIGGER bloc_espace_updated_at
    BEFORE UPDATE ON bloc_espace
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();

-- RLS activée. Lecture publique : tout le monde peut voir les blocs d'un
-- espace public (au même titre que la fiche de l'espace). Écriture
-- réservée aux admins de plateforme (table `droit_admin`) : on ne donne
-- PAS encore le pouvoir aux animateurices d'espace tant que la notion
-- de « rôle dans un espace » n'est pas formalisée. Évolution prévue
-- dans un chantier dédié.
ALTER TABLE bloc_espace ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bloc_espace_lecture_publique ON bloc_espace;
CREATE POLICY bloc_espace_lecture_publique ON bloc_espace
    FOR SELECT
    USING (true);

-- Écritures : passent par le client service_role (Server Actions admin).
-- Pas de policy INSERT/UPDATE/DELETE, donc inaccessibles via le client
-- anon/authenticated.

-- Note pour la mise à jour de la trigger renommer mis_a_jour_le si
-- `tg_set_updated_at` écrit sur `updated_at` : vérifié dans la migration
-- personne, le trigger écrit bien sur `updated_at`. Donc notre colonne
-- s'appelle `mis_a_jour_le` mais le trigger générique cible `updated_at`.
-- Pour rester aligné, on renomme la colonne.
ALTER TABLE bloc_espace RENAME COLUMN mis_a_jour_le TO updated_at;
