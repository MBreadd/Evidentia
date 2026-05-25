import React, { useState, useEffect } from 'react';
import { UserRound, Building2, Camera, Upload, Globe } from 'lucide-react';
import { TRACKS } from '../constants/data';
import { supabase, appConfig } from '../supabaseClient';

import linkedinIcon from '../assets/linkedin-logo.png';
import githubIcon from '../assets/github-logo.png';

// ==========================================
// VISTA 1: SELECCIÓN DE ROL
// ==========================================
export function OnboardingRoleView({ setOnboardRole, setCurrentView }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 bg-gray-50/50 dark:bg-gray-950">
      <button 
        type="button" 
        onClick={() => setCurrentView('landing')}
        className="text-sm text-gray-500 hover:text-blue-900 dark:text-gray-400 dark:hover:text-blue-400 mb-8 flex items-center gap-2 font-medium transition-colors"
      >
        &larr; Volver al inicio
      </button>
      
      <div className="text-center mb-10 space-y-2">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Únete a Evidentia</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">¿Cómo planeas usar la plataforma?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Tarjeta Estudiante */}
        <div 
          onClick={() => {
            setOnboardRole('student');
            localStorage.setItem('evidentia_pending_role', 'student');
            setCurrentView('onboarding_profile');
          }}
          className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl p-10 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 text-center group"
        >
          <div className="w-20 h-20 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100/50 dark:group-hover:bg-blue-800/30 transition-colors border border-blue-100/50 dark:border-blue-800/30">
            <UserRound size={40} className="text-blue-900 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">Soy Joven Talento</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">Resuelve retos, construye un portafolio verificado por IA y conecta con oportunidades laborales reales.</p>
        </div>

        {/* Tarjeta Empresa */}
        <div 
          onClick={() => {
            setOnboardRole('organization');
            localStorage.setItem('evidentia_pending_role', 'organization');
            setCurrentView('onboarding_profile');
          }}
          className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl p-10 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 text-center group"
        >
          <div className="w-20 h-20 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100/50 dark:group-hover:bg-blue-800/30 transition-colors border border-blue-100/50 dark:border-blue-800/30">
            <Building2 size={40} className="text-blue-900 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">Soy Empresa / ONG</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">Publica problemas reales, evalúa cómo piensan los jóvenes y recluta talento validado sin fricciones.</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VISTA 2: COMPLETAR PERFIL
// ==========================================
export function OnboardingProfileView({ 
  onboardRole, 
  onboardData, 
  setOnboardData, 
  setUser, 
  setCurrentView 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  
  const effectiveRole = onboardRole || localStorage.getItem('evidentia_pending_role');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsGoogleUser(true);
    });
  }, []);

  const handleGoogleRegister = async () => {
    localStorage.setItem('evidentia_pending_role', onboardRole);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`, // sin hash
      },
    });
    if (error) setErrorMsg(error.message);
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      let userId;

      // 1. Gestión de Autenticación
      if (isGoogleUser) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          // Intentar refrescar si no hay sesión activa
          const { data: refreshed } = await supabase.auth.refreshSession();
          userId = refreshed?.session?.user?.id;
        } else {
          userId = session?.user?.id;
        }
        if (!userId) throw new Error("No se pudo verificar tu sesión de Google. Intenta de nuevo.");
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: onboardData.email,
          password: onboardData.password,
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error("No se pudo crear la cuenta.");
        userId = authData.user.id;
      }

      // 2. Inserción en tabla profiles
      const profileData = {
        id: userId,
        role: effectiveRole,
        full_name: onboardData.name, 
        avatar_url: onboardData.avatar, // TODO: Implementar subida a Supabase Storage
        career: effectiveRole === 'student' ? onboardData.career : null,
        linkedin_url: onboardData.linkedin,
        github_url: onboardData.github,
        portfolio_url: onboardData.website,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profileData], { onConflict: 'id' });      if (profileError) throw profileError;

      // 3. Creación de Organización (Si aplica)
      let organizationIds = [];
      if (effectiveRole === 'organization') {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert([{
            name: onboardData.name?.trim() || 'Mi organización',
            website: onboardData.website || null,
            description: onboardData.bio || null,
          }])
          .select('id, name')
          .single();
          
        if (orgError) throw orgError;

        const { error: memberError } = await supabase.from('organization_members').insert([
          { organization_id: org.id, user_id: userId, role: 'owner' },
        ]);
        if (memberError) throw memberError;
        
        organizationIds = [org.id];
      }

      // 4. Actualización del estado global y limpieza
      setUser({
        ...profileData,
        organizationIds,
        email: onboardData.email,
      });
      
      localStorage.removeItem('evidentia_pending_role');
      setCurrentView('dashboard');

    } catch (err) {
      console.error("Error en el registro:", err);
      setErrorMsg(err.message || "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setOnboardData({ ...onboardData, avatar: imageUrl });
    }
  };

  const toggleTrackSelection = (track) => {
    const currentTracks = onboardData.preferredTracks || [];
    if (currentTracks.includes(track)) {
      setOnboardData({ ...onboardData, preferredTracks: currentTracks.filter(t => t !== track) });
    } else if (currentTracks.length < 3) {
      setOnboardData({ ...onboardData, preferredTracks: [...currentTracks, track] });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl p-8 md:p-12 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm my-10 transition-all">
      {!isGoogleUser && (
        <button 
          type="button" 
          onClick={() => setCurrentView('onboarding_role')}
          className="text-sm text-gray-500 hover:text-blue-900 dark:text-gray-400 dark:hover:text-blue-400 mb-8 flex items-center gap-2 font-medium transition-colors"
        >
          &larr; Cambiar tipo de cuenta
        </button>
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
          {isGoogleUser ? 'Casi listo...' : 'Crea tu cuenta'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {isGoogleUser ? 'Completa estos últimos datos para tu perfil de ' : 'Estás registrándote como '} 
          <span className="font-semibold text-blue-900 dark:text-blue-400">
            {effectiveRole === 'student' ? 'Joven Talento' : 'Empresa / ONG'}
          </span>
        </p>
      </div>
      
      {!isGoogleUser && (
        <>
          <div className="mb-8">
            <button 
              onClick={handleGoogleRegister} 
              type="button" 
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 p-3.5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </div>
          <div className="relative flex items-center mb-10">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wider">o con tu correo</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
          </div>
        </>
      )}

      {errorMsg && (
        <div className="bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-8 border border-red-100 dark:border-red-900/30 text-center font-medium backdrop-blur-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleOnboardSubmit} className="space-y-10">
        
        {!isGoogleUser && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">1. Credenciales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Correo Electrónico <span className="text-red-400">*</span></label>
                <input type="email" value={onboardData.email || ''} onChange={(e) => setOnboardData({...onboardData, email: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="tu@correo.com" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Contraseña <span className="text-red-400">*</span></label>
                <input type="password" value={onboardData.password || ''} onChange={(e) => setOnboardData({...onboardData, password: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="Mínimo 6 caracteres" minLength="6" required />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {isGoogleUser ? '1. Información Pública' : '2. Información Pública'}
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-950 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-800 group-hover:border-blue-400 transition-colors">
                {onboardData.avatar ? (
                  <img src={onboardData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={28} className="text-gray-400" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-blue-900 dark:bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-800 dark:hover:bg-blue-500 transition-transform hover:scale-105 cursor-pointer">
                <Upload size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            
            <div className="flex-grow w-full">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {effectiveRole === 'student' ? 'Nombre Completo o Alias' : 'Nombre de la Organización'} <span className="text-red-400">*</span>
              </label>
              <input type="text" value={onboardData.name || ''} onChange={(e) => setOnboardData({...onboardData, name: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" required placeholder={effectiveRole === 'student' ? 'Ej. Alex Developer' : 'Ej. TechCorp SAC'} />
            </div>
          </div>

          {/* CAMPOS ESTUDIANTE */}
          {effectiveRole === 'student' && (
            <div className="space-y-6 pt-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Especialidad <span className="text-red-400">*</span></label>
                <select value={onboardData.career || ''} onChange={(e) => setOnboardData({...onboardData, career: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none" required>
                  <option value="">Selecciona tu especialidad...</option>
                  <option value="Ingeniería de Software / Sistemas">Ingeniería de Software / Sistemas</option>
                  <option value="Ciencia de Datos / IA">Ciencia de Datos / IA</option>
                  <option value="Diseño UI/UX">Diseño UI/UX</option>
                  <option value="Marketing Digital">Marketing Digital</option>
                  <option value="Administración / Negocios">Administración / Negocios</option>
                  <option value="Finanzas / Economía">Finanzas / Economía</option>
                  <option value="Otra">Otra / Autodidacta</option>
                </select>
              </div>
              
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">Áreas de interés (Máx. 3)</label>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-4">Personalizaremos tu feed de retos.</p>
                <div className="flex flex-wrap gap-2.5">
                  {TRACKS.map(track => {
                    const isSelected = onboardData.preferredTracks?.includes(track);
                    const isDisabled = !isSelected && ((onboardData.preferredTracks?.length || 0) >= 3);
                    return (
                      <button 
                        type="button" 
                        key={track} 
                        onClick={() => toggleTrackSelection(track)} 
                        disabled={isDisabled} 
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border 
                          ${isSelected 
                            ? 'bg-blue-900 text-white border-blue-900 shadow-md dark:bg-blue-600 dark:border-blue-600' 
                            : isDisabled 
                              ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed opacity-50 border-gray-200 dark:border-gray-800' 
                              : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:text-blue-600'}`}
                      >
                        {track}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <img src={linkedinIcon} alt="LinkedIn" className="w-4 h-4 object-contain opacity-80" /> 
                    LinkedIn <span className="text-gray-400 text-xs font-normal">(Opcional)</span>
                  </label>
                  <input type="url" value={onboardData.linkedin || ''} onChange={(e) => setOnboardData({...onboardData, linkedin: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <img src={githubIcon} alt="GitHub" className="w-4 h-4 object-contain opacity-80 dark:invert" /> 
                    Portafolio / GitHub
                  </label>
                  <input type="url" value={onboardData.github || ''} onChange={(e) => setOnboardData({...onboardData, github: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="https://github.com/..." />
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS EMPRESA */}
          {effectiveRole === 'organization' && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sector</label>
                  <select value={onboardData.industry || ''} onChange={(e) => setOnboardData({...onboardData, industry: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none">
                    <option value="">Seleccionar...</option>
                    <option value="Tecnología">Tecnología / Software</option>
                    <option value="Finanzas">Finanzas / Banca</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tamaño de la empresa</label>
                  <select value={onboardData.organizationSize || ''} onChange={(e) => setOnboardData({...onboardData, organizationSize: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none">
                    <option value="">Seleccionar...</option>
                    <option value="1-50">1 - 50 empleados</option>
                    <option value="51+">Más de 50</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-8 mt-4 border-t border-gray-100 dark:border-gray-800/50">
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full text-white p-4 rounded-xl font-bold transition-all duration-300 text-lg flex justify-center items-center gap-2 bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Guardando perfil...
              </span>
            ) : 'Finalizar y Entrar a Evidentia'}
          </button>
        </div>
      </form>
    </div>
  );
}