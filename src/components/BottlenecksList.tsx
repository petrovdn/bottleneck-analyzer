'use client';

import { Bottleneck, Priority, RefinedBottleneck } from '@/types';
import { AlertCircle, TrendingUp, Activity, CheckCircle, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface BottlenecksListProps {
  bottlenecks: Bottleneck[];
  selectedBottleneck: Bottleneck | null;
  onSelect: (bottleneck: Bottleneck) => void;
  refinedBottlenecks?: Map<string, RefinedBottleneck>;
}

const priorityConfig: Record<
  Priority,
  { color: string; bgColor: string; icon: JSX.Element; label: string }
> = {
  high: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Высокий',
  },
  medium: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'Средний',
  },
  low: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: <Activity className="w-4 h-4" />,
    label: 'Низкий',
  },
};

export default function BottlenecksList({
  bottlenecks,
  selectedBottleneck,
  onSelect,
  refinedBottlenecks = new Map(),
}: BottlenecksListProps) {
  const { navigateToBottleneckDetail } = useAppStore();
  const refinedCount = refinedBottlenecks.size;
  
  const handleSelect = (bottleneck: Bottleneck) => {
    onSelect(bottleneck);
    navigateToBottleneckDetail(bottleneck.id);
  };
  
  return (
    <div className="w-full lg:w-96 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Найденные узкие места
        </h2>
        <p className="text-sm text-gray-600">
          {bottlenecks.length} проблем{bottlenecks.length === 1 ? 'а' : ''} обнаружено
          {refinedCount > 0 && (
            <span className="ml-2 text-emerald-600">
              • {refinedCount} уточнено
            </span>
          )}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {bottlenecks.map((bottleneck) => {
          const config = priorityConfig[bottleneck.priority];
          const isSelected = selectedBottleneck?.id === bottleneck.id;
          const isRefined = refinedBottlenecks.has(bottleneck.id);

          return (
            <button
              key={bottleneck.id}
              onClick={() => handleSelect(bottleneck)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : isRefined
                    ? 'border-emerald-300 bg-emerald-50 hover:border-emerald-400'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 flex-1 pr-2 flex items-center gap-2">
                  {bottleneck.title}
                  {isRefined && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                </h3>
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}
                >
                  {config.icon}
                  {config.label}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {bottleneck.problemDescription}
              </p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  📍 {bottleneck.processArea}
                </span>
                <div className="flex items-center gap-2">
                  {isRefined && (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Уточнено
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-blue-600 font-medium">
                      →
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


