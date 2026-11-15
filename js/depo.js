// İlerleme tarayıcıda saklanır. Cihazlar arası taşımak için dışa/içe aktarma var.
import { bosDurum } from './program.js';

const ANAHTAR = 'tsr-durum-v1';

export function yukle() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return bosDurum();
    return { ...bosDurum(), ...JSON.parse(ham) };
  } catch {
    return bosDurum();
  }
}

export function kaydet(durum) {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(durum));
    return true;
  } catch {
    return false;
  }
}

export function sifirla() {
  try {
    localStorage.removeItem(ANAHTAR);
  } catch {
    /* yok say */
  }
  return bosDurum();
}

export function disaAktar(durum) {
  const blob = new Blob([JSON.stringify(durum, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hizli-okuma-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function iceAktar(dosya) {
  const veri = JSON.parse(await dosya.text());
  if (!veri || veri.surum !== 1 || !Array.isArray(veri.oturumlar)) {
    throw new Error('Bu dosya bir hızlı okuma yedeği değil.');
  }
  return { ...bosDurum(), ...veri };
}
