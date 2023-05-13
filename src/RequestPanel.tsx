import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api';
import { RequestHistory } from './bindings/bindings';
import { Button } from './ui/button';
import toast from 'react-hot-toast';
import { queryClient } from './main';
import { Input } from './ui/input';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const HistoryPanel = ({ history }: { history: RequestHistory[] }) => {
  return (
    <div className="w-24">
      <div className="flex flex-col gap-2 overflow-scroll ">
        {history.map((request) => (
          <div
            className="w-24 h-12 bg-gray-900 flex justify-center items-center"
            key={request.id}
          >
            {request.status_code} {request.response_time_ms}ms
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

  const history = result.data;

  const latestRequest = history?.[0];

  const selectedRequest = history?.find((request) => request.id === requestId);

  const makeRequest = async (requestId: number, url: string) => {
    toast.promise(
      invoke('make_request', {
        requestId,
        url,
      }).then(() => {
        queryClient.refetchQueries(['request', requestId]);
      }),
      {
        loading: 'Sending request...',
        success: 'Request sent!',
        error: 'Failed to send request',
      }
    );
  };

  const [url, setUrl] = useState<string>(selectedRequest?.url || '');

  if (!selectedRequest) {
    return <div>Request not found</div>;
  }

  return (
    <div className="w-full">
      <div className="flex flex-row gap-2 w-full">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="GET" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
          </SelectContent>
        </Select>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button
          variant={'default'}
          onClick={() => makeRequest(selectedRequest.id, selectedRequest.url)}
        >
          Send
        </Button>
      </div>
      <div>
        <h2>Response {latestRequest?.status_code}</h2>
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
