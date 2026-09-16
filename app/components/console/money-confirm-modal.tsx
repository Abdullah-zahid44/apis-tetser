'use client';

import { AlertTriangle, ShieldAlert } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface MoneyConfirmModalProps {
  isOpen: boolean;
  endpointName: string;
  method: string;
  url: string;
  country: string;
  environment: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MoneyConfirmModal({ isOpen, endpointName, method, url, country, environment, onConfirm, onCancel }: MoneyConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] overflow-y-auto sm:max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Live</Badge>
            <Badge variant="outline">{country.toUpperCase()}</Badge>
          </div>
          <AlertDialogTitle>Confirm production request</AlertDialogTitle>
          <AlertDialogDescription>
            This request may create or move real funds. Verify the account, amount and order ID before continuing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>{endpointName}</AlertTitle>
          <AlertDescription className="break-all">{method} {url} · {environment.toUpperCase()}</AlertDescription>
        </Alert>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            <ShieldAlert data-icon="inline-start" />
            Confirm and send
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
