-- ============================================================================
-- Mise en ligne de l'appel « Faisons Front par la Rue ! » (02/09/2026).
--
-- Texte fourni par Lilou/Ben. Aucune reformulation : pas un mot n'a été
-- changé, ajouté ni retiré (règle de non-invention, CLAUDE.md §3). Il est
-- enregistré comme un `petition` avec `est_appel = true`, ce qui change son
-- habillage public (surtitre « Appel », auteur collectif, pas d'objectif
-- chiffré affiché) sans créer d'objet nouveau.
--
-- Seule exception, sur demande explicite de Lilou/Ben le 02/09/2026 : les
-- deux coquilles du texte source ont été corrigées, et elles seules — le
-- point manquant avant « Avec une réponse commune », et la majuscule au
-- milieu de « Mobilisons-nous Le 20 septembre ».
--
-- Idempotent : relancer ce fichier met à jour le texte, sans toucher aux
-- signatures déjà déposées (le `on conflict (slug) do update` conserve l'id).
-- ============================================================================

insert into public.petition (
  slug,
  titre,
  texte,
  texte_html,
  destinataire,
  image_url,
  objectif,
  createurice_id,
  statut,
  est_appel,
  propose_par,
  modere_par,
  modere_le
)
values (
  'faisons-front-par-la-rue',
  $titre$Faisons Front par la Rue !$titre$,
  $texte$Appel à construire une force populaire

A présent, la catastrophe est là. Et les plus fragiles d'entre nous tombent en premier :

Plus de 7 300 mort·es dans les canicules de cet été, selon un bilan encore provisoire : des personnes âgées, en situation de handicap, des familles précaires dans des logements où l'on étouffe, celleux qui travaillent dehors, ou qui dorment dans la rue. Des paysan·nes regardent leurs champs brûlés, leurs récoltes perdues, leurs troupeaux en difficulté. Des infirmièr·es tiennent à bout de bras des hôpitaux qui suffoquent. Des pompièr·es affrontent des méga-feux devenus la norme, et on leur refuse jusqu'aux moyens de nous protéger.

Face à cela, que font Macron et ses gouvernements ?

Ils répriment. À chaque mobilisation, une seule réponse, toujours la même : plus de police, de prisons, de surveillance et moins de droits, de libertés. Une logique répressive, autoritaire et raciste. Un permis de tuer offert aux forces "de l'ordre" pendant qu'on ampute les moyens de la sécurité civile, du soin et de la transition. Ils choisissent la fuite en avant : Loi "d'urgence" agricole pour autoriser une fois de plus les insecticides tueurs de biodiversité, installer des méga-bassines et des méga-fermes, pour une poignée d'agriculteurs industriels. Asphyxie budgétaire des services publics utiles et généralisation de l'austérité pour tou.tes, au profit de la course à la guerre et de la militarisation de la société et de l'école. Pendant ce temps, les profits de la caste des ultra-riches, qui fabriquent la catastrophe et en tirent fortune (augmentation des prix de l’énergie, capitalisme «vert»...), sont farouchement protégés.

Alors ne demandons plus, contraignons-les !

N'attendons rien des gouvernements, ni des multinationales : construisons, ensemble, le rapport de force qui les obligera à faire ce qui est nécessaire pour affronter le dérèglement climatique. Pour protéger et soutenir, particulièrement celleux qui sont déjà les plus impacté·es.

Ils voudraient nous maintenir divisé·es séparé·es, chacun·e dans son coin, dans sa colère. Mais c'est le même système qui écrase les quartiers populaires, qui épuise les soignant·es, qui ruine les paysan·nes, qui brûle les forêts et assèche les rivières. Face à ces oppressions systémiques, nos luttes doivent aussi devenir systémiques. Avec une réponse commune : un peuple qui se défend, qui se rassemble largement et qui se lève.

Nous, militant·es, écologistes, féministes, antiracistes, syndicalistes, antivalidistes, mobilisé·es pour l'environnement, les droits, la justice sociale, nous appelons à faire front. Par les assemblées populaires, la grève, les blocages, la désobéissance civile, et les occupations.

Dès la rentrée, faisons converger toutes nos colères

Le 15 septembre devant le ministère de l'Économie, pour une loi de finances à la hauteur de la crise. Le 26 septembre, marchons partout, pour le climat, le vivant, la paix et la justice sociale. A l'issue des manifestations, participons aux centaines d'assemblées. Le 29 septembre, soyons en grève avec toute la fonction publique et les pompièr·es. Le 3 octobre, convergeons dans l'Orne, devant Syngenta, contre les pesticides et pour les vivant·es.

Mobilisons-nous le 20 septembre contre le permis de tuer, les 24 et 25 octobre contre le congrès du rassemblement national à Orléans.

Toutes ces luttes, sont des appuis qui contribuent à construire un rapport de force en mesure de gagner face aux milliardaires, aux multinationales et aux gouvernements et qui nous permettront dans une année d'élections de contrer l'accès des extrêmes droites au pouvoir, facilité par les forces réactionnaires du grand patronat, de la droite et de la macronie.

Faisons grandir tout au long de l'année ce pouvoir populaire.

Partout, appuyons chaque mobilisation, amenons le plus grand nombre à la discussion et à la convergence, faisons vivre des assemblées, occupons des places, des ronds-points et transformons ces lieux en la maison commune de nos luttes. Soutenons-nous les un·es les autres : caisses de solidarité, entraide face à la répression, comme face aux catastrophes.

Faisons naître un véritable pouvoir populaire. Organisons-le, structurons-le, renforçons-le. Et préparons, dès maintenant, la possibilité d'un blocage généralisé du pays.

Faisons du 1er mai 2027 celui du peuple, des opprimé·es et des travailleureuses.

Un 1er mai anticapitaliste, contre l'exploitation, la précarité et la misère. Un 1er mai populaire, pour le climat, le vivant, la paix et les justices sociales. Un 1er mai féministe contre le patriarcat, pour l'égalité entre les femmes et les hommes, pour les droits des personnes LGBTQIA+. Un 1er mai antivalidiste, contre toutes les exclusions. Un 1er mai antifasciste, contre tous les racismes, l'islamophobie, l'antisémitisme, la négrophobie et la rromophobie. Un 1er mai de solidarité internationale, contre les guerres impérialistes, le colonialisme, les génocides...

Le soir de ce 1er mai, à l'issue des manifestations, occupons les places. Et gardons-les jusqu'au soir du second tour de l'élection présidentielle.

- Si les extrêmes-droites ou tout autre pouvoir réactionnaire l'emportent, soyons là, ensemble, pour entrer en résistance.
- Si une candidature de rupture l'emporte, soyons là pour l'appuyer et la déborder.

Sans un pouvoir populaire, nous ne pourrons lever les freins institutionnels mis en place par Macron et son monde, ni faire respecter les promesses de rupture. Souvenons-nous de 1936 : ce ne sont pas les urnes seules qui ont arraché les congés payés et la semaine de quarante heures, mais les grèves et les occupations qui ont suivi.

Arrachons une vie digne et heureuse pour toutes et tous, dans un monde vivable.$texte$,
  $html$<p><strong>Appel à construire une force populaire</strong></p>
<p>A présent, la catastrophe est là. Et les plus fragiles d'entre nous tombent en premier :</p>
<p>Plus de 7 300 mort·es dans les canicules de cet été, selon un bilan encore provisoire : des personnes âgées, en situation de handicap, des familles précaires dans des logements où l'on étouffe, celleux qui travaillent dehors, ou qui dorment dans la rue. Des paysan·nes regardent leurs champs brûlés, leurs récoltes perdues, leurs troupeaux en difficulté. Des infirmièr·es tiennent à bout de bras des hôpitaux qui suffoquent. Des pompièr·es affrontent des méga-feux devenus la norme, et on leur refuse jusqu'aux moyens de nous protéger.</p>
<h3>Face à cela, que font Macron et ses gouvernements ?</h3>
<p>Ils répriment. À chaque mobilisation, une seule réponse, toujours la même : plus de police, de prisons, de surveillance et moins de droits, de libertés. Une logique répressive, autoritaire et raciste. Un permis de tuer offert aux forces "de l'ordre" pendant qu'on ampute les moyens de la sécurité civile, du soin et de la transition. Ils choisissent la fuite en avant : Loi "d'urgence" agricole pour autoriser une fois de plus les insecticides tueurs de biodiversité, installer des méga-bassines et des méga-fermes, pour une poignée d'agriculteurs industriels. Asphyxie budgétaire des services publics utiles et généralisation de l'austérité pour tou.tes, au profit de la course à la guerre et de la militarisation de la société et de l'école. Pendant ce temps, les profits de la caste des ultra-riches, qui fabriquent la catastrophe et en tirent fortune (augmentation des prix de l’énergie, capitalisme «vert»...), sont farouchement protégés.</p>
<h3>Alors ne demandons plus, contraignons-les !</h3>
<p>N'attendons rien des gouvernements, ni des multinationales : construisons, ensemble, le rapport de force qui les obligera à faire ce qui est nécessaire pour affronter le dérèglement climatique. Pour protéger et soutenir, particulièrement celleux qui sont déjà les plus impacté·es.</p>
<p>Ils voudraient nous maintenir divisé·es séparé·es, chacun·e dans son coin, dans sa colère. Mais c'est le même système qui écrase les quartiers populaires, qui épuise les soignant·es, qui ruine les paysan·nes, qui brûle les forêts et assèche les rivières. Face à ces oppressions systémiques, nos luttes doivent aussi devenir systémiques. Avec une réponse commune : un peuple qui se défend, qui se rassemble largement et qui se lève.</p>
<p>Nous, militant·es, écologistes, féministes, antiracistes, syndicalistes, antivalidistes, mobilisé·es pour l'environnement, les droits, la justice sociale, nous appelons à faire front. Par les assemblées populaires, la grève, les blocages, la désobéissance civile, et les occupations.</p>
<h3>Dès la rentrée, faisons converger toutes nos colères</h3>
<p>Le 15 septembre devant le ministère de l'Économie, pour une loi de finances à la hauteur de la crise. Le 26 septembre, marchons partout, pour le climat, le vivant, la paix et la justice sociale. A l'issue des manifestations, participons aux centaines d'assemblées. Le 29 septembre, soyons en grève avec toute la fonction publique et les pompièr·es. Le 3 octobre, convergeons dans l'Orne, devant Syngenta, contre les pesticides et pour les vivant·es.</p>
<p>Mobilisons-nous le 20 septembre contre le permis de tuer, les 24 et 25 octobre contre le congrès du rassemblement national à Orléans.</p>
<p>Toutes ces luttes, sont des appuis qui contribuent à construire un rapport de force en mesure de gagner face aux milliardaires, aux multinationales et aux gouvernements et qui nous permettront dans une année d'élections de contrer l'accès des extrêmes droites au pouvoir, facilité par les forces réactionnaires du grand patronat, de la droite et de la macronie.</p>
<h3>Faisons grandir tout au long de l'année ce pouvoir populaire.</h3>
<p>Partout, appuyons chaque mobilisation, amenons le plus grand nombre à la discussion et à la convergence, faisons vivre des assemblées, occupons des places, des ronds-points et transformons ces lieux en la maison commune de nos luttes. Soutenons-nous les un·es les autres : caisses de solidarité, entraide face à la répression, comme face aux catastrophes.</p>
<p>Faisons naître un véritable pouvoir populaire. Organisons-le, structurons-le, renforçons-le. Et préparons, dès maintenant, la possibilité d'un blocage généralisé du pays.</p>
<h3>Faisons du 1er mai 2027 celui du peuple, des opprimé·es et des travailleureuses.</h3>
<p>Un 1er mai anticapitaliste, contre l'exploitation, la précarité et la misère. Un 1er mai populaire, pour le climat, le vivant, la paix et les justices sociales. Un 1er mai féministe contre le patriarcat, pour l'égalité entre les femmes et les hommes, pour les droits des personnes LGBTQIA+. Un 1er mai antivalidiste, contre toutes les exclusions. Un 1er mai antifasciste, contre tous les racismes, l'islamophobie, l'antisémitisme, la négrophobie et la rromophobie. Un 1er mai de solidarité internationale, contre les guerres impérialistes, le colonialisme, les génocides...</p>
<p>Le soir de ce 1er mai, à l'issue des manifestations, occupons les places. Et gardons-les jusqu'au soir du second tour de l'élection présidentielle.</p>
<ul>
<li>Si les extrêmes-droites ou tout autre pouvoir réactionnaire l'emportent, soyons là, ensemble, pour entrer en résistance.</li>
<li>Si une candidature de rupture l'emporte, soyons là pour l'appuyer et la déborder.</li>
</ul>
<p>Sans un pouvoir populaire, nous ne pourrons lever les freins institutionnels mis en place par Macron et son monde, ni faire respecter les promesses de rupture. Souvenons-nous de 1936 : ce ne sont pas les urnes seules qui ont arraché les congés payés et la semaine de quarante heures, mais les grèves et les occupations qui ont suivi.</p>
<p><strong>Arrachons une vie digne et heureuse pour toutes et tous, dans un monde vivable.</strong></p>$html$,
  $dest$Aux assemblées, collectifs, syndicats et organisations$dest$,
  'https://qehmwcozanujotexnsqw.supabase.co/storage/v1/object/public/media/petitions/couverture/faisons-front-par-la-rue.jpg',
  100,
  'c5b169de-92ed-41d3-bdfd-47820663bade',
  'publiee',
  true,
  $prop$la Coordination nationale Bloquons Tout$prop$,
  'c5b169de-92ed-41d3-bdfd-47820663bade',
  now()
)
on conflict (slug) do update set
  titre = excluded.titre,
  texte = excluded.texte,
  texte_html = excluded.texte_html,
  destinataire = excluded.destinataire,
  image_url = excluded.image_url,
  statut = excluded.statut,
  est_appel = excluded.est_appel,
  propose_par = excluded.propose_par;
