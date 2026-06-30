// Generate bcrypt hash for admin passwords
// Usage: node scripts/hash-password.js "your-password"
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  process.exit(1);
}

// Minimum 8 characters
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log("\nBcrypt hash:");
console.log(hash);
console.log("\nSet this as ADMIN_PASSWORD_1/2/3 in your Vercel env vars.");
