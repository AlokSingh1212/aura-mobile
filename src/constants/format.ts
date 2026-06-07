/**
 * Utility to format numbers into compact representations (e.g. 1.1k, 25k, 1.4M).
 */
export const formatCompactNumber = (num: number): string => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (absNum >= 1_000_000_000) {
    return sign + (absNum / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (absNum >= 1_000_000) {
    return sign + (absNum / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (absNum >= 1_000) {
    return sign + (absNum / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  
  return sign + absNum.toString();
};
