import { prisma } from "../src/lib/db/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function rotateCredentials() {
  console.log("=== Awaz Administrative Credential Rotation ===");

  const targetEmail = process.env.ADMIN_EMAIL || "moderator@awaz.org";
  const newPassword =
    process.env.NEW_ADMIN_PASSWORD ||
    `Awz!${crypto.randomBytes(9).toString("base64url")}#26`;

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.upsert({
    where: { email: targetEmail },
    update: {
      passwordHash,
      accountStatus: "ACTIVE",
    },
    create: {
      email: targetEmail,
      displayName: targetEmail.startsWith("admin") ? "Awaz Admin" : "Awaz Moderator",
      role: targetEmail.startsWith("admin") ? "ADMIN" : "MODERATOR",
      passwordHash,
      accountStatus: "ACTIVE",
      verifiedAt: new Date(),
    },
  });

  console.log(`\n✓ Secure password updated for: ${updatedUser.email} (Role: ${updatedUser.role})`);
  console.log("------------------------------------------------------------------");
  console.log("ATTENTION: Save these rotated credentials securely in your password manager.");
  console.log(`Email:    ${updatedUser.email}`);
  console.log(`Password: ${newPassword}`);
  console.log("------------------------------------------------------------------\n");

  await prisma.$disconnect();
}

rotateCredentials().catch((err) => {
  console.error("Rotation failed:", err);
  process.exit(1);
});
