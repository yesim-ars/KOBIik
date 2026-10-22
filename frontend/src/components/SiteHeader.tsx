"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";

type User = { id: number; email: string; role: "candidate" | "employer" };

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    void Promise.resolve().then(async () => {
      if (localStorage.getItem("iseal_access_token")) {
        try { setUser(await apiRequest<User>("/auth/me")); }
        catch { localStorage.removeItem("iseal_access_token"); window.dispatchEvent(new Event("iseal-auth-change")); }
      }
      setChecking(false);
    });
  }, []);
  function logout() {
    localStorage.removeItem("iseal_access_token");
    setUser(null);
    window.dispatchEvent(new Event("iseal-auth-change"));
  }
  return <header className="site-header wrap">
    <Link href="/" className="brand"><span className="brand-mark">İ</span><span>işe<span className="brand-accent">al</span></span></Link>
    <div className="header-actions">
      {!checking && !user && <><Link className="text-link" href="/giris">Giriş yap</Link><Link className="button button-dark button-small" href="/kayit">Ücretsiz üye ol <span>↗</span></Link></>}
      {!checking && user && <><Link className="dashboard-link" href="/panel?sekme=profil">Profilim</Link><span className="user-badge">{user.role === "candidate" ? "Aday hesabı" : "İşveren hesabı"}</span></>}
      {checking && <span className="header-placeholder" aria-label="Hesap kontrol ediliyor"/>}
    </div>
  </header>;
}

