// Le mur de LED : chaque scène se dessine en basse résolution, une LED par pixel, puis le shader allume les LED à l'écran.
const POLICE = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 27, 17], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14], 4: [2, 6, 10, 18, 31, 2, 2],
  5: [31, 16, 30, 1, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14], 9: [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0], '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8], ':': [0, 12, 12, 0, 12, 12, 0], '-': [0, 0, 0, 31, 0, 0, 0],
  "'": [12, 4, 8, 0, 0, 0, 0], '?': [14, 17, 1, 2, 4, 0, 4], '!': [4, 4, 4, 4, 4, 0, 4], '+': [0, 4, 4, 31, 4, 4, 0], '×': [0, 17, 10, 4, 10, 17, 0],
  '÷': [0, 4, 0, 31, 0, 4, 0], '=': [0, 0, 31, 0, 31, 0, 0], '√': [3, 2, 2, 2, 18, 10, 4], '>': [8, 4, 2, 1, 2, 4, 8],
};
const ENSEIGNES = [
  [54, 127, 127, 127, 62, 28, 8],
  [8, 28, 62, 127, 62, 28, 8],
  [8, 28, 62, 127, 127, 8, 28],
  [28, 28, 107, 127, 107, 8, 28],
];

function texte(c, s, x, y, e = 1) {
  for (const ch of s) {
    const g = POLICE[ch] || POLICE[' '];
    for (let r = 0; r < 7; r++) for (let b = 0; b < 5; b++) if ((g[r] >> (4 - b)) & 1) c.fillRect(x + b * e, y + r * e, e, e);
    x += 6 * e;
  }
}
const largeur = (s, e = 1) => (s.length * 6 - 1) * e;

function detoure(c, s, x, y, e, couleur) {
  c.fillStyle = '#000';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) texte(c, s, x + dx, y + dy, e);
  c.fillStyle = couleur;
  texte(c, s, x, y, e);
}

function enseigne(c, g, x, y, e) {
  for (let r = 0; r < 7; r++) for (let b = 0; b < 7; b++) if ((g[r] >> (6 - b)) & 1) c.fillRect(x + b * e, y + r * e, e, e);
}

const G = { w: 0, h: 0, sur: 0, paysage: false, cellule: 8, px: -100, py: -100, vu: -1e9 };

function bandeau(c, s, y, e, couleur, v, t) {
  const l = largeur(s, e);
  const x = G.w - ((t * v) % (l + G.w));
  c.fillStyle = 'rgba(0,0,0,.72)';
  c.fillRect(0, y - e, G.w, 9 * e);
  c.fillStyle = couleur;
  texte(c, s, Math.round(x), y, e);
}

// Répartit l'écran entre le dessin et le nom du jeu, selon l'orientation.
function zones(lignes) {
  const haut = G.paysage ? 4 : 3;
  const bas = G.sur - (G.paysage ? 14 : 12);
  const plus = Math.max(...lignes.map((l) => l.length));
  if (G.paysage) {
    const lt = Math.floor(G.w * 0.5);
    const e = Math.max(1, Math.min(Math.floor((lt - 6) / (plus * 6)), Math.floor((bas - haut) / (lignes.length * 9))));
    return { ax: 3, ay: haut, aw: Math.floor(G.w * 0.48), ah: bas - haut, tx: Math.floor(G.w * 0.74), ty: Math.floor((haut + bas) / 2), e, bas };
  }
  // Sur un mur bas (téléphone court, beaucoup de jeux), le nom rapetisse pour laisser de la place au dessin.
  const e = Math.max(1, Math.min(Math.floor((G.w - 4) / (plus * 6)), Math.floor(((bas - haut) * 0.6) / (lignes.length * 9))));
  const th = lignes.length * 9 * e;
  return { ax: 2, ay: haut, aw: G.w - 4, ah: Math.max(6, bas - haut - th - 3), tx: Math.floor(G.w / 2), ty: bas - th / 2, e, bas };
}

function nom(c, lignes, couleurs, z) {
  const h = lignes.length * 9 * z.e;
  lignes.forEach((l, i) => {
    detoure(c, l, Math.round(z.tx - largeur(l, z.e) / 2), Math.round(z.ty - h / 2 + i * 9 * z.e + z.e), z.e, couleurs[i]);
  });
}

const PLUIE = [];
const TETE = new Path2D('M110 340L108 292C96 294 72 296 62 288C54 282 52 272 56 264C50 260 50 252 56 248C48 244 48 236 56 232C52 226 54 220 50 214C40 212 22 206 24 198C26 188 50 160 56 140C58 130 52 118 56 100C66 52 116 30 170 34C246 38 296 96 296 170C296 230 270 270 262 340Z');

const CRANE = new Path2D('M0-70C34-70 56-46 56-12C56 6 48 18 36 24L34 40C34 46 30 50 24 50L-24 50C-30 50-34 46-34 40L-36 24C-48 18-56 6-56-12C-56-46-34-70 0-70Z');
const ORBITES = new Path2D('M-36-18C-36-34-11-36-9-18C-7-2-20 6-29 3C-36 1-36-7-36-18ZM36-18C36-34 11-36 9-18C7-2 20 6 29 3C36 1 36-7 36-18Z');
const NEZ = new Path2D('M0 6L-10 24L-2 21L0 25L2 21L10 24Z');

function etoile(c, x, y, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const q = i % 2 ? r * 0.42 : r;
    c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
  }
  c.fill();
}

