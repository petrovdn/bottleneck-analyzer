import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage } from '@langchain/core/messages';
import { 
  BusinessData, 
  Bottleneck, 
  DialogState, 
  ChatMessage, 
  DialogPhase,
  RefinedBottleneck,
  FieldSuggestion,
  Priority
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Извлечение предложений изменений полей из диалога
async function extractFieldSuggestions(state: GraphState): Promise<FieldSuggestion[]> {
  const llm = createLLM();
  
  // Извлекаем предложения только если есть достаточно диалога
  if (state.messages.length < 2) {
    return [];
  }
  
  const messagesText = state.messages.map(m => 
    m.role === 'user' ? `Пользователь: ${m.content}` : `Консультант: ${m.content}`
  ).join('\n\n');
  
  const currentBottleneck = state.bottleneck;
  
  const prompt = `На основе диалога проанализируй, какие поля карточки точки улучшения можно улучшить или уточнить.

ИСТОРИЯ ДИАЛОГА:
${messagesText}

Последний ответ консультанта: ${state.responseMessage}

ТЕКУЩАЯ ФАЗА: ${state.dialogPhase}

ТЕКУЩИЕ ЗНАЧЕНИЯ ПОЛЕЙ:
- title: "${currentBottleneck.title}"
- processArea: "${currentBottleneck.processArea}"
- problemDescription: "${currentBottleneck.problemDescription}"
- currentImpact: "${currentBottleneck.currentImpact}"
- priority: "${currentBottleneck.priority}"
- potentialGain: "${currentBottleneck.potentialGain}"
- asIsProcess: "${currentBottleneck.asIsProcess}"
- toBeProcess: "${currentBottleneck.toBeProcess}"

ТВОЯ ЗАДАЧА:
Проанализируй диалог и определи, для каких полей можно предложить улучшенные значения на основе информации из диалога.

Для каждого поля, которое можно улучшить, верни:
- field: название поля (только: title, processArea, problemDescription, currentImpact, priority, potentialGain, asIsProcess, toBeProcess)
- currentValue: текущее значение поля
- suggestedValue: предлагаемое улучшенное значение
- reason: краткое обоснование, почему это изменение улучшит карточку

ВАЖНО:
- Предлагай изменения только если в диалоге есть новая информация, которая улучшает поле
- Для priority возвращай одно из значений: "high", "medium", "low"
- Не предлагай изменения, если текущее значение уже хорошее или если нет новой информации
- НЕ предлагай изменения для полей suggestedAgents и mcpToolsNeeded (эти поля удалены)

Верни JSON массив предложений:
[
  {
    "field": "название_поля",
    "currentValue": "текущее значение",
    "suggestedValue": "предлагаемое значение",
    "reason": "обоснование изменения"
  }
]

Если нет предложений, верни пустой массив [].`;

  try {
    const response = await llm.invoke(prompt);
    const content = response.content.toString();
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      
      // Валидация и фильтрация предложений
      const validSuggestions: FieldSuggestion[] = suggestions
        .filter((s: any) => {
          // Проверяем, что поле существует в Bottleneck (исключаем suggestedAgents и mcpToolsNeeded)
          const validFields: (keyof Bottleneck)[] = [
            'title', 'processArea', 'problemDescription', 'currentImpact',
            'priority', 'potentialGain', 'asIsProcess', 'toBeProcess'
          ];
          return validFields.includes(s.field) && 
                 s.currentValue !== undefined &&
                 s.suggestedValue !== undefined &&
                 s.reason !== undefined &&
                 s.currentValue !== s.suggestedValue; // Не предлагать, если значение не изменилось
        })
        .map((s: any) => ({
          field: s.field as keyof Bottleneck,
          currentValue: typeof s.currentValue === 'string' ? s.currentValue : JSON.stringify(s.currentValue),
          suggestedValue: typeof s.suggestedValue === 'string' ? s.suggestedValue : JSON.stringify(s.suggestedValue),
          reason: s.reason,
        }));
      
      return validSuggestions;
    }
  } catch (e) {
    console.error('Error extracting field suggestions:', e);
  }
  
  return [];
}

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
  clarifying: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза УТОЧНЕНИЯ текущего процесса (AS-IS).

