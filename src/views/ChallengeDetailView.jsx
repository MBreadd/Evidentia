import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, Send, UploadCloud, FileText, Calendar, Award, 
  Code2, Building2, AlertTriangle, Users, Eye, CheckCircle, 
  ChevronDown, ChevronUp, Shield, Briefcase, X, FileBadge, Check, ExternalLink
} from 'lucide-react';

const PLAGIARISM_ALERT_STYLE = {
  border: '1px solid #ef4444',
  background: 'rgba(239,68,68,0.1)',
  padding: '8px 12px',
  color: '#ef4444',
  fontFamily: 'monospace',
  fontSize: '11px',
};

export default function ChallengeDetailView({ selectedChallenge, setCurrentView, user }) {
  // Estados para Estudiantes
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [existingAsset, setExistingAsset] = useState(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  // Estados para Organización
  const [submissions, setSubmissions] = useState([]);
  const [evaluationsMap, setEvaluationsMap] = useState({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [evalForms, setEvalForms] = useState({});
  const [savingEval, setSavingEval] = useState({});
  
  // Estado para pestañas y Modal de Revisión
  const [orgTab, setOrgTab] = useState('details'); 
  const [activeReview, setActiveReview] = useState(null);

  // Datos del Reto
  const [orgName, setOrgName] = useState(
    selectedChallenge?.profiles?.full_name || selectedChallenge?.organization || 'Organización'
  );

  const isOrganizationUser = user?.role === 'organization' || user?.role === 'organization';
  const canManageChallenge = isOrganizationUser && !!selectedChallenge?.organization_id && selectedChallenge.organization_id === user?.id;
  const tags = selectedChallenge?.tech_stack ? selectedChallenge.tech_stack.split(',').map(t => t.trim()).filter(Boolean) : [];

  const formatDate = (dateString) => {
    if (!dateString) return 'Siempre Abierto';
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // --- LÓGICA DE ORGANIZACIÓN ---
  const loadEvaluations = useCallback(async (submissionIds) => {
    if (!submissionIds.length) {
      setEvaluationsMap({});
      return;
    }
    const { data: evals, error } = await supabase
      .from('evaluations')
      .select('id, submission_id, score, textual_feedback, plagiarism_flag, ai_summary')
      .in('submission_id', submissionIds);
    
    if (error) {
      console.error('Error cargando evaluaciones:', error);
      return;
    }
    const map = {};
    (evals || []).forEach((ev) => { map[ev.submission_id] = ev; });
    setEvaluationsMap(map);
  }, []);

  const loadorganizationSubmissions = useCallback(async () => {
    if (!canManageChallenge || !selectedChallenge?.id) return;
    setLoadingSubmissions(true);
    try {
      const { data: subs, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('challenge_id', selectedChallenge.id)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;

      const list = subs || [];
      if (list.length > 0) {
        const userIds = [...new Set(list.map((s) => s.user_id).filter(Boolean))];
        const [{ data: profiles }, { data: assets }] = await Promise.all([
          userIds.length ? supabase.from('profiles').select('id, full_name, career, avatar_url').in('id', userIds) : Promise.resolve({ data: [] }),
          supabase.from('submission_assets').select('*').in('submission_id', list.map((s) => s.id)),
        ]);

        const profileMap = {};
        (profiles || []).forEach((p) => { profileMap[p.id] = p; });
        
        // Mejoramos la asignación de assets
        const assetMap = {};
        if (assets) {
          assets.forEach((a) => { assetMap[a.submission_id] = a; });
        }

        list.forEach((s) => {
          s.profiles = profileMap[s.user_id] || null;
          s._asset = assetMap[s.id] || null;
        });
      }

      setSubmissions(list);
      await loadEvaluations(list.map((s) => s.id));
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [canManageChallenge, selectedChallenge?.id, loadEvaluations]);

  // --- EFECTOS ---
  useEffect(() => {
    if (selectedChallenge?.organization?.full_name) {
      setOrgName(selectedChallenge.organization.full_name);
    } else if (selectedChallenge?.organization_id) {
      supabase.from('profiles').select('full_name').eq('id', selectedChallenge.organization_id).maybeSingle()
        .then(({ data }) => { if (data?.full_name) setOrgName(data.full_name); });
    }
  }, [selectedChallenge]);

  useEffect(() => {
    if (user?.role !== 'student' || !selectedChallenge?.id) {
      setCheckingSubmission(false);
      return;
    }
    const check = async () => {
      try {
        const { data: sub, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('challenge_id', selectedChallenge.id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (sub) {
          setExistingSubmission(sub);
          const { data: asset } = await supabase.from('submission_assets').select('*').eq('submission_id', sub.id).eq('type', 'pdf').maybeSingle();
          if (asset) setExistingAsset(asset);
        }
      } catch (err) {
        console.error('Error checking submission:', err);
      } finally {
        setCheckingSubmission(false);
      }
    };
    check();
  }, [user, selectedChallenge]);

  useEffect(() => { loadorganizationSubmissions(); }, [loadorganizationSubmissions]);

  // --- MANEJADORES DE EVENTOS ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
  };

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!selectedChallenge?.id) return setErrorMsg('Reto no válido.');
    if (!executiveSummary.trim()) return setErrorMsg('El resumen ejecutivo es obligatorio.');
    if (!pdfFile) return setErrorMsg('Es obligatorio adjuntar tu propuesta en formato PDF.');

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Debes iniciar sesión para enviar.');

      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${session.user.id}_${selectedChallenge.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('submissions').upload(fileName, pdfFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
      const pdfUrl = urlData.publicUrl;

      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .insert([{
          challenge_id: selectedChallenge.id,
          user_id: session.user.id,
          executive_summary: executiveSummary.trim(),
          status: 'submitted',
        }])
        .select()
        .single();
      if (subError) throw subError;

      const { error: assetError } = await supabase.from('submission_assets').insert([{ submission_id: subData.id, type: 'pdf', url: pdfUrl }]);
      if (assetError) throw assetError;

      setExistingAsset({ url: pdfUrl, type: 'pdf' });
      setExistingSubmission(subData);

    } catch (error) {
      console.error('Error al procesar la entrega:', error);
      setErrorMsg('Ocurrió un error al procesar el envío: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEval = async (submissionId) => {
    const form = evalForms[submissionId];
    const scoreNum = Number(form?.score);
    if (form?.score === '' || form?.score === undefined || Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      alert('Ingresa un puntaje válido entre 0 y 100.');
      return;
    }

    setSavingEval((p) => ({ ...p, [submissionId]: true }));
    try {
      const existing = evaluationsMap[submissionId];
      const evalPayload = { submission_id: submissionId, evaluator_user_id: user.id, score: scoreNum, textual_feedback: form.feedback || '' };

      if (existing?.id) {
        await supabase.from('evaluations').update(evalPayload).eq('id', existing.id).throwOnError();
      } else {
        await supabase.from('evaluations').insert([evalPayload]).throwOnError();
      }

      await supabase.from('submissions').update({ status: 'approved' }).eq('id', submissionId).throwOnError();
      
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, status: 'approved' } : s)));
      await loadEvaluations(submissions.map((s) => s.id));
      
      setTimeout(() => setSavingEval((p) => ({ ...p, [submissionId]: false })), 500);
    } catch (err) {
      console.error('Error saving evaluation:', err);
      alert('Error: ' + err.message);
      setSavingEval((p) => ({ ...p, [submissionId]: false }));
    }
  };

  const openReviewModal = (sub) => {
    const evaluation = evaluationsMap[sub.id];
    if (!evalForms[sub.id]) {
      setEvalForms((p) => ({ 
        ...p, 
        [sub.id]: { score: evaluation?.score ?? '', feedback: evaluation?.textual_feedback || '' } 
      }));
    }
    setActiveReview(sub);
  };

  if (!selectedChallenge) {
    return (
      <div className="text-center py-12">
        <button onClick={() => setCurrentView('dashboard')} className="px-5 py-2 bg-blue-950 dark:bg-blue-900 text-white rounded-lg font-bold">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans bg-white dark:bg-[#0a0a0a] min-h-screen">
      
      {/* MODAL DE REVISIÓN SPLIT-SCREEN */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                  {activeReview.profiles?.avatar_url ? (
                    <img src={activeReview.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-blue-700 dark:text-blue-300">{(activeReview.profiles?.full_name || '?')[0].toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white leading-tight">Revisión: {activeReview.profiles?.full_name || 'Estudiante'}</h3>
                  <p className="text-xs text-gray-500 font-medium">Enviado el {formatDate(activeReview.submitted_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {activeReview._asset?.url && (
                  <a href={activeReview._asset.url} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    <ExternalLink size={16} /> Abrir PDF
                  </a>
                )}
                <button onClick={() => setActiveReview(null)} className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors ml-2">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              
              {/* Panel Izquierdo */}
              <div className="w-full lg:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto p-6 flex flex-col gap-6">
                
                {evaluationsMap[activeReview.id]?.plagiarism_flag && (
                  <div style={PLAGIARISM_ALERT_STYLE} className="rounded-lg flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle size={16} /> ADVERTENCIA DE SIMILITUD
                    </div>
                    <p className="text-xs text-gray-900 dark:text-gray-300 font-sans">
                      {evaluationsMap[activeReview.id].ai_summary || 'Revisar entrega manual. Posible coincidencia con otras fuentes.'}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText size={14} /> Resumen Ejecutivo
                  </h4>
                  {/* CORRECCIÓN: break-words y overflow-x-hidden para que crezca verticalmente */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words overflow-x-hidden shadow-inner max-h-[300px] overflow-y-auto">
                    {activeReview.executive_summary || 'No se adjuntó resumen.'}
                  </div>
                </div>

                <div className="mt-auto bg-blue-50 dark:bg-gray-800 p-5 rounded-xl border border-blue-100 dark:border-gray-700">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award size={18} className="text-blue-600 dark:text-blue-400" /> Calificar Propuesta
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Puntaje Final (0-20)</label>
                      <input 
                        type="number" min="0" max="20" 
                        value={evalForms[activeReview.id]?.score || ''} 
                        onChange={(e) => setEvalForms((p) => ({ ...p, [activeReview.id]: { ...p[activeReview.id], score: e.target.value } }))} 
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-black text-blue-950 dark:text-blue-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Feedback Técnico</label>
                      <textarea 
                        value={evalForms[activeReview.id]?.feedback || ''} 
                        placeholder="Detalla los puntos fuertes y oportunidades de mejora..." 
                        onChange={(e) => setEvalForms((p) => ({ ...p, [activeReview.id]: { ...p[activeReview.id], feedback: e.target.value } }))} 
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                      />
                    </div>
                    <button 
                      onClick={() => handleSaveEval(activeReview.id)} 
                      disabled={savingEval[activeReview.id]} 
                      className={`w-full py-3 text-white text-sm font-black uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-2 ${savingEval[activeReview.id] ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'}`}
                    >
                      {savingEval[activeReview.id] ? <><Check size={18}/> Guardado</> : (evaluationsMap[activeReview.id]?.score != null ? 'Actualizar Evaluación' : 'Guardar Evaluación')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel Derecho: Visor de PDF */}
              <div className="w-full lg:w-2/3 bg-gray-100 dark:bg-black relative">
                {activeReview._asset?.url ? (
                  <iframe 
                    src={activeReview._asset.url} 
                    className="w-full h-full border-0" 
                    title="PDF Viewer"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-3 p-6 text-center">
                    <FileText size={48} className="opacity-20" />
                    <p className="font-bold text-gray-700 dark:text-gray-300">No se pudo cargar el archivo PDF.</p>
                    <p className="text-xs max-w-sm">Si el estudiante lo subió, verifica que las políticas de seguridad (RLS) en tu base de datos permitan a la empresa leer la tabla <code>submission_assets</code>.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white transition-colors mb-6 uppercase tracking-wider">
        <ArrowLeft size={16} /> Volver al panel
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          
          {canManageChallenge && (
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-2">
              <button 
                onClick={() => setOrgTab('details')}
                className={`pb-3 text-sm font-black uppercase tracking-wider transition-colors ${orgTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                Detalles del Reto
              </button>
              <button 
                onClick={() => setOrgTab('submissions')}
                className={`pb-3 text-sm font-black uppercase tracking-wider transition-colors flex items-center gap-2 ${orgTab === 'submissions' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
              >
                <FileBadge size={16} /> Entregas Recibidas ({submissions.length})
              </button>
            </div>
          )}

          {(!canManageChallenge || orgTab === 'details') && (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 rounded-lg text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800/50">
                    Nivel {selectedChallenge.difficulty || 'Intermedio'}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-gray-950 dark:text-white tracking-tight leading-tight mb-4">
                  {selectedChallenge.title}
                </h1>
              </header>
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Briefcase size={16} className="text-gray-400" /> Contexto y Desafío
                  </h3>
                  {/* CORRECCIÓN: break-words en la descripción principal */}
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-x-hidden">
                    {selectedChallenge.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(canManageChallenge && orgTab === 'submissions') && (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Panel de Evaluaciones</h2>
                  <p className="text-sm text-gray-500">Selecciona una entrega para revisar los detalles y calificar.</p>
                </div>
                <button onClick={() => loadorganizationSubmissions()} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2">
                  Actualizar Datos
                </button>
              </div>

              {loadingSubmissions ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 dark:border-blue-400" /></div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <Users size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Aún no hay entregas para este reto.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submissions.map((sub) => {
                    const evaluation = evaluationsMap[sub.id];

                    return (
                      <div key={sub.id} className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                              {sub.profiles?.avatar_url ? (
                                <img src={sub.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-black text-blue-700 dark:text-blue-300">{(sub.profiles?.full_name || '?')[0].toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{sub.profiles?.full_name || 'Estudiante'}</p>
                              <p className="text-xs text-gray-500 font-medium">{formatDate(sub.submitted_at)}</p>
                            </div>
                            {evaluation?.score != null && (
                              <div className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-1 rounded-lg text-xs font-black border border-green-200 dark:border-green-800">
                                Nota: {evaluation.score}
                              </div>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={() => openReviewModal(sub)} 
                          className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors mt-2"
                        >
                          <Eye size={16} /> Abrir Revisión Completa
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 hidden lg:block">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cierre</p>
                <p className="text-sm font-black text-gray-950 dark:text-white">{formatDate(selectedChallenge.deadline)}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}