const SCENES = {
  // Mire de démarrage, comme un écran de stade qu'on allume.
  boot(c, t) {
    const couleurs = ['#fff', '#ffe600', '#00e5ff', '#00e640', '#ff00d4', '#ff1a1a', '#1a3cff'];
    const b = Math.ceil(G.w / couleurs.length);
    couleurs.forEach((k, i) => {
      c.fillStyle = k;
      c.fillRect(i * b, 0, b, G.h);
    });
    c.fillStyle = '#000';
    const y = (t * 170) % (G.h + 30);
    c.fillRect(0, y - 30, G.w, 16);
    c.fillRect(0, y, G.w, 5);
    for (let i = 0; i < G.w * 2; i++) c.fillRect(Math.random() * G.w | 0, Math.random() * G.h | 0, 1, 1);
  },

  titre(c, t) {
    c.fillStyle = '#080304';
    c.fillRect(0, 0, G.w, G.h);
    c.globalCompositeOperation = 'lighter';
    const taches = ['#a3101c', '#a35a08', '#5e0e66', '#8f2606', '#08527a'];
    const rayon = Math.max(G.w, G.sur) * 0.5;
    taches.forEach((k, i) => {
      const x = G.w * (0.5 + 0.48 * Math.sin(t * 0.31 + i * 1.7));
      const y = G.sur * (0.5 + 0.5 * Math.cos(t * 0.23 + i * 2.3));
      const g = c.createRadialGradient(x, y, 0, x, y, rayon);
      g.addColorStop(0, k);
      g.addColorStop(1, '#000');
      c.fillStyle = g;
      c.fillRect(0, 0, G.w, G.h);
    });
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(0,0,0,.42)';
    c.fillRect(0, 0, G.w, G.h);
    if (!PLUIE.length) {
      for (let i = 0; i < 26; i++) PLUIE.push({ x: Math.random(), y: Math.random() * 400, v: 5 + Math.random() * 12, g: i % 4, e: Math.random() < 0.3 ? 2 : 1 });
    }
    PLUIE.forEach((p) => {
      c.fillStyle = p.g < 2 ? 'rgba(255,70,70,.55)' : 'rgba(255,255,255,.3)';
      enseigne(c, ENSEIGNES[p.g], Math.round(p.x * G.w), Math.round(((p.y + t * p.v) % (G.sur + 20)) - 14), p.e);
    });

    const mots = G.paysage ? ['AKHIS-GAMES'] : ['AKHIS-', 'GAMES'];
    const plus = Math.max(...mots.map((m) => m.length));
    const e = Math.max(1, Math.min(Math.floor((G.w - 6) / (plus * 6)), Math.floor((G.sur - 26) / (mots.length * 9))));
    const hb = mots.length * 9 * e;
    const y0 = Math.round((G.sur - 12) / 2 - hb / 2);
    mots.forEach((m, i) => {
      const x = Math.round(G.w / 2 - largeur(m, e) / 2);
      const y = y0 + i * 9 * e;
      c.fillStyle = 'rgba(0,0,0,.8)';
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2], [-2, -2], [2, -2], [-2, 2], [3, 3]]) texte(c, m, x + dx, y + dy, e);
      const pos = ((t * 0.45) % 1.6) - 0.3;
      const g = c.createLinearGradient(0, 0, G.w, G.sur * 0.3);
      g.addColorStop(0, '#ffc23d');
      g.addColorStop(Math.max(0, Math.min(1, pos - 0.1)), '#ffc23d');
      g.addColorStop(Math.max(0, Math.min(1, pos)), '#fffdf2');
      g.addColorStop(Math.max(0, Math.min(1, pos + 0.1)), '#ff8a2a');
      g.addColorStop(1, '#ff8a2a');
      c.fillStyle = g;
      texte(c, m, x, y, e);
    });
    bandeau(c, "CHOISIS UN JEU  >  PARTAGE LE CODE  >  C'EST PARTI  >  ", G.sur - 10, 1, '#fff', 26, t);
  },

  indian(c, t) {
    const g = c.createRadialGradient(G.w * 0.3, G.sur * 0.4, 0, G.w * 0.3, G.sur * 0.4, G.w);
    g.addColorStop(0, '#ff5b38');
    g.addColorStop(1, '#a81e08');
    c.fillStyle = g;
    c.fillRect(0, 0, G.w, G.h);
    const z = zones(['INDIAN', 'POKER']);
    // On garde de la place au-dessus du front pour la carte qui retombe.
    const s = Math.min(z.ah / 400, z.aw / 300);
    const ox = z.ax + (z.aw - 300 * s) / 2 + 8 * s;
    const oy = z.ay + (z.ah - 340 * s) + Math.sin(t * 1.8) * 1.2;
    c.save();
    c.translate(ox, oy);
    c.scale(s, s);
    c.fillStyle = '#15110e';
    c.fill(TETE);
    c.fillStyle = '#f4e8d3';
    c.beginPath();
    c.arc(94, 148, 17, 0, 7);
    c.fill();
    // L'œil suit le pointeur.
    const ex = ox + 94 * s;
    const ey = oy + 148 * s;
    const a = Math.atan2(G.py - ey, G.px - ex);
    const ang = performance.now() - G.vu < 4000 ? a : t * 0.8;
    c.fillStyle = '#15110e';
    c.beginPath();
    c.arc(94 + Math.cos(ang) * 8, 148 + Math.sin(ang) * 8, 8, 0, 7);
    c.fill();
    c.restore();
    // La carte sur le front : elle retombe à intervalles réguliers.
    const cycle = t % 4;
    const chute = cycle < 0.45 ? 1 - (cycle / 0.45) ** 2 : 0;
    const rebond = cycle >= 0.45 && cycle < 0.7 ? Math.sin(((cycle - 0.45) / 0.25) * Math.PI) * 0.1 : 0;
    const cw = Math.max(13, Math.round(86 * s));
    const ch = Math.round(cw * 1.42);
    const cx = ox + 62 * s;
    const cy = oy + 58 * s - (chute + rebond) * (ch + 40 * s + 8);
    c.save();
    c.translate(cx, cy);
    c.rotate(-0.14 + Math.sin(t * 1.8) * 0.02);
    c.fillStyle = '#15110e';
    c.fillRect(-cw / 2 - 1, -ch / 2 - 1, cw + 2, ch + 2);
    c.fillStyle = '#f4e8d3';
    c.fillRect(-cw / 2, -ch / 2, cw, ch);
    c.fillStyle = '#e4432a';
    const e = Math.max(1, Math.floor(cw / 7));
    texte(c, '?', Math.round(-2.5 * e), Math.round(-3.5 * e), e);
    c.restore();
    nom(c, ['INDIAN', 'POKER'], ['#fff6e6', '#15110e'], z);
    bandeau(c, 'TOUT LE MONDE VOIT TA CARTE. SAUF TOI.     ', G.sur - 10, 1, '#fff6e6', 28, t);
  },

  sniper(c, t) {
    c.fillStyle = '#07070b';
    c.fillRect(0, 0, G.w, G.h);
    const z = zones(['HOLD\'EM', 'SNIPER']);
    const cx = z.ax + z.aw / 2;
    const cy = z.ay + z.ah / 2;
    const R = Math.min(z.aw, z.ah) * 0.47;
    const halo = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
    halo.addColorStop(0, 'rgba(255,40,70,.42)');
    halo.addColorStop(1, 'rgba(255,40,70,0)');
    c.fillStyle = halo;
    c.fillRect(0, 0, G.w, G.h);
    // Balayage radar.
    const a0 = t * 1.5;
    for (let i = 0; i < 14; i++) {
      c.fillStyle = `rgba(255,51,85,${(0.34 * (14 - i)) / 14})`;
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, R, a0 - (i + 1) * 0.07, a0 - i * 0.07);
      c.fill();
    }
    c.strokeStyle = '#ff3355';
    c.lineWidth = 1;
    [1, 0.68, 0.36].forEach((k, i) => {
      c.setLineDash(i === 0 ? [] : [3, 3]);
      c.lineDashOffset = t * (i % 2 ? -9 : 9);
      c.beginPath();
      c.arc(cx, cy, R * k, 0, 7);
      c.stroke();
    });
    c.setLineDash([]);
    // Les deux 7 visés.
    const cw = Math.max(10, Math.round(R * 0.5));
    const ch = Math.round(cw * 1.4);
    const e = Math.max(1, Math.floor(cw / 7));
    [[-cw * 0.62, '#f3f1ec', '#14141d'], [cw * 0.62, '#c8102e', '#fff']].forEach(([dx, fond, encre]) => {
      c.fillStyle = fond;
      c.fillRect(cx + dx - cw / 2, cy - ch / 2, cw, ch);
      c.fillStyle = encre;
      texte(c, '7', Math.round(cx + dx - 2.5 * e), Math.round(cy - 3.5 * e), e);
    });
    // Le viseur suit le pointeur, ou cherche sa cible tout seul.
    const actif = performance.now() - G.vu < 2500 && G.px < G.w && G.py < G.sur;
    const mx = actif ? G.px : cx + Math.sin(t * 1.1) * R * 0.85 * Math.sin(t * 0.37);
    const my = actif ? G.py : cy + Math.sin(t * 1.63) * R * 0.75 * Math.sin(t * 0.37);
    const verrou = Math.hypot(mx - cx, my - cy) < R * 0.2;
    const r = Math.max(6, R * 0.26) * (verrou ? 0.8 + Math.sin(t * 22) * 0.08 : 1);
    c.strokeStyle = verrou ? '#fff' : '#ff3355';
    c.lineWidth = verrou ? 2 : 1;
    c.beginPath();
    c.arc(mx, my, r, 0, 7);
    c.stroke();
    c.beginPath();
    c.moveTo(mx - r * 1.6, my); c.lineTo(mx - r * 0.5, my);
    c.moveTo(mx + r * 1.6, my); c.lineTo(mx + r * 0.5, my);
    c.moveTo(mx, my - r * 1.6); c.lineTo(mx, my - r * 0.5);
    c.moveTo(mx, my + r * 1.6); c.lineTo(mx, my + r * 0.5);
    c.stroke();
    if (verrou && Math.sin(t * 22) > 0) {
      c.fillStyle = 'rgba(255,255,255,.28)';
      c.fillRect(0, 0, G.w, G.sur);
    }
    nom(c, ["HOLD'EM", 'SNIPER'], ['#f3f1ec', '#ff3355'], z);
    bandeau(c, "ON NE BAT PAS L'ADVERSAIRE : ON L'ABAT.     ", G.sur - 10, 1, '#ff8097', 30, t);
  },

  equation(c, t) {
    c.fillStyle = '#0c0a12';
    c.fillRect(0, 0, G.w, G.h);
    const signes = '0123456789+-×÷√=';
    const pas = 8;
    for (let x = 0, n = 0; x < G.w; x += pas, n++) {
      const graine = ((n * 7919) % 97) / 97;
      const v = 7 + graine * 14;
      const tete = ((t * v + graine * 300) % (G.sur + 60)) - 10;
      for (let k = 0; k < 6; k++) {
        const y = Math.floor(tete - k * 9);
        const force = (1 - k / 6) ** 1.6;
        c.fillStyle = n % 3 === 0 ? `rgba(120,215,255,${force * 0.38})` : n % 3 === 1 ? `rgba(231,194,122,${force * 0.32})` : `rgba(255,150,80,${force * 0.32})`;
        const s = signes[(n * 3 + k + Math.floor(t * 3 + graine * 9)) % signes.length];
        texte(c, s, x, y, 1);
      }
    }
    const z = zones(['EQUATION', 'HI-LO']);
    const e = Math.max(2, Math.min(Math.floor(z.aw / 27), Math.floor(z.ah / 15)));
    const lh = 7 * e;
    const cx = z.ax + z.aw / 2;
    const cy = z.ay + z.ah / 2;
    const bat = (Math.sin(t * 1.6) + 1) / 2;
    const x20 = Math.round(cx - largeur('20', e) - e * 1.5);
    const y20 = Math.round(cy - lh - e * 0.5);
    const x1 = Math.round(cx + e * 2.5);
    const y1 = Math.round(cy + e * 0.5);
    const g20 = c.createLinearGradient(x20, y20, x20 + largeur('20', e), y20 + lh);
    g20.addColorStop(0, '#ffc27a');
    g20.addColorStop(1, '#ff5d3a');
    const g1 = c.createLinearGradient(x1, y1, x1 + 5 * e, y1 + lh);
    g1.addColorStop(0, '#9fe8ff');
    g1.addColorStop(1, '#3f86ff');
    c.fillStyle = '#000';
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2]]) {
      texte(c, '20', x20 + dx, y20 + dy, e);
      texte(c, '1', x1 + dx, y1 + dy, e);
    }
    c.globalAlpha = 0.72 + bat * 0.28;
    c.fillStyle = g20;
    texte(c, '20', x20, y20, e);
    c.globalAlpha = 1 - bat * 0.28;
    c.fillStyle = g1;
    texte(c, '1', x1, y1, e);
    c.globalAlpha = 1;
    c.strokeStyle = '#e7c27a';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx + largeur('20', e) * 0.9, cy - lh - e);
    c.lineTo(cx - largeur('20', e) * 0.9, cy + lh + e);
    c.stroke();
    nom(c, ['EQUATION', 'HI-LO'], ['#f6eedc', '#e7c27a'], z);
    bandeau(c, 'RANGE TES CARTES, VISE 20 OU 1, ET MISE.     ', G.sur - 10, 1, '#f6eedc', 28, t);
  },

  gang(c, t) {
    const fond = c.createRadialGradient(G.w / 2, 0, 0, G.w / 2, 0, Math.max(G.w, G.h));
    fond.addColorStop(0, '#26395f');
    fond.addColorStop(1, '#070a11');
    c.fillStyle = fond;
    c.fillRect(0, 0, G.w, G.h);
    const z = zones(['THE', 'GANG']);
    const R = Math.min(z.aw / 8.8, z.ah / 3.6);
    const cy = z.ay + z.ah - R - 1;
    // Le masque de la bande, qui surveille depuis le haut.
    const mw = R * 2.6;
    const mx = z.ax + z.aw / 2;
    const my = Math.max(z.ay + mw * 0.2, cy - R * 2.1) + Math.sin(t * 1.5) * 1;
    c.fillStyle = '#f5c451';
    c.beginPath();
    c.ellipse(mx - mw * 0.25, my, mw * 0.28, mw * 0.2, 0.15, 0, 7);
    c.ellipse(mx + mw * 0.25, my, mw * 0.28, mw * 0.2, -0.15, 0, 7);
    c.fill();
    c.fillStyle = '#0a0e16';
    c.beginPath();
    c.ellipse(mx - mw * 0.25, my, mw * 0.12, mw * 0.08, 0, 0, 7);
    c.ellipse(mx + mw * 0.25, my, mw * 0.12, mw * 0.08, 0, 0, 7);
    c.fill();
    // Les quatre jetons rouges, qui tournent comme des pièces.
    for (let i = 0; i < 4; i++) {
      const x = z.ax + z.aw / 2 + (i - 1.5) * R * 2.15;
      // Chaque jeton saute et fait un tour à son tour, puis reste bien de face pour montrer ses étoiles.
      const phase = (t * 0.42 + (3 - i) * 0.13) % 1;
      const tour = phase < 0.3 ? phase / 0.3 : 1;
      const y = cy - Math.sin(tour * Math.PI) * R * 0.5;
      const sx = Math.cos(tour * Math.PI * 2);
      c.save();
      c.translate(x, y);
      c.scale(Math.max(0.08, Math.abs(sx)), 1);
      c.fillStyle = '#7d121c';
      c.beginPath();
      c.arc(0, 0, R + 1, 0, 7);
      c.fill();
      c.fillStyle = '#ef3b40';
      c.beginPath();
      c.arc(0, 0, R, 0, 7);
      c.fill();
      c.strokeStyle = '#fff';
      c.lineWidth = 1;
      c.setLineDash([2, 2]);
      c.beginPath();
      c.arc(0, 0, R * 0.78, 0, 7);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#fff';
      const places = [[[0, 0]], [[-0.28, 0], [0.28, 0]], [[0, -0.26], [-0.27, 0.2], [0.27, 0.2]], [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]][i];
      places.forEach(([a, b]) => etoile(c, a * R, b * R, R * (i === 0 ? 0.42 : 0.24)));
      c.restore();
    }
    nom(c, ['THE', 'GANG'], ['#f5c451', '#f5c451'], z);
    bandeau(c, "LE POKER OU L'ON GAGNE ENSEMBLE, SANS SE PARLER.     ", G.sur - 10, 1, '#f5c451', 28, t);
  },

  perudo(c, t) {
    c.fillStyle = '#0b0710';
    c.fillRect(0, 0, G.w, G.h);
    const z = zones(['PERUDO']);
    const cx = z.ax + z.aw / 2;
    const bas = z.ay + z.ah - 1;
    // Le soleil de l'affiche chicha, derrière le gobelet.
    for (let i = 0; i < 16; i++) {
      const a = t * 0.1 + (i * Math.PI) / 8;
      c.fillStyle = i % 2 ? '#5a1070' : '#1c0a2e';
      c.beginPath();
      c.moveTo(cx, bas - z.ah * 0.4);
      c.arc(cx, bas - z.ah * 0.4, Math.max(G.w, G.sur), a, a + Math.PI / 8);
      c.fill();
    }
    // Le gobelet s'agite, se lève, et trois dés apparaissent : ils changent à chaque lancer.
    const cycle = 3.8;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const leve = p < 0.34 ? 0 : p < 0.46 ? (p - 0.34) / 0.12 : p < 0.88 ? 1 : 1 - (p - 0.88) / 0.12;
    const d = Math.max(5, Math.min(z.aw * 0.24, z.ah * 0.27));
    const pointes = (f) => ({ 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] })[f];
    [-1, 0, 1].forEach((k, i) => {
      const f = 1 + ((n * 7 + i * 5 + (n * i) % 4) % 6);
      const x = Math.round(cx + k * d * 1.14 - d / 2);
      const y = Math.round(bas - d);
      c.fillStyle = ['#ffe600', '#12e6ff', '#19f26b'][i];
      c.fillRect(x, y, d, d);
      c.fillStyle = '#0b0710';
      const r = Math.max(1, Math.round(d * 0.17));
      if (f === 1) {
        // Le Paco : un soleil.
        c.beginPath();
        c.arc(x + d / 2, y + d / 2, d * 0.2, 0, 7);
        c.fill();
        for (let a = 0; a < 8; a++) {
          const b = (a * Math.PI) / 4 + t;
          c.fillRect(Math.round(x + d / 2 + Math.cos(b) * d * 0.33) - 0.5, Math.round(y + d / 2 + Math.sin(b) * d * 0.33) - 0.5, 1, 1);
        }
      } else {
        for (const [a, b] of pointes(f)) c.fillRect(Math.round(x + d / 2 + a * d * 0.27 - r / 2), Math.round(y + d / 2 + b * d * 0.27 - r / 2), r, r);
      }
    });
    const lg = d * 3.7;
    const h = d * 2.3;
    const secoue = p < 0.34 ? Math.sin(t * 34) * 0.1 : 0;
    c.save();
    // Levé, le gobelet s'arrête juste au-dessus des dés : il reste entier à l'écran.
    c.translate(cx + secoue * d * 1.5, bas - leve * d * 1.2 - (p < 0.34 ? Math.abs(Math.sin(t * 17)) * d * 0.12 : 0));
    c.rotate(secoue);
    c.fillStyle = '#ff2d95';
    c.beginPath();
    c.moveTo(-lg / 2, 0);
    c.lineTo(lg / 2, 0);
    c.lineTo(lg * 0.36, -h);
    c.lineTo(-lg * 0.36, -h);
    c.fill();
    c.strokeStyle = '#0b0710';
    c.stroke();
    c.fillStyle = '#ffe600';
    c.fillRect(-lg * 0.43, -h * 0.62, lg * 0.86, Math.max(2, h * 0.2));
    c.fillStyle = '#0b0710';
    const pas = Math.max(3, Math.round(lg / 9));
    for (let x = -lg * 0.4; x < lg * 0.4; x += pas) c.fillRect(Math.round(x), Math.round(-h * 0.55), Math.ceil(pas / 2), Math.max(1, Math.round(h * 0.07)));
    c.restore();
    nom(c, ['PERUDO'], ['#ffe600'], z);
  },

  liar(c, t) {
    c.fillStyle = '#e9e1cf';
    c.fillRect(0, 0, G.w, G.h);
    const z = zones(['LIAR', 'GAME']);
    // Une foule de masques : à chaque vote la majorité s'efface, jusqu'au dernier, qui vire au rouge.
    const col = 9;
    const lig = 3;
    const pas = Math.min(z.aw / col, z.ah / lig);
    const r = Math.max(2, pas * 0.36);
    const ox = z.ax + (z.aw - pas * col) / 2 + pas / 2;
    const oy = z.ay + (z.ah - pas * lig) / 2 + pas / 2;
    const rang = (i) => (i * 17 + 5) % (col * lig);
    const restants = [27, 11, 4, 1][Math.floor(t / 1.1) % 4];
    for (let i = 0; i < col * lig; i++) {
      const vivant = rang(i) < restants;
      const dernier = vivant && restants === 1;
      const x = ox + (i % col) * pas;
      const y = oy + Math.floor(i / col) * pas;
      const q = dernier ? r * 1.5 : r;
      c.fillStyle = dernier ? '#c9231a' : vivant ? '#14110f' : '#d6cdb9';
      c.beginPath();
      c.ellipse(x, y, q * 0.82, q, 0, 0, 7);
      c.fill();
      if (vivant) {
        c.fillStyle = '#e9e1cf';
        const o = Math.max(1, Math.round(q * 0.24));
        c.fillRect(Math.round(x - q * 0.38 - o / 2), Math.round(y - q * 0.25), o, o);
        c.fillRect(Math.round(x + q * 0.38 - o / 2), Math.round(y - q * 0.25), o, o);
      }
    }
    nom(c, ['LIAR', 'GAME'], ['#14110f', '#c9231a'], z);
    bandeau(c, 'VOTE EN SECRET. SEULS LES MOINS NOMBREUX SURVIVENT.     ', G.sur - 10, 1, '#f2ead8', 28, t);
  },

  bw(c, t) {
    const z = zones(['BLACK', 'WHITE']);
    const cycle = 2.8;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    // Une tuile est plus haute que l'autre : on ne sait jamais de combien. La ligne passe chez le perdant.
    const gagneGauche = (n * 7 + 3) % 5 < 3;
    const fini = p < 0.5 ? 0 : Math.min(1, (p - 0.5) / 0.12);
    const retour = p > 0.9 ? (p - 0.9) / 0.1 : 0;
    const cx = z.ax + z.aw / 2;
    const ligne = Math.round(cx + (gagneGauche ? 1 : -1) * z.aw * 0.1 * fini * (1 - retour));
    c.fillStyle = '#000';
    c.fillRect(0, 0, ligne, G.h);
    c.fillStyle = '#fff';
    c.fillRect(ligne, 0, G.w - ligne, G.h);
    // Les deux tuiles arrivent face cachée de chaque côté de la ligne.
    const th = Math.min(z.ah * 0.82, z.aw * 0.42);
    const tw = Math.round(th * 0.84);
    const cy = z.ay + z.ah / 2;
    const arrive = Math.min(1, p / 0.22);
    const glisse = (1 - arrive) ** 2 * z.aw * 0.5;
    [[-1, '#fff', '#000', gagneGauche], [1, '#000', '#fff', !gagneGauche]].forEach(([cote, fond, trame, gagne]) => {
      const q = 1 + (gagne ? 0.16 : -0.3) * fini * (1 - retour);
      const w = Math.round(tw * q);
      const h = Math.round(th * q);
      const x = Math.round(ligne + cote * (tw * 0.62 + glisse) - w / 2);
      const y = Math.round(cy - h / 2);
      c.fillStyle = trame;
      c.fillRect(x - 1, y - 1, w + 2, h + 2);
      c.fillStyle = fond;
      c.fillRect(x, y, w, h);
      c.fillStyle = trame;
      for (let k = 3; k < w + h; k += 5) {
        for (let i = 0; i <= k; i++) {
          const a = x + i;
          const b = y + k - i;
          if (a < x + w && b < y + h) c.fillRect(a, b, 1, 1);
        }
      }
    });
    nom(c, ['BLACK', 'WHITE'], ['#fff', '#fff'], z);
    bandeau(c, 'NEUF TUILES. SEULE LA COULEUR SE VOIT.     ', G.sur - 10, 1, '#fff', 28, t);
  },

  skull(c, t) {
    c.fillStyle = '#06040a';
    c.fillRect(0, 0, G.w, G.h);
    const z = zones(['SKULL']);
    const cx = z.ax + z.aw / 2;
    const cy = z.ay + z.ah / 2;
    const R = Math.min(z.aw, z.ah) * 0.48;
    // Les rais de lumière que la rosace projette dans la nef.
    for (let i = 0; i < 16; i++) {
      const a = t * 0.12 + (i * Math.PI) / 8;
      c.fillStyle = i % 2 ? 'rgba(47,123,240,.26)' : 'rgba(229,52,75,.3)';
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, Math.max(G.w, G.sur), a, a + 0.11);
      c.fill();
    }
    // La rosace se retourne : une fleur d'un côté, un crâne de l'autre.
    const tour = (t * 0.24) % 2;
    const avance = tour % 1;
    const angle = (Math.floor(tour) + (avance < 0.8 ? 0 : (avance - 0.8) / 0.2)) * Math.PI;
    const sx = Math.cos(angle);
    const crane = sx < 0;
    c.save();
    c.translate(cx, cy);
    c.scale(Math.max(0.06, Math.abs(sx)) * (R / 100), R / 100);
    c.fillStyle = '#0c0a12';
    c.beginPath();
    c.arc(0, 0, 100, 0, 7);
    c.fill();
    const interieur = crane ? 72 : 60;
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8 - Math.PI / 2;
      c.fillStyle = crane ? (i % 2 ? '#4a1fa8' : '#c4142c') : i % 2 ? '#2f7bf0' : '#e5344b';
      c.beginPath();
      c.arc(0, 0, 95, a - 0.15, a + 0.15);
      c.arc(0, 0, interieur + 3, a + 0.15, a - 0.15, true);
      c.fill();
    }
    if (crane) {
      c.translate(0, 8);
      c.scale(0.95, 0.95);
      c.fillStyle = '#f3e7cc';
      c.fill(CRANE);
      c.fillStyle = `rgb(${Math.round(190 + Math.sin(t * 4) * 60)},20,36)`;
      c.fill(ORBITES);
      c.fillStyle = '#0c0a12';
      c.fill(NEZ);
      for (const x of [-22, -7.5, 7.5, 22]) c.fillRect(x - 1.8, 32, 3.6, 18);
      c.fillRect(-34, 30, 68, 3.6);
    } else {
      for (let i = 0; i < 8; i++) {
        c.save();
        c.rotate((i * Math.PI) / 4);
        c.fillStyle = '#ff86b6';
        c.beginPath();
        c.ellipse(0, -35, 11, 21, 0, 0, 7);
        c.fill();
        c.restore();
      }
      c.fillStyle = '#f2bb4a';
      c.beginPath();
      c.arc(0, 0, 17, 0, 7);
      c.fill();
      c.fillStyle = '#c4142c';
      c.beginPath();
      c.arc(0, 0, 8, 0, 7);
      c.fill();
    }
    c.restore();
    nom(c, ['SKULL'], ['#efe6d2'], z);
    bandeau(c, 'TROIS FLEURS, UN CRANE. TU EN RETOURNES COMBIEN ?     ', G.sur - 10, 1, '#c792ff', 28, t);
  },

  coup(c, t) {
    c.fillStyle = '#0d1630';
    c.fillRect(0, 0, G.w, G.h);
    // Le velours damassé de la cour, et des ducats qui tombent.
    c.fillStyle = 'rgba(217,178,95,.2)';
    for (let y = 2; y < G.sur; y += 6) for (let x = (y % 12 ? 3 : 0); x < G.w; x += 6) c.fillRect(x, y, 1, 1);
    for (let i = 0; i < 16; i++) {
      const e = i % 3 ? 1 : 2;
      c.fillStyle = i % 2 ? '#d9b25f' : '#f0d48a';
      c.fillRect(Math.round((((i * 37) % 100) / 100) * G.w), Math.round(((t * (5 + (i % 5) * 2) + i * 53) % (G.sur + 10)) - 5), e, e);
    }
    const z = zones(['COUP']);
    const cx = z.ax + z.aw / 2;
    const cy = z.ay + z.ah / 2;
    const h = Math.min(z.ah * 0.84, z.aw * 0.62);
    const w = h * 0.7;
    // Deux lettres scellées. On en conteste une : elle se retourne sur une couronne, ou sur le bluff.
    const cycle = 3.6;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const echelle = p < 0.3 ? 1 : p < 0.4 ? 1 - (p - 0.3) / 0.1 : p < 0.5 ? (p - 0.4) / 0.1 : p < 0.85 ? 1 : p < 0.92 ? 1 - (p - 0.85) / 0.07 : (p - 0.92) / 0.08;
    const montree = p >= 0.4 && p < 0.92;
    const vrai = (n * 5 + 1) % 3 !== 0;
    const lettre = (x, q, face) => {
      const l = Math.max(1, Math.round(w * q));
      const x0 = Math.round(x - l / 2);
      const y0 = Math.round(cy - h / 2);
      c.fillStyle = '#d9b25f';
      c.fillRect(x0 - 1, y0 - 1, l + 2, Math.round(h) + 2);
      c.fillStyle = face === 'bluff' ? '#7e1d12' : '#f3e8cc';
      c.fillRect(x0, y0, l, Math.round(h));
      if (face === 'dos') {
        c.fillStyle = '#b8321f';
        c.beginPath();
        c.ellipse(x, cy, Math.max(1, l * 0.3), w * 0.3, 0, 0, 7);
        c.fill();
        c.fillStyle = '#7e1d12';
        c.beginPath();
        c.ellipse(x, cy, Math.max(0.5, l * 0.15), w * 0.15, 0, 0, 7);
        c.fill();
      } else if (face === 'vrai') {
        const a = l * 0.32;
        const b = h * 0.16;
        c.fillStyle = '#9c7631';
        c.beginPath();
        c.moveTo(x - a, cy + b);
        c.lineTo(x + a, cy + b);
        c.lineTo(x + a, cy - b);
        c.lineTo(x + a / 2, cy - b * 0.1);
        c.lineTo(x, cy - b * 1.3);
        c.lineTo(x - a / 2, cy - b * 0.1);
        c.lineTo(x - a, cy - b);
        c.fill();
      } else {
        c.strokeStyle = '#f3e8cc';
        c.lineWidth = Math.max(1, l * 0.09);
        c.beginPath();
        c.moveTo(x - l * 0.26, cy - l * 0.26);
        c.lineTo(x + l * 0.26, cy + l * 0.26);
        c.moveTo(x + l * 0.26, cy - l * 0.26);
        c.lineTo(x - l * 0.26, cy + l * 0.26);
        c.stroke();
      }
    };
    [-1, 1].forEach((k, i) => {
      const visee = i === n % 2;
      lettre(cx + k * w * 0.62, visee ? echelle : 1, visee && montree ? (vrai ? 'vrai' : 'bluff') : 'dos');
    });
    nom(c, ['COUP'], ['#f0d48a'], z);
    bandeau(c, 'DEUX LETTRES SCELLEES, ET UNE COUR DE MENTEURS.     ', G.sur - 10, 1, '#d9b25f', 28, t);
  },

  cockroach(c, t) {
    c.fillStyle = '#0f1a16';
    c.fillRect(0, 0, G.w, G.h);
    const z = zones(['COCKROACH', 'POKER']);
    const cx = z.ax + z.aw / 2;
    const cy = z.ay + z.ah / 2;
    // Un cafard qui trottine : six pattes qui alternent, deux antennes.
    const cafard = (x, y, s, a, pas) => {
      c.save();
      c.translate(x, y);
      c.rotate(a);
      c.strokeStyle = '#3d2412';
      c.lineWidth = Math.max(1, s * 0.12);
      for (const k of [-1, 0, 1]) {
        const b = Math.sin(pas + k * 2.1) * s * 0.35;
        c.beginPath();
        c.moveTo(k * s * 0.45, 0);
        c.lineTo(k * s * 0.45 + b, -s * 0.9);
        c.moveTo(k * s * 0.45, 0);
        c.lineTo(k * s * 0.45 - b, s * 0.9);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(s * 1.1, -s * 0.15);
      c.lineTo(s * 2, -s * 0.8);
      c.moveTo(s * 1.1, s * 0.15);
      c.lineTo(s * 2, s * 0.8);
      c.stroke();
      c.fillStyle = '#8a4b22';
      c.beginPath();
      c.ellipse(0, 0, s * 1.05, s * 0.55, 0, 0, 7);
      c.fill();
      c.fillStyle = '#4a2a12';
      c.beginPath();
      c.ellipse(s * 1.05, 0, s * 0.3, s * 0.32, 0, 0, 7);
      c.fill();
      c.fillRect(-s * 0.9, -0.5, s * 1.8, 1);
      c.restore();
    };
    // Une planche face cachée : on annonce, elle se retourne, et ce n'était pas toujours un cafard.
    const cycle = 3.4;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const echelle = p < 0.35 ? 1 : p < 0.45 ? 1 - (p - 0.35) / 0.1 : p < 0.55 ? (p - 0.45) / 0.1 : p < 0.88 ? 1 : p < 0.94 ? 1 - (p - 0.88) / 0.06 : (p - 0.94) / 0.06;
    const face = p >= 0.45 && p < 0.94;
    const h = Math.min(z.ah * 0.84, z.aw * 0.55);
    const w = h * 0.7;
    const l = Math.max(1, Math.round(w * echelle));
    const x0 = Math.round(cx - l / 2);
    const y0 = Math.round(cy - h / 2);
    c.fillStyle = '#c9a24a';
    c.fillRect(x0 - 1, y0 - 1, l + 2, Math.round(h) + 2);
    c.fillStyle = face ? '#f1e6cc' : '#1d4a3a';
    c.fillRect(x0, y0, l, Math.round(h));
    if (!face) {
      c.fillStyle = '#c9a24a';
      c.beginPath();
      c.ellipse(cx, cy, Math.max(1, l * 0.3), w * 0.18, 0, 0, 7);
      c.fill();
      c.fillStyle = '#1d4a3a';
      c.beginPath();
      c.arc(cx, cy, Math.max(1, Math.min(l, w) * 0.1), 0, 7);
      c.fill();
    } else if (n % 3 !== 1) {
      cafard(cx, cy + h * 0.06, Math.max(2, Math.min(l, w) * 0.22), -Math.PI / 2, t * 4);
    } else {
      // Pas un cafard : un rat, tout en rondeurs.
      const s = Math.max(2, Math.min(l, w) * 0.2);
      c.fillStyle = '#6d6a72';
      c.beginPath();
      c.ellipse(cx, cy + s * 0.2, s * 0.9, s * 1.2, 0, 0, 7);
      c.fill();
      c.beginPath();
      c.arc(cx, cy - s * 1.1, s * 0.6, 0, 7);
      c.fill();
      c.fillStyle = '#e7a9a3';
      c.fillRect(Math.round(cx - s * 0.75), Math.round(cy - s * 1.75), Math.max(1, Math.round(s * 0.4)), Math.max(1, Math.round(s * 0.4)));
      c.fillRect(Math.round(cx + s * 0.35), Math.round(cy - s * 1.75), Math.max(1, Math.round(s * 0.4)), Math.max(1, Math.round(s * 0.4)));
      c.strokeStyle = '#e7a9a3';
      c.beginPath();
      c.moveTo(cx, cy + s * 1.3);
      c.quadraticCurveTo(cx + s * 1.4, cy + s * 1.6, cx + s * 1.2, cy + s * 2.2);
      c.stroke();
    }
    // Et ses cousins qui font le tour de la vitrine.
    const tour = 2 * (z.aw + z.ah);
    for (let i = 0; i < 3; i++) {
      let d = (t * 14 + (i * tour) / 3) % tour;
      let x, y, a;
      if (d < z.aw) [x, y, a] = [z.ax + d, z.ay + 2, 0];
      else if ((d -= z.aw) < z.ah) [x, y, a] = [z.ax + z.aw - 2, z.ay + d, Math.PI / 2];
      else if ((d -= z.ah) < z.aw) [x, y, a] = [z.ax + z.aw - d, z.ay + z.ah - 2, Math.PI];
      else [x, y, a] = [z.ax + 2, z.ay + z.ah - (d - z.aw), -Math.PI / 2];
      cafard(x, y, Math.max(2, Math.round(z.ah * 0.03)), a, t * 16 + i);
    }
    nom(c, ['COCKROACH', 'POKER'], ['#efe6d0', '#c9a24a'], z);
    bandeau(c, "C'EST UN CAFARD. OU PAS.     ", G.sur - 10, 1, '#c9a24a', 28, t);
  },

  hanabi(c, t) {
    const ciel = c.createLinearGradient(0, 0, 0, G.sur);
    ciel.addColorStop(0, '#060b24');
    ciel.addColorStop(1, '#16235a');
    c.fillStyle = ciel;
    c.fillRect(0, 0, G.w, G.h);
    const z = zones(['HANABI']);
    // Le fleuve, en bas de la zone : chaque gerbe s'y reflète, en plus pâle.
    const fleuve = Math.round(z.ay + z.ah * 0.82);
    c.fillStyle = '#0a1438';
    c.fillRect(z.ax, fleuve, z.aw, z.ay + z.ah - fleuve);
    const COULEURS = ['#ff5b4d', '#ffd23a', '#4fd68a', '#5aa8ff', '#f4f2ec'];
    c.globalCompositeOperation = 'lighter';
    const R = Math.min(z.aw * 0.26, (fleuve - z.ay) * 0.46);
    const gros = R > 14 ? 2 : 1;
    for (let i = 0; i < 4; i++) {
      const cycle = 2.4 + (i % 2) * 0.5;
      const decale = t + i * 0.71;
      const n = Math.floor(decale / cycle);
      const p = (decale % cycle) / cycle;
      const x = z.ax + z.aw * (0.18 + 0.21 * i) + Math.sin(n * 3.1 + i) * z.aw * 0.05;
      const y = z.ay + R + (fleuve - z.ay - 2 * R) * (0.5 + 0.5 * Math.sin(n * 1.7 + i * 2));
      const couleur = COULEURS[(n * 3 + i) % 5];
      c.fillStyle = couleur;
      if (p < 0.22) {
        // La fusée monte depuis le fleuve.
        const q = p / 0.22;
        c.fillRect(Math.round(x), Math.round(fleuve - (fleuve - y) * q), gros, gros * 2);
        continue;
      }
      const q = (p - 0.22) / 0.78;
      // L'éclat du départ, puis les rais qui s'ouvrent, retombent et s'éteignent.
      if (q < 0.12) {
        c.fillStyle = '#fff6dc';
        c.fillRect(Math.round(x - gros), Math.round(y - gros), gros * 3, gros * 3);
        c.fillStyle = couleur;
      }
      const r = R * (1 - (1 - q) ** 3);
      const chute = q * q * R * 0.35;
      const rais = 18;
      for (let k = 0; k < rais; k++) {
        const a = (k / rais) * Math.PI * 2 + n;
        for (let j = 0; j < 4; j++) {
          const f = 1 - j * 0.14;
          c.globalAlpha = Math.max(0, (1 - q * q) * (1 - j * 0.24));
          const px = x + Math.cos(a) * r * f;
          const py = y + Math.sin(a) * r * f + chute * f;
          const e = j === 0 ? gros : 1;
          c.fillRect(Math.round(px), Math.round(py), e, e);
          if (j === 0 && py < fleuve) {
            c.globalAlpha = Math.max(0, 0.4 - q * 0.4);
            c.fillRect(Math.round(px), Math.round(2 * fleuve - py), 1, 1);
          }
        }
      }
      c.globalAlpha = 1;
    }
    c.globalCompositeOperation = 'source-over';
    nom(c, ['HANABI'], ['#f4f2ec'], z);
    bandeau(c, 'TU VOIS LES CARTES DE TOUS, SAUF LES TIENNES.     ', G.sur - 10, 1, '#ff6a52', 28, t);
  },

  wavelength(c, t) {
    const fond = c.createLinearGradient(0, 0, 0, G.sur);
    fond.addColorStop(0, '#120f2a');
    fond.addColorStop(1, '#2b1d55');
    c.fillStyle = fond;
    c.fillRect(0, 0, G.w, G.h);
    const z = zones(['WAVELENGTH']);
    const R = Math.max(8, Math.floor(Math.min(z.aw / 2 - 3, z.ah - 5)));
    const cx = Math.round(z.ax + z.aw / 2);
    const cy = Math.round(z.ay + (z.ah + R) / 2);
    const angle = (v) => Math.PI * (1 + v / 100);
    // Les ondes qui partent du cadran, comme une radio qu'on cherche à régler.
    c.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      const r = R * 0.9 + ((t * 10 + k * R * 0.5) % (R * 2.5));
      const a = Math.max(0, Math.min(1, 1 - (r - R) / (R * 1.6)));
      c.strokeStyle = k % 2 ? `rgba(255,79,123,${0.5 * a})` : `rgba(90,130,255,${0.5 * a})`;
      c.beginPath();
      c.arc(cx, cy, r, Math.PI, 2 * Math.PI);
      c.stroke();
    }
    // Une manche par cycle : l'aiguille cherche, se pose, puis le volet pivote et dévoile la cible.
    const P = 4.6;
    const n = Math.floor(t / P);
    const p = (t % P) / P;
    const hasard = (k) => {
      const s = Math.sin(n * 91.7 + k * 12.3) * 43758.5;
      return s - Math.floor(s);
    };
    const cible = 18 + hasard(1) * 64;
    const pose = cible + [0, 4, -5, 8][Math.floor(hasard(2) * 4)];
    const cherche = p < 0.5 ? 1 - p / 0.5 : 0;
    const aiguille = Math.max(3, Math.min(97, pose + 38 * cherche * cherche * Math.sin(p * 26 + n)));
    const ouvre = p < 0.56 ? 0 : p < 0.7 ? (p - 0.56) / 0.14 : p < 0.92 ? 1 : 1 + (p - 0.92) / 0.08;

    c.fillStyle = '#f3ecdf';
    c.beginPath();
    c.moveTo(cx, cy);
    c.arc(cx, cy, R, Math.PI, 2 * Math.PI);
    c.fill();
    for (const [a, b, k] of [[-10, -6, '#ffcb3d'], [-6, -2, '#ff8a2b'], [-2, 2, '#ff4f7b'], [2, 6, '#ff8a2b'], [6, 10, '#ffcb3d']]) {
      c.fillStyle = k;
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, R - 1, angle(Math.max(0, cible + a)), angle(Math.min(100, cible + b)));
      c.fill();
    }
    // Le volet en deux couleurs tourne autour du moyeu et disparaît sous le socle.
    c.save();
    c.beginPath();
    c.rect(cx - R - 1, cy - R - 1, 2 * R + 2, R + 1);
    c.clip();
    c.translate(cx, cy);
    c.rotate(ouvre * Math.PI);
    c.fillStyle = '#2f5bd3';
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, R, Math.PI, 1.5 * Math.PI);
    c.fill();
    c.fillStyle = '#ff4f7b';
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, R, 1.5 * Math.PI, 2 * Math.PI);
    c.fill();
    c.restore();
    c.fillStyle = '#2f5bd3';
    c.fillRect(cx - R - 2, cy + 1, Math.round(R * 0.4), 2);
    c.fillStyle = '#ff4f7b';
    c.fillRect(cx + R + 2 - Math.round(R * 0.4), cy + 1, Math.round(R * 0.4), 2);

    const an = angle(aiguille);
    const bout = [cx + Math.cos(an) * R * 0.9, cy + Math.sin(an) * R * 0.9];
    const epais = Math.max(1, Math.round(R / 24));
    c.lineCap = 'round';
    c.strokeStyle = '#120f2a';
    c.lineWidth = epais + 2;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(...bout);
    c.stroke();
    c.strokeStyle = '#fffdf6';
    c.lineWidth = epais;
    c.stroke();
    c.lineCap = 'butt';
    c.fillStyle = '#ff4f7b';
    c.beginPath();
    c.arc(bout[0], bout[1], Math.max(1.2, R * 0.05), 0, 7);
    c.fill();
    c.fillStyle = '#120f2a';
    c.beginPath();
    c.arc(cx, cy, Math.max(2, R * 0.12), 0, 7);
    c.fill();
    c.fillStyle = '#ffcb3d';
    c.beginPath();
    c.arc(cx, cy, Math.max(1, R * 0.05), 0, 7);
    c.fill();

    // Dévoilé : les points s'affichent au-dessus du moyeu.
    if (ouvre >= 1 && p < 0.92) {
      const d = Math.abs(pose - cible);
      const points = d <= 2 ? 4 : d <= 6 ? 3 : 2;
      const e = Math.max(1, Math.round(R / 16));
      const s = `+${points}`;
      detoure(c, s, Math.round(cx - largeur(s, e) / 2), Math.round(cy - R * 0.55 - 3.5 * e), e, points === 4 ? '#ff4f7b' : points === 3 ? '#ff8a2b' : '#ffcb3d');
    }
    nom(c, ['WAVELENGTH'], ['#ff8a2b'], z);
    bandeau(c, 'UN INDICE, UN CADRAN, ET TOUTE LA TABLE QUI DEBAT.     ', G.sur - 10, 1, '#ffcb3d', 28, t);
  },

  undercover(c, t) {
    c.fillStyle = '#0b1009';
    c.fillRect(0, 0, G.w, G.h);
    // La façade d'un immeuble de bureaux, la nuit : des fenêtres s'allument, quelqu'un guette.
    const pas = G.paysage ? 7 : 6;
    for (let y = 1; y < G.sur - 10; y += pas)
      for (let x = 1; x < G.w; x += pas) {
        const k = x * 7.13 + y * 3.71;
        const s = Math.sin(k * 1.3 + Math.floor(t / 2.2 + (Math.sin(k) + 1) * 3) * 2.1);
        c.fillStyle = s > 0.82 ? '#5d8a2c' : s > 0.3 ? '#1d2914' : '#141c0e';
        c.fillRect(x, y, pas - 3, pas - 2);
      }
    const z = zones(['UNDERCOVER']);
    // Une fiche « ton mot » caviardée : la barre glisse, on lit le mot des civils, puis il se brouille en celui de l'undercover.
    const PAIRES = [['FONDUE', 'RACLETTE'], ['PLAGE', 'PISCINE'], ['TRAIN', 'METRO'], ['CHAT', 'TIGRE'], ['CAFE', 'THE'], ['SKI', 'LUGE'], ['PIZZA', 'QUICHE']];
    const cycle = 4.4;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const [civil, intrus] = PAIRES[n % PAIRES.length];
    const cw = Math.round(Math.min(z.aw * 0.88, z.ah * 2.6));
    const ch = Math.round(Math.min(z.ah * 0.72, cw * 0.5));
    const x0 = Math.round(z.ax + (z.aw - cw) / 2);
    const y0 = Math.round(z.ay + (z.ah - ch) / 2);
    c.fillStyle = '#000';
    c.fillRect(x0 + 2, y0 + 2, cw, ch);
    c.fillStyle = '#f5f0df';
    c.fillRect(x0, y0, cw, ch);
    const etiquette = cw > 50 ? 9 : 2;
    if (etiquette > 2) {
      c.fillStyle = '#7b7866';
      texte(c, 'TON MOT', x0 + 3, y0 + 2, 1);
    }
    // Le masque, au coin de la fiche : il rougit quand le mot change.
    const ms = cw > 120 ? 2 : 1;
    c.fillStyle = p > 0.5 && p < 0.82 ? '#e5432a' : '#12150f';
    enseigne(c, [0, 62, 127, 73, 127, 54, 0], x0 + cw - 9 * ms, y0 + 1, ms);
    const mot = p < 0.52 ? civil : intrus;
    const e = Math.max(1, Math.min(Math.floor((cw - 8) / (Math.max(civil.length, intrus.length) * 6)), Math.floor((ch - etiquette - 4) / 9)));
    const wy = Math.round(y0 + etiquette + (ch - etiquette - 7 * e) / 2);
    const wx = Math.round(x0 + (cw - largeur(mot, e)) / 2);
    c.fillStyle = p < 0.52 ? '#12150f' : '#e5432a';
    texte(c, mot, wx, wy, e);
    // Le brouillage entre les deux mots.
    if (p > 0.46 && p < 0.58) {
      for (let i = 0; i < 40; i++) {
        const h = Math.sin(i * 12.9898 + Math.floor(t * 18) * 78.233) * 43758.5;
        const r = h - Math.floor(h);
        c.fillStyle = i % 3 ? '#12150f' : i % 2 ? '#e5432a' : '#86c440';
        c.fillRect(Math.round(x0 + 3 + r * (cw - 6 - e)), Math.round(wy - e + ((r * 97) % 1) * 8 * e), e, e);
      }
    }
    // La barre noire : elle cache tout, s'ouvre vers la droite, puis revient.
    const ouvert = p < 0.1 ? 0 : p < 0.2 ? (p - 0.1) / 0.1 : p < 0.84 ? 1 : p < 0.94 ? 1 - (p - 0.84) / 0.1 : 0;
    const bx = x0 + 3;
    const bw = cw - 6;
    const cache = Math.round(bw * (1 - ouvert));
    c.fillStyle = '#12150f';
    if (p < 0.5) c.fillRect(bx + bw - cache, wy - e - 1, cache, 9 * e + 2);
    else c.fillRect(bx, wy - e - 1, cache, 9 * e + 2);
    // Le nom, comme le logo du jeu : « COVER » caviardé, découpé dans un bandeau vert.
    const nx = Math.round(z.tx - largeur('UNDERCOVER', z.e) / 2);
    const ny = Math.round(z.ty - 3.5 * z.e);
    const debut = nx + 5 * 6 * z.e;
    detoure(c, 'UNDER', nx, ny, z.e, '#86c440');
    c.fillStyle = '#86c440';
    c.fillRect(debut - 2 * z.e, ny - z.e, largeur('COVER', z.e) + 3 * z.e, 9 * z.e);
    c.fillStyle = '#0b1009';
    texte(c, 'COVER', debut, ny, z.e);
    bandeau(c, 'TOUT LE MONDE A LE MEME MOT. SAUF UN.     ', G.sur - 10, 1, '#86c440', 28, t);
  },

  inspecteur(c, t) {
    const z = zones(['INSPECTEUR']);
    // Le sous-main vert, sous la lampe du bureau.
    const lx = z.ax + z.aw / 2;
    const ly = z.ay + z.ah / 2;
    const lampe = c.createRadialGradient(lx, ly, 2, lx, ly, Math.max(z.aw, z.ah) * 0.75);
    lampe.addColorStop(0, '#2f6145');
    lampe.addColorStop(1, '#0a1711');
    c.fillStyle = lampe;
    c.fillRect(0, 0, G.w, G.h);
    // Le dossier ouvert : une photo, des lignes tapées à la machine, une ligne caviardée.
    const cycle = 5.2;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const dh = Math.round(z.ah * 0.9);
    const dw = Math.round(Math.min(z.aw * 0.92, dh * 1.5));
    const x0 = Math.round(z.ax + (z.aw - dw) / 2);
    const y0 = Math.round(z.ay + (z.ah - dh) / 2);
    const m = Math.max(1, Math.round(dw / 36));
    c.fillStyle = '#000';
    c.fillRect(x0 + 2, y0 + 2, dw, dh);
    c.fillStyle = '#b48a50';
    c.fillRect(x0, y0, dw, dh);
    c.fillRect(x0 + 2, y0 - 2, Math.round(dw * 0.35), 2);
    const px = x0 + m;
    const py = y0 + m;
    const pw = dw - 2 * m;
    const ph = dh - 2 * m;
    const photoW = Math.round(Math.min(pw * 0.34, ph * 0.62));
    const photoH = Math.round(photoW * 1.2);
    const pas = ph > 40 ? 4 : 3;
    const lignes = (fond, encre, epais, cachee) => {
      c.fillStyle = fond;
      c.fillRect(px, py, pw, ph);
      let i = 0;
      for (let y = py + 2; y < py + ph - 1; y += pas, i++) {
        const sous = y < py + 2 + photoH;
        const x = sous ? px + photoW + 3 : px + 2;
        const fin = Math.round((px + pw - 2 - x) * (0.62 + 0.38 * Math.abs(Math.sin(i * 2.7 + n * 1.3))));
        c.fillStyle = cachee && i === 3 + (n % 2) ? '#120f0a' : encre;
        c.fillRect(x, y, fin, cachee && i === 3 + (n % 2) ? 2 : epais);
      }
    };
    lignes('#d9cfb3', '#4f4636', 1, true);
    // Le suspect de la photo : son chapeau change d'un dossier à l'autre, jamais son visage, qu'on ne voit pas.
    const fx = px + 2;
    const fy = py + 2;
    c.fillStyle = '#5a5140';
    c.fillRect(fx, fy, photoW - 2, photoH - 2);
    const tx = fx + (photoW - 2) / 2;
    const tr = Math.max(1.5, photoW * 0.17);
    const ty = fy + photoH * 0.4;
    c.fillStyle = '#17130d';
    c.beginPath();
    c.arc(tx, ty, tr, 0, 7);
    c.fill();
    c.beginPath();
    c.arc(tx, fy + photoH - 2, tr * 1.9, Math.PI, 2 * Math.PI);
    c.fill();
    if (n % 2) {
      c.fillRect(Math.round(tx - tr * 1.6), Math.round(ty - tr * 0.8), Math.round(tr * 3.2), 1);
      c.fillRect(Math.round(tx - tr * 0.9), Math.round(ty - tr * 1.7), Math.round(tr * 1.8), Math.round(tr));
    }
    // La loupe : sous elle, le papier s'éclaire et une empreinte apparaît, invisible à l'œil nu.
    const R = Math.max(4, Math.round(Math.min(dw, dh) * 0.25));
    const ox = px + pw * (0.58 + 0.28 * Math.sin(t * 0.9));
    const oy = py + ph * (0.52 + 0.26 * Math.sin(t * 1.5 + 1));
    const ex = px + pw * 0.74;
    const ey = py + ph * 0.6;
    c.save();
    c.beginPath();
    c.arc(ox, oy, R, 0, 7);
    c.clip();
    lignes('#fff9e8', '#2e281d', 2, false);
    c.strokeStyle = '#f0301f';
    c.lineWidth = 1;
    for (let r = 1.5; r < R * 0.85; r += 3) {
      c.beginPath();
      c.ellipse(ex, ey, r * 0.72, r, 0.25, 0.3, 5.9);
      c.stroke();
    }
    c.restore();
    c.strokeStyle = '#2a1c10';
    c.lineWidth = Math.max(1, Math.round(R / 7));
    c.beginPath();
    c.arc(ox, oy, R, 0, 7);
    c.stroke();
    c.lineWidth = Math.max(2, Math.round(R / 4));
    c.beginPath();
    c.moveTo(ox + R * 0.72, oy + R * 0.72);
    c.lineTo(ox + R * 1.5, oy + R * 1.5);
    c.stroke();
    // Le tampon rouge tombe sur le dossier, et le fait trembler une seconde.
    const MOTS = ['SUSPECT', 'ALIBI ?', 'MOBILE ?', 'AVEU ?'];
    if (p > 0.6 && p < 0.96) {
      const mot = MOTS[n % MOTS.length];
      const se = Math.max(1, Math.min(Math.floor((dw - 8) / (8 * 6)), Math.floor((dh * 0.42) / 11)));
      const chute = p < 0.64;
      const e = se + (chute ? 1 : 0);
      const tremble = p < 0.68 ? Math.round(Math.sin(t * 90)) : 0;
      const sw = largeur(mot, e) + 6 * e;
      const sh = 13 * e;
      const sx = Math.round(x0 + (dw - sw) / 2) + tremble;
      const sy = Math.round(y0 + (dh - sh) / 2);
      c.fillStyle = 'rgba(217,207,179,.9)';
      c.fillRect(sx, sy, sw, sh);
      c.fillStyle = '#ff1f12';
      c.fillRect(sx, sy, sw, e);
      c.fillRect(sx, sy + sh - e, sw, e);
      c.fillRect(sx, sy, e, sh);
      c.fillRect(sx + sw - e, sy, e, sh);
      texte(c, mot, sx + 3 * e, sy + 3 * e, e);
    }
    nom(c, ['INSPECTEUR'], ['#e0b77d'], z);
    bandeau(c, 'TROIS HYPOTHESES. UN SEUL COUPABLE. ET TOUT LE MONDE A QUELQUE CHOSE A CACHER.     ', G.sur - 10, 1, '#e0b77d', 28, t);
  },

  justone(c, t) {
    const z = zones(['JUST ONE']);
    // Le bleu du jeu, griffonné : des traits de feutre ondulent sur le fond.
    c.fillStyle = '#1b37c9';
    c.fillRect(0, 0, G.w, G.h);
    c.fillStyle = '#2f52f5';
    for (let y = 2; y < G.sur - 10; y += 6)
      for (let x = 0; x < G.w; x++) if (Math.sin(x * 0.4 + y * 1.7 + t * 1.3) > 0.45) c.fillRect(x, y + Math.round(Math.sin(x * 0.4 + y) * 1.4), 1, 1);
    // Trois tableaux : chacun écrit son indice, deux sont pareils, l'éponge les efface, et le mot se trouve avec ce qui reste.
    const CARTES = [['CHAT', 'MIAOU', 'GRIFFES'], ['PIZZA', 'ITALIE', 'FOUR'], ['PLAGE', 'SABLE', 'MAILLOT'], ['BATMAN', 'GOTHAM', 'CAPE'], ['NOEL', 'SAPIN', 'RENNE'], ['LUNE', 'NUIT', 'MAREE']];
    const FEUTRES = ['#e5262d', '#0b9a4f', '#8a2be2'];
    const cycle = 5.4;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const [mot, pareil, seul] = CARTES[n % CARTES.length];
    const indices = [pareil, seul, pareil];
    // Sur un mur bas, on garde ce qui tient : les trois tableaux, les deux pareils, ou celui qui reste.
    const enLigne = (z.aw - 4) / 3 >= 45;
    const vus = enLigne || z.ah >= 23 ? [0, 1, 2] : z.ah >= 15 ? [0, 2] : [1];
    const bw = enLigne ? Math.floor((z.aw - 4) / 3) : Math.min(z.aw, Math.max(46, Math.round(z.ah * 1.8)));
    const bh = enLigne ? Math.min(z.ah, Math.round(bw * 0.6)) : Math.floor((z.ah - (vus.length - 1)) / vus.length);
    const socle = bh >= 10 ? Math.max(2, Math.round(bh / 7)) : 0;
    const e = Math.max(1, Math.min(Math.floor((bw - 3) / 42), Math.floor((bh - socle) / 7)));
    const heros = vus.includes(1) ? 1 : vus[0];
    vus.forEach((i, k) => {
      const x = enLigne ? z.ax + k * (bw + 2) : Math.round(z.ax + (z.aw - bw) / 2);
      const y = enLigne ? Math.round(z.ay + (z.ah - bh) / 2) : z.ay + k * (bh + 1);
      const trouve = i === heros && p > 0.66;
      c.fillStyle = '#000';
      if (bh >= 10) c.fillRect(x + 1, y + 1, bw, bh);
      c.fillStyle = trouve ? '#eaff3d' : '#fffefa';
      c.fillRect(x, y, bw, bh);
      c.fillStyle = FEUTRES[i];
      if (socle) c.fillRect(x, y + bh - socle, bw, socle);
      else c.fillRect(x, y, 2, bh);
      const h = bh - socle;
      const dx = socle ? 0 : 1;
      const s = trouve ? mot : indices[i];
      const wx = Math.round(x + dx + (bw - largeur(s, e)) / 2);
      const wy = Math.round(y + (h - 7 * e) / 2);
      // Chacun écrit à son tour, de gauche à droite.
      const ecrit = Math.min(1, Math.max(0, (p - 0.02 - k * 0.09) / 0.12));
      c.save();
      c.beginPath();
      c.rect(x, y, bw * (trouve ? 1 : ecrit), bh);
      c.clip();
      c.fillStyle = trouve ? '#14162b' : FEUTRES[i];
      texte(c, s, wx, wy, e);
      c.restore();
      // L'éponge passe sur les deux pareils, et laisse une traînée.
      if (i !== 1 && p > 0.38) {
        const passe = Math.min(1, (p - 0.38 - k * 0.03) / 0.14);
        if (passe > 0) {
          const large = Math.round(bw * passe);
          c.fillStyle = '#fffefa';
          c.fillRect(x, y, large, h);
          c.fillStyle = '#c9cce0';
          for (let l = y + 1; l < y + h - 1; l += 2) c.fillRect(x + 2, l, Math.max(0, large - 4), 1);
          if (passe < 1) {
            c.fillStyle = '#14162b';
            c.fillRect(x + large - 2, y, Math.max(3, e * 3), h);
          }
        }
      }
    });
    // Le nom, comme le logo du jeu : « ONE » découpé dans un coup de surligneur.
    const nx = Math.round(z.tx - largeur('JUST ONE', z.e) / 2);
    const ny = Math.round(z.ty - 3.5 * z.e);
    const debut = nx + 5 * 6 * z.e;
    detoure(c, 'JUST', nx, ny, z.e, '#fff');
    c.fillStyle = '#eaff3d';
    c.fillRect(debut - z.e, ny - z.e, largeur('ONE', z.e) + 2 * z.e, 9 * z.e);
    c.fillStyle = '#14162b';
    texte(c, 'ONE', debut, ny, z.e);
    bandeau(c, 'UN MOT A FAIRE DEVINER. UN INDICE CHACUN. SANS AVOIR LA MEME IDEE QUE LES AUTRES.     ', G.sur - 10, 1, '#eaff3d', 28, t);
  },

  skyjo(c, t) {
    let z = zones(['SKYJO']);
    // Sur téléphone, le nom rapetisse d'un cran pour que les cartes gardent leurs chiffres.
    if (!G.paysage && z.e >= 3) {
      const e = z.e - 1;
      z = { ...z, e, ah: Math.max(6, z.bas - z.ay - 9 * e - 3), ty: z.bas - 4.5 * e };
    }
    // Le ciel des années 70 : des bandes, du violet de la nuit à l'orange du soir.
    c.fillStyle = '#120d2a';
    c.fillRect(0, 0, G.w, G.h);
    const BANDES = ['#1b1440', '#251a4d', '#33215f', '#4a2268', '#6e2a72', '#8a2f78', '#b8407a', '#d9536a', '#f2704f'];
    const hb = G.sur / BANDES.length;
    BANDES.forEach((b, i) => {
      c.fillStyle = b;
      c.fillRect(0, Math.round(i * hb), G.w, Math.ceil(hb) + 1);
    });
    // La grille de douze cartes, 3 rangées de 4, au milieu de la zone du dessin.
    const g = z.ah >= 40 && z.aw >= 70 ? 2 : 1;
    const cw = Math.max(5, Math.floor(Math.min((z.aw * 0.9 - 3 * g) / 4, (z.ah - 2 - 2 * g) / 3 / 1.38)));
    const ch = Math.round(cw * 1.38);
    const gx = Math.round(z.ax + (z.aw - (4 * cw + 3 * g)) / 2);
    const gy = Math.round(z.ay + (z.ah - (3 * ch + 2 * g)) / 2);
    // Derrière, le gros soleil rayé : plein en haut, coupé de bandes de plus en plus larges en bas.
    const cx = gx + (4 * cw + 3 * g) / 2;
    const cy = gy + (3 * ch + 2 * g) * 0.42;
    const R = Math.min(z.aw * 0.5, (3 * ch + 2 * g) * 0.78);
    for (let y = Math.ceil(cy - R); y <= cy + R; y++) {
      const d = y - cy;
      if (d > 0 && (d % 6) < 1 + (d / R) * 4) continue;
      const l = Math.sqrt(Math.max(0, R * R - d * d));
      const k = (y - (cy - R)) / (2 * R);
      c.fillStyle = k < 0.45 ? '#ffd36b' : k < 0.62 ? '#ffc23d' : k < 0.78 ? '#ff9a4d' : '#f2704f';
      c.fillRect(Math.round(cx - l), y, Math.round(2 * l), 1);
    }
    // La table de nuit sous la grille, pour que chaque couleur de carte ressorte sur le soleil.
    const marge = g + 1;
    c.fillStyle = 'rgba(18,13,42,.85)';
    c.fillRect(gx - marge + 1, gy - marge, 4 * cw + 3 * g + 2 * marge - 2, 3 * ch + 2 * g + 2 * marge);
    c.fillRect(gx - marge, gy - marge + 1, 4 * cw + 3 * g + 2 * marge, 3 * ch + 2 * g + 2 * marge - 2);
    // Chaque manche : les cartes se retournent une à une, une colonne de trois pareilles s'envole, puis on redistribue.
    const cycle = 6.4;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const PAREILLES = [7, 12, 0, 5, -2, 10, 3];
    const col = (n * 3 + 1) % 4;
    const triple = PAREILLES[n % PAREILLES.length];
    const valeurs = Array.from({ length: 12 }, (_, i) => (i % 4 === col ? triple : ((i * 7 + n * 5 + ((i * i) % 5)) % 15) - 2));
    // Pas de seconde colonne pareille par hasard.
    for (let k = 0; k < 4; k++) if (k !== col && valeurs[k] === valeurs[k + 4] && valeurs[k] === valeurs[k + 8]) valeurs[k + 8] = (valeurs[k + 8] + 3) % 13;
    const autres = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((i) => i % 4 !== col).sort((a, b) => ((a * 5 + n) % 7) - ((b * 5 + n) % 7) || a - b);
    const ordre = [...autres];
    [col, col + 8, col + 4].forEach((i, k) => ordre.splice(3 + k * 4, 0, i));
    const TEINTES = (v) => (v <= -2 ? ['#5a55d8', '#2c2a85', '#ffffff'] : v < 0 ? ['#8191ff', '#4a5bd0', '#ffffff'] : v === 0 ? ['#7ad8f6', '#22a3d6', '#0d2b4c'] : v <= 4 ? ['#6ed892', '#2fa45c', '#0f3a1f'] : v <= 8 ? ['#ffe07a', '#ffb52e', '#5a2c00'] : ['#ff7d6a', '#d9352b', '#4a0a06']);
    const DOS = ['#2a1d5c', '#4a2268', '#8a2f78', '#c9457a', '#f2704f', '#ffb347'];
    // L'étiquette tassée : un 1 et un moins plus étroits, pour que « 12 » ou « −2 » tiennent sur une petite carte.
    const etiquette = (s, x, y, ex, ey) => {
      for (const ch of s) {
        if (ch === '-') {
          c.fillRect(x, y + 3 * ey, 3 * ex, ey);
          x += 4 * ex;
          continue;
        }
        const gl = POLICE[ch];
        const g0 = ch === '1' ? 1 : 0;
        const lg = ch === '1' ? 3 : 5;
        for (let r = 0; r < 7; r++) for (let b = g0; b < g0 + lg; b++) if ((gl[r] >> (4 - b)) & 1) c.fillRect(x + (b - g0) * ex, y + r * ey, ex, ey);
        x += (lg + 1) * ex;
      }
    };
    const large = (s) => [...s].reduce((a, ch) => a + (ch === '-' || ch === '1' ? 4 : 6), -1);
    const carte = (x, y, w, h, v) => {
      if (w < 1) return;
      const coins = (dx, dy, ww, hh) => {
        c.fillRect(x + dx + 1, y + dy, ww - 2, hh);
        c.fillRect(x + dx, y + dy + 1, ww, hh - 2);
      };
      c.fillStyle = 'rgba(10,5,30,.55)';
      coins(1, 1, w, h);
      if (v === null) {
        // Le dos : le coucher de soleil rayé, et le soleil s'il y a la place.
        DOS.forEach((k, i) => {
          const bord = i === 0 || i === DOS.length - 1 ? 1 : 0;
          const y0 = Math.round((i * h) / DOS.length);
          const y1 = Math.round(((i + 1) * h) / DOS.length);
          c.fillStyle = k;
          c.fillRect(x + bord, y + y0, w - 2 * bord, y1 - y0);
        });
        if (w >= 9) {
          c.fillStyle = '#ffd36b';
          c.beginPath();
          c.arc(x + w / 2, y + h * 0.56, Math.max(1, Math.round(w * 0.2)), 0, Math.PI * 2);
          c.fill();
        }
        return;
      }
      const [clair, fonce, encre] = TEINTES(v);
      c.fillStyle = fonce;
      coins(0, 0, w, h);
      if (w >= 5) {
        c.fillStyle = clair;
        c.fillRect(x + 1, y + 1, w - 2, h - 2);
      }
      // Les chiffres doublent sur une grande carte ; « 12 » ou « −2 » s'étirent seulement en hauteur s'ils manquent de largeur.
      const s = String(v);
      const ey = h >= 18 ? 2 : 1;
      const ex = ey === 2 && large(s) * 2 <= w - 4 ? 2 : 1;
      if (large(s) * ex <= w - 2 && h >= 9) {
        c.fillStyle = encre;
        etiquette(s, Math.round(x + (w - large(s) * ex) / 2), Math.round(y + (h - 7 * ey) / 2), ex, ey);
      }
    };
    const vol = Math.max(0, Math.min(1, (p - 0.66) / 0.2));
    const retour = Math.max(0, Math.min(1, (p - 0.9) / 0.08));
    for (let i = 0; i < 12; i++) {
      const x = gx + (i % 4) * (cw + g);
      let y = gy + Math.floor(i / 4) * (ch + g);
      const dans = i % 4 === col;
      let q = Math.max(0, Math.min(1, (p - (0.04 + ordre.indexOf(i) * 0.045)) / 0.035));
      // La colonne s'envole puis revient face cachée avec la nouvelle donne ; les autres se recachent en vague.
      if (dans && vol > 0) {
        if (retour > 0) {
          c.globalAlpha = retour;
          carte(x, y, cw, ch, null);
          c.globalAlpha = 1;
          continue;
        }
        y -= Math.round(vol * vol * (gy + 3 * ch + 2 * g + 4));
        c.fillStyle = '#fff3d6';
        for (let k = 0; k < 3; k++) if (Math.sin(t * 40 + i * 3 + k * 2.1) > 0.2) c.fillRect(x + ((i * 5 + k * 3) % cw), y + ch + 2 + k * 2, 1, 1);
      } else if (!dans && retour > 0) {
        q = 1 - Math.max(0, Math.min(1, (retour * 1.4 - (i % 4) * 0.12) / 0.4));
      }
      const ww = Math.round(cw * Math.abs(Math.cos(Math.PI * q)));
      carte(x + Math.round((cw - ww) / 2), y, ww, ch, q > 0.5 ? valeurs[i] : null);
      // La colonne complète s'illumine juste avant de partir.
      if (dans && p > 0.57 && vol === 0 && Math.sin(t * 18) > -0.2) {
        c.fillStyle = '#fff3d6';
        c.fillRect(x - 1, y - 1, cw + 2, 1);
        c.fillRect(x - 1, y + ch, cw + 2, 1);
        c.fillRect(x - 1, y, 1, ch);
        c.fillRect(x + cw, y, 1, ch);
      }
    }
    // Le nom, comme le logo : des lettres de couleur qui dansent, avec leur ombre magenta.
    const NOM = 'SKYJO';
    const LETTRES = ['#ffd36b', '#fff3d6', '#8fe0ff', '#fff3d6', '#9ff0b9'];
    const nx = Math.round(z.tx - largeur(NOM, z.e) / 2);
    const ny = Math.round(z.ty - 3.5 * z.e);
    const o = Math.max(1, Math.round(z.e / 3));
    [...NOM].forEach((l, i) => {
      const x = nx + i * 6 * z.e;
      const y = ny + Math.round(Math.sin(t * 2.2 + i * 1.3) * z.e * 0.5);
      c.fillStyle = '#2a1648';
      texte(c, l, x + 2 * o, y + 2 * o, z.e);
      c.fillStyle = '#b8407a';
      texte(c, l, x + o, y + o, z.e);
      c.fillStyle = LETTRES[i];
      texte(c, l, x, y, z.e);
    });
    bandeau(c, 'RETOURNE, ECHANGE, ET FINIS AVEC LE MOINS DE POINTS.     ', G.sur - 10, 1, '#ffc23d', 28, t);
  },

  trio(c, t) {
    let z = zones(['TRIO']);
    // Sur téléphone, le nom rapetisse d'un cran pour que les cartes gardent leurs chiffres.
    if (!G.paysage && z.e >= 3) {
      const e = z.e - 1;
      z = { ...z, e, ah: Math.max(6, z.bas - z.ay - 9 * e - 3), ty: z.bas - 4.5 * e };
    }
    // Le papier Memphis des années 80, version nuit : de petites formes roses, jaunes et turquoise dérivent sur l'encre.
    c.fillStyle = '#1f1b2e';
    c.fillRect(0, 0, G.w, G.h);
    const FORMES = ['#ff5fa2', '#ffd23f', '#19b3b1', '#4a6cff', '#b5e04a'];
    const hauteur = Math.max(4, G.sur - 12);
    for (let i = 0; i < 30; i++) {
      const x = Math.round((((i * 37.7 + t * (1.5 + (i % 3))) % (G.w + 10)) + G.w + 10) % (G.w + 10)) - 5;
      const y = Math.round(((i * 53) % hauteur) + Math.sin(t * 0.8 + i) * 1.5) + 1;
      c.fillStyle = FORMES[i % FORMES.length];
      const f = i % 4;
      if (f === 0) for (let j = 0; j < 6; j++) c.fillRect(x + j, y + (j % 2), 1, 1);
      else if (f === 1) c.fillRect(x, y, 2, 2);
      else if (f === 2) {
        c.fillRect(x - 1, y, 3, 1);
        c.fillRect(x, y - 1, 1, 3);
      } else {
        c.fillRect(x + 1, y, 1, 1);
        c.fillRect(x, y + 1, 3, 1);
      }
    }
    // Les faces des cartes, comme dans le jeu : une couleur et un motif par nombre, le 7 en noir et or.
    const FACES = { 1: ['#ff6b6b', '#ffd6d1'], 2: ['#ff9a3d', '#ffe4c4'], 3: ['#ffd23f', '#e08e00'], 4: ['#b5e04a', '#4f8a12'], 5: ['#3ec98a', '#d2f7e4'], 6: ['#19b3b1', '#c4f3f0'], 7: ['#1f1b2e', '#ffd23f'], 8: ['#5cc8ff', '#e3f6ff'], 9: ['#4a6cff', '#d0d9ff'], 10: ['#8a63ff', '#e2d7ff'], 11: ['#d65cff', '#f7d9ff'], 12: ['#ff5fa2', '#ffd6e8'] };
    const g = z.ah >= 40 && z.aw >= 80 ? 3 : 2;
    const cw = Math.max(6, Math.floor(Math.min((z.aw * 0.86 - 2 * g) / 3, (z.ah - 4) / 1.4)));
    const ch = Math.round(cw * 1.4);
    const gx = Math.round(z.ax + (z.aw - (3 * cw + 2 * g)) / 2);
    const gy = Math.round(z.ay + (z.ah - ch) / 2) + 1;
    // Le « 1 » tassé, pour que 10, 11 et 12 tiennent sur une petite carte.
    const chiffres = (s, x, y, e) => {
      for (const k of s) {
        const gl = POLICE[k];
        const g0 = k === '1' ? 1 : 0;
        const lg = k === '1' ? 3 : 5;
        for (let r = 0; r < 7; r++) for (let b = g0; b < g0 + lg; b++) if ((gl[r] >> (4 - b)) & 1) c.fillRect(x + (b - g0) * e, y + r * e, e, e);
        x += (lg + 1) * e;
      }
    };
    const large = (s) => [...s].reduce((a, k) => a + (k === '1' ? 4 : 6), -1);
    const carte = (x, y, w, h, v, eclat) => {
      if (w < 1) return;
      c.fillStyle = 'rgba(0,0,0,.6)';
      c.fillRect(x + 1, y + 1, w, h);
      c.fillStyle = eclat ? '#ffffff' : '#fffaf2';
      c.fillRect(x, y, w, h);
      if (w < 3) return;
      if (v === null) {
        // Le dos : l'encre et les trois ronds du logo.
        c.fillStyle = '#2b2540';
        c.fillRect(x + 1, y + 1, w - 2, h - 2);
        const r = Math.max(1, Math.round(w * 0.12));
        const cx = x + w / 2;
        const cy = y + h / 2;
        [['#ff5fa2', -1, -0.6], ['#ffd23f', 1, -0.6], ['#19b3b1', 0, 0.85]].forEach(([k, dx, dy]) => {
          c.fillStyle = k;
          c.beginPath();
          c.arc(cx + dx * r, cy + dy * r, r, 0, 7);
          c.fill();
        });
        return;
      }
      const [fond, motif] = FACES[v];
      c.fillStyle = fond;
      c.fillRect(x + 1, y + 1, w - 2, h - 2);
      c.fillStyle = motif;
      for (let dy = 2; dy < h - 2; dy += 3) for (let dx = 2 + ((dy / 3) % 2); dx < w - 2; dx += 4) if (v !== 7 || Math.sin(t * 6 + dx * 1.7 + dy) > 0.3) c.fillRect(x + dx, y + dy, 1, 1);
      // Le nombre, dans son rond crème (or pour le 7) s'il y a la place.
      const s = String(v);
      const e = Math.max(1, Math.min(Math.floor((w * 0.62) / large(s)), Math.floor((h * 0.4) / 7)));
      const tw = large(s) * e;
      const R = Math.max(tw / 2 + e + 1, 3.5 * e + 2);
      if (R * 2 <= w - 2) {
        c.fillStyle = '#1f1b2e';
        c.beginPath();
        c.arc(x + w / 2, y + h / 2, R + 1, 0, 7);
        c.fill();
        c.fillStyle = v === 7 ? '#ffd23f' : '#fffaf2';
        c.beginPath();
        c.arc(x + w / 2, y + h / 2, R, 0, 7);
        c.fill();
        c.fillStyle = '#1f1b2e';
      } else c.fillStyle = v === 7 ? '#ffd23f' : '#1f1b2e';
      chiffres(s, Math.round(x + (w - tw) / 2), Math.round(y + (h - 7 * e) / 2), e);
    };
    // Chaque tour : on retourne trois cartes une à une. Une fois sur deux, la troisième diffère et tout repart ; l'autre fois, c'est un trio.
    const cycle = 5.6;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const SUITE = [9, 7, 4, 12, 2, 7, 11, 6];
    const v = SUITE[n % SUITE.length];
    const trio = n % 2 === 1;
    const valeurs = trio ? [v, v, v] : [v, v, ((v + 3) % 12) + 1];
    const envol = trio ? Math.max(0, Math.min(1, (p - 0.8) / 0.12)) : 0;
    const retour = Math.max(0, Math.min(1, (p - (trio ? 0.93 : 0.84)) / 0.07));
    const tremble = !trio && p > 0.56 && p < 0.66 ? Math.round(Math.sin(t * 70)) : 0;
    for (let i = 0; i < 3; i++) {
      let q = Math.max(0, Math.min(1, (p - (0.08 + i * 0.16)) / 0.06));
      if (!trio && retour > 0) q = 1 - retour;
      let x = gx + i * (cw + g) + tremble;
      let y = gy - (q === 1 ? 1 : 0);
      if (trio && envol > 0) {
        if (retour > 0) {
          c.globalAlpha = retour;
          carte(gx + i * (cw + g), gy, cw, ch, null, false);
          c.globalAlpha = 1;
          continue;
        }
        y -= Math.round(envol * envol * (gy + ch + 4));
        x += Math.round((i - 1) * envol * cw * 0.5);
      }
      const ww = Math.round(cw * Math.abs(Math.cos(Math.PI * q)));
      const eclat = trio && p > 0.56 && envol === 0 && Math.sin(t * 20) > 0.2;
      carte(x + Math.round((cw - ww) / 2), y, ww, ch, q > 0.5 ? valeurs[i] : null, eclat);
      // La carte qui ne va pas s'entoure de rouge.
      if (!trio && i === 2 && q === 1 && p > 0.56 && Math.sin(t * 16) > -0.3) {
        c.fillStyle = '#ff3b3b';
        c.fillRect(x - 1, y - 1, cw + 2, 1);
        c.fillRect(x - 1, y + ch, cw + 2, 1);
        c.fillRect(x - 1, y, 1, ch);
        c.fillRect(x + cw, y, 1, ch);
      }
    }
    // Le tampon, de travers comme sur la table : « RATE » en rouge, « TRIO ! » en rose.
    if (p > 0.58 && p < (trio ? 0.8 : 0.84)) {
      const mot = trio ? 'TRIO !' : 'RATE';
      const se = Math.max(1, Math.min(Math.floor(((3 * cw + 2 * g) * 0.55) / (largeur(mot) + 6)), Math.floor(ch / 30)));
      const sw = largeur(mot, se) + 6 * se;
      const sh = 13 * se;
      const sx = Math.round(gx + (3 * cw + 2 * g - sw) / 2);
      // Posé sur le bas des cartes, pour qu'on voie encore les nombres.
      const sy = Math.round(gy + ch - sh * 0.7);
      c.fillStyle = '#1f1b2e';
      c.fillRect(sx + se, sy + se, sw, sh);
      c.fillStyle = trio ? '#ff5fa2' : '#ff3b3b';
      c.fillRect(sx, sy, sw, sh);
      c.fillStyle = '#fffaf2';
      texte(c, mot, sx + 3 * se, sy + 3 * se, se);
    }
    // Le nom, comme le logo : des lettres crème qui dansent, avec leurs trois ombres turquoise, jaune et rose.
    const NOM = 'TRIO';
    const nx = Math.round(z.tx - largeur(NOM, z.e) / 2);
    const ny = Math.round(z.ty - 3.5 * z.e);
    const o = Math.max(1, Math.round(z.e / 3));
    [...NOM].forEach((l, i) => {
      const x = nx + i * 6 * z.e;
      const y = ny + Math.round(Math.sin(t * 2.4 + i * 1.4) * z.e * 0.5);
      c.fillStyle = '#19b3b1';
      texte(c, l, x + 3 * o, y + 3 * o, z.e);
      c.fillStyle = '#ffd23f';
      texte(c, l, x + 2 * o, y + 2 * o, z.e);
      c.fillStyle = '#ff5fa2';
      texte(c, l, x + o, y + o, z.e);
      c.fillStyle = '#fffaf2';
      texte(c, l, x, y, z.e);
    });
    bandeau(c, 'PLUS PETITE ? PLUS GRANDE ? RETIENS TOUT, ET REUNIS TROIS CARTES PAREILLES.     ', G.sur - 10, 1, '#ffd23f', 28, t);
  },

  citadelles(c, t) {
    const z = zones(['CITADELLES']);
    // La nuit sur la ville, et les pierres de la cathédrale à peine visibles.
    c.fillStyle = '#120e18';
    c.fillRect(0, 0, G.w, G.h);
    c.fillStyle = '#1b1524';
    for (let y = 1; y < G.sur - 11; y += 4) for (let x = (y % 8 === 1 ? 0 : 4); x < G.w; x += 8) c.fillRect(x, y, 6, 2);
    // Sept fenêtres en ogive, la plus haute au centre : une cité complète. Chacune prend la couleur d'un type de quartier.
    const VERRES = ['#ffc933', '#2f7cf0', '#2cb65f', '#e8392f', '#9a4ff0', '#2f7cf0', '#ffc933'];
    const g = z.aw >= 90 ? 3 : z.aw >= 50 ? 2 : 1;
    const lw = Math.max(3, Math.floor((z.aw * 0.94 - 6 * g) / 7));
    const x0 = Math.round(z.ax + (z.aw - (7 * lw + 6 * g)) / 2);
    const sol = z.ay + z.ah;
    // Chaque tour : les vitraux s'allument un à un, la cité brille, puis le Condottiere en brise un, et tout repart.
    const cycle = 9;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const CIBLES = [4, 1, 5, 2, 6, 0, 3];
    const brisee = CIBLES[n % CIBLES.length];
    const complet = p > 0.6 && p < 0.72;
    const eteint = Math.max(0, Math.min(1, (p - 0.93) / 0.06));
    const fenetre = (i) => {
      const lh = Math.max(lw + 2, Math.round(z.ah * (0.56 + 0.42 * (1 - Math.abs(i - 3) / 3)) - 1));
      return { x: x0 + i * (lw + g), y: sol - lh, h: lh };
    };
    // La demi-largeur de chaque rangée : la pointe de l'ogive, puis le corps droit.
    const demi = (r, arc) => (r >= arc ? lw / 2 : Math.max(0.5, (lw / 2) * Math.sqrt((r + 1) / arc)));
    for (let i = 0; i < 7; i++) {
      const f = fenetre(i);
      const arc = Math.max(2, Math.ceil(lw * 0.9));
      const allume = Math.max(0, Math.min(1, (p - (0.04 + i * 0.075)) / 0.03)) * (1 - eteint);
      const casse = i === brisee && p > 0.78;
      const onde = 0.82 + 0.18 * Math.sin(t * 2.2 + i * 1.3);
      // Les rayons qui descendent vers le sol.
      if (allume > 0 && !casse) {
        c.fillStyle = VERRES[i];
        for (let k = 0; k < 3; k++) {
          c.globalAlpha = allume * (0.16 - k * 0.04);
          c.fillRect(f.x - k, sol, lw + 2 * k, Math.max(0, G.sur - 11 - sol));
        }
        c.globalAlpha = 1;
      }
      for (let r = 0; r < f.h; r++) {
        const d = demi(r, arc);
        const x1 = Math.round(f.x + lw / 2 - d);
        const larg = Math.max(1, Math.round(2 * d));
        // Le plomb tout autour, plus sombre que le mur.
        c.fillStyle = '#07050b';
        c.fillRect(x1 - 1, f.y + r - (r === 0 ? 1 : 0), larg + 2, r === 0 ? 2 : 1);
        for (let dx = 0; dx < larg; dx++) {
          const px = x1 + dx;
          const py = f.y + r;
          const plomb = (r > 0 && r % 5 === 0) || (lw >= 5 && px === f.x + Math.floor(lw / 2));
          if (plomb) c.fillStyle = '#07050b';
          else if (casse) {
            // Il ne reste que des tessons sur les bords.
            const reste = (dx === 0 || dx === larg - 1) && (r * 7 + i * 3) % 5 < 2;
            c.fillStyle = reste ? VERRES[i] : '#0a0810';
          } else if (allume > 0) {
            const tesson = (px * 13 + r * 7 + i * 5) % 9;
            c.fillStyle = tesson === 0 || (complet && tesson < 3 && Math.sin(t * 9 + i) > 0) ? '#fff4c2' : VERRES[i];
            c.globalAlpha = allume * (tesson === 0 ? 0.95 : tesson < 4 ? onde : onde * 0.72);
          } else c.fillStyle = '#231c2f';
          c.fillRect(px, py, 1, 1);
          c.globalAlpha = 1;
        }
      }
      // Les éclats retombent de la fenêtre brisée.
      if (casse && p < 0.93) {
        const q = (p - 0.78) / 0.15;
        for (let k = 0; k < 14; k++) {
          const dir = ((k * 37) % 11) / 5 - 1;
          const ex = Math.round(f.x + lw / 2 + dir * (lw * 0.4 + q * lw * 1.4));
          const ey = Math.round(f.y + ((k * 17) % f.h) * (0.3 + 0.2 * (1 - q)) + q * q * z.ah * (0.7 + ((k * 5) % 4) / 8));
          if (ey >= G.sur - 11) continue;
          c.fillStyle = k % 3 === 0 ? '#fff4c2' : VERRES[i];
          c.fillRect(ex, ey, 1 + (k % 2), 1);
        }
      }
    }
    // L'éclair doré quand la cité est complète.
    if (complet) {
      c.globalAlpha = 0.07 + 0.05 * Math.sin(t * 9);
      c.fillStyle = '#ffd24a';
      c.fillRect(0, 0, G.w, G.sur - 11);
      c.globalAlpha = 1;
    }
    nom(c, ['CITADELLES'], ['#ffd24a'], z);
    bandeau(c, 'UN PERSONNAGE SECRET, UNE CITE A BATIR, ET GARE A L ASSASSIN.     ', G.sur - 10, 1, '#ffc933', 28, t);
  },

  avalon(c, t) {
    const z = zones(['AVALON']);
    // Le fond de la tapisserie : la laine rouge, et les fleurs semées qui respirent à peine.
    c.fillStyle = '#7a2115';
    c.fillRect(0, 0, G.w, G.h);
    c.fillStyle = '#701d12';
    for (let y = 0; y < G.sur - 11; y += 2) c.fillRect(0, y, G.w, 1);
    const FLEURS = ['#f6e8c8', '#f3a899', '#f2c548', '#8fb0e2'];
    const semis = Math.floor((G.w * (G.sur - 11)) / 90);
    for (let i = 0; i < semis; i++) {
      const x = (i * 37 + (i % 3) * 11) % G.w;
      const y = (i * 53 + (i % 5) * 7) % (G.sur - 12);
      c.fillStyle = '#3f7d58';
      c.fillRect(x, y + 1, 1, 1);
      c.globalAlpha = 0.6 + 0.3 * Math.sin(t * 0.8 + i);
      c.fillStyle = FLEURS[i % 4];
      c.fillRect(x, y, 1, 1);
      c.globalAlpha = 1;
    }
    // Le dessin tient sur une grille de 48 sur 28, à l'échelle de la zone libre.
    const u = Math.max(0.5, Math.min(z.aw / 48, z.ah / 28));
    const ox = Math.round(z.ax + (z.aw - 48 * u) / 2);
    const oy = Math.round(z.ay + z.ah - 28 * u);
    const r = (x, y, w, h, couleur) => {
      c.fillStyle = couleur;
      const x0 = Math.round(x * u);
      const y0 = Math.round(y * u);
      c.fillRect(ox + x0, oy + y0, Math.max(1, Math.round((x + w) * u) - x0), Math.max(1, Math.round((y + h) * u) - y0));
    };
    // Chaque tour : Excalibur se plante, puis les deux écus se retournent. L'un est loyal, l'autre traître, et ils changent de place.
    const cycle = 10;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    // L'île bleue, avec sa couture.
    for (let y = 19; y < 28; y++) {
      const hw = Math.round(23.5 * Math.sqrt(Math.max(0, 1 - ((y - 23.5) / 4.8) ** 2)));
      r(24 - hw, y, 2 * hw, 1, '#1f4e96');
      if (y > 19 && y < 27 && y % 2) {
        r(24 - hw + 2, y, 1, 1, '#fff6df');
        r(24 + hw - 3, y, 1, 1, '#fff6df');
      }
    }
    r(17, 26, 1, 1, '#f3a899');
    r(31, 25, 1, 1, '#f6e8c8');
    r(24, 26, 1, 1, '#f2c548');
    // La pierre.
    r(19, 18, 10, 1, '#cfc5b1');
    r(17, 19, 14, 2, '#cfc5b1');
    r(16, 21, 16, 3, '#a89c88');
    r(17, 24, 14, 1, '#7b7060');
    // L'épée tombe du haut du mur et se fiche dans la pierre.
    const chute = Math.min(1, p / 0.1);
    const d = Math.round((1 - chute * chute) * 24);
    if (chute > 0) {
      r(22.5, 5 - d, 3, 14, '#e6e9ee');
      r(24, 5 - d, 1, 14, '#9aa2ad');
      r(23, 1 - d, 2, 3, '#6e1a12');
      r(18, 4 - d, 12, 2, '#f0bd45');
      r(22, -1 - d, 4, 2, '#f0bd45');
      r(23.5, -1 - d, 1, 1, '#c63f2d');
    }
    // Le choc sur la pierre, puis un reflet qui descend le long de la lame.
    if (p > 0.1 && p < 0.17) {
      const q = (p - 0.1) / 0.07;
      for (let k = 0; k < 8; k++) {
        const a = Math.PI + (k * Math.PI) / 7;
        r(24 + Math.cos(a) * q * 12, 18 + Math.sin(a) * q * 6, 1, 1, '#fff4c2');
      }
    }
    if (p > 0.2 && p < 0.34) r(22.5, 5 + ((p - 0.2) / 0.14) * 12, 1, 2, '#ffffff');
    // Les deux écus : même revers vert pour tous, on ne sait qu'au dernier moment qui est qui.
    const ecu = (cx, debut, loyal) => {
      const q = (p - debut) / 0.06;
      const fin = (p - 0.9) / 0.06;
      const montre = (q >= 0.5 && fin < 0.5);
      const plat = Math.max(0.1, Math.abs(Math.cos(Math.PI * Math.max(0, Math.min(1, q)))) * Math.abs(Math.cos(Math.PI * Math.max(0, Math.min(1, fin)))));
      const bord = !montre ? '#1f463e' : loyal ? '#f0bd45' : '#c63f2d';
      const champ = !montre ? '#2f7a5c' : loyal ? '#1f4e96' : '#1b1714';
      const LARGEURS = [11, 11, 11, 11, 11, 11, 11, 9, 9, 7, 5, 3];
      LARGEURS.forEach((w, i) => {
        const l = Math.max(1, w * plat);
        r(cx - l / 2, 14 + i, l, 1, i === 0 || i === LARGEURS.length - 1 ? bord : champ);
        if (l >= 2 && i > 0) {
          r(cx - l / 2, 14 + i, 1, 1, bord);
          r(cx + l / 2 - 1, 14 + i, 1, 1, bord);
        }
      });
      if (plat < 0.6) return;
      if (!montre) {
        r(cx - 1, 17, 2, 2, '#fff6df');
        r(cx - 0.5, 17.5, 1, 1, '#f2c548');
      } else if (loyal) {
        r(cx - 0.5, 16, 1, 6, '#f0bd45');
        r(cx - 2.5, 18, 5, 1, '#f0bd45');
      } else {
        r(cx - 0.5, 16, 1, 5, '#e6e9ee');
        r(cx - 2, 20, 4, 1, '#f0bd45');
        r(cx - 0.5, 21, 1, 2, '#7a4a2a');
      }
    };
    const gauche = n % 2 === 0;
    ecu(9, 0.42, gauche);
    ecu(39, 0.56, !gauche);
    nom(c, ['AVALON'], ['#f8db7d'], z);
    bandeau(c, 'LOYAUX OU SBIRES ? COMPOSE L EQUIPE, VOTE EN SECRET, ET DEMASQUE LE TRAITRE.     ', G.sur - 10, 1, '#ff8fa3', 28, t);
  },

  removeone(c, t) {
    let z = zones(['REMOVE', 'ONE']);
    // Sur téléphone, le nom rapetisse d'un cran pour que les plaques gardent des chiffres lisibles.
    if (!G.paysage && z.e >= 3) {
      const e = z.e - 1;
      z = { ...z, e, ah: Math.max(6, z.bas - z.ay - 18 * e - 3), ty: z.bas - 9 * e };
    }
    // Le mur de la cellule : du béton banché la nuit, ses joints, ses trous de banche et les jours comptés à la craie.
    c.fillStyle = '#2b2925';
    c.fillRect(0, 0, G.w, G.h);
    c.fillStyle = '#25231f';
    for (let x = 23; x < G.w; x += 24) c.fillRect(x, 0, 1, G.sur - 11);
    for (let y = 15; y < G.sur - 11; y += 16) c.fillRect(0, y, G.w, 1);
    c.fillStyle = '#45413a';
    for (let x = 11; x < G.w; x += 24) for (let y = 7; y < G.sur - 12; y += 16) c.fillRect(x, y, 1, 1);
    c.fillStyle = '#6d675c';
    for (let i = 0; i < 4; i++) c.fillRect(3 + i * 2, 3, 1, 5);
    for (let i = 0; i < 9; i++) c.fillRect(2 + i, 7 - Math.floor(i / 2), 1, 1);
    // Deux plaques émaillées tombent, l'une est barrée et s'éteint, l'autre est jouée : « SEUL » si personne d'autre ne l'a, « DOUBLE » sinon.
    const SUITE = [[2, 6, 1, true], [1, 4, 0, false], [3, 7, 1, true], [1, 5, 1, false], [4, 8, 1, true]];
    const cycle = 5.2;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const [a, b, retiree, seul] = SUITE[n % SUITE.length];
    const g = Math.max(2, Math.round(z.aw * 0.08));
    const cw = Math.max(6, Math.floor(Math.min((z.aw * 0.7 - g) / 2, (z.ah - 4) / 1.4)));
    const ch = Math.round(cw * 1.4);
    const gx = Math.round(z.ax + (z.aw - (2 * cw + g)) / 2);
    const gy = Math.round(z.ay + (z.ah - ch) / 2) + 1;
    const sortie = Math.max(0, Math.min(1, (p - 0.92) / 0.08));
    // Sur un mur de LED, ce qui brille se lit : la plaque est un cadre d'émail allumé, son numéro au pochoir aussi.
    const plaque = (x, y, v, etat) => {
      const lum = etat === 'seul' ? '#ff5a1f' : etat === 'eteinte' ? '#5c574f' : '#f4f1ea';
      const bord = cw >= 22 ? 2 : 1;
      c.fillStyle = 'rgba(0,0,0,.6)';
      c.fillRect(x + 1, y + 1, cw, ch);
      c.fillStyle = lum;
      c.fillRect(x, y, cw, ch);
      c.fillStyle = etat === 'seul' ? '#2a120a' : '#1d1b18';
      c.fillRect(x + bord, y + bord, cw - 2 * bord, ch - 2 * bord);
      // Le trou pour le crochet.
      c.fillStyle = lum;
      c.fillRect(x + Math.floor(cw / 2), y + bord + Math.max(1, Math.round(ch * 0.07)), 1, 1);
      const e = Math.max(1, Math.min(Math.floor((cw - 2 * bord - 2) / 5), Math.floor((ch - 2 * bord - 6) / 7)));
      texte(c, String(v), Math.round(x + (cw - 5 * e) / 2), Math.round(y + (ch - 7 * e) / 2 + ch * 0.06), e);
    };
    const barre = Math.max(0, Math.min(1, (p - 0.36) / 0.08));
    const eteinte = p > 0.48;
    const joue = p > 0.58;
    [a, b].forEach((v, i) => {
      const chute = Math.max(0, Math.min(1, (p - (0.04 + i * 0.1)) / 0.1));
      if (chute === 0) return;
      const x = gx + i * (cw + g);
      let y = Math.round(gy - (1 - chute) * (1 - chute) * (gy + ch + 2)) - Math.round(sortie * (G.sur - gy));
      const etat = i === retiree ? (eteinte ? 'eteinte' : 'neuve') : joue && seul ? 'seul' : joue ? 'eteinte' : 'neuve';
      if (i !== retiree && joue && seul) y -= 1;
      plaque(x, y, v, etat);
      // La bande orange qui barre la carte retirée, en diagonale.
      if (i === retiree && barre > 0) {
        c.fillStyle = '#ff5a1f';
        const long = Math.round((cw + 4) * barre);
        for (let k = 0; k < long; k++) c.fillRect(x - 2 + k, y + Math.round(ch * 0.68 - k * (ch * 0.36) / (cw + 4)), 1, Math.max(2, Math.round(ch * 0.12)));
      }
    });
    // Le tampon, de travers, posé sous la carte jouée.
    if (joue && sortie === 0) {
      const mot = seul ? 'SEUL' : 'DOUBLE';
      const se = Math.max(1, Math.min(Math.floor((cw * 1.6) / (largeur(mot) + 4)), Math.floor(ch / 24)));
      const sw = largeur(mot, se) + 4 * se;
      const sh = 11 * se;
      const kx = gx + (1 - retiree) * (cw + g);
      const sx = Math.round(Math.max(1, Math.min(G.w - sw - 2, kx + (cw - sw) / 2)));
      const sy = Math.round(gy + ch - sh * 0.6);
      c.fillStyle = '#000';
      c.fillRect(sx + se, sy + se, sw, sh);
      c.fillStyle = seul ? '#191714' : '#8e959b';
      c.fillRect(sx, sy, sw, sh);
      c.fillStyle = seul ? '#f4f1ea' : '#191714';
      texte(c, mot, sx + 2 * se, sy + 2 * se, se);
    }
    nom(c, ['REMOVE', 'ONE'], ['#f4f1ea', '#ff5a1f'], z);
    bandeau(c, "POSE DEUX CARTES, N'EN JOUE QU'UNE. LE PLUS PETIT NOMBRE QUE PERSONNE D'AUTRE N'A JOUE GAGNE.     ", G.sur - 10, 1, '#ff5a1f', 28, t);
  },

  balancemancala(c, t) {
    const z = zones(['BALANCE', 'MANCALA']);
    // Une lame de tarot la nuit : l'encre, et des étoiles d'or qui scintillent.
    c.fillStyle = '#140d0b';
    c.fillRect(0, 0, G.w, G.h);
    const semis = Math.floor((G.w * (G.sur - 11)) / 70);
    for (let i = 0; i < semis; i++) {
      c.fillStyle = Math.sin(t * 1.6 + i * 2.1) > 0.7 ? '#f2c230' : '#3b2a16';
      c.fillRect((i * 37 + (i % 3) * 11) % G.w, (i * 53 + (i % 5) * 7) % (G.sur - 12), 1, 1);
    }
    // L'anneau des quatorze coupelles : le Diable en haut, l'Ange en bas, rouge, bleu, vert de chaque côté.
    const PLATEAU = 'drbgrbgarbgrbg';
    const TEINTE = { r: '#ff3b2f', b: '#3f7bff', g: '#2fd35a', d: '#a3121a', a: '#fff3cf' };
    const PIONS = ['#f2c230', '#f6efe0', '#ff8fb0', '#7fd3f0', '#c6a3e3'];
    const cx = z.ax + z.aw / 2;
    const cy = z.ay + z.ah / 2 + 1;
    const rx = Math.max(6, Math.min(z.aw * 0.46, z.ah * 0.62));
    const ry = Math.max(5, z.ah * 0.38);
    const r = Math.max(1, Math.floor(Math.min(rx, ry) * 0.17));
    const ou = [...PLATEAU].map((_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 14;
      return [Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry)];
    });
    const disque = (x, y, q) => {
      for (let dy = -q; dy <= q; dy++) {
        const w = Math.floor(Math.sqrt(q * q - dy * dy + q * 0.6));
        c.fillRect(x - w, y + dy, 2 * w + 1, 1);
      }
    };
    // Chaque tour, une coupelle est semée : ses pions tombent un par un dans les suivantes, et le dernier fait marquer.
    const SUITE = [[1, [0, 2, 0]], [4, [3, 1, 4]], [9, [2, 0, 3, 1, 4]], [10, [4, 1]], [2, [1, 3, 0, 2]]];
    const cycle = 5.6;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const [depart, main] = SUITE[n % SUITE.length];
    const pas = 0.09;
    const tombes = Math.max(0, Math.min(main.length, Math.floor((p - 0.14) / pas) + 1));
    const fini = p > 0.14 + main.length * pas + 0.04;
    const arrivee = (depart + main.length) % 14;
    // Ce qui attend dans les coupelles, toujours le même départ : un ou deux pions.
    const BASE = [1, 2, 0, 1, 2, 1, 0, 2, 1, 0, 2, 1, 1, 0];
    const dedans = BASE.map((k, i) => (i === depart ? 0 : k));
    for (let k = 0; k < tombes; k++) dedans[(depart + k + 1) % 14]++;
    ou.forEach(([x, y], i) => {
      const sorte = PLATEAU[i];
      const brille = fini && i === arrivee && Math.floor(t * 6) % 2 === 0;
      c.fillStyle = brille ? '#f2c230' : '#000';
      disque(x, y + (brille ? 0 : 1), r + (brille ? 1 : 0));
      c.fillStyle = TEINTE[sorte];
      disque(x, y, r);
      if (sorte === 'd') {
        c.fillStyle = '#ff3b2f';
        c.fillRect(x - r, y - r - 1, 1, 2);
        c.fillRect(x + r, y - r - 1, 1, 2);
      }
      if (sorte === 'a') {
        c.fillStyle = '#f2c230';
        c.fillRect(x - Math.max(1, r - 1), y - r - 2, 2 * Math.max(1, r - 1) + 1, 1);
      }
      // Les pions dans la coupelle : des points clairs, au centre.
      c.fillStyle = sorte === 'a' ? '#5b4520' : '#fff8e6';
      const pts = [[0, 0], [-1, 1], [1, 1], [-1, -1], [1, -1], [0, 2], [0, -2]];
      for (let k = 0; k < Math.min(dedans[i], pts.length); k++) c.fillRect(x + pts[k][0] * (r > 2 ? 1 : 0) + (r > 2 ? 0 : k % 2), y + pts[k][1] * (r > 2 ? 1 : 0), 1, 1);
    });
    // La poignée : les pions encore en main voyagent au-dessus de l'anneau, de coupelle en coupelle.
    if (p > 0.06 && !fini) {
      const f = Math.max(0, (p - 0.14) / pas);
      const ici = Math.min(main.length, f);
      const a = -Math.PI / 2 + ((depart + ici + (p < 0.14 ? 0 : 0.5)) * 2 * Math.PI) / 14;
      const hx = Math.round(cx + Math.cos(a) * (rx + r + 3));
      const hy = Math.round(cy + Math.sin(a) * (ry + r + 3));
      main.slice(tombes).forEach((s, k) => {
        c.fillStyle = '#000';
        c.fillRect(hx - 1 + k * 2, hy, 2, 2);
        c.fillStyle = PIONS[s];
        c.fillRect(hx - 1 + k * 2, hy - 1, 2, 2);
      });
    }
    // Le gain, au milieu de l'anneau : autant de points que de pions dans la coupelle d'arrivée, dans sa couleur.
    if (fini && p < 0.94) {
      const sorte = PLATEAU[arrivee];
      const mot = `+${dedans[arrivee]}`;
      const e = Math.max(1, Math.min(Math.floor((rx * 1.1) / largeur(mot)), Math.floor((ry * 0.8) / 7)));
      detoure(c, mot, Math.round(cx - largeur(mot, e) / 2), Math.round(cy - (7 * e) / 2), e, sorte === 'd' ? '#ff3b2f' : sorte === 'a' ? '#f2c230' : TEINTE[sorte]);
      if ((sorte === 'a' || sorte === 'd') && ry > 14) {
        const sous = sorte === 'a' ? 'ANGE' : 'DIABLE';
        detoure(c, sous, Math.round(cx - largeur(sous) / 2), Math.round(cy + (7 * e) / 2 + 2), 1, '#fff3cf');
      }
    }
    nom(c, ['BALANCE', 'MANCALA'], ['#fff3cf', '#ff4b3e'], z);
    bandeau(c, 'SEME LES PIONS DE TOUT LE MONDE : LE DERNIER FAIT MARQUER SON PROPRIETAIRE. A LA FIN, SEULE TA COULEUR LA PLUS FAIBLE COMPTE.     ', G.sur - 10, 1, '#f2c230', 28, t);
  },

  layinggrass(c, t) {
    const z = zones(['LAYING', 'GRASS']);
    const q = Math.max(2, Math.floor(Math.min(z.aw, z.ah - 2) / 5));
    const gx = Math.round(z.ax + (z.aw - 5 * q) / 2);
    const gy = Math.round(z.ay + (z.ah - 5 * q) / 2);
    // La terre la nuit, en damier comme le terrain du jeu, calé sur le carré à venir.
    c.fillStyle = '#17100a';
    c.fillRect(0, 0, G.w, G.h);
    c.fillStyle = '#2c1f13';
    const x0 = Math.floor(gx / q);
    const y0 = Math.floor(gy / q);
    for (let j = 0; j * q < G.sur + q; j++) for (let i = 0; i * q < G.w + q; i++) if ((i + j) % 2 === 0) c.fillRect(gx - x0 * q + i * q, gy - y0 * q + j * q, q, q);
    // Sept plaques tombent et emboîtent un carré de 5 sur 5. Un cycle sur deux, en miroir.
    const PLAQUES = [
      [[1, 4], [2, 4], [3, 4]],
      [[0, 3], [1, 3], [0, 4]],
      [[3, 2], [3, 3], [4, 3], [4, 4]],
      [[2, 1], [3, 1], [2, 2], [2, 3]],
      [[0, 1], [0, 2], [1, 2]],
      [[3, 0], [4, 0], [4, 1], [4, 2]],
      [[0, 0], [1, 0], [2, 0], [1, 1]],
    ];
    const VERTS = ['#2f9a34', '#86e65d', '#46b841', '#a5ee74', '#37a538', '#74dc52', '#55c746'];
    const cycle = 6.8;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const miroir = n % 2 === 1;
    const sortie = Math.max(0, Math.min(1, (p - 0.93) / 0.07));
    const leve = Math.round(sortie * sortie * (gy + 5 * q + 2));
    PLAQUES.forEach((cases, k) => {
      const chute = Math.max(0, Math.min(1, (p - 0.03 - k * 0.065) / 0.06));
      if (chute === 0) return;
      const dy = Math.round((1 - chute) * (1 - chute) * (gy + 5 * q + 2)) + leve;
      const ici = cases.map(([i, j]) => [miroir ? 4 - i : i, j]);
      const sienne = (i, j) => ici.some(([u, v]) => u === i && v === j);
      ici.forEach(([i, j]) => {
        const x = gx + i * q;
        const y = gy + j * q - dy;
        c.fillStyle = VERTS[k];
        c.fillRect(x, y, q, q);
        // Le joint de la plaque, sur ses seuls bords : on voit la forme de chacune.
        if (q >= 4) {
          c.fillStyle = '#123d17';
          if (!sienne(i, j - 1)) c.fillRect(x, y, q, 1);
          if (!sienne(i, j + 1)) c.fillRect(x, y + q - 1, q, 1);
          if (!sienne(i - 1, j)) c.fillRect(x, y, 1, q);
          if (!sienne(i + 1, j)) c.fillRect(x + q - 1, y, 1, q);
        }
      });
    });
    // La tondeuse passe : plus de joints, seulement les bandes d'un gazon de stade.
    const tonte = Math.max(0, Math.min(1, (p - 0.52) / 0.16));
    if (tonte > 0) {
      const front = Math.round(5 * q * tonte);
      for (let j = 0; j < 5; j++) {
        c.fillStyle = j % 2 ? '#4fbb41' : '#86e65d';
        c.fillRect(gx, gy + j * q - leve, front, q);
      }
      if (tonte < 1) {
        c.fillStyle = '#ff5a36';
        c.fillRect(gx + front, gy - 1, q >= 4 ? 2 : 1, 5 * q + 2);
      }
    }
    // Le carré se mesure, en clignotant d'abord : c'est le seul moment où on annonce sa taille, comme à la fin d'une partie.
    if (p > 0.7 && sortie === 0 && (p > 0.75 || Math.floor(t * 10) % 2 === 0)) {
      const b = q >= 4 ? 2 : 1;
      c.fillStyle = '#f6efdc';
      c.fillRect(gx - b, gy - b, 5 * q + 2 * b, b);
      c.fillRect(gx - b, gy + 5 * q, 5 * q + 2 * b, b);
      c.fillRect(gx - b, gy, b, 5 * q);
      c.fillRect(gx + 5 * q, gy, b, 5 * q);
      const mot = '5X5';
      if (5 * q >= largeur(mot) + 2) {
        const e = Math.max(1, Math.min(Math.floor((5 * q - 4) / largeur(mot)), Math.floor((5 * q) / 14)));
        detoure(c, mot, Math.round(gx + (5 * q - largeur(mot, e)) / 2), Math.round(gy + (5 * q - 7 * e) / 2), e, '#f6efdc');
      }
    }
    nom(c, ['LAYING', 'GRASS'], ['#f6efdc', '#8fdc3f'], z);
    bandeau(c, 'PLANTE TES PLAQUES, ARRACHE CELLES DES AUTRES, FAIS POUSSER LE PLUS GRAND CARRE.     ', G.sur - 10, 1, '#8fdc3f', 28, t);
  },

  timeauction(c, t) {
    const z = zones(['TIME', 'AUCTION']);
    // L'appareil de chronométrage, la nuit : la bakélite sombre et le reflet orangé des tubes.
    c.fillStyle = '#110b08';
    c.fillRect(0, 0, G.w, G.h);
    const disque = (x, y, q) => {
      for (let dy = -q; dy <= q; dy++) {
        const w = Math.floor(Math.sqrt(q * q - dy * dy + q * 0.6));
        c.fillRect(x - w, y + dy, 2 * w + 1, 1);
      }
    };
    // Chaque cycle, une enchère : 3, 2, 1, le temps file, les doigts lâchent un à un, le dernier remporte le jeton.
    const cycle = 7.2;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const ARRETS = [84, 127, 61, 103, 92];
    const LACHERS = [
      [0.3, 0.62, 1, 0.45, 0.8],
      [0.7, 0.2, 0.5, 1, 0.85],
      [1, 0.4, 0.75, 0.15, 0.6],
      [0.55, 0.9, 0.25, 0.7, 1],
      [0.8, 1, 0.35, 0.6, 0.1],
    ];
    const lache = LACHERS[n % LACHERS.length];
    const DEBUT = 0.27;
    const FIN = 0.78;
    const compte = p < DEBUT;
    const fige = p >= FIN;
    const course = Math.max(0, Math.min(1, (p - DEBUT) / (FIN - DEBUT)));
    const dixiemes = Math.round(course * ARRETS[n % ARRETS.length]);
    const sec = `${String(Math.floor(dixiemes / 10)).padStart(2, '0')}.${dixiemes % 10}`;
    // Le tableau en haut, les boutons en dessous ; sur un mur trop bas, le tableau seul.
    const boutons = z.ah >= 18;
    const hb = boutons ? Math.floor(z.ah * 0.58) : z.ah;
    const mot = largeur(`00:${sec}`) + 4 <= z.aw ? `00:${sec}` : sec;
    const e = Math.max(1, Math.min(Math.floor((z.aw - 4) / largeur(mot)), Math.floor((hb - 2) / 9)));
    const x0 = Math.round(z.ax + (z.aw - largeur(mot, e)) / 2);
    const y0 = Math.round(z.ay + (hb - 7 * e) / 2);
    [...mot].forEach((ch, i) => {
      if (ch === ':' || ch === '.') return;
      c.fillStyle = '#1d120b';
      c.fillRect(x0 + i * 6 * e - 1, y0 - e, 5 * e + 2, 9 * e);
      c.fillStyle = '#2c190d';
      texte(c, '8', x0 + i * 6 * e, y0, e);
    });
    // Les chiffres rougeoient ; pendant le compte à rebours, le tableau attend, éteint ; à l'arrêt, il clignote.
    c.fillStyle = compte ? '#5a2a10' : fige && p < FIN + 0.08 && Math.floor(t * 8) % 2 === 0 ? '#6e3412' : '#ffab4d';
    texte(c, mot, x0, y0, e);
    if (compte && p > 0.03) {
      const k = 3 - Math.min(2, Math.floor(((p - 0.03) / (DEBUT - 0.03)) * 3));
      const eg = Math.max(1, Math.min(Math.floor((hb - 2) / 8), e + 1));
      const gx = Math.round(z.ax + (z.aw - 5 * eg) / 2);
      const gy = Math.round(z.ay + (hb - 7 * eg) / 2);
      c.fillStyle = '#110b08';
      c.fillRect(gx - eg - 1, gy - eg - 1, 7 * eg + 2, 9 * eg + 2);
      c.fillStyle = '#26170e';
      c.fillRect(gx - 1, gy - eg, 5 * eg + 2, 9 * eg);
      detoure(c, String(k), gx, gy, eg, '#ffd2a0');
    }
    // Les boutons rouges cerclés de laiton : allumés tant que le doigt tient.
    if (boutons) {
      const hz = z.ah - hb;
      const r = Math.max(1, Math.min(Math.floor(z.aw / 14), Math.floor((hz - 3) / 2.4)));
      const cy = Math.round(z.ay + hb + hz / 2);
      lache.forEach((l, i) => {
        const cx = Math.round(z.ax + (z.aw / 5) * (i + 0.5));
        const tient = compte ? p > 0.02 + i * 0.012 : !fige && course < l;
        const gagne = fige && l === 1;
        c.fillStyle = '#000';
        disque(cx, cy + 1, r + 1);
        c.fillStyle = '#c9a25a';
        disque(cx, cy, r + 1);
        c.fillStyle = gagne ? (Math.floor(t * 6) % 2 ? '#ffd2a0' : '#ff8a2b') : tient ? '#ff4a2e' : '#4a1a12';
        disque(cx, cy, r);
        if (tient && r >= 2) {
          c.fillStyle = '#ffc2b0';
          c.fillRect(cx - Math.ceil(r / 2), cy - Math.ceil(r / 2), 1, 1);
        }
      });
    }
    // Le tampon du commissaire-priseur, posé sur le tableau.
    if (fige && p > FIN + 0.06 && p < 0.97) {
      const titre = 'ADJUGE';
      const es = Math.max(1, Math.min(Math.floor((z.aw - 6) / largeur(titre)), Math.floor((hb - 4) / 9)));
      const w = largeur(titre, es);
      const sx = Math.round(z.ax + (z.aw - w) / 2);
      const sy = Math.round(z.ay + (hb - 7 * es) / 2);
      c.fillStyle = '#110b08';
      c.fillRect(sx - 3, sy - 3, w + 6, 7 * es + 6);
      c.fillStyle = '#ff5a3c';
      c.fillRect(sx - 3, sy - 3, w + 6, 1);
      c.fillRect(sx - 3, sy + 7 * es + 2, w + 6, 1);
      c.fillRect(sx - 3, sy - 3, 1, 7 * es + 6);
      c.fillRect(sx + w + 2, sy - 3, 1, 7 * es + 6);
      texte(c, titre, sx, sy, es);
    }
    nom(c, ['TIME', 'AUCTION'], ['#f3e7d3', '#ffb35c'], z);
    bandeau(c, 'GARDE LE DOIGT APPUYE : LE DERNIER A LACHER GAGNE LE JETON, ET TOUT LE MONDE PAIE LE TEMPS TENU.     ', G.sur - 10, 1, '#ffab4d', 28, t);
  },
  zoo(c, t) {
    const z = zones(['ZOO']);
    const q = Math.max(2, Math.floor(Math.min(z.aw, z.ah - 2) / 5));
    const gx = Math.round(z.ax + (z.aw - 5 * q) / 2);
    const gy = Math.round(z.ay + (z.ah - 5 * q) / 2);
    // La salle de jeux la nuit : le papier peint à rayures menthe, à peine éclairé.
    c.fillStyle = '#0a1511';
    c.fillRect(0, 0, G.w, G.h);
    c.fillStyle = '#0e1d17';
    for (let x = 0; x < G.w; x += 6) c.fillRect(x, 0, 3, G.sur);
    // Le casier de hêtre et ses vingt-cinq cases.
    const b = q >= 5 ? 2 : 1;
    c.fillStyle = '#7a5530';
    c.fillRect(gx - b, gy - b, 5 * q + 2 * b, 5 * q + 2 * b);
    c.fillStyle = '#3a2614';
    c.fillRect(gx, gy, 5 * q, 5 * q);
    const creux = q >= 3 ? q - 1 : q;
    c.fillStyle = '#1b1109';
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) c.fillRect(gx + i * q, gy + j * q, creux, creux);
    // Les cubes peints : serpent, perroquet, éléphant, lion, singe, avec leur autocollant clair au milieu.
    const TEINTES = { S: ['#3faa55', '#23793a'], P: ['#e8473b', '#a92a22'], E: ['#3c7fd8', '#24569e'], L: ['#f6b326', '#b97f0c'], M: ['#9058c8', '#633695'] };
    const cube = (x, y, a) => {
      const [teinte, ombre] = TEINTES[a];
      c.fillStyle = teinte;
      c.fillRect(x, y, creux, creux);
      if (q >= 4) {
        c.fillStyle = ombre;
        c.fillRect(x, y + creux - 1, creux, 1);
        c.fillRect(x + creux - 1, y, 1, creux);
        const f = Math.max(1, Math.round(creux * 0.4));
        c.fillStyle = '#fff3dc';
        c.fillRect(x + Math.floor((creux - f) / 2), y + Math.floor((creux - f) / 2), f, f);
      }
    };
    // Trois lots de quatre, chacun lâché colonne par colonne ; les cubes tombent tout en bas.
    // Le serpent, le perroquet et l'éléphant finissent en diagonale : la suite est alignée. Un cycle sur deux, en miroir.
    const LOTS = [
      [[2, 'L'], [1, 'M'], [0, 'S'], [4, 'P']],
      [[2, 'M'], [3, 'L'], [1, 'P'], [4, 'E']],
      [[3, 'S'], [0, 'L'], [2, 'E'], [3, 'M']],
    ];
    const SUITE = [[0, 0], [1, 1], [2, 2]];
    const cycle = 7.6;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const miroir = n % 2 === 1;
    const col = (i) => (miroir ? 4 - i : i);
    const sortie = Math.max(0, Math.min(1, (p - 0.93) / 0.07));
    const fuite = Math.round(sortie * sortie * (G.sur - gy + 2));
    const haut = [0, 0, 0, 0, 0];
    c.save();
    c.beginPath();
    c.rect(gx, 0, 5 * q, gy + 5 * q);
    c.clip();
    LOTS.forEach((lot, l) => {
      lot.forEach(([i, a], k) => {
        const rang = haut[i]++;
        const chute = Math.max(0, Math.min(1, (p - 0.04 - l * 0.2 - k * 0.045) / 0.045));
        if (chute === 0) return;
        const y = gy + (4 - rang) * q;
        const depart = -q;
        cube(gx + col(i) * q, Math.round(depart + (y - depart) * chute * chute) + fuite, a);
      });
    });
    c.restore();
    // La suite s'allume : les trois cases s'encadrent en clignotant, un trait les relie, et « +1 » s'affiche.
    if (p > 0.66 && sortie === 0 && (p > 0.72 || Math.floor(t * 10) % 2 === 0)) {
      c.fillStyle = '#ffe07a';
      const centres = SUITE.map(([i, r]) => [gx + col(i) * q + Math.floor(creux / 2), gy + (4 - r) * q + Math.floor(creux / 2)]);
      SUITE.forEach(([i, r]) => {
        const x = gx + col(i) * q;
        const y = gy + (4 - r) * q;
        c.fillRect(x - 1, y - 1, creux + 2, 1);
        c.fillRect(x - 1, y + creux, creux + 2, 1);
        c.fillRect(x - 1, y, 1, creux);
        c.fillRect(x + creux, y, 1, creux);
      });
      const [x1, y1] = centres[0];
      const [x2, y2] = centres[2];
      const pas = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      const e = q >= 8 ? 2 : 1;
      c.fillStyle = '#fff3dc';
      for (let s = 0; s <= pas; s++) c.fillRect(Math.round(x1 + ((x2 - x1) * s) / pas), Math.round(y1 + ((y2 - y1) * s) / pas), e, e);
      // « +1 » flotte au-dessus de l'éléphant, dans la rangée vide du milieu : la colonne du centre ne bouge pas en miroir.
      if (p > 0.76 && 3 * q >= largeur('+1') + 2) {
        const eg = Math.max(1, Math.min(Math.floor((3 * q - 2) / largeur('+1')), Math.floor(q / 7)));
        const cx = gx + 2 * q + creux / 2;
        const cy = gy + q + creux / 2;
        detoure(c, '+1', Math.round(cx - largeur('+1', eg) / 2), Math.round(cy - (7 * eg) / 2), eg, '#ffe07a');
      }
    }
    // Le nom, en trois cubes comme le logo du jeu : Z rouge, O jaune, O vert.
    const h = 9 * z.e;
    const x0 = Math.round(z.tx - largeur('ZOO', z.e) / 2);
    const y0 = Math.round(z.ty - h / 2 + z.e);
    ['#ff6b5a', '#ffc93c', '#5fd27a'].forEach((couleur, k) => detoure(c, 'ZOO'[k], x0 + k * 6 * z.e, y0, z.e, couleur));
    bandeau(c, 'MISE EN SECRET AU GUICHET, LE LOT LE MOINS CHER PART, ALIGNE TA SUITE DE TROIS ANIMAUX.     ', G.sur - 10, 1, '#9ef0cf', 28, t);
  },
  secretnumber(c, t) {
    const z = zones(['SECRET', 'NUMBER']);
    // Le plan du réseau, la nuit : fond d'encre et quadrillage à peine visible.
    c.fillStyle = '#0b0c10';
    c.fillRect(0, 0, G.w, G.h);
    c.fillStyle = '#14161c';
    for (let x = 2; x < G.w; x += 5) c.fillRect(x, 0, 1, G.sur);
    for (let y = 2; y < G.sur; y += 5) c.fillRect(0, y, G.w, 1);
    const disque = (x, y, q) => {
      for (let dy = -q; dy <= q; dy++) {
        const w = Math.floor(Math.sqrt(q * q - dy * dy + q * 0.6));
        c.fillRect(x - w, y + dy, 2 * w + 1, 1);
      }
    };
    const trait = (a, b, part, e) => {
      const pas = Math.max(1, Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      for (let s = 0; s <= Math.round(pas * part); s++) c.fillRect(Math.round(a.x + ((b.x - a.x) * s) / pas) - (e >> 1), Math.round(a.y + ((b.y - a.y) * s) / pas) - (e >> 1), e, e);
    };
    const TEINTES = { plus: '#ff5a44', fois: '#4f8dff', divise: '#1fc48f', zero: '#ffd23a' };
    // Chaque cycle, trois contacts : deux stations donnent le même ticket, leur ligne s'allume à sa couleur
    // et le tableau du centre affiche le résultat. Puis les palettes tournent et dévoilent un numéro secret.
    const CYCLES = [
      { contacts: [[0, 2, 'plus', '87'], [3, 5, 'divise', '4'], [4, 0, 'fois', '6']], secret: '42' },
      { contacts: [[1, 3, 'zero', '2'], [0, 4, 'plus', '63'], [2, 4, 'fois', '8']], secret: '17' },
      { contacts: [[5, 1, 'fois', '5'], [2, 0, 'zero', '3'], [3, 1, 'plus', '91']], secret: '76' },
    ];
    const cycle = 8;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const C = CYCLES[n % CYCLES.length];
    const debut = (k) => 0.05 + k * 0.22;
    const k = C.contacts.findIndex((_, i) => p >= debut(i) && p < debut(i) + 0.19);
    const avance = k >= 0 ? (p - debut(k)) / 0.19 : 0;
    const cx = Math.round(z.ax + z.aw / 2);
    const cy = Math.round(z.ay + z.ah / 2);
    const R = Math.floor(Math.min(z.aw, z.ah) / 2) - 1;
    // Sur un mur trop bas, le tableau seul ; plus bas encore, le nom seul.
    const plan = R >= 12;
    const tableau = plan || z.ah >= 9;
    if (plan) {
      const st = Array.from({ length: 6 }, (_, i) => {
        const a = Math.PI / 2 + (i * Math.PI) / 3;
        return { x: Math.round(cx + Math.cos(a) * R), y: Math.round(cy + Math.sin(a) * R) };
      });
      c.fillStyle = '#3a3d46';
      const tour = Math.max(60, R * 7);
      for (let i = 0; i < tour; i++) {
        const a = (i / tour) * Math.PI * 2;
        c.fillRect(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), 1, 1);
        if (R >= 18) c.fillRect(Math.round(cx + Math.cos(a) * (R - 1)), Math.round(cy + Math.sin(a) * (R - 1)), 1, 1);
      }
      const [a, b, type] = k >= 0 ? C.contacts[k] : [];
      if (k >= 0) {
        c.fillStyle = TEINTES[type];
        trait(st[a], st[b], Math.min(1, avance / 0.35), R >= 22 ? 2 : 1);
      }
      // Les stations : un rond de papier ; les deux en contact s'allument, la sienne (en bas) se dévoile à la fin.
      const rs = Math.max(1, Math.round(R / 10));
      st.forEach((s, i) => {
        const lit = k >= 0 && (i === a || i === b) && avance > 0.3;
        const moi = i === 0 && p >= 0.8;
        c.fillStyle = moi ? '#ffe14a' : '#f1ede4';
        disque(s.x, s.y, rs + 1);
        if (rs >= 2) {
          c.fillStyle = lit ? TEINTES[type] : moi ? '#ffe14a' : '#0b0c10';
          disque(s.x, s.y, rs - 1);
        } else if (lit) {
          c.fillStyle = TEINTES[type];
          c.fillRect(s.x, s.y, 1, 1);
        }
      });
    }
    // Le tableau d'affichage : deux palettes, « ?? » le plus souvent.
    const e = Math.max(1, plan ? Math.floor((R * 1.05 - 3) / 11) : Math.min(Math.floor((z.aw - 3) / 11), Math.floor((z.ah - 1) / 9)));
    const x0 = Math.round(cx - (11 * e + 3) / 2 + 1);
    const y0 = Math.round(cy - (7 * e) / 2);
    let mot = '??';
    let couleur = '#cfc9bb';
    if (k >= 0 && avance > 0.35) {
      mot = C.contacts[k][3].padStart(2, ' ');
      couleur = TEINTES[C.contacts[k][2]];
    } else if (p >= 0.74 && p < 0.8) {
      mot = `${Math.floor(t * 17) % 10}${Math.floor(t * 23 + 4) % 10}`;
      couleur = '#f1ede4';
    } else if (p >= 0.8) {
      mot = C.secret;
      couleur = p < 0.86 && Math.floor(t * 8) % 2 ? '#fff6c8' : '#ffe14a';
    }
    if (tableau) [...mot].forEach((ch, i) => {
      const x = x0 + i * (6 * e + 1);
      c.fillStyle = '#232731';
      c.fillRect(x - 1, y0 - e, 5 * e + 2, 9 * e);
      c.fillStyle = couleur;
      texte(c, ch, x, y0, e);
      c.fillStyle = '#050608';
      c.fillRect(x - 1, y0 + Math.floor(3.5 * e), 5 * e + 2, 1);
    });
    nom(c, ['SECRET', 'NUMBER'], ['#f1ede4', '#ffe14a'], z);
    bandeau(c, "PERSONNE NE CONNAIT SON NUMERO : DONNE LE MEME TICKET QU'UN AUTRE, NOTE LE RESULTAT ET DEVINE TOUT LE MONDE.     ", G.sur - 10, 1, '#ffe14a', 28, t);
  },
  loupgarou(c, t) {
    const z = zones(['LOUP', 'GAROU']);
    // Une nuit en neuf secondes : le loup hurle, le village ferme les yeux, deux cartes changent de place,
    // la carte du milieu se retourne sur un Loup-Garou, puis l'aube rosit le ciel et les fenêtres se rallument.
    const cycle = 9;
    const p = (t % cycle) / cycle;
    const lisse = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const hasard = (n) => {
      const s = Math.sin(n * 91.345) * 47453.13;
      return s - Math.floor(s);
    };
    const aube = lisse((p - 0.8) / 0.12);
    const gy = z.ay + z.ah - Math.max(2, Math.round(z.ah * 0.12));
    c.fillStyle = '#0b0914';
    c.fillRect(0, 0, G.w, G.h);
    // Le ciel du jeu, de l'indigo à l'horizon violet ; à l'aube, du mauve à l'orangé.
    const NUIT = [[16, 14, 40], [39, 34, 87], [64, 54, 120]];
    const AUBE = [[42, 37, 89], [122, 74, 108], [233, 162, 90]];
    const teinte = (pal, k) => (k < 0.55 ? pal[0].map((v, i) => v + ((pal[1][i] - v) * k) / 0.55) : pal[1].map((v, i) => v + ((pal[2][i] - v) * (k - 0.55)) / 0.45));
    for (let y = 0; y < gy; y++) {
      const k = Math.min(1, y / Math.max(1, gy - 1));
      const a = teinte(NUIT, k);
      const b = teinte(AUBE, k);
      c.fillStyle = `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * aube)).join(',')})`;
      c.fillRect(0, y, G.w, 1);
    }
    // Les étoiles scintillent et s'effacent au lever du jour.
    const nb = Math.floor((G.w * gy) / 70);
    for (let i = 0; i < nb; i++) {
      const x = Math.floor(hasard(i + 1) * G.w);
      const y = Math.floor(hasard(i * 1.7 + 3) * (gy - 3));
      const b = 0.5 + 0.5 * Math.sin(t * 1.7 + i * 2.3);
      c.fillStyle = `rgba(246,231,191,${((0.2 + 0.65 * b) * (1 - aube)).toFixed(3)})`;
      c.fillRect(x, y, 1, 1);
    }
    const disque = (x, y, q) => {
      for (let dy = -q; dy <= q; dy++) {
        const w = Math.floor(Math.sqrt(q * q - dy * dy + q * 0.6));
        c.fillRect(x - w, y + dy, 2 * w + 1, 1);
      }
    };
    // La lune, avec son halo et ses cratères ; elle descend et pâlit à l'aube.
    // Sur un mur très bas (petit téléphone), seuls le ciel et une petite lune tiennent au-dessus du nom.
    const bas = z.ah < 12;
    const mr = bas ? 2 : Math.max(3, Math.round(Math.min(z.aw, z.ah) * 0.17));
    const mx = z.ax + Math.round(z.aw * 0.82);
    const my = bas ? z.ay + 1 : z.ay + Math.round(z.ah * 0.25 + aube * z.ah * 0.3);
    c.globalAlpha = 1 - aube * 0.85;
    c.fillStyle = 'rgba(246,231,191,0.13)';
    disque(mx, my, mr + Math.max(2, Math.round(mr / 3)));
    c.fillStyle = '#f6e7bf';
    disque(mx, my, mr);
    if (mr >= 5) {
      c.fillStyle = '#e3cf9c';
      disque(mx - Math.round(mr * 0.35), my - Math.round(mr * 0.2), Math.max(1, Math.round(mr * 0.22)));
      disque(mx + Math.round(mr * 0.3), my + Math.round(mr * 0.35), Math.max(1, Math.round(mr * 0.14)));
      c.fillRect(mx + Math.round(mr * 0.25), my - Math.round(mr * 0.5), 1, 1);
    }
    c.globalAlpha = 1;
    // Le sol, en une colline douce sur toute la largeur.
    c.fillStyle = '#0b0914';
    for (let x = 0; x < G.w; x++) {
      const y = gy + Math.round(Math.sin(x * 0.07 + 1) * 1.2);
      c.fillRect(x, y, 1, G.h - y);
    }
    // Le village : des maisons et un clocher ; chaque fenêtre s'éteint quand tout le monde ferme les yeux.
    const s = Math.max(1, Math.floor(z.ah / 40));
    // Sur un mur bas (téléphone), le village se tasse pour laisser le ciel à la lune et aux cartes.
    const hs = Math.min(s, (z.ah * 0.55) / 19);
    const MAISONS = [[0.5, 7, 6], [0.6, 3, 13, true], [0.69, 9, 8], [0.8, 5, 5], [0.88, 7, 7], [0.96, 5, 5]];
    if (!bas) MAISONS.forEach(([fx, w0, h0, clocher], i) => {
      const w = w0 * s;
      const h = Math.max(2, Math.round(h0 * hs));
      const x = z.ax + Math.round(z.aw * fx) - (w >> 1);
      if (x + w > z.ax + z.aw + 2) return;
      c.fillStyle = '#0b0914';
      c.fillRect(x, gy - h, w, h + 2);
      const toit = clocher ? Math.max(2, Math.round(4 * hs)) : Math.ceil(w / 2);
      for (let r = 0; r < toit; r++) {
        const retrait = clocher ? Math.floor((r * w) / (2 * toit)) : r;
        if (w - 2 * retrait > 0) c.fillRect(x + retrait, gy - h - 1 - r, w - 2 * retrait, 1);
      }
      const fleche = Math.max(1, Math.round(2 * hs));
      if (clocher) c.fillRect(x + (w >> 1), gy - h - toit - fleche, 1, fleche);
      const eteinte = p >= 0.3 + i * 0.025 && p < 0.88 + i * 0.012;
      c.fillStyle = eteinte ? '#221d38' : '#ffcf7a';
      const fy = gy - Math.round(h * (clocher ? 0.7 : 0.6));
      c.fillRect(x + Math.floor((w - s) / 2), fy, s, s);
      if (!clocher && w0 >= 7 && h >= 6) c.fillRect(x + Math.floor(w / 4) - (s >> 1), gy - Math.round(h * 0.3) - s, s, s);
    });
    // Le loup, assis sur la colline, lève la tête et hurle à la lune.
    if (z.ah >= 17 && z.aw >= 40) {
      const ws = Math.max(1, Math.floor(z.ah / 28));
      const CORPS = ['....#####.....', '....#####.....', '...######.....', '...#######....', '..########....', '..#####.##....', '.######.##....', '.######.##....', '#######.##....', '###.###.###...'];
      const HURLE = ['..........#...', '.........##...', '...#....###...', '...##..###....', '...#######....', '....#####.....', '....####......'];
      const ASSIS = ['..............', '..............', '...#..........', '...##.........', '...######.....', '...#########..', '....#####.....'];
      const hurle = p >= 0.1 && p < 0.3;
      const wx = z.ax + 2;
      const wy = gy - 16 * ws + 1;
      c.fillStyle = '#0b0914';
      [...(hurle ? HURLE : ASSIS), ...CORPS].forEach((r, j) => {
        for (let i = 0; i < r.length; i++) if (r[i] === '#') c.fillRect(wx + i * ws, wy + j * ws, ws, ws);
      });
      if (!hurle) {
        c.fillStyle = p >= 0.46 && p < 0.8 && Math.floor(t * 3) % 4 ? '#ffe9b8' : '#ffd36a';
        c.fillRect(wx + 6 * ws, wy + 4 * ws, ws, ws);
      } else {
        // Le hurlement : des ondes qui partent du museau vers la lune.
        const bx = wx + 11 * ws;
        const by = wy;
        for (let k = 0; k < 3; k++) {
          const d = (((t * 10) % 4) + k * 4) * ws + 2;
          c.fillStyle = `rgba(246,231,191,${Math.max(0, 0.75 - d / (16 * ws)).toFixed(3)})`;
          for (let j = -ws - 1; j <= ws + 1; j++) c.fillRect(Math.round(bx + d * 0.7 + j * 0.7), Math.round(by - d * 0.7 + j * 0.7), 1, 1);
        }
      }
    }
    // Les cartes de la nuit : les deux du bord s'échangent, celle du milieu se retourne sur un Loup-Garou.
    if (z.ah >= 18) {
      const cs = Math.max(1, Math.floor(z.ah / 30));
      const cw = 5 * cs + 2;
      const ch = 7 * cs + 2;
      const pas = cw + cs + 1;
      const ccx = z.ax + Math.round(z.aw * 0.5);
      const ccy = z.ay + Math.round(z.ah * 0.45);
      const vu = Math.min(1, (p - 0.46) / 0.05, (0.84 - p) / 0.05);
      const TETE_LOUP = ['#...#', '##.##', '#####', '#.#.#', '#####', '.###.', '..#..'];
      if (vu > 0) {
        c.globalAlpha = vu;
        const f = lisse((p - 0.52) / 0.12);
        const tourne = lisse((p - 0.67) / 0.06);
        [0, 2, 1].forEach((i) => {
          let x = ccx + (i - 1) * pas;
          let y = ccy - Math.round((1 - lisse(vu)) * 3 * cs);
          let large = cw;
          let face = false;
          if (i !== 1) {
            const sens = i === 0 ? 1 : -1;
            x += Math.round(sens * 2 * pas * f);
            y -= Math.round(Math.sin(Math.PI * f) * ch * 0.7 * sens);
          } else {
            large = Math.max(1, Math.round(cw * Math.abs(1 - 2 * tourne)));
            face = tourne >= 0.5;
            if (face && p < 0.8) {
              const halo = 0.5 + 0.5 * Math.sin(t * 6);
              c.fillStyle = `rgba(207,74,67,${(0.25 + 0.25 * halo).toFixed(3)})`;
              c.fillRect(x - (large >> 1) - cs, y - (ch >> 1) - cs, large + 2 * cs, ch + 2 * cs);
            }
          }
          const x0 = x - (large >> 1);
          const y0 = y - (ch >> 1);
          c.fillStyle = face ? '#f7ecd6' : '#f2c27a';
          c.fillRect(x0, y0, large, ch);
          if (face) {
            if (large >= cw - 1) {
              c.fillStyle = '#cf4a43';
              TETE_LOUP.forEach((r, j) => {
                for (let k = 0; k < 5; k++) if (r[k] === '#') c.fillRect(x0 + 1 + k * cs, y0 + 1 + j * cs, cs, cs);
              });
            }
          } else if (large > 2) {
            c.fillStyle = '#25214c';
            c.fillRect(x0 + 1, y0 + 1, large - 2, ch - 2);
            if (large >= cw - 1) {
              c.fillStyle = '#f6e7bf';
              c.fillRect(x0 + 1 + 2 * cs, y0 + 1 + 3 * cs, cs, cs);
            }
          }
        });
        c.globalAlpha = 1;
      }
    }
    nom(c, ['LOUP', 'GAROU'], ['#f6e7bf', '#f2c27a'], z);
    bandeau(c, "LA NUIT, CHACUN RECOIT UN ROLE ET LES CARTES CHANGENT DE MAIN. AU MATIN, UN SEUL VOTE : TROUVE LE LOUP-GAROU.     ", G.sur - 10, 1, '#f2c27a', 28, t);
  },
  ito(c, t) {
    const z = zones(['ITO']);
    // Un matin de lessive en dix secondes : les cartes s'accrochent une à une sur la corde, de dos, au vichy de leur pince ;
    // puis on les retourne de gauche à droite. Bien rangées, le soleil rit et des confettis tombent ; sinon, deux cartes rougissent.
    const cycle = 10;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const lisse = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const hasard = (k) => {
      const s = Math.sin(k * 78.233) * 43758.545;
      return s - Math.floor(s);
    };
    const disque = (x, y, q) => {
      for (let dy = -q; dy <= q; dy++) {
        const w = Math.floor(Math.sqrt(q * q - dy * dy + q * 0.6));
        c.fillRect(x - w, y + dy, 2 * w + 1, 1);
      }
    };
    // Le ciel du matin, plus pâle vers l'horizon, et l'herbe du jardin sous le nom.
    const gy = z.ay + z.ah - 1;
    for (let y = 0; y < G.h; y++) {
      const k = Math.min(1, y / Math.max(1, gy));
      c.fillStyle = `rgb(${Math.round(78 + 70 * k)},${Math.round(152 + 50 * k)},${Math.round(214 + 22 * k)})`;
      c.fillRect(0, y, G.w, 1);
    }
    const herbe = G.sur - 13;
    for (let x = 0; x < G.w; x++) {
      const y = herbe + Math.round(Math.sin(x * 0.05 + 2) * 1.5);
      c.fillStyle = '#4f9a3a';
      c.fillRect(x, y, 1, G.h - y);
      c.fillStyle = '#7cc25a';
      c.fillRect(x, y, 1, 1);
    }
    const SERIES = [
      { n: [12, 37, 64, 81, 95], casse: -1 },
      { n: [9, 41, 33, 70, 88], casse: 1 },
      { n: [6, 28, 52, 77, 93], casse: -1 },
    ];
    const S = SERIES[n % SERIES.length];
    // Le soleil, dans un coin ; il grossit un peu quand la corde est bien rangée.
    const gagne = S.casse < 0 && p >= 0.74 && p < 0.95;
    const sr = Math.max(2, Math.round(Math.min(z.aw, z.ah) * 0.12)) + (gagne ? 1 : 0);
    const sx = z.ax + z.aw - sr - 2;
    const sy = z.ay + sr + 1;
    c.fillStyle = 'rgba(255,222,110,0.28)';
    disque(sx, sy, sr + Math.max(2, Math.round(sr / 2)));
    c.fillStyle = '#ffd45c';
    disque(sx, sy, sr);
    // Les cartes : deux chiffres par carte quand le mur est assez haut ; sinon de petites cartes sans chiffres.
    // Des chiffres aussi gros que possible, tant que trois cartes tiennent sur la corde.
    const e = Math.max(1, Math.min(Math.floor(z.ah / 28), Math.floor(((z.aw - 4) / 3 - 4) / 15)));
    const chiffres = z.ah >= 26 && z.aw >= 60;
    // La corde : d'un piquet à l'autre, avec une flèche au milieu ; sur un mur bas, tout en haut pour laisser les cartes pendre.
    const ry = z.ay + (chiffres ? Math.max(2, Math.round(z.ah * 0.2)) : 2);
    const fl = chiffres ? Math.max(1, Math.round(z.ah * 0.08)) : 1;
    const cw = chiffres ? 11 * e + 4 : Math.max(4, Math.min(12, Math.floor((gy - ry - fl - 3) / 1.35)));
    const ch = Math.round(cw * 1.35);
    const nb = Math.max(2, Math.min(5, Math.floor((z.aw - 4) / (cw + (chiffres ? 4 * e : 3)))));
    const pas = Math.floor((z.aw - 4) / nb);
    const x0 = z.ax + 2 + Math.floor((pas - cw) / 2);
    const corde = (x) => {
      const u = (x - z.ax) / Math.max(1, z.aw) - 0.5;
      return Math.round(ry + fl * (1 - 4 * u * u));
    };
    // Le nom : trois lettres aux couleurs des pinces, et le bandeau.
    const finir = () => {
      const hn = 9 * z.e;
      const nx = Math.round(z.tx - largeur('ITO', z.e) / 2);
      const ny = Math.round(z.ty - hn / 2 + z.e);
      ['#ff6b5a', '#ffd45c', '#fffdf6'].forEach((couleur, k) => detoure(c, 'ITO'[k], nx + k * 6 * z.e, ny, z.e, couleur));
      bandeau(c, 'TOUT LE MONDE A UNE CARTE DE 1 A 100 : DECRIS-LA AVEC UNE IDEE DU THEME, SANS DIRE LE NOMBRE, ET RANGEZ LA CORDE ENSEMBLE.     ', G.sur - 10, 1, '#ff9e7a', 28, t);
    };
    if (ry + fl + ch + 2 > gy) return finir();
    c.fillStyle = '#7a5530';
    c.fillRect(z.ax, ry - 2, 1, herbe - ry + 3);
    c.fillRect(z.ax + z.aw - 1, ry - 2, 1, herbe - ry + 3);
    for (let x = z.ax; x < z.ax + z.aw; x++) {
      c.fillStyle = x % 3 ? '#c39457' : '#a8773e';
      c.fillRect(x, corde(x), 1, 1);
    }
    const PINCES = ['#e8453c', '#f2c230', '#3a8ee6', '#5fbf4a', '#a45ee0'];
    const faute = (i) => S.casse >= 0 && (i === S.casse || i === S.casse + 1);
    const fin = p >= 0.92 ? 1 - lisse((p - 0.92) / 0.06) : 1;
    c.globalAlpha = fin;
    for (let i = 0; i < nb; i++) {
      const arrive = 0.04 + i * 0.065;
      if (p < arrive) continue;
      const pince = PINCES[(i + n) % PINCES.length];
      const cx = x0 + i * pas + (cw >> 1);
      const top = corde(cx) + 1;
      // Elle tombe du haut, puis rebondit un peu sur la corde.
      const d = Math.min(1, (p - arrive) / 0.06);
      const y = Math.round(top - (1 - lisse(d)) * (top + ch) + (d < 1 ? 0 : Math.round(Math.sin(Math.min(1, (p - arrive - 0.06) / 0.05) * Math.PI) * -1)));
      // Le retournement, de gauche à droite.
      const tour = lisse((p - (0.42 + i * 0.06)) / 0.05);
      const large = Math.max(1, Math.round(cw * Math.abs(1 - 2 * tour)));
      const face = tour >= 0.5;
      const xg = cx - (large >> 1);
      const rouge = face && faute(i) && p >= 0.42 + (S.casse + 1) * 0.06 + 0.05;
      if (face) {
        c.fillStyle = rouge ? '#ffd9d3' : '#fffdf6';
        c.fillRect(xg, y, large, ch);
        c.fillStyle = rouge ? '#e0402f' : gagne && Math.floor(t * 4) % 2 ? '#2f9e57' : '#c9bfa8';
        c.fillRect(xg, y + ch - 1, large, 1);
        if (rouge) {
          c.fillRect(xg, y, 1, ch);
          c.fillRect(xg + large - 1, y, 1, ch);
          c.fillRect(xg, y, large, 1);
        }
        if (chiffres && large >= cw - 1) {
          c.fillStyle = rouge ? '#e0402f' : '#1f3550';
          const nombre = String(S.n[i]);
          texte(c, nombre, xg + Math.round((large - largeur(nombre, e)) / 2), y + ch - 7 * e - 3, e);
        }
      } else {
        // Le dos : un vichy à la couleur de la pince.
        for (let yy = 0; yy < ch; yy++)
          for (let xx = 0; xx < large; xx++) {
            const a = Math.floor(xx / Math.max(1, e * 2)) % 2;
            const b = Math.floor(yy / Math.max(1, e * 2)) % 2;
            c.fillStyle = a && b ? pince : a || b ? `${pince}99` : '#fffdf6';
            c.fillRect(xg + xx, y + yy, 1, 1);
          }
      }
      // La pince, par-dessus la corde.
      const pw = Math.max(1, Math.round(cw / 6));
      c.fillStyle = pince;
      c.fillRect(cx - (pw >> 1), y - Math.max(2, 2 * e), pw, Math.max(3, 4 * e));
    }
    // L'éclair entre deux cartes à l'envers.
    if (S.casse >= 0 && p >= 0.42 + (S.casse + 1) * 0.06 + 0.05 && p < 0.92 && Math.floor(t * 5) % 3) {
      const bx = x0 + S.casse * pas + cw + Math.floor((pas - cw) / 2);
      const by = corde(bx) + Math.round(ch * 0.3);
      c.fillStyle = '#ffb020';
      const h = Math.max(4, Math.round(ch * 0.45));
      for (let j = 0; j < h; j++) c.fillRect(bx + (j < h / 2 ? -Math.floor(j / 2) : Math.floor((j - h / 2) / 2) - Math.floor(h / 4)), by + j, 2, 1);
    }
    // Les confettis d'une corde bien rangée.
    if (gagne) {
      const COUL = ['#e8453c', '#f2c230', '#3a8ee6', '#5fbf4a', '#fffdf6'];
      const q = (p - 0.74) / 0.21;
      for (let k = 0; k < 26; k++) {
        const fx = z.ax + Math.floor(hasard(k + n * 31) * z.aw);
        const fy = z.ay + Math.floor(((hasard(k * 3.1 + 7) + q * 1.4) % 1.2) * z.ah) - 2;
        if (fy < z.ay || fy > gy) continue;
        c.fillStyle = COUL[k % COUL.length];
        c.fillRect(fx + Math.round(Math.sin(t * 5 + k) * 1.5), fy, 1, 1 + (k % 2));
      }
    }
    c.globalAlpha = 1;
    finir();
  },
  mafia(c, t) {
    const z = zones(['MAFIA', 'DE CUBA']);
    // La Havane, 1957, la nuit sur le patio. La boîte à cigares du Parrain glisse sur la table de chapeau en chapeau,
    // et des diamants s'envolent dans des poches. Puis la lampe s'allume, cherche, s'arrête : les poches se vident.
    const cycle = 10;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const lisse = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    // Le ciel de nuit, sarcelle sombre, sur tout le mur.
    for (let y = 0; y < G.h; y++) {
      const k = Math.min(1, y / Math.max(1, G.sur));
      c.fillStyle = `rgb(${Math.round(9 + 16 * k)},${Math.round(24 + 34 * k)},${Math.round(28 + 30 * k)})`;
      c.fillRect(0, y, G.w, 1);
    }
    // Le carrelage du patio, sous le bandeau : carreaux de ciment sarcelle et terre cuite.
    const sol = G.sur - 13;
    for (let y = sol; y < G.h; y++)
      for (let x = 0; x < G.w; x++) {
        const a = (Math.floor(x / 3) + Math.floor((y - sol) / 3)) % 2;
        c.fillStyle = a ? '#1f6a61' : '#9c4a31';
        c.fillRect(x, y, 1, 1);
      }
    // La guirlande d'ampoules, d'un bord à l'autre, qui scintille.
    const AMPOULES = ['#ffd36a', '#ff8a5c', '#9fe3d6', '#f6ead2'];
    for (let x = 0; x < G.w; x++) {
      const u = x / Math.max(1, G.w - 1) - 0.5;
      const y = 1 + Math.round(2 * (1 - 4 * u * u));
      c.fillStyle = '#2c2a1e';
      c.fillRect(x, y, 1, 1);
      if (x % 5 === 2) {
        const k = Math.floor(x / 5);
        c.fillStyle = Math.sin(t * 2.3 + k * 1.7) > -0.6 ? AMPOULES[k % AMPOULES.length] : '#4a4630';
        c.fillRect(x, y + 1, 1, 1);
      }
    }
    // Quelques étoiles au-dessus du patio, qui scintillent.
    for (let k = 0; k < Math.floor(G.w / 7); k++) {
      const a = Math.sin(k * 78.233) * 43758.545;
      const b = Math.sin(k * 12.9898 + 4.1) * 43758.545;
      if (Math.sin(t * 1.3 + k * 2.1) < -0.3) continue;
      c.fillStyle = k % 3 ? '#5f7f86' : '#c9dde0';
      c.fillRect(Math.floor((a - Math.floor(a)) * G.w), 6 + Math.floor((b - Math.floor(b)) * Math.max(1, G.sur * 0.45)), 1, 1);
    }
    const finir = () => {
      nom(c, ['MAFIA', 'DE CUBA'], ['#ff6ad5', '#f6ead2'], z);
      bandeau(c, "LA BOITE A CIGARES DU PARRAIN FAIT LE TOUR DE LA TABLE ET REVIENT ALLEGEE DE QUELQUES DIAMANTS. A LUI DE TROUVER LES VOLEURS, A TOI DE MENTIR JUSTE.     ", G.sur - 10, 1, '#ff6ad5', 28, t);
    };
    // Sur un mur trop bas, pas de table : le ciel, la guirlande et le nom.
    if (z.ah < 12 || z.aw < 30) return finir();
    // Quatre joueurs derrière la table, en feutre et costume : le Parrain à gauche (feutre crème, cigare), puis trois autres.
    const nb = 4;
    const pas = Math.floor(z.aw / nb);
    const s = Math.max(1, Math.min(Math.floor(z.ah / 14), Math.floor(pas / 9)));
    const table = z.ay + z.ah - 2 * s;
    const px = (i) => z.ax + Math.floor(pas * (i + 0.5));
    // h : feutre, b : ruban, f : visage, y : yeux, s : costume, w : chemise.
    const SILHOUETTE = ['..hhh..', '..bbb..', 'hhhhhhh', '..yfy..', '..fff..', '.sswss.', 'sssssss'];
    const GENS = [
      { h: '#efe3c6', b: '#1d1a17', f: '#d9a47a', s: '#3b3f4a' },
      { h: '#8d939c', b: '#2a9d8f', f: '#a8714a', s: '#2b3346' },
      { h: '#b07c4f', b: '#d63d2f', f: '#e6b98f', s: '#3a2f2a' },
      { h: '#5a78a8', b: '#e9c46a', f: '#8a5634', s: '#2f3b33' },
    ];
    const SERIES = [
      { voleurs: [1, 3], accuse: 3 },
      { voleurs: [2], accuse: 2 },
      { voleurs: [1, 2], accuse: 1 },
    ];
    const S = SERIES[n % SERIES.length];
    const fin = p >= 0.92 ? 1 - lisse((p - 0.92) / 0.06) : 1;
    // La boîte : quatre arrêts, un par chapeau, puis retour au Parrain.
    const arret = (k) => 0.04 + k * 0.12;
    let bx = px(0);
    let ouverte = false;
    let ici = -1;
    for (let k = 0; k < nb; k++) {
      const a = arret(k);
      if (p >= a && p < a + 0.08) {
        bx = px(k);
        ici = k;
        ouverte = k > 0 && p >= a + 0.015 && p < a + 0.065;
      } else if (p >= a + 0.08 && k < nb - 1 && p < arret(k + 1)) bx = Math.round(px(k) + (px(k + 1) - px(k)) * lisse((p - a - 0.08) / 0.04));
    }
    if (p >= arret(nb - 1) + 0.08) bx = Math.round(px(nb - 1) + (px(0) - px(nb - 1)) * lisse((p - arret(nb - 1) - 0.08) / 0.08));
    // Les diamants restés dans la boîte, et ceux qui s'envolent vers une poche.
    const pris = S.voleurs.filter((v) => p >= arret(v) + 0.04).length;
    // La lampe : elle s'allume, balaie les chapeaux, puis s'arrête sur l'accusé.
    const lampe = p >= 0.58 && p < 0.92;
    const cible = p < 0.72 ? px(1) + (px(nb - 1) - px(1)) * (0.5 - 0.5 * Math.cos(((p - 0.58) / 0.14) * Math.PI * 2.5)) : px(S.accuse);
    const lx = z.ax + Math.floor(z.aw / 2);
    const ly = z.ay + s;
    // La lampe suspendue au-dessus de la table : éteinte pendant la tournée de la boîte.
    c.fillStyle = '#2c2a1e';
    c.fillRect(lx, 4, 1, Math.max(0, ly - 4));
    c.fillStyle = '#1f6a61';
    c.fillRect(lx - 2 * s, ly, 4 * s + 1, s);
    c.fillStyle = lampe ? '#ffe9a8' : '#4a4630';
    c.fillRect(lx - s, ly + s, 2 * s + 1, Math.max(1, s >> 1));
    c.globalAlpha = fin;
    if (lampe) {
      const allume = Math.min(1, (p - 0.58) / 0.03);
      c.fillStyle = `rgba(255,226,140,${(0.26 * allume).toFixed(3)})`;
      const hw = 4 * s + 1;
      for (let y = ly + s + 1; y < table; y++) {
        const k = (y - ly) / Math.max(1, table - ly);
        const cx = lx + (cible - lx) * k;
        const w = Math.max(1, Math.round(hw * k));
        c.fillRect(Math.round(cx - w), y, 2 * w + 1, 1);
      }
    }
    // Les joueurs. Celui qui est sous la lampe s'éclaire ; quand elle cherche, les regards suivent.
    const vide = p >= 0.74 && p < 0.92;
    for (let i = 0; i < nb; i++) {
      const x0 = px(i) - Math.floor((7 * s) / 2);
      const y0 = table - 7 * s;
      const eclaire = lampe && Math.abs(cible - px(i)) <= 2 * s;
      const g = GENS[i];
      SILHOUETTE.forEach((r, j) => {
        for (let k = 0; k < 7; k++) {
          const q = r[k];
          if (q === '.') continue;
          c.fillStyle = q === 'h' ? g.h : q === 'b' ? g.b : q === 'f' ? g.f : q === 'w' ? '#f6ead2' : q === 'y' ? '#1d1a17' : eclaire ? '#7a6a48' : g.s;
          c.fillRect(x0 + k * s, y0 + j * s, s, s);
        }
      });
      // Le cigare du Parrain, qui rougeoie.
      if (i === 0) {
        c.fillStyle = '#7a4122';
        c.fillRect(x0 + 5 * s, y0 + 4 * s, s, Math.max(1, s >> 1));
        c.fillStyle = Math.sin(t * 3) > 0 ? '#ff7b3a' : '#c2502a';
        c.fillRect(x0 + 6 * s, y0 + 4 * s, s, Math.max(1, s >> 1));
      }
      // L'accusé vide ses poches : des diamants tombent sur la table, et un « ! » rouge clignote.
      if (vide && i === S.accuse) {
        for (let k = 0; k < 3; k++) {
          const q = (((p - 0.74) / 0.18) * 3 + k / 3) % 1;
          c.fillStyle = k % 2 ? '#bfe9f5' : '#ffffff';
          c.fillRect(x0 + (2 + k) * s, y0 + 5 * s + Math.round(q * 2 * s), s, s);
        }
        if (y0 - 9 >= z.ay && Math.floor(t * 4) % 2) detoure(c, '!', px(i) - 2, y0 - 9, 1, '#ff4d3d');
      }
    }
    // La table, en cèdre.
    c.fillStyle = '#7a4122';
    c.fillRect(z.ax, table, z.aw, s);
    c.fillStyle = '#4e2914';
    c.fillRect(z.ax, table + s, z.aw, s);
    // La boîte à cigares, posée devant le chapeau qui la tient.
    if (p < 0.6) {
      const bw = 8 * s + 2;
      const bh = 3 * s + 2;
      const x0 = bx - (bw >> 1);
      const y0 = table - bh;
      c.fillStyle = '#9a5631';
      c.fillRect(x0, y0, bw, bh);
      c.fillStyle = '#d63d2f';
      c.fillRect(x0, y0 + (bh >> 1), bw, Math.max(1, s));
      c.fillStyle = '#e9c46a';
      c.fillRect(bx - s, y0 + (bh >> 1) - (s >> 1), 2 * s, s + 1);
      if (ouverte) {
        // Le couvercle levé, et les diamants qui restent.
        c.fillStyle = '#c47a4a';
        c.fillRect(x0, y0 - 2 * s - 1, bw, s + 1);
        c.fillStyle = '#2a160c';
        c.fillRect(x0 + 1, y0 - s, bw - 2, s);
        for (let k = 0; k < 5 - pris; k++) {
          c.fillStyle = k % 2 ? '#bfe9f5' : '#ffffff';
          c.fillRect(x0 + 1 + k * 2 * s, y0 - s, s, s);
        }
      }
      // Un diamant s'envole de la boîte vers la poche d'un voleur.
      if (ici > 0 && S.voleurs.includes(ici)) {
        const q = (p - arret(ici) - 0.03) / 0.03;
        if (q > 0 && q < 1) {
          c.fillStyle = '#ffffff';
          c.fillRect(bx + Math.round(Math.sin(q * Math.PI) * 2 * s), Math.round(y0 - 2 * s - Math.sin(q * Math.PI) * 3 * s + q * 4 * s), s, s);
        }
      }
    }
    c.globalAlpha = 1;
    finir();
  },
  frise(c, t) {
    const z = zones(['FRISE']);
    // Une galerie de musée en neuf secondes : trois cartes datées sont posées sur le ruban des époques, une place s'allume,
    // une carte sans date vient s'y glisser, puis sa date s'allume. Juste, elle reste et brille en vert ; fausse, elle rougit et tombe.
    const cycle = 9;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const lisse = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const ERES = ['#e8894a', '#d0628c', '#4f96e0', '#9a7ce6', '#2fbdb5', '#f0c94a'];
    const ere = (y) => (y < 476 ? 0 : y < 1492 ? 1 : y < 1789 ? 2 : y < 1914 ? 3 : y < 2000 ? 4 : 5);
    const SERIES = [
      { ligne: [1789, 1903, 1969], carte: 1889, place: 1 },
      { ligne: [1492, 1789, 1912], carte: 1969, place: 1 },
      { ligne: [1066, 1492, 1889], carte: 1789, place: 2 },
      { ligne: [1903, 1969, 2007], carte: 1928, place: 1 },
    ];
    const S = SERIES[n % SERIES.length];
    const juste = (S.place === 0 || S.ligne[S.place - 1] <= S.carte) && (S.place === S.ligne.length || S.carte <= S.ligne[S.place]);
    // Le mur vert de la galerie, ses lambris, et le nom en bas.
    for (let y = 0; y < G.h; y++) {
      const k = Math.min(1, y / Math.max(1, G.h));
      c.fillStyle = `rgb(${Math.round(24 + 8 * k)},${Math.round(56 - 12 * k)},${Math.round(48 - 8 * k)})`;
      c.fillRect(0, y, G.w, 1);
    }
    c.fillStyle = '#2b5a4c';
    for (let x = 6; x < G.w; x += 14) c.fillRect(x, 0, 1, G.sur - 12);
    const finir = () => {
      const hn = 9 * z.e;
      const nx = Math.round(z.tx - largeur('FRISE', z.e) / 2);
      const ny = Math.round(z.ty - hn / 2 + z.e);
      [...'FRISE'].forEach((l, k) => detoure(c, l, nx + k * 6 * z.e, ny, z.e, k === 4 ? '#fff6e2' : ERES[k + 1]));
      bandeau(c, "CHAQUE CARTE RACONTE UNE INVENTION OU UN EVENEMENT SANS SA DATE : GLISSE-LA A SA PLACE DANS LA FRISE. LE PREMIER QUI N'A PLUS DE CARTE GAGNE.     ", G.sur - 10, 1, '#f0c94a', 28, t);
    };
    // Quatre places sur le ruban : des chiffres aussi gros que possible, tant que quatre cartes y tiennent.
    const e = Math.max(1, Math.min(Math.floor(z.ah / 24), Math.floor((z.aw - 8) / 4 / 27)));
    const chiffres = z.ah >= 22 && z.aw >= 4 * (largeur('1789', 1) + 6);
    const cw = chiffres ? largeur('1789', e) + 4 * e + 2 : Math.max(4, Math.min(14, Math.floor((z.aw - 8) / 5)));
    const ch = chiffres ? 7 * e + 6 + 2 * e : Math.max(3, Math.round(cw * 0.7));
    const ruban = Math.max(2, Math.round(z.ah * 0.07));
    const ry = z.ay + z.ah - ruban - Math.max(2, Math.round(z.ah * 0.12));
    const top = ry - ch - Math.max(2, e * 2);
    if (top < z.ay + 1) return finir();
    const pas = Math.floor(z.aw / 4);
    const xs = [0, 1, 2, 3].map((i) => z.ax + i * pas + Math.floor((pas - cw) / 2));
    // Le ruban des époques, de gauche à droite.
    for (let x = z.ax; x < z.ax + z.aw; x++) {
      c.fillStyle = ERES[Math.min(5, Math.floor(((x - z.ax) / z.aw) * 6))];
      c.fillRect(x, ry, 1, ruban);
    }
    const fin = p >= 0.9 ? 1 - lisse((p - 0.9) / 0.07) : 1;
    c.globalAlpha = fin;
    const carte = (x, y, annee, bord, fond = '#fff6e2') => {
      c.fillStyle = fond;
      c.fillRect(x, y, cw, ch);
      c.fillStyle = bord;
      c.fillRect(x, y, Math.max(1, e), ch);
      if (!chiffres) {
        // Sans place pour les chiffres : deux lignes de texte sur le cartel, en laiton pour la carte sans date.
        c.fillStyle = annee === null ? '#c99a33' : '#8c8670';
        for (let k = 0; k < 2 && 2 + k * 2 < ch - 1; k++) c.fillRect(x + 2, y + 2 + k * 2, Math.max(1, cw - 4 - k * 2), 1);
        return;
      }
      const s = annee === null ? '?' : String(annee);
      c.fillStyle = annee === null ? '#9c7a2c' : '#18302a';
      texte(c, s, x + Math.round((cw - largeur(s, e)) / 2) + Math.max(1, e) - 1, y + Math.round((ch - 7 * e) / 2), e);
    };
    // Les trois cartes déjà posées, chacune sur son point du ruban ; elles laissent la place visée vide.
    const places = [0, 1, 2, 3].filter((i) => i !== S.place);
    S.ligne.forEach((annee, k) => {
      const arrive = 0.03 + k * 0.05;
      if (p < arrive) return;
      const i = places[k];
      const d = lisse((p - arrive) / 0.06);
      c.globalAlpha = fin * d;
      carte(xs[i], top, annee, ERES[ere(annee)]);
      c.fillStyle = ERES[ere(annee)];
      c.fillRect(xs[i] + (cw >> 1) - 1, top + ch, 2, ry - top - ch);
    });
    c.globalAlpha = fin;
    // La place visée clignote en laiton.
    const xp = xs[S.place];
    if (p >= 0.22 && p < 0.5 && Math.floor(t * 4) % 2) {
      c.fillStyle = '#f0c94a';
      for (let x = xp; x < xp + cw; x += 2) {
        c.fillRect(x, top, 1, 1);
        c.fillRect(x, top + ch - 1, 1, 1);
      }
      for (let y = top; y < top + ch; y += 2) {
        c.fillRect(xp, y, 1, 1);
        c.fillRect(xp + cw - 1, y, 1, 1);
      }
    }
    // La carte sans date arrive d'en haut, se pose, puis montre sa date.
    if (p >= 0.3) {
      const d = lisse((p - 0.3) / 0.16);
      let y = Math.round(z.ay - ch + (top - z.ay + ch) * d);
      const montre = p >= 0.56;
      const tombe = !juste && p >= 0.74 ? lisse((p - 0.74) / 0.12) : 0;
      y += Math.round(tombe * (G.h - top));
      const couleur = !montre ? '#f0c94a' : juste ? '#3fd47a' : '#ff5a4a';
      const clignote = montre && p < 0.74 && Math.floor(t * 6) % 2;
      carte(xp, y, montre ? S.carte : null, couleur, montre && !juste ? '#ffd9d3' : '#fff6e2');
      if (clignote) {
        c.fillStyle = couleur;
        c.fillRect(xp - 1, y - 1, cw + 2, 1);
        c.fillRect(xp - 1, y + ch, cw + 2, 1);
        c.fillRect(xp - 1, y - 1, 1, ch + 2);
        c.fillRect(xp + cw, y - 1, 1, ch + 2);
      }
      // Sur un petit mur, la date s'allume au-dessus de la carte posée.
      if (montre && !chiffres && tombe === 0) {
        const s = String(S.carte);
        const lx = Math.max(z.ax, Math.min(z.ax + z.aw - largeur(s, 1), xp + Math.round((cw - largeur(s, 1)) / 2)));
        const ly = Math.max(z.ay, y - 9);
        c.fillStyle = 'rgba(0,0,0,.6)';
        c.fillRect(lx - 1, ly - 1, largeur(s, 1) + 2, 9);
        c.fillStyle = couleur;
        texte(c, s, lx, ly, 1);
      }
      if (montre && juste) {
        c.fillStyle = ERES[ere(S.carte)];
        c.fillRect(xp + (cw >> 1) - 1, top + ch, 2, ry - top - ch);
      }
    }
    c.globalAlpha = 1;
    finir();
  },
  disgrace(c, t) {
    const z = zones(['DISGRACE']);
    // Le salon de la Duchesse en sept secondes : trois Maisons de part et d'autre d'une table dorée, la lumière au-dessus,
    // l'ombre en dessous. Une carte arrive dans une colonne, en haut ou en bas, puis le cachet tombe : + en or (en grâce), - en cire rouge (en disgrâce).
    const cycle = 7;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const lisse = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const MAISONS = ['#e0507e', '#28b4b9', '#6cc062'];
    const SERIES = [
      { col: [[2, 1], [1, 2], [1, 1]], actif: 1, haut: true },
      { col: [[1, 2], [2, 1], [1, 1]], actif: 0, haut: false },
      { col: [[1, 1], [1, 1], [2, 2]], actif: 2, haut: false },
      { col: [[2, 2], [1, 1], [1, 2]], actif: 0, haut: true },
    ];
    const S = SERIES[n % SERIES.length];
    const [hautA, basA] = S.col[S.actif];
    const grace = S.haut ? hautA + 1 > basA : hautA > basA + 1;
    // La lumière du lustre en haut, l'ombre bleue en bas, et un semis de damas d'or.
    const milieu = z.ay + Math.round(z.ah / 2);
    for (let y = 0; y < G.h; y++) {
      if (y < milieu) {
        const k = Math.max(0, 1 - y / Math.max(1, milieu));
        c.fillStyle = `rgb(${Math.round(52 + 60 * k)},${Math.round(22 + 34 * k)},${Math.round(50 + 6 * k)})`;
      } else {
        const k = Math.min(1, (y - milieu) / Math.max(1, G.h - milieu));
        c.fillStyle = `rgb(${Math.round(24 - 8 * k)},${Math.round(28 - 8 * k)},${Math.round(62 - 20 * k)})`;
      }
      c.fillRect(0, y, G.w, 1);
    }
    c.fillStyle = '#7a5a2e';
    for (let y = 2; y < G.sur - 12; y += 8) for (let x = (y / 8) % 2 ? 2 : 6; x < G.w; x += 8) c.fillRect(x, y, 1, 1);
    const finir = () => {
      const hn = 9 * z.e;
      const nx = Math.round(z.tx - largeur('DISGRACE', z.e) / 2);
      const ny = Math.round(z.ty - hn / 2 + z.e);
      detoure(c, 'DISGRACE', nx, ny, z.e, '#f3d58a');
      // L'accent circonflexe sur le A.
      const ax = nx + 5 * 6 * z.e;
      c.fillStyle = '#f3d58a';
      c.fillRect(ax + z.e, ny - 2 * z.e, z.e, z.e);
      c.fillRect(ax + 2 * z.e, ny - 3 * z.e, z.e, z.e);
      c.fillRect(ax + 3 * z.e, ny - 2 * z.e, z.e, z.e);
      bandeau(c, "AU SALON DE LA DUCHESSE, SIX MAISONS SE DISPUTENT SA FAVEUR : POUSSE TES ALLIEES A LA LUMIERE, JETTE TES RIVALES DANS L'OMBRE.     ", G.sur - 10, 1, '#f3d58a', 28, t);
    };
    // Sur un mur trop bas, la table dorée seule.
    const rail = Math.max(2, Math.round(z.ah * 0.08));
    const ry = milieu - (rail >> 1);
    c.fillStyle = '#d8b25c';
    c.fillRect(z.ax, ry, z.aw, rail);
    c.fillStyle = '#8f6d32';
    c.fillRect(z.ax, ry + rail - 1, z.aw, 1);
    if (z.ah < 8) return finir();
    const pas = Math.floor(z.aw / 3);
    const cw = Math.max(3, Math.min(Math.floor(pas * 0.62), 22));
    const chh = Math.max(1, Math.min(4, Math.floor((z.ah / 2 - rail) / 5)));
    const gap = 1;
    const xs = [0, 1, 2].map((i) => z.ax + i * pas + Math.floor((pas - cw) / 2));
    const fin = p >= 0.9 ? 1 - lisse((p - 0.9) / 0.08) : 1;
    // Les cartes posées : en haut, empilées en montant depuis la table ; en bas, en descendant.
    const pose = (i, k, haut, couleur) => {
      const y = haut ? ry - (k + 1) * (chh + gap) : ry + rail + gap + k * (chh + gap);
      c.fillStyle = couleur;
      c.fillRect(xs[i], y, cw, chh);
      return y;
    };
    c.globalAlpha = fin;
    S.col.forEach(([h, b], i) => {
      for (let k = 0; k < h; k++) pose(i, k, true, MAISONS[i]);
      for (let k = 0; k < b; k++) pose(i, k, false, MAISONS[i]);
    });
    // La colonne choisie s'allume, puis la carte arrive d'en haut ou d'en bas.
    const xa = xs[S.actif];
    if (p >= 0.12 && p < 0.42 && Math.floor(t * 4) % 2) {
      c.fillStyle = S.haut ? '#ffe7a8' : '#b8c6ff';
      const y0 = S.haut ? z.ay : ry + rail;
      const y1 = S.haut ? ry : z.ay + z.ah;
      for (let y = y0; y < y1; y += 2) {
        c.fillRect(xa - 2, y, 1, 1);
        c.fillRect(xa + cw + 1, y, 1, 1);
      }
    }
    if (p >= 0.2) {
      const d = lisse((p - 0.2) / 0.18);
      const k = S.haut ? hautA : basA;
      const cible = S.haut ? ry - (k + 1) * (chh + gap) : ry + rail + gap + k * (chh + gap);
      const depart = S.haut ? z.ay - chh : z.ay + z.ah;
      const y = Math.round(depart + (cible - depart) * d);
      c.fillStyle = MAISONS[S.actif];
      c.fillRect(xa, y, cw, chh);
      // L'Éminence qui arrive : un liseré d'or.
      c.fillStyle = '#ffe7a8';
      c.fillRect(xa, y, cw, 1);
    }
    // Le cachet tombe sur la table : un anneau, un + d'or ou un - de cire.
    if (p >= 0.5) {
      const d = lisse((p - 0.5) / 0.08);
      const e = Math.max(1, Math.min(3, Math.floor(z.ah / 22), Math.floor(pas / 12)));
      const r = Math.round((4 + 3 * (1 - d)) * e);
      const cx = xa + (cw >> 1);
      const cy = ry + (rail >> 1);
      const couleur = grace ? '#ffd76a' : '#ff4a4a';
      c.fillStyle = '#1a0c1e';
      c.beginPath();
      c.arc(cx, cy, r + e, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = couleur;
      c.lineWidth = e;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.stroke();
      if (d >= 1) {
        c.fillStyle = couleur;
        const s = grace ? '+' : '-';
        texte(c, s, cx - Math.round((5 * e) / 2), cy - Math.round((7 * e) / 2), e);
      }
    }
    c.globalAlpha = 1;
    finir();
  },
  contrebande(c, t) {
    const z = zones(['CONTREBANDE']);
    // Le poste-frontière en sept secondes : une valise étiquetée arrive à la barrière. Une fois sur deux la barrière se lève
    // et elle passe (tampon vert), l'autre fois le douanier siffle, la valise s'ouvre et le tampon rouge tombe : saisie.
    const cycle = 7;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const lisse = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const saisie = n % 2 === 1;
    // La nuit bleu marine du passeport, semée d'un guillochis d'or.
    for (let y = 0; y < G.h; y++) {
      const k = y / Math.max(1, G.h);
      c.fillStyle = `rgb(${Math.round(14 + 10 * k)},${Math.round(30 + 12 * k)},${Math.round(62 + 10 * k)})`;
      c.fillRect(0, y, G.w, 1);
    }
    c.fillStyle = '#5e5530';
    for (let y = 3; y < G.sur - 12; y += 7) for (let x = (y / 7) % 2 ? 1 : 4; x < G.w; x += 7) c.fillRect(x, y, 1, 1);
    const finir = () => {
      const hn = 9 * z.e;
      detoure(c, 'CONTREBANDE', Math.round(z.tx - largeur('CONTREBANDE', z.e) / 2), Math.round(z.ty - hn / 2 + z.e), z.e, '#e8c97a');
      bandeau(c, "UN DISCOURS IMPROVISE, TROIS MOTS ABSURDES A GLISSER L'AIR DE RIEN... ET TOUTE UNE TABLE DE DOUANIERS QUI TEND L'OREILLE. CONTROLE !     ", G.sur - 10, 1, '#e8c97a', 28, t);
    };
    // La route.
    const sol = z.ay + z.ah - 1;
    c.fillStyle = '#3a4560';
    c.fillRect(z.ax, sol, z.aw, 1);
    if (z.ah < 8) return finir();
    // La valise : sa taille suit le mur.
    const vw = Math.max(6, Math.min(Math.round(z.aw * 0.2), Math.round(z.ah * 0.8), 34));
    const vh = Math.max(4, Math.round(vw * 0.6));
    // La barrière : un poteau, et une perche rouge et blanche qui se lève vers la gauche.
    const pw = Math.max(2, Math.round(vw / 6));
    const ph = Math.min(z.ah - 2, vh + Math.max(3, Math.round(vh * 0.7)));
    const bx = z.ax + Math.round(z.aw * 0.66);
    const py = sol - ph;
    const L = Math.max(8, Math.round(z.aw * 0.3));
    c.fillStyle = '#9aa6c4';
    c.fillRect(bx, py, pw, ph);
    c.fillStyle = '#e8c97a';
    c.fillRect(bx, py, pw, 1);
    const leve = saisie ? 0 : lisse((p - 0.34) / 0.1) * (1 - lisse((p - 0.8) / 0.1));
    const angle = leve * 1.35;
    c.save();
    c.translate(bx + pw / 2, py + 1);
    c.rotate(angle);
    const ep = Math.max(1, Math.round(pw * 0.7));
    for (let i = 0; i < L; i += 3) {
      c.fillStyle = Math.floor(i / 3) % 2 ? '#f4efe2' : '#d8342c';
      c.fillRect(-i - 3, -ep / 2, 3, ep);
    }
    c.restore();
    // Le trajet : arrivée à la barrière, puis, si elle se lève, la suite de la route.
    const arret = bx - L - vw - 2;
    let x = -vw + (arret + vw) * lisse((p - 0.04) / 0.26);
    if (!saisie && p >= 0.45) x = arret + (z.ax + z.aw + 4 - arret) * lisse((p - 0.45) / 0.3);
    x = Math.round(x);
    const y = sol - vh;
    const ouverte = saisie ? lisse((p - 0.5) / 0.08) : 0;
    const fin = p >= 0.9 ? 1 - lisse((p - 0.9) / 0.08) : 1;
    c.globalAlpha = fin;
    // Le corps, les sangles, la poignée, puis le couvercle qui s'entrouvre à la fouille.
    c.fillStyle = '#b5703a';
    c.fillRect(x, y, vw, vh);
    c.fillStyle = '#5c2f12';
    const sg = Math.max(1, Math.round(vw / 8));
    c.fillRect(x + Math.round(vw * 0.25), y, sg, vh);
    c.fillRect(x + Math.round(vw * 0.72), y, sg, vh);
    const lid = Math.max(1, Math.round(vh * 0.25));
    const ly = y - Math.round(ouverte * vh * 0.5);
    c.fillStyle = '#9a5c2c';
    c.fillRect(x, ly, vw, lid);
    c.fillStyle = '#6b3f1f';
    const hw = Math.max(2, Math.round(vw * 0.3));
    c.fillRect(x + Math.round((vw - hw) / 2), ly - Math.max(1, Math.round(vh / 5)), hw, 1);
    c.fillRect(x + Math.round((vw - hw) / 2), ly - Math.max(1, Math.round(vh / 5)), 1, Math.max(1, Math.round(vh / 5)));
    c.fillRect(x + Math.round((vw + hw) / 2) - 1, ly - Math.max(1, Math.round(vh / 5)), 1, Math.max(1, Math.round(vh / 5)));
    // Trois étiquettes kraft qui pendent ; à la fouille, elles sautent hors de la valise.
    const tw = Math.max(2, Math.round(vw / 5));
    const th = Math.max(2, Math.round(tw * 0.6));
    for (let i = 0; i < 3; i++) {
      const tx = x + Math.round(((i + 0.5) * vw) / 3 - tw / 2);
      const saut = ouverte * Math.round(vh * (0.8 + 0.35 * i));
      c.fillStyle = i === 1 && saisie && p >= 0.62 ? '#ff5a4a' : '#f6e7c1';
      c.fillRect(tx, Math.round(y + vh * 0.45 - saut), tw, th);
    }
    // Le coup de sifflet : un « ! » rouge qui clignote au-dessus du poteau.
    const e = Math.max(1, Math.min(3, Math.floor(z.ah / 24)));
    if (saisie && p >= 0.36 && p < 0.52 && Math.floor(t * 6) % 2) {
      c.fillStyle = '#ff4a4a';
      texte(c, '!', bx + Math.round(pw / 2 - 2.5 * e), Math.max(z.ay, py - 9 * e), e);
    }
    // Le tampon : SAISI en rouge sur la valise, ou OK en vert de l'autre côté de la barrière.
    const tampon = saisie ? (p >= 0.62 ? 'SAISI' : '') : p >= 0.6 ? 'OK' : '';
    if (tampon) {
      const d = lisse((p - (saisie ? 0.62 : 0.6)) / 0.06);
      const w = largeur(tampon, e);
      const cx = saisie ? x + (vw >> 1) : bx + pw + Math.round((z.ax + z.aw - bx - pw) / 2);
      const sx = Math.max(z.ax + 2 * e, Math.min(z.ax + z.aw - w - 2 * e, Math.round(cx - w / 2)));
      const sy = Math.max(z.ay + 2 * e, Math.round(z.ay + z.ah * 0.18));
      const couleur = saisie ? '#ff4a4a' : '#5fd08e';
      c.globalAlpha = fin * d;
      c.fillStyle = '#0e1e3e';
      c.fillRect(sx - 2 * e, sy - 2 * e, w + 4 * e, 11 * e);
      c.strokeStyle = couleur;
      c.lineWidth = e;
      c.strokeRect(sx - 1.5 * e, sy - 1.5 * e, w + 3 * e, 10 * e);
      c.fillStyle = couleur;
      texte(c, tampon, sx, sy, e);
    }
    c.globalAlpha = 1;
    finir();
  },
  mytho(c, t) {
    const z = zones(['MYTHO']);
    // Le comptoir en sept secondes : trois serviettes posées sur le zinc, chacune griffonnée d'une histoire. Le marqueur
    // rouge entoure la fausse (une autre à chaque tour), puis les vrais auteurs signent les leurs au stylo bleu.
    const cycle = 7;
    const n = Math.floor(t / cycle);
    const p = (t % cycle) / cycle;
    const lisse = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
    const fausse = (n * 2 + 1) % 3;
    // Le mur lie-de-vin du bistrot, avec ses lattes verticales.
    for (let y = 0; y < G.h; y++) {
      const k = y / Math.max(1, G.h);
      c.fillStyle = `rgb(${Math.round(92 - 40 * k)},${Math.round(22 - 8 * k)},${Math.round(28 - 10 * k)})`;
      c.fillRect(0, y, G.w, 1);
    }
    c.fillStyle = '#3c0e12';
    for (let x = 5; x < G.w; x += 11) c.fillRect(x, 0, 1, G.sur - 12);
    const finir = () => {
      const hn = 9 * z.e;
      detoure(c, 'MYTHO', Math.round(z.tx - largeur('MYTHO', z.e) / 2), Math.round(z.ty - hn / 2 + z.e), z.e, '#ff6f61');
      bandeau(c, "CHACUN RACONTE UNE VRAIE ANECDOTE... SAUF LE MYTHO, QUI INVENTE LA SIENNE. TROUVEZ LA FAUSSE !     ", G.sur - 10, 1, '#ff6f61', 28, t);
    };
    // Le zinc du comptoir.
    const sol = z.ay + z.ah - 1;
    c.fillStyle = '#8f9a9e';
    c.fillRect(z.ax, sol, z.aw, 1);
    if (z.ah < 8) return finir();
    // Les serviettes : leur taille suit le mur, en largeur comme en hauteur.
    const nw = Math.max(5, Math.min(Math.round(z.aw * 0.22), Math.round(z.ah * 0.72), 40));
    const nh = Math.max(4, Math.round(nw * 0.9));
    const gap = Math.max(2, Math.round(nw * 0.35));
    const x0 = z.ax + Math.round((z.aw - (3 * nw + 2 * gap)) / 2);
    const yb = sol - 1 - nh;
    const fin = p >= 0.9 ? 1 - lisse((p - 0.9) / 0.08) : 1;
    c.globalAlpha = fin;
    const centres = [];
    for (let i = 0; i < 3; i++) {
      const d = lisse((p - 0.03 - i * 0.07) / 0.1);
      if (d <= 0) continue;
      const x = x0 + i * (nw + gap);
      const y = Math.round(yb - (1 - d) * Math.max(3, nh * 0.6));
      centres[i] = [x + nw / 2, y + nh / 2];
      c.fillStyle = '#f6ecd2';
      c.fillRect(x, y, nw, nh);
      // Le bord gaufré, en pointillés, puis les lignes d'écriture griffonnées.
      c.fillStyle = '#cdb98e';
      for (let k = 1; k < nw - 1; k += 2) {
        c.fillRect(x + k, y + 1, 1, 1);
        c.fillRect(x + k, y + nh - 2, 1, 1);
      }
      const lignes = Math.max(1, Math.floor((nh - 5) / 3));
      c.fillStyle = '#5a4a44';
      for (let l = 0; l < lignes; l++) {
        const lw = Math.max(1, Math.round((nw - 6) * (l === lignes - 1 ? 0.55 : 0.85 - ((i + l) % 3) * 0.08)));
        c.fillRect(x + 3, y + 3 + l * 3, lw, 1);
      }
      // Les vrais auteurs signent : un trait bleu qui s'allonge sous leur histoire.
      if (i !== fausse && p >= 0.62) {
        const s = lisse((p - 0.62 - (i > fausse ? 0.06 : 0)) / 0.08);
        const sh = nw >= 16 ? 2 : 1;
        c.fillStyle = '#7aa2ff';
        c.fillRect(x + 2, y + nh - 2 - sh, Math.max(1, Math.round((nw - 4) * 0.7 * s)), sh);
      }
    }
    // Le marqueur rouge fait le tour de la fausse, puis la serviette tremble un instant.
    const ctr = centres[fausse];
    if (ctr && p >= 0.36) {
      const d = lisse((p - 0.36) / 0.14);
      const e = Math.max(1, Math.round(nw / 8));
      const rx = nw * 0.5 + gap * 0.45;
      const ry = Math.min(nh * 0.5 + Math.max(2, gap * 0.4), ctr[1] - z.ay);
      c.strokeStyle = '#ff4a3d';
      c.lineWidth = e;
      c.beginPath();
      c.ellipse(ctr[0], ctr[1], rx, ry, -0.12, -2.2, -2.2 + d * Math.PI * 2.15);
      c.stroke();
      // Le « ! » du verdict au-dessus, qui clignote.
      if (p >= 0.5 && p < 0.86 && Math.floor(t * 5) % 2) {
        const q = Math.max(1, Math.min(2, Math.floor(z.ah / 30)));
        const ty = Math.round(ctr[1] - ry - 8 * q);
        if (ty >= z.ay) {
          c.fillStyle = '#ff4a3d';
          texte(c, '!', Math.round(ctr[0] - 2.5 * q), ty, q);
        }
      }
    }
    c.globalAlpha = 1;
    finir();
  },
};

