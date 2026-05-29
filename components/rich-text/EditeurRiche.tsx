'use client';

/**
 * Éditeur riche WYSIWYG basé sur TipTap (V2.5.23 — Master Plan rich text).
 *
 * Permet l'édition de contenu HTML formaté : couleurs, polices, tailles,
 * gras/italique/souligné, listes, liens, images, alignements, embeds vidéo
 * (YouTube/Vimeo/Peertube via allowlist sanitize).
 *
 * Le HTML produit est sauvegardé via Server Action qui sanitize avant
 * insertion en base (`lib/rich-text/sanitize.ts`). Les balises et CSS hors
 * allowlist sont supprimés à l'insertion.
 *
 * Usage typique :
 *   <EditeurRiche
 *     contenuInitialHtml={contenu.valeurHtml ?? ''}
 *     onChange={(html) => setValueHtml(html)}
 *   />
 *
 * Aussi exposé avec une toolbar embarquée via `<EditeurRicheAvecToolbar>`
 * (plus haut niveau) qui inclut tous les boutons.
 */

import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface EditeurRicheProps {
  contenuInitialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Hauteur min en pixels. */
  hauteurMin?: number;
}

/**
 * Composant éditeur pur (juste la zone d'édition). Pour la toolbar,
 * voir `<BarreOutilsRiche>` qu'on monte autour.
 */
export function EditeurRiche({
  contenuInitialHtml,
  onChange,
  placeholder = 'Commence à écrire…',
  hauteurMin = 200,
}: EditeurRicheProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Désactive les paramètres par défaut qui peuvent casser le rendu
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full h-auto rounded-md' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: { class: 'my-4 rounded-md overflow-hidden' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: contenuInitialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none p-3 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-2 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-brand [&_a]:underline',
        style: `min-height: ${hauteurMin}px`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Si le contenu initial change extérieurement (ex. reset), resynchroniser
  useEffect(() => {
    if (editor && contenuInitialHtml !== editor.getHTML()) {
      editor.commands.setContent(contenuInitialHtml);
    }
    // Volontairement pas de dépendance sur editor pour éviter loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contenuInitialHtml]);

  return <EditorContent editor={editor} />;
}

/** Export du type pour les composants frères qui veulent l'editor ref. */
export type { Editor };
