import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { UserRound, Moon, Sun } from 'lucide-react';
import LandingView from './views/LandingView';
import { ThemeProvider, useTheme } from './useTheme';

// Solo mantenemos los eventos de Arena estáticos por ahora si no están en DB
import { INITIAL_ARENA_EVENTS } from './constants/data';

import LoginView from './views/LoginView';
import { OnboardingRoleView, OnboardingProfileView } from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import { ProfileView, EditProfileView } from './views/ProfileView';
import ChallengeDetailView from './views/ChallengeDetailView';
import { CreateArenaView, ApplyArenaView } from './views/ArenaView';


export default function App() {
  React.useEffect(() => {
    document.documentElement.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { isDark, toggleTheme } = useTheme();

  // ==========================================
  // 1. ESTADOS GLOBALES DE LA APLICACIÓN
  // ==========================================
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('landing'); 
  const [currentTab, setCurrentTab] = useState('challenges'); 
  
  // Datos principales separados (Vienen de Supabase ahora)
  const [challenges, setChallenges] = useState([]);
  const [practiceChallenges, setPracticeChallenges] = useState([]);
  const [arenaEvents, setArenaEvents] = useState(INITIAL_ARENA_EVENTS);
  
  // Selecciones
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [selectedArenaEvent, setSelectedArenaEvent] = useState(null);
  const [arenaApplyMode, setArenaApplyMode] = useState(''); 

  // Formularios globales
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [onboardRole, setOnboardRole] = useState(null); 
  const [onboardData, setOnboardData] = useState({ 
    email: '', password: '', 
    name: '', preferredTracks: [], avatar: null, career: '', bio: '', linkedin: '', github: '', industry: '', companySize: '', website: '' 
  });
  const [newArenaEvent, setNewArenaEvent] = useState({ title: '', tracks: [], date: '', description: '', teamMode: 'both' });
  
  const currentViewRef = React.useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // ==========================================
  // ENRUTAMIENTO NATIVO (HASH ROUTER)
  // ==========================================
  
  // 1. Escuchar los botones de Adelante/Atrás del mouse y el navegador
  useEffect(() => {
    const syncStateFromUrl = () => {
      // Extraemos la vista de la URL (ej: "#/dashboard" -> "dashboard")
      const hash = window.location.hash.replace('#/', '');
      
      // Si hay un hash válido en la URL, actualizamos la vista
      if (hash) {
        setCurrentView(hash);
      }
    };

    // Ejecutar al montar por si el usuario entra con un enlace directo
    syncStateFromUrl();

    // Escuchar el evento nativo de cambio de hash
    window.addEventListener('hashchange', syncStateFromUrl);
    return () => window.removeEventListener('hashchange', syncStateFromUrl);
  }, []); // Solo se ejecuta al montar

  // 2. Actualizar la URL dinámicamente cuando cambia currentView
  useEffect(() => {
    const currentHash = window.location.hash.replace('#/', '');
    
    // Si la vista actual es distinta a la URL, empujamos el historial
    if (currentView !== currentHash) {
      // Usamos pushState para no disparar el 'hashchange' y crear un bucle
      window.history.pushState(null, '', `#/${currentView}`);
    }
  }, [currentView]);
  // ==========================================
  // 2. EFECTO 1: MANEJO DE SESIÓN Y RUTAS
  // ==========================================
  useEffect(() => {
    const checkProfileAndRoute = async (authUser) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profile && profile.full_name) {
          setUser({ id: authUser.id, ...profile, email: authUser.email });
          
          setCurrentView((prevView) => {
            if (['landing', 'login', 'onboarding_role', 'onboarding_profile'].includes(prevView)) {
              return 'dashboard';
            }
            return prevView; 
          });
        } else {
          const pendingRole = localStorage.getItem('evidentia_pending_role');
          const finalRole = pendingRole || profile?.role; 
          
          setOnboardData(prev => ({
            ...prev,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || profile?.full_name || prev.name || '',
            avatar: authUser.user_metadata?.avatar_url || profile?.avatar_url || prev.avatar || null
          }));

          if (finalRole) {
            setOnboardRole(finalRole);
            setCurrentView('onboarding_profile'); 
          } else {
            setCurrentView('onboarding_role');
          }
        }
      } catch (err) {
        console.error("Error interno al verificar perfil:", err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkProfileAndRoute(session.user);
      } else {
        setIsCheckingSession(false); 
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const vistasExternas = ['landing', 'login', 'onboarding_role', 'onboarding_profile'];
        if (vistasExternas.includes(currentViewRef.current)) {
          checkProfileAndRoute(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []); 

  // ==========================================
  // 3. EFECTO 2: CARGA DE RETOS UNIFICADA
  // ==========================================
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        // Hacemos un JOIN directo para traer los datos del creador
        const { data, error } = await supabase
          .from('challenges')
          .select(`
            *,
            profiles:organization_id (
              full_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Separamos los retos reales de los de práctica en memoria
          // Si es explícitamente true, va a práctica. Todo lo demás (false o null) va a Empresas.
          setChallenges(data.filter(c => c.is_practice !== true));
          setPracticeChallenges(data.filter(c => c.is_practice === true));
        }
      } catch (err) {
        console.error("Error cargando retos:", err.message);
      }
    };

    fetchChallenges();
  }, []); 

  // ==========================================
  // 4. LÓGICA GLOBAL (Funciones)
  // ==========================================
  const handleLogout = async () => {
    await supabase.auth.signOut(); 
    setUser(null);
    setCurrentView('landing'); 
    setLoginForm({ email: '', password: '' });
    setOnboardData({ email: '', password: '', name: '', preferredTracks: [], avatar: null, career: '', bio: '', linkedin: '', github: '', industry: '', companySize: '', website: '' });
    setOnboardRole(null);
    setCurrentTab('challenges');
  };
  
  // ==========================================
  // 5. RENDERIZADO PRINCIPAL
  // ==========================================
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500/30">      
        {/* BARRA DE NAVEGACIÓN */}
        {user && (
          <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-xl shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                
                {/* Lado Izquierdo: Logo y Tabs */}
                <div className="flex items-center gap-8">
                  <span className="text-2xl font-black text-gray-950 dark:text-white cursor-pointer" onClick={() => setCurrentView('dashboard')}>EVIDENTIA</span>
                  
                  {/* TABS SIEMPRE VISIBLES EN DESKTOP */}
                  <div className="hidden md:flex gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-md border border-gray-200 dark:border-gray-800">
                    <button onClick={() => { setCurrentTab('challenges'); setCurrentView('dashboard'); }} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${(currentTab === 'challenges' && currentView === 'dashboard') ? 'bg-white dark:bg-gray-800 text-gray-950 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Empresas</button>
                    {user.role === 'student' && (
                      <>
                        <button onClick={() => { setCurrentTab('practice'); setCurrentView('dashboard'); }} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${(currentTab === 'practice' && currentView === 'dashboard') ? 'bg-white dark:bg-gray-800 text-gray-950 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Para Practicar</button>
                        <button onClick={() => { setCurrentTab('my_submissions'); setCurrentView('dashboard'); }} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${(currentTab === 'my_submissions' && currentView === 'dashboard') ? 'bg-white dark:bg-gray-800 text-gray-950 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Mis Entregas</button>
                        <button onClick={() => { setCurrentTab('top'); setCurrentView('dashboard'); }} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${(currentTab === 'top' && currentView === 'dashboard') ? 'bg-white dark:bg-gray-800 text-gray-950 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Top Semanal</button>
                      </>
                    )}
                    <button onClick={() => { setCurrentTab('arena'); setCurrentView('dashboard'); }} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${(currentTab === 'arena' && currentView === 'dashboard') ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>🔥 Arena</button>
                  </div>
                </div>
                
                {/* Lado Derecho: Controles y Menú Móvil */}
                <div className="flex items-center gap-3 md:gap-4">
                  <button onClick={toggleTheme} className="p-2 rounded-md border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
                    {isDark ? <Sun size={18} className="text-gray-400" /> : <Moon size={18} className="text-gray-600" />}
                  </button>
                  <div className="hidden md:flex w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-md items-center justify-center overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-sm" onClick={() => setCurrentView('profile')}>
                     {(user.avatar_url || user.avatar) ? <img src={user.avatar_url || user.avatar} alt="Avatar" className="w-full h-full object-cover"/> : <UserRound size={16} className="text-gray-500 dark:text-gray-400"/>}
                  </div>
                  <button onClick={handleLogout} className="hidden md:block text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors">Salir</button>
                  <button className="md:hidden p-2 text-gray-600 dark:text-gray-400" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? 'X' : '☰'}
                  </button>
              
            
                </div>
              </div>
            </div>

            {/* Menú Desplegable Móvil */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-2 pb-4 space-y-1 shadow-lg">
                <button onClick={() => { setCurrentTab('challenges'); setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">Empresas</button>
                {user.role === 'student' && (
                  <>
                    <button onClick={() => { setCurrentTab('practice'); setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">Para Practicar</button>
                    <button onClick={() => { setCurrentTab('my_submissions'); setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">Mis Entregas</button>
                    <button onClick={() => { setCurrentTab('top'); setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">Top Semanal</button>
                  </>
                )}
                <button onClick={() => { setCurrentTab('arena'); setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-blue-900 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800">🔥 Arena</button>
                <div className="my-2 border-t border-gray-200 dark:border-gray-800"></div>
                <button onClick={() => { setCurrentView('profile'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">Mi Perfil</button>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">Cerrar Sesión</button>
              </div>
            )}
          </nav>
        )}

        {/* ÁREA DE CONTENIDO DINÁMICO */}
        <main className={user ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
          
          {currentView === 'landing' && <LandingView setCurrentView={setCurrentView} />}
          
          {currentView === 'login' && (
            <LoginView 
              setUser={setUser}
              loginForm={loginForm} 
              setLoginForm={setLoginForm} 
              setCurrentView={setCurrentView}
            />
          )}
          
          {currentView === 'onboarding_role' && <OnboardingRoleView setOnboardRole={setOnboardRole} setCurrentView={setCurrentView} />}
          
          {currentView === 'onboarding_profile' && (
            <OnboardingProfileView 
              onboardRole={onboardRole} 
              onboardData={onboardData} 
              setOnboardData={setOnboardData} 
              setUser={setUser} 
              setCurrentView={setCurrentView} 
            />
          )}
          
          {currentView === 'dashboard' && (
            <DashboardView 
              user={user} 
              currentTab={currentTab} 
              challenges={challenges} 
              practiceChallenges={practiceChallenges} // Nueva Prop
              arenaEvents={arenaEvents}
              setCurrentView={setCurrentView}
              setSelectedChallenge={setSelectedChallenge}
              setSelectedArenaEvent={setSelectedArenaEvent}
              setArenaApplyMode={setArenaApplyMode}
            />
          )}
          
          {currentView === 'profile' && <ProfileView user={user} setCurrentView={setCurrentView} />}
          {currentView === 'edit_profile' && <EditProfileView user={user} setUser={setUser} setCurrentView={setCurrentView} />}
          {currentView === 'view_challenge' && (
            <ChallengeDetailView 
              selectedChallenge={selectedChallenge} 
              setCurrentView={setCurrentView} 
              user={user} 
            />
          )}
          {currentView === 'create_arena' && (
            <CreateArenaView 
              user={user}
              newArenaEvent={newArenaEvent}
              setNewArenaEvent={setNewArenaEvent}
              arenaEvents={arenaEvents}
              setArenaEvents={setArenaEvents}
              setCurrentView={setCurrentView}
              setCurrentTab={setCurrentTab}
            />
          )}
          
          {currentView === 'apply_arena' && <ApplyArenaView selectedArenaEvent={selectedArenaEvent} arenaApplyMode={arenaApplyMode} setCurrentView={setCurrentView} />}

        </main>
      </div>
    </ThemeProvider>
  );
}