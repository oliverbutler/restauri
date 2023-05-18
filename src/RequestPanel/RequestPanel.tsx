import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api';
import { Request, RequestHistory } from '../bindings/bindings';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';
import { queryClient } from '../main';
import { Input } from '../ui/input';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { HTTP_METHODS, HttpMethod } from '../HttpMethod';
import Editor from '@monaco-editor/react';
import { useRequest } from '../bindings/useRequest';
import { RequestInput } from './RequestInput';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

export const RequestPanel = ({ requestId }: { requestId: number }) => {
  const { request, isLoading, makeRequest, isMakingRequest } =
    useRequest(requestId);

  const urlRef = useRef<HTMLInputElement>(null);

  const [responseTab, setResponseTab] = useState<'request' | 'response'>(
    'response'
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.metaKey) {
        makeRequest();
      }

      if (e.key === '/') {
        urlRef.current?.focus();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    urlRef.current?.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      urlRef.current?.removeEventListener('keydown', onKeyDown);
    };
  }, [request]);

  const formattedResponseJson = useMemo(() => {
    try {
      return JSON.stringify(
        JSON.parse(request?.latestRequest?.response_body || '{}'),
        null,
        2
      );
    } catch (e) {
      return request?.latestRequest?.response_body || '';
    }
  }, [request?.latestRequest?.response_body]);

  const formattedRequestJson = JSON.stringify(
    JSON.parse(request?.body || '{}'),
    null,
    2
  );

  if (isLoading || !request) return null;

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex flex-row gap-2 w-full">
        <Select
          onValueChange={(value) => {
            invoke('update_request', {
              requestId: request.id,
              request: {
                ...request,
                method: value,
              },
            }).then(() => {
              queryClient.refetchQueries(['requests']);
            });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <HttpMethod method={request.method} />
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
          value={request.url}
          onChange={(e) => {
            console.log('Updating request', request.id, e.target.value);

            const newUrl = e.target.value;

            queryClient.setQueryData<Request[]>(['requests'], (value) => {
              return value?.map((r) => {
                if (r.id === request.id) {
                  return {
                    ...r,
                    url: newUrl,
                  };
                }

                return r;
              });
            });

            invoke('update_request', {
              requestId: request.id,
              request: {
                ...request,
                url: newUrl,
              },
            }).catch((e) => {
              toast.error(e);
            });
          }}
        />
        <Button
          className="mr-2"
          variant={'default'}
          onClick={() => makeRequest()}
        >
          {isMakingRequest ? 'Sending...' : 'Send'}
        </Button>
      </div>
      <div className="flex-grow flex flex-row w-full h-full">
        {/* {request.method !== 'GET' ? (
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
                  requestId: request.id,
                  request: {
                    ...request,
                    body: value,
                  },
                }).then(() => {
                  console.log('refetching');
                  queryClient.refetchQueries(['request', request.id]);
                });
              }}
            />
          </div>
        ) : null} */}
        <RequestInput request={request} />
        <div className="w-1/2 flex flex-col">
          <Tabs
            value={responseTab}
            onValueChange={(e) => setResponseTab(e as 'request' | 'response')}
            className="mb-1"
          >
            <TabsList>
              <TabsTrigger value="request">
                Request
                <HttpMethod
                  className="ml-2"
                  method={request?.latestRequest?.request_method || 'GET'}
                />
              </TabsTrigger>
              <TabsTrigger value="response">
                Response {request?.latestRequest?.response_status_code}{' '}
                {request?.latestRequest?.response_time_ms}ms
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Editor
            className=""
            defaultLanguage="json"
            value={formattedResponseJson}
            theme="vs-dark"
            options={{
              readOnly: true,
              quickSuggestions: false,
              contextmenu: false,
            }}
          />
        </div>
      </div>
    </div>
  );
};
