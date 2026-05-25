import React from 'react';
import { FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function MySubmissionsList({ submissions }) {
  
  // Configuración de estados para los badges
  const getStatusConfig = (status) => {
    switch(status) {
      case 'evaluated': return { icon: CheckCircle, text: 'Evaluado', colorClass: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' };
      case 'submitted': return { icon: Clock, text: 'En Revisión', colorClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
      case 'rejected': return { icon: XCircle, text: 'Rechazado', colorClass: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' };
      default: return { icon: FileText, text: 'Enviado', colorClass: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' };
    }
  };

  if (!submissions || submissions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-12 text-center shadow-sm">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={40} />
        <h3 className="text-lg font-black text-gray-950 dark:text-white">Aún no has enviado soluciones</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Explora los retos de empresas y comienza a postular para ganar experiencia.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-black text-gray-950 dark:text-white">Mis Entregas</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Seguimiento de tus propuestas técnicas enviadas.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Reto</th>
              <th className="px-6 py-4">Organización</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {submissions.map((sub) => {
              const { icon: StatusIcon, text, colorClass } = getStatusConfig(sub.status);
              return (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-950 dark:text-white">
                    {sub.challenge_goal}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {sub.organization}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-500 font-medium">
                    {sub.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colorClass}`}>
                      <StatusIcon size={12} />
                      {text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-gray-100">
                    {sub.score ? `${sub.score} / 20` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}