import { extraireImageLocSitemap, selectionnerPourUnJour } from '@/lib/import-breves/importer';
import {
  analyserFlux,
  decoderEntitesXml,
  estImageTechnique,
  extraireParagraphes,
  extrairePremieresLignes,
  texteDepuisHtml,
} from '@/lib/import-breves/rss';
import {
  SOURCES_COMPLEMENTAIRES,
  SOURCES_NUIT,
  SOURCES_PRIORITAIRES,
  estHeureCreuseParis,
  tirerSourceHoraire,
} from '@/lib/import-breves/sources';
import { MAX_TAGS_PAR_BREVE, TAGS_BREVES, assignerTags } from '@/lib/import-breves/tags';
import { describe, expect, it } from 'vitest';

const FLUX_RSS = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Test</title>
    <item>
      <title><![CDATA[Grève générale : les salarié·es mobilisé·es]]></title>
      <link>https://exemple.org/greve</link>
      <description><![CDATA[<p>Des milliers de personnes &amp; des syndicats…</p>]]></description>
      <pubDate>Thu, 11 Jun 2026 10:00:00 +0200</pubDate>
      <enclosure url="https://exemple.org/greve.jpg" type="image/jpeg" length="1000"/>
    </item>
    <item>
      <title>Article plus récent</title>
      <link>https://exemple.org/recent</link>
      <description>Texte simple.</description>
      <pubDate>Fri, 12 Jun 2026 08:00:00 +0200</pubDate>
      <media:content url="https://exemple.org/recent.png" medium="image"/>
    </item>
  </channel>
</rss>`;

const FLUX_ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Entrée Atom</title>
    <link rel="alternate" href="https://exemple.org/atom-1"/>
    <summary>Résumé de l'entrée.</summary>
    <published>2026-06-12T09:30:00Z</published>
  </entry>
</feed>`;

describe('analyserFlux', () => {
  it('analyse un flux RSS (CDATA, entités, enclosure) et trie du plus récent au plus ancien', () => {
    const articles = analyserFlux(FLUX_RSS);
    expect(articles).toHaveLength(2);
    expect(articles[0]?.titre).toBe('Article plus récent');
    expect(articles[0]?.imageUrl).toBe('https://exemple.org/recent.png');
    expect(articles[1]?.titre).toBe('Grève générale : les salarié·es mobilisé·es');
    expect(articles[1]?.description).toContain('Des milliers de personnes & des syndicats');
    expect(articles[1]?.imageUrl).toBe('https://exemple.org/greve.jpg');
    expect(articles[1]?.publieLe).toBe(Date.parse('2026-06-11T08:00:00Z'));
  });

  it('analyse un flux Atom (link href, summary, published)', () => {
    const articles = analyserFlux(FLUX_ATOM);
    expect(articles).toHaveLength(1);
    expect(articles[0]?.lien).toBe('https://exemple.org/atom-1');
    expect(articles[0]?.description).toBe("Résumé de l'entrée.");
  });

  it('saute les émojis WordPress dans le contenu (cas Regards « doigt jaune », Ben 2026-06-12)', () => {
    const flux = `<?xml version="1.0"?><rss version="2.0"><channel><item>
      <title>Article Regards</title>
      <link>https://exemple.org/regards</link>
      <description><![CDATA[<p>Texte <img src="https://s.w.org/images/core/emoji/17.0.2/72x72/1f449.png" alt=""/> suite
        <img src="https://exemple.org/wp-content/uploads/2026/06/Image-9-1024x576.jpg"/></p>]]></description>
      <pubDate>Fri, 12 Jun 2026 08:00:00 +0200</pubDate>
    </item></channel></rss>`;
    const articles = analyserFlux(flux);
    expect(articles[0]?.imageUrl).toBe(
      'https://exemple.org/wp-content/uploads/2026/06/Image-9-1024x576.jpg',
    );
  });
});

describe('estImageTechnique', () => {
  it('reconnaît émojis, smileys, pictos, pixels, avatars et SVG', () => {
    expect(estImageTechnique('https://s.w.org/images/core/emoji/17.0.2/72x72/1f449.png')).toBe(
      true,
    );
    expect(estImageTechnique('https://exemple.org/wp-includes/images/smilies/icon_wink.gif')).toBe(
      true,
    );
    expect(estImageTechnique('https://exemple.org/theme/icons/fleche.png')).toBe(true);
    expect(estImageTechnique('https://exemple.org/logo-site.svg')).toBe(true);
    expect(
      estImageTechnique(
        'https://regards.fr/wp-content/uploads/2023/06/logoregards_blanc-jaune.png',
      ),
    ).toBe(true);
    expect(
      estImageTechnique('https://exemple.org/wp-content/uploads/2026/06/Image-9-1024x576.jpg'),
    ).toBe(false);
  });
});

