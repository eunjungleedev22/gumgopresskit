import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Application {
  jobId: string;
  appliedAt: string;
}

export function useApplications() {
  const queryClient = useQueryClient();

  const { data } = useQuery<{ applications: Application[] }>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await fetch('/api/applications');
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json();
    },
  });

  const applications = data?.applications ?? [];
  const appliedIds = new Set(applications.map((a) => a.jobId));

  const addMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) throw new Error('Failed to mark applied');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/applications?jobId=${jobId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unmark applied');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  const toggleApplied = (jobId: string) => {
    if (appliedIds.has(jobId)) {
      removeMutation.mutate(jobId);
    } else {
      addMutation.mutate(jobId);
    }
  };

  return { applications, appliedIds, toggleApplied };
}
