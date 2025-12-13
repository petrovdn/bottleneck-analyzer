'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageCircle,
  Network,
  Map,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { MultiAgentState, AgentMessage, AgentType, MultiAgentPhase } from '@/types';

interface MultiAgentChatProps {
  multiAgentState: MultiAgentState | null;
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onInitialize: () => void;
  isInitializing: boolean;
}

// Конфигурация фаз
const phaseConfig: Record<MultiAgentPhase, { 
  label: string; 
  icon: JSX.Element; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  initialization: {
    label: 'Сегментация',
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Собираем информацию о цепочке ценности',
  },
  process_mapping: {
    label: 'Карта процессов',
    icon: <Map className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Строим карту процессов',
  },
  bottleneck_analysis: {
    label: 'Анализ узких мест',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'Ищем узкие места',
  },
  solution_design: {
    label: 'Проектирование решений',
    icon: <Lightbulb className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Предлагаем решения',
  },
  complete: {
    label: 'Завершено',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Анализ завершен',
  },
};

// Конфигурация агентов
const agentConfig: Record<AgentType, { 
  label: string; 
  icon: JSX.Element; 
  color: string;
}> = {
  manager: {
    label: 'Manager',
    icon: <Network className="w-4 h-4" />,
    color: 'text-blue-600',
  },
  process_mining: {
    label: 'Process Mining',
    icon: <Map className="w-4 h-4" />,
    color: 'text-purple-600',
  },
  bottleneck_finder: {
    label: 'Bottleneck Finder',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-amber-600',
  },
  redesign: {
    label: 'Re-design',
    icon: <Lightbulb className="w-4 h-4" />,
    color: 'text-green-600',
  },
};

