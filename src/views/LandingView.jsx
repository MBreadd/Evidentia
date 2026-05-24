import React from 'react';

export default function LandingView({ setCurrentView }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold text-blue-950 dark:text-blue-400 mb-4 tracking-tight">
          AURA
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-400 mb-10 font-medium">
          La plataforma donde el talento joven resuelve retos reales y las empresas descubren a los líderes del mañana.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => setCurrentView('login')}
            className="px-8 py-4 bg-white dark:bg-gray-900 border-2 border-blue-950 dark:border-blue-600 text-blue-950 dark:text-blue-400 rounded-lg font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-none"
          >
            Iniciar Sesión
          </button>
          
          <button 
            onClick={() => setCurrentView('onboarding_role')}
            className="px-8 py-4 bg-blue-950 dark:bg-blue-900 text-white rounded-lg font-bold text-lg hover:bg-blue-900 dark:hover:bg-blue-800 transition shadow-none"
          >
            Registrarse
          </button>
        </div>
      </div>
    </div>
  );
}