"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import JobHighlights from "@/components/JobHighlights";
import SiteHeader from "@/components/SiteHeader";
import HomeActions from "@/components/HomeActions";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const updateSession = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("iseal_access_token")));
      setCheckingSession(false);
    };
    void Promise.resolve().then(updateSession);
    window.addEventListener("iseal-auth-change", updateSession);
    return () => window.removeEventListener("iseal-auth-change", updateSession);
  }, []);

  if (checkingSession) return <main className="home-checking" aria-busy="true" />;
  if (isAuthenticated) return <main><SiteHeader/><Dashboard initialTab="Ana Sayfa"/></main>;

  return <main>
    <SiteHeader/>
    <section className="hero wrap">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> KOBİ’ler ve yetenekler için</div><h1>İyi bir eşleşme,<br /><span>iyi bir başlangıç.</span></h1><p className="hero-lead">KOBİ’lerin doğru ekip arkadaşlarını bulduğu, adayların da kendine uygun işi keşfettiği yeni nesil işe alım platformu.</p><HomeActions placement="hero"/><div className="hero-note"><span className="avatar-stack"><i>A</i><i>M</i><i>E</i></span><span>Küçük ekipler için, büyük bir kolaylık.</span></div></div>
      <div className="hero-art" aria-label="İşe alım sürecini anlatan illüstrasyon"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="sun-shape"/><div className="art-card profile-card"><div className="profile-top"><div className="portrait">E</div><div><strong>Elif Yılmaz</strong><small>Ürün Tasarımcısı</small></div><span className="match-pill">%94 uyum</span></div><div className="profile-lines"><i/><i/><i/></div><div className="skill-row"><span>UX/UI</span><span>Figma</span><span>Araştırma</span></div><div className="card-bottom"><span>● Profil tamamlandı</span><b>↗</b></div></div><div className="art-card note-card"><span className="note-icon">✳</span><div><strong>Size uygun adaylar</strong><small>Özenle eşleştirildi</small></div><span className="note-arrow">↗</span></div><div className="art-spark spark-a">✳</div><div className="art-spark spark-b">✦</div><div className="art-label">DOĞRU İNSANLAR<br/>DOĞRU YERDE</div></div>
    </section>
    <section className="how-section" id="nasil-calisir"><div className="wrap how-inner"><div><div className="eyebrow"><span className="eyebrow-dot"/> BASİT VE ANLAŞILIR</div><h2>İşe alımın<br/>daha <span>insani</span> yolu.</h2><p>İster ekibine yeni bir yol arkadaşı ara, ister kariyerinde yeni bir sayfa aç. Başlamak sadece birkaç dakika.</p></div><div className="steps"><article><span>01</span><div><h3>Profilini oluştur</h3><p>İhtiyacını ve deneyimini bize anlat.</p></div><b>↗</b></article><article><span>02</span><div><h3>Sana uygun olanı keşfet</h3><p>Doğru adayları veya fırsatları gör.</p></div><b>↗</b></article><article><span>03</span><div><h3>Güvenle ilk adımı at</h3><p>Başvurunu ilet, görüşmeye hazır ol.</p></div><b>↗</b></article></div></div></section>
    <section className="trust-band"><div className="wrap trust-content"><span>İş aramanın ve işe almanın daha iyi bir yolu</span><div className="trust-points"><b><i>✓</i> Kolay başvuru</b><b><i>✓</i> Akıllı eşleşme</b><b><i>✓</i> KOBİ’lere özel</b></div></div></section>
    <section className="jobs-section wrap" id="ilanlar"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> YENİ FIRSATLAR</div><h2>Belki de aradığın iş<br/>buradadır.</h2></div><Link className="all-link" href="/ilanlar">Tüm ilanları keşfet <span>↗</span></Link></div><JobHighlights/></section>
    <section className="closing wrap"><div><span className="eyebrow"><span className="eyebrow-dot"/> BİR SONRAKİ ADIM SENİN</span><h2>Güzel şeyler,<br/>doğru insanlarla başlar.</h2></div><HomeActions placement="closing"/></section>
    <footer className="site-footer"><div className="wrap footer-inner"><Link href="/" className="brand"><span className="brand-mark">İ</span><span>işe<span className="brand-accent">al</span></span></Link><span>KOBİ’ler için daha iyi işe alım.</span><span>© 2026 işeal</span></div></footer>
  </main>;
}
