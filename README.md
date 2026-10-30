# Le Tripot

La page d'accueil de nos jeux : une affiche par jeu, on clique et on joue.
Une simple page statique, sans dépendance ni étape de build.

## Ajouter un jeu

Dans `index.html` :

1. Copier un bloc `<li>` de la liste `.affiches`, puis changer le lien, le texte et le dessin.
2. Ajouter l'adresse de son serveur dans le script en bas de page, pour qu'il soit réveillé à l'arrivée sur la page.

Dans `styles.css`, ajouter une classe `.is-mon-jeu` avec ses couleurs et sa police, sur le modèle des autres.

## Essayer en local

```bash
python -m http.server 3020
```

Puis ouvrir http://localhost:3020.
