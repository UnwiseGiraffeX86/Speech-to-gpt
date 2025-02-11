// lib/openai.ts
import { createParser } from 'eventsource-parser';

export async function OpenAIStream(text: string) {
  if (!text?.trim()) {
    throw new Error('No text provided for GPT processing');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: text }],
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const parser = createParser((event) => {
        if (event.type === 'event') {
          const data = event.data;
          
          if (data === '[DONE]') {
            controller.close();
            return;
          }
          
          try {
            const json = JSON.parse(data);
            const text = json.choices[0]?.delta?.content;
            if (!text) return;
            controller.enqueue(encoder.encode(text));
          } catch (e) {
            controller.error(e);
          }
        }
      });

      try {
        for await (const chunk of response.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return stream;
}