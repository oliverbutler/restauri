import { Request } from './bindings/bindings';
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
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { queryClient } from './main';
import { toast } from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';

export const EditRequest = (props: { request: Request }) => {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(props.request.name);

  const mutation = useMutation(
    async () => {
      await invoke('update_request', {
        requestId: props.request.id,
        request: {
          ...props.request,
          name,
        },
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['requests']);
        setOpen(false);
      },
    }
  );

  const updateRequest = async () => {
    await mutation.mutateAsync();
  };

  return (
    <Dialog open={open} onOpenChange={() => setOpen(false)}>
      <span className="inline-block" onClick={() => setOpen(true)}>
        <Edit className="h-4" />
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Request</DialogTitle>
          <DialogDescription>
            Edit the request's name or delete it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="destructive">Delete</Button>
          <Button onClick={updateRequest} disabled={mutation.isLoading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
