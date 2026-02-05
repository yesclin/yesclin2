 // Tipos para o módulo de Estética / Harmonização Facial
 
 export type ProcedureType = 'toxin' | 'filler' | 'biostimulator';
 export type ViewType = 'frontal' | 'left_lateral' | 'right_lateral';
 export type SideType = 'left' | 'right' | 'center' | 'bilateral';
 export type ViewAngle = 'frontal' | 'left_profile' | 'right_profile' | 'left_45' | 'right_45';
 export type ConsentType = 'toxin' | 'filler' | 'biostimulator' | 'general';
export type MapType = 'general' | 'toxin';
export type ImageType = 'before' | 'after';

// Entidade pai: Mapa Facial
export interface FacialMap {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id?: string | null;
  professional_id?: string | null;
  map_type: MapType;
  general_notes?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
}
 
 export interface FacialMapApplication {
   id: string;
   clinic_id: string;
   patient_id: string;
   appointment_id?: string | null;
   professional_id?: string | null;
  facial_map_id?: string | null;
   procedure_type: ProcedureType;
   view_type: ViewType;
   position_x: number;
   position_y: number;
   muscle?: string | null;
   product_name: string;
   quantity: number;
   unit: string;
   side?: SideType | null;
   notes?: string | null;
   created_at: string;
   created_by?: string | null;
   updated_at: string;
 }
 
// Imagens vinculadas ao mapa facial
export interface FacialMapImage {
  id: string;
  clinic_id: string;
  facial_map_id: string;
  image_type: ImageType;
  image_url: string;
  image_date?: string | null;
  view_angle?: ViewAngle | null;
  notes?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
}

 export interface AestheticBeforeAfter {
   id: string;
   clinic_id: string;
   patient_id: string;
   appointment_id?: string | null;
   procedure_id?: string | null;
   title: string;
   description?: string | null;
   procedure_type?: string | null;
   before_image_url?: string | null;
   before_image_date?: string | null;
   after_image_url?: string | null;
   after_image_date?: string | null;
   view_angle: ViewAngle;
   consent_for_marketing: boolean;
   created_at: string;
   created_by?: string | null;
   updated_at: string;
 }
 
 export interface AestheticConsentRecord {
   id: string;
   clinic_id: string;
   patient_id: string;
   appointment_id?: string | null;
   consent_type: ConsentType;
   term_title: string;
   term_content: string;
   term_version: string;
   accepted_at: string;
   ip_address?: string | null;
   user_agent?: string | null;
   signature_data?: string | null;
   created_by?: string | null;
 }
 
 // Labels
export const MAP_TYPE_LABELS: Record<MapType, string> = {
  general: 'Geral',
  toxin: 'Toxina Botulínica',
};

export const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  before: 'Antes',
  after: 'Depois',
};

 export const PROCEDURE_TYPE_LABELS: Record<ProcedureType, string> = {
   toxin: 'Toxina Botulínica',
   filler: 'Preenchimento',
   biostimulator: 'Bioestimulador',
 };
 
 export const VIEW_TYPE_LABELS: Record<ViewType, string> = {
   frontal: 'Frontal',
   left_lateral: 'Lateral Esquerda',
   right_lateral: 'Lateral Direita',
 };
 
 export const SIDE_LABELS: Record<SideType, string> = {
   left: 'Esquerdo',
   right: 'Direito',
   center: 'Centro',
   bilateral: 'Bilateral',
 };
 
 export const VIEW_ANGLE_LABELS: Record<ViewAngle, string> = {
   frontal: 'Frontal',
   left_profile: 'Perfil Esquerdo',
   right_profile: 'Perfil Direito',
   left_45: '45° Esquerda',
   right_45: '45° Direita',
 };
 
 export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
   toxin: 'Toxina Botulínica',
   filler: 'Preenchimento Facial',
   biostimulator: 'Bioestimulador',
   general: 'Geral',
 };
 
 // Músculos faciais para toxina
 export const FACIAL_MUSCLES = [
   { id: 'frontalis', name: 'Frontal', region: 'Testa' },
   { id: 'procerus', name: 'Prócero', region: 'Glabela' },
   { id: 'corrugator', name: 'Corrugador do Supercílio', region: 'Glabela' },
   { id: 'orbicularis_oculi', name: 'Orbicular dos Olhos', region: 'Periorbital' },
   { id: 'nasalis', name: 'Nasal', region: 'Nariz' },
   { id: 'levator_labii', name: 'Elevador do Lábio Superior', region: 'Nariz/Boca' },
   { id: 'zygomaticus_major', name: 'Zigomático Maior', region: 'Bochecha' },
   { id: 'zygomaticus_minor', name: 'Zigomático Menor', region: 'Bochecha' },
   { id: 'orbicularis_oris', name: 'Orbicular da Boca', region: 'Perioral' },
   { id: 'depressor_anguli_oris', name: 'Depressor do Ângulo da Boca', region: 'Boca' },
   { id: 'mentalis', name: 'Mentoniano', region: 'Queixo' },
   { id: 'platysma', name: 'Platisma', region: 'Pescoço' },
   { id: 'masseter', name: 'Masseter', region: 'Mandíbula' },
 ];
 
 // Produtos comuns
 export const COMMON_PRODUCTS = {
   toxin: [
     'Botox',
     'Dysport',
     'Xeomin',
     'Jeuveau',
     'Daxxify',
   ],
   filler: [
     'Juvederm Voluma',
     'Juvederm Volift',
     'Juvederm Volbella',
     'Restylane',
     'Restylane Lyft',
     'Radiesse',
     'Belotero',
   ],
   biostimulator: [
     'Sculptra',
     'Radiesse',
     'Ellansé',
   ],
 };