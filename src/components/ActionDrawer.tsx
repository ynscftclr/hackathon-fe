import React, { useState } from 'react';
import { useUiStore } from '@/store/useUiStore';
import { useAiStore } from '@/store/useAiStore';
import { useCardStore } from '@/store/useCardStore';
import { X, CheckCircle2, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ActionDrawer: React.FC = () => {
  const { isActionDrawerOpen, setActionDrawerOpen, selectedCardId } = useUiStore();
  const { analysisResult, isAnalyzing, clearAnalysis } = useAiStore();
  const { persons, createAction } = useCardStore();
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setActionDrawerOpen(false);
  };

  const handleConfirm = async () => {
    if (!analysisResult || !selectedCardId) return;
    setSaving(true);
    try {
      await createAction({
        cardId: selectedCardId,
        title: analysisResult.suggestedTitle,
        description: analysisResult.suggestedDescription,
        assigneeId: analysisResult.recommendedAssigneeId,
        status: 'todo',
      });
      clearAnalysis();
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const assignedPerson = persons.find(p => p.id === analysisResult?.recommendedAssigneeId);

  return (
    <AnimatePresence>
      {isActionDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <BrainCircuit className="text-indigo-600" />
                AI Çözüm Analizi
              </h2>
              <button onClick={handleClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="font-medium animate-pulse">AI kartı analiz ediyor...</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                    <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Önerilen Aksiyon</h3>
                    <p className="font-semibold text-slate-900 text-lg">{analysisResult.suggestedTitle}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Detaylı Çözüm Planı</h3>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60 shadow-inner">
                      {analysisResult.suggestedDescription}
                    </p>
                  </div>

                  {assignedPerson && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Önerilen Atama</h3>
                      <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center">
                          {assignedPerson.name[0]}{assignedPerson.surname[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{assignedPerson.name} {assignedPerson.surname}</p>
                          <p className="text-xs text-slate-500">Takım Üyesi</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={() => void handleConfirm()}
                    disabled={saving || !selectedCardId}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-60"
                  >
                    <CheckCircle2 size={18} />
                    {saving ? 'Kaydediliyor…' : 'Aksiyonu Onayla ve Oluştur'}
                  </button>
                </div>
              ) : (
                <div className="text-center text-slate-500 mt-10">Analiz sonucu bulunamadı.</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
