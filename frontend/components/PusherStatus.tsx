'use client';

interface PusherStatusProps {
  isConnected: boolean;
  showLabel?: boolean;
}

export default function PusherStatus({ isConnected, showLabel = true }: PusherStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        {isConnected && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
        )}
      </div>
      {showLabel && (
        <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? 'Live' : 'Offline'}
        </span>
      )}
    </div>
  );
}

