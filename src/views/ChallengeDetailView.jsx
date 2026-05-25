import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, Send, UploadCloud, FileText, Calendar, Award, 
  Code2, Building2, AlertTriangle, Users, Eye, CheckCircle, 
  Star, ChevronDown, ChevronUp, Shield, Briefcase, X, FileBadge
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
  const [expandedEvalId, setExpandedEvalId] = useState(null);
  
  // NUEVO: Estado para pestañas y visor de PDF
  const [orgTab, setOrgTab] = useState('details'); // 'details' | 'submissions'
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);

  // Datos del Reto
  const [orgName, setOrgName] = useState(
    selectedChallenge?.profiles?.full_name || selectedChallenge?.company || 'Organización'
  );

  const isOrganizationUser = user?.role === 'organization' || user?.role === 'company';
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

  const loadCompanySubmissions = useCallback(async () => {
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
        const assetMap = {};
        (assets || []).forEach((a) => { assetMap[a.submission_id] = a; });

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

  useEffect(() => { loadCompanySubmissions(); }, [loadCompanySubmissions]);

  useEffect(() => {
    if (!canManageChallenge || submissions.length === 0) return;
    const ids = submissions.map((s) => s.id);
    const interval = setInterval(() => { loadEvaluations(ids); }, 12000);
    return () => clearInterval(interval);
  }, [canManageChallenge, submissions, loadEvaluations]);

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

      try {
        await supabase.functions.invoke('generate-embedding', {
          body: { submission_id: subData.id, text: executiveSummary.trim(), challenge_id: selectedChallenge.id, user_id: session.user.id },
        });
      } catch (embedErr) {
        console.error('generate-embedding failed:', embedErr);
      }
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
      setExpandedEvalId(null);
    } catch (err) {
      console.error('Error saving evaluation:', err);
      alert('Error: ' + err.message);
    } finally {
      setSavingEval((p) => ({ ...p, [submissionId]: false }));
    }
  };

  if (!selectedChallenge) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-4">No se ha seleccionado ningún reto.</p>
        <button onClick={() => setCurrentView('dashboard')} className="px-5 py-2 bg-blue-950 dark:bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-900 dark:hover:bg-blue-800 transition shadow-sm">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans bg-white dark:bg-[#0a0a0a] min-h-screen">
      
      {/* MODAL DEL VISOR DE PDF */}
      {selectedPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white dark:bg-gray-900 w-full max-w-6xl h-full rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                <h3 className="font-black text-gray-900 dark:text-white">Visor de Documento Técnico</h3>
              </div>
              <button 
                onClick={() => setSelectedPdfUrl(null)} 
                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <iframe 
              src={selectedPdfUrl} 
              className="w-full flex-1 bg-gray-100 dark:bg-black" 
              title="PDF Viewer"
            />
          </div>
        </div>
      )}

      <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white transition-colors mb-6 uppercase tracking-wider">
        <ArrowLeft size={16} /> Volver al panel
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* COLUMNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TABS DE NAVEGACIÓN PARA ORGANIZACIONES */}
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

          {/* VISTA DE DETALLES (Default o Tab seleccionada) */}
          {(!canManageChallenge || orgTab === 'details') && (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 rounded-lg text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800/50">
                    Nivel {selectedChallenge.difficulty || 'Intermedio'}
                  </span>
                  <span className="px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-300 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 border border-green-200 dark:border-green-800/50">
                    <Building2 size={12} /> {orgName}
                  </span>
                </div>
                
                <h1 className="text-3xl font-black text-gray-950 dark:text-white tracking-tight leading-tight mb-4">
                  {selectedChallenge.title}
                </h1>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tech, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </header>
              
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
                      <Code2 size={16} className="text-gray-400" /> Requerimientos y Stack
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                      {selectedChallenge.technical_requirements}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA DE ENTREGAS (Solo Organización, diseño expandido) */}
          {(canManageChallenge && orgTab === 'submissions') && (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Panel de Evaluaciones</h2>
                  <p className="text-sm text-gray-500">Revisa, audita y califica el talento.</p>
                </div>
                <button onClick={() => loadCompanySubmissions()} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2">
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
                    const form = evalForms[sub.id] || { score: evaluation?.score ?? '', feedback: evaluation?.textual_feedback || '' };
                    const isEvalOpen = expandedEvalId === sub.id;

                    return (
                      <div key={sub.id} className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
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

                          {sub.executive_summary && (
                            <div className="mb-4">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Resumen Ejecutivo</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">{sub.executive_summary}</p>
                            </div>
                          )}
                          
                          {evaluation?.plagiarism_flag === true && (
                            <div style={PLAGIARISM_ALERT_STYLE} className="mb-4 rounded flex items-start gap-2">
                              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                              <span className="leading-tight">SIMILITUD DETECTADA — {evaluation.ai_summary || 'Revisar entrega manual'}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          {sub._asset?.url && (
                            <button 
                              onClick={(e) => { e.preventDefault(); setSelectedPdfUrl(sub._asset.url); }} 
                              className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors mb-3 shadow-sm"
                            >
                              <Eye size={16} /> Leer Propuesta PDF
                            </button>
                          )}

                          <button onClick={() => setExpandedEvalId(isEvalOpen ? null : sub.id)} className="w-full flex items-center justify-center gap-1 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition bg-white dark:bg-gray-900">
                            {isEvalOpen ? <><ChevronUp size={14} /> Ocultar Feedback</> : <><Star size={14} /> Evaluar Solución</>}
                          </button>

                          {isEvalOpen && (
                            <div className="mt-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4 shadow-inner">
                              <div>
                                <label className="block text-xs font-black text-gray-600 dark:text-gray-400 mb-1">Puntaje (0-100)</label>
                                <input type="number" min="0" max="100" value={form.score} onChange={(e) => setEvalForms((p) => ({ ...p, [sub.id]: { ...form, score: e.target.value } }))} className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                              </div>
                              <div>
                                <label className="block text-xs font-black text-gray-600 dark:text-gray-400 mb-1">Feedback Técnico</label>
                                <textarea value={form.feedback} placeholder="Detalla los puntos fuertes y de mejora..." onChange={(e) => setEvalForms((p) => ({ ...p, [sub.id]: { ...form, feedback: e.target.value } }))} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 min-h-[80px] outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
                              </div>
                              <button onClick={() => handleSaveEval(sub.id)} disabled={savingEval[sub.id]} className={`w-full py-2.5 text-white text-xs font-black uppercase tracking-wider rounded-lg transition shadow-sm ${savingEval[sub.id] ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'}`}>
                                {savingEval[sub.id] ? 'Procesando...' : evaluation?.score != null ? 'Actualizar Nota' : 'Guardar Evaluación'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMNA LATERAL (Estadísticas y Entregas de Estudiante) */}
        <div className="space-y-6 lg:sticky lg:top-24">
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
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Incentivo</p>
                <p className="text-sm font-black text-gray-950 dark:text-white">{selectedChallenge.reward || 'Certificación'}</p>
              </div>
            </div>
          </div>

          {/* VISTAS DINÁMICAS SEGÚN ROL (ESTUDIANTE) */}
          {user?.role === 'student' && (
            checkingSubmission ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-950 dark:border-blue-400" />
              </div>
            ) : existingSubmission ? (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-green-200 dark:border-green-800/50 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-bold text-gray-950 dark:text-gray-50">Propuesta Enviada</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Estado</span>
                    <span className="font-bold text-green-700 dark:text-green-300 uppercase text-xs">{existingSubmission.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Enviado</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{formatDate(existingSubmission.submitted_at)}</span>
                  </div>
                  {existingAsset?.url && (
                    <button onClick={() => setSelectedPdfUrl(existingAsset.url)} className="w-full flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 font-bold text-xs mt-4 bg-blue-50 dark:bg-blue-950/20 py-2.5 rounded-lg border border-blue-100 dark:border-blue-900/50 transition">
                      <FileText size={16} /> Ver mi documento procesado
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-black text-gray-950 dark:text-white mb-2 flex items-center gap-2">
                  <Send size={18} className="text-blue-600 dark:text-blue-400" /> Entregar Solución
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">
                  Tu documento será indexado y procesado para evaluación técnica y control de originalidad.
                </p>

                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded-lg mb-4 font-bold border border-red-200 dark:border-red-800/50">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmitSolution} className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Reporte (PDF) *</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group">
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        {pdfFile ? (
                          <>
                            <FileText className="text-blue-600 dark:text-blue-400 mb-2" size={28} />
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 max-w-[200px] truncate">{pdfFile.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="text-gray-400 group-hover:text-blue-500 transition-colors mb-2" size={28} />
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-bold">Seleccionar archivo</p>
                            <p className="text-xs text-gray-500 mt-1">PDF estricto (Máx. 10MB)</p>
                          </>
                        )}
                      </div>
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Resumen Ejecutivo *</label>
                    <textarea
                      value={executiveSummary}
                      onChange={(e) => setExecutiveSummary(e.target.value)}
                      required
                      minLength={50}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none min-h-[90px] text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                      placeholder="Describe de forma concisa tu estrategia (mín. 50 caracteres)..."
                    />
                  </div>

                  <button type="submit" disabled={isSubmitting} className={`w-full py-3 text-white font-black rounded-lg transition-all uppercase tracking-wider text-xs shadow-sm ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-950 hover:bg-blue-900 dark:bg-blue-900 dark:hover:bg-blue-800'}`}>
                    {isSubmitting ? 'Procesando Envío...' : 'Confirmar Envío'}
                  </button>
                </form>
              </div>
            )
          )}

          {/* MODO AUDITORÍA (Si es una organización, pero no la dueña de este reto) */}
          {isOrganizationUser && !canManageChallenge && (
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 text-center shadow-sm">
              <Shield size={28} className="text-blue-500 dark:text-blue-400 mx-auto mb-3" />
              <h4 className="font-black text-gray-950 dark:text-white text-sm mb-2">Modo Auditoría</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Como entidad verificada, puedes explorar el alcance técnico y métricas de este reto. La revisión de entregables está restringida exclusivamente al organizador oficial.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}