describe('decoderEntitesXml', () => {
  it('décode les entités nommées typographiques et accentuées (cas Ben 2026-06-12)', () => {
    expect(decoderEntitesXml('d&rsquo;herbicide')).toBe('d’herbicide');
    expect(decoderEntitesXml('&laquo;&nbsp;t&eacute;moignage&nbsp;&raquo;&hellip;')).toBe(
      '« témoignage »…',
    );
  });

  it('résout les doubles encodages des flux (&amp;rsquo; → apostrophe)', () => {
    expect(decoderEntitesXml('d&amp;rsquo;herbicide')).toBe('d’herbicide');
    expect(decoderEntitesXml('d&amp;#8217;herbicide')).toBe('d’herbicide');
  });

  it('laisse intactes les entités inconnues et les esperluettes nues', () => {
    expect(decoderEntitesXml('&inconnue; pile & face')).toBe('&inconnue; pile & face');
  });
});

describe('texteDepuisHtml / extraireParagraphes / extrairePremieresLignes', () => {
  it('retire balises et entités, normalise les espaces', () => {
    expect(texteDepuisHtml('<p>Un &amp; <b>deux</b>\n trois</p>')).toBe('Un & deux trois');
  });

  it('retire les légendes figcaption AVEC leur contenu (crédits photo)', () => {
    expect(
      texteDepuisHtml(
        '<p>Un champ.</p><figcaption>© Esteban Grépinet/Vert</figcaption><p>Un tracteur.</p>',
      ),
    ).toBe('Un champ. Un tracteur.');
  });

  it('extraireParagraphes garde les vrais paragraphes, écarte miettes et légendes', () => {
    const phrase = 'Ceci est un vrai paragraphe d’article qui dépasse largement la borne fixée.';
    const html = `<header><p>${phrase}</p></header><p>OK</p><p>${phrase}</p><figcaption>© Crédit</figcaption><p>${phrase}</p>`;
    expect(extraireParagraphes(html)).toBe(`${phrase} ${phrase}`);
  });

  it('extraireParagraphes écarte les invites de site (cas Jeune Afrique, Ben 2026-06-12)', () => {
    const phrase = 'Investissements lourds, partenariats internationaux et feuille de route 2030.';
    const html = `<p>Complétez votre profil en quelques secondes pour recevoir nos newsletters et télécharger notre appli.</p><p>${phrase}</p><p>Abonnez-vous pour soutenir un journalisme indépendant et recevoir nos enquêtes.</p>`;
    expect(extraireParagraphes(html)).toBe(phrase);
  });

  it('laisse un texte court intact et coupe un texte long sur un mot avec ellipse', () => {
    expect(extrairePremieresLignes('Court.')).toBe('Court.');
    const long = 'mot '.repeat(300);
    const extrait = extrairePremieresLignes(long);
    expect(extrait.length).toBeLessThanOrEqual(651);
    expect(extrait.endsWith('…')).toBe(true);
  });
});

describe('assignerTags', () => {
  it('tague un titre social et luttes', () => {
    const tags = assignerTags('Grève générale : les travailleurs mobilisés pour les retraites');
    expect(tags).toContain('Luttes et mobilisations');
    expect(tags).toContain('Social et travail');
  });

  it('tague l’extrême droite et la police', () => {
    const tags = assignerTags('Le RN fait élire un néonazi, le policier mis en examen');
    expect(tags).toContain('Extrême droite');
    expect(tags).toContain('Police et justice');
  });

  it('tague l’IA sans confondre avec des mots contenant « ia »', () => {
    expect(assignerTags('L’IA nous veut-elle du bien ?')).toContain('Tech et IA');
    expect(assignerTags('Le quotidien des familiales')).not.toContain('Tech et IA');
  });

  it('limite à MAX_TAGS_PAR_BREVE tags', () => {
    const tags = assignerTags(
      'Manifestation contre l’extrême droite : la police réprime, les femmes migrantes en grève pour le climat',
    );
    expect(tags.length).toBeLessThanOrEqual(MAX_TAGS_PAR_BREVE);
  });

  it('la banque expose des tags uniques et non vides', () => {
    expect(new Set(TAGS_BREVES).size).toBe(TAGS_BREVES.length);
    expect(TAGS_BREVES.every((t) => t.trim() !== '')).toBe(true);
  });
});

