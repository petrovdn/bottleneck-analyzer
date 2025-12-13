import { NextRequest, NextResponse } from 'next/server';
import { processDialogMessage, initializeDialog } from '@/lib/agents/dialogAgent';
import { ChatRequest, ChatResponse, BusinessData, Bottleneck, DialogState } from '@/types';

// POST /api/chat - отправить сообщение в диалог
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    const { businessData, bottleneck, dialogState, userMessage } = body;
    
    if (!businessData || !bottleneck || !dialogState) {
      return NextResponse.json(
        { error: 'Business data, bottleneck, and dialog state are required' },
        { status: 400 }
      );
    }

    if (!userMessage || userMessage.trim() === '') {
      return NextResponse.json(
        { error: 'User message is required' },
        { status: 400 }
      );
    }

    // Обрабатываем сообщение через диалогового агента
    const result = await processDialogMessage(
      businessData,
      bottleneck,
      dialogState,
      userMessage
    );

    const response: ChatResponse = {
      message: result.message,
      updatedDialogState: result.updatedDialogState,
      refinedBottleneck: result.refinedBottleneck,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Типы для инициализации
interface InitRequest {
  businessData: BusinessData;
  bottleneck: Bottleneck;
}

interface InitResponse {
  dialogState: DialogState;
}

