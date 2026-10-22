import Link from "next/link";
import JobListing from "@/components/JobListing";
import SiteHeader from "@/components/SiteHeader";

export default function JobsPage() {
  return <main className="listing-page"><SiteHeader/><section className="wrap listing-wrap" id="ilan-listesi"><Link className="back-home" href="/">← Ana sayfaya dön</Link><div className="eyebrow"><span className="eyebrow-dot"/> YENİ FIRSATLAR</div><h1 className="listing-title">Sana uygun işi<br/>keşfet.</h1><p className="listing-intro">Yayındaki ilanları incele, sana uygun fırsat için hemen başvur.</p><JobListing/></section></main>;
}
