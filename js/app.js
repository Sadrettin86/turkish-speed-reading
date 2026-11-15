import { heceSay, kelimeler, karakterSay } from './metin.js';
import { guncelle, baslangicMs, dakikadaBirim } from './merdiven.js';
import * as P from './program.js';
import { yukle, kaydet, sifirla, disaAktar, iceAktar } from './depo.js';

const ekran = document.getElementById('ekran');
const ipucuKutu = document.getElementById('ipucu');
let durum = yukle();
let veri = null;
let tusIsleyici = null;
const oranOnbellek = new Map();

document.addEventListener('keydown', (e) => {
  if (tusIsleyici) tusIsleyici(e);
});

// ---------- küçük yardımcılar ----------

function el(etiket, oz = {}, ...cocuklar) {
  const e = document.createElement(etiket);
  for (const [k, v] of Object.entries(oz || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.setAttribute('style', v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of cocuklar.flat(Infinity)) {
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return e;
}

function goster(...dugumler) {
  tusIsleyici = null;
  ekran.replaceChildren(...dugumler);
  window.scrollTo(0, 0);
}

function odak(acik) {
  document.body.classList.toggle('odak', acik);
}

function navGuncelle(ad) {
  document.querySelectorAll('.ust nav button').forEach((b) => {
    b.setAttribute('aria-current', b.dataset.git === ad ? 'page' : 'false');
  });
}

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const tam = (x) => Math.round(x).toLocaleString('tr-TR');
const yuzde = (x) => `%${Math.round(x * 100)}`;
const tarihYaz = (iso) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

function ipucu(mesaj, sure = 3500) {
  ipucuKutu.textContent = mesaj;
  ipucuKutu.hidden = false;
  clearTimeout(ipucu.t);
  ipucu.t = setTimeout(() => (ipucuKutu.hidden = true), sure);
}

function guncelleDurum(yeni) {
  durum = yeni;
  if (!kaydet(durum)) ipucu('İlerleme kaydedilemedi. Tarayıcı depolaması kapalı olabilir.');
}

function yaziOlcegiUygula() {
  document.documentElement.style.setProperty('--okuma-olcek', durum.ayarlar?.yaziBoyutu || 1);
}

function dugmeBekle(dugme) {
  return new Promise((r) => dugme.addEventListener('click', () => r(), { once: true }));
}

// ---------- içerik ----------

async function veriYukle() {
  const al = (u) =>
    fetch(u).then((r) => {
      if (!r.ok) throw new Error(u);
      return r.json();
    });
  const [onTest, a1, a2, a3, olcum] = await Promise.all([
    al('data/on-test.json'),
    al('data/asama1.json'),
    al('data/asama2.json'),
    al('data/asama3.json'),
    al('data/olcum.json'),
  ]);
  const temizle = (c) => ({ ...c, t: c.t.replace(/\s+/g, ' ').trim() });
  veri = {
    onTest: onTest.cumleler.map(temizle),
    asamalar: { 1: a1.cumleler.map(temizle), 2: a2.cumleler.map(temizle), 3: a3.cumleler.map(temizle) },
    olcum: olcum.paragraflar.map((p) => ({ ...p, metin: p.metin.replace(/\s+/g, ' ').trim() })),
  };
}

function havuzOrani(havuz) {
  if (oranOnbellek.has(havuz)) return oranOnbellek.get(havuz);
  let h = 0;
  let k = 0;
  let c = 0;
  for (const x of havuz) {
    h += heceSay(x.t);
    k += kelimeler(x.t).length;
    c += karakterSay(x.t);
  }
  const oran = c ? { hece: h / c, kelime: k / c } : { hece: 0.2, kelime: 0.14 };
  oranOnbellek.set(havuz, oran);
  return oran;
}

// Karakter başına süreden dakikadaki hece ve kelime.
function msdenHiz(ms, havuz) {
  const o = havuzOrani(havuz);
  return { heceDk: (o.hece * 60000) / ms, kelimeDk: (o.kelime * 60000) / ms };
}

function aktifHavuz() {
  const h = veri.asamalar[durum.asama] || [];
  if (h.length) return { havuz: h, yedek: false };
  const yedek = [];
  for (let a = durum.asama - 1; a >= 1; a--) yedek.push(...veri.asamalar[a]);
  return { havuz: yedek, yedek: true };
}

// ---------- yönlendirme ----------

function git(ad) {
  if (ad === 'ilerleme') return ilerleme();
  if (ad === 'ayarlar') return ayarlar();
  return pano();
}

// ---------- pano ----------

function pano() {
  navGuncelle('pano');
  odak(false);
  const adim = P.sonrakiAdim(durum);
  if (adim === 'on-test') return goster(karsilama());

  const kartlar = [];
  const { havuz, yedek } = aktifHavuz();
  const hiz = msdenHiz(durum.ms, havuz.length ? havuz : veri.onTest);
  const son = durum.olcumler[durum.olcumler.length - 1];
  const temel = P.baslangicOlcumu(durum);

  const asamaYazi = durum.tamamlandi
    ? 'Program tamamlandı · bakım oturumları'
    : `Aşama ${durum.asama}/${P.ASAMA_SAYISI} · ${P.ASAMA_ADI[durum.asama]}`;

  let anaDugme;
  if (adim === 'baslangic-olcum') {
    anaDugme = el('button', { class: 'dugme ana genis', onclick: () => olcum('baslangic') }, 'Başlangıç ölçümüne geç');
  } else if (adim === 'asama-olcum') {
    anaDugme = el('button', { class: 'dugme ana genis', onclick: () => olcum('asama-sonu') }, 'Aşama sonu ölçümüne geç');
  } else {
    anaDugme = el('button', { class: 'dugme ana genis', onclick: () => oturum() }, `${durum.oturumlar.length + 1}. oturumu başlat`);
  }

  kartlar.push(
    el(
      'section',
      { class: 'kart' },
      el('p', { class: 'etiket' }, asamaYazi),
      adim === 'baslangic-olcum'
        ? el('p', {}, 'Ön test tamam. Antrenmana başlamadan önce gerçek okuma hızını ölçelim.')
        : [
            el('div', { class: 'ilerleme-cubugu', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': P.ASAMA_OTURUM, 'aria-valuenow': durum.asamaOturum },
              el('i', { style: `width:${(durum.asamaOturum / P.ASAMA_OTURUM) * 100}%` })),
            el('p', { class: 'ikincil kucuk' },
              adim === 'asama-olcum'
                ? `${P.ASAMA_OTURUM} oturum bitti. Sırada aşama sonu ölçümü var.`
                : `Bu aşamada ${durum.asamaOturum}/${P.ASAMA_OTURUM} oturum tamam.`),
          ],
      el('div', { class: 'sayilar' },
        sayiKutu(tam(hiz.heceDk), 'hece/dk antrenman hızı'),
        sayiKutu(tam(hiz.kelimeDk), 'kelime/dk karşılığı'),
        son ? sayiKutu(tam(son.eoe), 'son etkili okuma endeksi') : null,
        son ? sayiKutu(yuzde(son.anlama), 'son ölçümde anlama') : null),
      el('div', { class: 'dugmeler' }, anaDugme)
    )
  );

  const saat = P.sonOturumdanBeriSaat(durum);
  if (adim === 'oturum' && saat != null && saat < 20) {
    kartlar.push(
      el('section', { class: 'kart uyari' },
        el('p', {}, `Son oturumdan bu yana ${Math.max(1, Math.round(saat))} saat geçti. Araştırmada oturumlar arasında 1-3 gün vardı; dinlenmiş başlamak daha iyi sonuç verir. Yine de istersen başlayabilirsin.`))
    );
  }

  if (adim === 'oturum') {
    const kalan = havuz.filter((c) => !durum.kullanilanCumle.includes(c.id)).length;
    if (yedek) {
      kartlar.push(el('section', { class: 'kart uyari' },
        el('p', {}, `Aşama ${durum.asama} cümleleri henüz eklenmedi. Şimdilik önceki aşamanın cümleleriyle devam ediliyor.`)));
    } else if (kalan < P.OTURUM_CUMLE) {
      kartlar.push(el('section', { class: 'kart uyari' },
        el('p', {}, `Bu aşamada okumadığın ${kalan} cümle kaldı. Sonraki oturumda bazı cümleler tekrar gelecek; tekrar eden cümleler hızı olduğundan iyi gösterebilir.`)));
    }
  }

  if (temel && son && son !== temel) {
    const fark = (son.eoe - temel.eoe) / temel.eoe;
    kartlar.push(
      el('section', { class: 'kart' },
        el('p', { class: 'etiket' }, 'Başlangıca göre'),
        el('p', {}, `Etkili okuma endeksin ${fark >= 0 ? '%' + Math.round(fark * 100) + ' arttı' : '%' + Math.round(-fark * 100) + ' düştü'} (${tam(temel.eoe)} → ${tam(son.eoe)}).`))
    );
  }

  kartlar.push(nasilCalisir());
  goster(...kartlar);
}

function sayiKutu(deger, aciklama) {
  return el('div', { class: 'sayi' }, el('b', {}, deger), el('span', {}, aciklama));
}

function karsilama() {
  return el('div', {},
    el('section', { class: 'kart' },
      el('h2', {}, 'Hoş geldin'),
      el('p', {}, 'Bu uygulama, kontrollü deneylerde okuma hızını ve anlamayı birlikte artırdığı görülen okuma hızlandırma yöntemini Türkçeye uyarlıyor.'),
      el('ol', { class: 'adimlar' },
        el('li', {}, el('b', {}, 'Ön test (3 dk): '), '12 cümleyi kendi hızında okursun. Antrenman bu hızdan başlar.'),
        el('li', {}, el('b', {}, 'Başlangıç ölçümü (5 dk): '), '2 kısa metin ve 10 soru. Gerçek okuma hızın ve anlaman ölçülür.'),
        el('li', {}, el('b', {}, 'Antrenman: '), 'haftada 3 oturum, her biri 15-20 dk. 3 aşama, toplam 24 oturum.')),
      el('p', { class: 'not' }, 'Hızı hece/dk ile ölçüyoruz. Türkçe kelimeler ekler yüzünden uzun olduğu için kelime/dk Türkçeyi olduğundan yavaş gösterir; yine de yanında yazar.'),
      el('div', { class: 'dugmeler' }, el('button', { class: 'dugme ana genis', onclick: () => onTest() }, 'Ön teste başla'))),
    nasilCalisir());
}

function nasilCalisir() {
  return el('details', { class: 'kart' },
    el('summary', {}, el('b', {}, 'Nasıl çalışıyor?')),
    el('p', {}, 'Antrenmanda cümle, karakter karakter silinir. Silinmeden okumaya çalışırsın; erken bitirdiysen Okudum\'a basarsın. Her cümleden sonra bir soru gelir.'),
    el('p', {}, 'Üst üste 3 doğru cevapta silme hızı karakter başına 2 ms artar, tek yanlışta 2 ms azalır. Bu kural, anlamanın yaklaşık %80\'de kaldığı en yüksek hızı bulur.'),
    el('p', {}, 'Asıl sonuç ölçümlerde görünür: kendi hızında okuduğun metinlerde hece/dk ile anlamanın çarpımı, yani etkili okuma endeksi.'),
    el('p', {}, el('a', { href: 'https://github.com/Sadrettin86/turkish-speed-reading/blob/main/docs/ARASTIRMA.md', target: '_blank', rel: 'noopener' }, 'Bilimsel dayanak ve kaynaklar')));
}

// ---------- okuma ekranı parçaları ----------

function okumaEkrani({ sira, toplam, bilgi, onKapat }) {
  const cubuk = el('i', { style: `width:${toplam ? (sira / toplam) * 100 : 0}%` });
  const bilgiSpan = el('span', {}, bilgi || '');
  const ust = el('div', { class: 'okuma-ust' },
    onKapat ? el('button', { class: 'kapat', 'aria-label': 'Duraklat', onclick: onKapat }, '✕') : null,
    el('div', { class: 'ilerleme-cubugu' }, cubuk),
    toplam ? el('span', {}, `${sira + 1}/${toplam}`) : null,
    bilgiSpan);
  const sahne = el('div', { class: 'sahne' });
  const alt = el('div', { class: 'okuma-alt' });
  goster(el('div', { class: 'okuma-ekrani' }, ust, sahne, alt));
  return { sahne, alt, bilgiSpan };
}

// Çoktan seçmeli soru. Doğru cevap verilerde her zaman ilk seçenektir; burada karıştırılır.
function soruSor(sahne, alt, soru, siklar) {
  return new Promise((coz) => {
    const secenekler = P.karistir(siklar.map((m, i) => ({ m, dogru: i === 0 })));
    let cevaplandi = false;
    const dugmeler = secenekler.map((s, i) =>
      el('button', { class: 'secenek', onclick: () => sec(i) }, el('kbd', {}, String(i + 1)), el('span', {}, s.m)));
    sahne.onclick = null;
    sahne.replaceChildren(el('div', { style: 'width:100%' },
      el('p', { class: 'soru' }, soru),
      el('div', { class: 'secenekler' }, dugmeler)));
    alt.replaceChildren();
    async function sec(i) {
      if (cevaplandi) return;
      cevaplandi = true;
      tusIsleyici = null;
      const dogru = secenekler[i].dogru;
      dugmeler[i].classList.add(dogru ? 'dogru' : 'yanlis');
      if (!dogru) dugmeler[secenekler.findIndex((s) => s.dogru)].classList.add('dogru');
      await bekle(dogru ? 350 : 700);
      coz(dogru);
    }
    tusIsleyici = (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= secenekler.length) {
        e.preventDefault();
        sec(n - 1);
      }
    };
  });
}

function cumleDugumu(metin) {
  const p = el('p', { class: 'cumle', lang: 'tr' });
  const harfler = [];
  for (const parca of metin.split(/( )/)) {
    if (!parca) continue;
    if (parca === ' ') {
      const s = el('span', { class: 'h' }, ' ');
      harfler.push(s);
      p.append(s);
    } else {
      const k = el('span', { class: 'k' });
      for (const ch of Array.from(parca)) {
        const s = el('span', { class: 'h' }, ch);
        harfler.push(s);
        k.append(s);
      }
      p.append(k);
    }
  }
  return { p, harfler };
}

// Tek cümle denemesi. ms verilirse cümle karakter karakter silinir (hızlandırma), verilmezse serbest okuma.
// Sonuç: { durum: 'tamam', sure, dogru, otomatik } ya da { durum: 'duraklat' }
function cumleDenemesi({ cumle, ms, sira, toplam, bilgi }) {
  return new Promise((coz) => {
    let bitti = false;
    let sonuclandi = false;
    let raf = 0;
    let zaman = 0;
    const sonuc = (x) => {
      if (sonuclandi) return;
      sonuclandi = true;
      coz(x);
    };
    // Okuma ya da soru sırasında ✕: deneme baştan alınır.
    const duraklat = () => {
      if (sonuclandi) return;
      bitti = true;
      cancelAnimationFrame(raf);
      clearTimeout(zaman);
      tusIsleyici = null;
      sonuc({ durum: 'duraklat' });
    };
    const { sahne, alt } = okumaEkrani({ sira, toplam, bilgi, onKapat: duraklat });
    sahne.replaceChildren(el('span', { class: 'sabitleme', 'aria-hidden': 'true' }, '+'));
    tusIsleyici = (e) => {
      if (e.key === 'Escape') duraklat();
    };

    zaman = setTimeout(() => {
      if (bitti) return;
      const { p, harfler } = cumleDugumu(cumle.t);
      sahne.replaceChildren(p);
      const t0 = performance.now();
      let silinen = 0;
      const okudum = async (otomatik) => {
        if (bitti) return;
        bitti = true;
        cancelAnimationFrame(raf);
        const sure = performance.now() - t0;
        tusIsleyici = null;
        const dogru = await soruSor(sahne, alt, cumle.s, cumle.c);
        sonuc({ durum: 'tamam', sure, dogru, otomatik });
      };
      if (ms) {
        const adim = (simdi) => {
          if (bitti) return;
          const n = Math.min(harfler.length, Math.floor(Math.max(0, simdi - t0) / ms));
          while (silinen < n) harfler[silinen++].classList.add('silindi');
          if (silinen >= harfler.length) okudum(true);
          else raf = requestAnimationFrame(adim);
        };
        raf = requestAnimationFrame(adim);
      }
      sahne.onclick = () => okudum(false);
      alt.replaceChildren(el('button', { class: 'dugme ana genis', onclick: () => okudum(false) }, 'Okudum'));
      tusIsleyici = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          okudum(false);
        } else if (e.key === 'Escape') duraklat();
      };
    }, 500);
  });
}

function duraklatmaEkrani(mesaj) {
  return new Promise((coz) => {
    odak(true);
    const devam = el('button', { class: 'dugme ana', onclick: () => coz(true) }, 'Devam et');
    const birak = el('button', { class: 'dugme tehlike', onclick: () => coz(false) }, 'Bırak');
    goster(el('section', { class: 'kart', style: 'margin-top:20vh' },
      el('h2', {}, 'Duraklatıldı'),
      el('p', {}, mesaj),
      el('div', { class: 'dugmeler' }, devam, birak)));
    devam.focus();
  });
}

async function denemeyiTamamla(secenekler, mesaj) {
  for (;;) {
    const r = await cumleDenemesi(secenekler);
    if (r.durum === 'tamam') return r;
    if (!(await duraklatmaEkrani(mesaj))) return null;
  }
}

function girisEkrani(baslik, paragraflar, dugmeYazi, ikinci) {
  odak(true);
  const dugme = el('button', { class: 'dugme ana genis' }, dugmeYazi);
  const vazgec = el('button', { class: 'dugme genis', onclick: () => pano() }, ikinci || 'Vazgeç');
  goster(el('section', { class: 'kart', style: 'margin-top:8vh' },
    el('h2', {}, baslik),
    paragraflar.map((x) => (typeof x === 'string' ? el('p', {}, x) : x)),
    el('div', { class: 'dugmeler' }, dugme, vazgec)));
  dugme.focus();
  return dugmeBekle(dugme);
}

// ---------- ön test ----------

async function onTest() {
  const cumleler = veri.onTest;
  await girisEkrani('Ön test', [
    `${cumleler.length} cümle göreceksin. Her birini normal hızında, anlayarak oku.`,
    'Bitirince Okudum\'a bas (metne dokunmak, boşluk ya da Enter da olur). Ardından tek bir soru gelecek; 1-4 tuşlarıyla da cevaplayabilirsin.',
    'Bu testte süre sınırı yok. Hızlı okumaya çalışma, her zamanki gibi oku.',
  ], 'Başla');

  const denemeler = [];
  for (let i = 0; i < cumleler.length; i++) {
    const c = cumleler[i];
    const r = await denemeyiTamamla({ cumle: c, ms: null, sira: i, toplam: cumleler.length }, 'Devam edersen bu cümle baştan gösterilir.');
    if (!r) return pano();
    denemeler.push({ id: c.id, ms: r.sure, karakter: karakterSay(c.t), dogru: r.dogru });
  }
  const ms = baslangicMs(denemeler);
  guncelleDurum(P.onTestKaydet(durum, { ms, denemeler, tarih: new Date().toISOString() }));
  const hiz = msdenHiz(ms, veri.onTest);
  const dogru = denemeler.filter((d) => d.dogru).length;

  odak(true);
  const devam = el('button', { class: 'dugme ana genis', onclick: () => olcum('baslangic') }, 'Başlangıç ölçümüne geç');
  goster(el('section', { class: 'kart', style: 'margin-top:8vh' },
    el('h2', {}, 'Ön test bitti'),
    el('div', { class: 'sayilar' },
      sayiKutu(tam(hiz.heceDk), 'hece/dk'),
      sayiKutu(tam(hiz.kelimeDk), 'kelime/dk'),
      sayiKutu(`${dogru}/${denemeler.length}`, 'doğru cevap')),
    el('p', { class: 'not', style: 'margin-top:10px' }, `Antrenman karakter başına ${ms} ms ile başlayacak.`),
    el('div', { class: 'dugmeler' }, devam, el('button', { class: 'dugme genis', onclick: () => pano() }, 'Sonra'))));
  devam.focus();
}

// ---------- antrenman oturumu ----------

async function oturum() {
  const { havuz, yedek } = aktifHavuz();
  if (!havuz.length) {
    ipucu('Bu aşama için henüz cümle yok.');
    return pano();
  }
  const { secilen, tekrar } = P.cumleSec(havuz, durum.kullanilanCumle);
  const no = durum.oturumlar.length + 1;
  const hiz0 = msdenHiz(durum.ms, havuz);

  await girisEkrani(`${no}. oturum`, [
    `${secilen.length} cümle, yaklaşık 15-20 dakika.`,
    'Cümle görünür görünmez soldan başlayarak karakter karakter silinmeye başlar. Silinmeden okumaya çalış; bitirdiysen beklemeden Okudum\'a bas.',
    'Her cümleden sonra bir soru gelecek. Üst üste 3 doğruda hız artar, yanlışta biraz düşer. Yanlışlar sürecin parçası.',
    el('p', { class: 'not' }, `Başlangıç hızı: ${tam(hiz0.heceDk)} hece/dk (${tam(hiz0.kelimeDk)} kelime/dk).`),
    tekrar ? el('p', { class: 'not' }, `${tekrar} cümle daha önce okuduklarından tekrar ediyor.`) : null,
    yedek ? el('p', { class: 'not' }, 'Bu aşamanın cümleleri henüz eklenmedi; önceki aşamanın cümleleri kullanılıyor.') : null,
  ], 'Başla');

  const baslangic = durum.ms;
  let m = { ms: durum.ms, seri: durum.seri || 0 };
  const kayitlar = [];
  for (let i = 0; i < secilen.length; i++) {
    const c = secilen[i];
    const bilgi = `${tam(msdenHiz(m.ms, havuz).heceDk)} hece/dk`;
    const r = await denemeyiTamamla(
      { cumle: c, ms: m.ms, sira: i, toplam: secilen.length, bilgi },
      'Devam edersen bu cümle baştan gösterilir. Bırakırsan oturum kaydedilmez.');
    if (!r) return pano();
    kayitlar.push({ id: c.id, ms: m.ms, sure: Math.round(r.sure), dogru: r.dogru, otomatik: r.otomatik });
    m = guncelle(m, r.dogru);
  }

  const dogru = kayitlar.filter((k) => k.dogru).length;
  const sonuc = {
    tarih: new Date().toISOString(),
    baslangicMs: baslangic,
    bitisMs: m.ms,
    seri: m.seri,
    dogru,
    toplam: kayitlar.length,
    tekrar,
    cumleIdleri: kayitlar.map((k) => k.id),
    heceKarakter: havuzOrani(havuz).hece,
    kelimeKarakter: havuzOrani(havuz).kelime,
    denemeler: kayitlar,
  };
  guncelleDurum(P.oturumKaydet(durum, sonuc));

  const h0 = msdenHiz(baslangic, havuz);
  const h1 = msdenHiz(m.ms, havuz);
  const oran = dogru / kayitlar.length;
  odak(true);
  const tamam = el('button', { class: 'dugme ana genis', onclick: () => pano() }, 'Panoya dön');
  goster(el('section', { class: 'kart', style: 'margin-top:8vh' },
    el('h2', {}, `${no}. oturum bitti`),
    el('div', { class: 'sayilar' },
      sayiKutu(`${tam(h0.heceDk)} → ${tam(h1.heceDk)}`, 'hece/dk antrenman hızı'),
      sayiKutu(yuzde(oran), `doğru (${dogru}/${kayitlar.length})`)),
    el('p', { class: 'not', style: 'margin-top:10px' },
      oran < 0.7
        ? 'Anlama bu oturumda düşük kaldı; hız otomatik olarak geri çekildi. Bu beklenen bir durum.'
        : 'Bir sonraki oturum bu hızdan devam edecek.'),
    el('div', { class: 'dugmeler' }, tamam)));
  tamam.focus();
}

// ---------- ölçüm ----------

async function olcum(tur) {
  const paragraflar = P.paragrafSec(veri.olcum, durum.kullanilanParagraf);
  const baslik = tur === 'baslangic' ? 'Başlangıç ölçümü' : `Aşama ${durum.asama} sonu ölçümü`;
  await girisEkrani(baslik, [
    `${paragraflar.length} kısa metin okuyacaksın. Normal hızında, anlamaya çalışarak oku.`,
    'Burada süre sınırı yok ve geri dönüp okuyabilirsin. Bu ölçüm, gerçek okuma hızını gösterir; acele etmen sonucu bozar.',
    'Bitince Bitirdim\'e bas. Metin kapanır ve 5 soru gelir.',
  ], 'Başla');

  let hece = 0;
  let kelime = 0;
  let sure = 0;
  let dogru = 0;
  let soruSayisi = 0;

  for (let i = 0; i < paragraflar.length; i++) {
    const p = paragraflar[i];
    const okunan = await paragrafOku(p, i, paragraflar.length);
    if (okunan == null) return pano();
    hece += heceSay(p.metin);
    kelime += kelimeler(p.metin).length;
    sure += okunan;
    const { sahne, alt } = okumaEkrani({ sira: i, toplam: paragraflar.length, bilgi: 'Sorular', onKapat: null });
    for (const s of p.sorular) {
      if (await soruSor(sahne, alt, s.s, s.c)) dogru++;
      soruSayisi++;
    }
  }

  const heceDk = dakikadaBirim(hece, sure);
  const kelimeDk = dakikadaBirim(kelime, sure);
  const anlama = soruSayisi ? dogru / soruSayisi : 0;
  const sonuc = {
    tarih: new Date().toISOString(),
    heceDk,
    kelimeDk,
    anlama,
    eoe: heceDk * anlama,
    sureMs: Math.round(sure),
    dogru,
    soruSayisi,
    paragrafIdleri: paragraflar.map((p) => p.id),
  };
  const temel = P.baslangicOlcumu(durum);
  const { durum: yeni, karar } = P.olcumKaydet(durum, tur === 'baslangic' ? 'baslangic' : 'asama-sonu', sonuc);
  guncelleDurum(yeni);

  odak(true);
  const tamam = el('button', { class: 'dugme ana genis', onclick: () => pano() }, 'Panoya dön');
  goster(el('section', { class: 'kart', style: 'margin-top:8vh' },
    el('h2', {}, `${baslik} bitti`),
    el('div', { class: 'sayilar' },
      sayiKutu(tam(heceDk), 'hece/dk'),
      sayiKutu(tam(kelimeDk), 'kelime/dk'),
      sayiKutu(`${dogru}/${soruSayisi}`, 'doğru cevap'),
      sayiKutu(tam(sonuc.eoe), 'etkili okuma endeksi')),
    temel && tur !== 'baslangic'
      ? el('p', { style: 'margin-top:10px' }, `Başlangıçta etkili okuma endeksin ${tam(temel.eoe)} idi.`)
      : el('p', { class: 'not', style: 'margin-top:10px' }, 'Etkili okuma endeksi = hece/dk × anlama oranı. Gelişimini bu sayı üzerinden izleyeceğiz.'),
    karar ? el('p', {}, el('b', {}, karar.mesaj)) : null,
    el('div', { class: 'dugmeler' }, tamam)));
  tamam.focus();
}

function paragrafOku(p, sira, toplam) {
  return new Promise(async (coz) => {
    for (;;) {
      const sonuc = await new Promise((ic) => {
        let bitti = false;
        const birak = () => {
          if (bitti) return;
          bitti = true;
          ic(null);
        };
        const { sahne, alt } = okumaEkrani({ sira, toplam, bilgi: 'Kendi hızında oku', onKapat: birak });
        sahne.replaceChildren(el('p', { class: 'paragraf', lang: 'tr' }, p.metin));
        sahne.style.cursor = 'default';
        const t0 = performance.now();
        const bitir = () => {
          if (bitti) return;
          bitti = true;
          tusIsleyici = null;
          ic(performance.now() - t0);
        };
        alt.replaceChildren(el('button', { class: 'dugme ana genis', onclick: bitir }, 'Bitirdim'));
        tusIsleyici = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            bitir();
          } else if (e.key === 'Escape') birak();
        };
      });
      if (sonuc != null) return coz(sonuc);
      if (!(await duraklatmaEkrani('Devam edersen bu metin baştan gösterilir. Bırakırsan ölçüm kaydedilmez.'))) return coz(null);
    }
  });
}

