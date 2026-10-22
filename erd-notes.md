# KOBİ işe alım karar destek sistemi — ER diyagramı

## İlişkiler ve varsayımlar

- `users` giriş hesabıdır. Kendi başına aday başvurusu yapan kişinin `candidate_profiles.user_id` alanı hesabına bağlıdır. Bu bağlantı isteğe bağlı ve tekildir; işverenin sisteme eklediği aday henüz hesap açmamış olabilir.
- Her aday profili, hesabı olsun veya olmasın, iş başvurusunun ve özgeçmişin bağlandığı kayıttır. Bu, hem adayın kendi başvurusunu hem işverenin aday adına başvuru kaydı açmasını mümkün kılar.
- İşveren tarafında `employer_memberships` bir kullanıcının şirketteki üyeliğini/rolünü ifade eder. Üyelikler şirket ve kullanıcı çifti için tekil olmalıdır.
- `applications.created_by_membership_id` boşsa adayın kendi başvurusu; doluysa işveren üyesinin eklediği aday başvurusu olarak yorumlanır. Ürün doğrulaması `source` ve bu alanın tutarlılığını zorunlu kılmalıdır.
- Bir iş ilanı ve beceri arasındaki çoktan çoğa ilişki `job_skills`; aday ve beceri arasındaki ilişki `candidate_skills` ile kurulur. Her iki ara tablonun bileşik birincil anahtarı `(job_id, skill_id)` / `(candidate_id, skill_id)` olur.
- Aynı aday aynı ilana bir kez başvurabilsin diye `applications(job_id, candidate_id)` UNIQUE olmalıdır. `users.email` ve `skills.name` benzersizdir. `candidate_profiles.user_id` ve `match_results.application_id` da tekil olmalıdır.
- Bu başlangıç sürümünde her başvuru için tek güncel eşleşme sonucu saklanır. Geçmiş skorları tutmak istenirse `match_results` üzerindeki tekillik kaldırılıp `algorithm_version` ve `calculated_at` ile sürümleme eklenebilir.

## Uygulama düzeyinde doğrulamalar

- `users.email` küçük harfe çevrilip normalize edildikten sonra UNIQUE indeksle korunmalı.
- `employer_memberships(company_id, user_id)` UNIQUE olmalı.
- `applications.source` yalnızca `self` veya `employer_added` değerlerini almalı; `self` için `created_by_membership_id` boş, `employer_added` için dolu olmalı.
- Silme davranışlarında başvurular, özgeçmişler ve eşleşme sonuçları için bilinçli politika seçin; prototipte ilişkili kayıtları kazara silmemek üzere kısıtlamak güvenli bir varsayımdır.