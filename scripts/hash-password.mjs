import { randomBytes, scryptSync } from "node:crypto";
if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  console.error("Run this script in an interactive terminal.");
  process.exit(1);
}
process.stdout.write("Accountant password (hidden): ");
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");
let password = "";
process.stdin.on("data", chunk => {
  for (const character of chunk) {
    if (character === "\u0003") { process.stdin.setRawMode(false); process.stdout.write("\n"); process.exit(1); }
    if (character === "\r" || character === "\n") {
      process.stdin.setRawMode(false);
      if (password.length < 12) { console.error("\nUse at least 12 characters."); process.exit(1); }
      const salt = randomBytes(16).toString("hex");
      console.log("\nACCOUNTANT_PASSWORD_HASH=" + salt + ":" + scryptSync(password, salt, 64).toString("hex"));
      process.exit(0);
    }
    if (character === "\u007f" || character === "\b") password = password.slice(0,-1);
    else if (character >= " ") password += character;
  }
});
