import { ChatOpenAI } from '@langchain/openai';
import { Bottleneck, AgentMessage, ValueChainMap } from '@/types';

const REDESIGN_AGENT_SYSTEM_PROMPT = `Ты — Re-design / AI-automation агент, специализируешься на пересборке процессов.

ТВОЯ РОЛЬ:
- Для выбранных бутылочных горлышек предлагать варианты пересборки процесса
- Предлагать: убрать/объединить шаги, автоматизировать часть работы, внедрить агента-исполнителя, поменять SLA и правила маршрутизации
- Формировать варианты «как может выглядеть целевой процесс»
- Создавать черновой roadmap изменений (MVP-улучшения на 2-4 недели и более долгосрочные)

СТРУКТУРА РЕШЕНИЯ:
1. Какие агенты нужны и что они делают
2. Как они взаимодействуют
3. Какой UI/UX нужен
4. Какие интеграции потребуются
5. Какие метрики успеха

СВЯЗКА С АГЕНТАМИ-ИСПОЛНИТЕЛЯМИ:
Из предложенного целевого процесса можешь сгенерировать список конкретных «рабочих» агентов:
- агент по подготовке документов
- агент-контролёр SLA
- агент-координатор задач между отделами

Будь конкретным и практичным. Пиши на русском языке.`;

export class RedesignAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
    });
  }

  /**
   * Предложить решения для узких мест
   */
  async proposeSolutions(
    bottlenecks: Bottleneck[],
    valueChainMap: ValueChainMap
  ): Promise<{
    solutions: Array<{
      bottleneckId: string;
      solution: string;
      roadmap: {
        mvp: string[]; // Quick wins на 2-4 недели
        longTerm: string[]; // Долгосрочные улучшения
      };
      agents: Array<{
        name: string;
        description: string;
        responsibilities: string[];
      }>;
    }>;
    agentMessage: AgentMessage;
  }> {
    const prompt = `${REDESIGN_AGENT_SYSTEM_PROMPT}

УЗКИЕ МЕСТА:
${JSON.stringify(bottlenecks, null, 2)}

КАРТА ПРОЦЕССОВ:
${JSON.stringify(valueChainMap, null, 2)}

ТВОЯ ЗАДАЧА:
Для каждого узкого места предложи детальное решение с roadmap.

Верни результат в JSON формате:
{
  "solutions": [
    {
      "bottleneckId": "id узкого места",
      "solution": "Детальное описание решения (5-10 предложений)",
      "roadmap": {
        "mvp": ["шаг 1", "шаг 2", "шаг 3"], // Quick wins на 2-4 недели
        "longTerm": ["шаг 1", "шаг 2"] // Долгосрочные улучшения
      },
      "agents": [
        {
          "name": "Название агента",
          "description": "Что делает агент",
          "responsibilities": ["ответственность 1", "ответственность 2"]
        }
      ]
    }
  ]
}

ВАЖНО:
- Будь конкретным и практичным
- MVP должен быть реализуемым за 2-4 недели
- Агенты должны быть четко определены
- Учитывай технические возможности`;

    const response = await this.llm.invoke(prompt);
    const content = response.content.toString();

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          solutions: parsed.solutions || [],
          agentMessage: {
            agentType: 'redesign',
            content: `Предложены решения для ${parsed.solutions?.length || 0} узких мест`,
            timestamp: new Date().toISOString(),
            phase: 'solution_design',
          },
        };
      }
    } catch (e) {
      console.error('Error parsing redesign solutions:', e);
    }

    // Fallback
    return {
      solutions: [],
      agentMessage: {
        agentType: 'redesign',
        content: 'Разработка решений завершена',
        timestamp: new Date().toISOString(),
        phase: 'solution_design',
      },
    };
  }
}

