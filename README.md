# Hızlı Okuma

Araştırmaya dayalı, Türkçeye uyarlanmış okuma hızlandırma antrenmanı. Reklamsız, ücretsiz, kurulum gerektirmez; tarayıcıda çalışır ve telefonda ana ekrana eklenebilir.

**Uygulama:** https://sadrettin86.github.io/turkish-speed-reading/

## Ne yapar?

Kontrollü deneylerde okuma hızını ve anlamayı birlikte artırdığı gösterilen **okuma hızlandırma programını** (Breznitz ve ark., 2013) Türkçeye uyarlar:

1. **Ön test:** 12 cümleyi kendi hızında okursun. Antrenman bu hızdan başlar.
2. **Başlangıç ölçümü:** 2 kısa metin ve 10 soru. Gerçek okuma hızın (hece/dk) ve anlaman ölçülür.
3. **Antrenman:** Her oturumda 50 cümle. Cümle karakter karakter silinir; silinmeden okumaya çalışırsın, ardından bir soru gelir. Üst üste 3 doğruda hız artar, yanlışta biraz düşer. Bu kural, anlamanın yaklaşık %80'de kaldığı en yüksek hızı bulur.
4. **Aşamalar:** 3 aşama × 8 oturum. Her aşama sonunda ölçüm yapılır; anlama %80'in üstündeyse ve gelişim varsa metinler zorlaşır (kolay → orta → zor).

Gelişim **etkili okuma endeksi** (hece/dk × anlama oranı) ile izlenir.

RSVP (tek kelime akışı), Schulte tablosu ve göz egzersizleri bilerek yok: normal okumada işe yaradıklarını gösteren kanıt bulunamadı ya da anlamayı düşürdükleri görüldü. Ayrıntılar ve kaynaklar: [docs/ARASTIRMA.md](docs/ARASTIRMA.md).

## Türkçeye özgü kararlar

- **Hız hece/dk ile ölçülür.** Türkçe kelimeler ekler yüzünden uzun olduğu için kelime/dk Türkçeyi olduğundan yavaş gösterir. Kelime/dk yine de yanında yazar.
- **Hece sayımı kesin:** Türkçede her hece tek ünlü taşır, hece sayısı ünlü sayısına eşittir.
- **Silme süresi karakter başına:** uzun, çok ekli kelimelere kendiliğinden daha fazla süre kalır.
- **Metin zorluğu Ateşman (1997) okunabilirlik formülüyle** ayarlanır.
- **Soruların bir kısmı eklerdeki bilgiyi yoklar** (olumsuzluk, zaman, ettirgenlik: "yıkattı" → arabayı kim yıkadı?).

## Telefonda kullanım

iPhone: Safari'de uygulamayı aç → Paylaş → **Ana Ekrana Ekle**. Bir kez açıldıktan sonra internetsiz de çalışır.

İlerleme yalnızca o tarayıcıda saklanır. Telefon ile bilgisayar arasında taşımak için **Ayarlar → Yedeği indir / Yedek yükle**.

## İçerik durumu

| Dosya | İçerik | Durum |
|---|---|---|
| `data/on-test.json` | Ön test, 12 cümle | tamam |
| `data/asama1.json` | Kolay cümleler (Ateşman 72) | 200 / 400 cümle (4 oturumluk) |
| `data/asama2.json` | Orta cümleler | eklenecek |
| `data/asama3.json` | Zor cümleler | eklenecek |
| `data/olcum.json` | Ölçüm paragrafları (Ateşman 62-70) | 8 paragraf, 4 ölçümlük |

Bir aşamanın cümleleri bitince uygulama okunmuş cümleleri tekrar kullanır ve bunu ekranda belirtir. Bir aşama boşsa önceki aşamanın cümleleriyle devam eder.

### İçerik biçimi

```json
{ "id": "a1-001", "t": "Cümle metni.", "s": "Soru?", "c": ["Doğru cevap", "Yanlış 1", "Yanlış 2", "Yanlış 3"] }
```

Doğru cevap her zaman `c` dizisinin ilk elemanıdır; uygulama seçenekleri karıştırır. Kurallar:

- Cümle 45-70 harf (Breznitz ve ark. 2013 ile aynı aralık), rakam yok (hece sayımı için sayılar yazıyla).
- Soru metni okumadan cevaplanamamalı; yanlış seçenekler de akla yatkın olmalı.
- Havuzun Ateşman puanı hedef bantta olmalı.

`npm run denetle` bu kuralları kontrol eder.

## Geliştirme

Derleme adımı yok; düz HTML, CSS ve JavaScript modülleri.

```sh
npm run sun       # http://localhost:8080
npm test          # motor testleri (Node 20+)
npm run denetle   # içerik denetimi
```

Yeni sürüm yayımlarken `sw.js` içindeki `SURUM` değerini artır; yoksa telefonlar eski önbelleği kullanmaya devam eder.

```
index.html, css/style.css
js/app.js        arayüz ve akış
js/program.js    aşama/oturum mantığı
js/merdiven.js   uyarlamalı hız (3 doğru → hızlan, 1 yanlış → yavaşla)
js/metin.js      hece, harf, Ateşman
js/depo.js       yerel kayıt, yedek
data/            içerik
tools/denetle.mjs, tests/
```

## Lisans

Kod ve metinler MIT lisansıyla. Ölçüm ve antrenman metinleri bu proje için yazılmış özgün metinlerdir.
