"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, Role } from "@/lib/auth";
import ProfileCenter from "@/components/ProfileCenter";

type User = { id: number; email: string; role: Role };
type CandidateProfile = { id: number; first_name?: string | null; last_name?: string | null; phone?: string | null; location?: string | null; summary?: string | null };
type Job = { id: number; title: string; location: string; work_type: string; company_name?: string; status?: string };
type Application = { id: number; application_id?: number; job_id: number; title?: string; company_name?: string; first_name?: string; last_name?: string; location?: string; status: string; created_at?: string; match_score?: number; match_details?: Record<string, number> };
type DashboardData = { count: number; applications: Application[]; jobs: Job[]; candidates: Application[] };

const candidateNav = [
  ["İş İlanları", "/ilanlar", "⌕"],
  ["Başvurularım", "/panel?sekme=basvurular", "▤"],
  ["Bildirimler", "/panel?sekme=bildirimler", "♧"],
  ["CV Yönetimi", "/panel?sekme=profil&bolum=cv", "▣"],
  ["Eşleşmelerim", "/panel?sekme=profil&bolum=eslesmelerim", "✳"],
] as const;
const employerNav = [
  ["İlanlarım", "/panel?sekme=ilanlar", "▤"],
  ["Adaylar", "/panel?sekme=adaylar", "♙"], ["Eşleşme Sonuçları", "/panel?sekme=eslesmeler", "✳"],
] as const;
const statusText: Record<string, string> = { new: "Yeni başvuru", reviewing: "İnceleniyor", interview: "Görüşme", rejected: "Olumsuz", hired: "İşe alındı", published: "Yayında", draft: "Taslak", paused: "Duraklatıldı" };

