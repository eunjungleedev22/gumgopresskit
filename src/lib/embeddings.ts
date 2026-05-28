// OpenAI embeddings integration — ready for pgvector semantic search
// Activate by setting OPENAI_API_KEY and calling generateEmbedding()

import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getClient();
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.slice(0, 8000), // ada-002 token limit
  });
  return response.data[0].embedding;
}

export function buildEmbeddingText(job: {
  title: string;
  company: string;
  description?: string | null;
  tags: string[];
  location: string;
}): string {
  return [
    job.title,
    job.company,
    job.location,
    job.tags.join(', '),
    (job.description ?? '').slice(0, 500),
  ].join(' | ');
}

// Call this after saving jobs to index them for semantic search
export async function indexJobEmbedding(jobId: string, text: string) {
  const { prisma } = await import('./prisma');
  const embedding = await generateEmbedding(text);

  // Store as raw float array (pgvector handles casting)
  await prisma.$executeRaw`
    UPDATE "Job" SET embedding = ${embedding}::vector
    WHERE id = ${jobId}
  `;
}
