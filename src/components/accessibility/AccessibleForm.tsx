'use client';

import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { getAriaInvalid, getAriaDescribedBy, getAccessibleLabel } from '@/lib/accessibility';

interface BaseFieldProps {
  label: string;
  id: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  optional?: boolean;
}

// Accessible Input Field
interface AccessibleInputProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {}

export function AccessibleInput({
  label,
  id,
  error,
  helpText,
  required,
  optional,
  className = '',
  ...props
}: AccessibleInputProps) {
  const hasError = Boolean(error);
  const hasHelp = Boolean(helpText);

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {getAccessibleLabel(label, required, optional)}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>

      <input
        id={id}
        aria-invalid={getAriaInvalid(hasError)}
        aria-describedby={getAriaDescribedBy(id, hasError, hasHelp) || undefined}
        aria-required={required}
        className={`
          w-full px-3 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />

      {helpText && !hasError && (
        <p id={`${id}-help`} className="text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {hasError && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible Textarea
interface AccessibleTextareaProps
  extends BaseFieldProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {}

export function AccessibleTextarea({
  label,
  id,
  error,
  helpText,
  required,
  optional,
  className = '',
  ...props
}: AccessibleTextareaProps) {
  const hasError = Boolean(error);
  const hasHelp = Boolean(helpText);

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {getAccessibleLabel(label, required, optional)}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>

      <textarea
        id={id}
        aria-invalid={getAriaInvalid(hasError)}
        aria-describedby={getAriaDescribedBy(id, hasError, hasHelp) || undefined}
        aria-required={required}
        className={`
          w-full px-3 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />

      {helpText && !hasError && (
        <p id={`${id}-help`} className="text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {hasError && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible Select
interface AccessibleSelectProps
  extends BaseFieldProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  options: Array<{ value: string; label: string }>;
}

export function AccessibleSelect({
  label,
  id,
  error,
  helpText,
  required,
  optional,
  options,
  className = '',
  ...props
}: AccessibleSelectProps) {
  const hasError = Boolean(error);
  const hasHelp = Boolean(helpText);

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {getAccessibleLabel(label, required, optional)}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>

      <select
        id={id}
        aria-invalid={getAriaInvalid(hasError)}
        aria-describedby={getAriaDescribedBy(id, hasError, hasHelp) || undefined}
        aria-required={required}
        className={`
          w-full px-3 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {helpText && !hasError && (
        <p id={`${id}-help`} className="text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {hasError && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible Checkbox
interface AccessibleCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: string;
  id: string;
  error?: string;
  helpText?: string;
}

export function AccessibleCheckbox({
  label,
  id,
  error,
  helpText,
  className = '',
  ...props
}: AccessibleCheckboxProps) {
  const hasError = Boolean(error);
  const hasHelp = Boolean(helpText);

  return (
    <div className="space-y-1">
      <div className="flex items-start">
        <input
          type="checkbox"
          id={id}
          aria-invalid={getAriaInvalid(hasError)}
          aria-describedby={getAriaDescribedBy(id, hasError, hasHelp) || undefined}
          className={`
            mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded
            focus:ring-2 focus:ring-blue-500
            ${hasError ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        <label htmlFor={id} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          {label}
        </label>
      </div>

      {helpText && !hasError && (
        <p id={`${id}-help`} className="text-sm text-gray-500 dark:text-gray-400 ml-6">
          {helpText}
        </p>
      )}

      {hasError && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600 dark:text-red-400 ml-6"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible Button
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  loading = false,
  loadingText = 'Loading...',
  className = '',
  disabled,
  ...props
}: AccessibleButtonProps) {
  const baseStyles = `
    px-4 py-2 rounded-lg font-medium
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors
  `;

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">{loadingText}</span>
          <span aria-hidden="true">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
