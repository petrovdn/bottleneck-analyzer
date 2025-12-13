'use client';

import { useState } from 'react';
import { BusinessData } from '@/types';
import { Briefcase, Users, Workflow, Target } from 'lucide-react';

interface DiscoveryFormProps {
  onSubmit: (data: BusinessData) => void;
  isLoading: boolean;
}

export default function DiscoveryForm({ onSubmit, isLoading }: DiscoveryFormProps) {
  const [formData, setFormData] = useState<BusinessData>({
    productDescription: '',
    teamSize: 0,
    workflows: '',
    kpis: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'teamSize' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Давайте определим ваш бизнес
          </h1>
          <p className="text-lg text-gray-600">
            Расскажите о вашей компании, чтобы мы могли выявить узкие места
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Описание продукта */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
              Описание продукта/услуги
            </label>
            <textarea
              name="productDescription"
              value={formData.productDescription}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Например: SaaS платформа для управления проектами с функциями трекинга времени, коллаборации и отчётности"
            />
          </div>

          {/* Размер команды */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Размер команды
            </label>
            <input
              type="number"
              name="teamSize"
              value={formData.teamSize || ''}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Количество сотрудников"
            />
          </div>

          {/* Основные потоки работы */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <Workflow className="w-5 h-5 mr-2 text-blue-600" />
              Основные потоки работы
            </label>
            <textarea
              name="workflows"
              value={formData.workflows}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Например: Привлечение лидов, продажи, онбординг клиентов, техподдержка, продления договоров"
            />
            <p className="mt-1 text-sm text-gray-500">
              Перечислите через запятую основные бизнес-процессы
            </p>
          </div>

          {/* KPI */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Ключевые KPI / метрики успеха
            </label>
            <textarea
              name="kpis"
              value={formData.kpis}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Например: MRR, Churn Rate, Customer Lifetime Value, Conversion Rate, Time to Resolution"
            />
            <p className="mt-1 text-sm text-gray-500">
              Какие показатели вы отслеживаете?
            </p>
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Анализируем ваш бизнес...
              </span>
            ) : (
              'Далее: анализ узких мест'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

