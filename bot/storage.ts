import { prisma } from '../src/lib/prisma';
import type { JobData } from './formatter';

const JOB_SELECT = {
  id: true,
  title: true,
  company: true,
  location: true,
  url: true,
  tags: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  postedAt: true,
  remoteType: true,
  visaSponsorship: true,
  koreanSpeaking: true,
} as const;

export async function subscribe(chatId: number, username?: string): Promise<void> {
  await prisma.chatSubscription.upsert({
    where: { chatId: BigInt(chatId) },
    create: { chatId: BigInt(chatId), username },
    update: { active: true, username },
  });
}

export async function unsubscribe(chatId: number): Promise<void> {
  await prisma.chatSubscription.update({
    where: { chatId: BigInt(chatId) },
    data: { active: false },
  });
}

export async function getActiveSubscribers(): Promise<{ chatId: bigint }[]> {
  return prisma.chatSubscription.findMany({
    where: { active: true },
    select: { chatId: true },
  });
}

/** Returns the 10 most recently synced active jobs. */
export async function getTopJobs(limit = 10): Promise<JobData[]> {
  const jobs = await prisma.job.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: JOB_SELECT,
  });
  return jobs as JobData[];
}

export async function getJobById(jobId: string): Promise<JobData | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: JOB_SELECT,
  });
  return job as JobData | null;
}

/**
 * Toggles the applied state for a chat+job pair.
 * Returns the new applied value.
 */
export async function toggleApply(chatId: number, jobId: string): Promise<boolean> {
  const existing = await prisma.botApply.findUnique({
    where: { chatId_jobId: { chatId: BigInt(chatId), jobId } },
  });

  const applied = !(existing?.applied ?? false);

  await prisma.botApply.upsert({
    where: { chatId_jobId: { chatId: BigInt(chatId), jobId } },
    create: {
      chatId: BigInt(chatId),
      jobId,
      applied,
      appliedAt: applied ? new Date() : null,
    },
    update: {
      applied,
      appliedAt: applied ? new Date() : null,
    },
  });

  return applied;
}

export async function getAppliedJobs(chatId: number) {
  return prisma.botApply.findMany({
    where: { chatId: BigInt(chatId), applied: true },
    include: {
      job: { select: { title: true, company: true, url: true } },
    },
    orderBy: { appliedAt: 'desc' },
  });
}