ТВОЯ ЗАДАЧА:
1. Детально выяснить, как процесс работает СЕЙЧАС
2. Понять все шаги, участников, инструменты, временные рамки
3. Выявить проблемы, точки улучшения, неэффективности
4. Понять контекст и ограничения

СТИЛЬ ОБЩЕНИЯ:
- Будь эмпатичным и внимательным
- Задавай открытые вопросы о текущем процессе
- Уточняй детали: кто, что, когда, как, почему
- Переформулируй ответы для подтверждения понимания
- Будь КРАТКИМ: каждый ответ не более 400 символов
- Задавай только один вопрос за раз

ПРИМЕРЫ ВОПРОСОВ:
- "Расскажите подробнее, как сейчас происходит [процесс]?"
- "Кто участвует в этом процессе? Какие роли?"
- "Сколько времени занимает каждый этап?"
- "Какие инструменты или системы используются?"
- "Где возникают задержки или проблемы?"
- "Что мешает процессу быть быстрее/эффективнее?"

После того как соберешь полную картину текущего процесса, предложи перейти к обсуждению желаемого состояния.`,

  deep_dive: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза ОПРЕДЕЛЕНИЯ ЖЕЛАЕМОГО ПРОЦЕССА (TO-BE).

ТВОЯ ЗАДАЧА:
1. Понять, как процесс должен работать в идеале
2. Выяснить цели и ожидания пользователя
3. Определить ключевые улучшения
4. Обсудить возможности и ограничения

СТИЛЬ ОБЩЕНИЯ:
- Помогай визуализировать идеальный процесс
- Задавай вопросы о желаемых результатах
- Проверяй реалистичность ожиданий
- Помогай формулировать конкретные цели
- Будь КРАТКИМ: каждый ответ не более 400 символов
- Задавай только один вопрос за раз

ПРИМЕРЫ ФРАЗ:
- "Как вы видите идеальный процесс? Опишите пошагово."
- "Что должно измениться по сравнению с текущим процессом?"
- "Какие результаты вы хотите получить?"
- "Какие метрики важны для вас?"
- "Что должно стать быстрее/проще/точнее?"

После обсуждения желаемого состояния предложи перейти к проектированию решения.`,

  solution_design: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза ПРОЕКТИРОВАНИЯ РЕШЕНИЯ.

ТВОЯ ЗАДАЧА:
1. Предложить конкретное решение для перехода от AS-IS к TO-BE
2. Описать новый процесс детально
3. Определить необходимые сервисы, агенты, инструменты
4. Согласовать финальный вариант решения

СТИЛЬ ОБЩЕНИЯ:
- Будь конкретным и практичным
- Описывай новый процесс пошагово
- Предлагай варианты, обсуждай плюсы и минусы
- Учитывай ограничения и возможности
- Будь КРАТКИМ: каждый ответ не более 400 символов
- Задавай только один вопрос за раз

СТРУКТУРА РЕШЕНИЯ:
1. Описание нового процесса (как будет работать)
2. Какие сервисы/агенты нужны и что они делают
3. Как они взаимодействуют между собой
4. Какие инструменты и интеграции потребуются
5. Какие метрики успеха

