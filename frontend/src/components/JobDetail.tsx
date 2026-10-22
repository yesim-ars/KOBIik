"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";

type Job = { id: number; title: string; description: string; location: string; work_type: string; company_name: string };
type JobsResponse = { count: number; jobs: Job[] };
type User = { id: number; email: string; role: "candidate" | "employer" };
type ApplicationsResponse = { count: number; applications: Array<{ job_id: number }> };

export default function JobDetail({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null); const [checkingUser, setCheckingUser] = useState(true); const [applicationStatus, setApplicationStatus] = useState<"checking" | "applied" | "not-applied" | "error">("checking"); const [applying, setApplying] = useState(false); const [applicationMessage, setApplicationMessage] = useState(""); const [applicationError, setApplicationError] = useState("");
  useEffect(() => {
    let active = true;
    const handleAuthChange = () => { setUser(null); setCheckingUser(false); setApplicationStatus("not-applied"); };
    window.addEventListener("iseal-auth-change", handleAuthChange);
    void Promise.resolve().then(async () => {
      setLoading(true); setError(""); setJob(null); setCheckingUser(true); setApplicationStatus("checking"); setApplicationMessage(""); setApplicationError("");
      apiRequest<JobsResponse>("/jobs").then(({ jobs }) => { if (!active) return; const found = jobs.find((item) => String(item.id) === jobId); if (found) setJob(found); else setError("Bu ilan bulunamadı veya artık yayında değil."); }).catch(() => { if (active) setError("İlan bilgisi yüklenemedi. Backend servisinin çalıştığını kontrol edin."); }).finally(() => { if (active) setLoading(false); });
      if (localStorage.getItem("iseal_access_token")) {
        let currentUser: User;
        try {
          currentUser = await apiRequest<User>("/auth/me");
        }
        catch { localStorage.removeItem("iseal_access_token"); if (active) { setUser(null); setApplicationStatus("not-applied"); setCheckingUser(false); } return; }
        if (!active) return;
        setUser(currentUser);
        if (currentUser.role === "candidate") {
          try {
            const result = await apiRequest<ApplicationsResponse>("/candidate/applications");
            if (!active) return;
            setApplicationStatus(result.applications.some((application) => application.job_id === Number(jobId)) ? "applied" : "not-applied");
          } catch { if (active) setApplicationStatus("error"); }
        } else setApplicationStatus("not-applied");
      } else setApplicationStatus("not-applied");
      if (active) setCheckingUser(false);
    });
    return () => { active = false; window.removeEventListener("iseal-auth-change", handleAuthChange); };
  }, [jobId]);
  async function apply() {
    setApplying(true); setApplicationMessage(""); setApplicationError("");
    try { const result = await apiRequest<{ message: string }>(`/jobs/${jobId}/apply`, { method: "POST" }); setApplicationMessage(result.message || "Başvurunuz alındı."); setApplicationStatus("applied"); }
    catch (caught) { const message = caught instanceof Error ? caught.message : "Başvurunuz gönderilemedi."; setApplicationError(message); if (message.toLocaleLowerCase("tr-TR").includes("zaten başvurdunuz")) setApplicationStatus("applied"); }
    finally { setApplying(false); }
  }
  return <main className="listing-page"><SiteHeader/>
    <div className="wrap detail-wrap"><Link className="back-home" href="/ilanlar">← Tüm ilanlara dön</Link>
      {loading && <p className="listing-message">İlan yükleniyor…</p>}{!loading && error && <div className="form-error listing-message">{error}</div>}
      {!loading && job && <article className="job-detail-card"><div className="detail-eyebrow">YAYINDAKİ İLAN</div><div className="detail-title-row"><div><h1>{job.title}</h1><p className="detail-company">{job.company_name}</p></div><span className="company-symbol symbol-0 detail-symbol">{(job.company_name || "İ").charAt(0).toLocaleLowerCase("tr-TR")}</span></div><div className="detail-meta"><span>⌖ &nbsp;{job.location}</span><span>◷ &nbsp;{job.work_type}</span></div><div className="detail-divider"/><h2>İş hakkında</h2><p className="job-description">{job.description}</p>
        <section className="apply-panel"><div><h2>Bu ilan sana uygun mu?</h2><p>İlgini çektiyse başvurunu hemen ilet.</p></div>
          {checkingUser && <button className="button button-dark" disabled>Hesap kontrol ediliyor…</button>}
          {!checkingUser && !user && <Link className="button button-dark" href="/giris">Giriş yap ve başvur <span>↗</span></Link>}
          {!checkingUser && user?.role === "candidate" && applicationStatus === "checking" && <button className="button button-dark" disabled>Başvuru kontrol ediliyor…</button>}
          {!checkingUser && user?.role === "candidate" && applicationStatus === "applied" && <span className="applied-badge">✓ Bu ilana başvurdun</span>}
          {!checkingUser && user?.role === "candidate" && applicationStatus === "not-applied" && <button className="button button-dark" onClick={apply} disabled={applying}>{applying ? "Başvurun gönderiliyor…" : "Başvuru yap"}<span>↗</span></button>}
          {!checkingUser && user?.role === "candidate" && applicationStatus === "error" && <span className="candidate-hint">Başvuru durumun kontrol edilemedi. Sayfayı yenileyip tekrar dene.</span>}
          {!checkingUser && user?.role === "employer" && <span className="candidate-hint">Başvuru yapmak için aday hesabıyla giriş yapın.</span>}
          {applicationMessage && <div className="form-success apply-feedback" role="status">{applicationMessage}</div>}{applicationError && <div className="form-error apply-feedback" role="alert">{applicationError}</div>}
        </section>
      </article>}
    </div>
  </main>;
}
