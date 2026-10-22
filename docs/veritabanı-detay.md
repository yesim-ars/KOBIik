Veritabanı için PostgreSQL öneriyorum. Başlangıçta 10 civarında ana tabloyla ilerleyebiliriz. Tabloları doğru ayırmak, daha sonra yeni özellikler eklemeyi kolaylaştırır.



4.1. Tabloların görevleri

1. users — Kullanıcılar
Giriş bilgileri, e-posta, parola özeti ve hesap durumu. Kullanıcının aday mı, işveren mi olduğu bu tabloda tutulabilir.

2. candidate_profiles — Aday profilleri
Ad, soyad, iletişim bilgileri, eğitim, deneyim ve diğer mesleki profil alanları. Her profil bir kullanıcı hesabıyla ilişkilendirilir.

3. companies — İşletmeler
İşletme adı, sektör ve temel iletişim bilgileri.

4. employer_memberships — İşveren üyelikleri
Hangi kullanıcının hangi işletmeye bağlı olduğunu ve o işletmedeki yetkisini belirler. Bu yapı, birden fazla işveren kullanıcısının aynı işletmede çalışabilmesini sağlar.

5. job_postings — İş ilanları
İlan başlığı, açıklama, işletme, deneyim ve eğitim koşulları, konum ve yayın durumu.

6. skills — Beceri kataloğu
Python, SQL, iletişim, proje yönetimi gibi standartlaştırılmış beceriler.

7. job_skills — İlanın beceri gereksinimleri
Hangi ilanda hangi becerilerin arandığını ve bunların önem düzeyini tutar.

8. resumes — Özgeçmişler
Adayın yüklediği dosyanın konumu, dosya türü, yüklenme tarihi ve işleme durumu. Dosyanın kendisi tercihen kontrollü dosya depolamasında tutulur.

9. applications — Başvurular ve aday-pozisyon ilişkisi
Adayın hangi ilana, hangi yolla eklendiğini; hangi özgeçmişle ilişkilendirildiğini ve başvuru durumunu tutar. İşverenin eklediği adaylar için de bu tablo kullanılır.

10. candidate_skills ve match_results — Analiz sonuçları
Adayın becerilerini ve her başvuru için hesaplanan eşleşme sonuçlarını saklar. Sonuçla birlikte kullanılan kriterler ve model/sürüm bilgisi de tutulabilir.

Burada candidate_skills ve match_results iki ayrı tablo olacak. Dolayısıyla önerdiğim ilk sürümde 11 tablo bulunuyor. İhtiyaçlar netleşince mülakatlar, bildirimler ve denetim kayıtları için ek tablolar oluşturabiliriz.





4.2. Tabloların alanları
Aşağıdaki alanlar başlangıç tasarımıdır; henüz oluşturulmuş bir veritabanı değildir.

Tablo	Temel alanlar

users:	id, email, password_hash, role, is_active, created_at

candidate_profiles:	id, user_id, first_name, last_name, phone, location, summary

companies:	id, name, sector, description, created_at

employer_memberships:	id, company_id, user_id, membership_role

job_postings:	id, company_id, title, description, experience_level, education_requirement, location, status, published_at, closes_at

skills:	id, name, normalized_name
job_skills	job_id, skill_id, importance, required_level

resumes:	id, candidate_id, storage_key, original_filename, mime_type, processing_status, uploaded_at

applications:	id, job_id, candidate_id, resume_id, source, status, created_at, updated_at

candidate_skills:	id, candidate_id, skill_id, proficiency_level, evidence, source_resume_id

match_results:	id, application_id, score, criteria_details, model_version, created_at


candidate_profiles tablosundaki user_id bir kullanıcı hesabına bağlanır. 
applications tablosunda ise job_id ilanı, candidate_id adayı ve resume_id değerlendirmede kullanılan özgeçmişi belirtir.






4.3. İki aday ekleme yöntemini nasıl birleştireceğiz?

Durum	Sistemde yapılacak işlem

Aday kendi hesabıyla başvurur  /	Aday profili bulunur veya oluşturulur; ardından başvuru kaydı oluşturulur.

İşveren dışarıdan aday ekler  /	İşverenin işletmesine ait bir başvuru kaydı oluşturulur; adayın kaynağı employer_added olarak tutulur.

İşveren daha önce kayıtlı adayı ekler  /	Yeni aday profili oluşturmak yerine mevcut profil seçilir ve ilgili ilan için başvuru kaydı oluşturulur.

Aday aynı ilana tekrar başvurur	/ Yinelenen başvuru kontrolü yapılır.

Aday başka bir ilana başvurur /	Aynı aday profili kullanılarak yeni başvuru kaydı oluşturulur.

applications.source alanı için başlangıçta candidate_applied ve employer_added değerlerini kullanabiliriz.

Önemli ayrım: Adayın sisteme eklenmiş olması, iş ilanına başvurduğu veya başvurusunun değerlendirilmesini kabul ettiği anlamına otomatik olarak gelmemeli. İşverenin dışarıdan aday ekleme sürecinde kişisel verilerin hangi hukuki şartlarla işleneceği ve adaya nasıl bilgilendirme yapılacağı ayrıca belirlenmeli.





4.4. Veritabanı ilişkileri


users
Kullanıcı hesapları


candidate_profiles    /     employer_memberships
Aday bilgileri       /      İşveren yetkileri


resumes           /       companies
Özgeçmişler      /        İşletmeler


applications            /     job_postings
Aday–ilan ilişkisi     /      İş ilanları


match_results
İlan bazlı eşleştirme sonuçları




(Şema ilişkilerin kavramsal görünümüdür; bütün yabancı anahtarları ve beceri ilişkilerini göstermez.)


Gerçek veritabanında ilişkileri yabancı anahtarlarla (FOREIGN KEY) tanımlayacağız. Ayrıca aşağıdaki kuralları uygulayacağız:
- users.email benzersiz olmalı.
- employer_memberships üzerinde aynı kullanıcı ve işletme için yinelenen üyelik olmamalı.
- job_skills üzerinde aynı ilan ve beceri kombinasyonu tekrarlanmamalı.
- applications üzerinde job_id ve candidate_id kombinasyonu benzersiz olmalı.
- Her match_results kaydı belirli bir başvuruya ait olmalı.
Böylece verilerin tutarlılığı yalnızca uygulama koduna bırakılmayacak.