
1. Projenin amacı
Küçük ve orta ölçekli işletmelerin işe alım süreçlerini dijitalleştirmek; iş ilanlarının yönetilmesini, aday başvurularının toplanmasını, özgeçmişlerin incelenmesini ve adayların pozisyon gereksinimleriyle karşılaştırılmasını sağlamak.
Sistem, işverenin karar verme sürecini destekler. Otomatik olarak işe alım veya eleme kararı vermez.


2. Kullanıcı türleri

Kullanıcı	Yetkileri
Ziyaretçi	Yayındaki iş ilanlarını görüntüleyebilir.

Aday	Hesap oluşturabilir, profilini düzenleyebilir, özgeçmiş yükleyebilir, ilanlara başvurabilir ve başvurularını takip edebilir.

İşveren	İşletme bilgilerini yönetebilir, ilan oluşturabilir, aday ekleyebilir, başvuruları inceleyebilir ve değerlendirme sonuçlarını görüntüleyebilir.

Sistem yöneticisi	İlk prototipte zorunlu değil; ileride kullanıcı ve sistem yönetimi için eklenebilir.
Bir işveren hesabının yalnızca kendi işletmesinin ilanlarına ve aday kayıtlarına erişebilmesi gerekir. Bir aday da başka adayların özel bilgilerini görememelidir.






3. İşlevsel gereksinimler

Öncelik açıklaması: P1 = ilk prototipte zorunlu, P2 = temel akış çalıştıktan sonra.

Kod	Gereksinim	Öncelik

FR-01	Aday ve işveren kayıt/giriş işlemleri yapabilmeli.	P1

FR-02	Aday profil bilgilerini oluşturup düzenleyebilmeli.	P1

FR-03	Aday PDF özgeçmişi yükleyebilmeli.	P1

FR-04	Aday yayındaki ilanları görüntüleyebilmeli ve başvurabilmeli.	P1

FR-05	Sistem aynı adayın aynı ilana tekrarlı başvurusunu engellemeli.	P1

FR-06	İşveren ilan oluşturabilmeli, düzenleyebilmeli ve kapatabilmeli.	P1

FR-07	İşveren, başvurulardan bağımsız olarak aday ekleyebilmeli.	P1

FR-08	İşveren, bir adayı belirli bir ilanla ilişkilendirebilmeli.	P1

FR-09	İşveren adayın özgeçmişini ve başvuru bilgilerini inceleyebilmeli.	P1

FR-10	Sistem adayın becerileri ile ilan gereksinimlerini karşılaştırabilmeli.	P1

FR-11	Sistem eşleşme sonucunun hangi gereksinimlerden kaynaklandığını gösterebilmeli.	P1

FR-12	İşveren adayın başvuru durumunu değiştirebilmeli.	P1

FR-13	Aday kendi başvuru durumunu görebilmeli.	P1

FR-14	İşveren aynı ilana başvuran adayları karşılaştırabilmeli.	P2

FR-15	Sistem temel raporlar ve ilan bazlı istatistikler sunabilmeli.	P2

FR-16	Sistem kullanıcı işlemlerinin önemli kayıtlarını tutabilmeli.	P2






4. İş ilanında tutulacak bilgiler

Her iş ilanında en az şu alanlar bulunmalı:
- İlan başlığı ve iş tanımı
- İşletme
- Pozisyonun gerektirdiği beceriler
- Deneyim gereksinimi
- Eğitim gereksinimi (varsa)
- Çalışma biçimi ve konum
- İlanın yayınlanma ve kapanma tarihleri
- İlan durumu: taslak, yayında veya kapalı

Beceriler mümkün olduğunca ayrı alanlar halinde tutulmalı. Örneğin “Python, SQL ve veri analizi” bilgisini yalnızca uzun bir metin olarak saklamak yerine beceri kayıtlarıyla ilişkilendireceğiz. Böylece karşılaştırma daha kolay ve tutarlı olacaktır.







5. Aday başvuru ve değerlendirme kuralları

Aday başvurduğunda sistem:
1. Başvuru kaydını oluşturur.
2. Adayın seçtiği özgeçmişi başvuruyla ilişkilendirir.
3. İlgili ilan ve aday bilgilerini işveren panelinde gösterir.
4. Özgeçmiş analizi yapılabiliyorsa analiz sonucunu kaydeder.
5. Eşleştirme sonucunu ve eksik görünen gereksinimleri işverene sunar.
6. İşverenin değerlendirmesini ve başvuru durumunu kaydeder.

İşverenin dışarıdan eklediği aday için de aynı değerlendirme akışı kullanılacak. Ancak adayın başvuru yapmış olduğu varsayılmayacak; kayıt kaynağı ayrıca tutulacak.





6. İşlevsel olmayan gereksinimler

Alan	Gereksinim

Güvenlik	Parolalar güvenli biçimde saklanmalı; erişim sunucu tarafında doğrulanmalı.

Gizlilik	Adayların kişisel bilgileri ve özgeçmişleri yalnızca yetkili kişilerce görüntülenmeli.

Kullanılabilirlik	Ekranlar basit, anlaşılır ve mobil tarayıcılarda kullanılabilir olmalı.

Güvenilirlik	Hatalı dosya yüklemeleri ve başarısız analizler yönetilebilmeli.

Açıklanabilirlik	Eşleşme puanı gösteriliyorsa hangi kriterlere dayandığı da açıklanmalı.

Adillik	Yaş, cinsiyet, fotoğraf veya benzeri işle ilgisiz özellikler otomatik puanlama ölçütü yapılmamalı.

Veri yönetimi	Kullanıcıların verilerinin saklanması, silinmesi ve erişim yetkileri belirlenmeli.

Özellikle özgeçmişler kişisel veri içerdiği için KVKK yükümlülüklerini, aydınlatma metnini, uygun işleme şartlarını ve saklama sürelerini tasarım aşamasında değerlendirmek gerekiyor. Teknik erişim kontrolü tek başına hukuki uyumluluk anlamına gelmez.