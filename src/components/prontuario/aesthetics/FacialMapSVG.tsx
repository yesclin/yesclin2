 import { cn } from "@/lib/utils";
 import type { ViewType, FacialMapApplication, ProcedureType } from "./types";
 
 interface FacialMapSVGProps {
   viewType: ViewType;
   applications: FacialMapApplication[];
   selectedPointId?: string | null;
   onPointClick?: (point: FacialMapApplication) => void;
   onMapClick?: (x: number, y: number) => void;
   isEditing?: boolean;
   className?: string;
 }
 
 const PROCEDURE_COLORS: Record<ProcedureType, string> = {
   toxin: '#ef4444', // red
   filler: '#3b82f6', // blue
   biostimulator: '#22c55e', // green
 };
 
 export function FacialMapSVG({
   viewType,
   applications,
   selectedPointId,
   onPointClick,
   onMapClick,
   isEditing = false,
   className,
 }: FacialMapSVGProps) {
   const filteredApplications = applications.filter(a => a.view_type === viewType);
 
   const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
     if (!isEditing || !onMapClick) return;
     
     const svg = e.currentTarget;
     const rect = svg.getBoundingClientRect();
     const x = ((e.clientX - rect.left) / rect.width) * 100;
     const y = ((e.clientY - rect.top) / rect.height) * 100;
     
     onMapClick(x, y);
   };
 
   return (
     <svg
       viewBox="0 0 300 400"
       className={cn(
         "w-full h-auto max-h-[500px] transition-all",
         isEditing && "cursor-crosshair",
         className
       )}
       onClick={handleSvgClick}
     >
       {/* Background */}
       <rect x="0" y="0" width="300" height="400" fill="hsl(var(--muted))" rx="8" />
       
       {/* Face outline - Frontal */}
       {viewType === 'frontal' && (
         <g className="face-frontal">
           {/* Head shape */}
           <ellipse cx="150" cy="180" rx="100" ry="130" 
             fill="hsl(var(--background))" 
             stroke="hsl(var(--border))" 
             strokeWidth="2" 
           />
           
           {/* Hair area */}
           <path 
             d="M 60 130 Q 80 50 150 40 Q 220 50 240 130" 
             fill="none" 
             stroke="hsl(var(--muted-foreground))" 
             strokeWidth="1.5"
             strokeDasharray="4 2"
           />
           
           {/* Forehead line */}
           <line x1="80" y1="100" x2="220" y2="100" 
             stroke="hsl(var(--border))" 
             strokeWidth="0.5" 
             strokeDasharray="2 2" 
           />
           <text x="150" y="85" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
             Testa
           </text>
           
           {/* Eyebrows */}
           <path d="M 90 130 Q 115 120 140 130" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" />
           <path d="M 160 130 Q 185 120 210 130" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" />
           
           {/* Glabela area */}
           <text x="150" y="125" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
             Glabela
           </text>
           
           {/* Eyes */}
           <ellipse cx="115" cy="150" rx="20" ry="10" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
           <ellipse cx="185" cy="150" rx="20" ry="10" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
           <circle cx="115" cy="150" r="5" fill="hsl(var(--foreground))" />
           <circle cx="185" cy="150" r="5" fill="hsl(var(--foreground))" />
           
           {/* Crow's feet area */}
           <text x="60" y="155" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
             Pés de galinha
           </text>
           <text x="240" y="155" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
             Pés de galinha
           </text>
           
           {/* Nose */}
           <path d="M 150 145 L 150 195 M 140 195 Q 150 205 160 195" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="1.5" 
           />
           
           {/* Nasolabial folds */}
           <path d="M 130 190 Q 125 215 120 235" 
             fill="none" 
             stroke="hsl(var(--muted-foreground))" 
             strokeWidth="0.5" 
             strokeDasharray="2 2"
           />
           <path d="M 170 190 Q 175 215 180 235" 
             fill="none" 
             stroke="hsl(var(--muted-foreground))" 
             strokeWidth="0.5" 
             strokeDasharray="2 2"
           />
           
           {/* Cheeks */}
           <text x="85" y="200" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
             Malar
           </text>
           <text x="215" y="200" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
             Malar
           </text>
           
           {/* Mouth */}
           <path d="M 120 240 Q 150 255 180 240" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="2" 
           />
           <line x1="120" y1="240" x2="180" y2="240" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="1" 
           />
           
           {/* Marionette lines */}
           <text x="105" y="265" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
             Marionete
           </text>
           <text x="195" y="265" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
             Marionete
           </text>
           
           {/* Chin */}
           <text x="150" y="285" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
             Mento
           </text>
           
           {/* Jaw line */}
           <text x="70" y="250" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
             Masseter
           </text>
           <text x="230" y="250" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
             Masseter
           </text>
           
           {/* Neck area */}
           <rect x="120" y="300" width="60" height="50" 
             fill="none" 
             stroke="hsl(var(--border))" 
             strokeWidth="1" 
             strokeDasharray="3 3"
           />
           <text x="150" y="330" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
             Pescoço
           </text>
         </g>
       )}
       
       {/* Face outline - Left Lateral */}
       {viewType === 'left_lateral' && (
         <g className="face-left-lateral">
           <ellipse cx="170" cy="180" rx="80" ry="130" 
             fill="hsl(var(--background))" 
             stroke="hsl(var(--border))" 
             strokeWidth="2" 
           />
           <path d="M 150 150 Q 100 180 150 200" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="1.5" 
           />
           <ellipse cx="130" cy="150" rx="15" ry="8" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
           <text x="150" y="85" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
             Vista Lateral Esquerda
           </text>
         </g>
       )}
       
       {/* Face outline - Right Lateral */}
       {viewType === 'right_lateral' && (
         <g className="face-right-lateral">
           <ellipse cx="130" cy="180" rx="80" ry="130" 
             fill="hsl(var(--background))" 
             stroke="hsl(var(--border))" 
             strokeWidth="2" 
           />
           <path d="M 150 150 Q 200 180 150 200" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="1.5" 
           />
           <ellipse cx="170" cy="150" rx="15" ry="8" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
           <text x="150" y="85" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
             Vista Lateral Direita
           </text>
         </g>
       )}
       
       {/* Application Points */}
       {filteredApplications.map((app) => {
         const x = (app.position_x / 100) * 300;
         const y = (app.position_y / 100) * 400;
         const isSelected = selectedPointId === app.id;
         const color = PROCEDURE_COLORS[app.procedure_type];
         
         return (
           <g
             key={app.id}
             className="cursor-pointer transition-transform hover:scale-110"
             onClick={(e) => {
               e.stopPropagation();
               onPointClick?.(app);
             }}
           >
             {/* Point circle */}
             <circle
               cx={x}
               cy={y}
               r={isSelected ? 10 : 8}
               fill={color}
               stroke={isSelected ? "hsl(var(--foreground))" : "white"}
               strokeWidth={isSelected ? 3 : 2}
               className="drop-shadow-md"
             />
             
             {/* Quantity label */}
             <text
               x={x}
               y={y + 4}
               textAnchor="middle"
               fontSize="8"
               fontWeight="bold"
               fill="white"
             >
               {app.quantity}
             </text>
           </g>
         );
       })}
       
       {/* Legend */}
       <g transform="translate(10, 360)">
         <rect x="0" y="0" width="280" height="35" rx="4" fill="hsl(var(--card))" fillOpacity="0.9" />
         
         <circle cx="20" cy="18" r="6" fill={PROCEDURE_COLORS.toxin} />
         <text x="32" y="22" fontSize="9" fill="hsl(var(--foreground))">Toxina</text>
         
         <circle cx="100" cy="18" r="6" fill={PROCEDURE_COLORS.filler} />
         <text x="112" y="22" fontSize="9" fill="hsl(var(--foreground))">Preenchimento</text>
         
         <circle cx="210" cy="18" r="6" fill={PROCEDURE_COLORS.biostimulator} />
         <text x="222" y="22" fontSize="9" fill="hsl(var(--foreground))">Bioestimulador</text>
       </g>
     </svg>
   );
 }