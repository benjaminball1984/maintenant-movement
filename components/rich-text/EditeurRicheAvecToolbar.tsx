'use client';

/**
 * `<EditeurRicheAvecToolbar>` — combinaison `BarreOutilsRiche` + `EditeurRiche`
 * (V2.5.23). Permet d'éditer un contenu HTML riche avec toolbar visible.
 *
 * Ce composant duplique légèrement la logique TipTap de `EditeurRiche` pour
 * récupérer la ref `editor` et la passer à la toolbar (sinon il faudrait
 * remonter cette ref jusqu'au parent, ce qui complexifierait l'API).
 *
 * Usage typique dans un formulaire admin (rich text page éditoriale,
 * article média, etc.) :
 *
 *   const [html, setHtml] = useState(contenuInitial);
 *   <EditeurRicheAvecToolbar
 *     contenuInitialHtml={contenuInitial}
 *     onChange={setHtml}
 *     placeholder="Rédige ton article…"
 *   />
 */

import { BarreOutilsRiche } from '@/components/rich-text/BarreOutilsRiche';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface EditeurRicheAvecToolbarProps {
  contenuInitialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  hauteurMin?: number;
  /**
   * Nom accessible de la zone d'édition (lu par les lecteurs d'écran).
   * À préciser pour dire ce qu'on édite (« Bio », « Ordre du jour », etc.).
   */
  labelA11y?: string;
}

export function EditeurRicheAvecToolbar({
  contenuInitialHtml,
  onChange,
  placeholder = 'Commence à écrire…',
  hauteurMin = 250,
  labelA11y = 'Zone d’édition de texte riche',
}: EditeurRicheAvecToolbarProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
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
        HTMLAttributes: { class: 'max-w-full h-auto rounded-md my-3' },
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
        // Accessibilité : nom accessible + champ texte multiligne pour les
        // lecteurs d'écran (le contenteditable nu est anonyme).
        role: 'textbox',
        'aria-label': labelA11y,
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && contenuInitialHtml !== editor.getHTML()) {
      editor.commands.setContent(contenuInitialHtml);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contenuInitialHtml]);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <BarreOutilsRiche editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
