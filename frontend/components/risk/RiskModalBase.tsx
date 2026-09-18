"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RiskModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

export function RiskModalBase({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxWidthClass = "max-w-3xl",
  ariaLabelledBy = "risk-modal-title",
  ariaDescribedBy = "risk-modal-description",
}: RiskModalBaseProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus trap & keyboard ESC handler
  useEffect(() => {
    if (!isOpen) return;

    // Remember currently focused element to restore on close
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    // Lock background scroll
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // ESC key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on dialog
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = origOverflow;
      clearTimeout(timer);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-navy-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      <div
        ref={modalRef}
        className={cn(
          "relative w-full rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] transition-all",
          maxWidthClass
        )}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border bg-surface px-6 py-4 shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={ariaLabelledBy} className="text-lg font-bold text-navy-900">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p id={ariaDescribedBy} className="mt-1 text-xs text-text-muted">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface2 hover:text-navy-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>

        {/* Modal Footer (if provided) */}
        {footer && (
          <div className="border-t border-border bg-surface2 px-6 py-3.5 flex items-center justify-between shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
