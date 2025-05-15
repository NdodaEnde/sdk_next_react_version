import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useApiClient } from '../context/ApiContext';

/**
 * Hook to fetch a document by ID
 */
export function useDocument(documentId) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['document', documentId],
    async () => {
      const response = await apiClient.get(`/documents/${documentId}`);
      return response.data;
    },
    {
      enabled: !!documentId,
    }
  );
}

/**
 * Hook to fetch documents list
 */
export function useDocuments(options) {
  const apiClient = useApiClient();
  const { page = 1, limit = 10, status, type } = options || {};
  
  return useQuery(
    ['documents', page, limit, status, type],
    async () => {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (status) params.append('status', status);
      if (type) params.append('type', type);
      
      const response = await apiClient.get(`/documents?${params.toString()}`);
      return response.data;
    },
    {
      keepPreviousData: true,
    }
  );
}

/**
 * Hook to trigger document processing
 */
export function useProcessDocument() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation(
    async (documentId) => {
      const response = await apiClient.post(`/documents/${documentId}/process`);
      return response.data;
    },
    {
      onSuccess: (data, documentId) => {
        // Invalidate document queries to refresh the data
        queryClient.invalidateQueries(['document', documentId]);
        queryClient.invalidateQueries(['documents']);
      },
    }
  );
}

/**
 * Hook to fetch job status
 */
export function useJobStatus(jobId) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['job', jobId],
    async () => {
      const response = await apiClient.get(`/queue/jobs/${jobId}`);
      return response.data;
    },
    {
      enabled: !!jobId,
      refetchInterval: (data) => {
        // Refetch status every few seconds if the job is still in progress
        if (!data || ['waiting', 'active', 'delayed'].includes(data.status)) {
          return 2000; // 2 seconds
        }
        return false; // stop polling once complete or failed
      },
    }
  );
}