import { useComunicacaoMockData } from "@/hooks/useComunicacaoMockData";
import { AutomationsList } from "@/components/comunicacao/AutomationsList";

export default function MarketingAutomacoes() {
  const { automations, toggleAutomation } = useComunicacaoMockData();
  return <AutomationsList automations={automations} onToggle={toggleAutomation} />;
}
