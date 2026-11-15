// Program akışı: başlangıç ölçümü → 3 aşama × 8 oturum → aşama sonu ölçümleri → bakım.
// Breznitz ve ark. (2013): 24 oturum, haftada 3, oturumda 50 cümle.

export const OTURUM_CUMLE = 50;
export const ASAMA_OTURUM = 8;
export const ASAMA_SAYISI = 3;
export const GECME_ANLAMA = 0.8;
export const OLCUM_PARAGRAF = 2;
export const ASAMA_ADI = { 1: 'Kolay metinler', 2: 'Orta metinler', 3: 'Zor metinler' };

export function bosDurum() {
  return {
    surum: 1,
    olusturma: new Date().toISOString(),
    ms: null,
    seri: 0,
    asama: 1,
    asamaOturum: 0,
    tamamlandi: false,
    oturumlar: [],
    olcumler: [],
    onTest: null,
    kullanilanCumle: [],
    kullanilanParagraf: [],
    ayarlar: { yaziBoyutu: 1 },
  };
}

export function baslangicOlcumu(durum) {
  return durum.olcumler.find((o) => o.tur === 'baslangic') || null;
}

export function sonrakiAdim(durum) {
  if (!durum.onTest || durum.ms == null) return 'on-test';
  if (!baslangicOlcumu(durum)) return 'baslangic-olcum';
  if (durum.asamaOturum >= ASAMA_OTURUM) return 'asama-olcum';
  return 'oturum';
}

export function onTestKaydet(durum, { ms, denemeler, tarih }) {
  return { ...durum, ms, seri: 0, onTest: { ms, denemeler, tarih } };
}

export function oturumKaydet(durum, sonuc) {
  const kayit = { ...sonuc, asama: durum.asama, no: durum.oturumlar.length + 1 };
  return {
    ...durum,
    ms: sonuc.bitisMs,
    seri: sonuc.seri ?? 0,
    asamaOturum: durum.asamaOturum + 1,
    oturumlar: [...durum.oturumlar, kayit],
    kullanilanCumle: birlesik(durum.kullanilanCumle, sonuc.cumleIdleri || []),
  };
}

// Ölçüm sonucu: { heceDk, kelimeDk, anlama (0-1), eoe, paragrafIdleri, tarih }
export function olcumKaydet(durum, tur, olcum) {
  const kayit = { ...olcum, tur, asama: durum.asama };
  const yeni = {
    ...durum,
    olcumler: [...durum.olcumler, kayit],
    kullanilanParagraf: birlesik(durum.kullanilanParagraf, olcum.paragrafIdleri || []),
  };
  if (tur !== 'asama-sonu') return { durum: yeni, karar: null };

  const temel = baslangicOlcumu(durum);
  const anlamaTamam = olcum.anlama >= GECME_ANLAMA;
  const eoeTamam = !temel || olcum.eoe >= temel.eoe;
  const gecti = anlamaTamam && eoeTamam;
  let karar;
  if (gecti && durum.asama < ASAMA_SAYISI) {
    yeni.asama = durum.asama + 1;
    karar = { gecti, mesaj: `Aşama ${yeni.asama}'ye geçtin: ${ASAMA_ADI[yeni.asama]}.` };
  } else if (gecti) {
    const ilkKez = !durum.tamamlandi;
    yeni.tamamlandi = true;
    karar = {
      gecti,
      mesaj: ilkKez
        ? '24 oturumluk programı bitirdin. Bundan sonra bakım oturumlarıyla devam edebilirsin.'
        : 'Bakım ölçümü kaydedildi. Kazanımın korunuyor.',
    };
  } else {
    const nedenler = [];
    if (!anlamaTamam) nedenler.push(`anlama %${Math.round(olcum.anlama * 100)} (gereken %${GECME_ANLAMA * 100})`);
    if (!eoeTamam) nedenler.push('etkili okuma endeksi başlangıcın altında');
    karar = { gecti, mesaj: `Bu aşamayı tekrar edeceğiz: ${nedenler.join(', ')}.` };
  }
  yeni.asamaOturum = 0;
  return { durum: yeni, karar };
}

export function karistir(dizi, rng = Math.random) {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Kullanılmamış cümleler önce; yetmezse kullanılmışlardan tamamlanır.
export function cumleSec(havuz, kullanilan, n = OTURUM_CUMLE, rng = Math.random) {
  const k = new Set(kullanilan);
  const yeni = karistir(havuz.filter((c) => !k.has(c.id)), rng);
  if (yeni.length >= n) return { secilen: yeni.slice(0, n), tekrar: 0 };
  const eski = karistir(havuz.filter((c) => k.has(c.id)), rng);
  const secilen = [...yeni, ...eski].slice(0, n);
  return { secilen, tekrar: secilen.length - yeni.length };
}

export function paragrafSec(paragraflar, kullanilan, n = OLCUM_PARAGRAF, rng = Math.random) {
  const k = new Set(kullanilan);
  const yeni = paragraflar.filter((p) => !k.has(p.id));
  const kaynak = yeni.length >= n ? yeni : paragraflar;
  return karistir(kaynak, rng).slice(0, n);
}

export function sonOturumdanBeriSaat(durum, simdi = Date.now()) {
  const son = durum.oturumlar[durum.oturumlar.length - 1];
  if (!son) return null;
  return (simdi - new Date(son.tarih).getTime()) / 3600000;
}

function birlesik(a, b) {
  return Array.from(new Set([...a, ...b]));
}
