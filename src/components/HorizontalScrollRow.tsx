import React, { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const HorizontalScrollRow = memo(({ children, title, icon }: { children: React.ReactNode; title: string; icon: React.ReactNode }) => {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative group/row">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2.5">
          {icon}
          {title}
        </h2>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/80"
        >
          <ChevronLeft size={24}/>
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pt-2 -mt-2 pb-4 snap-x hide-scrollbar scroll-smooth"
        >
          {children}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 border border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/80"
        >
          <ChevronRight size={24}/>
        </button>

      </div>
    </section>
  );
});

export default HorizontalScrollRow;
