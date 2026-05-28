import { cn } from '@/lib/utils';

const TAG_COLORS: Record<string, string> = {
  'web3': 'bg-tag-web3/10 text-tag-web3 border-tag-web3/20',
  'music': 'bg-tag-music/10 text-tag-music border-tag-music/20',
  'customer-success': 'bg-tag-cs/10 text-tag-cs border-tag-cs/20',
  'community': 'bg-tag-community/10 text-tag-community border-tag-community/20',
  'growth': 'bg-tag-growth/10 text-tag-growth border-tag-growth/20',
  'operations': 'bg-tag-ops/10 text-tag-ops border-tag-ops/20',
  'ai': 'bg-tag-ai/10 text-tag-ai border-tag-ai/20',
  'partnerships': 'bg-tag-partnerships/10 text-tag-partnerships border-tag-partnerships/20',
  'product': 'bg-tag-product/10 text-tag-product border-tag-product/20',
  'startup': 'bg-tag-startup/10 text-tag-startup border-tag-startup/20',
  'artist-relations': 'bg-tag-music/10 text-tag-music border-tag-music/20',
};

const DEFAULT_COLOR = 'bg-border-subtle/50 text-text-muted border-border-subtle';

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', TAG_COLORS[tag] ?? DEFAULT_COLOR)}>
      {tag}
    </span>
  );
}
