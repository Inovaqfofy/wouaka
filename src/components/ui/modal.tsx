import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
}: ModalProps) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full mx-4 bg-card rounded-2xl shadow-xl animate-scale-in",
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-6 border-b border-border">
            <div>
              {title && <h3 className="font-display text-lg font-semibold">{title}</h3>}
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter = ({ children, className }: ModalFooterProps) => {
  return (
    <div className={cn("flex items-center justify-end gap-3 pt-4 border-t border-border -mx-6 -mb-6 px-6 py-4 mt-6", className)}>
      {children}
    </div>
  );
};
