import { useComunicacaoMockData } from "@/hooks/useComunicacaoMockData";
import { MessageHistory } from "@/components/comunicacao/MessageHistory";

export default function MarketingHistorico() {
  const { messageLogs } = useComunicacaoMockData();
  return <MessageHistory messages={messageLogs} />;
}
