import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, MessageSquare, Zap, Megaphone,
  History, Contact, MessageCircle,
} from "lucide-react";
import MarketingDashboard from "./MarketingDashboard";
import MarketingTemplates from "./MarketingTemplates";
import MarketingAutomacoes from "./MarketingAutomacoes";
import MarketingCampanhas from "./MarketingCampanhas";
import MarketingHistorico from "./MarketingHistorico";
import MarketingConfigWhatsApp from "./MarketingConfigWhatsApp";

const TABS = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "templates", label: "Templates", icon: MessageSquare },
  { value: "automacoes", label: "Automações", icon: Zap },
  { value: "campanhas", label: "Campanhas", icon: Megaphone },
  { value: "historico", label: "Histórico", icon: History },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function MarketingLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = (searchParams.get("tab") as TabValue) || "dashboard";
  const activeTab = TABS.some((t) => t.value === tabFromUrl) ? tabFromUrl : "dashboard";

  const handleTabChange = (value: string) => {
    if (value === "dashboard") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
        <p className="text-muted-foreground">CRM clínico, automações e campanhas</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard"><MarketingDashboard /></TabsContent>
        <TabsContent value="templates"><MarketingTemplates /></TabsContent>
        <TabsContent value="automacoes"><MarketingAutomacoes /></TabsContent>
        <TabsContent value="campanhas"><MarketingCampanhas /></TabsContent>
        <TabsContent value="historico"><MarketingHistorico /></TabsContent>
        <TabsContent value="whatsapp"><MarketingConfigWhatsApp /></TabsContent>
      </Tabs>
    </div>
  );
}
