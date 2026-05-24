import React, { useState, useEffect } from 'react';
import { Building2, UserRound, Filter, Search, Bot, Flame, Plus, Briefcase } from 'lucide-react';
import { TRACKS, PRACTICE_CHALLENGES, TOP_CHALLENGES } from '../constants/data';
import ChallengeCard from '../components/ChallengeCard';
import ArenaTab from '../components/ArenaTab';
import { supabase } from '../supabaseClient';
import MySubmissionsList from '../components/MySubmissionsList';

export default function DashboardView({
  user,
  currentTab,
  challenges,
  setChallenges,
  practiceChallenges,
  arenaEvents,
  setCurrentView,
  setSelectedChallenge,
  setSelectedArenaEvent,
  setArenaApplyMode,
}) {
  const [activeFilters, setActiveFilters] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [orgFilter, setOrgFilter] = useState('all');

  // Estado para formulario de creación de retos (Empresas)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    difficulty: 'Intermedio',
    technical_requirements: '', // NUEVO
    deadline: '',               // NUEVO
    reward: ''                  // NUEVO
  });

  // --- Lógica de Filtros ---
  const toggleFilter = (track) => {
    if (activeFilters.includes(track)) {
      setActiveFilters(activeFilters.filter(t => t !== track));
    } else {
      setActiveFilters([...activeFilters, track]);
    }
  };
  const myChallenges = challenges?.filter(c => c.organization_id === user?.id) || [];
  const getFilteredList = (list) => {
  return list.filter(challenge => {
    // 1. Filtro de Organización
    const orgType = challenge.profiles?.organization_type || 'Empresa';
    const matchesOrg = orgFilter === 'all' || orgType === orgFilter;

    // 2. Filtro de Tecnologías (Usa tu columna tech_stack de Supabase)
    const stack = challenge.tech_stack ? challenge.tech_stack.toLowerCase() : '';
    const matchesTrack = activeFilters.length === 0 || activeFilters.some(filter => stack.includes(filter.toLowerCase()));

    return matchesOrg && matchesTrack;
  });
};
  
  // --- Lógica de Empresas ---
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const challengeToInsert = {
        organization_id: user.id,
        title: newChallenge.title,
        description: newChallenge.description,
        difficulty: newChallenge.difficulty,
        technical_requirements: newChallenge.technical_requirements,
        deadline: newChallenge.deadline || null, 
        reward: newChallenge.reward,
        status: 'active',
        visibility: 'public',
        is_practice: false
      };

      const { data, error } = await supabase
        .from('challenges')
        .insert([challengeToInsert])
        .select();

      if (error) throw error;

      alert("¡Reto publicado exitosamente!");
      
      // Limpiamos el formulario
      setNewChallenge({ title: '', description: '', difficulty: 'Intermedio', modality: 'Remoto' });
      
      // Si pasaste setChallenges por props, añadimos el reto a la vista inmediatamente
      if (setChallenges && data) {
        setChallenges(prev => [data[0], ...prev]);
      }
      
    } catch (error) {
      console.error("Error publicando el reto:", error);
      alert("Hubo un error al publicar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChallengeTrackChange = (track) => {
    if (newChallenge.tracks.includes(track)) {
      setNewChallenge({ ...newChallenge, tracks: newChallenge.tracks.filter(t => t !== track) });
    } else {
      setNewChallenge({ ...newChallenge, tracks: [...newChallenge.tracks, track] });
    }
  };

  // --- Lógica de Arena ---
  const handleArenaApplyClick = (event, mode) => {
    setSelectedArenaEvent(event);
    setArenaApplyMode(mode);
    setCurrentView('apply_arena');
  };
  const [mySubmissions, setMySubmissions] = useState([]);
  useEffect(() => {
  const fetchMySubmissions = async () => {
    if (user?.id) {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          status,
          score,
          submitted_at,
          challenges:challenge_id (title, organization_id, profiles:organization_id (full_name))
        `)
        .eq('user_id', user.id);

      if (data) {
        // Mapeamos los datos para que coincidan con lo que espera tu componente
        const formatted = data.map(sub => ({
          id: sub.id,
          challenge_goal: sub.challenges?.title,
          company: sub.challenges?.profiles?.full_name,
          status: sub.status,
          score: sub.score,
          date: new Date(sub.submitted_at).toLocaleDateString()
        }));
        setMySubmissions(formatted);
      }
    }
  };

  if (currentTab === 'my_submissions') {
    fetchMySubmissions();
  }
}, [currentTab, user]);
  // --- Sub-componente: Lista de Retos ---
  const ChallengeList = ({ data, type }) => {
    // Si data es undefined, usamos un array vacío para evitar que rompa
    const safeData = data || [];
    const filteredData = getFilteredList(safeData);

    console.log("Datos filtrados que se van a renderizar:", filteredData);

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 border-dashed shadow-none">
          <Search className="mx-auto text-gray-400 dark:text-gray-600 mb-3" size={40} />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No encontramos retos</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Prueba quitando algunos filtros o seleccionando otro tab.</p>
          <button 
            onClick={() => setActiveFilters([])} 
            className="mt-4 text-blue-950 dark:text-blue-400 font-medium hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      );
    }
    return (
      // Agregamos h-auto y min-h para forzar al contenedor a expandirse
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full h-auto min-h-[200px]">
        {filteredData.map(challenge => (
          <div key={challenge.id} className="w-full"> {/* Contenedor envolvente */}
            <ChallengeCard
              challenge={challenge}
              type={type}
              onDetails={() => { 
                setSelectedChallenge(challenge); 
                setCurrentView('view_challenge'); 
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // --- Sub-componente: Render Arena ---
  const renderArenaDashboard = () => {
    if (user?.role !== 'student') {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-400 dark:border-yellow-700 p-6 rounded-lg shadow-none">
          <h3 className="font-bold text-yellow-900 dark:text-yellow-200">Arena Solo para Estudiantes</h3>
          <p className="text-yellow-800 dark:text-yellow-300 text-sm mt-2">
            La funcionalidad Arena está disponible solo para estudiantes.
          </p>
        </div>
      );
    }

    return (
      <ArenaTab 
        user={user} 
        setCurrentView={setCurrentView}
        setSelectedArenaEvent={setSelectedArenaEvent}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white dark:bg-gray-950 min-h-screen">
      
      {/* Columna Izquierda: Mini Perfil */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-xl shadow-none border border-gray-200 dark:border-gray-800 p-8 h-fit sticky top-24 transition-all">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 bg-gradient-to-tr from-blue-100 dark:from-blue-950 to-blue-50 dark:to-blue-900 rounded-xl flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-700 shadow-none mb-4">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
            ) : (
              <UserRound size={48} className="text-blue-400 dark:text-blue-500"/>
            )}
          </div>
          <h3 className="text-xl font-black text-gray-950 dark:text-gray-50 text-center mb-1">
            {user?.full_name || 'Usuario Aura'}
          </h3>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6 text-center">
            {user?.role === 'student' ? user?.career || 'Estudiante' : 'Empresa / ONG'}
          </p>
          
          {user?.role === 'student' && (
            <div className="w-full bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-800/50 mb-6 shadow-none">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-widest">Aura Score</span>
              <div className="text-4xl font-black text-blue-950 dark:text-blue-400 mt-1">{user?.reputation_score || 0}</div>
            </div>
          )}
          
          <button onClick={() => setCurrentView('profile')} className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition shadow-none">
            Ver Mi Perfil Completo
          </button>
        </div>
      </div>

      {/* Columna Derecha: Contenido Dinámico del Dashboard */}
      <div className="lg:col-span-3 space-y-6 bg-white dark:bg-gray-950">
        
        {/* Encabezado del Tab Actual */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-50 mb-1">
            {currentTab === 'challenges' && 'Retos Activos'}
            {currentTab === 'practice' && 'Práctica'}
            {currentTab === 'top' && 'Top Semanal'}
            {currentTab === 'arena' && 'AURA ARENA'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            {currentTab === 'challenges' && 'Desafíos reales de empresas buscando resolver problemas'}
            {currentTab === 'practice' && 'Practica con retos históricos y obtén feedback por IA'}
            {currentTab === 'top' && 'Los retos más competidos de la semana'}
            {currentTab === 'arena' && 'Eventos en vivo: compite y demuestra tus habilidades'}
          </p>
        </div>

        {/* Banners Superiores Específicos */}
        {currentTab === 'practice' && (
          <div className="bg-blue-950 dark:bg-blue-900 p-6 rounded-xl text-white shadow-none border border-blue-900 dark:border-blue-800 mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Bot size={28}/> Retos Históricos (Práctica)</h2>
            <p className="text-blue-100 dark:text-blue-200 max-w-xl text-sm">Estos son retos reales de nuestra base de datos. Sube tu solución para practicar y nuestra IA analizará tu documento dándote feedback detallado para que mejores antes de postular a un reto activo.</p>
          </div>
        )}
        {currentTab === 'top' && (
          <div className="bg-blue-950 dark:bg-blue-900 p-6 rounded-xl text-white shadow-none border border-blue-900 dark:border-blue-800 mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Flame size={28}/> Top Semanal</h2>
            <p className="text-blue-100 dark:text-blue-200 max-w-xl text-sm">Los retos más populares y competidos de la semana. Destacar aquí te dará un multiplicador x2 en tu Aura Score y visibilidad prioritaria con los reclutadores.</p>
          </div>
        )}

        {/* ZONA EXCLUSIVA PARA EMPRESAS: PANEL DE GESTIÓN */}
        {user?.role === 'company' && currentTab === 'challenges' && (
          <div className="space-y-6 mb-10">
            
            {/* Cabecera del Panel */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-none">
              <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h2 className="text-2xl font-bold text-gray-950 dark:text-gray-50">Panel de Organización</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Gestiona tus retos activos y descubre talento.</p>
              </div>
              
              {!showCreateForm ? (
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center justify-center gap-2 bg-blue-950 dark:bg-blue-900 hover:bg-blue-900 dark:hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-bold transition shadow-none hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  <Plus size={18} /> Nuevo Reto
                </button>
              ) : (
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-6 py-3 rounded-lg font-bold transition w-full sm:w-auto shadow-none"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            {/* Renderizado Condicional: Formulario vs Lista de Retos */}
            {showCreateForm ? (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-none border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-950 dark:text-gray-50 mb-6">Detalles del Nuevo Reto</h3>
                
                <form onSubmit={handleCreateChallenge} className="space-y-6">
                  {/* ... (AQUÍ VA EXACTAMENTE EL MISMO FORMULARIO DE INPUTS QUE YA TENÍAS) ... */}
                      <div>
                        <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Título del Reto *</label>
                        <input type="text" value={newChallenge.title} onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm" required />
                      </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Descripción y Contexto *</label>
                    <textarea value={newChallenge.description} onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 min-h-[100px]" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Requisitos Técnicos Esperados *</label>
                    <textarea value={newChallenge.technical_requirements} onChange={(e) => setNewChallenge({...newChallenge, technical_requirements: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 min-h-[80px]" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Dificultad</label>
                      <select value={newChallenge.difficulty} onChange={(e) => setNewChallenge({...newChallenge, difficulty: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        <option value="Básico">Básico</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Fecha Límite</label>
                      <input type="date" value={newChallenge.deadline} onChange={(e) => setNewChallenge({...newChallenge, deadline: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Incentivo / Premio</label>
                      <input type="text" value={newChallenge.reward} onChange={(e) => setNewChallenge({...newChallenge, reward: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className={`w-full text-white p-4 rounded-lg font-bold transition shadow-none ${isSubmitting ? 'bg-blue-500 dark:bg-blue-800 cursor-not-allowed' : 'bg-blue-950 dark:bg-blue-900 hover:bg-blue-900 dark:hover:bg-blue-800 hover:-translate-y-0.5'}`}>
                    {isSubmitting ? 'Publicando...' : 'Publicar Reto en Aura'}
                  </button>
                </form>
              </div>
            ) : (
              /* Vista de Mis Retos */
              <div>
                {myChallenges.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-none">
                    <Briefcase size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Aún no has publicado retos</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md">Crea tu primer reto técnico para que la comunidad de estudiantes comience a enviar sus propuestas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myChallenges.map(reto => (
                      <div key={reto.id} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-none hover:border-gray-300 dark:hover:border-gray-700 transition cursor-pointer" onClick={() => { setSelectedChallenge(reto); setCurrentView('view_challenge'); }}>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${reto.difficulty === 'Avanzado' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' : reto.difficulty === 'Intermedio' ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'}`}>
                            {reto.difficulty}
                          </span>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Activo</span>
                        </div>
                        <h4 className="font-bold text-gray-950 dark:text-gray-50 text-lg mb-2 line-clamp-2">{reto.title}</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-400 line-clamp-2 mb-4">{reto.description}</p>
                        
                        {/* Aquí luego añadiremos un contador de cuántos estudiantes han enviado respuestas */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                           <span className="text-xs font-bold text-blue-950 dark:text-blue-400">Ver Detalles →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Barra de Filtros (Estudiantes, no en Arena) */}
        {user.role === 'student' && currentTab !== 'arena' && (
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-none border border-gray-200 dark:border-gray-800 mb-6">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)} 
              className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 hover:text-blue-950 dark:hover:text-blue-400 transition outline-none"
            >
              <Filter size={18} /> Filtros: <span className="font-bold text-blue-950 dark:text-blue-400">{activeFilters.length === 0 ? 'Todos' : `${activeFilters.length} seleccionados`}</span>
            </button>
            {isFilterOpen && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-2">
                <button 
                  onClick={() => setActiveFilters([])}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition shadow-none ${activeFilters.length === 0 ? 'bg-blue-950 dark:bg-blue-900 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'}`}
                >
                  Todos
                </button>
                {TRACKS.map(track => (
                  <button 
                    key={track} 
                    onClick={() => toggleFilter(track)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition shadow-none ${activeFilters.includes(track) ? 'bg-blue-950 dark:bg-blue-900 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'}`}
                  >
                    {track}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Selector de Tipo de Organización */}
<div className="flex bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-1 shadow-sm mb-4 w-fit">
  {(['all', 'Empresa', 'Mype', 'ONG']).map((type) => (
    <button
      key={type}
      onClick={() => setOrgFilter(type)}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${orgFilter === type ? 'bg-white dark:bg-gray-700 text-gray-950 dark:text-white shadow-sm border border-gray-200 dark:border-gray-600' : 'text-gray-600 dark:text-gray-400'}`}
    >
      {type === 'all' ? 'Todas' : type}
    </button>
  ))}
</div>

        {/* Listas de Retos / Arena dependiendo del Tab */}
        {currentTab === 'challenges' && (
          <div>
            <ChallengeList data={challenges || []} type="default" />
          </div>
        )}        
        {currentTab === 'practice' && <ChallengeList data={practiceChallenges || []} type="practice" />}        {currentTab === 'top' && <ChallengeList data={TOP_CHALLENGES} type="top" />}
        {currentTab === 'arena' && renderArenaDashboard()}
        {currentTab === 'my_submissions' && <MySubmissionsList submissions={mySubmissions} />}

      </div>
    </div>
  );
}