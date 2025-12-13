import { NextRequest, NextResponse } from 'next/server';
import { MultiAgentGraph } from '@/lib/agents/multiAgentGraph';
import { MultiAgentRequest, MultiAgentResponse, BusinessData, MultiAgentState } from '@/types';

// Инициализация мультиагентной системы
export async function POST(request: NextRequest) {
  try {
    const body: MultiAgentRequest = await request.json();
    const { businessData, userMessage, multiAgentState } = body;

    if (!businessData) {
      return NextResponse.json(
        { error: 'Business data is required' },
        { status: 400 }
      );
    }

    const graph = new MultiAgentGraph();

    // Если есть состояние - продолжаем работу
    if (multiAgentState && userMessage) {
      try {
        console.log('Processing user answer:', userMessage.substring(0, 50));
        const updatedState = await graph.processUserAnswer(multiAgentState, userMessage);
        console.log('Updated state phase:', updatedState.phase);
        console.log('Current question:', updatedState.currentQuestion?.substring(0, 50));

        const response: MultiAgentResponse = {
          multiAgentState: updatedState,
          question: updatedState.currentQuestion || undefined,
          bottlenecks: updatedState.bottlenecks.length > 0 ? updatedState.bottlenecks : undefined,
        };

        return NextResponse.json(response);
      } catch (processError: any) {
        console.error('Error processing user answer:', processError);
        // Возвращаем состояние с ошибкой, но не падаем
        const errorState: MultiAgentState = {
          ...multiAgentState,
          thinking: `Ошибка обработки: ${processError.message}`,
        };
        return NextResponse.json({
          multiAgentState: errorState,
          question: 'Извините, произошла ошибка. Попробуйте переформулировать ответ.',
        });
      }
    }

    // Иначе инициализируем новую сессию
    const initialState = await graph.initialize(businessData);

    const response: MultiAgentResponse = {
      multiAgentState: initialState,
      question: initialState.currentQuestion || undefined,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in /api/multi-agent:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

