import { useParams } from "react-router-dom";

/** 新規作成と保存済み編集で、ウィザード各画面のパスを切り替える */
export function shiftWizardPaths(serverId?: number) {
  const base = serverId != null ? `/shifts/${serverId}` : "/shifts/new";
  return {
    root: base,
    staff: `${base}/staff`,
    duties: `${base}/duties`,
    sheet: `${base}/sheet`,
  };
}

/** 今のURLが編集か新規かで、ウィザードの遷移先を決める */
export function useShiftWizardPaths() {
  const { shiftId } = useParams();
  const parsed = Number(shiftId);
  const serverId =
    Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  return {
    ...shiftWizardPaths(serverId),
    isEdit: serverId != null,
  };
}
