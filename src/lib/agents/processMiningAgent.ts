import { ChatOpenAI } from '@langchain/openai';
import { BusinessData, ValueChainMap, ProcessStep, AgentMessage, MultiAgentState } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const PROCESS_MINING_SYSTEM_PROMPT = `Ты — Процесс-майнинг агент, специализируешься на структурировании описания процессов.

ТВОЯ РОЛЬ:
- Структурировать описание процессов из диалога с руководителем
- Создать карту цепочки ценности с этапами
- Для каждого этапа определить: входы, выходы, участников, время цикла, частоту проблем
- Если есть данные (логи BPM/ERP, выгрузки), анализировать их

СТРУКТУРА ЭТАПА:
- Название этапа
- Описание
- Входы (что нужно для начала этапа)
- Выходы (что получается в результате)
- Участники (кто выполняет)
- Время цикла (медианное и максимальное)
- Частота проблем (0-1)
- Размер очереди (если есть)
- Загрузка ресурса (0-1)

Будь точным и структурированным. Пиши на русском языке.`;

export class ProcessMiningAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3, // Низкая температура для более структурированных ответов
    });
  }

  /**
   * Создать карту процессов из собранной информации
   */
  async createProcessMap(
    businessData: BusinessData,
    collectedAnswers: Record<string, { answer: string; timestamp: string }>
  ): Promise<{
    valueChainMap: ValueChainMap;
    agentMessage: AgentMessage;
  }> {
    const answersText = Object.entries(collectedAnswers)
      .map(([key, value]) => {
        const answerData = typeof value === 'string' ? { answer: value, timestamp: '' } : value;
        return `${key}: ${answerData.answer}`;
      })
      .join('\n');

    const prompt = `${PROCESS_MINING_SYSTEM_PROMPT}

ИНФОРМАЦИЯ О БИЗНЕСЕ:
Продукт/услуга: ${businessData.productDescription}
Размер команды: ${businessData.teamSize} человек
Основные потоки: ${businessData.workflows}
KPI: ${businessData.kpis}

СОБРАННЫЕ ОТВЕТЫ:
${answersText}

ТВОЯ ЗАДАЧА:
На основе собранной информации создай карту цепочки ценности.

Извлеки из ответов:
1. Ключевые этапы процесса (от начала до конца)
2. Для каждого этапа определи входы, выходы, участников
3. Оцени время цикла (если указано в ответах, иначе используй качественные оценки)
4. Оцени частоту проблем (если упоминается)

Верни результат в JSON формате:
{
  "steps": [
    {
      "name": "Название этапа",
      "description": "Описание этапа",
      "inputs": ["вход1", "вход2"],
      "outputs": ["выход1", "выход2"],
      "participants": ["роль1", "роль2"],
      "cycleTime": {
        "median": число в часах или null,
        "max": число в часах или null,
        "unit": "hours|days|weeks"
      },
      "problemFrequency": число от 0 до 1 или null,
      "queueSize": число или null,
      "utilization": число от 0 до 1 или null
    }
  ]
}

ВАЖНО:
- Минимум 3 этапа, максимум 15
- Этапы должны быть в логическом порядке (от начала до конца)
- Если время не указано, используй качественные оценки на основе описания
- Будь конкретным и практичным`;

    const response = await this.llm.invoke(prompt);
    const content = response.content.toString();

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const steps: ProcessStep[] = parsed.steps.map((step: any, index: number) => ({
          id: `step_${uuidv4()}`,
          name: step.name,
          description: step.description || '',
          inputs: step.inputs || [],
          outputs: step.outputs || [],
          participants: step.participants || [],
          cycleTime: step.cycleTime || undefined,
          problemFrequency: step.problemFrequency || undefined,
          queueSize: step.queueSize || undefined,
          utilization: step.utilization || undefined,
        }));

        const valueChainMap: ValueChainMap = {
          id: uuidv4(),
          productDescription: businessData.productDescription,
          steps,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          valueChainMap,
          agentMessage: {
            agentType: 'process_mining',
            content: `Создана карта цепочки ценности с ${steps.length} этапами:\n${steps
              .map((s, i) => `${i + 1}. ${s.name}`)
              .join('\n')}`,
            timestamp: new Date().toISOString(),
            phase: 'process_mapping',
          },
        };
      }
    } catch (e) {
      console.error('Error parsing process map:', e);
    }

    // Fallback - создаем простую карту
    const fallbackSteps: ProcessStep[] = [
      {
        id: uuidv4(),
        name: 'Начало процесса',
        description: 'Начальный этап',
        inputs: [],
        outputs: [],
        participants: [],
      },
    ];

    return {
      valueChainMap: {
        id: uuidv4(),
        productDescription: businessData.productDescription,
        steps: fallbackSteps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      agentMessage: {
        agentType: 'process_mining',
        content: 'Создана базовая карта процессов (требуется уточнение)',
        timestamp: new Date().toISOString(),
        phase: 'process_mapping',
      },
    };
  }

  /**
   * Уточнить карту процессов на основе дополнительной информации
   */
  async refineProcessMap(
    valueChainMap: ValueChainMap,
    additionalInfo: string
  ): Promise<ValueChainMap> {
    const prompt = `${PROCESS_MINING_SYSTEM_PROMPT}

ТЕКУЩАЯ КАРТА ПРОЦЕССОВ:
${JSON.stringify(valueChainMap, null, 2)}

ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
${additionalInfo}

ТВОЯ ЗАДАЧА:
Обнови карту процессов на основе дополнительной информации.
Можешь:
- Добавить новые этапы
- Уточнить существующие этапы
- Обновить метрики (время, частоту проблем и т.д.)

Верни обновленную карту в том же JSON формате.`;

    const response = await this.llm.invoke(prompt);
    const content = response.content.toString();

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const updatedSteps: ProcessStep[] = parsed.steps.map((step: any) => ({
          id: step.id || `step_${uuidv4()}`,
          name: step.name,
          description: step.description || '',
          inputs: step.inputs || [],
          outputs: step.outputs || [],
          participants: step.participants || [],
          cycleTime: step.cycleTime || undefined,
          problemFrequency: step.problemFrequency || undefined,
          queueSize: step.queueSize || undefined,
          utilization: step.utilization || undefined,
        }));

        return {
          ...valueChainMap,
          steps: updatedSteps,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error('Error refining process map:', e);
    }

    return valueChainMap;
  }
}

