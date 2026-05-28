import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BookmarkJob {
  id: string;
  title: string;
  company: string;
  location: string;
  remoteType: string;
  tags: string[];
  source: string;
  postedAt: string;
  url: string;
  seniority: string;
  visaSponsorship: boolean;
  koreanSpeaking: boolean;
}

interface Bookmark {
  id: string;
  jobId: string;
  job: BookmarkJob;
  createdAt: string;
}

export function useBookmarks() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ bookmarks: Bookmark[] }>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const res = await fetch('/api/bookmarks');
      if (!res.ok) throw new Error('Failed to fetch bookmarks');
      return res.json();
    },
  });

  const bookmarks = data?.bookmarks ?? [];
  const bookmarkedIds = new Set(bookmarks.map((b) => b.jobId));

  const addMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) throw new Error('Failed to add bookmark');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/bookmarks?jobId=${jobId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove bookmark');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const toggleBookmark = (jobId: string) => {
    if (bookmarkedIds.has(jobId)) {
      removeMutation.mutate(jobId);
    } else {
      addMutation.mutate(jobId);
    }
  };

  return { bookmarks, bookmarkedIds, toggleBookmark, isLoading };
}
