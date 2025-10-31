'use client';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export default function Skeleton({ 
  width = '100%', 
  height = '20px', 
  className = '',
  variant = 'rectangular'
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div 
      className={`bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-skeleton ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width="50px" height="50px" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="16px" />
        </div>
      </div>
      <Skeleton width="100%" height="80px" />
      <div className="flex gap-2">
        <Skeleton width="48%" height="40px" />
        <Skeleton width="48%" height="40px" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-4 bg-gray-800 rounded-lg">
          <Skeleton width="50px" height="50px" variant="circular" />
          <Skeleton width="30%" height="20px" />
          <Skeleton width="20%" height="20px" />
          <Skeleton width="15%" height="20px" />
        </div>
      ))}
    </div>
  );
}