describe('extraireImageLocSitemap', () => {
  const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>https://exemple.org/article-sans-image/</loc><lastmod>2026-06-12</lastmod></url>
  <url><loc>https://exemple.org/article-avec-image/</loc>
    <image:image>
      <image:loc>https://exemple.org/resizer/photo.jpg?auth=abc&amp;width=1024</image:loc>
      <image:caption><![CDATA[Une légende.]]></image:caption>
    </image:image>
  </url>
</urlset>`;

  it("retourne l'image du bloc <url> de l'article, entités décodées", () => {
    expect(extraireImageLocSitemap(SITEMAP, 'https://exemple.org/article-avec-image/')).toBe(
      'https://exemple.org/resizer/photo.jpg?auth=abc&width=1024',
    );
  });

  it("retourne null si l'article n'a pas d'image ou n'est pas dans le sitemap", () => {
    expect(extraireImageLocSitemap(SITEMAP, 'https://exemple.org/article-sans-image/')).toBeNull();
    expect(extraireImageLocSitemap(SITEMAP, 'https://exemple.org/article-inconnu/')).toBeNull();
  });
});

describe('selectionnerPourUnJour', () => {
  const candidate = (sourceIdx: number, famille: 'prioritaire' | 'complementaire', n: number) => ({
    source: { nom: `S${famille}-${sourceIdx}`, flux: '', langue: 'fr', famille },
    article: {
      titre: `A${n}`,
      lien: `https://exemple.org/${famille}-${sourceIdx}-${n}`,
      description: 'desc',
      publieLe: 1_000_000 + n,
      imageUrl: null,
      audioUrl: null,
      videoId: null,
    },
  });

  it('plafonne au maximum demandé et privilégie les prioritaires', () => {
    const pool = [
      ...Array.from({ length: 30 }, (_, i) => candidate(i, 'prioritaire', i)),
      ...Array.from({ length: 30 }, (_, i) => candidate(i, 'complementaire', 100 + i)),
    ];
    const retenues = selectionnerPourUnJour(pool, 24);
    expect(retenues).toHaveLength(24);
    expect(retenues.every((r) => r.source.famille === 'prioritaire')).toBe(true);
  });

  it('complète avec les sources complémentaires quand les prioritaires manquent', () => {
    const pool = [
      candidate(0, 'prioritaire', 1),
      candidate(1, 'complementaire', 2),
      candidate(2, 'complementaire', 3),
    ];
    const retenues = selectionnerPourUnJour(pool, 24);
    expect(retenues).toHaveLength(3);
  });

  it('RÈGLE Ben 2026-06-12 : jamais deux brèves de la même source dans la journée', () => {
    const pool = Array.from({ length: 10 }, (_, i) => candidate(0, 'prioritaire', i));
    const retenues = selectionnerPourUnJour(pool, 24);
    expect(retenues).toHaveLength(1);
  });
});

describe('estHeureCreuseParis', () => {
  it('reconnaît la nuit (23h-6h) et exclut la journée (7h-22h)', () => {
    for (const h of [23, 0, 1, 3, 6]) expect(estHeureCreuseParis(h)).toBe(true);
    for (const h of [7, 9, 12, 18, 22]) expect(estHeureCreuseParis(h)).toBe(false);
  });
});

describe('tirerSourceHoraire', () => {
  it('JOUR : 80 % prioritaires, 20 % complémentaires (aléa injecté)', () => {
    const suite = [0.1, 0.0, 0.9, 0.0];
    let i = 0;
    const aleatoire = () => suite[i++ % suite.length] as number;
    // Heure de jour fixée (12h) pour un test déterministe.
    expect(tirerSourceHoraire(aleatoire, 12)).toBe(SOURCES_PRIORITAIRES[0]);
    expect(tirerSourceHoraire(aleatoire, 12)).toBe(SOURCES_COMPLEMENTAIRES[0]);
  });

  it('NUIT : tire dans les sources d’autres fuseaux (idée Ben 2026-06-15)', () => {
    // 0.0 < 0.85 -> pool = SOURCES_NUIT ; index 0 -> première source de nuit.
    expect(tirerSourceHoraire(() => 0.0, 3)).toBe(SOURCES_NUIT[0]);
    // La source tirée la nuit a toujours une zone (amériques ou outre-mer).
    expect(tirerSourceHoraire(() => 0.0, 3).zone).toBeDefined();
  });

  it('NUIT : repli (15 %) sur l’ensemble pour un contenu européen tardif', () => {
    // 1er tirage 0.9 (>= 0.85) -> pool = TOUTES_LES_SOURCES ; 2e tirage 0.0 -> index 0.
    const suite = [0.9, 0.0];
    let i = 0;
    const aleatoire = () => suite[i++ % suite.length] as number;
    expect(tirerSourceHoraire(aleatoire, 2)).toBe(SOURCES_PRIORITAIRES[0]);
  });

  it('toutes les sources de nuit déclarent bien une zone', () => {
    expect(SOURCES_NUIT.length).toBeGreaterThan(0);
    expect(SOURCES_NUIT.every((s) => s.zone === 'ameriques' || s.zone === 'outre-mer')).toBe(true);
  });
});
