import React, { useState } from 'react';
import { UserRound, Building2, Camera, Upload, Globe } from 'lucide-react';
import { TRACKS } from '../constants/data';
import { supabase } from '../supabaseClient';

import linkedinIcon from '../assets/linkedin-logo.png';
import githubIcon from '../assets/github-logo.png';

// ==========================================
// VISTA 1: SELECCIÓN DE ROL
// ==========================================
export function OnboardingRoleView({ setOnboardRole, setCurrentView }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 bg-white dark:bg-gray-950">
      <button 
        type="button" 
        onClick={() => setCurrentView('landing')}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 mb-8 flex items-center gap-1 font-medium transition-colors"
      >
        ← Volver al inicio
      </button>
      
      <h2 className="text-3xl font-bold text-gray-950 dark:text-gray-50 mb-2">Únete a Aura</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-10 text-sm">¿Cómo planeas usar la plataforma?</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Tarjeta Estudiante */}
        <div 
          onClick={() => { setOnboardRole('student'); setCurrentView('onboarding_profile'); }}
          className="bg-white dark:bg-gray-900 p-10 rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:border-solid cursor-pointer transition-all text-center group"
        >
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-colors border border-blue-100 dark:border-blue-800">
            <UserRound size={48} className="text-blue-950 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-950 dark:text-gray-50 mb-3">Soy Joven Talento</h3>
          <p className="text-gray-700 dark:text-gray-400 leading-relaxed text-sm">Resuelve retos, construye un portafolio verificado por IA y conecta con oportunidades laborales reales.</p>
        </div>

        {/* Tarjeta Empresa */}
        <div 
          onClick={() => { setOnboardRole('company'); setCurrentView('onboarding_profile'); }}
          className="bg-white dark:bg-gray-900 p-10 rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:border-solid cursor-pointer transition-all text-center group"
        >
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-colors border border-blue-100 dark:border-blue-800">
            <Building2 size={48} className="text-blue-950 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-950 dark:text-gray-50 mb-3">Soy Empresa / ONG</h3>
          <p className="text-gray-700 dark:text-gray-400 leading-relaxed text-sm">Publica problemas reales, evalúa cómo piensan los jóvenes y recluta talento validado sin fricciones.</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VISTA 2: COMPLETAR PERFIL
// ==========================================
// VISTA 2: COMPLETAR PERFIL
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

  // Detectar si el usuario ya está logueado (vino de Google)
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsGoogleUser(true);
    });
  }, []);

  const handleGoogleRegister = async () => {
    localStorage.setItem('aura_pending_role', onboardRole);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setErrorMsg(error.message);
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      let userId;

      if (isGoogleUser) {
        // CASO GOOGLE: El usuario ya está creado en Auth, solo necesitamos su ID
        const { data: { session } } = await supabase.auth.getSession();
        userId = session.user.id;
      } else {
        // CASO CORREO: Creamos el usuario en Auth primero
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: onboardData.email,
          password: onboardData.password,
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error("No se pudo crear la cuenta.");
        userId = authData.user.id;
      }

      // 2. Insertar en tabla profiles (Usando el userId correcto)
      const profileData = {
        id: userId,
        role: onboardRole,
        full_name: onboardData.name, 
        avatar_url: onboardData.avatar,
        career: onboardRole === 'student' ? onboardData.career : null,
        linkedin_url: onboardData.linkedin,
        github_url: onboardData.github,
        portfolio_url: onboardData.website,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profileData]);

      if (profileError) throw profileError;

      setUser({ ...profileData, email: onboardData.email });
      // Limpiamos el localStorage
      localStorage.removeItem('aura_pending_role');
      setCurrentView('dashboard');

    } catch (err) {
      console.error("Error en el registro:", err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Crea una URL temporal en tu navegador para visualizar la foto seleccionada
      const imageUrl = URL.createObjectURL(file);
      setOnboardData({ ...onboardData, avatar: imageUrl });
    }
  };

  const toggleTrackSelection = (track) => {
    if (onboardData.preferredTracks?.includes(track)) {
      setOnboardData({ ...onboardData, preferredTracks: onboardData.preferredTracks.filter(t => t !== track) });
    } else {
      if ((onboardData.preferredTracks?.length || 0) < 3) {
        setOnboardData({ ...onboardData, preferredTracks: [...(onboardData.preferredTracks || []), track] });
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-10 rounded-xl border border-gray-200 dark:border-gray-800 my-10">
      {!isGoogleUser && (
        <button 
          type="button" 
          onClick={() => setCurrentView('onboarding_role')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 mb-8 flex items-center gap-1 font-medium transition-colors"
        >
          ← Cambiar tipo de cuenta
        </button>
      )}

      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-gray-950 dark:text-gray-50 mb-2">
          {isGoogleUser ? 'Casi listo...' : 'Crea tu cuenta'}
        </h2>
        <p className="text-gray-700 dark:text-gray-400">
          {isGoogleUser ? 'Completa estos últimos datos para terminar de configurar tu perfil de ' : 'Estás registrándote como '} 
          <span className="font-bold text-gray-950 dark:text-gray-50">{onboardRole === 'student' ? 'Estudiante / Talento' : 'Empresa / ONG'}</span>
        </p>
      </div>
      
      {/* OCULTAMOS EL BOTÓN DE GOOGLE SI YA ESTÁ LOGUEADO */}
      {!isGoogleUser && (
        <>
          <div className="mb-8">
            <button onClick={handleGoogleRegister} type="button" className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 p-4 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Registrarse con Google
            </button>
          </div>
          <div className="relative flex items-center mb-10">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            <span className="flex-shrink-0 mx-4 text-gray-600 dark:text-gray-500 text-sm font-medium">o regístrate con tu correo</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
          </div>
        </>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 rounded-lg text-sm mb-8 border border-red-200 dark:border-red-800/50 text-center font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleOnboardSubmit} className="space-y-8">
        
        {/* OCULTAMOS EL CORREO/CONTRASEÑA SI ES USUARIO DE GOOGLE */}
        {!isGoogleUser && (
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-600 dark:text-gray-500 mb-4 uppercase tracking-widest">1. Credenciales de Acceso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Correo Electrónico <span className="text-red-500">*</span></label>
                <input type="email" value={onboardData.email || ''} onChange={(e) => setOnboardData({...onboardData, email: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="tu@correo.com" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Contraseña <span className="text-red-500">*</span></label>
                <input type="password" value={onboardData.password || ''} onChange={(e) => setOnboardData({...onboardData, password: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="Mínimo 6 caracteres" minLength="6" required />
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: INFORMACIÓN PÚBLICA */}
        <div>
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-500 mb-4 uppercase tracking-widest">
            {isGoogleUser ? '1. Información Pública' : '2. Información Pública'}
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700">
                {onboardData.avatar ? (
                  <img src={onboardData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={30} className="text-gray-400 dark:text-gray-600" />
                )}
              </div>
              {/* Convertimos el botón en un label interactivo */}
              <label className="absolute bottom-0 right-0 bg-gray-900 dark:bg-gray-700 text-white p-2 rounded-lg shadow-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition cursor-pointer">
                <Upload size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            
            <div className="flex-grow w-full">
              <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">
                {onboardRole === 'student' ? 'Nombre Completo o Alias' : 'Nombre de la Organización'} <span className="text-red-500">*</span>
              </label>
              <input type="text" value={onboardData.name || ''} onChange={(e) => setOnboardData({...onboardData, name: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" required placeholder={onboardRole === 'student' ? 'Ej. Alex Developer' : 'Ej. TechCorp SAC'} />
            </div>
          </div>

          {/* CAMPOS ESTUDIANTE */}
          {onboardRole === 'student' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Carrera o Especialidad <span className="text-red-500">*</span></label>
                <select value={onboardData.career || ''} onChange={(e) => setOnboardData({...onboardData, career: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" required>
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
              
              <div className="bg-blue-50 dark:bg-blue-950/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <label className="block text-sm font-bold text-blue-950 dark:text-blue-300 mb-1">Tus áreas de interés (Máx. 3)</label>
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-4">Ayúdanos a personalizar tu feed de retos.</p>
                <div className="flex flex-wrap gap-2">
                  {TRACKS.map(track => {
                    const isSelected = onboardData.preferredTracks?.includes(track);
                    const isDisabled = !isSelected && ((onboardData.preferredTracks?.length || 0) >= 3);
                    return (
                      <button type="button" key={track} onClick={() => toggleTrackSelection(track)} disabled={isDisabled} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${isSelected ? 'bg-blue-950 dark:bg-blue-900 text-white border-blue-950 dark:border-blue-900' : isDisabled ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-600 hover:text-blue-950 dark:hover:text-blue-400'}`}>
                        {track}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2 flex items-center gap-2">
                    <img src={linkedinIcon} alt="LinkedIn" className="w-5 h-5 object-contain" /> 
                    LinkedIn (Opcional)
                  </label>
                  <input type="url" value={onboardData.linkedin || ''} onChange={(e) => setOnboardData({...onboardData, linkedin: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2 flex items-center gap-2">
                    <img src={githubIcon} alt="GitHub" className="w-5 h-5 object-contain" /> 
                    Portafolio / GitHub
                  </label>
                  <input type="url" value={onboardData.github || ''} onChange={(e) => setOnboardData({...onboardData, github: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="https://github.com/..." />
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS EMPRESA */}
          {onboardRole === 'company' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Sector</label>
                  <select value={onboardData.industry || ''} onChange={(e) => setOnboardData({...onboardData, industry: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Seleccionar...</option>
                    <option value="Tecnología">Tecnología / Software</option>
                    <option value="Finanzas">Finanzas / Banca</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Tamaño</label>
                  <select value={onboardData.companySize || ''} onChange={(e) => setOnboardData({...onboardData, companySize: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Seleccionar...</option>
                    <option value="1-50">1 - 50 empleados</option>
                    <option value="51+">Más de 50</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-800">
          <button type="submit" disabled={isLoading} className={`w-full text-white p-4 rounded-lg font-bold transition-all text-lg flex justify-center items-center gap-2 bg-blue-950 dark:bg-blue-900 hover:bg-blue-900 dark:hover:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed`}>
            {isLoading ? 'Guardando perfil...' : 'Finalizar y Entrar a Aura'}
          </button>
        </div>
      </form>
    </div>
  );
}