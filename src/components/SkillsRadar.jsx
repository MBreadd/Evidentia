import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

// Mapa de conversión de niveles a valores numéricos
const LEVEL_MAP = {
  'Básico': 1,
  'Intermedio': 2,
  'Avanzado': 3,
};

export default function SkillsRadar({ skills = [] }) {
  // Memorizamos la transformación de datos para evitar re-renders innecesarios
  const chartData = useMemo(() => {
    return skills.map(skill => ({
      subject: skill.name,
      // Fallback a 1 por seguridad si viene un nivel no mapeado
      levelValue: LEVEL_MAP[skill.level] || 1, 
      fullMark: 3
    }));
  }, [skills]);

  if (!skills || skills.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-gray-200 dark:border-gray-800 rounded-md bg-white/50 dark:bg-gray-900/50">
        <p className="text-gray-500 dark:text-gray-400">No hay habilidades registradas.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 p-4 border border-gray-200 dark:border-gray-800 rounded-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm shadow-sm transition-colors duration-300">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          {/* Líneas del radar (gris claro) */}
          <PolarGrid stroke="#e5e7eb" />
          
          {/* Ejes con los nombres de las habilidades */}
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }} 
          />
          
          {/* Eje de radio oculto para mantener el diseño limpio, limitando el máximo a 3 */}
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 3]} 
            tick={false} 
            axisLine={false} 
          />
          
          {/* Área del Radar (Tonos Azules) */}
          <Radar
            name="Habilidades"
            dataKey="levelValue"
            stroke="#3b82f6" // blue-500
            fill="#3b82f6"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}