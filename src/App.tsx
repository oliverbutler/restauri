import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { QueryClient, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { RequestPanel } from './RequestPanel';
import { Request } from './bindings/bindings';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuLabel,
  ContextMenuRadioItem,
  ContextMenuShortcut,
} from './ui/context-menu';
import { AddRequest } from './AddRequest';
import { HttpMethod } from './HttpMethod';
import { EditRequest } from './EditRequest';

function App() {
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null
  );

  const requestsQuery = useQuery(
    ['requests'],
    () => invoke('get_requests') as unknown as Request[],
    {
      staleTime: 30 * 1000,
      onSuccess: (data) => {
        const firstRequest = data[0];

        if (firstRequest) {
          setSelectedRequestId(firstRequest.id);
        }
      },
    }
  );

  const addRequest = async () => {
    await invoke('add_request', { url });

    requestsQuery.refetch();
  };

  const requests = requestsQuery.data || [];

  const [url, setUrl] = useState('');

  return (
    <div
      className="w-full h-full max-w-[100vw] max-h-full pt-6"
      data-tauri-drag-region
    >
      <div className="flex flex-row gap-4 w-full h-full">
        <div>
          <nav
            aria-label="Main Nav"
            className="flex flex-col space-y-1 w-64 m-2"
          >
            {requests.map((request) => (
              <ContextMenu>
                <ContextMenuTrigger
                  className={clsx(
                    'rounded-lg hover:bg-muted px-4 py-2 text-sm font-medium cursor-pointer truncate flex flex-row group',
                    {
                      'bg-muted': selectedRequestId === request.id,
                    }
                  )}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <div>
                    <HttpMethod method={request.method} />{' '}
                    {request.name || request.url}
                  </div>
                  <div className="ml-auto hidden group-hover:block">
                    <EditRequest request={request} />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                  <ContextMenuItem inset>
                    Edit
                    <ContextMenuShortcut>⌘e</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem inset>
                    Delete
                    <ContextMenuShortcut>⌘d</ContextMenuShortcut>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
            <AddRequest />
          </nav>
        </div>
        <div className="flex-grow w-24">
          {selectedRequestId ? (
            <RequestPanel
              requestId={selectedRequestId}
              key={selectedRequestId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-bold text-gray-400">
                No request selected
              </div>
              <div className="text-gray-400">
                Select a request from the left sidebar
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
