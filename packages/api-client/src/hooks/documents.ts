import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useApiClient } from '../api-client';
import { Document, DocumentProcessingResult } from '../types';

export function useDocuments(organizationId: string, options?: {
  status?: string;
  documentType?: string;
  page?: number;
  limit?: number;
}) {
  const apiClient = useApiClient();
  const { status, documentType, page = 1, limit = 10 } = options || {};
  
  return useQuery(
    ['documents', organizationId, status, documentType, page, limit],
    async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (documentType) params.append('documentType', documentType);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      return apiClient.get<{
        data: Document[];
        meta: { total: number; page: number; limit: number };
      }>(`/documents?${params.toString()}`);
    },
    {
      keepPreviousData: true,
      enabled: !!organizationId,
    }
  );
}

export function useDocument(documentId: string, organizationId: string) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['document', documentId, organizationId],
    () => apiClient.get<Document>(`/documents/${documentId}`),
    {
      enabled: !!documentId && !!organizationId,
    }
  );
}

export function useDocumentProcessing() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation(
    (data: { documentId: string }) => 
      apiClient.post<{ success: boolean; jobId: string }>('/documents/trigger-processing', data),
    {
      onSuccess: (_, variables) => {
        // Invalidate related queries to refresh the document status
        queryClient.invalidateQueries(['document', variables.documentId]);
        queryClient.invalidateQueries(['documents']);
      },
    }
  );
}

export function useDocumentExtractedData(documentId: string, organizationId: string) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['document-data', documentId, organizationId],
    () => apiClient.get<DocumentProcessingResult>(`/documents/${documentId}/extracted-data`),
    {
      enabled: !!documentId && !!organizationId,
    }
  );
}

export function useUploadDocument() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation(
    async (data: { 
      file: File; 
      documentType?: string;
      organizationId: string;
    }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.documentType) {
        formData.append('documentType', data.documentType);
      }
      formData.append('organizationId', data.organizationId);
      
      return apiClient.post<Document>('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    {
      onSuccess: () => {
        // Invalidate documents query to refresh the list
        queryClient.invalidateQueries(['documents']);
      },
    }
  );
}