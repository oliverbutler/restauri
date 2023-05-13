import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { QueryClient, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { RequestPanel } from './RequestPanel';
import { Request } from './bindings/bindings';

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
    <div className="w-full h-full max-w-[100vw] max-h-full">
      <div className="flex flex-row gap-4 w-full">
        <div>
          <nav aria-label="Main Nav" className="flex flex-col space-y-1 w-64">
            {requests.map((request) => (
              <a
                className={clsx(
                  'block rounded-lg hover:bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer truncate',
                  {
                    'bg-gray-100': selectedRequestId === request.id,
                  }
                )}
                onClick={() => setSelectedRequestId(request.id)}
              >
                {request.url}
              </a>
            ))}
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
