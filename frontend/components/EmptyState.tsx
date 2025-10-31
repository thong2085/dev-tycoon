'use client';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-gray-700 rounded-lg animate-fade-in">
      <div className="text-8xl mb-6 animate-float">{icon}</div>
      <h2 className="text-3xl font-bold mb-3 text-center">{title}</h2>
      <p className="text-gray-400 text-center mb-6 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8 py-3 rounded-lg font-bold transform transition hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/50"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

