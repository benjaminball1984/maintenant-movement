'use client';

/**
 * Barre d'outils complète pour `<EditeurRiche>` (V2.5.23).
 *
 * Boutons :
 *  - Niveaux de titre (Paragraphe, H1, H2, H3)
 *  - Gras, italique, souligné, barré
 *  - Listes à puces et numérotées
 *  - Citation (blockquote)
 *  - Code inline et bloc code
 *  - Alignement (gauche, centre, droite, justifié)
 *  - Couleur de texte (palette + custom)
 *  - Lien (avec dialog pour l'URL)
 *  - Image (URL)
 *  - Embed YouTube
 *  - Annuler / Refaire
 *
 * Les couleurs et tailles sont sauvegardées via attribut `style` inline,
 * autorisés par la sanitization côté Server Action.
 */

import type { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Palette,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
  Video as YoutubeIcon,
} from 'lucide-react';

interface BarreOutilsRicheProps {
  editor: Editor | null;
}

/** Palette de couleurs prédéfinies pour le bouton couleur. */
const COULEURS = [
  { hex: '#1F2937', nom: 'Texte par défaut' },
  { hex: '#7C3AED', nom: 'Brand violet' },
  { hex: '#E11D74', nom: 'Brand magenta' },
  { hex: '#DC2654', nom: 'Brand framboise' },
  { hex: '#DC2626', nom: 'Rouge' },
  { hex: '#EA580C', nom: 'Orange' },
  { hex: '#CA8A04', nom: 'Jaune' },
  { hex: '#16A34A', nom: 'Vert' },
  { hex: '#0891B2', nom: 'Cyan' },
  { hex: '#2563EB', nom: 'Bleu' },
  { hex: '#9333EA', nom: 'Pourpre' },
  { hex: '#6B7280', nom: 'Gris' },
];

export function BarreOutilsRiche({ editor }: BarreOutilsRicheProps) {
  if (editor === null) return null;

  const Bouton = ({
    actif,
    titre,
    onClick,
    children,
    disabled,
  }: {
    actif?: boolean;
    titre: string;
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titre}
      aria-label={titre}
      aria-pressed={actif ?? false}
      className={`inline-flex h-8 w-8 items-center justify-center rounded transition ${
        actif ? 'bg-brand text-white' : 'text-text-2 hover:bg-surface-2 hover:text-text-1'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );

  function changerNiveau(niveau: 'paragraphe' | 1 | 2 | 3) {
    if (niveau === 'paragraphe') {
      editor?.chain().focus().setParagraph().run();
    } else {
      editor?.chain().focus().toggleHeading({ level: niveau }).run();
    }
  }

  function ajouterLien() {
    const ancien = editor?.getAttributes('link').href ?? '';
    const url = window.prompt('URL du lien', ancien);
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function ajouterImage() {
    const url = window.prompt("URL de l'image (https://...)");
    if (url === null || url === '') return;
    editor?.chain().focus().setImage({ src: url }).run();
  }

  function ajouterYoutube() {
    const url = window.prompt('URL de la vidéo YouTube');
    if (url === null || url === '') return;
    editor?.commands.setYoutubeVideo({ src: url, width: 560, height: 315 });
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-border border-b-0 bg-surface-2 p-1.5">
      {/* Niveau de titre */}
      <select
        value={
          editor.isActive('heading', { level: 1 })
            ? '1'
            : editor.isActive('heading', { level: 2 })
              ? '2'
              : editor.isActive('heading', { level: 3 })
                ? '3'
                : 'p'
        }
        onChange={(e) => {
          const v = e.target.value;
          changerNiveau(v === 'p' ? 'paragraphe' : (Number(v) as 1 | 2 | 3));
        }}
        className="h-8 rounded border border-border bg-surface px-2 text-sm"
        title="Niveau de titre"
        aria-label="Niveau de titre"
      >
        <option value="p">Paragraphe</option>
        <option value="1">Titre 1</option>
        <option value="2">Titre 2</option>
        <option value="3">Titre 3</option>
      </select>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      <Bouton
        titre="Gras (Ctrl+B)"
        actif={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Italique (Ctrl+I)"
        actif={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Souligné (Ctrl+U)"
        actif={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Barré"
        actif={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={14} strokeWidth={2} />
      </Bouton>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      {/* Couleur de texte */}
      <details className="relative">
        <summary
          className="inline-flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded text-text-2 transition hover:bg-surface-2 hover:text-text-1"
          aria-label="Couleur du texte"
          title="Couleur du texte"
        >
          <Palette size={14} strokeWidth={1.8} />
        </summary>
        <div className="absolute top-full left-0 z-30 mt-1 grid grid-cols-6 gap-1 rounded-md border border-border bg-surface p-2 shadow-md">
          {COULEURS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => editor.chain().focus().setColor(c.hex).run()}
              className="h-6 w-6 rounded border border-border transition hover:scale-110"
              style={{ backgroundColor: c.hex }}
              title={c.nom}
              aria-label={`Couleur ${c.nom}`}
            />
          ))}
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="col-span-6 mt-1 text-xs text-text-3 hover:text-text-1"
          >
            Couleur par défaut
          </button>
        </div>
      </details>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      <Bouton
        titre="Liste à puces"
        actif={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Liste numérotée"
        actif={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Citation"
        actif={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Code"
        actif={editor.isActive('code') || editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={14} strokeWidth={2} />
      </Bouton>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      {/* Alignement */}
      <Bouton
        titre="Aligner à gauche"
        actif={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Centrer"
        actif={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Aligner à droite"
        actif={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Justifier"
        actif={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        <AlignJustify size={14} strokeWidth={2} />
      </Bouton>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      <Bouton titre="Insérer un lien" actif={editor.isActive('link')} onClick={ajouterLien}>
        <LinkIcon size={14} strokeWidth={2} />
      </Bouton>
      <Bouton titre="Insérer une image" onClick={ajouterImage}>
        <ImageIcon size={14} strokeWidth={2} />
      </Bouton>
      <Bouton titre="Insérer une vidéo YouTube" onClick={ajouterYoutube}>
        <YoutubeIcon size={14} strokeWidth={2} />
      </Bouton>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

      <Bouton
        titre="Annuler (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo size={14} strokeWidth={2} />
      </Bouton>
      <Bouton
        titre="Refaire (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo size={14} strokeWidth={2} />
      </Bouton>
    </div>
  );
}
