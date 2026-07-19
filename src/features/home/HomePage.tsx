import React, { useRef, useState } from 'react';
import { BookOpen, FileUp, Sparkles, Sun, Type, Clock3, ChevronRight } from 'lucide-react';
import { getRecentFiles, rememberRecentFile, reopenRecentFile, supportsFileHandlePicker, type RecentFile } from '../../utils/recentFiles';

interface HomePageProps {
  onOpenPdf: (file: File) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenPdf }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(getRecentFiles);
  const [recentError, setRecentError] = useState<string | null>(null);

  const openReader = async (selectedFile?: File, handle?: Parameters<typeof rememberRecentFile>[1]) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) return;
    setRecentFiles(await rememberRecentFile(selectedFile, handle));
    onOpenPdf(selectedFile);
  };

  const choosePdf = async () => {
    if (!supportsFileHandlePicker()) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        multiple: false,
        types: [{ description: 'PDF documents', accept: { 'application/pdf': ['.pdf'] } }],
      });
      await openReader(await handle.getFile(), handle);
    } catch (error: any) {
      if (error?.name !== 'AbortError') setRecentError('Could not open that PDF. Please try again.');
    }
  };

  const openRecent = async (recent: RecentFile) => {
    setRecentError(null);
    try {
      const { file, handle } = await reopenRecentFile(recent.id);
      await openReader(file, handle);
    } catch (error: any) {
      setRecentError(error.message || 'Could not reopen this PDF.');
    }
  };

  return (
    <main className="h-screen overflow-y-auto bg-[#fbf8f1] px-5 py-6 text-[#2f2a20] sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#3b3428] text-[#fffaf0] shadow-sm"><BookOpen className="h-5 w-5" /></div>
            <div><p className="text-sm font-bold tracking-tight">ComfortReader</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e7c5d]">PDF reading, made calm</p></div>
          </div>
          <span className="hidden rounded-full border border-[#e5dcc9] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#76664e] sm:block">Private in your browser</span>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <div className="mb-5 flex items-center gap-2 rounded-full border border-[#e8ddc5] bg-white/70 px-3 py-1.5 text-[11px] font-bold text-[#8e7c5d] shadow-sm"><Sparkles className="h-3.5 w-3.5" />A more comfortable way to read</div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.045em] text-[#2f2a20] sm:text-6xl">Give your PDFs a softer place to live.</h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-[#736a5a] sm:text-base">Adjust themes, typography, and eye-comfort settings without sending your document anywhere.</p>

          <div
            className={`mt-9 w-full max-w-xl rounded-3xl border-2 border-dashed p-6 transition-all sm:p-9 ${isDragging ? 'border-[#8e7c5d] bg-[#f2ead9] scale-[1.01]' : 'border-[#ddcfb6] bg-white/75 shadow-[0_18px_60px_rgba(87,65,29,0.09)]'}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); void openReader(event.dataTransfer.files[0]); }}
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f3ecdd] text-[#8e7c5d]"><FileUp className="h-8 w-8" /></div>
            <h2 className="mt-5 text-lg font-bold">Open a PDF</h2>
            <p className="mt-1 text-xs text-[#7a7162]">Drop it here, or choose it from your device.</p>
            <button type="button" onClick={() => void choosePdf()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#3b3428] px-5 py-3 text-sm font-bold text-[#fffaf0] shadow-lg shadow-[#3b3428]/15 transition-transform hover:-translate-y-0.5 active:translate-y-0"><FileUp className="h-4 w-4" />Upload PDF</button>
            <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => void openReader(event.target.files?.[0])} />
            <p className="mt-4 text-[10px] font-medium text-[#9c927f]">PDF files only · Your file stays on this device</p>
          </div>

          {recentFiles.length > 0 && (
            <div className="mt-6 w-full max-w-xl rounded-2xl border border-[#e9dfcb] bg-white/55 p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-bold"><Clock3 className="h-4 w-4 text-[#8e7c5d]" />Recent PDFs</div>
              <div className="mt-2 divide-y divide-[#eee6d7]">
                {recentFiles.map((recent) => (
                  <button key={recent.id} type="button" onClick={() => void openRecent(recent)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-[#f8f3e9]">
                    <FileUp className="h-4 w-4 shrink-0 text-[#9c8b6e]" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{recent.name}</span><span className="block text-[10px] text-[#8b806f]">{new Date(recent.lastOpened).toLocaleDateString()} · {(recent.size / 1024 / 1024).toFixed(1)} MB{!recent.reopenable && ' · select again to reopen'}</span></span>
                    <ChevronRight className="h-4 w-4 text-[#9c8b6e]" />
                  </button>
                ))}
              </div>
              {recentError && <p className="mt-2 text-[11px] font-medium text-red-600">{recentError}</p>}
            </div>
          )}

          <div className="mt-9 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
            {[
              { icon: Sun, title: 'Gentle themes', text: 'Warm paper, dark, OLED, and more.' },
              { icon: Type, title: 'Made for reading', text: 'Fine-tune text when using Smart Reflow.' },
              { icon: Sparkles, title: 'Eye comfort', text: 'Reduce glare and adjust light for longer sessions.' },
            ].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-[#e9dfcb] bg-white/55 p-4"><Icon className="h-4 w-4 text-[#8e7c5d]" /><h3 className="mt-3 text-xs font-bold">{title}</h3><p className="mt-1 text-[11px] leading-4 text-[#7a7162]">{text}</p></div>)}
          </div>
        </section>
      </div>
    </main>
  );
};
