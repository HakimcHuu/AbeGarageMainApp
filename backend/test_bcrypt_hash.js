const bcrypt = require("bcrypt");

async function runBcryptTests() {
  const plaintextPassword = "123456";
  const saltRounds = 10; // Make sure this matches the salt rounds used when you originally hashed passwords

  // The hash you currently have in your database for admin@admin.com
  const dbHashedPassword =
    "$2b$10$B6yvl4hECXploM.fCDbXz.brkhmgqNlawh9ZwbfkFX.F3xrs.15Xi";

  console.log("--- Bcrypt Test Script ---");
  console.log(
    "Plaintext password to test:",
    plaintextPassword,
    "Length:",
    plaintextPassword.length
  );
  console.log(
    "DB Hashed password (from your DB):",
    dbHashedPassword,
    "Length:",
    dbHashedPassword.length
  );
  console.log("--------------------------");

  try {
    // Test 1: Generate a NEW hash for the plaintext and compare it immediately
    console.log("\n--- Test 1: Generating a new hash ---");
    const newlyGeneratedHash = await bcrypt.hash(plaintextPassword, saltRounds);
    console.log(
      "Newly Generated Hash for '" + plaintextPassword + "':",
      newlyGeneratedHash,
      "Length:",
      newlyGeneratedHash.length
    );

    const compareNewlyGenerated = await bcrypt.compare(
      plaintextPassword,
      newlyGeneratedHash
    );
    console.log(
      "Comparison (Plaintext vs. NEWLY Generated Hash):",
      compareNewlyGenerated
    );
    console.log("Expected: true. If false, your bcrypt setup is problematic.");

    // Test 2: Compare the plaintext password with the hash from your database
    console.log("\n--- Test 2: Comparing with DB Hashed Password ---");
    const compareWithDbHash = await bcrypt.compare(
      plaintextPassword,
      dbHashedPassword
    );
    console.log(
      "Comparison (Plaintext vs. DB Hashed Password):",
      compareWithDbHash
    );
    console.log(
      "Expected: true. If false, the DB hash might be incorrect for this plaintext."
    );
  } catch (error) {
    console.error("\nAn error occurred during bcrypt operations:", error);
  }

  console.log("\n--- Test Finished ---");
}

runBcryptTests();
