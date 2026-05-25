import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function LoginView({ loginForm, setLoginForm, setCurrentView, setUser }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (error) {
      setIsLoading(false);
      setErrorMsg(error.message.includes('Invalid login credentials') 
        ? 'El correo o la contraseña son incorrectos.' 
        : error.message);
    } 
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    // No necesitamos nada más aquí.
  };
  // Función para ver si el usuario ya llenó sus datos en la base de datos
  const checkProfileAndRedirect = async (userId) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setIsLoading(false);

    if (profile) {
      setUser({ id: userId, ...profile });
      setCurrentView('dashboard');
    } else {
      // Si se logueó pero no tiene perfil, lo mandamos a completar datos
      setCurrentView('onboarding_role');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl w-full max-w-md border border-gray-200 dark:border-gray-800">
        
        <button onClick={() => setCurrentView('landing')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-950 dark:hover:text-blue-400 mb-6 flex items-center gap-1">
          ← Volver al inicio
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-950 dark:text-gray-50">Bienvenido de vuelta</h2>
          <p className="text-gray-700 dark:text-gray-400 mt-2">Ingresa a tu cuenta de Evidentia</p>
        </div>
        
        <div className="space-y-3 mb-6">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-none">
            Continuar con Google
          </button>
        </div>

        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          <span className="flex-shrink-0 mx-4 text-gray-600 dark:text-gray-500 text-sm">O con correo electrónico</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm mb-4 border border-red-200 dark:border-red-800/50 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-950 dark:text-gray-50 mb-1">Correo Electrónico</label>
            <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-950 dark:text-gray-50 mb-1">Contraseña</label>
            <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-blue-950 dark:bg-blue-900 text-white p-3 rounded-lg font-bold hover:bg-blue-900 dark:hover:bg-blue-800 transition shadow-none disabled:opacity-70">
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

      </div>
    </div>
  );
}