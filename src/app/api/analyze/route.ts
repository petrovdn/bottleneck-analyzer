import { NextRequest, NextResponse } from 'next/server';
import { analyzeValueChain } from '@/lib/agents/valueChainAnalyzer';
import { AnalyzeRequest, AnalyzeResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    
    if (!body.businessData) {
      return NextResponse.json(
        { error: 'Business data is required' },
        { status: 400 }
      );
    }

    // Валидация данных
    const { productDescription, teamSize, workflows, kpis } = body.businessData;
    
    if (!productDescription || !teamSize || !workflows || !kpis) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Анализ узких мест через мультиагента
    const bottlenecks = await analyzeValueChain(body.businessData);

    const response: AnalyzeResponse = {
      bottlenecks,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

