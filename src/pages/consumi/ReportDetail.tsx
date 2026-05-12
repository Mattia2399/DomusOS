import React from 'react';
import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';
import { DetailScaffold, IntervalKey } from './shared';

const PDF_REPORTS = [
  { id: 'pdf-1', name: 'Report Consumi Marzo 2026', date: '31 Mar 2026' },
  { id: 'pdf-2', name: 'Analisi Efficienza Acqua', date: '28 Mar 2026' },
  { id: 'pdf-3', name: 'Sintesi Gas Settimanale', date: '27 Mar 2026' },
  { id: 'pdf-4', name: 'Bilancio Energetico Casa', date: '25 Mar 2026' },
  { id: 'pdf-5', name: 'Confronto Tariffe Energia', date: '21 Mar 2026' },
];

export function ReportDetail({
  title,
  interval: _interval,
  onIntervalChange: _onIntervalChange,
  onBack,
}: {
  title: string;
  interval: IntervalKey;
  onIntervalChange: (value: IntervalKey) => void;
  onBack: () => void;
}) {
  const left = (
    <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.14)_0%,transparent_72%)]">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.02)_44%,rgba(15,23,42,0.22)_100%)]" />

      <motion.div
        className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-xl"
        animate={{ boxShadow: ['0 0 0 rgba(56,189,248,0)', '0 0 40px rgba(56,189,248,0.38)', '0 0 0 rgba(56,189,248,0)'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex h-full w-full items-center justify-center text-sky-200">
          <FileText size={112} />
        </div>
      </motion.div>

      <p className="absolute bottom-6 left-6 text-sm text-white/65">Archivio report scaricabili</p>
    </div>
  );

  const right = (
    <div className="rounded-[2rem] border border-white/5 bg-white/5 p-5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_34px_rgba(0,0,0,0.26)]">
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-white/55">PDF Disponibili</p>
      <div className="space-y-3">
        {PDF_REPORTS.map((report) => (
          <button
            key={report.id}
            type="button"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{report.name}</p>
                <p className="text-xs text-white/50">{report.date}</p>
              </div>
              <Download size={16} className="text-white/70" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return <DetailScaffold title={title} onBack={onBack} left={left} right={right} />;
}

export default ReportDetail;
