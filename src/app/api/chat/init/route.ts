import { NextRequest, NextResponse } from 'next/server';
import { initializeDialog } from '@/lib/agents/dialogAgent';
import { BusinessData, Bottleneck, DialogState } from '@/types';

interface InitRequest {
  businessData: BusinessData;
  bottleneck: Bottleneck;
}

interface InitResponse {
  dialogState: DialogState;
}

// POST /api/chat/init - инициализировать диалог
export async function POST(request: NextRequest) {
  try {
    const body: InitRequest = await request.json();
    
    const { businessData, bottleneck } = body;
    
    if (!businessData || !bottleneck) {
      return NextResponse.json(
        { error: 'Business data and bottleneck are required' },
        { status: 400 }
      );
    }

    // Инициализируем диалог - агент отправляет первое сообщение
    const dialogState = await initializeDialog(businessData, bottleneck);

    const response: InitResponse = {
      dialogState,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in /api/chat/init:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

