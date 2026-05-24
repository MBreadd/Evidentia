import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Shield, Send, UploadCloud, FileText, Calendar, Award, Code2, Building2, Briefcase } from 'lucide-react';

export default function ChallengeDetailView({ selectedChallenge, setCurrentView, user }) {
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!selectedChallenge) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 font-medium">No se ha seleccionado ningún reto.</p>
        <button onClick={() => setCurrentView('dashboard')} className="mt-4 px-5 py-2 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800 transition shadow-sm">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrorMsg('El archivo debe ser un formato PDF estricto.');
        setPdfFile(null);
      } else if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('El documento no debe exceder los 10MB.');
        setPdfFile(null);
      } else {
        setErrorMsg('');
        setPdfFile(file);
      }
    }
  };

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setErrorMsg("Es obligatorio adjuntar tu propuesta en formato PDF.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${user.id}_${selectedChallenge.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);
      
      const pdfUrl = publicUrlData.publicUrl;

      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .insert([{
          challenge_id: selectedChallenge.id,
          user_id: user.id, 
          executive_summary: executiveSummary,
          status: 'submitted' 
        }])
        .select()
        .single();

      if (subError) throw subError;

      if (pdfUrl && subData) {
        const { error: assetError } = await supabase
          .from('submission_assets')
          .insert([{
            submission_id: subData.id,
            type: 'pdf', 
            url: pdfUrl
          }]);

        if (assetError) throw assetError;
      }

      alert("¡Tu propuesta técnica ha sido cargada con éxito en el sistema!");
      setCurrentView('dashboard');

    } catch (error) {
      console.error("Error al procesar la entrega:", error);
      setErrorMsg("Ocurrió un error al procesar el envío: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Siempre Abierto';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Procesamiento de datos relacionales y nueva columna tech_stack
  const companyName = selectedChallenge.profiles?.full_name || selectedChallenge.company || 'Empresa Anónima';
  const tags = selectedChallenge.tech_stack ? selectedChallenge.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-sans bg-white dark:bg-[#0a0a0a] min-h-screen">
      {/* Navegación que respeta el Hash Router (al setear currentView el Router actualiza la URL) */}
      <button 
        onClick={() => setCurrentView('dashboard')}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Volver al panel
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMNA PRINCIPAL: Detalles del Reto */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
            
            {/* Cabecera Corporativa */}
            <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                <Building2 size={14} />
                <span>{companyName}</span>
                <span className="text-gray-300 dark:text-gray-700 mx-1">•</span>
                <span>Nivel {selectedChallenge.difficulty || 'Intermedio'}</span>
              </div>
              
              <h1 className="text-3xl font-black text-gray-950 dark:text-white tracking-tight leading-tight mb-4">
                {selectedChallenge.title}
              </h1>

              {/* Uso de la nueva columna tech_stack */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tech, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </header>
            
            {/* Cuerpos de Texto */}
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase size={16} className="text-gray-400" /> Contexto y Desafío
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {selectedChallenge.description}
                </p>
              </div>

              {selectedChallenge.technical_requirements && (
                <div>
                  <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Code2 size={16} className="text-gray-400" /> Requerimientos Detallados
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-5 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {selectedChallenge.technical_requirements}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA LATERAL: Metadata y Formulario */}
        <div className="space-y-6 lg:sticky lg:top-24">
          
          {/* Metadata Card */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Fecha de Cierre</p>
                <p className="text-sm font-black text-gray-950 dark:text-white">{formatDate(selectedChallenge.deadline)}</p>
              </div>
            </div>
            
            <div className="w-full h-px bg-gray-200 dark:bg-gray-800"></div>

            <div className="flex items-start gap-3">
              <Award size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Incentivo / Reconocimiento</p>
                <p className="text-sm font-black text-gray-950 dark:text-white">{selectedChallenge.reward || 'Certificación de Competencia'}</p>
              </div>
            </div>
          </div>

          {/* Formulario de entrega (Exclusivo Estudiantes) */}
          {user?.role === 'student' ? (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-black text-gray-950 dark:text-white mb-2 flex items-center gap-2">
                <Send size={18} className="text-gray-400" /> Entregar Solución
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">
                Tu documento será indexado y procesado para evaluación técnica y control de originalidad.
              </p>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded-md mb-4 font-medium border border-red-200 dark:border-red-800/50">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmitSolution} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-950 dark:text-gray-200 mb-2">
                    Reporte de Arquitectura (PDF) *
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-gray-300 dark:border-gray-700 rounded-md cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      {pdfFile ? (
                        <>
                          <FileText className="text-gray-950 dark:text-white mb-2" size={24} />
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 max-w-[200px] truncate">{pdfFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="text-gray-400 mb-2" size={24} />
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Seleccionar archivo</p>
                          <p className="text-xs text-gray-500 mt-1">PDF estricto (Máx. 10MB)</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-950 dark:text-gray-200 mb-2">
                    Resumen del Enfoque Técnico
                  </label>
                  <textarea
                    value={executiveSummary}
                    onChange={(e) => setExecutiveSummary(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-900 outline-none min-h-[90px] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    placeholder="Describe de forma concisa tu estrategia..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 text-white font-medium rounded-md shadow-sm transition-colors text-sm ${
                    isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  {isSubmitting ? 'Subiendo Documento...' : 'Confirmar Envío'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-md border border-gray-200 dark:border-gray-800 text-center shadow-sm">
              <Shield size={24} className="text-gray-400 mx-auto mb-3" />
              <h4 className="font-black text-gray-950 dark:text-white text-sm mb-1">Modo Auditoría</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Las empresas pueden supervisar el alcance del reto, pero la carga de entregables está restringida a talento verificado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}