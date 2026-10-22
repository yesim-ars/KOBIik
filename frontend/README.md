# işeal frontend

Next.js arayüzü, FastAPI servisini yerel bir `/api` proxy rotası üzerinden kullanır. Varsayılan backend adresi `http://127.0.0.1:8000` olarak ayarlanmıştır. Farklı bir adres gerekirse `frontend/.env.local` dosyasına `NEXT_BACKEND_URL=http://127.0.0.1:8000` satırı ekleyin.

## Yerelde çalıştırma

1. Bir terminalde backend'i başlatın:

   ```powershell
   cd C:\Users\HP\OneDrive\Masaüstü\kobi-karar-destek\backend
   .\.venv\Scripts\Activate.ps1
   uvicorn main:app --reload
   ```

2. İkinci terminalde frontend'i başlatın:

   ```powershell
   cd C:\Users\HP\OneDrive\Masaüstü\kobi-karar-destek\frontend
   npm run dev
   ```

3. Tarayıcıda `http://localhost:3000` adresini açın.

## İlk kontrol

- Ana sayfada `İş arıyorum` veya `İşe alım yapıyorum` bağlantısıyla rol seçili kayıt sayfasını açın.
- Aday kaydında ad, soyad; işveren kaydında işletme adı ve isteğe bağlı sektör girin. Backend'in parola şartı gereği en az 10 karakter kullanın.
- Kayıt başarılı olunca giriş sayfasına geçin ve aynı bilgilerle giriş yapın.
- Backend'de yayımlanmış ilan varsa ana sayfanın ilan kartları `GET /jobs` yanıtından yüklenir. Backend kapalıysa örnek kartlar görünür.
- `İş ilanları` veya bir ilan kartına tıklayarak ilan listesini ve açıklama sayfasını açın. Aday hesabıyla giriş yapıldığında `Başvuru yap` düğmesi `/jobs/{id}/apply` üzerinden başvuruyu gönderir.
- Giriş başarılı olduğunda otomatik olarak ana sayfaya dönersiniz. Başvurmak için ilan detayına tekrar gidin.
- Oturum açıkken giriş/kayıt bağlantıları hesap türü ve çıkış seçeneğiyle değişir. Daha önce başvurulan ilanda tekrar başvuru düğmesi yerine başvuru durumu görünür.
- Backend uç noktalarını `http://127.0.0.1:8000/docs` üzerinden de inceleyebilirsiniz.

Giriş/kayıt token'ı tarayıcıdaki `localStorage` içinde `iseal_access_token` anahtarıyla tutulur. `src/lib/auth.ts` içindeki `apiRequest` sonraki korumalı isteklerde bu token'ı otomatik ekler.

## Aday ve işveren paneli

- Giriş yaptıktan sonra otomatik olarak `/panel` sayfasına geçilir. Ana sayfadaki üst menüden `Panelim` bağlantısıyla da açabilirsiniz.
- Aday panelinde yalnızca oturum açmış adayın kendi başvuruları gösterilir. Diğer adayların profilleri bu panelde yer almaz.
- İşveren panelindeki `Adaylar` sekmesi, yalnızca işverenin yetkili olduğu ilanlara gelen başvuruları yükler.
- Frontend'i denemek için önce backend'i, ardından frontend'i yukarıdaki adımlarla çalıştırın. İki ayrı hesap oluşturun: bir aday ve bir işveren. Aday hesabıyla bir ilana başvurun; ardından işveren hesabının `Adaylar` sekmesinde başvuruyu kontrol edin.
- Şu anki backend CV–ilan eşleşme puanı/detaylarını ve çalışma koşulları tercihlerini API'den sunmuyor. Arayüz puan uydurmaz; bu alanlar gerçek API verisi sağlandığında gösterilecek. Profil kaydetme uç noktası da mevcut olmadığından `Profilim` ekranı bu sınırlamayı bildirir.
