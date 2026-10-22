"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";

type Job = { id: number; title: string; description: string; location: string; work_type: string; company_name: string };
type JobsResponse = { count: number; jobs: Job[] };

export default function JobListing() {
  const [jobs, setJobs] = useState<Job[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { apiRequest<JobsResponse>("/jobs").then((result) => setJobs(result.jobs)).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "İlanlar yüklenemedi.")).finally(() => setLoading(false)); }, []);
  return <div className="listing-content">
    {loading && <p className="listing-message">Yayındaki ilanlar yükleniyor…</p>}
    {!loading && error && <div className="form-error listing-message">İlanlara şu anda ulaşılamıyor. Backend servisinin çalıştığını kontrol edip sayfayı yenileyin.</div>}
    {!loading && !error && jobs.length === 0 && <p className="listing-message">Şu anda yayında ilan bulunmuyor. Yeni ilanlar burada görünecek.</p>}
    {!loading && !error && jobs.length > 0 && <div className="job-grid">{jobs.map((job, index) => <Link className="job-card job-card-link" href={`/ilanlar/${job.id}`} key={job.id}>
      <div className="job-card-top"><span className={`company-symbol symbol-${index % 3}`}>{(job.company_name || "İ").charAt(0).toLocaleLowerCase("tr-TR")}</span><span className="job-type">{job.work_type}</span></div>
      <div className="job-tag">Yeni fırsat</div><h3>{job.title}</h3><p>{job.company_name}</p><div className="job-card-bottom"><span>⌖ &nbsp;{job.location}</span><span className="job-arrow">↗</span></div>
    </Link>)}</div>}
  </div>;
}
