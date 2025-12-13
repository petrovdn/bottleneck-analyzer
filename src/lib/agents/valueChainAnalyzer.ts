import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { BusinessData, Bottleneck } from '@/types';

const ANALYSIS_PROMPT = `Ты — эксперт по оптимизации бизнес-процессов. Твоя задача — проанализировать бизнес и выявить узкие места в value chain.

ИНФОРМАЦИЯ О БИЗНЕСЕ:
Продукт/услуга: {productDescription}
Размер команды: {teamSize} человек
Основные потоки работы: {workflows}
Ключевые KPI: {kpis}

ТВОЯ ЗАДАЧА:
1. Проанализировать каждый основной поток работы
2. Выявить 3-5 критических узких мест
3. Для каждого узкого места определить:
   - Название проблемы
   - Область процесса (какой поток затронут)
   - Детальное описание проблемы
   - Текущее влияние на бизнес (конкретные цифры, если возможно)
   - Приоритет (high/medium/low)
   - Потенциальный выигрыш от улучшения
   - Текущий процесс (as-is)
   - Предложенный процесс (to-be)
   - Список агентов для автоматизации (2-4 агента)
   - MCP инструменты (если нужны)

ПРИМЕРЫ ТИПИЧНЫХ УЗКИХ МЕСТ:
- Слабый фоллоу-ап после выставления счёта
- Неактивное управление кампанией продления
- Перегруз на типовых запросах в техподдержке
- Отсутствие интеграции между отделами
- Ручная подготовка коммерческих предложений
- Долгое согласование внутри компании

ФОРМАТ ОТВЕТА (JSON):
Верни массив объектов, каждый со структурой:
{{
  "title": "Краткое название узкого места",
  "processArea": "Название потока",
  "problemDescription": "Детальное описание проблемы (2-3 предложения)",
  "currentImpact": "Влияние на KPI и бизнес (конкретно)",
  "priority": "high|medium|low",
  "potentialGain": "Потенциальный выигрыш (конкретные метрики)",
  "asIsProcess": "Как работает процесс сейчас (4-6 предложений)",
  "toBeProcess": "Как должен работать процесс (4-6 предложений)",
  "suggestedAgents": ["Название агента 1", "Название агента 2"],
  "mcpToolsNeeded": ["tool1", "tool2"]
}}

ВАЖНО: 
- Будь конкретным и практичным
- Фокусируйся на измеримых проблемах
- Предлагай реалистичные решения
- Приоритизируй по потенциальному ROI
- Верни ТОЛЬКО валидный JSON массив, без дополнительного текста`;

export async function analyzeValueChain(
  businessData: BusinessData
): Promise<Bottleneck[]> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
  });

  const prompt = PromptTemplate.fromTemplate(ANALYSIS_PROMPT);

  const formattedPrompt = await prompt.format({
    productDescription: businessData.productDescription,
    teamSize: businessData.teamSize,
    workflows: businessData.workflows,
    kpis: businessData.kpis,
  });

  const response = await model.invoke(formattedPrompt);
  
  // Парсим JSON из ответа
  const content = response.content.toString();
  
  // Убираем markdown code blocks если есть
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from response');
  }
  
  const bottlenecks = JSON.parse(jsonMatch[0]);
  
  // Добавляем уникальные ID
  return bottlenecks.map((b: any, index: number) => ({
    id: `bottleneck_${Date.now()}_${index}`,
    ...b,
  }));
}

