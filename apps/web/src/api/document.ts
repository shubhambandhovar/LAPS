import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  DocumentTemplate,
  DocumentRecord,
  GenerateDocumentRequest,
  DocumentType,
} from '@laps/shared';

const API_URL = '/api/v1/documents';

// -- Templates --

export const useGetDocumentTemplates = (documentType?: DocumentType) => {
  return useQuery({
    queryKey: ['document-templates', documentType],
    queryFn: async () => {
      const url = documentType ? `${API_URL}/templates?documentType=${documentType}` : `${API_URL}/templates`;
      const response = await axios.get<{ success: boolean; data: DocumentTemplate[] }>(url);
      return response.data.data;
    },
  });
};

export const useSaveDocumentTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DocumentTemplate) => {
      const response = await axios.post<{ success: boolean; data: DocumentTemplate }>(`${API_URL}/templates`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
    },
  });
};

// -- Generation & Records --

export const useGenerateDocument = () => {
  return useMutation({
    mutationFn: async (data: GenerateDocumentRequest) => {
      const response = await axios.post<{ success: boolean; data: DocumentRecord }>(`${API_URL}/generate`, data);
      return response.data.data;
    },
  });
};

export const useGetDocumentRecords = (filter: any = {}) => {
  return useQuery({
    queryKey: ['document-records', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.documentType) params.append('documentType', filter.documentType);
      if (filter.referenceId) params.append('referenceId', filter.referenceId);
      
      const response = await axios.get<{ success: boolean; data: DocumentRecord[] }>(`${API_URL}/records?${params.toString()}`);
      return response.data.data;
    },
  });
};

export const useGetDocumentRecordDetails = (id: string) => {
  return useQuery({
    queryKey: ['document-record-details', id],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: { record: DocumentRecord, masterData: any } }>(`${API_URL}/records/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useRevokeDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete<{ success: boolean; data: DocumentRecord }>(`${API_URL}/records/${id}/revoke`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-records'] });
      queryClient.invalidateQueries({ queryKey: ['document-record-details'] });
    },
  });
};
