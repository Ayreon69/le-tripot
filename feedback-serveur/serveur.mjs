// Reçoit les feedbacks envoyés depuis feedback.html et les poste sur Discord, seul endroit qui les garde :
// le disque d'un service Render gratuit est effacé à chaque redémarrage. Aucune dépendance : node feedback-serveur/serveur.mjs

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 3160);
const WEBHOOK = process.env.DISCORD_WEBHOOK_FEEDBACK;
// recuperer.mjs reconnaît les feedbacks à ce nom : le changer ici impose de le changer là-bas.
const NOM_WEBHOOK = 'Feedback des jeux';

const ORIGINES = new Set(['https://akhis-games.onrender.com', 'https://le-tripot.onrender.com']);
const ORIGINE_LOCALE = /^http:\/\/localhost:\d+$/;
const ESSAI_LOCAL = process.env.FEEDBACK_LOCAL === '1';

const TAILLE_MAX_CORPS = 8_000;
const TAILLE_MIN_MESSAGE = 3;
const TAILLE_MAX_MESSAGE = 1_500;
const TAILLE_MAX_PSEUDO = 30;
const TAILLE_MAX_JEU = 40;

const FENETRE_PERSONNE_MS = 10 * 60 * 1000;
const MAX_PAR_PERSONNE = 5;
const FENETRE_TOTALE_MS = 60 * 60 * 1000;
const MAX_TOTAL = 40;
const DELAI_DISCORD_MS = 15_000;

const envois = new Map();
let envoisTotaux = [];

const origineAutorisee = (origine) => ORIGINES.has(origine) || (ESSAI_LOCAL && ORIGINE_LOCALE.test(origine ?? ''));

// Chaque champ tient sur une ligne, sauf le message, qui garde ses retours à la ligne.
const nettoyerLigne = (valeur, taille) => (typeof valeur === 'string' ? valeur : '').replace(/\s+/g, ' ').trim().slice(0, taille);

// L'adresse vue par Render peut être falsifiée : le plafond total reste la vraie protection du salon.
function tropDEnvois(personne, maintenant) {
  envoisTotaux = envoisTotaux.filter((date) => maintenant - date < FENETRE_TOTALE_MS);
  const recents = (envois.get(personne) ?? []).filter((date) => maintenant - date < FENETRE_PERSONNE_MS);
  envois.set(personne, recents);
  return recents.length >= MAX_PAR_PERSONNE || envoisTotaux.length >= MAX_TOTAL;
}

function noterEnvoi(personne, maintenant) {
  envois.get(personne).push(maintenant);
  envoisTotaux.push(maintenant);
  for (const [cle, dates] of envois) {
    if (dates.every((date) => maintenant - date >= FENETRE_PERSONNE_MS)) envois.delete(cle);
  }
}

async function posterSurDiscord({ jeu, message, pseudo }) {
  const reponse = await fetch(`${WEBHOOK}?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: NOM_WEBHOOK,
      embeds: [{ title: jeu, description: message, author: { name: pseudo || 'Anonyme' }, color: 0xff5fb0 }],
      // Le texte vient de n'importe qui : aucune mention ne doit notifier le serveur.
      allowed_mentions: { parse: [] },
    }),
    signal: AbortSignal.timeout(DELAI_DISCORD_MS),
  });
  if (!reponse.ok) throw new Error(`Discord a répondu ${reponse.status}`);
}

function lireCorps(requete) {
  return new Promise((resoudre, rejeter) => {
    let corps = '';
    requete.setEncoding('utf8');
    requete.on('data', (morceau) => {
      corps += morceau;
      if (corps.length > TAILLE_MAX_CORPS) {
        rejeter(new Error('trop long'));
        requete.destroy();
      }
    });
    requete.on('end', () => resoudre(corps));
    requete.on('error', rejeter);
  });
}

function repondre(reponse, statut, contenu, origine) {
  const entetes = { 'Content-Type': 'application/json; charset=utf-8', Vary: 'Origin' };
  if (origineAutorisee(origine)) entetes['Access-Control-Allow-Origin'] = origine;
  reponse.writeHead(statut, entetes);
  reponse.end(JSON.stringify(contenu));
}

async function recevoirFeedback(requete, reponse, origine) {
  if (!origineAutorisee(origine)) return repondre(reponse, 403, { erreur: 'Origine refusée.' }, origine);
  if (!WEBHOOK) return repondre(reponse, 503, { erreur: 'La boîte à feedbacks n\'est pas encore branchée.' }, origine);

  let donnees;
  try {
    donnees = JSON.parse(await lireCorps(requete));
  } catch {
    return repondre(reponse, 400, { erreur: 'Message illisible.' }, origine);
  }

  // Champ invisible rempli par les robots : on fait comme si tout s'était bien passé.
  if (donnees?.site) return repondre(reponse, 200, { ok: true }, origine);

  const jeu = nettoyerLigne(donnees?.jeu, TAILLE_MAX_JEU);
  const pseudo = nettoyerLigne(donnees?.pseudo, TAILLE_MAX_PSEUDO);
  const message = (typeof donnees?.message === 'string' ? donnees.message : '').trim();
  if (!jeu) return repondre(reponse, 400, { erreur: 'Choisis un jeu.' }, origine);
  if (message.length < TAILLE_MIN_MESSAGE) return repondre(reponse, 400, { erreur: 'Écris ton idée en quelques mots.' }, origine);
  if (message.length > TAILLE_MAX_MESSAGE) return repondre(reponse, 400, { erreur: `${TAILLE_MAX_MESSAGE} caractères au maximum.` }, origine);

  const personne = String(requete.headers['x-forwarded-for'] ?? requete.socket.remoteAddress).split(',')[0].trim();
  const maintenant = Date.now();
  if (tropDEnvois(personne, maintenant)) return repondre(reponse, 429, { erreur: 'Beaucoup de feedbacks d\'un coup : réessaie dans quelques minutes.' }, origine);

  try {
    await posterSurDiscord({ jeu, message, pseudo });
  } catch (erreur) {
    // Le message d'une erreur réseau pourrait contenir l'adresse secrète du webhook : on ne l'affiche pas.
    console.error(erreur.message.startsWith('Discord a répondu') ? erreur.message : 'Discord injoignable.');
    return repondre(reponse, 502, { erreur: 'Envoi impossible pour le moment : réessaie un peu plus tard.' }, origine);
  }
  noterEnvoi(personne, maintenant);
  return repondre(reponse, 200, { ok: true }, origine);
}

const serveur = createServer((requete, reponse) => {
  const origine = requete.headers.origin;
  const { pathname } = new URL(requete.url, 'http://localhost');

  if (pathname === '/health' && requete.method === 'GET') {
    return repondre(reponse, 200, { ok: true, branche: Boolean(WEBHOOK) }, origine);
  }
  if (pathname === '/feedback' && requete.method === 'OPTIONS' && origineAutorisee(origine)) {
    reponse.writeHead(204, {
      'Access-Control-Allow-Origin': origine,
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    });
    return reponse.end();
  }
  if (pathname === '/feedback' && requete.method === 'POST') {
    return void recevoirFeedback(requete, reponse, origine).catch(() => {
      if (!reponse.headersSent) repondre(reponse, 500, { erreur: 'Erreur du serveur.' }, origine);
    });
  }
  return repondre(reponse, 404, { erreur: 'Introuvable.' }, origine);
});

serveur.listen(PORT, () => console.log(`Feedback à l'écoute sur le port ${PORT}`));
