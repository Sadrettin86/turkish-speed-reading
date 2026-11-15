# Bilimsel dayanak ve Türkçeye uyarlama

Uygulamanın seviye sistemini belirlemek için yapılan literatür taramasının özeti (Kasım 2026). Her tasarım kararının hangi çalışmaya dayandığı aşağıda.

## 1. Genel tablo

- **Rayner ve ark. (2016)**: Hız ile anlama arasında kaçınılmaz bir denge var. Göz hareketleri okuma süresinin en fazla %10'unu oluşturuyor; asıl darboğaz kelime tanıma ve dil işleme. Okuma hızını anlama kaybı olmadan iki-üç katına çıkarmak olası görünmüyor. Kalıcı yol çok okumak ve dil becerisini geliştirmek. Göz gezdirme yalnızca ana fikir için meşru.
- **Brysbaert (2019)** meta-analizi: İngilizce sessiz okumada yetişkin ortalaması 238 kelime/dk (kurgu dışı), 260 kelime/dk (kurgu). Diller arası kelime/dk farkı büyük ölçüde kelime uzunluğundan geliyor; her dil kendi düzeltmesine ihtiyaç duyuyor.

## 2. Uygulamada olmayanlar ve nedeni

| Yöntem | Neden yok |
|---|---|
| RSVP (tek kelime akışı) | Benedetto ve ark. (2015): Spritz birebir anlamayı düşürdü, göz yorgunluğunu artırdı. Schotter ve ark. (2014): geri dönüşleri engellemek anlamayı bozuyor. Ricciardi ve Di Nocera (2017): 250 kelime/dk üstünde anlama kaybı. Türkçede kelime uzunluğu çok değiştiği için kelime başına sabit süre ayrıca sorunlu. |
| Schulte tablosu, görüş alanı piramidi, göz egzersizleri | Normal (merkezi) okumada hız artışı gösteren kontrollü çalışma bulunamadı. Çevresel görüş eğitimi çalışmaları (Chung ve ark. 2004; Lee ve ark. 2010) çevresel görüşle okumayı inceliyor. |
| Satır satır silikleştiren rehber | Bu haliyle test edilmemiş; yerine test edilmiş sürümü (RAP) kullanılıyor. |

## 3. Kullanılan yöntemler

### 3.1 Okuma Hızlandırma Programı (RAP): ana antrenman

Breznitz ve ark. (2013, *Nature Communications*):

- 24 oturum, haftada 3, oturum başına 15-20 dk.
- Her oturumda 50 cümle; her cümle bir kez gösterilir.
- Cümle okuma yönünde harf harf silinir. Okur bitirince tuşa basar, ardından 1 çoktan seçmeli soru gelir.
- Başlangıç harf başına süresi 12 cümlelik, kendi hızında yapılan ön testten kişiye özel belirlenir.
- Süre, art arda doğru cevaplara dayalı merdiven yöntemiyle harf başına 2 ms değişir.
- Aynı cümleleri süre kısıtı olmadan okuyan kontrol grubu gelişmedi: etkili bileşen süre kısıtı.
- Tipik okurlarda antrenman içi anlama %89 → %97. Standart testlerde kazanımlar 6 ayda büyük ölçüde korunmuş. Disleksik okurların kazanımı daha büyük.
- Sınırlılık: yalnızca İbranice, 22-29 yaş üniversite öğrencileri. Sonraki çalışmalar İngilizce, Almanca, Hollandaca, İtalyanca, İspanyolca ve Çince okurlarda da etki bildirdi. Türkçe okuyan yetişkinlerle yapılmış bir RAP çalışması bulunamadı.

**Uygulamadaki karşılığı:** `js/merdiven.js`, `js/program.js`, `data/on-test.json`. Zamanlama karakter başına; boşluklar dahil her karakter sırayla silinir.

### 3.2 Merdiven kuralı (Levitt, 1971)

Breznitz'in ayrıntısını vermediği kural için psikofizikte standart dönüştürülmüş yukarı-aşağı yöntem: 3 doğru üst üste → karakter başına 2 ms kısalt; 1 yanlış → 2 ms uzat. Bu kural %79,4 doğru oranına yakınsar. `tests/motor.test.mjs` içindeki benzetim bunu doğrular.

### 3.3 Etkili Okuma Endeksi (EOE)

