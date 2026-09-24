/**
 * KWISATZ HADERACH - Functional Verification Suite
 * PRAGYAN 2026 - ASIET Computer Applications
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3000";

async function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ PASS: ${message}`);
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🧪 KWISATZ HADERACH: COMPREHENSIVE FUNCTIONAL TEST SUITE");
  console.log("=======================================================\n");

  // Test 1: Invalid Code Rejection
  console.log("[Test 1] Testing invalid code rejection...");
  const invalidRes = await fetch(`${BASE_URL}/api/participant/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "INVALID-CODE-999" }),
  });
  assert(invalidRes.status === 404, "Invalid code returns 404 Not Found");

  // Test 2: Valid Code Login for Rahul Shaji (KH26-A7F92)
  console.log("\n[Test 2] Testing valid code verification for Rahul Shaji...");
  const validRes = await fetch(`${BASE_URL}/api/participant/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "KH26-A7F92" }),
  });
  const validData = await validRes.json();
  assert(validRes.ok && validData.participant.name === "Rahul Shaji", "Rahul Shaji verified with KH26-A7F92");

  // Test 3: Session Initialization & Token Issuance
  console.log("\n[Test 3] Testing participant session initialization...");
  const sessionRes = await fetch(`${BASE_URL}/api/participant/start-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "KH26-A7F92",
      deviceInfo: { browser: "TestClient" },
    }),
  });
  const sessionData = await sessionRes.json();
  assert(sessionRes.ok && !!sessionData.token, "Session token successfully issued");
  const participantToken = sessionData.token;

  // Test 4: Participant Status & Heartbeat
  console.log("\n[Test 4] Testing participant heartbeat and status check...");
  const statusRes = await fetch(`${BASE_URL}/api/participant/status`, {
    headers: { "x-participant-token": participantToken },
  });
  const statusData = await statusRes.json();
  assert(statusRes.ok && statusData.quizStatus, `Current quiz status reported: ${statusData.quizStatus}`);

  // Test 5: Admin Authentication
  console.log("\n[Test 5] Testing Admin Login...");
  const adminRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin",
      password: process.env.ADMIN_PASSWORD || "Kwisatz@Pragyan2026",
    }),
  });
  const adminCookie = adminRes.headers.get("set-cookie");
  assert(adminRes.ok, "Admin successfully authenticated with secure cookie");

  // Test 6: Question Delivery without Correct Answers Exposed
  console.log("\n[Test 6] Testing Quiz Question Security (No answer leakage)...");
  // Ensure quiz is running
  await prisma.quiz.updateMany({ data: { status: "RUNNING" } });
  await prisma.participant.updateMany({
    where: { uniqueCode: "KH26-A7F92" },
    data: { status: "ACTIVE" },
  });

  const questionRes = await fetch(`${BASE_URL}/api/participant/quiz-data`, {
    headers: { "x-participant-token": participantToken },
  });
  const qData = await questionRes.json();
  assert(questionRes.ok && qData.question, "Question payload delivered");
  assert(qData.question.correctAnswer === undefined, "CRITICAL: correctAnswer is NOT exposed in API");
  assert(qData.question.explanation === undefined, "CRITICAL: explanation is NOT exposed in API");

  // Test 7: Double Submission Prevention
  console.log("\n[Test 7] Testing Double Submission Prevention...");
  const sub1 = await fetch(`${BASE_URL}/api/participant/submit-answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-participant-token": participantToken,
    },
    body: JSON.stringify({
      questionId: qData.question.id,
      selectedAnswer: "B",
      timeTakenMs: 1500,
    }),
  });
  const sub1Data = await sub1.json();
  assert(sub1.ok, "First submission accepted");

  // Repeat submission of same question
  const sub2 = await fetch(`${BASE_URL}/api/participant/submit-answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-participant-token": participantToken,
    },
    body: JSON.stringify({
      questionId: qData.question.id,
      selectedAnswer: "C",
      timeTakenMs: 1800,
    }),
  });
  const sub2Data = await sub2.json();
  assert(sub2Data.alreadySubmitted === true, "Duplicate answer blocked and ignored without corruption");

  // Test 8: Anti-Cheat Strict Termination on Tab Switch
  console.log("\n[Test 8] Testing Anti-Cheat System Termination (PAGE_HIDDEN)...");
  const cheatRes = await fetch(`${BASE_URL}/api/participant/log-activity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-participant-token": participantToken,
    },
    body: JSON.stringify({
      eventType: "PAGE_HIDDEN",
      metadata: { reason: "Tab switched away" },
    }),
  });
  const cheatData = await cheatRes.json();
  assert(cheatData.failed === true, "Strict Anti-Cheat terminated participant as FAILED");

  // Verify participant cannot submit further answers after termination
  const postCheatSub = await fetch(`${BASE_URL}/api/participant/submit-answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-participant-token": participantToken,
    },
    body: JSON.stringify({
      questionId: qData.question.id,
      selectedAnswer: "A",
      timeTakenMs: 1000,
    }),
  });
  assert(postCheatSub.status === 403, "Terminated participant cannot submit answers (403 Forbidden)");

  // Test 9: Results Export CSV
  console.log("\n[Test 9] Testing CSV Results Export...");
  const exportRes = await fetch(`${BASE_URL}/api/admin/export`, {
    headers: { Cookie: adminCookie || "" },
  });
  const csvText = await exportRes.text();
  assert(exportRes.ok && csvText.includes("Participant Code"), "CSV export generated with proper headers");

  console.log("\n=======================================================");
  console.log("🏆 ALL 9 FUNCTIONAL TESTS PASSED PERFECTLY!");
  console.log("=======================================================\n");

  await prisma.$disconnect();
}

runTests().catch(async (e) => {
  console.error("Test failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
