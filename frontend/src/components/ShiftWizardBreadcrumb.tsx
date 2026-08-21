import { Link, useLocation } from "react-router-dom";
import {
  WIZARD_STEPS,
  pathForWizardStep,
  useShiftWizardPaths,
  wizardStepFromPath,
} from "../lib/shiftWizard";

/** 到達済みステップだけを出すウィザードのパンくず */
export function ShiftWizardBreadcrumb({
  unlockedStepIndex,
  variant = "page",
}: {
  unlockedStepIndex: number;
  variant?: "page" | "sheet";
}) {
  const location = useLocation();
  const paths = useShiftWizardPaths();
  const current = wizardStepFromPath(location.pathname);
  if (!current) return null;

  const visible = WIZARD_STEPS.filter((_, index) => index <= unlockedStepIndex);

  return (
    <nav
      className={
        variant === "sheet"
          ? "wizard-breadcrumb wizard-breadcrumb--sheet"
          : "wizard-breadcrumb"
      }
      aria-label="作成手順"
    >
      <ol>
        {visible.map((step) => {
          const isCurrent = step.id === current;
          return (
            <li key={step.id}>
              {isCurrent ? (
                <span className="wizard-breadcrumb__current" aria-current="page">
                  {step.label}
                </span>
              ) : (
                <Link to={pathForWizardStep(paths, step.id)}>{step.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
