// La page Feedback. On y arrive par feedback.html?jeu=trio, depuis le lien de l'accueil de chaque jeu.
// La liste des jeux vient de index.html : un jeu ajouté au launcher n'a rien d'autre à déclarer ici.

const SERVEUR = location.hostname === 'localhost' ? 'http://localhost:3160' : 'https://akhis-feedback.onrender.com';
const PSEUDO_CLE = 'akhis-feedback-pseudo';
const DELAI_REVEIL_MS = 6000;
const DELAI_ENVOI_MS = 90000;

const $ = (id) => document.getElementById(id);

function lireStockage(cle) {
  try {
    return localStorage.getItem(cle) ?? '';
  } catch {
    return '';
  }
}

function ecrireStockage(cle, valeur) {
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    /* stockage indisponible */
  }
}

async function chargerJeux() {
  const reponse = await fetch('index.html');
  if (!reponse.ok) throw new Error('liste indisponible');
  const page = new DOMParser().parseFromString(await reponse.text(), 'text/html');
  return [...page.querySelectorAll('a.jeu')].map((lien) => {
    const classe = [...lien.classList].find((nom) => nom.startsWith('is-'));
    return {
      id: classe.slice(3),
      classe,
      url: lien.href,
      // Le trait d'union conditionnel (&shy;) ne sert qu'à l'affichage du mur.
      nom: lien.querySelector('.jeu-nom').textContent.replace(/­/g, '').replace(/\s+/g, ' ').trim(),
    };
  });
}

function afficherJeu(jeu) {
  document.body.classList.add(jeu.classe);
  document.title = `Feedback · ${jeu.nom}`;
  $('titre').textContent = `Une idée pour ${jeu.nom} ?`;
  $('retour').href = jeu.url;
  $('retour-nom').textContent = jeu.nom;
  $('merci-retour').href = jeu.url;
  $('merci-retour').textContent = `Retour à ${jeu.nom}`;
}

function afficherChoixDuJeu(jeux) {
  const liste = $('jeu');
  liste.append(new Option('Choisis un jeu', ''));
  for (const jeu of jeux) liste.append(new Option(jeu.nom, jeu.nom));
  $('champ-jeu').hidden = false;
}

function montrerEtat(texte, erreur = false) {
  $('etat').textContent = texte;
  $('etat').classList.toggle('is-erreur', erreur);
}

async function envoyer(donnees) {
  // Le serveur gratuit peut dormir : on prévient au lieu de laisser croire que rien ne se passe.
  const reveil = setTimeout(() => montrerEtat('Le serveur se réveille, ça peut prendre jusqu\'à une minute…'), DELAI_REVEIL_MS);
  try {
    const reponse = await fetch(`${SERVEUR}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees),
      signal: AbortSignal.timeout(DELAI_ENVOI_MS),
    });
    const { erreur } = await reponse.json().catch(() => ({}));
    if (!reponse.ok) throw new Error(erreur ?? 'Envoi impossible pour le moment : réessaie un peu plus tard.');
  } catch (erreur) {
    if (erreur instanceof TypeError || erreur.name === 'TimeoutError' || erreur.name === 'AbortError') {
      throw new Error('Le serveur ne répond pas : ton texte reste ici, réessaie dans une minute.');
    }
    throw erreur;
  } finally {
    clearTimeout(reveil);
  }
}

async function demarrer() {
  let jeuChoisi = null;
  const demande = new URLSearchParams(location.search).get('jeu');
  try {
    const jeux = await chargerJeux();
    jeuChoisi = jeux.find((jeu) => jeu.id === demande) ?? null;
    if (jeuChoisi) afficherJeu(jeuChoisi);
    else afficherChoixDuJeu(jeux);
  } catch {
    montrerEtat('Liste des jeux indisponible : recharge la page.', true);
    $('envoyer').disabled = true;
  }

  $('pseudo').value = lireStockage(PSEUDO_CLE);
  // Réveille le serveur dès l'arrivée : le temps d'écrire, il sera prêt.
  fetch(`${SERVEUR}/health`).catch(() => {});

  $('formulaire').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const jeu = jeuChoisi?.nom ?? $('jeu').value;
    const message = $('message').value.trim();
    if (!jeu) {
      montrerEtat('Choisis un jeu.', true);
      $('jeu').focus();
      return;
    }
    if (message.length < 3) {
      montrerEtat('Écris ton idée en quelques mots.', true);
      $('message').focus();
      return;
    }

    const pseudo = $('pseudo').value.trim();
    ecrireStockage(PSEUDO_CLE, pseudo);
    $('envoyer').disabled = true;
    montrerEtat('Envoi…');
    try {
      await envoyer({ jeu, message, pseudo, site: $('site').value });
      $('message').value = '';
      montrerEtat('');
      $('formulaire').hidden = true;
      $('merci').hidden = false;
      $('merci').focus();
    } catch (erreur) {
      montrerEtat(erreur.message, true);
    } finally {
      $('envoyer').disabled = false;
    }
  });

  $('autre').addEventListener('click', () => {
    $('merci').hidden = true;
    $('formulaire').hidden = false;
    $('message').focus();
  });
}

demarrer();
