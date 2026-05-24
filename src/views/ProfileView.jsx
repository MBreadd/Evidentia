import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Edit3, Globe, Building2, Code2, Moon, Sun, 
  Save, Briefcase, Zap, Trophy, Star, ShieldCheck, Mail, MapPin, Link as LinkIcon
} from 'lucide-react';
import { SKILLS_CATALOG, SKILL_LEVELS } from '../constants/data';
import githubLogo from '../assets/github-logo.png';
import linkedinLogo from '../assets/linkedin-logo.png';
import { useTheme } from '../useTheme';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

// ==========================================
// COMPONENTE: RADAR DE HABILIDADES (GLASSMORPHISM)
// ==========================================
const LEVEL_MAP = { 'Básico': 1, 'Intermedio': 2, 'Avanzado': 3 };

function SkillsRadar({ skills = [] }) {
  const chartData = useMemo(() => {
    return skills.map(skill => ({
      subject: skill.name,
      levelValue: LEVEL_MAP[skill.level] || 1,
      fullMark: 3
    }));
  }, [skills]);

  return (
    <div className="w-full h-80 mt-4 relative">
      {/* Glow effect detrás del radar */}
      <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 blur-3xl rounded-full" />
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="currentColor" className="text-gray-300 dark:text-gray-700" strokeDasharray="3 3" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 600 }} 
            className="text-gray-600 dark:text-gray-300"
          />
          <PolarRadiusAxis angle={30} domain={[0, 3]} tick={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(17, 24, 39, 0.8)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }} 
          />
          <Radar
            name="Nivel"
            dataKey="levelValue"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="#3b82f6"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// VISTA 1: VER PERFIL (GLASSMORPHISM)
