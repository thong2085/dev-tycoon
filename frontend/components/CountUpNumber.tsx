'use client';

import { useEffect, useState, useRef } from 'react';

interface CountUpNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function CountUpNumber({ 
  value, 
  decimals = 0, 
  duration = 500, 
  prefix = '', 
  suffix = '',
  className = '' 
}: CountUpNumberProps) {
  // Ensure value is a valid number
  const numValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  
  const [displayValue, setDisplayValue] = useState(numValue);
  const prevValueRef = useRef(numValue);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = numValue;
    const startTime = Date.now();
    const difference = endValue - startValue;

    if (difference === 0) return;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (difference * easeOut);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [numValue, duration]);

  return (
    <span className={className}>
     {prefix}{Number(displayValue).toFixed(decimals)}{suffix} 
    </span>
  );
}

