export const ConvertNumber = (number) => {
 return Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "long",
  style: "decimal",
  maximumFractionDigits: 2,
 }).format(number);
};
