import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api';
import { Request, RequestHistory } from './bindings/bindings';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import { queryClient } from './main';
import { Input } from './ui/input';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import Editor from '@monaco-editor/react';
import clsx from 'clsx';

const HistoryPanel = ({
  history,
  selectedId,
}: {
  history: RequestHistory[];
  selectedId: number;
}) => {
  return (
    <div className="w-full">
      <div className="flex flex-row gap-4 overflow-scroll scrollbar-hide ">
        {history.map((request) => (
          <div
            className={clsx('h-16 flex justify-center items-center', {
              'text-primary': request.id === selectedId,
            })}
            key={request.id}
          >
            {request.response_status_code}
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

  const formattedResponseJson = useMemo(() => {
    try {
      return JSON.stringify(
        JSON.parse(latestRequest?.response_body || '{}'),
        null,
        2
      );
    } catch (e) {
      return latestRequest?.response_body || '';
    }
  }, [latestRequest?.response_body]);

  const formattedRequestJson = JSON.stringify(
    JSON.parse(selectedRequest?.body || '{}'),
    null,
    2
  );

  return (
    <div className="flex flex-col gap-2 h-full">
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
      <div className="flex-grow flex flex-row w-full h-full">
        {selectedRequest.method !== 'GET' ? (
          <div className="w-1/2 flex flex-col">
            <p>request</p>
            <Editor
              defaultLanguage="json"
              defaultValue={formattedRequestJson}
              theme="vs-dark"
              className="block"
              options={{}}
              onChange={(value) => {
                console.log({ value });

                invoke('update_request', {
                  requestId: selectedRequest.id,
                  request: {
                    ...selectedRequest,
                    body: value,
                  },
                }).then(() => {
                  console.log('refetching');
                  queryClient.refetchQueries(['request', selectedRequest.id]);
                });
              }}
            />
          </div>
        ) : null}
        <div className="flex-grow flex flex-col">
          {latestRequest?.created_at}
          <Editor
            className=""
            defaultLanguage="json"
            value={formattedResponseJson}
            theme="vs-dark"
            options={{
              readOnly: true,
            }}
          />
        </div>
      </div>
      <HistoryPanel
        history={result.data ?? []}
        selectedId={latestRequest?.id || -1}
      />
    </div>
  );
};
