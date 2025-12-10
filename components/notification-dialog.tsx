"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
}

export default function NotificationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
}: NotificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#8b6d47]">{title}</DialogTitle>
          <DialogDescription className="text-slate-600 pt-2">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button onClick={onCancel} variant="outline" className="flex-1 border-2 border-slate-300 bg-transparent">
            Annuler
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700">
            Valider et envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
