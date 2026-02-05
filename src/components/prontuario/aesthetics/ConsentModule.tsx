 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Label } from "@/components/ui/label";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Skeleton } from "@/components/ui/skeleton";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
 } from "@/components/ui/accordion";
 import { 
   FileCheck, 
   Plus, 
   CheckCircle2,
   Clock,
   FileText,
   Download,
   Pen,
 } from "lucide-react";
 import { format, parseISO } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { useAestheticConsent, DEFAULT_CONSENT_TEMPLATES } from "@/hooks/aesthetics";
 import type { ConsentType } from "./types";
 import { CONSENT_TYPE_LABELS } from "./types";
 
 interface ConsentModuleProps {
   patientId: string;
   appointmentId?: string | null;
   canEdit?: boolean;
 }
 
 export function ConsentModule({
   patientId,
   appointmentId,
   canEdit = false,
 }: ConsentModuleProps) {
   const [createDialogOpen, setCreateDialogOpen] = useState(false);
   const [selectedType, setSelectedType] = useState<ConsentType | null>(null);
   const [viewDialogOpen, setViewDialogOpen] = useState(false);
   const [selectedConsent, setSelectedConsent] = useState<any>(null);
   const [agreed, setAgreed] = useState(false);
 
   const { 
     consents, 
     isLoading, 
     hasConsentForType,
     getLatestConsentForType,
     createConsent,
     isCreating,
   } = useAestheticConsent(patientId);
 
   const handleCreateConsent = async () => {
     if (!selectedType || !agreed) return;
 
     await createConsent({
       consent_type: selectedType,
       appointment_id: appointmentId || undefined,
     });
 
     setCreateDialogOpen(false);
     setSelectedType(null);
     setAgreed(false);
   };
 
   const openConsentDialog = (type: ConsentType) => {
     setSelectedType(type);
     setAgreed(false);
     setCreateDialogOpen(true);
   };
 
   const viewConsent = (consent: any) => {
     setSelectedConsent(consent);
     setViewDialogOpen(true);
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardHeader>
           <Skeleton className="h-6 w-48" />
         </CardHeader>
         <CardContent>
           <div className="space-y-3">
             <Skeleton className="h-20" />
             <Skeleton className="h-20" />
             <Skeleton className="h-20" />
           </div>
         </CardContent>
       </Card>
     );
   }
 
   const consentTypes: ConsentType[] = ['toxin', 'filler', 'biostimulator', 'general'];
 
   return (
     <div className="space-y-4">
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="flex items-center gap-2">
             <FileCheck className="h-5 w-5 text-primary" />
             Termos de Consentimento
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {consentTypes.map((type) => {
               const hasConsent = hasConsentForType(type);
               const latestConsent = getLatestConsentForType(type);
 
               return (
                 <Card 
                   key={type} 
                   className={`p-4 ${hasConsent ? 'border-green-200 bg-green-50/50' : ''}`}
                 >
                   <div className="flex items-start justify-between">
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         {hasConsent ? (
                           <CheckCircle2 className="h-5 w-5 text-green-600" />
                         ) : (
                           <Clock className="h-5 w-5 text-muted-foreground" />
                         )}
                         <h4 className="font-medium">
                           {CONSENT_TYPE_LABELS[type]}
                         </h4>
                       </div>
                       {hasConsent && latestConsent ? (
                         <p className="text-xs text-muted-foreground">
                           Aceito em {format(parseISO(latestConsent.accepted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                         </p>
                       ) : (
                         <p className="text-xs text-muted-foreground">
                           Pendente de aceite
                         </p>
                       )}
                     </div>
                     <div className="flex gap-2">
                       {hasConsent && latestConsent && (
                         <Button 
                           variant="ghost" 
                           size="sm"
                           onClick={() => viewConsent(latestConsent)}
                         >
                           <FileText className="h-4 w-4" />
                         </Button>
                       )}
                       {canEdit && !hasConsent && (
                         <Button 
                           size="sm"
                           onClick={() => openConsentDialog(type)}
                         >
                           <Plus className="h-4 w-4 mr-1" />
                           Coletar
                         </Button>
                       )}
                     </div>
                   </div>
                 </Card>
               );
             })}
           </div>
 
           {/* History */}
           {consents.length > 0 && (
             <div className="mt-6">
               <h4 className="font-medium mb-3">Histórico de Consentimentos</h4>
               <ScrollArea className="h-[200px]">
                 <div className="space-y-2">
                   {consents.map((consent) => (
                     <div 
                       key={consent.id}
                       className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                       onClick={() => viewConsent(consent)}
                     >
                       <div className="flex items-center gap-3">
                         <CheckCircle2 className="h-4 w-4 text-green-600" />
                         <div>
                           <p className="font-medium text-sm">{consent.term_title}</p>
                           <p className="text-xs text-muted-foreground">
                             Versão {consent.term_version} • 
                             {format(parseISO(consent.accepted_at), " dd/MM/yyyy HH:mm", { locale: ptBR })}
                           </p>
                         </div>
                       </div>
                       <Badge variant="secondary" className="text-xs">
                         {CONSENT_TYPE_LABELS[consent.consent_type as ConsentType]}
                       </Badge>
                     </div>
                   ))}
                 </div>
               </ScrollArea>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Create Consent Dialog */}
       <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
         <DialogContent className="max-w-2xl max-h-[90vh]">
           {selectedType && (
             <>
               <DialogHeader>
                 <DialogTitle>
                   {DEFAULT_CONSENT_TEMPLATES[selectedType].title}
                 </DialogTitle>
               </DialogHeader>
 
               <ScrollArea className="h-[400px] pr-4">
                 <div className="prose prose-sm max-w-none">
                   <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                     {DEFAULT_CONSENT_TEMPLATES[selectedType].content}
                   </pre>
                 </div>
               </ScrollArea>
 
               <div className="border-t pt-4 mt-4">
                 <div className="flex items-start space-x-3">
                   <Checkbox
                     id="agree"
                     checked={agreed}
                     onCheckedChange={(checked) => setAgreed(!!checked)}
                   />
                   <Label htmlFor="agree" className="text-sm leading-relaxed">
                     Eu, paciente, declaro que li e compreendi todas as informações 
                     acima e concordo com os termos apresentados.
                   </Label>
                 </div>
               </div>
 
               <DialogFooter>
                 <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                   Cancelar
                 </Button>
                 <Button 
                   onClick={handleCreateConsent} 
                   disabled={!agreed || isCreating}
                 >
                   {isCreating ? 'Registrando...' : 'Aceitar Termo'}
                 </Button>
               </DialogFooter>
             </>
           )}
         </DialogContent>
       </Dialog>
 
       {/* View Consent Dialog */}
       <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
         <DialogContent className="max-w-2xl max-h-[90vh]">
           {selectedConsent && (
             <>
               <DialogHeader>
                 <DialogTitle>{selectedConsent.term_title}</DialogTitle>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Badge variant="outline">Versão {selectedConsent.term_version}</Badge>
                   <span>
                     Aceito em {format(parseISO(selectedConsent.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                   </span>
                 </div>
               </DialogHeader>
 
               <ScrollArea className="h-[400px] pr-4">
                 <div className="prose prose-sm max-w-none">
                   <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                     {selectedConsent.term_content}
                   </pre>
                 </div>
               </ScrollArea>
 
               {selectedConsent.signature_data && (
                 <div className="border-t pt-4 mt-4">
                   <Label>Assinatura Digital</Label>
                   <div className="border rounded-lg p-4 mt-2 bg-muted/30">
                     <img 
                       src={selectedConsent.signature_data} 
                       alt="Assinatura" 
                       className="max-h-24"
                     />
                   </div>
                 </div>
               )}
 
               <DialogFooter>
                 <Button variant="outline" size="sm">
                   <Download className="h-4 w-4 mr-1" />
                   Exportar PDF
                 </Button>
                 <Button onClick={() => setViewDialogOpen(false)}>
                   Fechar
                 </Button>
               </DialogFooter>
             </>
           )}
         </DialogContent>
       </Dialog>
     </div>
   );
 }