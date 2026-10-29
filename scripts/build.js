const { execSync } = require("child_process");

// Enforce standard NODE_ENV for Next.js production builds
// Prevents React 19 hooks dispatcher from resolving to null during static prerender
process.env.NODE_ENV = "production";

console.log("[Awaz Build] Executing next build with NODE_ENV=production...");
try {
  execSync("next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });
} catch (error) {
  process.exit(error.status || 1);
}
