import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Heading,
  IconButton,
  ThemeToggle,
} from '@/components/ui';
import { Heart } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormulaireExemple } from './FormulaireExemple';

export const metadata: Metadata = {
  title: 'Système de design',
  description: 'Référence vivante des tokens et composants UI du site Maintenant!.',
};

/**
 * Showcase complet du système de design (chantier 0.2).
 *
 * Cette page sert deux usages :
 * 1. Référence visuelle pour les contributeurices : voir d'un coup tous
 *    les tokens et composants disponibles.
 * 2. Banc d'essai pour les changements de tokens : modifier une variable
 *    dans `styles/tokens.css` doit se propager visiblement ici.
 *
 * Le toggle thème en haut permet de vérifier que chaque composant
 * reste lisible dans les deux modes (light et dark).
 */
export default function PageDesignSystem() {
  return (
    <Container taille="lg" className="py-12">
      <header className="mb-12 flex items-start justify-between gap-4">
        <div>
          <Heading niveau={1}>Système de design</Heading>
          <p className="mt-2 text-lg text-text-2">
            Référence vivante des tokens et composants UI du site Maintenant!. Basculer le thème
            pour vérifier le rendu dans les deux modes.
          </p>
          <p className="mt-1 text-sm text-text-3">
            <Link href="/" className="text-brand underline-offset-4 hover:underline">
              Retour à l'accueil
            </Link>
          </p>
        </div>
        <ThemeToggle />
      </header>

      <nav aria-label="Sommaire" className="mb-12">
        <Card variant="plat">
          <p className="mb-3 text-sm font-bold uppercase tracking-cap text-text-3">Sommaire</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {[
              ['palette', 'Palette'],
              ['gradients', 'Gradients'],
              ['typographie', 'Typographie'],
              ['boutons', 'Boutons'],
              ['formulaires', 'Formulaires'],
              ['badges', 'Badges'],
              ['alerts', 'Alertes'],
              ['cards', 'Cartes'],
              ['ombres', 'Ombres'],
              ['espacements', 'Espacements'],
            ].map(([slug, libelle]) => (
              <li key={slug}>
                <a href={`#${slug}`} className="text-brand underline-offset-4 hover:underline">
                  {libelle}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </nav>

      <Section id="palette" titre="Palette">
        <p className="mb-6 text-text-2">
          Les couleurs sont mappées sur des variables CSS. Le mode sombre les remplace
          automatiquement, donc chaque carte ci-dessous change d'apparence quand on bascule le
          thème.
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <NuancierItem jeton="--bg" libelle="Fond" classeFond="bg-bg" />
          <NuancierItem jeton="--surface" libelle="Surface" classeFond="bg-surface" />
          <NuancierItem jeton="--surface-2" libelle="Surface 2" classeFond="bg-surface-2" />
          <NuancierItem jeton="--brand" libelle="Brand" classeFond="bg-brand" />
          <NuancierItem jeton="--accent" libelle="Accent" classeFond="bg-accent" />
          <NuancierItem jeton="--hue" libelle="Hue" classeFond="bg-hue" />
          <NuancierItem jeton="--success" libelle="Success" classeFond="bg-success" />
          <NuancierItem jeton="--info" libelle="Info" classeFond="bg-info" />
          <NuancierItem jeton="--warning" libelle="Warning" classeFond="bg-warning" />
          <NuancierItem jeton="--danger" libelle="Danger" classeFond="bg-danger" />
        </div>

        <h3 className="mt-8 mb-3 text-lg font-bold">Texte (4 niveaux)</h3>
        <div className="space-y-2">
          <p className="text-text-1">Texte 1 (corps principal, contraste maximal)</p>
          <p className="text-text-2">Texte 2 (sous-titres, accent)</p>
          <p className="text-text-3">Texte 3 (métadonnées, dates)</p>
          <p className="text-text-4">Texte 4 (placeholders, hints discrets)</p>
        </div>
      </Section>

      <Section id="gradients" titre="Gradients">
        <p className="mb-6 text-text-2">
          Signature visuelle du mouvement : violet → magenta → framboise. Réservé aux CTA majeurs et
          aux marqueurs identitaires.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CarteGradient classeFond="bg-grad" libelle="Diagonal (135°)" />
          <CarteGradient classeFond="bg-grad-r" libelle="Horizontal (gauche → droite)" />
          <CarteGradient classeFond="bg-grad-soft" libelle="Soft (versions claires)" />
          <CarteGradient classeFond="bg-grad-dark" libelle="Dark (forte intensité)" />
        </div>
      </Section>

      <Section id="typographie" titre="Typographie">
        <p className="mb-6 text-text-2">
          Sora pour les titres (Display), Inter pour le corps (Body), JetBrains Mono pour le code.
        </p>
        <div className="space-y-4">
          <Heading niveau={1}>H1 · Sora 800 · 56 px</Heading>
          <Heading niveau={2}>H2 · Sora 800 · 30 px</Heading>
          <Heading niveau={3}>H3 · Sora 600 · 24 px</Heading>
          <Heading niveau={4}>H4 · Sora 600 · 20 px</Heading>
          <p className="text-base">
            Corps · Inter 400 · 16 px · leading-normal. La ligne de base du site repose sur une
            hauteur de ligne 1.5 pour le confort de lecture longue.
          </p>
          <p className="text-sm font-bold uppercase tracking-cap text-text-3">
            Petites capitales · labels et micro
          </p>
          <p className="font-mono text-sm">
            <code>npm run dev</code> · JetBrains Mono pour le code et les données numériques
          </p>
        </div>
      </Section>

      <Section id="boutons" titre="Boutons">
        <p className="mb-6 text-text-2">
          Trois variantes (gradient, ghost, outline) et trois tailles (sm, md, lg). Cible tactile
          minimale 44 px sur md et lg.
        </p>

        <div className="space-y-6">
          <ExempleLigne titre="Gradient (CTA principal)">
            <Button taille="sm">Signer (sm)</Button>
            <Button>Signer la pétition</Button>
            <Button taille="lg">Adhérer maintenant</Button>
            <Button disabled>Désactivé</Button>
          </ExempleLigne>

          <ExempleLigne titre="Ghost (action secondaire)">
            <Button variant="ghost" taille="sm">
              En savoir plus
            </Button>
            <Button variant="ghost">En savoir plus</Button>
            <Button variant="ghost" taille="lg">
              En savoir plus
            </Button>
            <Button variant="ghost" disabled>
              Désactivé
            </Button>
          </ExempleLigne>

          <ExempleLigne titre="Outline (action neutre)">
            <Button variant="outline" taille="sm">
              Annuler
            </Button>
            <Button variant="outline">Annuler</Button>
            <Button variant="outline" taille="lg">
              Annuler
            </Button>
            <Button variant="outline" disabled>
              Désactivé
            </Button>
          </ExempleLigne>

          <ExempleLigne titre="Link (CTA tertiaire)">
            <Button variant="link">Voir tout</Button>
            <Button variant="link" disabled>
              Désactivé
            </Button>
          </ExempleLigne>

          <ExempleLigne titre="IconButton">
            <IconButton aria-label="J'aime" taille="sm">
              <Heart size={16} strokeWidth={1.5} />
            </IconButton>
            <IconButton aria-label="J'aime">
              <Heart size={18} strokeWidth={1.5} />
            </IconButton>
            <IconButton aria-label="J'aime" taille="lg">
              <Heart size={20} strokeWidth={1.5} />
            </IconButton>
          </ExempleLigne>
        </div>
      </Section>

      <Section id="formulaires" titre="Formulaires">
        <p className="mb-6 text-text-2">
          Champs accessibles, état d'erreur via <code className="font-mono">aria-invalid</code>.
        </p>
        <FormulaireExemple />
      </Section>

      <Section id="badges" titre="Badges">
        <p className="mb-6 text-text-2">
          La variante <code className="font-mono">vous</code> est la signature pour signaler les
          contenus créés par la personne connectée (cf. spec §10).
        </p>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="vous">Vous</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="hue">Hue</Badge>
          <Badge variant="success">Succès</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="warning">Attention</Badge>
          <Badge variant="danger">Erreur</Badge>
        </div>
      </Section>

      <Section id="alerts" titre="Alertes">
        <div className="space-y-3">
          <Alert variant="success" titre="Inscription confirmée">
            Bienvenue dans le mouvement. Un mail vient de vous être envoyé.
          </Alert>
          <Alert variant="info" titre="Information">
            Cette pétition est en cours de modération. Elle sera publiée sous 48 h.
          </Alert>
          <Alert variant="warning" titre="Attention">
            Vous participez déjà à 2 communes. La 3e marque une attention particulière.
          </Alert>
          <Alert variant="danger" titre="Erreur">
            Impossible d'enregistrer la signature. Réessayer dans quelques instants.
          </Alert>
        </div>
      </Section>

      <Section id="cards" titre="Cartes">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="plat">
            <Heading niveau={4}>Plat</Heading>
            <p className="mt-2 text-sm text-text-2">
              Juste un bord. Pour les listes denses où l'ombre alourdirait.
            </p>
          </Card>
          <Card variant="ombre">
            <Heading niveau={4}>Ombre</Heading>
            <p className="mt-2 text-sm text-text-2">
              Variante par défaut. Donne du relief sans en faire trop.
            </p>
          </Card>
          <Card variant="eleve">
            <Heading niveau={4}>Élevée</Heading>
            <p className="mt-2 text-sm text-text-2">
              Pour la mise en avant ponctuelle. À doser : sinon plus rien ne ressort.
            </p>
          </Card>
        </div>
      </Section>

      <Section id="ombres" titre="Ombres">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <CarteOmbre classeOmbre="shadow-xs" libelle="XS" />
          <CarteOmbre classeOmbre="shadow-sm" libelle="SM" />
          <CarteOmbre classeOmbre="shadow-md" libelle="MD" />
          <CarteOmbre classeOmbre="shadow-lg" libelle="LG" />
        </div>
      </Section>

      <Section id="espacements" titre="Espacements (échelle 4 px)">
        <div className="space-y-2 font-mono text-sm">
          {[
            ['space-1', 4],
            ['space-2', 8],
            ['space-3', 12],
            ['space-4', 16],
            ['space-6', 24],
            ['space-8', 32],
            ['space-12', 48],
            ['space-16', 64],
          ].map(([nom, px]) => (
            <div key={String(nom)} className="flex items-center gap-3">
              <div
                className="h-3 rounded-xs bg-brand"
                style={{ width: `${px as number}px` }}
                aria-hidden="true"
              />
              <span className="text-text-2">
                {nom} · {px}px
              </span>
            </div>
          ))}
        </div>
      </Section>
    </Container>
  );
}

/* ============================================================
 * Composants internes au showcase
 * ============================================================ */

function Section({
  id,
  titre,
  children,
}: {
  id: string;
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-8">
      <Heading niveau={2} className="mb-4 border-b border-border pb-2">
        {titre}
      </Heading>
      {children}
    </section>
  );
}

function ExempleLigne({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-cap text-text-3">{titre}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function NuancierItem({
  jeton,
  libelle,
  classeFond,
}: {
  jeton: string;
  libelle: string;
  classeFond: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className={`h-16 ${classeFond}`} aria-hidden="true" />
      <div className="bg-surface p-2 text-xs">
        <p className="font-bold text-text-1">{libelle}</p>
        <p className="font-mono text-text-3">{jeton}</p>
      </div>
    </div>
  );
}

function CarteGradient({ classeFond, libelle }: { classeFond: string; libelle: string }) {
  return (
    <div className={`flex h-24 items-center justify-center rounded-lg ${classeFond}`}>
      <span className="rounded-pill bg-black/40 px-3 py-1 font-mono text-xs text-white">
        {libelle}
      </span>
    </div>
  );
}

function CarteOmbre({ classeOmbre, libelle }: { classeOmbre: string; libelle: string }) {
  return (
    <div className={`flex h-24 items-center justify-center rounded-lg bg-surface ${classeOmbre}`}>
      <span className="font-mono text-sm text-text-2">{libelle}</span>
    </div>
  );
}
