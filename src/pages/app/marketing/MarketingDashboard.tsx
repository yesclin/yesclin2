import { useComunicacaoMockData } from "@/hooks/useComunicacaoMockData";
import { CommunicationStats } from "@/components/comunicacao/CommunicationStats";
import { WhatsAppStatus } from "@/components/comunicacao/WhatsAppStatus";

export default function MarketingDashboard() {
  const { messageStats } = useComunicacaoMockData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><CommunicationStats stats={messageStats} /></div>
        <WhatsAppStatus />
      </div>
    </div>
  );
}
