import { useMemo } from 'react';
import { Request } from '../bindings/bindings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { useRequest } from '../bindings/useRequest';

export const RequestInput = (props: { request: Request }) => {
  const { updateRequest } = useRequest(props.request.id);

  const params: [string, string][] = useMemo(() => {
    const url = props.request.url;

    const urlParams = new URLSearchParams(url.split('?')[1] || '');

    return Array.from(urlParams.entries());
  }, [props.request.url]);

  const handleParamValueChange = (index: number, value: string) => {
    const newParams = [...params];

    newParams[index][1] = value;

    const newUrl = new URL(props.request.url);

    newUrl.search = new URLSearchParams(newParams).toString();

    updateRequest({
      ...props.request,
      url: newUrl.toString(),
    });
  };

  const handleParamKeyChange = (index: number, key: string) => {
    const newParams = [...params];

    newParams[index][0] = key;

    const newUrl = new URL(props.request.url);

    newUrl.search = new URLSearchParams(newParams).toString();

    updateRequest({
      ...props.request,
      url: newUrl.toString(),
    });
  };

  return (
    <div className="w-1/2">
      <Tabs defaultValue="params">
        <TabsList>
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>
        <TabsContent value="params">
          <table className="w-full">
            <tbody>
              {params.map(([key, value], index) => (
                <tr key={index}>
                  <td className="px-2 py-1">
                    <Input
                      value={key}
                      onChange={(e) =>
                        handleParamKeyChange(index, e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={value}
                      onChange={(e) =>
                        handleParamValueChange(index, e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>
        <TabsContent value="headers">Change your password here.</TabsContent>
      </Tabs>
    </div>
  );
};
