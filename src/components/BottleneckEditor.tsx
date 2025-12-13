'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Bottleneck, Priority } from '@/types';
import { Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface BottleneckEditorProps {
  bottleneck?: Bottleneck;
  onSave?: (bottleneck: Bottleneck) => void;
  onCancel?: () => void;
}

// Форма редактирования узкого места
export function BottleneckForm({ 
  bottleneck, 
  onSave, 
  onCancel 
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

// Основной компонент редактора
interface BottleneckEditorMainProps {
  bottleneck?: Bottleneck;
  onSave?: (bottleneck: Bottleneck) => void;
  onCancel?: () => void;
}

export default function BottleneckEditor(props?: BottleneckEditorMainProps) {
  const {
    bottlenecks,
    selectedBottleneck,
    addBottleneck,
    updateBottleneck,
    deleteBottleneck,
    navigateToBottlenecksList,
  } = useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Если передан bottleneck через props, работаем в режиме редактирования
  if (props?.bottleneck) {
    return (
      <BottleneckForm
        bottleneck={props.bottleneck}
        onSave={props.onSave || ((b) => updateBottleneck(b.id, b))}
        onCancel={props.onCancel}
      />
    );
  }

  const handleSave = (bottleneck: Bottleneck) => {
    if (editingId) {
      updateBottleneck(editingId, bottleneck);
      setEditingId(null);
    } else {
      addBottleneck(bottleneck);
      setIsCreating(false);
    }
  };

  const handleDelete = (bottleneckId: string) => {
    if (confirm('Вы уверены, что хотите удалить это узкое место?')) {
      deleteBottleneck(bottleneckId);
      if (selectedBottleneck?.id === bottleneckId) {
        navigateToBottlenecksList();
      }
    }
  };

  if (isCreating) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Создать новое узкое место</h2>
          <button
            onClick={() => setIsCreating(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <BottleneckForm
          onSave={handleSave}
          onCancel={() => setIsCreating(false)}
        />
      </div>
    );
  }

  if (editingId) {
    const bottleneck = bottlenecks.find(b => b.id === editingId);
    if (!bottleneck) {
      setEditingId(null);
      return null;
    }

    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Редактировать узкое место</h2>
          <button
            onClick={() => setEditingId(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <BottleneckForm
          bottleneck={bottleneck}
          onSave={handleSave}
          onCancel={() => setEditingId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Кнопка создания */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Создать узкое место
        </button>
      </div>

      {/* Список узких мест с кнопками управления */}
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
                onClick={() => setEditingId(bottleneck.id)}
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

