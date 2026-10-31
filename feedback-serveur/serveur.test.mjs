// Teste le service contre un faux Discord local : node --test feedback-serveur/serveur.test.mjs

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { after, before, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const ORIGINE = 'https://akhis-games.onrender.com';
const PORT_SERVICE = 3961;
const SERVICE = `http://localhost:${PORT_SERVICE}`;

let fauxDiscord;
let service;
let recus = [];
let statutDiscord = 200;
let ipSuivante = 0;

function lancerService(env) {
  const processus = spawn(process.execPath, [join(ICI, 'serveur.mjs')], {
    env: { ...process.env, PORT: String(PORT_SERVICE), ...env },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return new Promise((pret) => processus.stdout.once('data', () => pret(processus)));
}

function arreter(processus) {
  return new Promise((fini) => {
    processus.once('exit', fini);
    processus.kill();
  });
}

const envoyer = (corps, { origine = ORIGINE, ip = `10.0.0.${ipSuivante++}` } = {}) => fetch(`${SERVICE}/feedback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origine, 'X-Forwarded-For': ip },
  body: typeof corps === 'string' ? corps : JSON.stringify(corps),
});

before(async () => {
  fauxDiscord = createServer((requete, reponse) => {
    let corps = '';
    requete.on('data', (morceau) => { corps += morceau; });
    requete.on('end', () => {
      if (statutDiscord === 200) recus.push(JSON.parse(corps));
      reponse.writeHead(statutDiscord, { 'Content-Type': 'application/json' });
      reponse.end('{}');
    });
  });
  await new Promise((pret) => fauxDiscord.listen(0, pret));
  service = await lancerService({ DISCORD_WEBHOOK_FEEDBACK: `http://localhost:${fauxDiscord.address().port}/webhook` });
});

after(async () => {
  await arreter(service);
  fauxDiscord.close();
});

beforeEach(() => {
  recus = [];
  statutDiscord = 200;
});

test('un feedback arrive sur Discord avec le jeu, le texte et le pseudo, sans mention active', async () => {
  const reponse = await envoyer({ jeu: 'Trio', pseudo: '  Zino ', message: ' Un mode à 7 joueurs @everyone ' });
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get('access-control-allow-origin'), ORIGINE);
  assert.equal(recus.length, 1);
  const [embed] = recus[0].embeds;
  assert.equal(embed.title, 'Trio');
  assert.equal(embed.author.name, 'Zino');
  assert.equal(embed.description, 'Un mode à 7 joueurs @everyone');
  assert.deepEqual(recus[0].allowed_mentions, { parse: [] });
  assert.equal(recus[0].username, 'Feedback des jeux');
});

test('sans pseudo, le feedback est anonyme', async () => {
  await envoyer({ jeu: 'Trio', message: 'Une idée' });
  assert.equal(recus[0].embeds[0].author.name, 'Anonyme');
});

test('une autre origine est refusée', async () => {
  const reponse = await envoyer({ jeu: 'Trio', message: 'Une idée' }, { origine: 'https://ailleurs.example' });
  assert.equal(reponse.status, 403);
  assert.equal(recus.length, 0);
});

test('un message vide, trop long ou illisible est refusé', async () => {
  assert.equal((await envoyer({ jeu: 'Trio', message: '  ' })).status, 400);
  assert.equal((await envoyer({ jeu: 'Trio', message: 'x'.repeat(1501) })).status, 400);
  assert.equal((await envoyer({ message: 'Sans jeu' })).status, 400);
  assert.equal((await envoyer('pas du json')).status, 400);
  assert.equal(recus.length, 0);
});

test('le champ invisible des robots ne poste rien, mais répond ok', async () => {
  const reponse = await envoyer({ jeu: 'Trio', message: 'Achetez ici', site: 'https://spam.example' });
  assert.equal(reponse.status, 200);
  assert.equal(recus.length, 0);
});

test('une panne de Discord est signalée, sans compter comme un envoi', async () => {
  statutDiscord = 500;
  const ip = '10.9.9.9';
  assert.equal((await envoyer({ jeu: 'Trio', message: 'Une idée' }, { ip })).status, 502);
  statutDiscord = 200;
  for (let i = 0; i < 5; i++) assert.equal((await envoyer({ jeu: 'Trio', message: 'Une idée' }, { ip })).status, 200);
});

test('une même personne est limitée à 5 feedbacks par fenêtre', async () => {
  const ip = '10.8.8.8';
  for (let i = 0; i < 5; i++) assert.equal((await envoyer({ jeu: 'Trio', message: 'Une idée' }, { ip })).status, 200);
  assert.equal((await envoyer({ jeu: 'Trio', message: 'Une idée' }, { ip })).status, 429);
});

test('le plafond total arrête tout le monde', async () => {
  let dernier;
  for (let i = 0; i < 41; i++) dernier = await envoyer({ jeu: 'Trio', message: 'Une idée' });
  assert.equal(dernier.status, 429);
});

test('sans webhook, le service le dit au lieu de perdre le feedback', async () => {
  await arreter(service);
  const sansWebhook = await lancerService({ DISCORD_WEBHOOK_FEEDBACK: '' });
  try {
    assert.equal((await envoyer({ jeu: 'Trio', message: 'Une idée' })).status, 503);
    assert.deepEqual(await (await fetch(`${SERVICE}/health`)).json(), { ok: true, branche: false });
  } finally {
    await arreter(sansWebhook);
    service = await lancerService({ DISCORD_WEBHOOK_FEEDBACK: `http://localhost:${fauxDiscord.address().port}/webhook` });
  }
});
