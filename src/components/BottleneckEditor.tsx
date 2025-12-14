'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Bottleneck, Priority, FieldSuggestion, BusinessData, DialogState } from '@/types';
import { Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ChatInterface from './ChatInterface';
import FieldSuggestions from './FieldSuggestions';

interface BottleneckEditorProps {
  bottleneck?: Bottleneck;
  onSave?: (bottleneck: Bottleneck) => void;
  onCancel?: () => void;
  businessData?: BusinessData;
  suggestions?: FieldSuggestion[];
  onApplySuggestion?: (suggestion: FieldSuggestion) => void;
  onDismissSuggestion?: (suggestion: FieldSuggestion) => void;
}

// Форма редактирования точки улучшения
export function BottleneckForm({ 
  bottleneck, 
  onSave, 
  onCancel,
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
}: BottleneckEditorProps) {
  const [formData, setFormData] = useState<Partial<Bottleneck>>({
    title: bottleneck?.title || '',
    processArea: bottleneck?.processArea || '',
    problemDescription: bottleneck?.problemDescription || '',
    currentImpact: bottleneck?.currentImpact || '',
    priority: bottleneck?.priority || 'medium',
    potentialGain: bottleneck?.potentialGain || '',
    asIsProcess: bottleneck?.asIsProcess || '',
    toBeProcess: bottleneck?.toBeProcess || '',
    suggestedAgents: bottleneck?.suggestedAgents || [],
    mcpToolsNeeded: bottleneck?.mcpToolsNeeded || [],
  });

  const [agentInput, setAgentInput] = useState('');
  const [toolInput, setToolInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBottleneck: Bottleneck = {
      id: bottleneck?.id || `bottleneck_${uuidv4()}`,
      title: formData.title || 'Без названия',
      processArea: formData.processArea || '',
      problemDescription: formData.problemDescription || '',
      currentImpact: formData.currentImpact || '',
      priority: (formData.priority as Priority) || 'medium',
      potentialGain: formData.potentialGain || '',
      asIsProcess: formData.asIsProcess || '',
      toBeProcess: formData.toBeProcess || '',
      suggestedAgents: formData.suggestedAgents || [],
      mcpToolsNeeded: formData.mcpToolsNeeded || [],
    };

    onSave?.(newBottleneck);
  };

  const addAgent = () => {
    if (agentInput.trim()) {
      setFormData({
        ...formData,
        suggestedAgents: [...(formData.suggestedAgents || []), agentInput.trim()],
      });
      setAgentInput('');
    }
  };

  const removeAgent = (index: number) => {
    setFormData({
      ...formData,
      suggestedAgents: formData.suggestedAgents?.filter((_, i) => i !== index) || [],
    });
  };

  const addTool = () => {
    if (toolInput.trim()) {
      setFormData({
        ...formData,
        mcpToolsNeeded: [...(formData.mcpToolsNeeded || []), toolInput.trim()],
      });
      setToolInput('');
    }
  };

  const removeTool = (index: number) => {
    setFormData({
      ...formData,
      mcpToolsNeeded: formData.mcpToolsNeeded?.filter((_, i) => i !== index) || [],
    });
  };

  // Обработка применения предложения
  const handleApplySuggestion = (suggestion: FieldSuggestion) => {
    try {
      const field = suggestion.field;
      let newValue: any = suggestion.suggestedValue;
      
      // Парсим JSON для массивов
      if (field === 'suggestedAgents' || field === 'mcpToolsNeeded') {
        try {
          newValue = JSON.parse(suggestion.suggestedValue);
        } catch {
          // Если не JSON, используем как есть
          newValue = suggestion.suggestedValue.split(',').map(s => s.trim()).filter(s => s);
        }
      }
      
      // Обрабатываем приоритет
      if (field === 'priority') {
        const validPriorities: Priority[] = ['high', 'medium', 'low'];
        if (validPriorities.includes(newValue as Priority)) {
          newValue = newValue as Priority;
        } else {
          console.warn('Invalid priority value:', newValue);
          return;
        }
      }
      
      setFormData({
        ...formData,
        [field]: newValue,
      });
      
      onApplySuggestion?.(suggestion);
    } catch (e) {
      console.error('Error applying suggestion:', e);
    }
  };

  // Получаем предложения для конкретного поля
  const getFieldSuggestions = (field: keyof Bottleneck) => {
    return suggestions.filter(s => s.field === field);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Показываем предложения для всех полей */}
      {suggestions.length > 0 && (
        <FieldSuggestions
          suggestions={suggestions}
          onApply={handleApplySuggestion}
          onDismiss={onDismissSuggestion || (() => {})}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Область процесса
          </label>
          <input
            type="text"
            value={formData.processArea}
            onChange={(e) => setFormData({ ...formData, processArea: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Описание проблемы *
        </label>
        <textarea
          value={formData.problemDescription}
          onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текущее влияние
          </label>
          <textarea
            value={formData.currentImpact}
            onChange={(e) => setFormData({ ...formData, currentImpact: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Приоритет
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Потенциальный выигрыш
        </label>
        <textarea
          value={formData.potentialGain}
          onChange={(e) => setFormData({ ...formData, potentialGain: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текущий процесс (as-is)
          </label>
          <textarea
            value={formData.asIsProcess}
            onChange={(e) => setFormData({ ...formData, asIsProcess: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Целевой процесс (to-be)
          </label>
          <textarea
            value={formData.toBeProcess}
            onChange={(e) => setFormData({ ...formData, toBeProcess: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Предлагаемые агенты */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Предлагаемые агенты
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={agentInput}
            onChange={(e) => setAgentInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAgent())}
            placeholder="Добавить агента"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addAgent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.suggestedAgents?.map((agent, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {agent}
              <button
                type="button"
                onClick={() => removeAgent(index)}
                className="ml-1 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* MCP инструменты */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          MCP инструменты
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={toolInput}
            onChange={(e) => setToolInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
            placeholder="Добавить инструмент"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addTool}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.mcpToolsNeeded?.map((tool, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {tool}
              <button
                type="button"
                onClick={() => removeTool(index)}
                className="ml-1 hover:text-gray-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Сохранить
        </button>
      </div>
    </form>
  );
}

// Основной компонент редактора с split view
interface BottleneckEditorMainProps {
  bottleneck?: Bottleneck;
  onSave?: (bottleneck: Bottleneck) => void;
  onCancel?: () => void;
  businessData?: BusinessData;
}

export default function BottleneckEditor(props?: BottleneckEditorMainProps) {
  const {
    bottlenecks,
    selectedBottleneck,
    addBottleneck,
    updateBottleneck,
    deleteBottleneck,
    navigateToBottlenecksList,
    businessData: storeBusinessData,
    dialogState: storeDialogState,
    setDialogState,
    setChatLoading,
    isChatLoading,
  } = useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldSuggestions, setFieldSuggestions] = useState<FieldSuggestion[]>([]);
  const [isInitializingDialog, setIsInitializingDialog] = useState(false);
  const [currentBottleneck, setCurrentBottleneck] = useState<Bottleneck | undefined>(props?.bottleneck);
  const [dialogState, setLocalDialogState] = useState<DialogState | null>(props?.bottleneck ? storeDialogState : null);

  const businessData = props?.businessData || storeBusinessData || {
    productDescription: 'Не указано',
    teamSize: 0,
    workflows: 'Не указано',
    kpis: 'Не указано',
  };

  // Автоматически инициализируем диалог при создании/открытии точки улучшения
  useEffect(() => {
    if (!businessData) return;
    
    let targetBottleneck: Bottleneck | null = null;
    
    if (isCreating) {
      // Для новой точки улучшения создаем временный объект
      targetBottleneck = {
        id: `temp_${uuidv4()}`,
        title: '',
        processArea: '',
        problemDescription: '',
        currentImpact: '',
        priority: 'medium',
        potentialGain: '',
        asIsProcess: '',
        toBeProcess: '',
        suggestedAgents: [],
        mcpToolsNeeded: [],
      };
    } else if (editingId) {
      targetBottleneck = bottlenecks.find(b => b.id === editingId) || null;
    } else if (currentBottleneck) {
      targetBottleneck = currentBottleneck;
    }
    
    if (targetBottleneck && !dialogState && !isInitializingDialog) {
      handleStartDialog(targetBottleneck);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreating, editingId, currentBottleneck?.id, businessData?.productDescription]);

  // Инициализация диалога
  const handleStartDialog = async (bottleneck: Bottleneck) => {
    if (!businessData) return;

    setIsInitializingDialog(true);
    try {
      const response = await fetch('/api/chat/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData,
          bottleneck,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize dialog');
      }

      const result = await response.json();
      const newDialogState = result.dialogState;
      setLocalDialogState(newDialogState);
      setDialogState(newDialogState);
    } catch (err) {
      console.error('Error initializing dialog:', err);
    } finally {
      setIsInitializingDialog(false);
    }
  };

  // Отправка сообщения в диалог
  const handleSendMessage = async (message: string) => {
    let targetBottleneck: Bottleneck | null = null;
    
    if (isCreating) {
      // Для новой точки улучшения используем временный объект
      targetBottleneck = {
        id: `temp_${uuidv4()}`,
        title: '',
        processArea: '',
        problemDescription: '',
        currentImpact: '',
        priority: 'medium',
        potentialGain: '',
        asIsProcess: '',
        toBeProcess: '',
        suggestedAgents: [],
        mcpToolsNeeded: [],
      };
    } else {
      targetBottleneck = currentBottleneck || (editingId ? bottlenecks.find(b => b.id === editingId) || null : null);
    }
    
    if (!targetBottleneck || !businessData || !dialogState) return;

    setChatLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData,
          bottleneck: targetBottleneck,
          dialogState,
          userMessage: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      const updatedDialogState = result.updatedDialogState;
      setLocalDialogState(updatedDialogState);
      setDialogState(updatedDialogState);

      // Обрабатываем предложения изменений
      if (result.fieldSuggestions && result.fieldSuggestions.length > 0) {
        setFieldSuggestions(prev => {
          // Фильтруем дубликаты по полю
          const existingFields = new Set(prev.map(s => s.field));
          const newSuggestions = result.fieldSuggestions.filter(
            (s: FieldSuggestion) => !existingFields.has(s.field)
          );
          return [...prev, ...newSuggestions];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setChatLoading(false);
    }
  };

  // Применение предложения
  const handleApplySuggestion = (suggestion: FieldSuggestion) => {
    setFieldSuggestions(prev => prev.filter(s => 
      !(s.field === suggestion.field && s.suggestedValue === suggestion.suggestedValue)
    ));
  };

  // Отклонение предложения
  const handleDismissSuggestion = (suggestion: FieldSuggestion) => {
    setFieldSuggestions(prev => prev.filter(s => 
      !(s.field === suggestion.field && s.suggestedValue === suggestion.suggestedValue)
    ));
  };

  // Если передан bottleneck через props, работаем в режиме редактирования с split view
  if (props?.bottleneck || editingId || isCreating) {
    const targetBottleneck = props?.bottleneck || 
                            (editingId ? bottlenecks.find(b => b.id === editingId) : null) ||
                            undefined;

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Левая панель: Диалог с агентом */}
          <div className="w-1/2 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Диалог с консультантом</h3>
              <p className="text-sm text-gray-600 mt-1">
                Общайтесь с агентом, чтобы улучшить описание точки улучшения
              </p>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <ChatInterface
                dialogState={dialogState}
                isLoading={isChatLoading}
                onSendMessage={handleSendMessage}
                onStartDialog={() => targetBottleneck && handleStartDialog(targetBottleneck)}
                isInitializing={isInitializingDialog}
              />
            </div>
          </div>

          {/* Правая панель: Форма редактирования */}
          <div className="w-1/2 bg-white flex flex-col overflow-hidden">
            <div className="flex-shrink-0 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {isCreating ? 'Создать новое улучшение процесса' : 'Редактировать улучшение процесса'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setCurrentBottleneck(undefined);
                    setLocalDialogState(null);
                    setDialogState(null);
                    setFieldSuggestions([]);
                    props?.onCancel?.();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <BottleneckForm
                  bottleneck={targetBottleneck}
                  onSave={(b) => {
                    if (editingId) {
                      updateBottleneck(editingId, b);
                      setEditingId(null);
                    } else {
                      addBottleneck(b);
                      setIsCreating(false);
                    }
                    props?.onSave?.(b);
                    setCurrentBottleneck(undefined);
                    setLocalDialogState(null);
                    setDialogState(null);
                    setFieldSuggestions([]);
                  }}
                  onCancel={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setCurrentBottleneck(undefined);
                    setLocalDialogState(null);
                    setDialogState(null);
                    setFieldSuggestions([]);
                    props?.onCancel?.();
                  }}
                  businessData={businessData || undefined}
                  suggestions={fieldSuggestions}
                  onApplySuggestion={handleApplySuggestion}
                  onDismissSuggestion={handleDismissSuggestion}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = (bottleneckId: string) => {
    if (confirm('Вы уверены, что хотите удалить это улучшение процесса?')) {
      deleteBottleneck(bottleneckId);
      if (selectedBottleneck?.id === bottleneckId) {
        navigateToBottlenecksList();
      }
    }
  };

  const handleEdit = (bottleneckId: string) => {
    const bottleneck = bottlenecks.find(b => b.id === bottleneckId);
    if (bottleneck) {
      setEditingId(bottleneckId);
      setCurrentBottleneck(bottleneck);
      setFieldSuggestions([]);
      // Диалог будет инициализирован автоматически через useEffect
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setCurrentBottleneck(undefined);
    setFieldSuggestions([]);
    setLocalDialogState(null);
    setDialogState(null);
  };

  return (
    <div className="space-y-4">
      {/* Кнопка создания */}
      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Создать улучшение процесса
        </button>
      </div>

      {/* Список точек улучшения с кнопками управления */}
      <div className="space-y-2">
        {bottlenecks.map((bottleneck) => (
          <div
            key={bottleneck.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{bottleneck.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{bottleneck.processArea}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(bottleneck.id)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Редактировать"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(bottleneck.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

