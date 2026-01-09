import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  children: React.ReactNode;
  className?: string;
}

export const Wizard = ({
  steps,
  currentStep,
  onStepChange,
  children,
  className,
}: WizardProps) => {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div
                className={cn(
                  "flex items-center gap-3 cursor-pointer",
                  isPending && "opacity-50"
                )}
                onClick={() => onStepChange?.(index)}
              >
                <div
                  className={cn(
                    "wizard-step-circle",
                    isCompleted && "completed",
                    isActive && "active",
                    isPending && "pending"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  )}
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4",
                    isCompleted ? "bg-secondary" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
};

interface WizardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const WizardContent = ({ children, className }: WizardContentProps) => {
  return <div className={cn("animate-fade-in", className)}>{children}</div>;
};

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onComplete?: () => void;
  nextLabel?: string;
  completeLabel?: string;
  loading?: boolean;
  canProgress?: boolean;
}

export const WizardFooter = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onComplete,
  nextLabel = "Suivant",
  completeLabel = "Terminer",
  loading = false,
  canProgress = true,
}: WizardFooterProps) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between pt-6 border-t border-border">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0 || loading}
      >
        Précédent
      </Button>
      
      {isLastStep ? (
        <Button onClick={onComplete} disabled={loading || !canProgress}>
          {loading && <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />}
          {completeLabel}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={loading || !canProgress}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
};