const VERTEX = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FRAGMENT = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform sampler2D uA, uB;
  uniform vec2 uRes, uGrille, uPtr, uOrigine;
  uniform float uCellule, uMix, uT, uPtrOn, uFlash;
  uniform vec3 uFlashC;
  float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  vec3 prend(vec2 st){return texture2D(uA,st).rgb;}
  void main(){
    vec2 f=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
    vec2 cell=floor(f/uCellule);
    vec2 l=f/uCellule-cell-.5;
    vec2 st=(cell+.5)/uGrille;
    vec2 px=1./uGrille;

    // La nouvelle scène se propage depuis l'endroit qu'on vient de toucher, LED par LED.
    float dist=length((cell-uOrigine)/max(uGrille.x,uGrille.y));
    float seuil=dist*1.15+hash(cell)*.22;
    float montre=uMix>=.999?1.:step(seuil,uMix*1.9);
    vec3 c=mix(texture2D(uB,st).rgb,texture2D(uA,st).rgb,montre);
    float crete=smoothstep(.12,0.,abs(seuil-uMix*1.9))*step(uMix,.999);

    // Halo des LED voisines.
    vec3 halo=vec3(0.);
    float r=2.6;
    halo+=texture2D(uA,st+px*vec2(r,0.)).rgb+texture2D(uA,st-px*vec2(r,0.)).rgb;
    halo+=texture2D(uA,st+px*vec2(0.,r)).rgb+texture2D(uA,st-px*vec2(0.,r)).rgb;
    r=5.5;
    halo+=texture2D(uA,st+px*vec2(r,r)).rgb+texture2D(uA,st-px*vec2(r,r)).rgb;
    halo+=texture2D(uA,st+px*vec2(r,-r)).rgb+texture2D(uA,st-px*vec2(r,-r)).rgb;
    halo/=8.;

    float dp=length((f-uPtr)/uCellule)/11.;
    float pres=uPtrOn*exp(-dp*dp);
    float rayon=.4+.1*pres;
    float d=length(l);
    float led=smoothstep(rayon,rayon-.18,d);
    float coeur=smoothstep(rayon*.62,0.,d);

    vec3 col=vec3(.05,.047,.056)*led;
    col+=c*led*(.92+.55*coeur)*(1.+pres*.55);
    col+=halo*.24;
    col+=vec3(1.,.95,.85)*crete*led*.85;
    col+=uFlashC*uFlash*led*1.2;

    vec2 uv=gl_FragCoord.xy/uRes-.5;
    col*=1.-dot(uv,uv)*.34;
    gl_FragColor=vec4(col,1.);
  }
