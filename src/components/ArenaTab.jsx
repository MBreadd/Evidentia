import React, { useState, useEffect } from 'react';
import { Flame, Clock, Users, Trophy, Search, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useArenaEvents } from '../useArenaEvents';

export default function ArenaTab({ user, setCurrentView, setSelectedArenaEvent }) {
  // ==========================================
  // Estados
  // ==========================================
  const { events, loading, error, fetchEvents } = useArenaEvents();
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [participations, setParticipations] = useState([]);
  const [teamForm, setTeamForm] = useState({ teamName: '', selectedEvent: null });
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);

  // ==========================================
  // Efectos
  // ==========================================
  useEffect(() => {
    fetchEvents();
    fetchUserParticipations();
  }, [user.id]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedFilter]);

  // ==========================================
  // Funciones
  // ==========================================
  const fetchUserParticipations = async () => {
    try {
      const { data, error } = await supabase
        .from('arena_participants')
        .select('*, event:arena_events(*), team:arena_teams(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setParticipations(data || []);
    } catch (err) {
      console.error('Error cargando participaciones:', err);
    }
  };

  const filterEvents = () => {
    let filtered = events || [];

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(e => e.status === selectedFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const handleJoinSolo = async (event) => {
    try {
      // Verificar si el usuario ya es participante
      const { data: existing, error: checkError } = await supabase
        .from('arena_participants')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        alert('Ya estás registrado en este evento.');
        return;
      }

      const { error } = await supabase.from('arena_participants').insert({
        event_id: event.id,
        user_id: user.id,
        participation_mode: 'solo',
      });

      if (error) throw error;

      alert('¡Te has unido al evento!');
      fetchUserParticipations();
      fetchEvents();
    } catch (err) {
      alert('Error al unirse: ' + err.message);
    }
  };

  const handleCreateTeam = async (event) => {
    if (!teamForm.teamName.trim()) {
      alert('Ingresa un nombre para el equipo');
      return;
    }

    setCreatingTeam(true);
    try {
      // Verificar si el usuario ya es participante
      const { data: existing, error: checkError } = await supabase
        .from('arena_participants')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        alert('Ya estás registrado en este evento.');
        return;
      }

      const { data: team, error: teamError } = await supabase
        .from('arena_teams')
        .insert([{
          event_id: event.id,
          team_name: teamForm.teamName,
          team_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          creator_id: user.id,
          max_members: event.max_team_size || 4,
        }])
        .select()
        .single();

      if (teamError) throw teamError;

      const { error: memberError } = await supabase
        .from('arena_team_members')
        .insert({
          team_id: team.id,
          member_id: user.id,
        });

      if (memberError) throw memberError;

      const { error: participError } = await supabase
        .from('arena_participants')
        .insert({
          event_id: event.id,
          user_id: user.id,
          team_id: team.id,
          participation_mode: 'team',
        });

      if (participError) throw participError;

      alert(`¡Equipo creado! Código: ${teamCode}`);
      setShowTeamForm(false);
      setTeamForm({ teamName: '', selectedEvent: null });
      fetchUserParticipations();
      fetchEvents();
    } catch (err) {
      alert('Error creando equipo: ' + err.message);
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleJoinRandom = async (event) => {
    try {
      // Verificar si el usuario ya es participante
      const { data: existing, error: checkError } = await supabase
        .from('arena_participants')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        alert('Ya estás registrado en este evento.');
        return;
      }

      const { error } = await supabase.from('arena_participants').insert({
        event_id: event.id,
        user_id: user.id,
        participation_mode: 'random',
      });

      if (error) throw error;

      alert('¡Te has unido a un equipo aleatorio!');
      fetchUserParticipations();
      fetchEvents();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // ==========================================
  // Sub-componente: Tarjeta de Evento
  // ==========================================
  const EventCard = ({ event }) => {
    const isUserParticipating = participations.some(p => p.event_id === event.id);
    const userParticipation = participations.find(p => p.event_id === event.id);
    const now = new Date();
    const eventStart = new Date(event.start_date);
    const eventEnd = new Date(event.end_date);
    const isOngoing = now >= eventStart && now <= eventEnd;
    const isFinished = now > eventEnd;
    const daysLeft = Math.ceil((eventEnd - now) / (1000 * 60 * 60 * 24));

    return (
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors overflow-hidden shadow-none">
        {event.image_url && (
          <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-between items-start mb-3 gap-2">
            <div className="flex gap-2">
              {isOngoing && (
                <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-md text-xs font-bold animate-pulse border border-red-200 dark:border-red-800/50">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span> EN VIVO
                </span>
              )}
              {isFinished && (
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-md text-xs font-bold">FINALIZADO</span>
              )}
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-950 dark:text-gray-50 mb-2">{event.title}</h3>

          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock size={16} className="text-blue-600 dark:text-blue-400" />
              <span>{daysLeft > 0 ? `${daysLeft} días` : 'Finalizado'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users size={16} className="text-blue-600 dark:text-blue-400" />
              <span>{participations.filter(p => p.event_id === event.id).length} participantes</span>
            </div>
            {event.prize_pool && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 col-span-2">
                <Trophy size={16} className="text-blue-600 dark:text-blue-400" />
                <span>{event.prize_pool}</span>
              </div>
            )}
          </div>

          {isUserParticipating ? (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-center">
              <p className="text-blue-900 dark:text-blue-300 font-bold text-sm">
                ✓ Ya estás registrado
                {userParticipation?.participation_mode === 'team' && ` en equipo: ${userParticipation?.team?.team_name}`}
              </p>
            </div>
          ) : isFinished ? (
            <button className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-2 rounded-lg font-bold cursor-not-allowed text-sm">
              Evento Finalizado
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleJoinSolo(event)}
                className="w-full bg-blue-950 dark:bg-blue-900 text-white py-2 rounded-lg font-bold hover:bg-blue-900 dark:hover:bg-blue-800 transition text-sm"
              >
                Postular (Solo)
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTeamForm({ ...teamForm, selectedEvent: event.id });
                    setShowTeamForm(true);
                  }}
                  className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 py-2 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm"
                >
                  <Plus size={16} className="inline mr-1" /> Crear Equipo
                </button>
                <button
                  onClick={() => handleJoinRandom(event)}
                  className="flex-1 bg-gray-900 dark:bg-gray-800 text-white py-2 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-700 transition text-sm"
                  title="Se te asignará un equipo aleatorio"
                >
                  🎲 Aleatorio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // Renderizado Principal
  // ==========================================
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-blue-950 p-8 rounded-xl text-white shadow-none border border-blue-800 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
            <Flame size={32} /> EVIDENTIA ARENA
          </h2>
          <p className="text-blue-100 max-w-xl">
            Eventos con límite de tiempo. Compite solo, con tus amigos o en{' '}
            <span className="font-bold underline">equipos aleatorios</span> para demostrar tus habilidades técnicas y ganar premios.
          </p>
        </div>
        <div className="absolute top-0 right-0 opacity-5 text-9xl -mt-10 -mr-10">⚔️</div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-600" />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'finished'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                selectedFilter === filter
                  ? 'bg-blue-950 dark:bg-blue-900 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activos' : 'Finalizados'}
            </button>
          ))}
        </div>
      </div>

      {showTeamForm && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-4">Crear Nuevo Equipo</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre del equipo..."
              value={teamForm.teamName}
              onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })}
              className="flex-1 px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={() => handleCreateTeam({ id: teamForm.selectedEvent })}
              disabled={creatingTeam}
              className="bg-blue-950 dark:bg-blue-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-900 dark:hover:bg-blue-800 disabled:opacity-70 transition"
            >
              {creatingTeam ? 'Creando...' : 'Crear'}
            </button>
            <button
              onClick={() => setShowTeamForm(false)}
              className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando eventos...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 p-4 rounded-lg text-red-700 dark:text-red-300">
          Error: {error}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
          <Search size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No hay eventos disponibles</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Vuelve más tarde para nuevos desafíos.</p>
        </div>
      )}

      {!loading && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
