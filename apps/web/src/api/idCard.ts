import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  IdCardTemplate,
  IdCardRecord,
  GenerateIdCardRequest,
  IdCardUserType,
} from '@laps/shared';

const API_URL = '/api/v1/id-cards';

// -- Templates --

export const useGetTemplates = (userType?: IdCardUserType) => {
  return useQuery({
    queryKey: ['id-card-templates', userType],
    queryFn: async () => {
      const url = userType ? `${API_URL}/templates?userType=${userType}` : `${API_URL}/templates`;
      const response = await axios.get<{ success: boolean; data: IdCardTemplate[] }>(url);
      return response.data.data;
    },
  });
};

export const useSaveTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IdCardTemplate) => {
      const response = await axios.post<{ success: boolean; data: IdCardTemplate }>(`${API_URL}/templates`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['id-card-templates'] });
    },
  });
};

// -- Card Actions --

export const useGenerateCard = () => {
  return useMutation({
    mutationFn: async (data: GenerateIdCardRequest) => {
      const response = await axios.post<{ success: boolean; data: IdCardRecord }>(`${API_URL}/generate`, data);
      return response.data.data;
    },
  });
};

export const useRevokeCard = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete<{ success: boolean; data: IdCardRecord }>(`${API_URL}/${id}/revoke`);
      return response.data.data;
    },
  });
};

// -- Reads --

export const useGetActiveCard = (referenceId: string) => {
  return useQuery({
    queryKey: ['id-card', 'active', referenceId],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: IdCardRecord }>(`${API_URL}/active/${referenceId}`);
      return response.data.data;
    },
    enabled: !!referenceId,
    retry: false,
  });
};

export const useGetCardMasterData = (referenceId: string, userType: IdCardUserType) => {
  return useQuery({
    queryKey: ['id-card-master-data', referenceId, userType],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: any }>(
        `${API_URL}/master-data/${referenceId}?userType=${userType}`
      );
      return response.data.data;
    },
    enabled: !!referenceId && !!userType,
  });
};