`;

const canvas = document.getElementById('mur');
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false });
const liens = [...document.querySelectorAll('.jeu')];

if (!gl) {
  document.documentElement.classList.add('sans-gl');
} else {
  demarre();
}

function demarre() {
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const pr = gl.createProgram();
  gl.attachShader(pr, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(pr, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.bindAttribLocation(pr, 0, 'a');
  gl.linkProgram(pr);
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const lieux = {};
  const u = (n) => lieux[n] ?? (lieux[n] = gl.getUniformLocation(pr, n));

  const creeTexture = (unite, nom_) => {
    const tx = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unite);
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u(nom_), unite);
  };
  creeTexture(0, 'uA');
  creeTexture(1, 'uB');

  const ecranA = document.createElement('canvas');
  const ecranB = document.createElement('canvas');
  const ca = ecranA.getContext('2d', { alpha: false });
  const cb = ecranB.getContext('2d', { alpha: false });

  let courante = 'boot';
  let precedente = 'boot';
  let debutMix = -1e9;
  let origine = [0, 0];
  let flash = 0;
  let flashC = [1, 1, 1];
  const ondes = [];

  function mesure() {
    const W = innerWidth;
    const H = innerHeight;
    // Sur les très grands écrans, on plafonne la définition pour rester fluide même sans carte graphique puissante.
    const d = Math.min(devicePixelRatio || 1, 2, Math.sqrt(3.7e6 / (W * H)));
    G.cellule = W < 760 ? 4 : 6;
    G.w = Math.ceil(W / G.cellule);
    G.h = Math.ceil(H / G.cellule);
    G.paysage = W >= 760;
    const haut = document.querySelector('.jeux').getBoundingClientRect().top + 30;
    G.sur = Math.max(30, Math.floor(haut / G.cellule));
    for (const e of [ecranA, ecranB]) {
      e.width = G.w;
      e.height = G.h;
    }
    canvas.width = Math.round(W * d);
    canvas.height = Math.round(H * d);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u('uRes'), canvas.width, canvas.height);
    gl.uniform2f(u('uGrille'), G.w, G.h);
    gl.uniform1f(u('uCellule'), G.cellule * d);
    G.d = d;
  }

  function vers(scene, ox, oy) {
    if (scene === courante) return;
    precedente = courante;
    courante = scene;
    debutMix = performance.now();
    origine = [ox ?? G.w / 2, oy ?? G.sur / 2];
    liens.forEach((l) => l.classList.toggle('is-on', l.dataset.scene === scene));
    if (scene !== 'titre' && scene !== 'boot' && calme) debutMix = -1e9;
  }

  const dessine = (ctx, scene, t) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    // Une scène qui échoue ne doit pas figer tout le mur : on passe simplement cette image.
    try {
      SCENES[scene](ctx, t);
    } catch (err) {
      console.warn(scene, err);
    }
  };

  const envoie = (unite, source) => {
    gl.activeTexture(gl.TEXTURE0 + unite);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
  };

  // Programme quand personne ne choisit : le titre, puis chaque jeu à tour de rôle.
  const PROGRAMME = ['titre', 'indian', 'sniper', 'equation', 'gang', 'skull', 'perudo', 'liar', 'bw', 'coup', 'cockroach', 'hanabi', 'wavelength', 'undercover', 'inspecteur', 'justone', 'skyjo', 'trio', 'citadelles', 'avalon', 'removeone', 'balancemancala', 'layinggrass', 'timeauction', 'zoo', 'secretnumber', 'loupgarou', 'ito', 'mafia', 'frise', 'disgrace', 'contrebande', 'mytho'];
  let indice = 0;
  let prochain = 1000;
  let verrouille = null;
  // Sur téléphone, une image sur deux suffit à un mur de LED et ménage la batterie.
  const econome = matchMedia('(hover: none)').matches;
  let impaire = false;

  function image(now) {
    impaire = !impaire;
    if (econome && !calme && impaire) {
      requestAnimationFrame(image);
      return;
    }
    const t = now / 1000;
    if (!calme && !verrouille && now > prochain) {
      indice = courante === 'boot' ? 0 : (PROGRAMME.indexOf(courante) + 1) % PROGRAMME.length;
      vers(PROGRAMME[indice], courante === 'boot' ? G.w / 2 : Math.random() * G.w, courante === 'boot' ? G.sur / 2 : Math.random() * G.sur);
      prochain = now + (courante === 'titre' ? 6000 : 4400);
    }
    const mix = Math.min(1, (now - debutMix) / 620);
    dessine(ca, courante, t);
    // Les ondes laissées par le pointeur ou le doigt.
    ca.globalCompositeOperation = 'lighter';
    for (let i = ondes.length - 1; i >= 0; i--) {
      const o = ondes[i];
      // L'heure de l'image peut précéder celle du geste : l'âge ne descend jamais sous zéro.
      const age = Math.max(0, (now - o.t) / 1000);
      if (age > 0.9) {
        ondes.splice(i, 1);
        continue;
      }
      ca.strokeStyle = `rgba(255,255,255,${(1 - age / 0.9) * 0.55 * o.f})`;
      ca.lineWidth = 1;
      ca.beginPath();
      ca.arc(o.x, o.y, 2 + age * 44 * o.f, 0, 7);
      ca.stroke();
    }
    ca.globalCompositeOperation = 'source-over';
    envoie(0, ecranA);
    if (mix < 1) {
      dessine(cb, precedente, t);
      envoie(1, ecranB);
    }
    gl.uniform1f(u('uMix'), mix);
    gl.uniform2f(u('uOrigine'), origine[0], origine[1]);
    gl.uniform1f(u('uT'), t);
    gl.uniform2f(u('uPtr'), G.px * G.cellule * G.d, G.py * G.cellule * G.d);
    const vu = now - G.vu;
    gl.uniform1f(u('uPtrOn'), vu < 1600 ? 1 - vu / 1600 : 0);
    flash = Math.max(0, flash - 0.03);
    gl.uniform1f(u('uFlash'), flash);
    gl.uniform3f(u('uFlashC'), ...flashC);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!calme) requestAnimationFrame(image);
  }

  let derniereOnde = 0;
  const suit = (e, force) => {
    G.px = e.clientX / G.cellule;
    G.py = e.clientY / G.cellule;
    const now = performance.now();
    G.vu = now;
    if (now - derniereOnde > (force ? 0 : 170)) {
      derniereOnde = now;
      ondes.push({ x: G.px, y: G.py, t: now, f: force ? 1.6 : 0.8 });
      if (ondes.length > 14) ondes.shift();
    }
  };
  addEventListener('pointermove', (e) => suit(e, false), { passive: true });
  addEventListener('pointerdown', (e) => suit(e, true), { passive: true });

  const centre = (l) => {
    const b = l.getBoundingClientRect();
    return [(b.left + b.width / 2) / G.cellule, b.top / G.cellule];
  };
  const COULEURS = { indian: [1, 0.4, 0.26], sniper: [1, 0.2, 0.33], equation: [0.43, 0.84, 1], gang: [0.96, 0.77, 0.32], skull: [0.78, 0.57, 1], perudo: [1, 0.18, 0.58], liar: [0.95, 0.92, 0.85], bw: [1, 1, 1], coup: [0.56, 0.65, 1], cockroach: [0.31, 0.82, 0.63], hanabi: [0.85, 0.94, 0.35], wavelength: [1, 0.54, 0.17], undercover: [0.4, 0.88, 0.31], inspecteur: [0.88, 0.72, 0.49], justone: [0.29, 0.53, 1], skyjo: [0.93, 0.42, 1], trio: [0.13, 0.78, 0.77], citadelles: [0.71, 0.36, 1], avalon: [1, 0.56, 0.64], removeone: [0.68, 0.72, 0.76], balancemancala: [1, 0.29, 0.24], layinggrass: [0.56, 0.86, 0.25], timeauction: [1, 0.7, 0.36], zoo: [0.62, 0.94, 0.81], secretnumber: [1, 0.88, 0.29], loupgarou: [0.72, 0.68, 1], ito: [1, 0.62, 0.48], mafia: [1, 0.42, 0.84], frise: [0.66, 0.83, 1], disgrace: [0.9, 0.64, 0.85], contrebande: [0.91, 0.79, 0.48], mytho: [1, 0.44, 0.38] };
  liens.forEach((l) => {
    const choisit = () => {
      verrouille = l.dataset.scene;
      vers(verrouille, ...centre(l));
      if (calme) requestAnimationFrame(image);
    };
    const lache = () => {
      verrouille = null;
      prochain = performance.now() + 1800;
    };
    l.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') choisit(); });
    l.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') lache(); });
    l.addEventListener('focus', choisit);
    l.addEventListener('blur', lache);
    // Un éclair de la couleur du jeu sur tout le mur, puis on part.
    l.addEventListener('click', (e) => {
      if (calme || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      verrouille = l.dataset.scene;
      vers(verrouille, ...centre(l));
      flashC = COULEURS[l.dataset.scene];
      flash = 1;
      setTimeout(() => { location.href = l.href; }, 240);
    });
  });

  addEventListener('pageshow', (e) => {
    if (e.persisted) {
      flash = 0;
      verrouille = null;
      prochain = performance.now() + 1500;
    }
  });

  addEventListener('resize', () => {
    mesure();
    if (calme) requestAnimationFrame(image);
  });
  mesure();
  if (calme) courante = 'titre';
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      mesure();
      if (calme) requestAnimationFrame(image);
    });
  }
  requestAnimationFrame(image);
}

// Les serveurs s'endorment : on réveille celui du jeu survolé ou touché pour qu'il s'ouvre plus vite.
// Pas tous à chaque visite : chacun resterait allumé 15 min, et les heures gratuites de Render fondraient.
const reveilles = new Set();
function reveille(e) {
  const url = e.target.closest?.('.jeu')?.href;
  if (!url || reveilles.has(url)) return;
  reveilles.add(url);
  fetch(url, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
}
for (const type of ['pointerover', 'pointerdown', 'focusin']) document.addEventListener(type, reveille);