После согласования решения предложи перейти к техническому заданию.`,

  implementation: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза СОЗДАНИЯ ТЕХНИЧЕСКОГО ЗАДАНИЯ.

ТВОЯ ЗАДАЧА:
1. Задать несколько уточняющих вопросов (3-5 вопросов) для создания детального ТЗ
2. После сбора информации создать техническое задание размером около 1000 символов
3. Описать функциональные и технические требования
4. Указать этапы реализации

СТИЛЬ ОБЩЕНИЯ:
- Будь конкретным и техническим
- Задавай несколько уточняющих вопросов перед генерацией ТЗ
- Вопросы должны касаться: функциональности, технических требований, интеграций, этапов разработки
- Будь КРАТКИМ: каждый вопрос не более 400 символов
- Задавай вопросы по одному, жди ответа перед следующим вопросом

ПРОЦЕСС:
1. Задай первый вопрос о функциональных требованиях
2. После ответа задай второй вопрос о технических требованиях
3. После ответа задай третий вопрос об интеграциях или этапах
4. Продолжай задавать вопросы (всего 3-5 вопросов)
5. После сбора всей информации создай ТЗ размером около 1000 символов

СТРУКТУРА ТЗ (когда будешь создавать):
1. Назначение сервиса
2. Функциональные требования
3. Технические требования
4. Интерфейсы и интеграции
5. Этапы разработки
6. Критерии приемки

ВАЖНО: Не создавай ТЗ сразу, сначала задай все уточняющие вопросы. Только после получения ответов на все вопросы создавай ТЗ.`,

  complete: `Диалог завершен. Резюмируй результаты: краткое описание нового процесса и готовность ТЗ. Будь КРАТКИМ: не более 400 символов.`
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

ВАЖНО:
- Отвечай на русском языке
- Будь конкретным и полезным
${state.dialogPhase === 'implementation' 
  ? '- Когда генерируешь ТЗ, пиши его ПОЛНОСТЬЮ, без ограничений по длине'
  : '- Твой ответ должен быть КРАТКИМ (не более 400 символов)\n- Задавай только один конкретный вопрос за раз\n- Избегай длинных объяснений, будь лаконичным'}`;

  // Формируем полный промпт с историей
  const historyText = state.messages.map(m => 
    m.role === 'user' ? `Пользователь: ${m.content}` : `Консультант: ${m.content}`
  ).join('\n\n');
  
  const fullPrompt = `${systemPrompt}\n\n${historyText ? `История диалога:\n${historyText}\n\n` : ''}Пользователь: ${state.currentUserMessage}\n\nКонсультант:`;
  
  const response = await llm.invoke(fullPrompt);
  let responseContent = response.content.toString().trim();
  
  // Ограничиваем длину ответа до 400 символов ТОЛЬКО если это не фаза implementation
  // В фазе implementation может быть ТЗ, которое должно быть полным
  if (state.dialogPhase !== 'implementation' && responseContent.length > 400) {
    // Пытаемся обрезать по последнему предложению
    const lastPeriod = responseContent.lastIndexOf('.', 397);
    const lastQuestion = responseContent.lastIndexOf('?', 397);
    const lastExclamation = responseContent.lastIndexOf('!', 397);
    const lastPunctuation = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    if (lastPunctuation > 300) {
      responseContent = responseContent.substring(0, lastPunctuation + 1);
    } else {
      responseContent = responseContent.substring(0, 397) + '...';
    }
  }
  
  return {
    responseMessage: responseContent,
    messages: [
      ...state.messages,
      { role: 'user' as const, content: state.currentUserMessage },
      { role: 'assistant' as const, content: response.content.toString() }
    ],
    clarifications: [...state.clarifications, state.currentUserMessage],
  };
}

// 3. Проверка и извлечение решения (для фазы solution_design и implementation)
async function checkSolution(state: GraphState): Promise<Partial<GraphState>> {
  if (state.dialogPhase !== 'solution_design' && state.dialogPhase !== 'implementation') {
    return {};
  }
  
  // Для фазы implementation считаем количество вопросов от агента
  if (state.dialogPhase === 'implementation') {
    const implementationMessages = state.messages.filter(m => 
      m.role === 'assistant' && m.content.includes('?')
    );
    const questionsCount = implementationMessages.length;
    
    // Если задано меньше 3 вопросов, продолжаем задавать вопросы
    if (questionsCount < 3) {
      return {};
    }
    
    // Если задано достаточно вопросов, проверяем, готово ли ТЗ
    const llm = createLLM();
    const extractPrompt = `На основе диалога определи, готово ли техническое задание.

