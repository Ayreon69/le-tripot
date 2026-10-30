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
  const e = Math.max(1, Math.floor((G.w - 4) / (plus * 6)));
  const th = lignes.length * 9 * e;
  return { ax: 2, ay: haut, aw: G.w - 4, ah: bas - haut - th - 3, tx: Math.floor(G.w / 2), ty: bas - th / 2, e, bas };
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
    SCENES[scene](ctx, t);
  };

  const envoie = (unite, source) => {
    gl.activeTexture(gl.TEXTURE0 + unite);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
  };

  // Programme quand personne ne choisit : le titre, puis chaque jeu à tour de rôle.
  const PROGRAMME = ['titre', 'indian', 'sniper', 'equation', 'gang', 'skull'];
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
      const age = (now - o.t) / 1000;
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
  const COULEURS = { indian: [1, 0.4, 0.26], sniper: [1, 0.2, 0.33], equation: [0.43, 0.84, 1], gang: [0.96, 0.77, 0.32], skull: [0.78, 0.57, 1] };
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
].forEach((url) => fetch(url, { mode: 'no-cors', cache: 'no-store' }).catch(() => {}));
