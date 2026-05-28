import type { Telegraf } from 'telegraf';
import cron from 'node-cron';
import { getTopJobs, getActiveSubscribers } from './storage';
import { formatJobCard, getJobKeyboard } from './formatter';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Sends the daily job digest to a single chat.
 * Fires an intro message then streams 10 job cards with inline keyboards.
 */
export async function sendDailyDigest(bot: Telegraf, chatId: number): Promise<void> {
  const jobs = await getTopJobs(10);

  if (jobs.length === 0) {
    await bot.telegram.sendMessage(
      chatId,
      '🔍 No jobs in the database yet.\n\nUse /sync to fetch jobs from all sources.',
    );
    return;
  }

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul',
  });

  // Intro message
  await bot.telegram.sendMessage(
    chatId,
    `☀️ <b>${dateStr}</b>\n\n<b>${jobs.length}개</b>의 리모트 잡 — 지원 여부를 하나씩 체크하세요:`,
    { parse_mode: 'HTML' },
  );

  await delay(400);

  // One card per message
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    try {
      await bot.telegram.sendMessage(
        chatId,
        formatJobCard(job, i + 1, jobs.length, false),
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: getJobKeyboard(job, false, i + 1, jobs.length),
          },
        },
      );
    } catch (err) {
      console.error(`[digest] job ${i + 1}/${jobs.length} failed:`, (err as Error).message);
    }
    // Stay under Telegram's 30 msg/sec global limit
    await delay(500);
  }
}

/**
 * Registers the 08:00 KST cron and broadcasts to all active subscribers.
 */
export function scheduleDailyDigest(bot: Telegraf): void {
  cron.schedule(
    '0 8 * * *',
    async () => {
      const ts = new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' });
      console.log(`[cron] ${ts} KST — sending morning digest`);

      const subscribers = await getActiveSubscribers();
      console.log(`[cron] ${subscribers.length} subscriber(s)`);

      for (const { chatId } of subscribers) {
        try {
          await sendDailyDigest(bot, Number(chatId));
          await delay(1500); // gap between users
        } catch (err) {
          console.error(`[cron] failed for chatId ${chatId}:`, (err as Error).message);
        }
      }
    },
    { timezone: 'Asia/Seoul' },
  );

  console.log('[bot] ⏰ Daily digest scheduled — 08:00 KST every day');
}
