"use client";

import Link from "next/link";
import type { Role } from "@/lib/auth";

const candidateSections = [
  ["kisisel", "Kişisel Bilgiler", "Ad, soyad ve iletişim bilgileriniz", "♙"],
  ["egitim", "Eğitim Bilgileri", "Eğitim geçmişiniz ve mezuniyet bilgileriniz", "▤"],
  ["deneyim", "İş Deneyimi", "Önceki görevleriniz ve deneyiminiz", "↗"],
  ["beceriler", "Beceriler ve Yetenekler", "Mesleki ve teknik yetkinlikleriniz", "✳"],
  ["sertifikalar", "Sertifikalar", "Sertifika ve mesleki belgeleriniz", "▧"],
  ["cv", "CV Yönetimi", "Özgeçmişinizi görüntüleme ve güncelleme", "▣"],
  ["tercihler", "Çalışma Tercihleri", "Konum, çalışma biçimi ve tercih ettiğiniz koşullar", "⌖"],
  ["eslesmelerim", "Eşleşmelerim", "CV'nize göre oluşan mesleki eşleşmeler", "✳"],
] as const;
const employerSections = [
  ["yetkili", "Yetkili Kişi Bilgileri", "İşe alım sürecindeki yetkili bilgileri", "♙"],
  ["sirket", "Şirket Bilgileri", "Şirket tanıtımı ve temel bilgiler", "▤"],
  ["ise-alim", "İşe Alım Bilgileri", "İşe alım tercihleri ve süreç bilgileri", "↗"],
  ["hesap", "Hesap Ayarları", "Oturum ve hesap tercihleri", "⚙"],
] as const;
const fields: Record<string, string[]> = {
  kisisel: ["Ad", "Soyad", "Telefon", "Şehir"], egitim: ["Okul", "Bölüm", "Derece", "Mezuniyet yılı"],
  deneyim: ["Şirket", "Pozisyon", "Başlangıç tarihi", "Açıklama"], beceriler: ["Beceri", "Seviye"],
  sertifikalar: ["Sertifika adı", "Kurum", "Alınma tarihi"], cv: ["CV dosyası"],
  tercihler: ["Tercih edilen şehir", "Çalışma şekli", "Çalışma türü"], eslesmelerim: [],
  yetkili: ["Ad", "Soyad", "Görev", "Telefon"], sirket: ["Şirket adı", "Sektör", "Web sitesi", "Şirket açıklaması"],
  "ise-alim": ["Öncelikli pozisyonlar", "Aranan yetkinlikler", "İşe alım notları"], hesap: ["E-posta", "Bildirim tercihi"],
};

type CandidateProfile = { first_name?: string | null; last_name?: string | null; phone?: string | null; location?: string | null; summary?: string | null };
export default function ProfileCenter({ role, section, candidateProfile }: { role: Role; section?: string; candidateProfile?: CandidateProfile }) {
  const sections = role === "employer" ? employerSections : candidateSections;
  const selected = sections.find(([key]) => key === section);
  if (selected) {
    const [key, label, description] = selected;
    return <>
      <Link className="profile-back-link" href="/panel?sekme=profil">← Profil merkezine dön</Link>
      <section className="dashboard-panel profile-section-screen">
        <div className="panel-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> PROFİL MERKEZİ</div><h2>{label}</h2><p>{description}</p></div><span className="pending-tag">Hazırlanıyor</span></div>
        {key === "eslesmelerim" ? <div className="notice-box">Eşleşme puanları ve kriter dökümü backend tarafından henüz sunulmuyor. Çalışma koşulu tercihleri bu mesleki puana dahil edilmez.</div> : <>
          <div className="profile-placeholder-grid">{(fields[key] || []).map((field) => {
            const profileValues: Record<string, string | null | undefined> = { Ad: candidateProfile?.first_name, Soyad: candidateProfile?.last_name, Telefon: candidateProfile?.phone, Şehir: candidateProfile?.location };
            const value = role === "candidate" && key === "kisisel" ? profileValues[field] : undefined;
            return <label className="form-field" key={field}>{field}<input disabled value={value || ""} placeholder={value ? undefined : "Bu alan için henüz kayıtlı veri yok"} /></label>;
          })}</div>
          {key === "tercihler" && <div className="notice-box">Çalışma koşulları tercihleri eşleşme sonucundan ayrı tutulur ve mesleki eşleşme puanını etkilemez.</div>}
          <p className="profile-api-note">{role === "candidate" && key === "kisisel" ? "Bu ekranda mevcut aday profil API’sinden alınan temel bilgiler salt okunur gösterilir. Güncelleme API’si henüz bulunmuyor." : "Bu bölüm için profil kayıt ve güncelleme API’si henüz bulunmuyor; burada gerçek profil verisi gösterilmiyor."}</p>
        </>}
      </section>
    </>;
  }
  return <section className="dashboard-panel profile-center-screen">
    <div className="panel-heading"><div><h2>{role === "employer" ? "İşveren Profil Merkezi" : "Aday Profil Merkezi"}</h2><p>Her başlık, kendi ayrı profil ekranını açar.</p></div></div>
    <div className="profile-section-grid">{sections.map(([key, label, description, icon]) => <Link className="profile-section-card" href={`/panel?sekme=profil&bolum=${key}`} key={key}><span className="stat-icon">{icon}</span><strong>{label}</strong><small>{description}</small><b>Görüntüle ↗</b></Link>)}</div>
  </section>;
}
