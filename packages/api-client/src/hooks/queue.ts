import { useQuery } from 'react-query';
import { useApiClient } from '../api-client';
import { QueueJobStatus } from '../types';

/**
 * Hook to fetch the status of a queue job
 */
export function useQueueJobStatus(jobId: string) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['queue', 'jobs', jobId],
    () => apiClient.get<QueueJobStatus>(`/queue/jobs/${jobId}`),
    {
      enabled: !!jobId,
      refetchInterval: (data) => {
        // Refetch frequently if the job is still running
        if (!data || ['waiting', 'active', 'delayed'].includes(data.status)) {
          return 2000; // every 2 seconds
        }
        return false; // stop polling for completed or failed jobs
      },
    }
  );
}

/**
 * Hook to fetch all jobs for a document
 */
export function useDocumentJobs(documentId: string) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['queue', 'document', documentId],
    () => apiClient.get<QueueJobStatus[]>(`/queue/documents/${documentId}/jobs`),
    {
      enabled: !!documentId,
      refetchInterval: (data) => {
        // Refetch if any job is still running
        if (data && data.some(job => ['waiting', 'active', 'delayed'].includes(job.status))) {
          return 5000; // every 5 seconds
        }
        return false; // stop polling when all jobs are completed or failed
      },
    }
  );
}