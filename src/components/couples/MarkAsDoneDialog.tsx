
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Activity } from "@/types";

interface MarkAsDoneDialogProps {
  activity: Activity | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (activity: Activity, wouldDoAgain: boolean) => void;
}

export function MarkAsDoneDialog({ activity, isOpen, onOpenChange, onConfirm }: MarkAsDoneDialogProps) {
  if (!activity) return null;

  const handleConfirm = (wouldDoAgain: boolean) => {
    onConfirm(activity, wouldDoAgain);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Did you enjoy "{activity.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Marking this as done will move it to your history. Would you like to see this date idea again in the future?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
           <Button variant="secondary" onClick={() => handleConfirm(false)}>
            No, Just Mark as Done
          </Button>
          <Button onClick={() => handleConfirm(true)}>
            Yes, Add it Back!
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
