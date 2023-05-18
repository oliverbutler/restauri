import { useMutation, useQuery } from '@tanstack/react-query';
import { Request, RequestHistory } from './bindings';
import { invoke } from '@tauri-apps/api';
import { useRequests } from './useRequests';
import { queryClient } from '../main';
import toast from 'react-hot-toast';

type RequestWithLatestRequest = Request & {
  latestRequest: RequestHistory | null;
};

export const useRequest = (requestId: number) => {
  const requestHistoryQuery = useQuery(
    ['requests', requestId],
    () =>
      invoke('get_latest_request_history', {
        requestId,
      }) as unknown as RequestHistory,
    {
      staleTime: 30 * 1000,
    }
  );

  const requests = useRequests();

  const requestMutation = useMutation(
    () =>
      invoke('make_request', {
        requestId,
      }),
    {
      onSuccess: () => {
        queryClient.refetchQueries(['requests', requestId]);
      },
    }
  );

  const updateRequestMutation = useMutation(
    (request: Request) =>
      invoke('update_request', {
        requestId: request.id,
        request,
      }),
    {
      onSuccess: () => {
        queryClient.refetchQueries(['requests']);
      },
    }
  );

  const requestHistory = requestHistoryQuery.data || null;

  const selectedRequest = requests.requests.find(
    (request) => request.id === requestId
  );

  const request: RequestWithLatestRequest | null = selectedRequest
    ? {
        ...selectedRequest,
        latestRequest: requestHistory,
      }
    : null;

  return {
    isLoading: requestHistoryQuery.isLoading || requests.isLoading,
    request,
    makeRequest: requestMutation.mutate,
    isMakingRequest: requestMutation.isLoading,
    updateRequest: updateRequestMutation.mutate,
    isUpdatingRequest: updateRequestMutation.isLoading,
  };
};
