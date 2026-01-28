import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Wifi,
  WifiOff,
  Settings,
  ExternalLink,
  Shield,
} from "lucide-react";
import type { CommunicationSettings } from "@/types/comunicacao";

interface WhatsAppStatusProps {
  settings: CommunicationSettings;
}

export function WhatsAppStatus({ settings }: WhatsAppStatusProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp Business
          </CardTitle>
          <Badge 
            variant={settings.whatsapp_connected ? "default" : "secondary"}
            className={settings.whatsapp_connected ? "bg-green-500" : ""}
          >
            {settings.whatsapp_connected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Desconectado
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {settings.whatsapp_connected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Número Conectado</p>
                <p className="text-lg font-bold text-green-700">
                  {settings.whatsapp_number || '(11) 99999-9999'}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Limite Diário</p>
                <p className="font-medium">{settings.daily_message_limit} mensagens</p>
              </div>
              <div>
                <p className="text-muted-foreground">Horário de Envio</p>
                <p className="font-medium">
                  {settings.send_start_time} - {settings.send_end_time}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Fins de Semana</p>
                <p className="font-medium">
                  {settings.send_on_weekends ? 'Habilitado' : 'Desabilitado'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Canal Padrão</p>
                <p className="font-medium capitalize">{settings.default_channel}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <h3 className="font-medium mb-2">Conecte seu WhatsApp Business</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Automatize confirmações, lembretes e campanhas diretamente pelo WhatsApp da sua clínica.
            </p>
            
            <Button className="mb-4">
              <MessageCircle className="h-4 w-4 mr-2" />
              Conectar WhatsApp
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Integração oficial via WhatsApp Business API</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