ИСТОРИЯ ДИАЛОГА:
${state.messages.map(m => 
  m.role === 'user' ? `Пользователь: ${m.content}` : `Консультант: ${m.content}`
).join('\n\n')}

Последний ответ консультанта: ${state.responseMessage}

Вопросов задано: ${questionsCount}

Если консультант уже создал техническое задание (ТЗ) в последнем ответе, извлеки его полностью. 
Если ТЗ еще не создано, верни hasTechnicalSpec: false.

ВАЖНО: Если ТЗ есть, извлеки его ПОЛНОСТЬЮ, не обрезай.

Формат ответа JSON:
{
  "hasTechnicalSpec": true/false,
  "technicalSpec": "полный текст ТЗ если есть"
}`;

    const response = await llm.invoke(extractPrompt);
    const content = response.content.toString();
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        if (result.hasTechnicalSpec && result.technicalSpec) {
          // Если ТЗ уже есть в ответе, возвращаем его
          return {
            proposedSolution: result.technicalSpec,
            isComplete: true,
          };
        }
      }
    } catch (e) {
      console.error('Error extracting technical spec:', e);
    }
    
    // Если ТЗ еще не создано, но задано достаточно вопросов, генерируем его
    // Это происходит, когда пользователь просит создать ТЗ
    if (state.currentUserMessage.toLowerCase().includes('тз') || 
        state.currentUserMessage.toLowerCase().includes('техническое задание') ||
        state.currentUserMessage.toLowerCase().includes('напиши тз')) {
      
      const technicalSpec = await generateTechnicalSpec(
        state.businessData,
        state.bottleneck,
        {
          bottleneckId: state.bottleneck.id,
          phase: state.dialogPhase,
          messages: state.messages.map(m => ({
            id: uuidv4(),
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
            timestamp: new Date().toISOString(),
            phase: state.dialogPhase,
          })),
          insights: state.insights,
          clarifications: state.clarifications,
          proposedSolution: state.proposedSolution || '',
          isComplete: false,
        },
        state.proposedSolution || ''
      );
      
      // Включаем ТЗ в ответ агента
      return {
        proposedSolution: technicalSpec,
        responseMessage: state.responseMessage + '\n\n' + technicalSpec,
        isComplete: true,
      };
    }
    
    return {};
  }
  
  // Для фазы solution_design извлекаем решение
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
  updatedBottleneck?: Partial<Bottleneck>;
  fieldSuggestions?: FieldSuggestion[];
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
  
  // 4. Извлекаем предложения изменений полей из диалога
  const fieldSuggestions = await extractFieldSuggestions(completeState);
  
  // 5. Проверяем, просит ли пользователь промпт для Cursor
  let finalResponseContent = completeState.responseMessage;
  const userMessageLower = userMessage.toLowerCase();
  const isPromptRequest = userMessageLower.includes('промпт') || 
                          userMessageLower.includes('prompt') ||
                          userMessageLower.includes('курсор') ||
                          userMessageLower.includes('cursor');
  
  if (isPromptRequest && completeState.proposedSolution) {
    console.log('Generating Cursor prompt...');
    try {
      const cursorPrompt = await generateCursorPrompt(
        businessData,
        bottleneck,
        dialogState,
        completeState.proposedSolution
      );
      finalResponseContent = completeState.responseMessage + '\n\n**ПРОМПТ ДЛЯ CURSOR:**\n\n' + cursorPrompt;
      console.log('Cursor prompt generated, length:', cursorPrompt.length);
    } catch (error) {
      console.error('Error generating Cursor prompt:', error);
      finalResponseContent = completeState.responseMessage + '\n\nОшибка при генерации промпта для Cursor. Попробуйте еще раз.';
    }
  }
  
  // Создаем сообщение ответа
  const responseMessage: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: finalResponseContent,
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
      processDescription: await generateProcessDescription(
        businessData,
        bottleneck,
        updatedDialogState,
        completeState.proposedSolution
      ),
      technicalSpec: await generateTechnicalSpec(
        businessData,
        bottleneck,
        updatedDialogState,
        completeState.proposedSolution
      ),
    };
  }
  
  // Создаем updatedBottleneck на основе fieldSuggestions
  let updatedBottleneck: Partial<Bottleneck> | undefined;
  if (fieldSuggestions.length > 0) {
    updatedBottleneck = {};
    fieldSuggestions.forEach(suggestion => {
      try {
        if (!updatedBottleneck) return; // Защита от undefined
        
        let newValue: any = suggestion.suggestedValue;
        
        // Парсим JSON для массивов
        if (suggestion.field === 'suggestedAgents' || suggestion.field === 'mcpToolsNeeded') {
          try {
            newValue = JSON.parse(suggestion.suggestedValue);
          } catch {
            newValue = suggestion.suggestedValue.split(',').map(s => s.trim()).filter(s => s);
          }
        }
        
        // Обрабатываем приоритет
        if (suggestion.field === 'priority') {
          const validPriorities: Priority[] = ['high', 'medium', 'low'];
          if (validPriorities.includes(newValue as Priority)) {
            newValue = newValue as Priority;
          } else {
            return; // Пропускаем невалидный приоритет
          }
        }
        
        updatedBottleneck[suggestion.field] = newValue;
      } catch (e) {
        console.error('Error processing suggestion for updatedBottleneck:', e);
      }
    });
    
    // Если нет реальных изменений, не возвращаем updatedBottleneck
    if (Object.keys(updatedBottleneck).length === 0) {
      updatedBottleneck = undefined;
    }
  }

  return {
    message: responseMessage,
    updatedDialogState,
    refinedBottleneck,
    updatedBottleneck,
    fieldSuggestions: fieldSuggestions.length > 0 ? fieldSuggestions : undefined,
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

// Генерация краткого описания нового процесса
async function generateProcessDescription(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  dialogState: DialogState,
  solution: string
): Promise<string> {
  const llm = createLLM();
  
  const messagesText = dialogState.messages
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'Консультант'}: ${m.content}`)
    .join('\n\n');
  
  const prompt = `На основе диалога создай краткое описание нового процесса (2-3 абзаца).

БИЗНЕС:
${businessData.productDescription}
Команда: ${businessData.teamSize}
KPI: ${businessData.kpis}

УЗКОЕ МЕСТО:
${bottleneck.title}
${bottleneck.problemDescription}

СОГЛАСОВАННОЕ РЕШЕНИЕ:
${solution}

ДИАЛОГ:
${messagesText}

Создай структурированное описание нового процесса:
1. Как процесс будет работать (пошагово)
2. Кто участвует и какие роли
3. Какие инструменты и сервисы используются
4. Какие результаты ожидаются

Формат: структурированный текст на русском языке, 2-3 абзаца.`;

  const response = await llm.invoke(prompt);
  return response.content.toString();
}

