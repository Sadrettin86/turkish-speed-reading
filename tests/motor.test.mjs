// npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { heceSay, harfSay, kelimeler, atesman, atesmanBandi } from '../js/metin.js';
import { yeniMerdiven, guncelle, baslangicMs, ADIM_MS, EN_HIZLI_MS } from '../js/merdiven.js';
import * as P from '../js/program.js';

test('hece = ünlü sayısı, Türkçe büyük harfler dahil', () => {
  assert.equal(heceSay("İstanbul'a gidiyoruz"), 8);
  assert.equal(heceSay('IŞIK'), 2);
  assert.equal(heceSay('kâğıt'), 2);
  assert.equal(heceSay('sırt'), 1);
});

test('harf ve kelime sayımı noktalama ve kesme işaretini ayırır', () => {
  assert.equal(harfSay("Ali'nin kedisi."), 12);
  assert.deepEqual(kelimeler("Ali'nin kedisi, eve döndü."), ["Ali'nin", 'kedisi', 'eve', 'döndü']);
});

test('Ateşman formülü ve bantları', () => {
  // 4 kelime, 10 hece, 1 cümle: 198,825 − 40,175×2,5 − 2,61×4
  const p = atesman('Kedi bahçede uyudu bugün.');
  assert.ok(Math.abs(p - (198.825 - 40.175 * 2.5 - 2.61 * 4)) < 1e-9);
  assert.equal(atesmanBandi(95), 'çok kolay');
  assert.equal(atesmanBandi(72), 'kolay');
  assert.equal(atesmanBandi(55), 'orta');
  assert.equal(atesmanBandi(35), 'zor');
  assert.equal(atesmanBandi(10), 'çok zor');
});

test('merdiven: 3 doğruda hızlanır, 1 yanlışta yavaşlar', () => {
  let m = yeniMerdiven(60);
  m = guncelle(m, true);
  m = guncelle(m, true);
  assert.equal(m.ms, 60);
  m = guncelle(m, true);
  assert.equal(m.ms, 60 - ADIM_MS);
  assert.equal(m.seri, 0);
  m = guncelle(m, true);
  m = guncelle(m, false);
  assert.equal(m.ms, 60);
  assert.equal(m.seri, 0);
});

test('merdiven alt sınırın altına inmez', () => {
  let m = yeniMerdiven(EN_HIZLI_MS);
  for (let i = 0; i < 9; i++) m = guncelle(m, true);
  assert.equal(m.ms, EN_HIZLI_MS);
});

test('3-aşağı/1-yukarı kuralı yaklaşık %79 doğruya yakınsar', () => {
  // Benzetim: okurun doğru cevap olasılığı hız arttıkça (ms azaldıkça) düşer.
  let tohum = 7;
  const rng = () => ((tohum = (tohum * 16807) % 2147483647) / 2147483647);
  const olasilik = (ms) => 0.25 + 0.75 / (1 + Math.exp(-(ms - 40) / 4));
  let m = yeniMerdiven(70);
  let dogru = 0;
  let n = 0;
  for (let i = 0; i < 40000; i++) {
    const d = rng() < olasilik(m.ms);
    if (i > 2000) {
      n++;
      if (d) dogru++;
    }
    m = guncelle(m, d);
  }
  const oran = dogru / n;
  assert.ok(oran > 0.76 && oran < 0.82, `oran ${oran}`);
});

test('başlangıç süresi doğru cevaplanan cümlelerin ortancasından', () => {
  const d = [
    { ms: 6000, karakter: 100, dogru: true },
    { ms: 5000, karakter: 100, dogru: true },
    { ms: 7000, karakter: 100, dogru: true },
    { ms: 5500, karakter: 100, dogru: true },
    { ms: 6500, karakter: 100, dogru: true },
    { ms: 6200, karakter: 100, dogru: true },
    { ms: 20000, karakter: 100, dogru: false },
  ];
  assert.equal(baslangicMs(d), 61);
});

test('program akışı: ön test → başlangıç ölçümü → oturumlar → aşama ölçümü', () => {
  let d = P.bosDurum();
  assert.equal(P.sonrakiAdim(d), 'on-test');
  d = P.onTestKaydet(d, { ms: 60, denemeler: [], tarih: '2026-11-15T10:00:00Z' });
  assert.equal(P.sonrakiAdim(d), 'baslangic-olcum');
  ({ durum: d } = P.olcumKaydet(d, 'baslangic', { heceDk: 300, kelimeDk: 120, anlama: 0.8, eoe: 240, paragrafIdleri: ['o-01', 'o-02'] }));
  assert.equal(P.sonrakiAdim(d), 'oturum');
  for (let i = 0; i < P.ASAMA_OTURUM; i++) {
    d = P.oturumKaydet(d, { tarih: '2026-11-16T10:00:00Z', baslangicMs: 60, bitisMs: 58, seri: 1, dogru: 40, toplam: 50, cumleIdleri: [`a1-${i}`] });
  }
  assert.equal(d.ms, 58);
  assert.equal(P.sonrakiAdim(d), 'asama-olcum');
});

test('aşama ölçümü: anlama %80 ve EOE başlangıç üstündeyse geçer', () => {
  let d = P.bosDurum();
  d = P.onTestKaydet(d, { ms: 60, denemeler: [], tarih: 'x' });
  ({ durum: d } = P.olcumKaydet(d, 'baslangic', { heceDk: 300, anlama: 0.8, eoe: 240 }));
  d = { ...d, asamaOturum: P.ASAMA_OTURUM };

  const gecemez = P.olcumKaydet(d, 'asama-sonu', { heceDk: 400, anlama: 0.7, eoe: 280 });
  assert.equal(gecemez.karar.gecti, false);
  assert.equal(gecemez.durum.asama, 1);
  assert.equal(gecemez.durum.asamaOturum, 0);

  const gecer = P.olcumKaydet(d, 'asama-sonu', { heceDk: 320, anlama: 0.8, eoe: 256 });
  assert.equal(gecer.karar.gecti, true);
  assert.equal(gecer.durum.asama, 2);

  const dusuk = P.olcumKaydet(d, 'asama-sonu', { heceDk: 280, anlama: 0.8, eoe: 224 });
  assert.equal(dusuk.karar.gecti, false);
});

test('son aşama geçilince program tamamlanır', () => {
  let d = { ...P.bosDurum(), ms: 50, onTest: {}, asama: 3, asamaOturum: 8 };
  ({ durum: d } = P.olcumKaydet(d, 'baslangic', { anlama: 0.8, eoe: 200 }));
  d = { ...d, asamaOturum: 8 };
  const r = P.olcumKaydet(d, 'asama-sonu', { anlama: 0.9, eoe: 260 });
  assert.equal(r.durum.tamamlandi, true);
  assert.equal(r.durum.asama, 3);
});

test('cümle seçimi önce okunmamışları alır, eksik kalırsa tekrar ekler', () => {
  const havuz = Array.from({ length: 60 }, (_, i) => ({ id: `c${i}` }));
  const kullanilan = havuz.slice(0, 30).map((c) => c.id);
  const { secilen, tekrar } = P.cumleSec(havuz, kullanilan, 50);
  assert.equal(secilen.length, 50);
  assert.equal(tekrar, 20);
  assert.equal(new Set(secilen.map((c) => c.id)).size, 50);
  const yeniler = secilen.filter((c) => !kullanilan.includes(c.id));
  assert.equal(yeniler.length, 30);
});
