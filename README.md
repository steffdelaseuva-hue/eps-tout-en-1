# EPS Tout en 1 — by Steff64

Boîte à outils web pour l'EPS (dégradé or → bleu, onglet OUTILS).

- `index.html` : l'app (accueil, onglet OUTILS, sauvegarde)
- `js/outils-plus.js` : outils complémentaires (vidéo différée, photo-finish, grilles, suivi…)
- `outils/chronos-eps.html` : Chronos EPS (chrono central + 12 chronos élèves)
- `sw.js` + `manifest.webmanifest` : installation sur l'écran d'accueil et hors ligne

Déploiement : pousser le dossier sur un dépôt GitHub puis activer GitHub Pages (branche main, dossier racine).
La caméra (vidéo différée, photo-finish) nécessite HTTPS : elle fonctionne sur GitHub Pages.
