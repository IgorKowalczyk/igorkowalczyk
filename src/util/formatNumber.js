export function formatNumber(num) {
 if (!num || isNaN(num)) return "0";
 if (typeof num === "string") num = parseInt(num);
 return new Intl.NumberFormat("en", { notation: "compact" }).format(num);
}
