# Le Tripot

La page d'accueil de nos jeux : tout l'écran est un mur de LED qui joue une scène pour chaque jeu, on clique et on joue.
Une simple page statique, sans étape de build : **https://le-tripot.onrender.com**

## Ajouter un jeu

1. Dans `index.html`, copier un bloc `<li>` de la liste `.jeux`, puis changer le lien, le nom, le nombre de joueurs et `data-scene`.
2. Dans `styles.css`, ajouter une classe `.is-mon-jeu` avec sa couleur (`--c`) et celle de sa bordure (`--b`).
3. Dans `mur.js` :
   - ajouter sa scène dans `SCENES`, sur le modèle des autres ;
   - l'ajouter à `PROGRAMME` et à `COULEURS` ;
   - ajouter l'adresse de son serveur dans la liste de réveil, en bas du fichier.

## Essayer en local

```bash
python -m http.server 3020
```

Puis ouvrir http://localhost:3020.

## Visuels de côté

Le dossier `variantes/` contient d'autres visuels (La Lampe, La Dégringolade). Il reste hors du dépôt, car tout ce qui est dans le dépôt est publié.