// ---------- ilerleme ----------

function ilerleme() {
  navGuncelle('ilerleme');
  odak(false);
  if (!durum.olcumler.length && !durum.oturumlar.length) {
    return goster(el('section', { class: 'kart' }, el('h2', {}, 'Henüz veri yok'), el('p', {}, 'Ön testi ve başlangıç ölçümünü yaptığında gelişimin burada görünecek.')));
  }
  const olcumAdi = (o, i) => (o.tur === 'baslangic' ? 'Başlangıç' : `${i}. ölçüm`);
  const kartlar = [];

  if (durum.olcumler.length) {
    kartlar.push(el('section', { class: 'kart' },
      el('h2', {}, 'Etkili okuma endeksi'),
      el('p', { class: 'ikincil kucuk' }, 'Kendi hızında okunan ölçüm metinlerinde hece/dk × anlama oranı.'),
      cizgiGrafik(durum.olcumler.map((o, i) => ({
        x: olcumAdi(o, i),
        y: o.eoe,
        ipucu: `${olcumAdi(o, i)}: ${tam(o.eoe)} · ${tam(o.heceDk)} hece/dk · anlama ${yuzde(o.anlama)}`,
      })))));
    kartlar.push(el('section', { class: 'kart' },
      el('h3', {}, 'Ölçümler'),
      el('div', { class: 'tablo-kap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['Tarih', 'Tür', 'Hece/dk', 'Anlama', 'Endeks'].map((b) => el('th', {}, b)))),
        el('tbody', {}, durum.olcumler.map((o) => el('tr', {},
          el('td', {}, tarihYaz(o.tarih)),
          el('td', {}, o.tur === 'baslangic' ? 'Başlangıç' : `Aşama ${o.asama} sonu`),
          el('td', { title: `${tam(o.kelimeDk)} kelime/dk` }, tam(o.heceDk)),
          el('td', {}, yuzde(o.anlama)),
          el('td', {}, tam(o.eoe)))))))));
  }

  if (durum.oturumlar.length) {
    const hizi = (o, ms) => (o.heceKarakter * 60000) / ms;
    kartlar.push(el('section', { class: 'kart' },
      el('h2', {}, 'Antrenman hızı'),
      el('p', { class: 'ikincil kucuk' }, 'Her oturumun sonunda ulaşılan silme hızı (hece/dk).'),
      cizgiGrafik(durum.oturumlar.map((o) => ({
        x: String(o.no),
        y: hizi(o, o.bitisMs),
        ipucu: `${o.no}. oturum: ${tam(hizi(o, o.bitisMs))} hece/dk · doğru ${yuzde(o.dogru / o.toplam)}`,
      })))));
    kartlar.push(el('section', { class: 'kart' },
      el('h3', {}, 'Oturumlar'),
      el('div', { class: 'tablo-kap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['No', 'Tarih', 'Aşama', 'Hız (hece/dk)', 'Doğru'].map((b) => el('th', {}, b)))),
        el('tbody', {}, [...durum.oturumlar].reverse().map((o) => el('tr', {},
          el('td', {}, o.no),
          el('td', {}, tarihYaz(o.tarih)),
          el('td', {}, o.asama),
          el('td', {}, `${tam(hizi(o, o.baslangicMs))} → ${tam(hizi(o, o.bitisMs))}`),
          el('td', {}, yuzde(o.dogru / o.toplam)))))))));
  }
  goster(...kartlar);
}

