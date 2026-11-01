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
  const PROGRAMME = ['titre', 'indian', 'sniper', 'equation', 'gang', 'skull', 'perudo', 'liar', 'bw', 'coup', 'cockroach', 'hanabi', 'wavelength', 'undercover', 'inspecteur', 'justone', 'skyjo', 'trio', 'citadelles', 'avalon', 'removeone'];
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
  const COULEURS = { indian: [1, 0.4, 0.26], sniper: [1, 0.2, 0.33], equation: [0.43, 0.84, 1], gang: [0.96, 0.77, 0.32], skull: [0.78, 0.57, 1], perudo: [1, 0.18, 0.58], liar: [0.95, 0.92, 0.85], bw: [1, 1, 1], coup: [0.56, 0.65, 1], cockroach: [0.31, 0.82, 0.63], hanabi: [0.85, 0.94, 0.35], wavelength: [1, 0.54, 0.17], undercover: [0.4, 0.88, 0.31], inspecteur: [0.88, 0.72, 0.49], justone: [0.29, 0.53, 1], skyjo: [0.93, 0.42, 1], trio: [0.13, 0.78, 0.77], citadelles: [0.71, 0.36, 1], avalon: [1, 0.56, 0.64], removeone: [0.68, 0.72, 0.76] };
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

// Les serveurs s'endorment : on les réveille dès l'arrivée ici pour que le jeu choisi s'ouvre plus vite.
// Équation Hi-Lo a un serveur séparé de sa page, c'est lui qu'il faut réveiller.
[
  'https://indian-poker-usrn.onrender.com/',
  'https://holdem-sniper.onrender.com/',
  'https://equation-hilo-serveur.onrender.com/',
  'https://the-gang-fhvj.onrender.com/',
  'https://skull-4rpt.onrender.com/',
  'https://perudo-f6x0.onrender.com/',
  'https://liar-game-nh9k.onrender.com/',
  'https://black-and-white-hn5n.onrender.com/',
  'https://coup-nb7f.onrender.com/',
  'https://cockroach-poker-kksi.onrender.com/',
  'https://hanabi-2bap.onrender.com/',
  'https://wavelength-hnfh.onrender.com/',
  'https://undercover-h60g.onrender.com/',
  'https://inspecteur.onrender.com/',
  'https://just-one-3bg0.onrender.com/',
  'https://skyjo-zmtt.onrender.com/',
  'https://trio-k6b5.onrender.com/',
  'https://citadelles-59hy.onrender.com/',
  'https://avalon-f9o2.onrender.com/',
  'https://remove-one.onrender.com/',
].forEach((url) => fetch(url, { mode: 'no-cors', cache: 'no-store' }).catch(() => {}));