// ==========================================
export function ProfileView({ user, setCurrentView }) {
  const { isDark, toggleTheme } = useTheme();
  if (!user) return null;

  const isStudent = user.role === 'student';
  const isCompany = user.role === 'company' || user.role === 'organization';

  // Clases base para tarjetas de cristal
  const glassCard = "relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-2xl p-6 overflow-hidden";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors relative overflow-hidden text-gray-900 dark:text-gray-100">
      
      {/* Background Orbs para dar efecto al cristal */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-400/20 dark:bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Navigation Glass */}
      <nav className="sticky top-0 z-50 border-b border-white/20 dark:border-gray-800/40 backdrop-blur-xl bg-white/40 dark:bg-gray-950/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-medium text-sm group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Volver
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl transition border border-white/40 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        
        {/* Profile Header */}
        <div className={`${glassCard} mb-8 !p-0`}>
          <div className="h-40 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 relative">
            {/* Banner decorativo */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,#3b82f6_1px,transparent_0)] [background-size:20px_20px]" />
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row gap-8">
              {/* Avatar Flotante */}
              <div className="-mt-20 shrink-0">
                <div className="w-36 h-36 rounded-2xl border-4 border-white/80 dark:border-gray-900/80 backdrop-blur-md overflow-hidden bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center relative group">
                  {(user.avatar_url || user.logo_url) ? (
                    <img src={user.avatar_url || user.logo_url} alt={user.full_name || user.name} className="w-full h-full object-cover" />
                  ) : (
                    isStudent ? <Code2 size={48} className="text-gray-300 dark:text-gray-600" /> : <Building2 size={48} className="text-gray-300 dark:text-gray-600" />
                  )}
                </div>
              </div>

              {/* Información Principal */}
              <div className="flex-1 pt-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-black tracking-tight">
                      {user.full_name || user.name || 'Usuario Aura'}
                    </h1>
                    {isCompany && user.verified && (
                      <ShieldCheck className="text-blue-500 w-6 h-6" title="Organización Verificada" />
                    )}
                  </div>
                  
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    {isStudent ? (user.career || 'Estudiante') : (user.industry || 'Organización')}
                    {isStudent && user.university && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        <span className="text-sm">{user.university}</span>
                      </>
                    )}
                  </p>
                  
                  {isCompany && user.website && (
                    <a href={user.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      <LinkIcon size={14} /> {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>

                <button 
                  onClick={() => setCurrentView('edit_profile')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl shrink-0"
                >
                  <Edit3 size={16} /> Editar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ================= MAIN COLUMN ================= */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Acerca de / Bio */}
            {(user.bio || user.description) && (
              <div className={glassCard}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Star size={20} className="text-amber-500" /> 
                  {isStudent ? 'Sobre mí' : 'Acerca de la organización'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm/7">
                  {user.bio || user.description}
                </p>
              </div>
            )}

            {/* Radar de Habilidades (Solo Estudiantes) */}
            {isStudent && user.skills && user.skills.length > 0 && (
              <div className={glassCard}>
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Code2 size={20} className="text-blue-500" />
                  Stack Tecnológico
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Competencias mapeadas según desempeño en retos.</p>
                <SkillsRadar skills={user.skills} />
                
                {/* Etiquetas de skills estilo glass */}
                <div className="flex flex-wrap gap-2 mt-6">
                  {user.skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Especialidades (Solo Estudiantes) */}
            {isStudent && user.preferred_tracks && user.preferred_tracks.length > 0 && (
              <div className={glassCard}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-indigo-500" /> Tracks de Interés
                </h2>
                <div className="flex flex-wrap gap-3">
                  {user.preferred_tracks.map((track, idx) => (
                    <div key={idx} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                      {track}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ================= SIDEBAR COLUMN ================= */}
          <div className="space-y-8">
            
            {/* Gamificación & Estadísticas */}
            <div className={glassCard}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Métricas Aura</h3>
              
              {isStudent ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-white/50 dark:border-gray-800/50">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">Reputación</p>
                      <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        {user.reputation_score || 0}
                      </p>
                    </div>
                    <Trophy className="w-10 h-10 text-blue-500/20" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">Nivel</p>
                      <p className="text-2xl font-bold">{user.level || 1}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">XP Total</p>
                      <p className="text-2xl font-bold">{user.xp || 0}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Vista Empresa */}
                  <div className="p-4 rounded-xl bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-2">Retos Publicados</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black">12</span>
                      <span className="text-sm font-medium text-green-500 mb-1">+2 este mes</span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-2">Evaluaciones Realizadas</p>
                    <p className="text-3xl font-black">148</p>
                  </div>
                </div>
              )}
            </div>

            {/* Enlaces y Redes */}
            {isStudent && (user.github_url || user.linkedin_url || user.portfolio_url) && (
              <div className={glassCard}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Enlaces Externos</h3>
                <div className="space-y-3">
                  {user.github_url && (
                    <a href={user.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                      <img src={githubLogo} alt="GitHub" className="w-6 h-6" />
                      <span className="text-sm font-semibold">GitHub</span>
                    </a>
                  )}
                  {user.linkedin_url && (
                    <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                      <img src={linkedinLogo} alt="LinkedIn" className="w-6 h-6" />
                      <span className="text-sm font-semibold">LinkedIn</span>
                    </a>
                  )}
                  {user.portfolio_url && (
                    <a href={user.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                      <Globe size={24} className="text-indigo-500" />
                      <span className="text-sm font-semibold">Portafolio</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VISTA 2: EDITAR PERFIL (GLASSMORPHISM)
// ==========================================
export function EditProfileView({ user, setUser, setCurrentView }) {
  const { isDark, toggleTheme } = useTheme();
  if (!user) return null;

  const isStudent = user.role === 'student';
  const glassInput = "w-full px-4 py-3 border border-gray-200 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all";
  const glassCard = "bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-800/60 shadow-sm rounded-2xl p-6";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors pb-12 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <nav className="sticky top-0 z-50 border-b border-white/20 dark:border-gray-800/40 backdrop-blur-xl bg-white/40 dark:bg-gray-950/40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Configuración</h1>
          <button onClick={toggleTheme} className="p-2 rounded-xl transition border border-white/40 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800">
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 relative z-10 space-y-8">
        
        {/* === FORMULARIO ESTUDIANTE === */}
        {isStudent ? (
          <>
            <div className={glassCard}>
              <h2 className="text-lg font-bold mb-6">Información Personal</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nombre Completo</label>
                    <input type="text" value={user.full_name || ''} onChange={(e) => setUser({...user, full_name: e.target.value})} className={glassInput} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Carrera</label>
                    <input type="text" value={user.career || ''} onChange={(e) => setUser({...user, career: e.target.value})} className={glassInput} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Universidad</label>
                  <input type="text" value={user.university || ''} onChange={(e) => setUser({...user, university: e.target.value})} className={glassInput} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Biografía</label>
                  <textarea value={user.bio || ''} onChange={(e) => setUser({...user, bio: e.target.value})} rows="4" className={`${glassInput} resize-none`} />
                </div>
              </div>
            </div>

            <div className={glassCard}>
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Code2 size={20} className="text-blue-500" /> Habilidades (Radar)
              </h2>
              <div className="flex gap-3 mb-4">
                <select id="newSkillName" className={`flex-1 ${glassInput}`}>
                  <option value="">Selecciona tecnología...</option>
                  {SKILLS_CATALOG.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select id="newSkillLevel" className={glassInput}>
                  {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button
                  onClick={() => {
                    const name = document.getElementById('newSkillName').value;
                    const level = document.getElementById('newSkillLevel').value;
                    if (name && level) {
                      setUser({...user, skills: [...(user.skills || []), {name, level}]});
                    }
                  }}
                  className="px-6 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
                >
                  Añadir
                </button>
              </div>
              
              {/* Tags de skills para eliminar */}
              <div className="flex flex-wrap gap-2">
                {(user.skills || []).map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">{skill.name}</span>
                    <span className="text-xs text-gray-500">({skill.level})</span>
                    <button onClick={() => setUser({...user, skills: user.skills.filter((_, i) => i !== idx)})} className="ml-1 text-red-500 hover:text-red-700">✕</button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={glassCard}>
              <h2 className="text-lg font-bold mb-6">Enlaces Externos</h2>
              <div className="space-y-4">
                <input type="url" placeholder="URL de GitHub" value={user.github_url || ''} onChange={(e) => setUser({...user, github_url: e.target.value})} className={glassInput} />
                <input type="url" placeholder="URL de LinkedIn" value={user.linkedin_url || ''} onChange={(e) => setUser({...user, linkedin_url: e.target.value})} className={glassInput} />
                <input type="url" placeholder="URL de Portafolio" value={user.portfolio_url || ''} onChange={(e) => setUser({...user, portfolio_url: e.target.value})} className={glassInput} />
              </div>
            </div>
          </>
        ) : (
          /* === FORMULARIO EMPRESA === */
          <>
            <div className={glassCard}>
              <h2 className="text-lg font-bold mb-6">Perfil de la Organización</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nombre de Empresa</label>
                    <input type="text" value={user.name || user.company_name || ''} onChange={(e) => setUser({...user, name: e.target.value})} className={glassInput} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Industria</label>
                    <input type="text" value={user.industry || ''} onChange={(e) => setUser({...user, industry: e.target.value})} className={glassInput} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">URL del Logo</label>
                  <input type="url" value={user.logo_url || ''} onChange={(e) => setUser({...user, logo_url: e.target.value})} className={glassInput} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Sitio Web</label>
                  <input type="url" value={user.website || ''} onChange={(e) => setUser({...user, website: e.target.value})} className={glassInput} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Descripción General</label>
                  <textarea value={user.description || user.bio || ''} onChange={(e) => setUser({...user, description: e.target.value})} rows="5" className={`${glassInput} resize-none`} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Botones de Acción Globales */}
        <div className="flex justify-end gap-3 pt-4">
          <button 
            onClick={() => setCurrentView('profile')}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all backdrop-blur-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={() => setCurrentView('profile')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-105 transition-transform shadow-lg"
          >
            <Save size={16} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}