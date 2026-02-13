import { useState, useEffect } from "react";
import { useDocumentSettings, DOCUMENT_DEFAULTS, type DocumentSettingsInput } from "@/hooks/useDocumentSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FileText, Upload, Save, Loader2, Building2, Palette,
  UserCircle, FileSignature, Eye, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

function DocumentPreview({ form }: { form: DocumentSettingsInput }) {
  return (
    <div className="border rounded-lg bg-white text-black overflow-hidden shadow-sm" style={{ fontSize: '11px' }}>
      {/* Header */}
      {form.header_style === 'stripe' ? (
        <div style={{ backgroundColor: form.primary_color }} className="p-3 text-white">
          <div className="flex items-center gap-3">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded object-cover bg-white/20" />
            ) : (
              <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-bold text-sm">{form.clinic_name || 'Nome da Clínica'}</p>
              {form.responsible_name && <p className="text-[10px] opacity-90">{form.responsible_name}</p>}
              {form.show_crm && form.responsible_crm && (
                <p className="text-[10px] opacity-80">CRM: {form.responsible_crm}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 border-b">
          <div className="flex items-center gap-3">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded object-cover border" />
            ) : (
              <div className="h-10 w-10 rounded border flex items-center justify-center" style={{ color: form.primary_color }}>
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-bold text-sm" style={{ color: form.primary_color }}>
                {form.clinic_name || 'Nome da Clínica'}
              </p>
              {form.responsible_name && <p className="text-[10px] text-gray-600">{form.responsible_name}</p>}
              {form.show_crm && form.responsible_crm && (
                <p className="text-[10px] text-gray-500">CRM: {form.responsible_crm}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient data placeholder */}
      <div className="px-3 py-2 bg-gray-50 border-b">
        <p className="text-[10px] text-gray-500 font-medium">DADOS DO PACIENTE</p>
        <p className="text-[10px] text-gray-400">Nome: João Silva • CPF: 000.000.000-00</p>
      </div>

      {/* Document title */}
      <div className="px-3 py-2 text-center border-b">
        <p className="font-bold text-xs" style={{ color: form.primary_color }}>ANAMNESE</p>
      </div>

      {/* Content placeholder */}
      <div className="px-3 py-2 space-y-1.5">
        <div>
          <p className="text-[10px] font-semibold text-gray-600">Queixa Principal</p>
          <div className="h-2 bg-gray-200 rounded w-3/4 mt-0.5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-600">História da Doença Atual</p>
          <div className="h-2 bg-gray-200 rounded w-full mt-0.5" />
          <div className="h-2 bg-gray-200 rounded w-2/3 mt-0.5" />
        </div>
      </div>

      {/* Footer */}
      {form.show_footer && (
        <div className="border-t px-3 py-2 mt-1">
          <div className="flex items-end justify-between">
            <p className="text-[9px] text-gray-400">{form.footer_text}</p>
            {form.show_digital_signature && form.signature_image_url && (
              <img src={form.signature_image_url} alt="Assinatura" className="h-6 object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentosInstitucionais() {
  const { settings, loading, saving, save, uploadFile, clinicName } = useDocumentSettings();

  const [form, setForm] = useState<DocumentSettingsInput>({ ...DOCUMENT_DEFAULTS });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        logo_url: settings.logo_url,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        clinic_name: settings.clinic_name,
        responsible_name: settings.responsible_name,
        responsible_crm: settings.responsible_crm,
        show_crm: settings.show_crm,
        show_footer: settings.show_footer,
        footer_text: settings.footer_text,
        header_style: settings.header_style,
        show_digital_signature: settings.show_digital_signature,
        signature_image_url: settings.signature_image_url,
      });
    } else if (clinicName) {
      setForm(prev => ({ ...prev, clinic_name: clinicName }));
    }
  }, [settings, clinicName]);

  const update = (key: keyof DocumentSettingsInput, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem');
      return;
    }
    setUploadingLogo(true);
    const url = await uploadFile(file, 'logos');
    if (url) update('logo_url', url);
    setUploadingLogo(false);
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem');
      return;
    }
    setUploadingSignature(true);
    const url = await uploadFile(file, 'signatures');
    if (url) update('signature_image_url', url);
    setUploadingSignature(false);
  };

  const handleSave = () => save(form);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Documentos Institucionais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure o layout dos documentos PDF gerados pelo sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Identidade da Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Clínica (no documento)</Label>
                <Input
                  value={form.clinic_name || ''}
                  onChange={e => update('clinic_name', e.target.value)}
                  placeholder="Nome que aparecerá nos documentos"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-lg object-cover border" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <Button variant="outline" size="sm" disabled={uploadingLogo} asChild>
                      <label className="cursor-pointer">
                        {uploadingLogo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                        {uploadingLogo ? 'Enviando...' : 'Upload Logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </Button>
                    {form.logo_url && (
                      <Button variant="ghost" size="sm" className="text-xs ml-1" onClick={() => update('logo_url', null)}>
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsible */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-primary" />
                Responsável Técnico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Responsável</Label>
                  <Input
                    value={form.responsible_name || ''}
                    onChange={e => update('responsible_name', e.target.value)}
                    placeholder="Dr(a). Nome Completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CRM / Registro Profissional</Label>
                  <Input
                    value={form.responsible_crm || ''}
                    onChange={e => update('responsible_crm', e.target.value)}
                    placeholder="CRM/UF 00000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.show_crm} onCheckedChange={v => update('show_crm', v)} />
                <Label className="text-sm">Exibir CRM nos documentos</Label>
              </div>
            </CardContent>
          </Card>

          {/* Style */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Estilo Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={e => update('primary_color', e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input value={form.primary_color} onChange={e => update('primary_color', e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.secondary_color}
                      onChange={e => update('secondary_color', e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input value={form.secondary_color} onChange={e => update('secondary_color', e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Estilo do Cabeçalho</Label>
                <RadioGroup
                  value={form.header_style}
                  onValueChange={v => update('header_style', v)}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="simple" id="hs-simple" />
                    <Label htmlFor="hs-simple">Simples</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="stripe" id="hs-stripe" />
                    <Label htmlFor="hs-stripe">Faixa Colorida</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Footer & Signature */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-primary" />
                Rodapé e Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.show_footer} onCheckedChange={v => update('show_footer', v)} />
                <Label className="text-sm">Exibir rodapé nos documentos</Label>
              </div>
              {form.show_footer && (
                <div className="space-y-2">
                  <Label>Texto do Rodapé</Label>
                  <Textarea
                    value={form.footer_text || ''}
                    onChange={e => update('footer_text', e.target.value)}
                    placeholder="Texto que aparecerá no rodapé"
                    rows={2}
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-2">
                <Switch checked={form.show_digital_signature} onCheckedChange={v => update('show_digital_signature', v)} />
                <Label className="text-sm">Incluir assinatura digital</Label>
              </div>
              {form.show_digital_signature && (
                <div className="space-y-2">
                  <Label>Imagem da Assinatura</Label>
                  <div className="flex items-center gap-3">
                    {form.signature_image_url ? (
                      <img src={form.signature_image_url} alt="Assinatura" className="h-12 object-contain border rounded p-1" />
                    ) : (
                      <div className="h-12 w-32 rounded border-2 border-dashed flex items-center justify-center text-muted-foreground text-xs">
                        Sem assinatura
                      </div>
                    )}
                    <Button variant="outline" size="sm" disabled={uploadingSignature} asChild>
                      <label className="cursor-pointer">
                        {uploadingSignature ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                      </label>
                    </Button>
                    {form.signature_image_url && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => update('signature_image_url', null)}>
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" />
            Preview em Tempo Real
          </div>
          <div className="sticky top-6">
            <DocumentPreview form={form} />
          </div>
        </div>
      </div>
    </div>
  );
}
