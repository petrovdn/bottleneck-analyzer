'use client';

import { useState } from 'react';
import { Copy, Check, ArrowLeft } from 'lucide-react';

interface PromptDisplayProps {
  prompt: string;
  onBack: () => void;
}

export default function PromptDisplay({ prompt, onBack }: PromptDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Промпт для реализации решения
          </h1>
          <p className="text-lg text-gray-600">
            Готовый промпт для создания мультиагента в Cursor
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Вернуться к узким местам
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md ml-auto"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Скопировано!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Копировать промпт
              </>
            )}
          </button>
        </div>

        {/* Код промпта */}
        <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <span className="text-gray-300 font-mono text-sm">
              implementation-prompt.md
            </span>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>

          <pre className="p-6 overflow-x-auto text-sm leading-relaxed">
            <code className="text-gray-100 font-mono">{prompt}</code>
          </pre>
        </div>

        {/* Инструкции */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Как использовать этот промпт
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>Скопируйте промпт используя кнопку выше</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>Откройте Cursor и создайте новый проект</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>
                Вставьте промпт в Cursor и следуйте инструкциям для реализации
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>
                Мультиагент будет создан специально под ваше узкое место
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

