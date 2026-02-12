import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Wifi,
  WifiOff,
  Shield,
  TestTube,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Unplug,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { toast } from "sonner";

interface ZApiIntegration {
  id: string;
  clinic_id: string;
  provider: string;
  base_url: string | null;
  instance_id: string | null;
  access_token: string | null;
  status: string;
  display_phone_number: string | null;
}

export default function MarketingConfigWhatsApp() {
  const { clinic } = useClinicData();
  const [integration, setIntegration] = useState<ZApiIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [baseUrl, setBaseUrl] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [token, setToken] = useState("");
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    if (clinic?.id) fetchIntegration();
  }, [clinic?.id]);

  const fetchIntegration = async () => {
    if (!clinic?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clinic_channel_integrations")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("channel", "whatsapp")
        .eq("provider", "z-api")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIntegration(data as ZApiIntegration);
        setBaseUrl(data.base_url || "");
        setInstanceId(data.instance_id || "");
        setToken(data.access_token || "");
      }
    } catch (err) {
      console.error("Error fetching Z-API integration:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clinic?.id) return;
    if (!baseUrl || !instanceId || !token) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clinic_id: clinic.id,
        channel: "whatsapp",
        provider: "z-api",
        base_url: baseUrl.replace(/\/$/, ""),
        instance_id: instanceId,
        access_token: token,
        api_url: baseUrl.replace(/\/$/, ""),
        status: "active",
      };

      if (integration?.id) {
        const { error } = await supabase
          .from("clinic_channel_integrations")
          .update(payload)
          .eq("id", integration.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clinic_channel_integrations")
          .insert(payload);
        if (error) throw error;
      }

      toast.success("Integração Z-API salva e ativada com sucesso!");
      await fetchIntegration();
    } catch (err: any) {
      console.error("Error saving Z-API:", err);
      toast.error("Erro ao salvar: " + (err.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!clinic?.id || !testPhone) {
      toast.error("Informe um número para teste");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          clinic_id: clinic.id,
          phone: testPhone,
          message: "✅ Teste de conexão YesClin via Z-API — mensagem recebida com sucesso!",
        },
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult({ success: true, message: "Mensagem enviada com sucesso!" });
        toast.success("Mensagem de teste enviada!");
      } else {
        setTestResult({
          success: false,
          message: data?.error || "Falha no envio",
        });
        toast.error(data?.error || "Falha no envio");
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Erro de conexão" });
      toast.error("Erro ao testar: " + (err.message || ""));
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integration?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("clinic_channel_integrations")
        .update({
          status: "not_configured",
          base_url: null,
          api_url: null,
          instance_id: null,
          access_token: null,
        })
        .eq("id", integration.id);
      if (error) throw error;
      toast.success("Z-API desconectado");
      setBaseUrl("");
      setInstanceId("");
      setToken("");
      await fetchIntegration();
    } catch (err: any) {
      toast.error("Erro ao desconectar: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Carregando configuração...
        </CardContent>
      </Card>
    );
  }

  const isActive = integration?.status === "active";

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>WhatsApp via Z-API</CardTitle>
                <CardDescription>Configure sua instância Z-API para envio de mensagens</CardDescription>
              </div>
            </div>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-green-500" : ""}
            >
              {isActive ? (
                <><Wifi className="h-3 w-3 mr-1" />Conectado</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" />Desconectado</>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL da Z-API *</Label>
              <Input
                id="base_url"
                placeholder="https://api.z-api.io"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                URL base da sua instância Z-API (ex: https://api.z-api.io)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instance_id">Instance ID *</Label>
              <Input
                id="instance_id"
                placeholder="Seu Instance ID"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Token *</Label>
              <Input
                id="token"
                type="password"
                placeholder="Seu Token Z-API"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                O token é armazenado de forma segura e nunca exposto no frontend.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || !baseUrl || !instanceId || !token}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar e Ativar
            </Button>

            {isActive && (
              <Button variant="destructive" onClick={handleDisconnect} disabled={saving}>
                <Unplug className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            )}
          </div>

          {/* Test Section */}
          {isActive && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Testar Envio</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="5511999999999"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    variant="outline"
                    onClick={handleTest}
                    disabled={testing || !testPhone}
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Enviar Teste
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                      testResult.success
                        ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-400"
                        : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