Jackson ve McClelland (1979) okuma becerisini hız ile anlamanın birleşimi olarak tanımladı (effective reading rate = hız × anlama oranı). Türkçe literatürde aynı ölçü "etkili okuma endeksi" adıyla kullanılıyor. Uygulama gelişimi EOE ile izler.

### 3.4 Ölçüm testi

- Kendi hızında, sessiz, süre sınırsız okuma; geri dönüş serbest. RAP çalışmaları da kazanımı standart okuma testlerinde ölçtü.
- IReST biçimine benzer, zorluğu birbirine yakın kısa paragraflar (`data/olcum.json`, Ateşman 62-70 arası).
- Sorular metin okunmadan cevaplanamayacak biçimde yazılır. Keenan ve Betjemann (2006): GORT-3'teki 65 sorunun 56'sı metin okunmadan şans üstü doğrulukla cevaplanabiliyordu.

### 3.5 Göz gezdirme (planlanıyor)

Duggan ve Payne (2009): zaman baskısında göz gezdirme önemli bilgiyi yakalamada işe yarıyor, ayrıntı ve çıkarımda yaramıyor. Ana seviyeyi etkilemeyen ayrı bir modül olarak eklenecek.

## 4. Türkçeye uyarlama

1. **Birincil birim hece/dk.** IReST'te (sesli okuma) Türkçe: 166 kelime/dk, 444 hece/dk, 1054 karakter/dk. 17 dilin ortalaması: 184 kelime/dk, 370 hece/dk, 863 karakter/dk. Kelime/dk Türkçeyi uzun kelimeler yüzünden olduğundan yavaş gösteriyor.
2. **Hece sayımı kesin:** Türkçede her hece tek ünlü taşır; hece sayısı = ünlü sayısı (`js/metin.js`).
3. **Zamanlama karakter başına.** Uzun, çok ekli kelimeye kendiliğinden daha fazla süre verir. Özkan ve ark. (2021): Türkçede çekim eki sayısı arttıkça kelimeye yapılan sabitleme sayısı artıyor.
4. **Metin zorluğu: Ateşman (1997).** Okunabilirlik = 198,825 − 40,175 × (kelime başına hece) − 2,610 × (cümle başına kelime). Bantlar: 90-100 çok kolay, 70-89 kolay, 50-69 orta, 30-49 zor, 1-29 çok zor. Türkçe formüllerin uzman yargısıyla tutarlılığı zayıf bulunduğu için nihai karar anlama verisinden.
5. **Soru tasarımı:** Olumsuzluk, zaman, kip, ettirgenlik gibi bilgiler Türkçede eklerde taşındığı için soruların bir kısmı eke dayalı bilgiyi yoklar ("yıkattı" → arabayı kim yıkadı?). Bu, doğrudan test edilmiş bir yöntem değil; araştırmadan çıkarılan tasarım tercihi.
6. **Türkçe normlar eski ve dağınık:** Akçamete (1989) üniversite öğrencileri sessiz 143,2 kelime/dk; Coşkun (2002) lise 147,7 kelime/dk. Hedefler kişinin kendi başlangıç ölçümünden türetilir.

## 5. Seviye sistemi

- **Başlangıç:** 12 cümlelik ön test (karakter başına süre) + 2 ölçüm paragrafı (hece/dk, anlama, EOE).
- **3 aşama × 8 oturum = 24 oturum**, haftada 3 oturum önerilir.
- **Oturum içi seviye:** merdivenin ulaştığı silme hızı, hece/dk olarak gösterilir; bir sonraki oturum buradan devam eder.
- **Aşama sonu ölçümü:** anlama ≥ %80 ve EOE başlangıcın altında değilse metin zorluğu bir bant artar (kolay → orta → zor). Değilse aşama aynı zorlukta tekrarlanır. Zorluk basamakları RAP protokolünde yok; okunabilirlik araştırmasına dayanan ek tasarım.
- **24 oturum sonrası:** bakım oturumları; her 8 oturumda bir ölçüm.
- **Beklenti:** iki-üç kat hız vaat edilmez; arayüzde anlama ve EOE hız kadar öne çıkar.

## Kaynaklar

