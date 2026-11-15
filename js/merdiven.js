// Okuma hızlandırma (RAP) için uyarlamalı süre ayarı.
// Breznitz ve ark. (2013): harf başına süre 2 ms'lik adımlarla değişir.
// Levitt (1971): 3 doğru üst üste → zorlaştır, 1 yanlış → kolaylaştır; %79,4 doğruya yakınsar.

export const ADIM_MS = 2;
export const ART_ARDA_DOGRU = 3;
export const EN_HIZLI_MS = 8;
export const EN_YAVAS_MS = 400;

export function yeniMerdiven(msKarakter) {
  return { ms: sinirla(Math.round(msKarakter)), seri: 0 };
}

export function guncelle(m, dogru) {
  if (dogru) {
    const seri = m.seri + 1;
    if (seri >= ART_ARDA_DOGRU) {
      const ms = sinirla(m.ms - ADIM_MS);
      return { ms, seri: 0, degisim: ms - m.ms };
    }
    return { ms: m.ms, seri, degisim: 0 };
  }
  const ms = sinirla(m.ms + ADIM_MS);
  return { ms, seri: 0, degisim: ms - m.ms };
}

function sinirla(ms) {
  return Math.min(EN_YAVAS_MS, Math.max(EN_HIZLI_MS, ms));
}

export function ortanca(dizi) {
  if (!dizi.length) return null;
  const s = [...dizi].sort((a, b) => a - b);
  const o = Math.floor(s.length / 2);
  return s.length % 2 ? s[o] : (s[o - 1] + s[o]) / 2;
}

// Ön testte kendi hızında okunan cümlelerden karakter başına süre.
// Doğru cevaplanan cümleler esas alınır; 6'dan azsa hepsi kullanılır.
export function baslangicMs(denemeler) {
  const dogrular = denemeler.filter((d) => d.dogru);
  const kaynak = dogrular.length >= 6 ? dogrular : denemeler;
  const m = ortanca(kaynak.map((d) => d.ms / d.karakter));
  return m == null ? null : sinirla(Math.round(m));
}

export function dakikadaBirim(birimSayisi, ms) {
  if (!ms) return 0;
  return birimSayisi / (ms / 60000);
}