function cizgiGrafik(noktalar) {
  const G = 420;
  const Y = 200;
  const sol = 46;
  const sag = 16;
  const ust = 14;
  const alt = 28;
  const enCok = Math.max(...noktalar.map((n) => n.y), 1);
  const adim = guzelAdim(enCok / 4);
  const tavan = Math.ceil((enCok * 1.08) / adim) * adim;
  const x = (i) => (noktalar.length === 1 ? (sol + G - sag) / 2 : sol + (i * (G - sol - sag)) / (noktalar.length - 1));
  const y = (v) => ust + (1 - v / tavan) * (Y - ust - alt);
  const ns = 'http://www.w3.org/2000/svg';
  const s = (etiket, oz = {}, ...c) => {
    const e = document.createElementNS(ns, etiket);
    for (const [k, v] of Object.entries(oz)) e.setAttribute(k, v);
    for (const x of c) e.append(x.nodeType ? x : document.createTextNode(String(x)));
    return e;
  };
  const svg = s('svg', { viewBox: `0 0 ${G} ${Y}`, role: 'img', 'aria-label': 'Çizgi grafik' });
  for (let v = 0; v <= tavan + 1e-9; v += adim) {
    svg.append(s('line', { class: 'izgara', x1: sol, x2: G - sag, y1: y(v), y2: y(v) }));
    svg.append(s('text', { class: 'eksen-yazi', x: sol - 8, y: y(v) + 4, 'text-anchor': 'end' }, tam(v)));
  }
  const etiketAraligi = Math.ceil(noktalar.length / 8);
  noktalar.forEach((n, i) => {
    if (i % etiketAraligi === 0 || i === noktalar.length - 1) {
      svg.append(s('text', { class: 'eksen-yazi', x: x(i), y: Y - 6, 'text-anchor': 'middle' }, n.x));
    }
  });
  if (noktalar.length > 1) {
    svg.append(s('path', { class: 'cizgi', d: noktalar.map((n, i) => `${i ? 'L' : 'M'}${x(i)},${y(n.y)}`).join(' ') }));
  }
  const imlec = s('line', { class: 'imlec', x1: 0, x2: 0, y1: ust, y2: Y - alt, visibility: 'hidden' });
  svg.append(imlec);
  const kap = el('div', { class: 'grafik' });
  const kutu = el('div', { class: 'ipucu-kutu', hidden: true });
  noktalar.forEach((n, i) => {
    svg.append(s('circle', { class: 'nokta', cx: x(i), cy: y(n.y), r: 5 }));
    const hedef = s('circle', { class: 'hedef', cx: x(i), cy: y(n.y), r: 18, tabindex: 0, 'aria-label': n.ipucu });
    const goster = () => {
      const r = svg.getBoundingClientRect();
      const olcek = r.width / G;
      kutu.textContent = n.ipucu;
      kutu.hidden = false;
      const yarim = kutu.offsetWidth / 2;
      const sol = Math.min(Math.max(x(i) * olcek, yarim), kap.clientWidth - yarim);
      kutu.style.left = `${sol}px`;
      kutu.style.top = `${y(n.y) * olcek}px`;
      imlec.setAttribute('x1', x(i));
      imlec.setAttribute('x2', x(i));
      imlec.setAttribute('visibility', 'visible');
    };
    const gizle = () => {
      kutu.hidden = true;
      imlec.setAttribute('visibility', 'hidden');
    };
    hedef.addEventListener('pointerenter', goster);
    hedef.addEventListener('pointerleave', gizle);
    hedef.addEventListener('focus', goster);
    hedef.addEventListener('blur', gizle);
    hedef.addEventListener('click', goster);
    svg.append(hedef);
  });
  kap.append(svg, kutu);
  return kap;
}