- Rayner, K., Schotter, E. R., Masson, M. E. J., Potter, M. C., & Treiman, R. (2016). So much to read, so little time: How do we read, and can speed reading help? *Psychological Science in the Public Interest*, 17(1), 4-34. https://doi.org/10.1177/1529100615623267
- Brysbaert, M. (2019). How many words do we read per minute? A review and meta-analysis of reading rate. *Journal of Memory and Language*, 109, 104047. https://doi.org/10.1016/j.jml.2019.104047
- Trauzettel-Klosinski, S., & Dietz, K. (2012). Standardized assessment of reading performance: The new International Reading Speed Texts IReST. *IOVS*, 53(9), 5452-5461. https://doi.org/10.1167/iovs.11-8284
- Breznitz, Z., Shaul, S., Horowitz-Kraus, T., Sela, I., Nevat, M., & Karni, A. (2013). Enhanced reading by training with imposed time constraint in typical and dyslexic adults. *Nature Communications*, 4, 1486. https://doi.org/10.1038/ncomms2488
- Horowitz-Kraus, T., Cicchino, N., Amiel, M., Holland, S. K., & Breznitz, Z. (2014). Reading improvement in English- and Hebrew-speaking children with reading difficulties after reading acceleration training. *Annals of Dyslexia*, 64, 183-201. https://doi.org/10.1007/s11881-014-0093-4
- Enhancing reading speed: the reading acceleration effect in Italian adult readers (2024). *Frontiers in Psychology*. https://doi.org/10.3389/fpsyg.2024.1394579
- Schotter, E. R., Tran, R., & Rayner, K. (2014). Don't believe what you read (only once). *Psychological Science*, 25(6), 1218-1226. https://doi.org/10.1177/0956797614531148
- Benedetto, S., Carbone, A., Pedrotti, M., Le Fevre, K., Yahia Bey, L. A., & Baccino, T. (2015). Rapid serial visual presentation in reading: The case of Spritz. *Computers in Human Behavior*, 45, 352-358.
- Ricciardi, O., & Di Nocera, F. (2017). Not so fast: A reply to Benedetto et al. (2015). *Computers in Human Behavior*, 69, 381-385. https://doi.org/10.1016/j.chb.2016.12.047
- Lee, H.-W., Kwon, M., Legge, G. E., & Gefroh, J. J. (2010). Training improves reading speed in peripheral vision: Is it due to attention? *Journal of Vision*, 10(6), 18. https://doi.org/10.1167/10.6.18
- Jackson, M. D., & McClelland, J. L. (1979). Processing determinants of reading speed. *Journal of Experimental Psychology: General*, 108(2), 151-181. https://doi.org/10.1037/0096-3445.108.2.151
- Levitt, H. (1971). Transformed up-down methods in psychoacoustics. *JASA*, 49, 467-477. https://doi.org/10.1121/1.1912375
- Keenan, J. M., & Betjemann, R. S. (2006). Comprehending the Gray Oral Reading Test without reading it. *Scientific Studies of Reading*, 10, 363-380. https://doi.org/10.1207/s1532799xssr1004_2
- Duggan, G. B., & Payne, S. J. (2009). Text skimming: The process and effectiveness of foraging through text under time pressure. *Journal of Experimental Psychology: Applied*, 15(3), 228-242. https://doi.org/10.1037/a0016995
- Ateşman, E. (1997). Türkçede okunabilirliğin ölçülmesi. *Dil Dergisi*, 58, 71-74.
- Bezirci, B., & Yılmaz, A. E. (2010). Metinlerin okunabilirliğinin ölçülmesi üzerine bir yazılım kütüphanesi ve Türkçe için yeni bir okunabilirlik ölçütü. *DEÜ Mühendislik Fakültesi Fen Bilimleri Dergisi*, 12(3), 49-62.
- Özkan, A., Beken Fikri, F., Kırkıcı, B., Kliegl, R., & Acartürk, C. (2021). Eye movement control in Turkish sentence reading. *QJEP*, 74(2), 377-397. https://doi.org/10.1177/1747021820963310
- Acartürk, C., Özkan, A., Pekçetin, T. N., Ormanoğlu, Z., & Kırkıcı, B. (2024). TURead: An eye movement dataset of Turkish reading. *Behavior Research Methods*, 56(3), 1793-1816. https://doi.org/10.3758/s13428-023-02120-6
- Karaca, M. F. (2023). İlkokul Türkçe dersi okuma metinlerindeki kelime, harf ve hece sıklıklarına karşılaştırmalı bir bakış. *Ana Dili Eğitimi Dergisi*, 11(2), 454-472.
- Coşkun, E. (2002); Akçamete, G. (1989): Türkçe sessiz okuma hızı ölçümleri (ikincil kaynaklardan aktarılmıştır).
