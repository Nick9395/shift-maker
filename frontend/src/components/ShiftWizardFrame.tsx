import type { MutableRefObject } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  WIZARD_STEPS,
  useShiftWizardPaths,
  wizardStepFromPath,
  wizardStepIndex,
} from "../lib/shiftWizard";
import type { NewShiftWizardContext } from "../lib/shiftWizard";
import { ShiftWizardBreadcrumb } from "./ShiftWizardBreadcrumb";

/** 未到達ステップへの直アクセスを防ぎ、フォーム画面にパンくずを出す */
export function ShiftWizardFrame({
  unlockedRef,
  unlockedStepIndex,
  context,
}: {
  unlockedRef: MutableRefObject<number>;
  unlockedStepIndex: number;
  context: NewShiftWizardContext;
}) {
  const location = useLocation();
  const paths = useShiftWizardPaths();
  const step = wizardStepFromPath(location.pathname);
  const currentIndex = step ? wizardStepIndex(step) : 0;

  if (step && currentIndex > unlockedRef.current) {
    const fallback = WIZARD_STEPS[unlockedRef.current];
    return <Navigate to={paths[fallback.pathKey]} replace />;
  }

  return (
    <>
      {step === "sheet" ? null : (
        <ShiftWizardBreadcrumb unlockedStepIndex={unlockedStepIndex} />
      )}
      <Outlet context={context} />
    </>
  );
}
