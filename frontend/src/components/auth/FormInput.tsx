import { forwardRef } from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({ label, error, id, className, ...props }, ref) => {
  const inputId = id ?? props.name;
  const defaultClassName = `scanza-focus-ring w-full rounded-xl border bg-scanza-bg px-4 py-2.5 text-sm text-scanza-text outline-none transition-colors ${
    error ? "border-scanza-danger" : "border-scanza-border focus:border-scanza-primary"
  }`;
  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-scanza-text">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        {...props}
        className={className ?? defaultClassName}
      />
      {error && <p className="mt-1.5 text-xs text-scanza-danger">{error}</p>}
    </div>
  );
});
FormInput.displayName = "FormInput";

export default FormInput;
