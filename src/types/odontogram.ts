/**
 * Odontogram Types - Digital Dental Chart
 */

export type ToothStatus = 
  | 'healthy'
  | 'caries'
  | 'restoration'
  | 'extraction'
  | 'missing'
  | 'implant'
  | 'crown'
  | 'endodontic'
  | 'fracture'
  | 'decay'
  | 'sealant'
  | 'prosthesis'
  | 'bridge'
  | 'veneer'
  | 'other';

export interface Odontogram {
  id: string;
  clinic_id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface OdontogramTooth {
  id: string;
  odontogram_id: string;
  tooth_code: string;
  status: ToothStatus;
  notes: string | null;
  updated_at: string;
}

export interface OdontogramRecord {
  id: string;
  clinic_id: string;
  odontogram_tooth_id: string;
  appointment_id: string | null;
  professional_id: string;
  procedure_id: string | null;
  status_applied: ToothStatus;
  surface: string | null;
  notes: string | null;
  created_at: string;
  procedure?: {
    name: string;
  };
  professional?: {
    full_name: string;
  };
}

// Status labels in Portuguese
export const TOOTH_STATUS_LABELS: Record<ToothStatus, string> = {
  healthy: 'Saudável',
  caries: 'Cárie',
  restoration: 'Restauração',
  extraction: 'Extração Indicada',
  missing: 'Ausente',
  implant: 'Implante',
  crown: 'Coroa',
  endodontic: 'Endodontia',
  fracture: 'Fratura',
  decay: 'Lesão Cariosa',
  sealant: 'Selante',
  prosthesis: 'Prótese',
  bridge: 'Ponte',
  veneer: 'Faceta',
  other: 'Outro',
};

// Status colors for visualization
export const TOOTH_STATUS_COLORS: Record<ToothStatus, string> = {
  healthy: 'hsl(var(--chart-2))',      // Green
  caries: 'hsl(var(--destructive))',   // Red
  restoration: 'hsl(var(--chart-1))',  // Blue
  extraction: 'hsl(var(--chart-5))',   // Orange
  missing: 'hsl(var(--muted))',        // Gray
  implant: 'hsl(var(--chart-4))',      // Purple
  crown: 'hsl(var(--chart-3))',        // Yellow
  endodontic: 'hsl(var(--chart-1))',   // Blue variant
  fracture: 'hsl(var(--destructive))', // Red
  decay: 'hsl(var(--warning))',        // Amber
  sealant: 'hsl(var(--chart-2))',      // Green variant
  prosthesis: 'hsl(var(--chart-4))',   // Purple
  bridge: 'hsl(var(--chart-4))',       // Purple
  veneer: 'hsl(var(--chart-3))',       // Yellow
  other: 'hsl(var(--muted-foreground))',
};

// FDI tooth notation - Permanent teeth
export const PERMANENT_TEETH = {
  upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
  upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
  lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38'],
  lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
};

// FDI tooth notation - Deciduous teeth (primary/baby)
export const DECIDUOUS_TEETH = {
  upperRight: ['55', '54', '53', '52', '51'],
  upperLeft: ['61', '62', '63', '64', '65'],
  lowerLeft: ['71', '72', '73', '74', '75'],
  lowerRight: ['85', '84', '83', '82', '81'],
};

// Tooth surfaces
export const TOOTH_SURFACES = [
  { code: 'M', label: 'Mesial' },
  { code: 'O', label: 'Oclusal' },
  { code: 'D', label: 'Distal' },
  { code: 'V', label: 'Vestibular' },
  { code: 'L', label: 'Lingual' },
];

// Tooth names mapping
export const TOOTH_NAMES: Record<string, string> = {
  // Permanent - Upper Right (1)
  '18': '3º Molar Superior Direito',
  '17': '2º Molar Superior Direito',
  '16': '1º Molar Superior Direito',
  '15': '2º Pré-Molar Superior Direito',
  '14': '1º Pré-Molar Superior Direito',
  '13': 'Canino Superior Direito',
  '12': 'Incisivo Lateral Superior Direito',
  '11': 'Incisivo Central Superior Direito',
  // Permanent - Upper Left (2)
  '21': 'Incisivo Central Superior Esquerdo',
  '22': 'Incisivo Lateral Superior Esquerdo',
  '23': 'Canino Superior Esquerdo',
  '24': '1º Pré-Molar Superior Esquerdo',
  '25': '2º Pré-Molar Superior Esquerdo',
  '26': '1º Molar Superior Esquerdo',
  '27': '2º Molar Superior Esquerdo',
  '28': '3º Molar Superior Esquerdo',
  // Permanent - Lower Left (3)
  '31': 'Incisivo Central Inferior Esquerdo',
  '32': 'Incisivo Lateral Inferior Esquerdo',
  '33': 'Canino Inferior Esquerdo',
  '34': '1º Pré-Molar Inferior Esquerdo',
  '35': '2º Pré-Molar Inferior Esquerdo',
  '36': '1º Molar Inferior Esquerdo',
  '37': '2º Molar Inferior Esquerdo',
  '38': '3º Molar Inferior Esquerdo',
  // Permanent - Lower Right (4)
  '41': 'Incisivo Central Inferior Direito',
  '42': 'Incisivo Lateral Inferior Direito',
  '43': 'Canino Inferior Direito',
  '44': '1º Pré-Molar Inferior Direito',
  '45': '2º Pré-Molar Inferior Direito',
  '46': '1º Molar Inferior Direito',
  '47': '2º Molar Inferior Direito',
  '48': '3º Molar Inferior Direito',
};