// Компонент сообщения от агента
function AgentMessageBubble({ message }: { message: AgentMessage }) {
  const config = agentConfig[message.agentType];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      {/* Аватар агента */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600`}
      >
        <Bot className="w-5 h-5 text-white" />
      </div>
      
      {/* Контент сообщения */}
      <div className="flex flex-col items-start max-w-[80%]">
        {/* Информация об агенте */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} bg-gray-100`}>
            {config.icon}
            {config.label}
          </div>
          {message.phase && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${phaseConfig[message.phase].color} ${phaseConfig[message.phase].bgColor}`}>
              {phaseConfig[message.phase].icon}
              {phaseConfig[message.phase].label}
            </div>
          )}
        </div>
        
        {/* Текст сообщения */}
        <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{message.content}</p>
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

// Компонент сообщения пользователя
function UserMessageBubble({ content, timestamp }: { content: string; timestamp: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 flex-row-reverse"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
        <User className="w-5 h-5 text-white" />
      </div>
      
      <div className="flex flex-col items-end max-w-[80%]">
        <div className="px-4 py-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-br-md">
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">
          {new Date(timestamp).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </motion.div>
  );
}

// Индикатор прогресса фаз
function PhaseProgress({ currentPhase }: { currentPhase: MultiAgentPhase }) {
  const phases: MultiAgentPhase[] = ['initialization', 'process_mapping', 'bottleneck_analysis', 'solution_design', 'complete'];
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

// Индикатор набора
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
          Мультиагентная система анализа
        </h3>
        <p className="text-gray-600 max-w-md">
          Система из нескольких специализированных агентов поможет найти узкие места 
          в вашей цепочке ценности и предложить решения.
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
            Инициализация...
          </>
        ) : (
          <>
            <Network className="w-5 h-5" />
            Начать анализ
          </>
        )}
      </button>
    </div>
  );
}

// Основной компонент
export default function MultiAgentChat({
  multiAgentState,
  isLoading,
  onSendMessage,
  onInitialize,
  isInitializing,
}: MultiAgentChatProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // История сообщений (агенты + пользователь)
  const [messageHistory, setMessageHistory] = useState<Array<{
    type: 'agent' | 'user';
    content: string;
    timestamp: string;
    agentMessage?: AgentMessage;
    isPending?: boolean; // Для оптимистичного обновления
  }>>([]);

  // Обновляем историю сообщений при изменении состояния
  useEffect(() => {
    if (multiAgentState) {
      const history: Array<{
        type: 'agent' | 'user';
        content: string;
        timestamp: string;
        agentMessage?: AgentMessage;
        isPending?: boolean;
      }> = [];

      // Добавляем сообщения агентов
      multiAgentState.agentMessages.forEach((msg) => {
        history.push({
          type: 'agent',
          content: msg.content,
          timestamp: msg.timestamp,
          agentMessage: msg,
        });
      });

      // Добавляем ответы пользователя с их временными метками
      // Поддерживаем обратную совместимость со старым форматом (string)
      Object.entries(multiAgentState.collectedAnswers).forEach(([key, value]) => {
        let answerData: { answer: string; timestamp: string };
        if (typeof value === 'string') {
          // Старый формат - создаем объект с временной меткой
          answerData = { 
            answer: value, 
            timestamp: new Date().toISOString() 
          };
        } else {
          // Новый формат
          answerData = value;
        }
        history.push({
          type: 'user',
          content: answerData.answer,
          timestamp: answerData.timestamp,
        });
      });

      // Сортируем все сообщения по времени
      history.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      setMessageHistory(history);
    }
  }, [multiAgentState]);

  // Автопрокрутка при изменении истории сообщений или загрузке
  useEffect(() => {
    if (messagesEndRef.current) {
      // Небольшая задержка для рендеринга
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messageHistory, isLoading]);

  // Автофокус
  useEffect(() => {
    if (multiAgentState && !isLoading) {
      inputRef.current?.focus();
    }
  }, [multiAgentState, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      const message = inputValue.trim();
      setInputValue('');
      onSendMessage(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Если диалог не начат
  if (!multiAgentState) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
        <StartDialogButton onClick={onInitialize} isLoading={isInitializing} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Заголовок с прогрессом фаз */}
      <PhaseProgress currentPhase={multiAgentState.phase} />
      
      {/* Описание текущей фазы */}
      <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <p className="text-sm text-gray-600 flex items-center gap-2">
          {phaseConfig[multiAgentState.phase].icon}
          {phaseConfig[multiAgentState.phase].description}
        </p>
        {multiAgentState.thinking && (
          <p className="text-xs text-gray-500 mt-1 italic">{multiAgentState.thinking}</p>
        )}
      </div>
      
      {/* Область сообщений */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" 
        style={{ 
          maxHeight: 'calc(100vh - 200px)',
          minHeight: '300px',
          scrollBehavior: 'smooth'
        }}
      >
        <AnimatePresence>
          {messageHistory.map((msg, index) => (
            <div key={`${msg.type}-${index}-${msg.timestamp}`}>
              {msg.type === 'agent' && msg.agentMessage ? (
                <AgentMessageBubble message={msg.agentMessage} />
              ) : (
                <UserMessageBubble content={msg.content} timestamp={msg.timestamp} />
              )}
            </div>
          ))}
        </AnimatePresence>
        
        {/* Индикатор набора */}
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Поле ввода */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Автоматическое изменение размера
              const textarea = e.target;
              textarea.style.height = 'auto';
              const newHeight = Math.min(textarea.scrollHeight, 150);
              textarea.style.height = `${newHeight}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              multiAgentState.isComplete 
                ? "Анализ завершен. Можете просмотреть результаты."
                : multiAgentState.currentQuestion 
                  ? "Ответьте на вопрос..."
                  : "Напишите ваш ответ..."
            }
            disabled={isLoading || multiAgentState.isComplete}
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            style={{ 
              minHeight: '48px', 
              maxHeight: '150px', 
              width: '100%',
              overflowY: 'auto',
              scrollBehavior: 'smooth',
              lineHeight: '1.5'
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || multiAgentState.isComplete}
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

