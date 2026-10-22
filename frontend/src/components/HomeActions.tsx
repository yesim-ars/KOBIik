"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomeActions({ placement }: { placement: "hero" | "closing" }) {
  const [session, setSession] = useState<"checking" | "guest" | "signed-in">("checking");
  useEffect(() => {
    const updateSession = () => setSession(localStorage.getItem("iseal_access_token") ? "signed-in" : "guest");
    void Promise.resolve().then(updateSession);
    window.addEventListener("iseal-auth-change", updateSession);
    return () => window.removeEventListener("iseal-auth-change", updateSession);
  }, []);
  if (session === "checking") return null;
  if (session === "signed-in") return <Link className="button button-dark" href="/ilanlar">{placement === "hero" ? "İlanları keşfet" : "İlanlara göz at"} <span>↗</span></Link>;
  if (placement === "closing") return <Link className="button button-dark" href="/kayit">Hemen başla <span>↗</span></Link>;
  return <div className="hero-ctas"><Link className="button button-dark" href="/kayit?rol=aday">İş arıyorum <span>↗</span></Link><Link className="button button-outline" href="/kayit?rol=isveren">İşe alım yapıyorum <span>↗</span></Link></div>;
}
