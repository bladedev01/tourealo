import React from "react";

interface CheckoutWizardProps {
  step: number;
  steps: Array<{ label: string; description?: string }>;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isNextDisabled?: boolean;
  showNext?: boolean;
  showBack?: boolean;
  children: React.ReactNode;
}

const CheckoutWizard: React.FC<CheckoutWizardProps> = ({
  step,
  steps,
  onNext,
  onBack,
  nextLabel = "Siguiente",
  backLabel = "Atrás",
  isNextDisabled,
  showNext = true,
  showBack = true,
  children,
}) => {
  return (
    <div className="mb-10">
      <div className="mb-6">
        <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          {steps.map((item, index) => {
            const position = index + 1;
            const isActive = position === step;
            const isCompleted = position < step;
            return (
              <li key={item.label} className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${isActive ? "border-emerald-500 bg-emerald-500 text-white" : isCompleted ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}
                >
                  {position}
                </span>
                <div className="leading-tight">
                  <div className={`text-sm font-semibold ${isActive ? "text-emerald-700" : "text-slate-600"}`}>{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-slate-400">{item.description}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {children}
        <div className="mt-8 flex items-center justify-between">
          {showBack ? (
            <button
              className="text-sm font-semibold text-emerald-700 disabled:text-slate-300"
              onClick={onBack}
              disabled={step === 1}
            >
              &larr; {backLabel}
            </button>
          ) : (
            <span />
          )}
          {showNext ? (
            <button
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow disabled:bg-slate-300"
              onClick={onNext}
              disabled={step === steps.length || isNextDisabled}
            >
              {nextLabel} &rarr;
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutWizard;
