// app/api/gpt/route.ts
import { OpenAIStream } from '@/lib/openai';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// This ensures the API key check happens at build time
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { text } = json;
    
    if (!text) {
      return new Response('Missing text in request body', { status: 400 });
    }

    const stream = await OpenAIStream(text);
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('GPT API error:', error);
    return new Response(
      error instanceof Error ? error.message : 'Internal Server Error', 
      { status: 500 }
    );
  }
}