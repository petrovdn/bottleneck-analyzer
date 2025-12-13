'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageCircle,
  Lightbulb,
  Target,
  Wrench,
  CheckCircle,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { ChatMessage, DialogPhase, DialogState } from '@/types';

interface ChatInterfaceProps {
  dialogState: DialogState | null;
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onStartDialog: () => void;
  isInitializing: boolean;
}

// Конфигурация фаз диалога
const phaseConfig: Record<DialogPhase, { 
  label: string; 
  icon: JSX.Element; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  clarifying: {
    label: 'Уточнение',
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Уточняем детали проблемы',
  },
  deep_dive: {
    label: 'Анализ',
    icon: <Lightbulb className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'Глубокий анализ причин',
  },
  solution_design: {
    label: 'Решение',
    icon: <Target className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Проектируем решение',
  },
  implementation: {
    label: 'Реализация',
    icon: <Wrench className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Обсуждаем план внедрения',
  },
  complete: {
    label: 'Готово',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Диалог завершен',
  },
};

// Компонент сообщения
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Аватар */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
            : 'bg-gradient-to-br from-emerald-500 to-teal-600'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      {/* Контент сообщения */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {/* Фаза диалога (только для агента) */}
        {!isUser && message.phase && (
          <div className={`flex items-center gap-1.5 mb-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${phaseConfig[message.phase].color} ${phaseConfig[message.phase].bgColor}`}>
            {phaseConfig[message.phase].icon}
            {phaseConfig[message.phase].label}
          </div>
        )}
        
        {/* Текст сообщения */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-md'
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        
        {/* Время */}
        <span className="text-xs text-gray-400 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </motion.div>
  );
}

// Индикатор прогресса фаз
function PhaseProgress({ currentPhase }: { currentPhase: DialogPhase }) {
  const phases: DialogPhase[] = ['clarifying', 'deep_dive', 'solution_design', 'implementation', 'complete'];
  const currentIndex = phases.indexOf(currentPhase);
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
      {phases.map((phase, index) => {
        const config = phaseConfig[phase];
        const isActive = index === currentIndex;
        const isPast = index < currentIndex;
        
        return (
          <div key={phase} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                isActive 
                  ? `${config.color} ${config.bgColor}` 
                  : isPast 
                    ? 'text-emerald-600 bg-emerald-100'
                    : 'text-gray-400 bg-gray-100'
              }`}
            >
              {isPast ? <CheckCircle className="w-3 h-3" /> : config.icon}
              <span className="hidden sm:inline">{config.label}</span>
            </div>
            
            {index < phases.length - 1 && (
              <div 
                className={`w-8 h-0.5 mx-1 ${
                  isPast ? 'bg-emerald-300' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Компонент индикатора набора
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Кнопка начала диалога
function StartDialogButton({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 mx-auto">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Давайте уточним проблему вместе
        </h3>
        <p className="text-gray-600 max-w-md">
          Я задам несколько вопросов, чтобы лучше понять вашу ситуацию 
          и предложить максимально подходящее решение.
        </p>
      </motion.div>
      
      <button
        onClick={onClick}
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Начинаем...
          </>
        ) : (
          <>
            <MessageCircle className="w-5 h-5" />
            Начать диалог
          </>
        )}
      </button>
    </div>
  );
}

// Основной компонент
export default function ChatInterface({
  dialogState,
  isLoading,
  onSendMessage,
  onStartDialog,
  isInitializing,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogState?.messages]);
  
  // Автофокус на инпут
  useEffect(() => {
    if (dialogState && !isLoading) {
      inputRef.current?.focus();
    }
  }, [dialogState, isLoading]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Если диалог не начат
  if (!dialogState) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
        <StartDialogButton onClick={onStartDialog} isLoading={isInitializing} />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Заголовок с прогрессом фаз */}
      <PhaseProgress currentPhase={dialogState.phase} />
      
      {/* Описание текущей фазы */}
      <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <p className="text-sm text-gray-600 flex items-center gap-2">
          {phaseConfig[dialogState.phase].icon}
          {phaseConfig[dialogState.phase].description}
        </p>
      </div>
      
      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <AnimatePresence>
          {dialogState.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>
        
        {/* Индикатор набора */}
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Инсайты (если есть) */}
      {dialogState.insights.length > 0 && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-amber-700">
              <Lightbulb className="w-4 h-4" />
              Собранные инсайты ({dialogState.insights.length})
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-amber-800">
              {dialogState.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      
      {/* Поле ввода */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              dialogState.isComplete 
                ? "Диалог завершен. Можете сгенерировать промпт."
                : "Напишите ваш ответ..."
            }
            disabled={isLoading || dialogState.isComplete}
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || dialogState.isComplete}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Подсказка */}
        <p className="text-xs text-gray-400 mt-2 text-center">
          Enter — отправить • Shift+Enter — новая строка
        </p>
      </form>
    </div>
  );
}

