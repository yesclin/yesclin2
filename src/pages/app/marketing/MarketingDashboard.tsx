import { useComunicacaoMockData } from "@/hooks/useComunicacaoMockData";
import { CommunicationStats } from "@/components/comunicacao/CommunicationStats";
import { WhatsAppStatus } from "@/components/comunicacao/WhatsAppStatus";
import { CRMPipeline } from "@/components/comunicacao/CRMPipeline";
import { CRMPatientList } from "@/components/comunicacao/CRMPatientList";
import { useState } from "react";
import type { CRMStatus } from "@/types/comunicacao";

export default function MarketingDashboard() {
  const { crmPatients, pipelineStats, messageStats } = useComunicacaoMockData();
  const [selectedStatus, setSelectedStatus] = useState<CRMStatus | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><CommunicationStats stats={messageStats} /></div>
        <WhatsAppStatus />
      </div>
      <CRMPipeline stats={pipelineStats} onStatusClick={(s) => setSelectedStatus(selectedStatus === s ? null : s)} selectedStatus={selectedStatus} />
      <CRMPatientList patients={crmPatients} selectedStatus={selectedStatus} />
    </div>
  );
}
