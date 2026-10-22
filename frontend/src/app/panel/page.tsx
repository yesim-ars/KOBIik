import Dashboard from "@/components/Dashboard";
const tabs: Record<string, string> = { basvurular: "Başvurularım", profil: "Profilim", bildirimler: "Bildirimler", ilanlar: "İlanlarım", adaylar: "Adaylar", eslesmeler: "Eşleşme Sonuçları" };
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ sekme?: string | string[]; bolum?: string | string[]; ilan?: string | string[] }> }) {
  const { sekme, bolum, ilan } = await searchParams;
  const activeTab = typeof sekme === "string" ? tabs[sekme] || "Ana Sayfa" : "Ana Sayfa";
  return <Dashboard initialTab={activeTab} profileSection={typeof bolum === "string" ? bolum : undefined} selectedJobId={typeof ilan === "string" ? Number(ilan) : undefined} />;
}
