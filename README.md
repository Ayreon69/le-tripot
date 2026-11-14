# akhis-games

La page d'accueil de nos jeux : tout l'écran est un mur de LED qui joue une scène pour chaque jeu, on clique et on joue.
Une simple page statique, sans étape de build : **https://akhis-games.onrender.com**

## Ajouter un jeu

1. Dans `index.html`, copier un bloc `<li>` de la liste `.jeux`, puis changer le lien, le nom, le nombre de joueurs et `data-scene`.
2. Dans `styles.css`, ajouter une classe `.is-mon-jeu` avec sa couleur (`--c`) et celle de sa bordure (`--b`).
3. Dans `mur.js` :
   - ajouter sa scène dans `SCENES`, sur le modèle des autres ;
   - l'ajouter à `PROGRAMME` et à `COULEURS` ;
   - rien d'autre : le serveur du jeu survolé ou touché est réveillé d'après l'adresse de son bouton.

   Le tri par nombre de joueurs et le bouton « Au hasard » lisent le texte du bouton (« 3 à 8 joueurs », « 7 ou 8 joueurs ») : rien à déclarer non plus.
   Le serveur du jeu doit répondre sur `/health` : c'est ce que le launcher attend avant d'ouvrir un jeu endormi.

4. Refaire `partage.jpg`, l'image de 1200 × 630 qui s'affiche quand on colle le lien du launcher sur Discord : une capture de la page à 1600 × 840, réduite aux trois quarts.

5. Dans le jeu, sur l'accueil, à côté de « Tous les jeux », ajouter le lien `https://akhis-games.onrender.com/feedback.html?jeu=mon-jeu`, où `mon-jeu` est sa classe sans `is-`.

## Choisir et ouvrir un jeu

- **Vous êtes 2, 3… 9+** (grand écran seulement) : les jeux qui ne se jouent pas à ce nombre s'éteignent, sans bouger de place. Le choix est gardé sur l'ordinateur du visiteur.
- **Au hasard** : la lumière saute de jeu en jeu parmi ceux qui conviennent, puis s'arrête. Le jeu tiré ne s'ouvre pas tout seul : on clique dessus, ou on relance. Sur téléphone, le bouton est la dernière case de la grille.
- **Attente du réveil** : au clic, le launcher interroge `/health` du jeu. Réponse en moins d'une seconde : le jeu s'ouvre. Sinon un panneau « se réveille… » reste sur le mur jusqu'à la réponse (90 s au plus), puis le jeu s'ouvre tout seul.

## Feedback

Le lien « Feedback » de chaque jeu ouvre `feedback.html`, qui prend le nom et la couleur du jeu dans `index.html` et `styles.css`.
Le formulaire envoie au service `feedback-serveur/` (Render, `akhis-feedback`), qui poste sur Discord par le webhook de sa variable `DISCORD_WEBHOOK_FEEDBACK`. `discord/recuperer.mjs` les ramène ensuite dans `RETOURS.md`.

Le service n'a aucune dépendance. Pour le tester : `node --test feedback-serveur/serveur.test.mjs`. En local, `FEEDBACK_LOCAL=1` l'ouvre aux pages de `localhost`.

## Essayer en local

```bash
python -m http.server 3020
```

Puis ouvrir http://localhost:3020.

## Visuels de côté

Le dossier `variantes/` contient d'autres visuels (La Lampe, La Dégringolade). Il reste hors du dépôt, car tout ce qui est dans le dépôt est publié.
