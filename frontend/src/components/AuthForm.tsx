"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Role, submitAuth } from "@/lib/auth";

function AuthFormContent({ mode }: { mode: "login" | "register" }) {
  const search = useSearchParams(); const router = useRouter();
  const [role, setRole] = useState<Role>(search.get("rol") === "isveren" ? "employer" : "candidate");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [success, setSuccess] = useState("");
  const registering = mode === "register";
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const body: Record<string, string> = { email: String(form.get("email") || "").trim(), password: String(form.get("password") || "") };
    if (registering) { body.role = role; if (role === "candidate") { body.first_name = String(form.get("first_name") || "").trim(); body.last_name = String(form.get("last_name") || "").trim(); } else { body.company_name = String(form.get("company_name") || "").trim(); body.sector = String(form.get("sector") || "").trim(); } }
    try { await submitAuth(mode, body); if (registering) { setSuccess("Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz."); window.setTimeout(() => router.push("/giris"), 900); } else router.replace("/panel"); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Beklenmeyen bir hata oluştu."); } finally { setBusy(false); }
  }
  return <main className="auth-shell"><aside className="auth-aside"><Link href="/" className="brand"><span className="brand-mark">İ</span><span>işe<span className="brand-accent">al</span></span></Link><blockquote>Doğru insanlarla<br/>başlayan işler,<br/><span>birlikte büyür.</span></blockquote><span className="aside-foot">KOBİ’ler ve yetenekler için daha iyi bir başlangıç.</span></aside><section className="auth-main"><div className="auth-panel"><Link href="/" className="back-home">← Ana sayfaya dön</Link><h1>{registering ? "Aramıza hoş geldin." : "Tekrar hoş geldin."}</h1><p className="auth-subtitle">{registering ? "Hesabını oluştur, sana uygun fırsatları keşfet." : "Devam etmek için hesabına giriş yap."}</p>
    <form onSubmit={handleSubmit}>{registering && <div className="role-picker" role="radiogroup" aria-label="Hesap türü"><label className={`role-option ${role === "candidate" ? "selected" : ""}`}><input type="radio" name="role" checked={role === "candidate"} onChange={() => setRole("candidate")}/><span className="role-icon">♙</span><strong>Adayım</strong><small>Yeni bir iş arıyorum</small></label><label className={`role-option ${role === "employer" ? "selected" : ""}`}><input type="radio" name="role" checked={role === "employer"} onChange={() => setRole("employer")}/><span className="role-icon">▦</span><strong>İşverenim</strong><small>Ekibime çalışan arıyorum</small></label></div>}
    <div className="form-fields">{registering && role === "candidate" && <div className="field-row"><div className="form-field"><label htmlFor="first_name">Ad</label><input id="first_name" name="first_name" autoComplete="given-name" placeholder="Adınız" required/></div><div className="form-field"><label htmlFor="last_name">Soyad</label><input id="last_name" name="last_name" autoComplete="family-name" placeholder="Soyadınız" required/></div></div>}
    {registering && role === "employer" && <><div className="form-field"><label htmlFor="company_name">İşletme adı</label><input id="company_name" name="company_name" autoComplete="organization" placeholder="İşletmenizin adı" required/></div><div className="form-field"><label htmlFor="sector">Sektör <span className="optional">(isteğe bağlı)</span></label><input id="sector" name="sector" placeholder="Örn. Teknoloji, perakende"/></div></>}
    <div className="form-field"><label htmlFor="email">E-posta adresi</label><input id="email" name="email" type="email" autoComplete="email" placeholder="ornek@eposta.com" required/></div><div className="form-field"><label htmlFor="password">Parola</label><input id="password" name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} placeholder={registering ? "En az 10 karakter" : "Parolanız"} minLength={registering ? 10 : 1} required/>{registering && <span className="password-hint">Parolan en az 10 karakter olmalı.</span>}</div>
    {error && <div className="form-error" role="alert">{error}</div>}{success && <div className="form-success" role="status">{success}</div>}<button className={`button button-dark form-submit ${busy ? "auth-loading" : ""}`} type="submit" disabled={busy}>{busy ? "İşleniyor…" : registering ? "Ücretsiz hesap oluştur" : "Giriş yap"}<span>↗</span></button></div></form>
    <p className="auth-switch">{registering ? "Zaten hesabın var mı?" : "Henüz hesabın yok mu?"} <Link href={registering ? "/giris" : "/kayit"}>{registering ? "Giriş yap" : "Ücretsiz üye ol"}</Link></p><p className="legal-note">Devam ederek kullanım koşullarımızı ve gizlilik politikamızı kabul etmiş olursun.</p></div></section></main>;
}
export default function AuthForm({ mode }: { mode: "login" | "register" }) { return <Suspense fallback={<main className="auth-shell"><section className="auth-main">Yükleniyor…</section></main>}><AuthFormContent mode={mode}/></Suspense>; }

