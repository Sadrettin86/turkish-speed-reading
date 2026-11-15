// Türkçe metin yardımcıları: hece, harf, kelime sayımı ve Ateşman okunabilirliği.
// Türkçede her hece tek bir ünlü taşır; bu yüzden hece sayısı = ünlü sayısı.

const UNLU = /[aeıioöuüâîû]/g;

export function kucukHarf(s) {
  return String(s).toLocaleLowerCase('tr-TR');
}

export function heceSay(s) {
  const m = kucukHarf(s).match(UNLU);
  return m ? m.length : 0;
}

export function harfSay(s) {
  const m = String(s).match(/\p{L}/gu);
  return m ? m.length : 0;
}

export function karakterSay(s) {
  return Array.from(String(s)).length;
}

export function kelimeler(s) {
  return String(s)
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}'’-]/gu, ''))
    .filter((w) => /\p{L}/u.test(w));
}

export function cumleler(s) {
  return String(s)
    .split(/(?<=[.!?…])\s+/)
    .map((x) => x.trim())
    .filter((x) => /\p{L}/u.test(x));
}

// Ateşman (1997): 198,825 − 40,175 × (kelime başına hece) − 2,610 × (cümle başına kelime)
export function atesman(s) {
  const k = kelimeler(s);
  if (!k.length) return null;
  const c = Math.max(1, cumleler(s).length);
  const h = heceSay(k.join(' '));
  return 198.825 - 40.175 * (h / k.length) - 2.61 * (k.length / c);
}

export function atesmanBandi(puan) {
  if (puan == null) return '—';
  if (puan >= 90) return 'çok kolay';
  if (puan >= 70) return 'kolay';
  if (puan >= 50) return 'orta';
  if (puan >= 30) return 'zor';
  return 'çok zor';
}

export function metinOzeti(s) {
  return {
    kelime: kelimeler(s).length,
    hece: heceSay(s),
    harf: harfSay(s),
    karakter: karakterSay(s),
  };
}
