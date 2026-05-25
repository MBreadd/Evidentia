import React, { useState } from 'react';
import { Building2, Trophy, Clock, ChevronDown } from 'lucide-react';

export default function ChallengeCard({ challenge, onDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Extraemos las propiedades, soportando la base de datos de Supabase y datos legacy
  const { 
    title, 
    description, 
    reward, 
    deadline, 
    technical_requirements,
    difficulty 
  } = challenge;
  const orgName = challenge.organization?.full_name ?? 'Organización';
  // Obtenemos el nombre de la empresa a través de la relación de Supabase
  const companyName = challenge.profiles?.full_name || challenge.company || 'Empresa Anónima';

  // Convertimos el campo de texto de Supabase en un array de tags, separando por comas.
  // Si usas el antiguo 'tracks' o 'stack' del data.js, hace fallback automático.
// Dentro de ChallengeCard.jsx, reemplaza la lógica de mapeo de tags por esta:
  const rawTags = challenge.tech_stack 
    ? challenge.tech_stack.split(',').map(t => t.trim()) 
    : [];
    
  const tags = rawTags.filter(Boolean);

  return (
    <article 
      className="bg-white dark:bg-gray-950 p-5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer flex flex-col h-full shadow-none"
      onClick={onDetails}
    >
      {/* Encabezado: Empresa, Dificultad y Título */}
      <header className="flex flex-col gap-1 mb-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
          <Building2 size={12} />
          <span className="truncate">{companyName}</span>
          {difficulty && (
            <>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span>{difficulty}</span>
            </>
          )}
        </div>
        <h3 className="text-base font-black text-gray-950 dark:text-white leading-snug line-clamp-2">
          {title}
        </h3>
      </header>

      {/* Recompensa - Estilo Corporativo Fijo */}
      {reward && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 flex items-start gap-2">
          <Trophy size={14} className="text-gray-500 dark:text-gray-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{reward}</span>
        </div>
      )}

      {/* Descripción (Fija a 2 líneas, sin botón de expandir) */}
      <div className="mb-4 flex-grow">
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Tags Tecnológicos (Fondo gris, borde fino, rounded-full) */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 3).map((tech, idx) => (
            <span 
              key={idx} 
              className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-[11px] font-medium text-gray-700 dark:text-gray-300"
            >
              {tech}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-500">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Deadline y Botón de Acción */}
      <footer className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
          <Clock size={12} />
          {/* Si viene de Supabase con formato YYYY-MM-DD, lo formateamos bonito */}
          <span>{deadline ? new Date(deadline).toLocaleDateString() : 'Siempre Abierto'}</span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Evita doble render al hacer click en el botón
            onDetails();
          }}
          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
        >
          Ver detalles
        </button>
      </footer>
    </article>
  );
}