import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive";

interface WrapProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

export function FieldWrap({ id, label, error, hint, optional, className, children }: WrapProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-foreground/90">
        {label}
        {optional && <OptionalTag />}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const TextInput = forwardRef<HTMLInputElement, InputProps>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
    className={cn(control, className)}
    {...props}
  />
));
TextInput.displayName = "TextInput";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
    className={cn(control, "min-h-28", className)}
    {...props}
  />
));
TextArea.displayName = "TextArea";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export const SelectInput = forwardRef<HTMLSelectElement, SelectProps>(({ className, invalid, ...props }, ref) => (
  <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, "appearance-auto", className)} {...props} />
));
SelectInput.displayName = "SelectInput";

/** Campo-isco anti-bot: invisível para pessoas, preenchido por bots. */
export const Honeypot = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
    <label>
      Website
      <input ref={ref} type="text" tabIndex={-1} autoComplete="off" {...props} />
    </label>
  </div>
));
Honeypot.displayName = "Honeypot";

function OptionalTag() {
  return <span className="font-normal text-muted-foreground">{useT().common.optional}</span>;
}
