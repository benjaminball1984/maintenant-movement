# components/

Composants React partagés. Organisation par responsabilité :

- `ui/` : composants UI bas niveau (shadcn/ui), chantier 0.2.
- `layout/` : Header, Footer, Nav, NavEspace (chantier 2.1).
- `carte/` : CarteSection (chantier 6.1, MapLibre GL JS).
- `agenda/` : AgendaSection (chantier 6.2).
- `decider/` : SalleDecider, VoteJugementMajoritaire, RelevePV (chantier 7.6).
- `formulaires/` : composants de formulaires partagés (Zod + react-hook-form).
- `modales/` : ModaleAuth, ModaleSignaturePetition, ModaleAdhesion (chantiers 1.2, 2.1, 5.1).
- `notifications/` : NotificationCloche, CentreNotifications (chantier 8.1).

Voir `docs/specs/01_ARCHITECTURE.md §16` pour la liste complète des composants partagés attendus.
