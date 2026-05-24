import React from 'react';
import { ArrowLeft, Send, Users, User, Shield, Briefcase, Zap } from 'lucide-react';
import { TRACKS } from '../constants/data';
import { supabase } from '../supabaseClient';

// ==========================================
// VISTA 1: CREAR UN EVENTO ARENA (EMPRESAS)
// ==========================================
export function CreateArenaView({
  user,
  newArenaEvent,
  setNewArenaEvent,
  setArenaEvents,
  setCurrentView,
  setCurrentTab
}) {
  const handleCreateArenaEvent = async (e) => {
    e.preventDefault();
    
    // Inserción real a Supabase
    const { data, error } = await supabase
      .from('arena_events')
      .insert([{
        organization_id: user.id,
        title: newArenaEvent.title,
        description: newArenaEvent.description,
        start_date: newArenaEvent.date,
        end_date: newArenaEvent.date,
        team_mode: newArenaEvent.teamMode,
        status: 'active'
      }])
      .select();

    if (error) {
      alert("Error al programar el evento: " + error.message);
      return;
    }

    alert("Mini-Hackathon programada exitosamente.");
    setArenaEvents((prev) => [data[0], ...prev]);
    setCurrentView('dashboard');
    setCurrentTab('arena');
  };

  const handleArenaTrackChange = (track) => {
    const tracks = newArenaEvent.tracks;
    const updatedTracks = tracks.includes(track) 
      ? tracks.filter(t => t !== track) 
      : [...tracks, track];
    setNewArenaEvent({ ...newArenaEvent, tracks: updatedTracks });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
      <button onClick={() => { setCurrentView('dashboard'); setCurrentTab('arena'); }} className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} /> Volver a la Arena
      </button>
      
      <h2 className="text-xl font-black text-gray-950 dark:text-white mb-6 uppercase tracking-wider">Programar Mini-Hackathon</h2>
      
      <form onSubmit={handleCreateArenaEvent} className="space-y-5">
        <input type="text" placeholder="Título del Evento (Ej. Datathon Finanzas 2026)" value={newArenaEvent.title} onChange={(e)=>setNewArenaEvent({...newArenaEvent, title: e.target.value})} className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-900 outline-none" required />
        
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <label className="block text-xs font-bold text-gray-950 dark:text-gray-200 mb-3">Tracks Involucrados</label>
          <div className="flex flex-wrap gap-2">
            {TRACKS.map(track => (
              <label key={track} className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer text-xs font-medium">
                <input type="checkbox" checked={newArenaEvent.tracks.includes(track)} onChange={() => handleArenaTrackChange(track)} className="accent-blue-900" />
                {track}
              </label>
            ))}
          </div>
        </div>

        <textarea placeholder="Descripción del escenario o crisis..." value={newArenaEvent.description} onChange={(e)=>setNewArenaEvent({...newArenaEvent, description: e.target.value})} className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-900 outline-none" rows="4" required />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" value={newArenaEvent.date} onChange={(e)=>setNewArenaEvent({...newArenaEvent, date: e.target.value})} className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-900 outline-none" required />
          <select value={newArenaEvent.teamMode} onChange={(e)=>setNewArenaEvent({...newArenaEvent, teamMode: e.target.value})} className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-900 outline-none">
            <option value="both">Solo y Equipos</option>
            <option value="team">Solo Equipos</option>
            <option value="solo">Solo Individual</option>
          </select>
        </div>

        <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-md font-bold text-sm transition-colors shadow-sm">Lanzar a la Arena</button>
      </form>
    </div>
  );
}

// ==========================================
// VISTA 2: POSTULAR A UN EVENTO (ESTUDIANTES)
// ==========================================
export function ApplyArenaView({ selectedArenaEvent, arenaApplyMode, setCurrentView }) {
  if (!selectedArenaEvent) return null;
  
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
      <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} /> Volver a la Arena
      </button>

      <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
        <h2 className="text-xl font-black text-gray-950 dark:text-white mb-1">{selectedArenaEvent.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Organizado por {selectedArenaEvent.company || 'Empresa Aura'}</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); alert('Postulación enviada.'); setCurrentView('dashboard'); }} className="space-y-6">
        
        {/* Box informativo de modalidad */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-md border border-gray-200 dark:border-gray-700">
           <h3 className="text-sm font-black uppercase text-gray-950 dark:text-white mb-2 flex items-center gap-2">
             {arenaApplyMode === 'solo' ? <User size={16}/> : <Users size={16}/>} 
             Modalidad: {arenaApplyMode === 'solo' ? 'Individual' : arenaApplyMode === 'team' ? 'Equipo Propio' : 'Equipo Aleatorio'}
           </h3>
           <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
             {arenaApplyMode === 'solo' && "Competirás solo. Deberás entregar la solución completa individualmente."}
             {arenaApplyMode === 'team' && "Crearás o te unirás a un equipo existente. Asegúrate de tener los códigos de equipo."}
             {arenaApplyMode === 'random' && "Nuestro algoritmo te agrupará con otros estudiantes para fomentar la multidisciplinariedad."}
           </p>
        </div>

        {arenaApplyMode === 'team' && (
          <div className="space-y-4">
             <input type="text" placeholder="Nombre de tu Equipo" className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-blue-900" required />
          </div>
        )}

        <textarea placeholder="Carta de motivación (Opcional)" className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-blue-900" rows="3" />

        <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-md font-bold text-sm transition-colors shadow-sm">
          Confirmar Inscripción
        </button>
      </form>
    </div>
  );
}