// Генерация технического задания на сервис
async function generateTechnicalSpec(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  dialogState: DialogState,
  solution: string
): Promise<string> {
  const llm = createLLM();
  
  const messagesText = dialogState.messages
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'Консультант'}: ${m.content}`)
    .join('\n\n');
  
  const prompt = `На основе диалога создай техническое задание на создание сервиса для улучшения процесса.

БИЗНЕС:
${businessData.productDescription}
Команда: ${businessData.teamSize}
KPI: ${businessData.kpis}

УЗКОЕ МЕСТО:
${bottleneck.title}
${bottleneck.problemDescription}

СОГЛАСОВАННОЕ РЕШЕНИЕ:
${solution}

ДИАЛОГ:
${messagesText}

Создай детальное техническое задание размером около 1000 символов, включающее:

1. НАЗНАЧЕНИЕ СЕРВИСА
   - Цель и задачи сервиса
   - Решаемая проблема

2. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
   - Основные функции сервиса
   - Пользовательские сценарии
   - Входные и выходные данные

3. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ
   - Архитектура решения
   - Необходимые агенты и их функции
   - Интеграции с внешними системами
   - Требования к производительности

4. ИНТЕРФЕЙСЫ И API
   - Описание API (если нужно)
   - Форматы данных
   - Протоколы взаимодействия

