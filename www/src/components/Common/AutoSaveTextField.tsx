import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface AutoSaveTextFieldProps extends Omit<TextFieldProps, 'ref'> {
  fieldName?: string;
  savedField?: string | null;
  saveTimestamp?: number;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  showCheckmark?: boolean;
}

export const AutoSaveTextField: React.FC<AutoSaveTextFieldProps> = ({
  fieldName,
  savedField,
  saveTimestamp,
  autoSaveStatus,
  showCheckmark,
  ...props
}) => {
  return <TextField {...props} />;
};
