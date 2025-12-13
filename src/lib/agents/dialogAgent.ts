import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage } from '@langchain/core/messages';
import { 
  BusinessData, 
  Bottleneck, 
  DialogState, 
  ChatMessage, 
  DialogPhase,
  RefinedBottleneck 
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Состояние для обработки диалога
interface GraphState {
  businessData: BusinessData;
  bottleneck: Bottleneck;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  dialogPhase: DialogPhase;
  insights: string[];
  clarifications: string[];
  proposedSolution: string | null;
  currentUserMessage: string;
  responseMessage: string;
  thinking: string;
  isComplete: boolean;
}

// Системные промпты для разных фаз диалога
const PHASE_PROMPTS: Record<DialogPhase, string> = {
  clarifying: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза УТОЧНЕНИЯ проблемы.

ТВОЯ ЗАДАЧА:
1. Внимательно выслушать пользователя
2. Задать уточняющие вопросы чтобы глубже понять проблему
3. Выявить корневые причины узкого места
4. Понять контекст и ограничения

СТИЛЬ ОБЩЕНИЯ:
- Будь эмпатичным и внимательным
- Задавай открытые вопросы
- Переформулируй ответы пользователя для подтверждения понимания
- Не торопись с решениями - сначала пойми проблему

ПРИМЕРЫ ВОПРОСОВ:
- "Можете рассказать подробнее, как именно это проявляется на практике?"
- "Как часто это происходит? Есть ли закономерности?"
- "Кто в команде больше всего страдает от этой проблемы?"
- "Пробовали ли вы что-то менять? Что сработало, что нет?"
- "Какие последствия вы видите, если ничего не менять?"

После 2-3 уточняющих вопросов и ответов, предложи перейти к глубокому анализу.`,

  deep_dive: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза ГЛУБОКОГО АНАЛИЗА.

ТВОЯ ЗАДАЧА:
1. Проанализировать собранную информацию
2. Выявить паттерны и взаимосвязи
3. Определить ключевые точки воздействия
4. Обсудить приоритеты с пользователем

СТИЛЬ ОБЩЕНИЯ:
- Делись своими наблюдениями и гипотезами
- Проверяй свои предположения с пользователем
- Визуализируй проблему словами (as-is → to-be)
- Помогай увидеть картину целиком

ПРИМЕРЫ ФРАЗ:
- "Исходя из того, что вы рассказали, я вижу следующую картину..."
- "Похоже, что корневая причина в..."
- "Интересно, что это влияет на... Вы замечали это?"
- "Давайте посмотрим на это с другой стороны..."

После анализа предложи перейти к проектированию решения.`,

  solution_design: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза ПРОЕКТИРОВАНИЯ РЕШЕНИЯ.

ТВОЯ ЗАДАЧА:
1. Предложить конкретные варианты решения
2. Обсудить плюсы и минусы каждого
3. Адаптировать решение под контекст пользователя
4. Согласовать финальный вариант

СТИЛЬ ОБЩЕНИЯ:
- Будь конкретным и практичным
- Предлагай варианты, а не навязывай
- Учитывай ограничения пользователя
- Разбивай большое решение на шаги

СТРУКТУРА РЕШЕНИЯ:
1. Какие агенты нужны и что они делают
2. Как они взаимодействуют
3. Какой UI/UX нужен
4. Какие интеграции потребуются
5. Какие метрики успеха

После согласования решения предложи обсудить реализацию.`,

  implementation: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза ОБСУЖДЕНИЯ РЕАЛИЗАЦИИ.

ТВОЯ ЗАДАЧА:
1. Детализировать план реализации
2. Определить приоритеты и этапы
3. Обсудить технические аспекты
4. Подготовить финальное резюме

СТИЛЬ ОБЩЕНИЯ:
- Будь конкретным про шаги
- Учитывай технические возможности
- Помогай приоритизировать
- Подводи итоги

СТРУКТУРА ОБСУЖДЕНИЯ:
1. Этапы реализации
2. Что делать первым (quick wins)
3. Технические требования
4. Критерии успеха
5. Риски и как их минимизировать

Когда пользователь доволен планом, подведи итог и предложи сгенерировать промпт.`,

  complete: `Диалог завершен. Резюмируй все договоренности и предложи перейти к генерации промпта.`
};

// Создание LLM
function createLLM() {
  return new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
  });
}

