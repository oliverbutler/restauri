import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api';
import { Request } from './bindings';
import { useAppStore } from '../store';

export const useRequests = () => {
  const activeRequestId = useAppStore((store) => store.activeRequestId);
  const setActiveRequestId = useAppStore((store) => store.setActiveRequestId);

  const requestsResult = useQuery(
    ['requests'],
    () => invoke('get_requests') as unknown as Request[],
    {
      staleTime: 30 * 1000,
      onSuccess: (requests) => {
        if (requests.length > 0 && activeRequestId === null) {
          setActiveRequestId(requests[0].id);
        }
      },
    }
  );

  const requests = requestsResult.data || [];

  return {
    isLoading: requestsResult.isLoading,
    requests,
  };
};
