type RowReorderButtonsProps = {
  index: number;
  total: number;
  onMove: (offset: -1 | 1) => void;
};

/** 表の行を1つ上または下へ移すボタン */
export function RowReorderButtons({
  index,
  total,
  onMove,
}: RowReorderButtonsProps) {
  return (
    <div className="row-reorder">
      <button
        type="button"
        className="row-reorder__btn"
        aria-label={`${index + 1}行目を上へ`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        上へ
      </button>
      <button
        type="button"
        className="row-reorder__btn"
        aria-label={`${index + 1}行目を下へ`}
        disabled={index === total - 1}
        onClick={() => onMove(1)}
      >
        下へ
      </button>
    </div>
  );
}
