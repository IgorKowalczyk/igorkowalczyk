import chalk from "chalk";

export function formatBytes(bytes: number): string {
 const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
 if (bytes === 0) return "n/a";
 const i = Math.floor(Math.log(bytes) / Math.log(1000));
 return `${(bytes / 1000 ** i).toFixed(1)} ${sizes[i]}`;
}

export function formatNumber(num: number): string {
 if (!num || Number.isNaN(num)) return "0";
 let formattedNum = num;
 if (typeof formattedNum === "string") formattedNum = Number.parseInt(formattedNum, 10);
 return new Intl.NumberFormat("en", { notation: "compact" }).format(formattedNum);
}

export function percentageBar(full: number, curr: number, numBars = 25) {
 if (full <= 0) return "Error: Full value must be greater than 0.";
 if (curr < 0) return "Error: Current value must be greater than or equal to 0.";
 if (curr > full) return "Error: Current value must be less than or equal to full value.";

 const percent = (curr / full) * 100;
 const numCompleteBars = Math.floor(percent / (100 / numBars));
 const numEmptyBars = numBars - numCompleteBars;
 const completeBar = "█".repeat(numCompleteBars);
 const emptyBar = "░".repeat(numEmptyBars);

 return `[${completeBar}${emptyBar}]   ${percent.toFixed(2)}%`;
}

export function getTimeOfDay(hour: number) {
 if (hour >= 6 && hour < 12) return "🌞 Morning";
 if (hour >= 12 && hour < 18) return "🌆 Daytime";
 if (hour >= 18 && hour < 23) return "🌃 Evening";
 return "🌙 Night";
}

const colors = {
 info: chalk.cyan,
 event: chalk.magenta,
 error: chalk.red,
 warn: chalk.yellow,
 done: chalk.green,
};

const types = ["info", "event", "error", "warn", "done"] as const;

const longest = types.reduce((long, str) => Math.max(long, str.length), 0);

export function Logger(type: (typeof types)[number], ...args: string[]) {
 const colorFunction = colors[type];
 console.log(colorFunction(type.padEnd(longest)) + chalk.white(` - ${args.join(" ")}`));
}