export default function Dashboard({ initialTab = "Ana Sayfa", profileSection, selectedJobId }: { initialTab?: string; profileSection?: string; selectedJobId?: number }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [data, setData] = useState<DashboardData>({ count: 0, applications: [], jobs: [], candidates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [jobSaving, setJobSaving] = useState(false);
  const [jobError, setJobError] = useState("");

  useEffect(() => {
    void (async () => {
      if (!localStorage.getItem("iseal_access_token")) { router.replace("/giris"); return; }
      try {
        const current = await apiRequest<User>("/auth/me");
        setUser(current);
        if (current.role === "candidate") {
          const [response, profile] = await Promise.all([
            apiRequest<{ count: number; applications: Application[] }>("/candidate/applications"),
            apiRequest<CandidateProfile>("/candidate/profile").catch(() => null),
          ]);
          setCandidateProfile(profile);
          setData({ count: response.count, applications: response.applications, jobs: [], candidates: [] });
        } else {
          const response = await apiRequest<{ count: number; jobs: Job[] }>("/employer/jobs");
          const candidateLists = await Promise.all(response.jobs.map(async (job) => {
            const result = await apiRequest<{ applications: Application[] }>(`/employer/jobs/${job.id}/applications`);
            return result.applications.map((application) => ({ ...application, title: job.title, company_name: job.company_name }));
          }));
          setData({ count: response.count, applications: [], jobs: response.jobs, candidates: candidateLists.flat() });
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Panel verileri yüklenemedi.");
        if ((caught instanceof Error ? caught.message : "").includes("Giriş")) { localStorage.removeItem("iseal_access_token"); router.replace("/giris"); }
      } finally { setLoading(false); }
    })();
  }, [router]);

  const nav = user?.role === "employer" ? employerNav : candidateNav;
  const name = [candidateProfile?.first_name, candidateProfile?.last_name].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "Kullanıcı";
  const applications = data.applications;
  const activeTab = initialTab;
  const title = activeTab === "Ana Sayfa" ? `Merhaba, ${name}` : activeTab;
  const intro = useMemo(() => {
    if (user?.role === "employer") return activeTab === "Ana Sayfa" ? "İşe alım sürecinizin güncel görünümü." : "Yalnızca hesabınıza ait ilan ve başvuru bilgileri.";
    return activeTab === "Ana Sayfa" ? "İş arama ve başvuru sürecinizin güncel görünümü." : "Başvurularınızı ve profesyonel profilinizi buradan yönetin.";
  }, [activeTab, user?.role]);

  async function createJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setJobError(""); setJobSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<{ job: Job }>("/jobs", { method: "POST", body: JSON.stringify({ title: String(form.get("title") || "").trim(), description: String(form.get("description") || "").trim(), location: String(form.get("location") || "").trim(), work_type: String(form.get("work_type") || "").trim(), status: "published" }) });
      setData((current) => ({ ...current, jobs: [result.job, ...current.jobs] })); setCreateJobOpen(false);
    } catch (caught) { setJobError(caught instanceof Error ? caught.message : "İlan oluşturulamadı."); } finally { setJobSaving(false); }
  }

  function logout() { localStorage.removeItem("iseal_access_token"); window.dispatchEvent(new Event("iseal-auth-change")); router.replace("/"); }

  if (activeTab === "Ana Sayfa") return <section className="home-overview wrap">
    <div className="home-overview-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> KİŞİSEL ÖZETİNİZ</div><h2>{loading ? "Hesabınız yükleniyor" : `Hoş geldiniz, ${name}`}</h2><p>{user?.role === "employer" ? "İşe alım sürecinizin kısa özeti." : "İş arama ve başvuru sürecinizin kısa özeti."}</p></div><Link className="button button-outline button-small" href="/panel?sekme=profil">Profil merkezine git <span>↗</span></Link></div>
    {error && <div className="form-error dashboard-alert" role="alert">{error}</div>}
    {user?.role === "employer" ? <>
      <div className="dashboard-stat-grid"><article className="dashboard-stat"><span className="stat-icon">▤</span><small>Aktif ilan</small><strong>{loading ? "—" : data.jobs.filter((job) => !job.status || job.status === "published").length}</strong><span className="stat-note">Hesabınıza bağlı ilanlar</span></article><article className="dashboard-stat"><span className="stat-icon stat-icon-soft">♙</span><small>Toplam başvuru</small><strong>{loading ? "—" : data.candidates.length}</strong><span className="stat-note">Tüm ilanlarınızın toplamı</span></article><article className="dashboard-stat stat-highlight"><span className="stat-icon">✳</span><small>Eşleşme özeti</small><strong>Hazır değil</strong><span className="stat-note">Eşleşme servisi henüz bağlı değil</span></article></div>
      <section className="dashboard-panel application-summary"><div className="panel-heading"><div><h2>İlan başına başvuru</h2><p>Toplam başvuru ve her ilana gelen başvurular.</p></div><Link href="/panel?sekme=ilanlar">Yeni ilan / ilanlarım ↗</Link></div>{loading ? <p className="panel-empty">Başvurular yükleniyor…</p> : data.jobs.length === 0 ? <p className="panel-empty">Henüz ilanınız yok. İlanlarınızı oluşturduğunuzda başvuru özeti burada görünür.</p> : <div className="application-count-list">{data.jobs.map((job) => <div className="application-count-row" key={job.id}><span>{job.title}</span><strong>{data.candidates.filter((application) => application.job_id === job.id).length}</strong></div>)}</div>}</section>
    </> : <>
      <div className="dashboard-stat-grid"><article className="dashboard-stat"><span className="stat-icon">↗</span><small>Toplam başvuru</small><strong>{loading ? "—" : applications.length}</strong><span className="stat-note">Başvuru durumunuzu takip edin</span></article><article className="dashboard-stat"><span className="stat-icon stat-icon-soft">✳</span><small>CV ile eşleşen ilan</small><strong>{loading ? "—" : "Hesaplanmadı"}</strong><span className="stat-note">CV eşleştirme verisi henüz sunulmuyor</span></article><article className="dashboard-stat stat-highlight"><span className="stat-icon">⌕</span><small>Size uygun ilan</small><strong>{loading ? "—" : "Hesaplanmadı"}</strong><span className="stat-note">Mesleki eşleşme servisi henüz bağlı değil</span></article></div>
      <section className="dashboard-panel"><div className="panel-heading"><div><h2>Son başvurularım</h2><p>Başvuru durumunuz ve profilinizin genel durumu.</p></div><Link href="/panel?sekme=basvurular">Tüm başvurular ↗</Link></div><div className="home-profile-status"><span>Profil / CV durumu</span><strong>{candidateProfile ? "Temel profil bilgileri kayıtlı · CV durumu bilinmiyor" : "Profil verisi henüz mevcut değil"}</strong><Link href="/panel?sekme=profil">Profil bilgilerini gör ↗</Link></div>{loading ? <p className="panel-empty">Başvurular yükleniyor…</p> : applications.length === 0 ? <div className="panel-empty empty-with-action"><strong>Henüz başvurunuz yok</strong><p>İş ilanlarını keşfederek ilk başvurunuzu yapabilirsiniz.</p><Link className="button button-outline button-small" href="/ilanlar">İş ilanlarını gör <span>↗</span></Link></div> : <div className="application-list">{applications.slice(0, 3).map((application) => <article className="application-row" key={application.id}><span className="company-symbol">{(application.company_name || "İ").charAt(0).toLocaleUpperCase("tr-TR")}</span><div className="application-info"><strong>{application.title || `İlan #${application.job_id}`}</strong><small>{application.company_name || "İşveren"}</small></div><span className={`status-badge status-${application.status}`}>{statusText[application.status] || application.status}</span><Link className="row-arrow" href={`/ilanlar/${application.job_id}`} aria-label="İlan detayını gör">↗</Link></article>)}</div>}</section>
    </>}
  </section>;

  return <main className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <Link href="/" className="brand"><span className="brand-mark">İ</span><span>işe<span className="brand-accent">al</span></span></Link>
      <div className="sidebar-caption">MENÜ</div>
      <nav className="dashboard-nav" aria-label="Ana menü">{nav.map(([label, href, icon]) => {
        const profileLinkActive = activeTab === "Profilim" && ((label === "CV Yönetimi" && profileSection === "cv") || (label === "Eşleşmelerim" && profileSection === "eslesmelerim"));
        return <Link key={label} href={href} className={`dashboard-nav-link ${activeTab === label || profileLinkActive ? "active" : ""}`}><span className="nav-icon">{icon}</span>{label}{label === "Bildirimler" && <i className="nav-dot"/>}</Link>;
      })}</nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">?</span><strong>Yardıma mı ihtiyacınız var?</strong><p>Sorularınız için bize ulaşın.</p><a href="mailto:destek@iseal.example">Destek al ↗</a></div><button className="sidebar-logout" onClick={() => setLogoutOpen(true)}><span>↪</span> Çıkış yap</button></div>
    </aside>
    <section className="dashboard-main">
      <header className="dashboard-topbar"><div className="breadcrumb" aria-hidden="true"></div><div className="topbar-user"><span className="topbar-avatar">{name.charAt(0).toLocaleUpperCase("tr-TR")}</span><div><strong>{name}</strong><small>{user?.role === "employer" ? "İşveren hesabı" : "Aday hesabı"}</small></div><Link className="profile-button" href="/panel?sekme=profil">♙ <span>Profilim</span></Link><button className="topbar-menu-button" aria-label="Çıkış menüsünü aç" onClick={() => setLogoutOpen(true)}>⌄</button></div></header>
      <div className="dashboard-content"><div className="dashboard-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> KONTROL PANELİ</div><h1>{title}</h1><p>{intro}</p></div>{user?.role === "candidate" ? <Link className="button button-dark" href="/ilanlar">İlanları keşfet <span>↗</span></Link> : <button className="button button-dark" type="button" onClick={() => { setJobError(""); setCreateJobOpen(true); }}>Yeni ilan oluştur <span>↗</span></button>}</div>
        {error && <div className="form-error dashboard-alert" role="alert">{error}</div>}
        {activeTab === "Profilim" ? user && <ProfileCenter role={user.role} section={profileSection} candidateProfile={candidateProfile || undefined} /> : user?.role === "candidate" ? <>
          {activeTab !== "Bildirimler" && <section className="dashboard-panel"><div className="panel-heading"><div><h2>Başvurularım</h2><p>Başvuru durumunuzu takip edin.</p></div></div>
            {loading ? <p className="panel-empty">Başvurular yükleniyor…</p> : applications.length === 0 ? <div className="panel-empty empty-with-action"><span className="empty-symbol">▤</span><strong>Henüz başvurunuz yok</strong><p>Size uygun fırsatları keşfederek ilk başvurunuzu yapabilirsiniz.</p><Link className="button button-outline button-small" href="/ilanlar">İş ilanlarını gör <span>↗</span></Link></div> : <div className="application-list">{applications.slice(0, 4).map((application) => <article className="application-row" key={application.id}><span className="company-symbol">{(application.company_name || "İ").charAt(0).toLocaleUpperCase("tr-TR")}</span><div className="application-info"><strong>{application.title || `İlan #${application.job_id}`}</strong><small>{application.company_name || "İşveren"}</small></div><span className={`status-badge status-${application.status}`}>{statusText[application.status] || application.status}</span><Link className="row-arrow" href={`/ilanlar/${application.job_id}`} aria-label={`${application.title || "İlan"} detayını gör`}>↗</Link><div className="match-hint">Eşleşme puanı bu başvuru için henüz hesaplanmadı.</div></article>)}</div>}
          </section>}
          {activeTab === "Bildirimler" && <section className="dashboard-panel"><div className="panel-heading"><div><h2>Bildirimler</h2><p>Yeni bildirimleriniz burada görünecek.</p></div></div><p className="panel-empty">Şimdilik yeni bildiriminiz yok.</p></section>}
        </> : user?.role === "employer" && <>
          <section className="dashboard-panel"><div className="panel-heading"><div><h2>{activeTab === "Adaylar" ? "İlanlarınıza gelen başvurular" : activeTab === "Eşleşme Sonuçları" ? "CV–ilan eşleşme sonuçları" : "İlanlarım"}</h2><p>Aday bilgileri yalnızca yetkili olduğunuz ilanlarla sınırlıdır.</p></div>{activeTab === "Eşleşme Sonuçları" && <span className="pending-tag">Eşleşme servisi bekleniyor</span>}</div>
            {loading ? <p className="panel-empty">İlanlar yükleniyor…</p> : activeTab === "Adaylar" ? data.candidates.length === 0 ? <div className="panel-empty empty-with-action"><span className="empty-symbol">♙</span><strong>Henüz başvuru yok</strong><p>İlanlarınıza gelen aday başvuruları burada görünür.</p></div> : <div className="employer-job-list">{data.candidates.filter((application) => !selectedJobId || application.job_id === selectedJobId).map((application) => <article className="employer-job-row" key={application.application_id || application.id}><span className="company-symbol">{(application.first_name || "A").charAt(0).toLocaleUpperCase("tr-TR")}</span><div className="application-info"><strong>{application.first_name} {application.last_name}</strong><small>{application.title} · {application.location || "Konum belirtilmedi"}</small></div><span className={`status-badge status-${application.status}`}>{statusText[application.status] || application.status}</span>{typeof application.match_score === "number" && <strong className="match-score">%{application.match_score} eşleşme</strong>}<p className="match-hint">{typeof application.match_score === "number" ? "CV ile ilan gereksinimlerinin profesyonel eşleşme puanı." : "Bu başvuru için CV–ilan eşleşme puanı henüz hesaplanmadı."}</p>{application.match_details && <div className="match-details">{Object.entries(application.match_details).map(([criterion, score]) => <span key={criterion}>{criterion}: %{score}</span>)}</div>}</article>)}</div> : activeTab === "Eşleşme Sonuçları" ? <>
              {selectedJobId && <p className="selected-job-note">Seçili ilan: {data.jobs.find((job) => job.id === selectedJobId)?.title || `İlan #${selectedJobId}`}</p>}
              <div className="job-match-grid">{data.jobs.filter((job) => !selectedJobId || job.id === selectedJobId).map((job) => <article className="job-match-card" key={job.id}><div><span className="eyebrow"><span className="eyebrow-dot"/> İLAN EŞLEŞMESİ</span><h3>{job.title}</h3><p>{job.company_name || "İşletmeniz"} · {job.location}</p></div><div className="job-match-card-bottom"><span>{data.candidates.filter((application) => application.job_id === job.id).length} başvuru</span><Link href={`/panel?sekme=eslesmeler&ilan=${job.id}`}>{selectedJobId === job.id ? "Detay görünümü" : "İlan eşleşme detayları ↗"}</Link></div><div className="notice-box">CV–ilan puanı ve kriter dökümü henüz backend tarafından sunulmuyor. Varsayılan ağırlıklar: beceriler %45, deneyim %30, eğitim %15, diğer mesleki gereksinimler %10. İşveren bu oranları ilan bazında özelleştirebilir.</div></article>)}</div>
            </> : data.jobs.length === 0 ? <div className="panel-empty empty-with-action"><span className="empty-symbol">▤</span><strong>Henüz ilanınız yok</strong><p>Yayımlanmış ilanlarınız burada listelenir.</p></div> : <div className="employer-job-list">{data.jobs.map((job) => <article className="employer-job-row" key={job.id}><span className="company-symbol">{(job.company_name || "İ").charAt(0).toLocaleUpperCase("tr-TR")}</span><div className="application-info"><strong>{job.title}</strong><small>{job.company_name || "İşletmeniz"} · {job.location} · {job.work_type}</small></div><span className={`status-badge status-${job.status || "published"}`}>{statusText[job.status || "published"] || job.status}</span><Link className="row-arrow" href={`/panel?sekme=eslesmeler&ilan=${job.id}`} aria-label={`${job.title} eşleşme sonuçlarını gör`}>↗</Link><p className="match-hint">{data.candidates.filter((application) => application.job_id === job.id).length} başvuru · Eşleşme detaylarını ilanın içinden görüntüleyin.</p></article>)}</div>}
          </section>
          {activeTab === "Adaylar" && <p className="dashboard-footnote">Adaylar başka aday profillerini göremez. İşverenler yalnızca yetkili oldukları ilanlara başvuran adayları görür.</p>}
        </>}
      </div>
    </section>
    {createJobOpen && <div className="modal-backdrop" role="presentation" onClick={() => setCreateJobOpen(false)}><section className="confirm-modal create-job-modal" role="dialog" aria-modal="true" aria-labelledby="create-job-title" onClick={(event) => event.stopPropagation()}><h2 id="create-job-title">Yeni ilan oluştur</h2><p>İlanınız yayımlandığında adaylar başvurabilir.</p><form className="form-fields" onSubmit={createJob}><div className="form-field"><label htmlFor="job-title">İlan başlığı</label><input id="job-title" name="title" required maxLength={200} /></div><div className="form-field"><label htmlFor="job-location">Konum</label><input id="job-location" name="location" required maxLength={200} placeholder="İl veya uzaktan" /></div><div className="form-field"><label htmlFor="job-work-type">Çalışma şekli</label><select id="job-work-type" name="work_type" required defaultValue="Tam zamanlı"><option>Tam zamanlı</option><option>Yarı zamanlı</option><option>Uzaktan</option><option>Hibrit</option><option>Dönemsel</option></select></div><div className="form-field"><label htmlFor="job-description">İlan açıklaması</label><textarea id="job-description" name="description" required maxLength={5000} rows={5} /></div>{jobError && <div className="form-error" role="alert">{jobError}</div>}<div className="modal-actions"><button className="button button-outline button-small" type="button" onClick={() => setCreateJobOpen(false)}>Vazgeç</button><button className="button button-dark button-small" disabled={jobSaving}>{jobSaving ? "Yayımlanıyor…" : "İlanı yayımla"}</button></div></form></section></div>}
    {logoutOpen && <div className="modal-backdrop" role="presentation" onClick={() => setLogoutOpen(false)}><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={(event) => event.stopPropagation()}><h2 id="logout-title">Çıkış yapmak istiyor musunuz?</h2><p>Oturumunuz kapatılacak.</p><div><button className="button button-outline button-small" onClick={() => setLogoutOpen(false)}>Vazgeç</button><button className="button button-dark button-small" onClick={logout}>Çıkış yap</button></div></section></div>}
  </main>;
}
