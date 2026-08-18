/** 配列の要素を1つ隣へ移動する。範囲外なら元の配列を返す */
export function moveItem<T>(items: T[], index: number, offset: -1 | 1): T[] {
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (item === undefined) return items;
  next.splice(nextIndex, 0, item);
  return next;
}