// Функции обработки диалога

// 1. Анализ фазы и подготовка контекста
async function analyzePhase(state: GraphState): Promise<Partial<GraphState>> {
  const llm = createLLM();
  
  const analysisPrompt = `Проанализируй текущее состояние диалога и определи:
1. На какой мы фазе (clarifying/deep_dive/solution_design/implementation/complete)
2. Какие ключевые инсайты уже собраны
3. Что нужно уточнить дальше

БИЗНЕС:
${state.businessData.productDescription}
Команда: ${state.businessData.teamSize}
Процессы: ${state.businessData.workflows}
KPI: ${state.businessData.kpis}

УЗКОЕ МЕСТО:
${state.bottleneck.title}
${state.bottleneck.problemDescription}

ТЕКУЩАЯ ФАЗА: ${state.dialogPhase}
СОБРАННЫЕ ИНСАЙТЫ: ${state.insights.join(', ') || 'пока нет'}
УТОЧНЕНИЯ ПОЛЬЗОВАТЕЛЯ: ${state.clarifications.join(', ') || 'пока нет'}

ПОСЛЕДНЕЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:
${state.currentUserMessage}

Ответь в JSON формате:
{
  "shouldAdvancePhase": true/false,
  "nextPhase": "clarifying|deep_dive|solution_design|implementation|complete",
  "newInsights": ["инсайт1", "инсайт2"],
  "reasoning": "почему принял такое решение"
}`;

  const response = await llm.invoke(analysisPrompt);
  const content = response.content.toString();
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        dialogPhase: analysis.shouldAdvancePhase ? analysis.nextPhase : state.dialogPhase,
        insights: [...state.insights, ...(analysis.newInsights || [])],
        thinking: analysis.reasoning,
        isComplete: analysis.nextPhase === 'complete',
      };
    }
  } catch (e) {
    console.error('Error parsing phase analysis:', e);
  }
  
  return {};
}

// 2. Генерация ответа агента
async function generateResponse(state: GraphState): Promise<Partial<GraphState>> {
  const llm = createLLM();
  
  const phasePrompt = PHASE_PROMPTS[state.dialogPhase];
  
  const systemPrompt = `${phasePrompt}

КОНТЕКСТ БИЗНЕСА:
Продукт: ${state.businessData.productDescription}
Команда: ${state.businessData.teamSize} человек
Процессы: ${state.businessData.workflows}
KPI: ${state.businessData.kpis}

АНАЛИЗИРУЕМОЕ УЗКОЕ МЕСТО:
Название: ${state.bottleneck.title}
Область: ${state.bottleneck.processArea}
Проблема: ${state.bottleneck.problemDescription}
Текущее влияние: ${state.bottleneck.currentImpact}
Потенциальный выигрыш: ${state.bottleneck.potentialGain}

СОБРАННЫЕ ИНСАЙТЫ:
${state.insights.length > 0 ? state.insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n') : 'Пока нет инсайтов'}

УТОЧНЕНИЯ ОТ ПОЛЬЗОВАТЕЛЯ:
${state.clarifications.length > 0 ? state.clarifications.map((c, idx) => `${idx + 1}. ${c}`).join('\n') : 'Пока нет уточнений'}

${state.proposedSolution ? `ПРЕДЛОЖЕННОЕ РЕШЕНИЕ:\n${state.proposedSolution}` : ''}

Отвечай на русском языке. Будь конкретным и полезным.`;

  // Формируем полный промпт с историей
  const historyText = state.messages.map(m => 
    m.role === 'user' ? `Пользователь: ${m.content}` : `Консультант: ${m.content}`
  ).join('\n\n');
  
  const fullPrompt = `${systemPrompt}\n\n${historyText ? `История диалога:\n${historyText}\n\n` : ''}Пользователь: ${state.currentUserMessage}\n\nКонсультант:`;
  
  const response = await llm.invoke(fullPrompt);
  
  return {
    responseMessage: response.content.toString(),
    messages: [
      ...state.messages,
      { role: 'user' as const, content: state.currentUserMessage },
      { role: 'assistant' as const, content: response.content.toString() }
    ],
    clarifications: [...state.clarifications, state.currentUserMessage],
  };
}

