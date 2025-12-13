import { ChatOpenAI } from '@langchain/openai';
import { BusinessData, MultiAgentState, MultiAgentPhase, AgentMessage, ValueChainMap, ProcessStep } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const MANAGER_SYSTEM_PROMPT = `Ты — Manager-агент (Value Chain Advisor), цифровой консультант по цепочке ценности.

ТВОЯ РОЛЬ:
- Вести диалог с руководителем
- Построить общую карту цепочки ценностей
- Поставить задачи подагентам (процесс-майнинг, bottleneck finder, redesign)
- Собрать их выводы в понятный менеджеру язык
- Использовать планирование для декомпозиции запроса

СТРАТЕГИЯ ДИАЛОГА:
1. Быстрая сегментация цепочки ценности (5-10 высокоуровневых вопросов)
2. Уточнение подозрительных зон
3. Сбор минимальных метрик
4. Совместная визуализация

ТИПИЧНЫЕ ВОПРОСЫ:
- "Опишите ваш продукт/услугу"
- "Какие ключевые этапы от лида до денег/доставки?"
- "Кто участвует в каждом этапе?"
- "Какие основные KPI вы отслеживаете?"
- "Где чаще всего 'застревают' заявки?"
- "На каком шаге сотрудники чаще всего работают сверхурочно?"
- "Где больше всего жалоб клиентов?"

Будь дружелюбным, профессиональным и структурированным. Пиши на русском языке.`;

export class ManagerAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
    });
  }

  /**
   * Инициализация диалога - задать первые вопросы для сегментации
   */
  async initializeDialog(businessData: BusinessData): Promise<{
    question: string;
    agentMessage: AgentMessage;
  }> {
    const prompt = `${MANAGER_SYSTEM_PROMPT}

НАЧАЛО РАБОТЫ:
У тебя есть базовая информация о бизнесе:
- Продукт/услуга: ${businessData.productDescription}
- Размер команды: ${businessData.teamSize} человек
- Основные потоки работы: ${businessData.workflows}
- KPI: ${businessData.kpis}

ТВОЯ ЗАДАЧА:
Напиши приветственное сообщение и задай первый вопрос для быстрой сегментации цепочки ценности.
Вопрос должен быть конкретным и помогать понять структуру процессов.

Формат: приветствие + один ключевой вопрос.`;

    const response = await this.llm.invoke(prompt);
    const content = response.content.toString();

    return {
      question: content,
      agentMessage: {
        agentType: 'manager',
        content,
        timestamp: new Date().toISOString(),
        phase: 'initialization',
      },
    };
  }

  /**
   * Продолжить диалог - задать следующий вопрос или перейти к следующей фазе
   */
  async continueDialog(
    state: MultiAgentState,
    userAnswer: string
  ): Promise<{
    question: string | null;
    agentMessage: AgentMessage;
    shouldAdvancePhase: boolean;
    nextPhase?: MultiAgentPhase;
    thinking: string;
  }> {
    const collectedAnswers = Object.entries(state.collectedAnswers)
      .map(([key, value]) => {
        const answerData = typeof value === 'string' ? { answer: value, timestamp: '' } : value;
        return `${key}: ${answerData.answer}`;
      })
      .join('\n');

    const prompt = `${MANAGER_SYSTEM_PROMPT}

ТЕКУЩЕЕ СОСТОЯНИЕ:
Фаза: ${state.phase}
Собранные ответы:
${collectedAnswers || 'Пока нет ответов'}

${state.valueChainMap ? `Текущая карта процессов: ${state.valueChainMap.steps.length} этапов` : 'Карта процессов еще не создана'}

ПОСЛЕДНИЙ ОТВЕТ ПОЛЬЗОВАТЕЛЯ:
${userAnswer}

ТВОЯ ЗАДАЧА:
1. Проанализировать ответ пользователя
2. Решить: задать еще один вопрос ИЛИ перейти к следующей фазе
3. Если задаешь вопрос - он должен быть конкретным и продвигать понимание цепочки
4. Если переходишь к следующей фазе - объясни почему

КРИТЕРИИ ПЕРЕХОДА К СЛЕДУЮЩЕЙ ФАЗЕ:
- Если собрано достаточно информации для построения карты процессов (минимум 3-5 этапов)
- Если пользователь явно просит перейти дальше
- Если задано уже 8-10 вопросов

Верни ответ в JSON формате:
{
  "question": "следующий вопрос или null если переходим к следующей фазе",
  "thinking": "твое размышление о том, что делать дальше",
  "shouldAdvancePhase": true/false,
  "nextPhase": "process_mapping|bottleneck_analysis|solution_design" (если shouldAdvancePhase=true)
}`;

    const response = await this.llm.invoke(prompt);
    const content = response.content.toString();

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          question: result.question || null,
          agentMessage: {
            agentType: 'manager',
            content: result.question || 'Переходим к следующему этапу анализа.',
            timestamp: new Date().toISOString(),
            phase: result.nextPhase || state.phase,
            metadata: { thinking: result.thinking },
          },
          shouldAdvancePhase: result.shouldAdvancePhase || false,
          nextPhase: result.nextPhase,
          thinking: result.thinking || '',
        };
      }
    } catch (e) {
      console.error('Error parsing manager response:', e);
      console.error('Raw response:', content);
    }

    // Fallback - пытаемся извлечь вопрос из текста
    // Если в ответе есть вопрос, используем его
    const questionMatch = content.match(/(?:вопрос|спросить|уточнить)[:：]?\s*(.+?)(?:\.|$)/i);
    const fallbackQuestion = questionMatch 
      ? questionMatch[1].trim() 
      : content.length > 200 
        ? content.substring(0, 200) + '...'
        : content;

    return {
      question: fallbackQuestion || 'Продолжаем анализ. Можете рассказать подробнее?',
      agentMessage: {
        agentType: 'manager',
        content: fallbackQuestion || 'Продолжаем анализ. Можете рассказать подробнее?',
        timestamp: new Date().toISOString(),
        phase: state.phase,
      },
      shouldAdvancePhase: false,
      thinking: 'Использован fallback ответ из-за ошибки парсинга',
    };
  }

  /**
   * Создать план работы для подагентов
   */
  async createPlan(state: MultiAgentState): Promise<{
    plan: string[];
    agentMessage: AgentMessage;
  }> {
    const prompt = `${MANAGER_SYSTEM_PROMPT}

СОСТОЯНИЕ:
${JSON.stringify(
  Object.entries(state.collectedAnswers).map(([key, value]) => {
    const answerData = typeof value === 'string' ? { answer: value, timestamp: '' } : value;
    return { [key]: answerData.answer };
  }),
  null,
  2
)}

ТВОЯ ЗАДАЧА:
Создай план работы для подагентов:
1. Процесс-майнинг агент должен структурировать собранную информацию
2. Bottleneck-агент должен найти узкие места
3. Re-design агент должен предложить решения

Верни план в виде списка задач (массив строк).`;

    const response = await this.llm.invoke(prompt);
    const content = response.content.toString();

    let plan: string[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        // Парсим как список
        plan = content
          .split('\n')
          .filter((line) => line.trim().match(/^\d+[\.\)]/))
          .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim());
      }
    } catch (e) {
      plan = ['Структурировать процессы', 'Найти узкие места', 'Предложить решения'];
    }

    return {
      plan,
      agentMessage: {
        agentType: 'manager',
        content: `План работы:\n${plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
        timestamp: new Date().toISOString(),
        phase: state.phase,
      },
    };
  }
}