5. ЭТАПЫ РАЗРАБОТКИ
   - Приоритизация функций
   - План реализации по этапам

6. КРИТЕРИИ ПРИЕМКИ
   - Метрики успеха
   - Условия готовности

ВАЖНО:
- ТЗ должно быть ПОЛНЫМ и ДЕТАЛЬНЫМ (не ограничивай длину, пиши столько, сколько нужно)
- Будь конкретным и детальным
- Структурируй информацию четко
- Опиши все разделы полностью
- Формат: структурированный документ на русском языке
- НЕ обрезай текст, пиши полное ТЗ`;

  const response = await llm.invoke(prompt);
  let content = response.content.toString();
  
  // НЕ ограничиваем размер ТЗ - оно должно быть полным
  // Если LLM вернул обрезанный ответ, это проблема LLM, а не нашей логики
  
  return content;
}

// Генерация промпта для Cursor
async function generateCursorPrompt(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  dialogState: DialogState,
  technicalSpec: string
): Promise<string> {
  const llm = createLLM();
  
  const messagesText = dialogState.messages
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'Консультант'}: ${m.content}`)
    .join('\n\n');
  
  const prompt = `На основе технического задания создай детальный промпт для Cursor AI, который поможет разработчику создать ИИ-помощника.

БИЗНЕС:
${businessData.productDescription}
Команда: ${businessData.teamSize}
KPI: ${businessData.kpis}

ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${technicalSpec}

ДИАЛОГ:
${messagesText}

СОГЛАСОВАННЫЕ ДЕТАЛИ:
- Используется LangGraph для построения агентов
- Для интеграций используются MCP (Model Context Protocol) со всеми нужными системами
- Платформа: Telegram

Создай промпт для Cursor, который:
1. Описывает архитектуру решения на основе ТЗ
2. Указывает использование LangGraph для построения агентов
3. Описывает интеграции через MCP
4. Дает конкретные инструкции по реализации
5. Включает структуру проекта, основные компоненты, API endpoints
6. Описывает взаимодействие с Telegram
7. Включает примеры кода и структуру данных

Промпт должен быть ПОЛНЫМ и ДЕТАЛЬНЫМ, чтобы разработчик мог сразу начать работу.
Формат: структурированный промпт на русском языке, готовый для использования в Cursor.`;

  const response = await llm.invoke(prompt);
  let content = response.content.toString();
  
  // НЕ ограничиваем размер промпта - он должен быть полным
  
  return content;
}

