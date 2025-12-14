'use client';

import { FieldSuggestion } from '@/types';
import { Check, X, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FieldSuggestionsProps {
  suggestions: FieldSuggestion[];
  onApply: (suggestion: FieldSuggestion) => void;
  onDismiss: (suggestion: FieldSuggestion) => void;
}

// Названия полей для отображения
const fieldLabels: Record<keyof import('@/types').Bottleneck, string> = {
  id: 'ID',
  title: 'Название',
  processArea: 'Область процесса',
  problemDescription: 'Описание проблемы',
  currentImpact: 'Текущее влияние',
  priority: 'Приоритет',
  potentialGain: 'Потенциальный выигрыш',
  asIsProcess: 'Текущий процесс (as-is)',
  toBeProcess: 'Целевой процесс (to-be)',
  suggestedAgents: 'Предлагаемые агенты',
  mcpToolsNeeded: 'MCP инструменты',
};

export default function FieldSuggestions({
  suggestions,
  onApply,
  onDismiss,
}: FieldSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-4">
      <AnimatePresence>
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={`${suggestion.field}-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Предложение для поля: {fieldLabels[suggestion.field] || suggestion.field}
                </h4>
                
                <div className="space-y-2 mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Текущее значение:</p>
                    <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 line-clamp-2">
                      {suggestion.currentValue || '(пусто)'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-1">Предлагаемое значение:</p>
                    <p className="text-sm text-amber-900 bg-amber-100 p-2 rounded border border-amber-300 line-clamp-2">
                      {suggestion.suggestedValue}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Обоснование:</p>
                    <p className="text-xs text-gray-600 italic">
                      {suggestion.reason}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onApply(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Применить
                  </button>
                  <button
                    onClick={() => onDismiss(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Отклонить
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

