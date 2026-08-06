import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { GenerateQrRequest, VerifyQrRequest, VerifiedQrResponse, QrCode } from '@laps/shared';

const API_URL = '/api/v1/qr';

export const useGenerateQr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateQrRequest) => {
      const response = await axios.post<{ success: boolean; data: QrCode }>(`${API_URL}/generate`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-history'] });
    },
  });
};

export const useBulkGenerateQr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerateQrRequest[]) => {
      const response = await axios.post<{ success: boolean; data: QrCode[] }>(`${API_URL}/generate/bulk`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-history'] });
    },
  });
};

export const useVerifyQr = () => {
  return useMutation({
    mutationFn: async (data: VerifyQrRequest) => {
      const response = await axios.post<{ success: boolean; data: VerifiedQrResponse }>(`${API_URL}/verify`, data);
      return response.data.data;
    },
  });
};

export const useRevokeQr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete<{ success: boolean; data: QrCode }>(`${API_URL}/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-history'] });
    },
  });
};

export const useGetActiveQr = (referenceId: string) => {
  return useQuery({
    queryKey: ['active-qr', referenceId],
    queryFn: async () => {
      try {
        const response = await axios.get<{ success: boolean; data: QrCode }>(`${API_URL}/reference/${referenceId}`);
        return response.data.data;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!referenceId,
    retry: false,
  });
};

export const useScanHistory = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['qr-history', page, limit],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: any }>(`${API_URL}/history?page=${page}&limit=${limit}`);
      return response.data.data;
    },
  });
};
