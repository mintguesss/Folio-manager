/** 幫別人買的股票：交易備註寫這些名字，持股會分開算，也不算進自己的總計 */
export const OTHER_OWNERS = ["小堡"];

export function ownerOf(note: string | null | undefined): string | null {
  const n = note?.trim();
  return n && OTHER_OWNERS.includes(n) ? n : null;
}
