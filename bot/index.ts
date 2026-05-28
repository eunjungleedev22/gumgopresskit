import 'dotenv/config';
import { Telegraf } from 'telegraf';
import {
  subscribe,
  unsubscribe,
  toggleApply,
  getAppliedJobs,
  getJobById,
} from './storage';
import { formatJobCard, getJobKeyboard, esc } from './formatter';
import { sendDailyDigest, scheduleDailyDigest } from './digest';
import { fetchAllSources } from '../src/lib/fetchers';
import { deduplicateAndSave } from '../src/lib/deduplicator';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set. Add it to your .env file.');
  process.exit(1);
}

const bot = new Telegraf(token);

// ─── /start ──────────────────────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  await subscribe(ctx.chat.id, ctx.from?.username);
  await ctx.replyWithHTML(
    `😖 <b>Remote Job Machine</b>\n\n` +
    `<b>매일 오전 8시 KST</b>에 리모트 잡 10개를 전송합니다.\n\n` +
    `<b>Commands</b>\n` +
    `/jobs — 지금 바로 10개 받기\n` +
    `/applied — 내가 지원한 잡 목록\n` +
    `/sync — API에서 새 잡 가져오기\n` +
    `/stop — 구독 해제`,
  );
});

// ─── /stop ──────────────────────────────────────────────────────────────────────────────────

bot.command('stop', async (ctx) => {
  await unsubscribe(ctx.chat.id);
  await ctx.reply('✅ 구독 해제됐어요. 다시 받으려면 /start');
});

// ─── /help ──────────────────────────────────────────────────────────────────────────────────

bot.command('help', async (ctx) => {
  await ctx.replyWithHTML(
    `<b>Remote Job Machine</b>\n\n` +
    `/jobs — 지금 바로 10개 받기\n` +
    `/applied — 내가 지원한 잡 목록\n` +
    `/sync — API에서 새 잡 가져오기\n` +
    `/stop — 구독 해제\n` +
    `/start — 구독 시작`,
  );
});

// ─── /jobs — send digest on demand ─────────────────────────────────────────────────────────────

bot.command('jobs', async (ctx) => {
  await sendDailyDigest(bot, ctx.chat.id);
});

// ─── /applied — show applied list ────────────────────────────────────────────────────────────

bot.command('applied', async (ctx) => {
  const list = await getAppliedJobs(ctx.chat.id);

  if (list.length === 0) {
    await ctx.reply('아직 지원한 잡이 없어요. 잡 카드의 ⬜ Applied? 버튼을 눌러서 체크하세요.');
    return;
  }

  const lines = list
    .map(
      (a, i) =>
        `${i + 1}. <a href="${a.job.url}">${esc(a.job.title)}</a>\n   ${esc(a.job.company)}`,
    )
    .join('\n\n');

  await ctx.replyWithHTML(
    `✅ <b>지원한 잡 (${list.length}개)</b>\n\n${lines}`,
    { disable_web_page_preview: true },
  );
});

// ─── /sync — fetch fresh jobs from all APIs ───────────────────────────────────────────────

bot.command('sync', async (ctx) => {
  const msg = await ctx.reply('🔄 Syncing from JSearch, Adzuna, Arbeitnow…');

  try {
    const results = await fetchAllSources();
    let totalAdded = 0;
    const summary: string[] = [];

    for (const result of results) {
      if (result.error) {
        summary.push(`${result.source}: ❌ ${result.error.slice(0, 60)}`);
        continue;
      }
      const { added, skipped } = await deduplicateAndSave(result.jobs);
      totalAdded += added;
      summary.push(`${result.source}: +${added} new (${skipped} dup)`);
    }

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      undefined,
      `✅ Sync complete — <b>${totalAdded}</b>개 추가\n\n${summary.join('\n')}`,
      { parse_mode: 'HTML' },
    );
  } catch (err) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      undefined,
      `❌ Sync failed: ${err instanceof Error ? err.message : 'Unknown'}`,
    );
  }
});

// ─── Callback: ⬜ Applied? / ✅ Applied! toggle ────────────────────────────────────────────────────────
//
// callback_data format: "apply:{jobId}:{index}:{total}"
// cuid (25 chars) + ":1:10" = ~32 chars — well within Telegram's 64-byte limit

bot.action(/^apply:([^:]+):(\d+):(\d+)$/, async (ctx) => {
  const jobId = ctx.match[1];
  const index = parseInt(ctx.match[2], 10);
  const total = parseInt(ctx.match[3], 10);
  const chatId = ctx.chat!.id;

  const job = await getJobById(jobId);
  if (!job) {
    await ctx.answerCbQuery('⚠️ Job not found.');
    return;
  }

  const applied = await toggleApply(chatId, jobId);

  try {
    await ctx.editMessageText(
      formatJobCard(job, index, total, applied),
      {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: getJobKeyboard(job, applied, index, total),
        },
      },
    );
  } catch {
    // Message might not have changed — ignore Telegram's "message not modified" error
  }

  await ctx.answerCbQuery(
    applied ? '✅ 지원 완료로 표시했어요!' : '↩️ 취소했어요',
  );
});

// ─── Error handler ──────────────────────────────────────────────────────────────────────────────

bot.catch((err, ctx) => {
  console.error(`[bot] update error (${ctx.updateType}):`, err);
});

// ─── Launch ──────────────────────────────────────────────────────────────────────────────────

async function main() {
  scheduleDailyDigest(bot);

  await bot.launch({ dropPendingUpdates: true });
  console.log('🤖 Remote Job Machine bot is running. Ctrl+C to stop.');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((err) => {
  console.error('[bot] Fatal startup error:', err);
  process.exit(1);
});
