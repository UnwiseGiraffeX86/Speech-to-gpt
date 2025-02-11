import { NextResponse } from 'next/server';
import { OpenAIStream } from '@/lib/openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const stream = await OpenAIStream(text);
    return new Response(stream);
  } catch (error) {
    console.error('GPT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}