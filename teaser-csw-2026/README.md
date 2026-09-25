# Teaser — Semaine du Service à la Clientèle 2026 | The Extra Mile

AFG Bank Gabon · motion design · 9:16 · 1080 × 1920 · 30 i/s · 46,5 s · compréhensible sans son.

## Livrables

| Fichier | Usage |
| --- | --- |
| `export/afg-csw2026-teaser-9x16.mp4` | Vidéo finale H.264 High, yuv420p, faststart, piste audio muette (compatibilité réseaux sociaux) |
| `export/afg-csw2026-endcard-9x16.png` | End card fixe (miniature, écrans internes, relais e-mail) |
| `teaser.html` | Source de l'animation : lecture, pause, curseur de revue |
| `render.mjs` | Ré-export MP4 image par image (`node render.mjs`) et images clés (`--stills 3,8,40`) |

## Sources de marque

- Design System **AFG Bank Gabon** (artifact Design System) : tokens couleur, Mark Pro, courbes et durées.
- Logos : `assets/logos/afg-bank-logo-couleur.png` et `assets/logos/csw-2026-the-extra-mile-badge.png`, copiés tels quels depuis le Design System. Jamais redessinés, recolorés ni déformés.
- Polices Mark Pro : `assets/fonts/` n'est **pas versionné** (licence commerciale). Y déposer `MarkPro-Regular.ttf`, `MarkPro-Medium.ttf`, `MarkPro-Heavy.ttf` avant de lire ou ré-exporter. Sans elles, repli Arial.

## Storyboard et timings

| # | Scène | Fenêtre (s) | Message | Icône | Mouvement principal |
| --- | --- | --- | --- | --- | --- |
| 01 | Introduction | 0,0 – 4,7 | Il suffit parfois d’un effort… | Sablier | Ouverture depuis le noir 0,9 s · sablier opacité + Y 30→0, 500 ms ease-out · logo AFG en fondu 600 ms |
| 02 | L’effort | 4,8 – 9,5 | L’effort de faire toujours mieux. | Sablier | Sablier vers le coin supérieur droit, scale 1 → 0,35, 700 ms ease-in-out, centré sur l'axe du logo |
| 03 | Écouter | 9,6 – 14,6 | L’effort d’écouter. | Oreille + ondes | Tracé progressif 600 ms, ondes ensuite · maintien 3,4 s |
| 04 | Comprendre | 14,8 – 19,8 | L’effort de comprendre. | Deux cercles | Apparition · rapprochement 1,1 s · point commun en Vert AFG · stabilisation |
| 05 | Accompagner | 20,0 – 25,2 | L’effort d’accompagner. | Deux personnes | Rapprochement lent 1,8 s ease-in-out · chemin partagé tracé |
| 06 | Aller plus loin | 25,4 – 30,7 | L’effort d’aller plus loin. | Trajectoire | Tracé 1,5 s · flèche · point qui avance 2,7 s · horizon vert qui se lève en fond (8 s, linéaire) |
| 07 | Montée en tension | 31,0 – 34,5 | — | — | Écran vidé · ligne qui s'étire lentement (linéaire 2,8 s) · derniers grains du sablier |
| 08 | Compte à rebours | 34,6 – 39,4 | 05 → 00 | — | 800 ms/chiffre : entrée 250 ms (opacité, scale 0,94→1), sortie 200 ms · « 00 » en Vert AFG |
| — | Silence | 39,4 – 39,9 | — | — | Écran vide 500 ms |
| 09 | Révélation | 39,9 – 42,5 | Badge The Extra Mile → SEMAINE DU SERVICE À LA CLIENTÈLE → signature → date → logo AFG | — | Badge opacité + scale 0,96→1, 900 ms ease-out · textes en cascade 400–500 ms |
| 10 | End card | 42,5 – 46,5 | Logo AFG · badge · signature · 5 — 9 octobre 2026 | — | Écran strictement fixe, 4 s |

Fil narratif : le sablier (temps accordé au client) s'écoule en continu de 1,3 s à 34 s dans le coin supérieur droit ; il se vide juste avant le compte à rebours.

## Règles appliquées

- **Couleurs** : fond Bleu AFG `#001051` · accent Vert AFG `#00AD00` (mots-clés, pictogrammes, « 00 », date) · texte blanc. Le Rouge AFG `#E20000` n'apparaît que dans le logo (accent rare de la charte).
- **Typographie** : Mark Pro Medium 96 px pour les messages ; Regular 520 px pour le compte à rebours ; Heavy uniquement pour le titre événementiel ; tout aligné à gauche (charte), sauf le compte à rebours centré (brief).
- **Courbes** : ease-out `cubic-bezier(0.23, 1, 0.32, 1)` pour les entrées, ease-in-out `cubic-bezier(0.77, 0, 0.175, 1)` pour les déplacements, linéaire pour le sable, l'horizon et la ligne de tension. Aucun rebond, glitch, rotation ou zoom agressif.
- **Hiérarchie du mouvement** : un seul message et une seule icône à l'écran ; les icônes se remplacent, jamais ne s'accumulent ; le fond ne change que deux fois (ouverture, horizon de la scène 06).
- **Zones sûres** : aucun texte au-dessus de 150 px ni sous 1 630 px (interfaces Reels / Stories / TikTok).

## Contrôle qualité

| Point | Statut |
| --- | --- |
| Histoire lisible sans son, une idée par scène, révélation préparée (tension + compte à rebours + silence) | ✓ |
| Chaque mouvement a une raison ; timings dans les fourchettes du brief | ✓ |
| Fond discret, évolutions lentes et rares | ✓ |
| Logos officiels, non recréés ; palette AFG respectée | ✓ |
| Temps de lecture : messages maintenus 2,2 s (ouverture) puis 3,4 à 4,0 s ; end card 4 s fixe | ✓ |

## Points à valider (humain)

1. **Validation Communication / Direction** avant diffusion (communication institutionnelle bancaire).
2. **Atmosphère de fond** : lueurs radiales très légères (Bleu clair AFG, Vert AFG ≤ 16 %). La charte réserve les dégradés aux superpositions photo ; à confirmer, ou passer en aplat pur (supprimer `#bg-glow` et `#bg-horizon`).
3. **Pictogrammes** : tracés linéaires génériques créés pour la campagne (la charte ne définit pas de jeu d'icônes).
4. **Durée** : 46,5 s (brief : « environ 45 s »). Pour 45 s pile, réduire les maintiens des scènes 03 à 06 de 0,4 s chacune.
5. **Son** : non produit. Proposition : nappe calme, tic discret de 05 à 01, silence sur 00, ouverture à la révélation.
6. **Formats 1:1 et 16:9** : non produits dans cette version.
