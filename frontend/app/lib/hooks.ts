import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, UserProfile } from './api';

// Query Keys
export const queryKeys = {
  jobs: (params?: { status?: string; minScore?: number; limit?: number }) =>
    ['jobs', params] as const,
  job: (id: string) => ['job', id] as const,
  profile: () => ['profile'] as const,
  automationStatus: () => ['automation', 'status'] as const,
};

// Jobs Hooks
export function useJobs(params?: { status?: string; minScore?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.jobs(params),
    queryFn: () => api.getJobs(params),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => api.getJob(id),
    enabled: !!id,
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateJobStatus(id, status),
    onSuccess: (_, variables) => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Update the specific job in cache
      queryClient.invalidateQueries({ queryKey: queryKeys.job(variables.id) });
    },
  });
}

// Profile Hooks
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: api.getProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Partial<UserProfile>) => api.updateProfile(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
    },
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => api.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
    },
  });
}

// Automation Hooks
export function useAutomationStatus() {
  return useQuery({
    queryKey: queryKeys.automationStatus(),
    queryFn: api.getAutomationStatus,
    refetchInterval: 5000, // Poll every 5 seconds when automation is running
  });
}

export function useStartAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: { searchQuery: string; maxJobs: number; autoApply: boolean }) =>
      api.startAutomation(config),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.automationStatus(),
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useStopAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.stopAutomation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.automationStatus(),
      });
    },
  });
}
