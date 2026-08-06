import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { UserSignature, DocumentRecord } from '@laps/shared';

const API_URL = '/api/v1/signatures';
const DOC_API_URL = '/api/v1/documents';

// --- Signatures ---

export const useGetMySignatures = () => {
  return useQuery({
    queryKey: ['my-signatures'],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: UserSignature[] }>(`${API_URL}/my-signatures`);
      return response.data.data;
    },
  });
};

export const useSaveSignature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<UserSignature>) => {
      const response = await axios.post<{ success: boolean; data: UserSignature }>(`${API_URL}/my-signatures`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-signatures'] });
    },
  });
};

export const useDeleteSignature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete<{ success: boolean }>(`${API_URL}/my-signatures/${id}`);
      return response.data.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-signatures'] });
    },
  });
};

// --- Approval Queue ---

export const useGetApprovalQueue = () => {
  return useQuery({
    queryKey: ['approval-queue'],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: DocumentRecord[] }>(`${DOC_API_URL}/records/approval-queue`);
      return response.data.data;
    },
  });
};

export const useSignDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { recordId: string; signatureId: string }) => {
      const response = await axios.post<{ success: boolean; data: DocumentRecord }>(
        `${DOC_API_URL}/records/${data.recordId}/sign`,
        { signatureId: data.signatureId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      queryClient.invalidateQueries({ queryKey: ['document-records'] });
      queryClient.invalidateQueries({ queryKey: ['document-record-details'] });
    },
  });
};
