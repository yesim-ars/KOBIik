"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/auth";

type Job = { id?: number; title: string; company_name?: string; location?: string; work_type?: string; };
type JobsResponse = { count: number; jobs: Job[] };
const examples: Job[] = [
  { title: "Ön Muhasebe Uzmanı", company_name: "MaviKare Teknoloji", location: "İstanbul · Hibrit", work_type: "Tam zamanlı" },
  { title: "Müşteri Deneyimi Sorumlusu", company_name: "İyi Fikir Atölyesi", location: "Ankara · Uzaktan", work_type: "Tam zamanlı" },
  { title: "Dijital Pazarlama Uzmanı", company_name: "Rota E-Ticaret", location: "İzmir · Ofisten", work_type: "Tam zamanlı" },
];

export default function JobHighlights() {
  const [jobs, setJobs] = useState<Job[]>(examples);
  const [isDemo, setIsDemo] = useState(true);
  useEffect(() => {
    apiRequest<JobsResponse>("/jobs").then((result) => {
      setJobs(result.jobs.slice(0, 3)); setIsDemo(false);
    }).catch(() => { setIsDemo(true); });
  }, []);
  return <>
    <div className="job-grid">{jobs.length ? jobs.map((job, index) => <Link className="job-card job-card-link" href={job.id ? `/ilanlar/${job.id}` : "/ilanlar"} key={job.id ?? job.title}>
      <div className="job-card-top"><span className={`company-symbol symbol-${index % 3}`}>{(job.company_name || "İ").charAt(0).toLocaleLowerCase("tr-TR")}</span><span className="job-type">{job.work_type || "İş ilanı"}</span></div>
      <div className="job-tag">Yeni fırsat</div><h3>{job.title}</h3><p>{job.company_name || "KOBİ"}</p><div className="job-card-bottom"><span>⌖ &nbsp;{job.location || "Türkiye"}</span><span className="job-arrow">↗</span></div>
    </Link>) : <p className="jobs-empty">Şu anda yayında ilan bulunmuyor.</p>}</div>
    <p className="demo-caption">{isDemo ? "Örnek ilanlar · Güncel ilanlar için API sunucusunun çalıştığından emin olun." : "Yayındaki ilanlar · Son ilanlar API’den yüklenir."}</p>
  </>;
}