function guzelAdim(ham) {
  const us = Math.pow(10, Math.floor(Math.log10(Math.max(ham, 1e-9))));
  const k = ham / us;
  return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 5 ? 5 : 10) * us;
}

// ---------- ayarlar ----------

function ayarlar() {
  navGuncelle('ayarlar');
  odak(false);
  const boyutlar = [
    [0.9, 'Küçük'],
    [1, 'Orta'],
    [1.15, 'Büyük'],
    [1.3, 'Çok büyük'],
  ];
  const secili = durum.ayarlar?.yaziBoyutu || 1;
  const dosya = el('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  dosya.addEventListener('change', async () => {
    const f = dosya.files?.[0];
    if (!f) return;
    try {
      guncelleDurum(await iceAktar(f));
      yaziOlcegiUygula();
      ipucu('Yedek yüklendi.');
      pano();
    } catch (e) {
      ipucu(e.message || 'Dosya okunamadı.');
    }
  });
  const sifirKutu = el('div', {});
  const sifirDugme = el('button', {
    class: 'dugme tehlike',
    onclick: () => {
      sifirKutu.replaceChildren(
        el('p', {}, 'Tüm ilerleme silinecek. Önce yedek indirmek isteyebilirsin.'),
        el('div', { class: 'dugmeler' },
          el('button', {
            class: 'dugme tehlike',
            onclick: () => {
              durum = sifirla();
              yaziOlcegiUygula();
              ipucu('İlerleme sıfırlandı.');
              pano();
            },
          }, 'Evet, sıfırla'),
          el('button', { class: 'dugme', onclick: () => ayarlar() }, 'Vazgeç')));
    },
  }, 'İlerlemeyi sıfırla');
  sifirKutu.append(sifirDugme);

  goster(
    el('section', { class: 'kart' },
      el('h2', {}, 'Okuma yazısı boyutu'),
      el('div', { class: 'secim' }, boyutlar.map(([v, ad]) =>
        el('button', {
          class: 'dugme',
          'aria-pressed': String(v === secili),
          onclick: () => {
            guncelleDurum({ ...durum, ayarlar: { ...durum.ayarlar, yaziBoyutu: v } });
            yaziOlcegiUygula();
            ayarlar();
          },
        }, ad))),
      el('p', { class: 'cumle', style: 'margin-top:14px' }, 'Örnek: Sabah vapuru bugün on dakika geç kalktı.')),
    el('section', { class: 'kart' },
      el('h2', {}, 'Yedek'),
      el('p', { class: 'ikincil' }, 'İlerleme yalnızca bu tarayıcıda saklanır. Telefon ile bilgisayar arasında taşımak için yedeği indirip diğer cihazda yükle.'),
      el('div', { class: 'dugmeler' },
        el('button', { class: 'dugme', onclick: () => disaAktar(durum) }, 'Yedeği indir'),
        el('button', { class: 'dugme', onclick: () => dosya.click() }, 'Yedek yükle'),
        dosya)),
    el('section', { class: 'kart' }, el('h2', {}, 'Sıfırla'), sifirKutu),
    el('section', { class: 'kart' },
      el('h2', {}, 'Hakkında'),
      el('p', {}, 'Antrenman, Breznitz ve arkadaşlarının (2013) okuma hızlandırma protokolüne dayanır. Hız ayarı Levitt (1971) merdiven yöntemini, metin zorluğu Ateşman (1997) okunabilirlik formülünü kullanır.'),
      el('p', {}, 'RSVP, Schulte tablosu ve göz egzersizleri, normal okumada kanıtı olmadığı ya da anlamayı düşürdüğü için yok.'),
      el('p', {}, el('a', { href: 'https://github.com/Sadrettin86/turkish-speed-reading/blob/main/docs/ARASTIRMA.md', target: '_blank', rel: 'noopener' }, 'Araştırma notu ve kaynaklar'), ' · ',
        el('a', { href: 'https://github.com/Sadrettin86/turkish-speed-reading', target: '_blank', rel: 'noopener' }, 'Kaynak kod'))));
}

// ---------- başlat ----------

async function basla() {
  document.querySelectorAll('[data-git]').forEach((b) => b.addEventListener('click', () => git(b.dataset.git)));
  yaziOlcegiUygula();
  try {
    await veriYukle();
  } catch {
    goster(el('section', { class: 'kart' }, el('h2', {}, 'İçerik yüklenemedi'), el('p', {}, 'Sayfayı yenile. Sorun sürerse bağlantını kontrol et.')));
    return;
  }
  pano();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

basla();
