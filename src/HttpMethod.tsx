import { cva } from 'class-variance-authority';
import { cn } from '../libs/utils';

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

const buttonVariants = cva('text-sm', {
  variants: {
    method: {
      GET: 'text-primary',
      POST: 'text-yellow-500',
      PUT: 'text-amber-500',
      DELETE: 'text-destructive',
      PATCH: 'text-emerald-500',
    },
  },
  defaultVariants: {
    method: 'GET',
  },
});

export const HttpMethod = (props: { method: string }) => {
  return (
    <span className={cn(buttonVariants({ method: props.method as any }))}>
      {props.method}
    </span>
  );
};
