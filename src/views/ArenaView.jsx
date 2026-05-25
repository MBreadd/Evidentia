import React from 'react';
import { supabase } from '../supabaseClient';

// ==========================================
// VISTA 1: CREAR UN EVENTO ARENA (EMPRESAS)
// ==========================================
export function CreateArenaView({
  user,
  newArenaEvent,
  setNewArenaEvent,
  arenaEvents,
  setArenaEvents,
  setCurrentView,
  setCurrentTab
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCreateArenaEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Creating arena event with data:', newArenaEvent);
      console.log('User:', user);

      const { data, error } = await supabase
        .from('arena_events')
        .insert([{
          title: newArenaEvent.title,
          description: newArenaEvent.description,
          start_date: newArenaEvent.date,
          end_date: newArenaEvent.date, // Usar la misma fecha por ahora
          team_mode: newArenaEvent.teamMode,
          status: 'active',
          organization_id: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating arena event:', error);
        throw error;
      }

      console.log('Arena event created successfully:', data);

      setArenaEvents([data, ...arenaEvents]);
      setNewArenaEvent({ title: '', date: '', description: '', teamMode: 'both' });
      setCurrentView('dashboard');
      setCurrentTab('arena');
      alert("Mini-Hackathon programada exitosamente.");
    } catch (err) {
      console.error('Error al crear evento:', err);
      alert('Error al crear el evento: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-none">
      <button onClick={() => { setCurrentView('dashboard'); setCurrentTab('arena'); }} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 mb-6 font-medium">
        ← Volver a la Arena
      </button>
      <h2 className="text-2xl font-bold text-gray-950 dark:text-gray-50 mb-6">Programar una Mini-Hackathon</h2>
      
      <form onSubmit={handleCreateArenaEvent} className="space-y-4">
        <input type="text" placeholder="Título del Evento (Ej. Datathon Finanzas 2026)" value={newArenaEvent.title} onChange={(e)=>setNewArenaEvent({...newArenaEvent, title: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />

        <textarea placeholder="Descripción del escenario o crisis..." value={newArenaEvent.description} onChange={(e)=>setNewArenaEvent({...newArenaEvent, description: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" rows="4" required />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-400 mb-1">Fecha de Lanzamiento</label>
            <input type="date" value={newArenaEvent.date} onChange={(e)=>setNewArenaEvent({...newArenaEvent, date: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-400 mb-1">Modalidad Permitida</label>
            <select value={newArenaEvent.teamMode} onChange={(e)=>setNewArenaEvent({...newArenaEvent, teamMode: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="both">Solo y Equipos</option>
              <option value="team">Solo Equipos</option>
              <option value="solo">Solo Individual</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={`w-full bg-blue-950 dark:bg-blue-900 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-900 dark:hover:bg-blue-800 transition shadow-none mt-4 text-lg ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {isSubmitting ? 'Publicando...' : 'Lanzar a la Arena'}
        </button>
      </form>
    </div>
  );
}

// ==========================================
// VISTA 2: POSTULAR A UN EVENTO (ESTUDIANTES)
// ==========================================
export function ApplyArenaView({
  selectedArenaEvent,
  arenaApplyMode,
  setCurrentView
}) {
  if (!selectedArenaEvent) return null;
  
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-none">
      <button onClick={() => setCurrentView('dashboard')} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 mb-6 font-medium">
        ← Cancelar y volver
      </button>
      <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
        <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-3 inline-block border border-blue-200 dark:border-blue-800/50">Postulación a Mini-Hackathon</span>
        <h2 className="text-2xl font-black text-gray-950 dark:text-gray-50 mb-2">{selectedArenaEvent.title}</h2>
        <p className="text-gray-700 dark:text-gray-400 font-medium">Organizado por {selectedArenaEvent.company}</p>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        alert('¡Postulación enviada exitosamente! Te notificaremos los siguientes pasos.');
        setCurrentView('dashboard');
      }} className="space-y-6">
        
        {arenaApplyMode === 'solo' && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800/50">
            <h3 className="font-bold text-blue-950 dark:text-blue-300 mb-2">Modalidad: Participación Individual</h3>
            <p className="text-blue-900 dark:text-blue-400 text-sm">Competirás por tu cuenta en este evento. Deberás entregar la solución completa en el plazo establecido.</p>
          </div>
        )}

        {arenaApplyMode === 'team' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800/50 mb-4">
              <h3 className="font-bold text-blue-950 dark:text-blue-300 mb-2">Modalidad: Equipo Propio</h3>
              <p className="text-blue-900 dark:text-blue-400 text-sm">Crea tu equipo e invita a tus amigos usando sus correos o alias de Aura.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-1">Nombre del Equipo</label>
              <input type="text" placeholder="Ej. Los Hackers del Sur" className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-1">Invitaciones (Correos)</label>
              <input type="text" placeholder="amigo1@email.com, amigo2@email.com" className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
          </div>
        )}

        {arenaApplyMode === 'random' && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800/50">
            <h3 className="font-bold text-blue-950 dark:text-blue-300 mb-2 text-lg flex items-center gap-2">🎲 Modalidad: Equipo Aleatorio</h3>
            <p className="text-blue-900 dark:text-blue-400 text-sm leading-relaxed">
              ¡Excelente elección para demostrar tus habilidades blandas! 
              Al confirmar, nuestro algoritmo te agrupará con 2 o 3 estudiantes de diferentes carreras (Tracks) para fomentar la multidisciplinariedad.
              <br/><br/>
              <strong>Importante:</strong> Al finalizar, tus compañeros evaluarán tu liderazgo, comunicación y trabajo en equipo.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-950 dark:text-gray-50 mb-2">Carta de Motivación (Opcional pero recomendado)</label>
          <textarea placeholder="¿Por qué quieres participar en este evento?" className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-gray-500 outline-none" rows="3" />
        </div>

        <button type="submit" className="w-full bg-blue-950 dark:bg-blue-900 text-white py-4 rounded-lg font-bold hover:bg-blue-900 dark:hover:bg-blue-800 transition shadow-none text-lg">
          Confirmar Inscripción
        </button>
      </form>
    </div>
  );
}