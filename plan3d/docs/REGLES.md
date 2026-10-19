# Référentiel des règles contrôlées — Plan3D v0.1

Référentiel retenu : **textes français + ergonomie Neufert**, logement résidentiel.

> **Statut juridique.** Ces textes sont opposables en France. Au Gabon, ils servent de référence de pratique et ne s'appliquent pas de plein droit. Avant un usage contractuel ou réglementaire, faire valider par un architecte ou un bureau de contrôle, et vérifier les règles locales (permis de construire, règlement d'urbanisme).

## Conventions du modèle

- Unités : mètres. Chaque pièce est un rectangle de **cotes intérieures**, hors murs.
- Surface habitable (SHAB) = somme des pièces, **hors escaliers et celliers/remises**. La règle des 1,80 m sous plafond n'est pas modélisée, faute de combles ou de sous-pentes dans le modèle.
- Deux pièces sont considérées voisines si elles sont séparées d'au plus l'épaisseur de cloison + 3 cm. Une porte posée sur ce mur dessert les deux pièces.
- Niveaux de gravité : **Non conforme** (exigence réglementaire ou incohérence du modèle), **À revoir** (recommandation forte ou contrôle approché), **Conseil** (confort).

## 1. Décence — Décret n° 2002-120 du 30 janvier 2002

| Règle | Seuil | Gravité |
|---|---|---|
| Pièce principale minimale | ≥ 1 pièce principale de 9 m² avec 2,20 m sous plafond, **ou** volume ≥ 20 m³ | Non conforme |
| Hauteur sous plafond | ≥ 2,20 m | Non conforme |
| Éclairement naturel | Chaque pièce principale a une baie donnant sur l'extérieur | Non conforme |
| WC | WC intérieur, séparé de la cuisine et de la pièce des repas | Non conforme si absent |
| Toilette | Équipement pour la toilette corporelle (salle d'eau) | Non conforme si absent |
| Cuisine | Cuisine ou coin cuisine | À revoir (le coin cuisine dans le séjour n'est pas détectable) |

## 2. Construction neuve — CCH, ex-art. R.111-2

| Règle | Seuil | Gravité |
|---|---|---|
| Hauteur sous plafond | ≥ 2,50 m | À revoir |
| Surface par habitant | 14 m²/hab. pour les 4 premiers, puis 10 m² par habitant supplémentaire | À revoir |

**À vérifier :** le Code a été recodifié au 1er juillet 2022 ; le numéro d'article actuel reste à confirmer.

## 3. Accessibilité — Arrêté du 24 décembre 2015 (logements neufs)

Ces règles s'appliquent si la case « Logement neuf soumis à l'accessibilité PMR » est cochée.

| Règle | Seuil | Gravité | Fiabilité |
|---|---|---|---|
| Porte d'entrée du logement | Largeur nominale ≥ 0,90 m | Non conforme | Texte |
| Portes intérieures | Largeur nominale ≥ 0,80 m | Non conforme | Texte |
| Circulations intérieures | Largeur ≥ 0,90 m | Non conforme | Texte |
| Salle d'eau, WC | Cercle de giration Ø 1,50 m → plus petite dimension ≥ 1,50 m | À revoir | **Approché** |
| Chambre | Lit 1,40 m + 0,90 m de passage de part et d'autre → une chambre ≥ 3,20 m de large | À revoir | **Approché** |

**À vérifier :** les contrôles « approchés » portent sur les dimensions de la pièce, pas sur la position réelle des équipements. L'aménagement doit être vérifié sur plan.

## 4. Règlement sanitaire départemental type (circulaire du 9 août 1978)

| Règle | Gravité |
|---|---|
| Le WC ne communique pas directement avec la cuisine ou la pièce des repas | Non conforme |

**À vérifier :** le RSD varie d'un département à l'autre.

## 5. Éclairement — RT 2012 (arrêté du 26 octobre 2010, art. 20)

| Règle | Seuil | Gravité |
|---|---|---|
| Surface totale de baies | ≥ 1/6 de la SHAB | À revoir |

**À vérifier :** le maintien de cette exigence sous la RE 2020 reste à confirmer. Elle visait les maisons individuelles.

## 6. Garde-corps — NF P01-012

| Règle | Seuil | Gravité |
|---|---|---|
| Baie en étage avec allège < 1,00 m | Garde-corps requis (hauteur de protection 1,00 m) | À revoir |

Hauteur réductible à 0,90 m ou 0,80 m selon l'épaisseur de l'allège : à vérifier au cas par cas.

## 7. Escaliers (escalier droit)

| Règle | Seuil | Source | Gravité |
|---|---|---|---|
| Hauteur de marche h | 15 à 20 cm (confort : 16 à 18 cm) | Usage | À revoir |
| Formule de Blondel | 60 ≤ 2h + g ≤ 64 cm | Usage | À revoir |
| Giron g | ≥ 21 cm | Usage | À revoir |
| Largeur d'emmarchement | ≥ 0,80 m | Usage | À revoir |

Calcul : hauteur à franchir = HSP + épaisseur de plancher. Nombre de girons = nombre de hauteurs − 1. Échappée et trémie : non contrôlées.

## 8. Dimensions d'usage (Neufert, pratique courante)

Ce sont des **recommandations**, pas des obligations.

| Pièce | Surface mini | Surface de confort | Largeur mini | Justification |
|---|---|---|---|---|
| Séjour | 16 m² | 20 m² | 3,20 m | Canapé + table de 4 couverts + circulations |
| Chambre | 9 m² | 11 m² | 2,60 m | Lit 1,40 m + passages latéraux de 0,60 m |
| Bureau | 7 m² | 9 m² | 2,20 m | Plan de travail 1,20 m + siège + recul |
| Cuisine | 5 m² | 8 m² | 1,50 m | Plan de travail 0,60 m + passage 0,90 m |
| Salle d'eau | 3 m² | 5 m² | 1,40 m | Receveur + lavabo + passage |
| WC | 1,1 m² | 1,5 m² | 0,80 m | Cuvette + dégagement frontal |
| Entrée | 2 m² | 4 m² | 1,20 m | Débattement de porte + rangement |
| Dégagement | — | — | 0,90 m | Circulation |

Ouvertures : portes de 2,00 m de haut au minimum (bloc-porte standard de 2,04 m) ; largeur ≥ 0,73 m hors logement accessible.

## 9. Cohérence du modèle

Chevauchement de pièces, ouverture qui dépasse son mur ou la hauteur sous plafond, ouvertures superposées, pièce non desservie par une porte, absence de porte d'entrée.

## Non couvert en v0.1 (feuille de route)

- Pièces non rectangulaires, murs biais, plusieurs niveaux.
- Placement du mobilier et des équipements (lit, cuvette, receveur), qui permettrait un contrôle PMR exact.
- Sécurité incendie, ventilation (VMC), acoustique, thermique.
- Règles spécifiques au Gabon : à intégrer comme profil de règles distinct dès que des textes sourcés sont disponibles.