// Инициализация диалога - первое сообщение от агента
export async function initializeDialog(
  businessData: BusinessData,
  bottleneck: Bottleneck
): Promise<DialogState> {
  const llm = createLLM();
  
  // Проверяем, является ли точка улучшения новой (пустой)
  const isNewBottleneck = !bottleneck.title && !bottleneck.problemDescription;
  
  const bottleneckInfo = isNewBottleneck 
    ? 'Пользователь создает новую точку улучшения процесса. Поля еще не заполнены.'
    : `Название: ${bottleneck.title || 'не указано'}
Область: ${bottleneck.processArea || 'не указано'}
Проблема: ${bottleneck.problemDescription || 'не указано'}
Текущее влияние: ${bottleneck.currentImpact || 'не указано'}`;

  const prompt = `Ты — эксперт-консультант по оптимизации бизнес-процессов. 
Начни диалог с пользователем для детального понимания текущего процесса (AS-IS) и проектирования улучшенного процесса (TO-BE).

БИЗНЕС:
Продукт: ${businessData.productDescription}
Команда: ${businessData.teamSize} человек
Процессы: ${businessData.workflows}
KPI: ${businessData.kpis}

ИНФОРМАЦИЯ О ТОЧКЕ УЛУЧШЕНИЯ:
${bottleneckInfo}

ТВОЯ ЗАДАЧА:
Напиши краткое приветственное сообщение (не более 400 символов), в котором:
${isNewBottleneck 
  ? '1. Поприветствуй пользователя и предложи помочь создать новую точку улучшения процесса\n2. Задай первый вопрос о том, какой процесс нужно улучшить и в чем проблема'
  : '1. Покажи что понимаешь контекст и выявленную проблему\n2. Объясни, что вы вместе будете детально разбирать текущий процесс (AS-IS), а затем проектировать улучшенный процесс (TO-BE)\n3. Задай первый вопрос о том, как процесс работает сейчас'}

ВАЖНО:
- Будь дружелюбным и профессиональным
- Пиши на русском
- Сообщение должно быть КРАТКИМ (не более 400 символов)
- Задавай только один конкретный вопрос`;

  // Fallback сообщение
  const fallbackContent = isNewBottleneck
    ? 'Привет! Я помогу вам создать новую точку улучшения процесса. Расскажите, какой процесс вы хотите улучшить и в чем основная проблема?'
    : 'Привет! Давайте вместе разберем текущий процесс и спроектируем улучшенный вариант. Расскажите, как сейчас работает процесс?';
  
  try {
    console.log('Initializing dialog for bottleneck:', bottleneck.id, 'isNew:', isNewBottleneck);
    
    // Пытаемся получить ответ от LLM с таймаутом
    let content = '';
    try {
      const response = await Promise.race([
        llm.invoke(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LLM timeout')), 30000)
        )
      ]) as any;
      
      content = response.content?.toString().trim() || '';
      console.log('LLM response length:', content.length, 'content preview:', content.substring(0, 100));
    } catch (llmError) {
      console.error('LLM invocation error:', llmError);
      content = '';
    }
    
    // Если ответ пустой или слишком короткий, используем fallback сообщение
    if (!content || content.length < 10) {
      console.log('Using fallback message - LLM response was empty or too short');
      content = fallbackContent;
    }
    
    // Ограничиваем длину ответа до 400 символов
    if (content.length > 400) {
      content = content.substring(0, 397) + '...';
    }
    
    // Убеждаемся, что content не пустой
    if (!content || content.trim().length === 0) {
      console.error('Content is still empty after all checks, using fallback');
      content = fallbackContent;
    }
    
    const initialMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: content,
      timestamp: new Date().toISOString(),
      phase: 'clarifying',
    };
    
    console.log('Created initial message with', content.length, 'characters:', content.substring(0, 50));
    
    const dialogState: DialogState = {
      bottleneckId: bottleneck.id,
      phase: 'clarifying',
      messages: [initialMessage],
      insights: [],
      clarifications: [],
      proposedSolution: null,
      isComplete: false,
    };
    
    console.log('Returning dialog state with', dialogState.messages.length, 'messages');
    return dialogState;
  } catch (error) {
    console.error('Error in initializeDialog:', error);
    // В случае ошибки возвращаем fallback сообщение
    const fallbackContent = isNewBottleneck
      ? 'Привет! Я помогу вам создать новую точку улучшения процесса. Расскажите, какой процесс вы хотите улучшить и в чем основная проблема?'
      : 'Привет! Давайте вместе разберем текущий процесс и спроектируем улучшенный вариант. Расскажите, как сейчас работает процесс?';
    
    return {
      bottleneckId: bottleneck.id,
      phase: 'clarifying',
      messages: [{
        id: uuidv4(),
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date().toISOString(),
        phase: 'clarifying',
      }],
      insights: [],
      clarifications: [],
      proposedSolution: null,
      isComplete: false,
    };
  }
}