// 3. Проверка и извлечение решения (для фазы solution_design)
async function checkSolution(state: GraphState): Promise<Partial<GraphState>> {
  if (state.dialogPhase !== 'solution_design' && state.dialogPhase !== 'implementation') {
    return {};
  }
  
  const llm = createLLM();
  
  const extractPrompt = `На основе диалога, извлеки предложенное решение.

ИСТОРИЯ ДИАЛОГА:
${state.messages.map(m => 
  m.role === 'user' ? `Пользователь: ${m.content}` : `Консультант: ${m.content}`
).join('\n\n')}

Последний ответ: ${state.responseMessage}

Если в диалоге уже обсуждается конкретное решение, опиши его. Если нет - верни null.

Формат ответа JSON:
{
  "hasSolution": true/false,
  "solution": "описание решения если есть"
}`;

  const response = await llm.invoke(extractPrompt);
  const content = response.content.toString();
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      if (result.hasSolution) {
        return {
          proposedSolution: result.solution,
        };
      }
    }
  } catch (e) {
    console.error('Error extracting solution:', e);
  }
  
  return {};
}

// Упрощенный подход: последовательная обработка без сложного графа
// Это более надежно и проще в поддержке для линейного диалога

// Основная функция обработки сообщения
// Используем упрощенный подход: последовательные вызовы функций
export async function processDialogMessage(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  dialogState: DialogState,
  userMessage: string
): Promise<{
  message: ChatMessage;
  updatedDialogState: DialogState;
  refinedBottleneck?: RefinedBottleneck;
}> {
  
  // Конвертируем историю сообщений в простой формат
  const messages = dialogState.messages.map(msg => ({
    role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }));
  
  // Создаем состояние для обработки
  const state: GraphState = {
    businessData,
    bottleneck,
    messages,
    dialogPhase: dialogState.phase,
    insights: dialogState.insights,
    clarifications: dialogState.clarifications,
    proposedSolution: dialogState.proposedSolution,
    currentUserMessage: userMessage,
    responseMessage: '',
    thinking: '',
    isComplete: dialogState.isComplete,
  };
  
  // Последовательно выполняем обработку
  // 1. Анализируем фазу
  const phaseResult = await analyzePhase(state);
  const updatedState = { ...state, ...phaseResult };
  
  // 2. Генерируем ответ
  const responseResult = await generateResponse(updatedState);
  const finalState = { ...updatedState, ...responseResult };
  
  // 3. Проверяем решение
  const solutionResult = await checkSolution(finalState);
  const completeState = { ...finalState, ...solutionResult };
  
  // Создаем сообщение ответа
  const responseMessage: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: completeState.responseMessage,
    timestamp: new Date().toISOString(),
    phase: completeState.dialogPhase,
    thinking: completeState.thinking,
  };
  
  // Обновляем состояние диалога
  const updatedDialogState: DialogState = {
    bottleneckId: dialogState.bottleneckId,
    phase: completeState.dialogPhase,
    messages: [
      ...dialogState.messages,
      {
        id: uuidv4(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
      responseMessage,
    ],
    insights: completeState.insights,
    clarifications: completeState.clarifications,
    proposedSolution: completeState.proposedSolution,
    isComplete: completeState.isComplete,
  };
  
  // Если диалог завершен, создаем уточненное узкое место
  let refinedBottleneck: RefinedBottleneck | undefined;
  
  if (completeState.isComplete && completeState.proposedSolution) {
    refinedBottleneck = {
      ...bottleneck,
      userClarifications: completeState.clarifications,
      agreedSolution: completeState.proposedSolution,
      implementationDetails: await generateImplementationDetails(
        businessData,
        bottleneck,
        completeState.proposedSolution,
        completeState.insights
      ),
      dialogSummary: await generateDialogSummary(updatedDialogState),
      refinedAt: new Date().toISOString(),
    };
  }
  
  return {
    message: responseMessage,
    updatedDialogState,
    refinedBottleneck,
  };
}

// Генерация деталей реализации
async function generateImplementationDetails(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  solution: string,
  insights: string[]
): Promise<string> {
  const llm = createLLM();
  
  const prompt = `На основе согласованного решения, сгенерируй детали реализации.

БИЗНЕС:
${businessData.productDescription}
Команда: ${businessData.teamSize}
KPI: ${businessData.kpis}

УЗКОЕ МЕСТО:
${bottleneck.title}
${bottleneck.problemDescription}

СОГЛАСОВАННОЕ РЕШЕНИЕ:
${solution}

ИНСАЙТЫ ИЗ ДИАЛОГА:
${insights.join('\n')}

Опиши:
1. Технические требования
2. Этапы реализации
3. Необходимые интеграции
4. Метрики успеха
5. Возможные риски

Формат: структурированный текст на русском.`;

  const response = await llm.invoke(prompt);
  return response.content.toString();
}

// Генерация резюме диалога
async function generateDialogSummary(dialogState: DialogState): Promise<string> {
  const llm = createLLM();
  
  const messagesText = dialogState.messages
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'Консультант'}: ${m.content}`)
    .join('\n\n');
  
  const prompt = `Создай краткое резюме диалога (3-5 предложений).

ДИАЛОГ:
${messagesText}

ИНСАЙТЫ:
${dialogState.insights.join(', ')}

Резюме должно содержать:
- Главную проблему
- Ключевые уточнения
- Согласованное решение`;

  const response = await llm.invoke(prompt);
  return response.content.toString();
}

// Инициализация диалога - первое сообщение от агента
export async function initializeDialog(
  businessData: BusinessData,
  bottleneck: Bottleneck
): Promise<DialogState> {
  const llm = createLLM();
  
  const prompt = `Ты — эксперт-консультант по оптимизации бизнес-процессов. 
Начни диалог с пользователем для уточнения узкого места в его бизнесе.

БИЗНЕС:
Продукт: ${businessData.productDescription}
Команда: ${businessData.teamSize} человек
Процессы: ${businessData.workflows}
KPI: ${businessData.kpis}

УЗКОЕ МЕСТО (первичный анализ):
Название: ${bottleneck.title}
Область: ${bottleneck.processArea}
Проблема: ${bottleneck.problemDescription}
Текущее влияние: ${bottleneck.currentImpact}

ТВОЯ ЗАДАЧА:
Напиши приветственное сообщение, в котором:
1. Покажи что понимаешь контекст
2. Кратко опиши выявленную проблему
3. Задай первый уточняющий вопрос

Будь дружелюбным и профессиональным. Пиши на русском.`;

  const response = await llm.invoke(prompt);
  
  const initialMessage: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: response.content.toString(),
    timestamp: new Date().toISOString(),
    phase: 'clarifying',
  };
  
  return {
    bottleneckId: bottleneck.id,
    phase: 'clarifying',
    messages: [initialMessage],
    insights: [],
    clarifications: [],
    proposedSolution: null,
    isComplete: false,
  };
}


