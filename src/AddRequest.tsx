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

export const AddRequest = () => {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');

  const mutation = useMutation(
    async () => {
      await invoke('add_request', {
        name,
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
      <Button variant={'outline'} type="button" onClick={() => setOpen(true)}>
        Add Request
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Request</DialogTitle>
          <DialogDescription>Create a new request.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <DialogFooter>
          <Button onClick={updateRequest} disabled={mutation.isLoading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
