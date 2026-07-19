import React, { useState } from 'react';
import { Edit2, Eye, FileText, Search, Trash2, Tag, Calendar, Download } from 'lucide-react';
import { useReaderStore } from '../../stores/readerStore';

export const NotesPanel: React.FC = () => {
  const { theme, notes, currentPage, fileName, addNote, updateNote, removeNote } = useReaderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'sticky' | 'margin' | 'inline'>('margin');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'current'>('current');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote(currentPage, noteText.trim(), noteType);
    setNoteText('');
  };

  const handleSaveEdit = (id: string) => {
    updateNote(id, editText);
    setEditingId(null);
  };

  const exportNotes = () => {
    const content = [`# Notes for ${fileName || 'document'}`, '', ...notes.flatMap((note) => [
      `## Page ${note.pageNumber} · ${note.type}`,
      note.text,
      '',
    ])].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(fileName || 'reader-notes').replace(/\.[^/.]+$/, '')}-notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simple Markdown Parser
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      
      // Headers
      if (content.startsWith('# ')) {
        return <h4 key={idx} className="font-bold text-sm mt-2 mb-1" style={{ color: theme.isDark ? '#FFF' : '#000' }}>{content.substring(2)}</h4>;
      }
      if (content.startsWith('## ')) {
        return <h5 key={idx} className="font-semibold text-xs mt-1.5 mb-1" style={{ color: theme.isDark ? '#FFF' : '#000' }}>{content.substring(3)}</h5>;
      }
      // Lists
      if (content.trim().startsWith('- ')) {
        return <li key={idx} className="ml-4 list-disc text-xs my-0.5">{content.trim().substring(2)}</li>;
      }
      if (content.trim().startsWith('* ')) {
        return <li key={idx} className="ml-4 list-disc text-xs my-0.5">{content.trim().substring(2)}</li>;
      }
      
      // bold replace regex
      const formatted = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">$1</code>');

      return (
        <p
          key={idx}
          className="text-xs min-h-[1.25em] leading-relaxed mb-1"
          dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }}
        />
      );
    });
  };

  const displayNotes = notes.filter((note) => {
    const matchesSearch = note.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPage = activeTab === 'current' ? note.pageNumber === currentPage : true;
    return matchesSearch && matchesPage;
  });

  return (
    <div className="flex flex-col gap-4 p-4 text-sm h-full overflow-hidden">
      {/* Tab Selectors */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-lg bg-black/5 dark:bg-white/5 p-1">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'current' ? 'shadow bg-white dark:bg-neutral-800' : 'opacity-70'
          }`}
          style={{ color: theme.text }}
        >
          This Page ({currentPage})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'all' ? 'shadow bg-white dark:bg-neutral-800' : 'opacity-70'
          }`}
          style={{ color: theme.text }}
        >
          All Notes ({notes.length})
        </button>
        </div>
        <button
          type="button"
          onClick={exportNotes}
          disabled={notes.length === 0}
          title="Export all notes as Markdown"
          className="rounded-lg border p-2 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* 1. Add Note Box */}
      <form onSubmit={handleAddNote} className="flex flex-col gap-2 p-3 rounded-xl border" style={{ borderColor: theme.border }}>
        <span className="font-semibold text-xs opacity-90">Add Markdown Note</span>
        <textarea
          placeholder="Use # headers, **bold**, *italics*, - lists..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border text-xs bg-transparent focus:outline-none resize-none"
          style={{ borderColor: theme.border, color: theme.text }}
        />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 opacity-60" />
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as any)}
              className="text-xs bg-transparent border-none focus:outline-none cursor-pointer"
              style={{ color: theme.text }}
            >
              <option value="margin" className="dark:bg-neutral-900">Margin Note</option>
              <option value="sticky" className="dark:bg-neutral-900">Canvas Sticky</option>
              <option value="inline" className="dark:bg-neutral-900">Inline Note</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: theme.accent,
              color: theme.isDark ? '#000' : '#FFF',
            }}
          >
            Add Note
          </button>
        </div>
      </form>

      {/* 2. Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-50" style={{ color: theme.text }} />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs bg-transparent focus:outline-none"
          style={{ borderColor: theme.border, color: theme.text }}
        />
      </div>

      <hr className="opacity-10 my-1" style={{ borderColor: theme.border }} />

      {/* 3. Notes List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {displayNotes.length === 0 ? (
          <div className="text-center py-8 opacity-60 flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-neutral-400" />
            <span className="text-xs font-medium">No notes found</span>
          </div>
        ) : (
          displayNotes.map((note) => {
            const isEditing = editingId === note.id;
            const isPreviewing = previewingId === note.id;

            return (
              <div
                key={note.id}
                className="flex flex-col p-3 rounded-xl border"
                style={{ borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
              >
                <div className="flex justify-between items-center mb-2 text-[10px] opacity-70">
                  <span className="font-semibold text-amber-500">Page {note.pageNumber}</span>
                  <div className="flex items-center gap-1.5 uppercase font-bold tracking-wider">
                    <span>{note.type}</span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1.5 rounded-lg border text-xs bg-transparent focus:outline-none resize-none"
                      style={{ borderColor: theme.border, color: theme.text }}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 border rounded text-[10px] hover:bg-neutral-500/10"
                        style={{ borderColor: theme.border, color: theme.text }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="px-3 py-1 text-[10px] font-bold rounded"
                        style={{ backgroundColor: theme.accent, color: theme.isDark ? '#000' : '#FFF' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {isPreviewing ? (
                      <div className="p-2 rounded bg-black/5 dark:bg-white/5 border border-transparent">
                        {renderMarkdown(note.text)}
                      </div>
                    ) : (
                      <p className="text-xs whitespace-pre-wrap leading-relaxed opacity-95">{note.text}</p>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed" style={{ borderColor: theme.border }}>
                      <span className="text-[9px] opacity-55 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setPreviewingId(isPreviewing ? null : note.id)}
                          title={isPreviewing ? "View Source" : "Preview Markdown"}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          {isPreviewing ? <Edit2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        
                        <button
                          onClick={() => {
                            setEditingId(note.id);
                            setEditText(note.text);
                          }}
                          title="Edit Note"
                          className="p-1 rounded text-neutral-400 hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => removeNote(note.id)}
                          title="Delete Note"
                          className="p-1 rounded text-red-400 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
