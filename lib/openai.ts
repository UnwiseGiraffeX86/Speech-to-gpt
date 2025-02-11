import { createParser } from 'eventsource-parser';

export async function OpenAIStream(text: string) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file.');
  }

  if (!text.trim()) {
    throw new Error('No text provided for GPT processing.');
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      method: 'POST',
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: text }],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${res.statusText}`);
    }

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
              const text = json.choices[0].delta.content;
              if (!text) return;
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              controller.error(e);
            }
          }
        });

        for await (const chunk of res.body as any) {
          parser.feed(decoder.decode(chunk));
        }
      },
    });

    return stream;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unknown error occurred while processing GPT request');
  }
}