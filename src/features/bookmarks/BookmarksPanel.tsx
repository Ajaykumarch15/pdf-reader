import React, { useState } from 'react';
import { Bookmark, Search, Trash2, Calendar, MapPin } from 'lucide-react';
import { useReaderStore } from '../../stores/readerStore';

export const BookmarksPanel: React.FC = () => {
  const { theme, bookmarks, currentPage, addBookmark, removeBookmark, setCurrentPage } = useReaderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkLabel, setBookmarkLabel] = useState('');

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    addBookmark(currentPage, bookmarkLabel.trim());
    setBookmarkLabel('');
  };

  const filteredBookmarks = bookmarks.filter((b) =>
    b.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `page ${b.pageNumber}`.includes(searchQuery.toLowerCase())
  );

  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  return (
    <div className="flex flex-col gap-4 p-4 text-sm h-full overflow-hidden">
      {/* 1. Add Bookmark */}
      <form onSubmit={handleAddBookmark} className="flex flex-col gap-2 p-3 rounded-xl border" style={{ borderColor: theme.border }}>
        <span className="font-semibold text-xs opacity-90">Bookmark Current Page ({currentPage})</span>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add custom label (optional)..."
            value={bookmarkLabel}
            onChange={(e) => setBookmarkLabel(e.target.value)}
            disabled={isCurrentPageBookmarked}
            className="flex-1 px-3 py-1.5 rounded-lg border text-xs bg-transparent focus:outline-none"
            style={{ borderColor: theme.border, color: theme.text }}
          />
          <button
            type="submit"
            disabled={isCurrentPageBookmarked}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: theme.accent,
              color: theme.isDark ? '#000' : '#FFF',
            }}
          >
            {isCurrentPageBookmarked ? 'Bookmarked' : 'Add'}
          </button>
        </div>
      </form>

      {/* 2. Search Bookmarks */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-50" style={{ color: theme.text }} />
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs bg-transparent focus:outline-none"
          style={{ borderColor: theme.border, color: theme.text }}
        />
      </div>

      <hr className="opacity-10 my-1" style={{ borderColor: theme.border }} />

      {/* 3. Bookmarks List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-8 opacity-60 flex flex-col items-center gap-2">
            <Bookmark className="w-8 h-8 text-neutral-400" />
            <span className="text-xs font-medium">No bookmarks found</span>
          </div>
        ) : (
          filteredBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              onClick={() => setCurrentPage(bookmark.pageNumber)}
              className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-neutral-500/20 cursor-pointer transition-all"
              style={{
                backgroundColor: bookmark.pageNumber === currentPage ? `${theme.accent}10` : 'transparent',
                borderColor: bookmark.pageNumber === currentPage ? `${theme.accent}40` : undefined,
              }}
            >
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="font-semibold text-xs truncate" style={{ color: theme.isDark ? '#E5E7EB' : '#111827' }}>
                  {bookmark.label}
                </span>
                <div className="flex items-center gap-3 text-[10px] opacity-75">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-500" /> Page {bookmark.pageNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(bookmark.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeBookmark(bookmark.id);
                }}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
