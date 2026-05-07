import React, { useState, useEffect } from 'react';
import { Tag, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const TagDropdown = ({
  availableTags,
  selectedTags,
  setSelectedTags,
}: {
  availableTags: string[];
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
>
        <Tag size={14}/>
        Tags {selectedTags.length> 0 && `(${selectedTags.length})`}
        <ChevronDown
          size={14}
          className={cn(
'transition-transform',
            isOpen &&'rotate-180',
          )}
/>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 max-h-64 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 p-2 custom-scrollbar">
          {availableTags.length === 0 ? (
            <div className="p-4 text-center text-xs text-white/40 italic">No tags available</div>
          ) : (
            <>
              {selectedTags.length> 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-white/5 rounded-lg mb-2 transition-colors"
>
                  Clear Filters
                </button>
              )}
              {availableTags.map(tag => (
                <label
                  key={tag}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() =>
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag],
                      )
                    }
                    className="w-4 h-4 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0"
/>
                  <span className="text-xs font-mono uppercase tracking-widest text-white/80">{tag}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TagDropdown;
