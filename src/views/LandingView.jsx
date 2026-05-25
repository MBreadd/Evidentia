import React from 'react';

export default function LandingView({ setCurrentView }) {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* Elementos decorativos de fondo (Glows) */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl text-center mt-10">
        
        {/* Etiqueta animada superior */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm mb-8 border border-blue-200 dark:border-blue-800/50 backdrop-blur-sm shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Conectando el talento del futuro
        </div>

        {/* Título principal con gradiente */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold mb-6 tracking-tighter">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            EVIDENTIA
          </span>
        </h1>

        {/* Subtítulo mejorado */}
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 font-medium leading-relaxed max-w-2xl mx-auto">
          La plataforma donde el talento joven resuelve retos reales y las empresas descubren a los líderes del mañana.
        </p>
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button 
            onClick={() => setCurrentView('login')}
            className="w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-2 border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 rounded-xl font-bold text-lg hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
          >
            Iniciar Sesión
          </button>
          
          <button 
            onClick={() => setCurrentView('onboarding_role')}
            className="w-full sm:w-auto group relative px-8 py-4 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Regístrate ahora
              {/* Icono de flecha que se mueve en el hover */}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </button>
        </div>

        {/* Social Proof / Estadísticas de confianza (Opcional, pero da mucha presencia) */}
        <div className="mt-20 pt-8 border-t border-slate-200 dark:border-gray-800/60 flex flex-wrap justify-center gap-10 sm:gap-16 text-slate-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-3xl font-black text-slate-800 dark:text-gray-200 mb-1">+500</p>
            <p className="text-sm font-medium uppercase tracking-wider">Empresas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-slate-800 dark:text-gray-200 mb-1">+10k</p>
            <p className="text-sm font-medium uppercase tracking-wider">Talentos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-slate-800 dark:text-gray-200 mb-1">+1k</p>
            <p className="text-sm font-medium uppercase tracking-wider">Retos</p>
          </div>
        </div>

      </div>
    </div>
  );
}