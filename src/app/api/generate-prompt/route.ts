import { NextRequest, NextResponse } from 'next/server';
import { generateImplementationPrompt } from '@/lib/agents/promptGenerator';
import { GeneratePromptRequest, GeneratePromptResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePromptRequest = await request.json();
    
    if (!body.businessData || !body.bottleneck) {
      return NextResponse.json(
        { error: 'Business data and bottleneck are required' },
        { status: 400 }
      );
    }

    // Генерация промпта через агента
    // Если есть уточненная версия из диалога - используем её
    const prompt = await generateImplementationPrompt(
      body.businessData,
      body.bottleneck,
      body.refinedBottleneck // Передаем уточненную версию если есть
    );

    const response: GeneratePromptResponse = {
      prompt,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in /api/generate-prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

