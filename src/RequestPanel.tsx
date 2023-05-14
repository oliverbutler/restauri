import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api';
import { Request, RequestHistory } from './bindings/bindings';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import { queryClient } from './main';
import { Input } from './ui/input';
import { useEffect, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Edit } from 'lucide-react';
import { EditRequest } from './EditRequest';
import { HTTP_METHODS, HttpMethod } from './HttpMethod';

const HistoryPanel = ({ history }: { history: RequestHistory[] }) => {
  return (
    <div className="w-24">
      <div className="flex flex-col gap-2 overflow-scroll ">
        {history.map((request) => (
          <div
            className="w-24 h-12 bg-gray-900 flex justify-center items-center"
            key={request.id}
          >
            {request.response_status_code} {request.response_time_ms}ms
          </div>
        ))}
      </div>
    </div>
  );
};

export const RequestPanel = ({ requestId }: { requestId: number }) => {
  const result = useQuery(
    ['request', requestId],
    () =>
      invoke('get_request_history', {
        requestId,
      }) as unknown as RequestHistory[]
  );

  const requestsResult = useQuery(
    ['requests'],
    () => invoke('get_requests') as unknown as Request[],
    {
      staleTime: 30 * 1000,
    }
  );

  const latestRequest = result.data?.[0] || null;

  const requests = requestsResult.data || [];

  const selectedRequest = requests.find((request) => request.id === requestId);

  const makeRequest = async (requestId: number, url: string) => {
    invoke('make_request', {
      requestId,
      url,
    }).then(() => {
      queryClient.refetchQueries(['request', requestId]);
    });
  };

  const [url, setUrl] = useState<string>(selectedRequest?.url || '');

  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.metaKey && selectedRequest) {
        makeRequest(selectedRequest.id, selectedRequest.url);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    urlRef.current?.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      urlRef.current?.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedRequest]);

  if (!selectedRequest) return null;

  return (
    <div className="w-full p-2">
      <div className="flex flex-row gap-2 w-full">
        <Select
          onValueChange={(value) => {
            invoke('update_request', {
              requestId: selectedRequest.id,
              request: {
                ...selectedRequest,
                method: value,
              },
            }).then(() => {
              queryClient.refetchQueries(['requests']);
            });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <HttpMethod method={selectedRequest.method} />
          </SelectTrigger>
          <SelectContent>
            {HTTP_METHODS.map((method) => (
              <SelectItem value={method}>
                <HttpMethod method={method} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={urlRef}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            invoke('update_request', {
              requestId: selectedRequest.id,
              request: {
                ...selectedRequest,
                url: e.target.value,
              },
            })
              .then(() => {
                queryClient.refetchQueries(['request', selectedRequest.id]);
              })
              .catch((e) => {
                toast.error(e);
              });
          }}
        />
        <Button
          variant={'default'}
          onClick={() => makeRequest(selectedRequest.id, selectedRequest.url)}
        >
          Send
        </Button>
      </div>
      <div>
        <h2>Response {latestRequest?.response_status_code}</h2>
        <div>{latestRequest?.response_time_ms}ms</div>
        <div className="whitespace-break-spaces overflow-auto">
          <pre className="">
            {JSON.stringify(
              JSON.parse(latestRequest?.response_body || '{}'),
              null,
              2
            )}
          </pre>
        </div>
      </div>
      {/* <HistoryPanel history={history ?? []} /> */}
    </div>
  );
};
