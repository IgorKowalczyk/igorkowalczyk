export function percentageBar(full, curr) {
 if (full <= 0) return "Error: Full value must be greater than 0.";
 if (curr < 0) return "Error: Current value must be greater than or equal to 0.";
 if (curr > full) return "Error: Current value must be less than or equal to full value.";
 const percent = (curr / full) * 100;
 let str = "[";
 for (let i = 0; i < 10; i++) {
  str += percent >= (100 / 10) * (i + 1) ? "█" : "░";
 }
 str += `] ${percent.toFixed(2)}%`;

 return str;
}
