"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function Dialog({ open, onOpenChange, title, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg min-w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-8 shadow-2xl border border-lime-100 animate-modal-pop">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-lime-700 transition-transform duration-200 ease-in-out hover:scale-125 focus:outline-none"
            onClick={() => onOpenChange(false)}
            title="Fechar"
            aria-label="Fechar modal"
          >
            <span className="inline-block transition-transform duration-300 ease-in-out">
              <X size={28} />
            </span>
          </button>
          {title && (
            <DialogPrimitive.Title asChild>
              <div className="text-xl font-bold mb-4 text-primary">{title}</div>
            </DialogPrimitive.Title>
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
