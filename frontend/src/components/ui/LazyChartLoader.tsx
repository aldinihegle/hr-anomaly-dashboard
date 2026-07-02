import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import ChartSkeleton from './ChartSkeleton';

interface Props {
  children: ReactNode;
  height?: number;
  delay?: number;
}

export default function LazyChartLoader({ children, height = 300, delay = 250 }: Props) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Reset state if component remounts or is re-used
    setShouldRender(false);
    
    // Defer rendering to avoid blocking the main thread during CSS transitions
    const timer = setTimeout(() => {
      // Use requestAnimationFrame to ensure it renders right before the next paint
      requestAnimationFrame(() => {
        setShouldRender(true);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return <ChartSkeleton height={height} />;
  }

  // Wrap in a fade-in animation so it doesn't just pop abruptly
  return (
    <div className="animate-in fade-in duration-500 w-full h-full">
      {children}
    </div>
  );
}
