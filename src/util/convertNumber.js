export const ConvertNumber = (number) => {
 const formatted = Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "long",
  style: "decimal",
  maximumFractionDigits: 2,
 }).format(number);
 return formatted;
};
