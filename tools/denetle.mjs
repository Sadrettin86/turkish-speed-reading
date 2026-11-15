// İçerik denetimi: node tools/denetle.mjs [dosya.json ...]
// Cümleler: 45-70 harf, rakam yok, 4 seçenek, tekrar yok; havuzun Ateşman puanı ve bandı.
// Paragraflar: kelime/hece sayısı, Ateşman puanı, 5 soru.
import { readFileSync } from 'node:fs';
import { atesman, atesmanBandi, harfSay, heceSay, kelimeler } from '../js/metin.js';

const varsayilan = ['data/on-test.json', 'data/asama1.json', 'data/asama2.json', 'data/asama3.json', 'data/olcum.json'];
const dosyalar = process.argv.slice(2).length ? process.argv.slice(2) : varsayilan;
let hata = 0;
const tumMetinler = new Map();

const yaz = (...a) => console.log(...a);
const sorun = (m) => {
  hata++;
  console.log('  HATA:', m);
};

for (const d of dosyalar) {
  const veri = JSON.parse(readFileSync(d, 'utf8'));
  yaz(`\n${d}`);
  if (veri.cumleler) cumleDenetle(veri.cumleler, veri.hedefBant);
  if (veri.paragraflar) paragrafDenetle(veri.paragraflar);
  if (Array.isArray(veri)) cumleDenetle(veri);
}

function secenekDenetle(id, soru, c) {
  if (!soru || !soru.trim()) sorun(`${id}: soru boş`);
  if (!Array.isArray(c) || c.length !== 4) sorun(`${id}: 4 seçenek olmalı`);
  else if (new Set(c.map((x) => x.trim().toLocaleLowerCase('tr'))).size !== 4) sorun(`${id}: aynı seçenek iki kez`);
}

function cumleDenetle(liste, hedefBant) {
  if (!liste.length) {
    yaz('  (boş)');
    return;
  }
  const idler = new Set();
  let kelimeT = 0;
  let heceT = 0;
  let harfMin = Infinity;
  let harfMax = 0;
  for (const [i, c] of liste.entries()) {
    const id = c.id || `#${i + 1}`;
    if (c.id) {
      if (idler.has(c.id)) sorun(`${id}: kimlik tekrar`);
      idler.add(c.id);
    }
    const harf = harfSay(c.t);
    harfMin = Math.min(harfMin, harf);
    harfMax = Math.max(harfMax, harf);
    if (harf < 45 || harf > 70) sorun(`${id}: ${harf} harf (45-70 olmalı): ${c.t}`);
    if (/\d/.test(c.t)) sorun(`${id}: rakam var (hece sayımı için yazıyla yazılmalı)`);
    const anahtar = c.t.toLocaleLowerCase('tr');
    if (tumMetinler.has(anahtar)) sorun(`${id}: ${tumMetinler.get(anahtar)} ile aynı cümle`);
    tumMetinler.set(anahtar, id);
    secenekDenetle(id, c.s, c.c);
    kelimeT += kelimeler(c.t).length;
    heceT += heceSay(c.t);
  }
  const puan = 198.825 - 40.175 * (heceT / kelimeT) - 2.61 * (kelimeT / liste.length);
  yaz(`  ${liste.length} cümle · harf ${harfMin}-${harfMax} · cümle başına ${(kelimeT / liste.length).toFixed(1)} kelime · kelime başına ${(heceT / kelimeT).toFixed(2)} hece`);
  yaz(`  Ateşman: ${puan.toFixed(1)} (${atesmanBandi(puan)})${hedefBant ? ` · hedef: ${hedefBant}` : ''}`);
  if (hedefBant && atesmanBandi(puan) !== hedefBant) sorun(`havuz bandı ${atesmanBandi(puan)}, hedef ${hedefBant}`);
}

function paragrafDenetle(liste) {
  const puanlar = [];
  for (const p of liste) {
    const k = kelimeler(p.metin).length;
    const h = heceSay(p.metin);
    const a = atesman(p.metin);
    puanlar.push(a);
    yaz(`  ${p.id}: ${k} kelime · ${h} hece · Ateşman ${a.toFixed(1)} (${atesmanBandi(a)}) · ${p.sorular.length} soru`);
    if (/\d/.test(p.metin)) sorun(`${p.id}: rakam var`);
    if (p.sorular.length !== 5) sorun(`${p.id}: 5 soru olmalı`);
    p.sorular.forEach((s, i) => secenekDenetle(`${p.id}/${i + 1}`, s.s, s.c));
  }
  const fark = Math.max(...puanlar) - Math.min(...puanlar);
  yaz(`  Ateşman aralığı: ${Math.min(...puanlar).toFixed(1)}-${Math.max(...puanlar).toFixed(1)} (fark ${fark.toFixed(1)})`);
  if (fark > 10) sorun('ölçüm paragraflarının zorluğu birbirinden çok farklı (fark > 10)');
}

yaz(hata ? `\n${hata} sorun bulundu.` : '\nSorun yok.');
process.exit(hata ? 1 : 0);
