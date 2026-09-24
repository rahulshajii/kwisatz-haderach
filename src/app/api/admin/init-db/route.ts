import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SAMPLE_QUESTIONS = [
  {
    questionNumber: 1,
    questionText: "Which data structure uses LIFO (Last In First Out) principle?",
    optionA: "Queue",
    optionB: "Stack",
    optionC: "Binary Search Tree",
    optionD: "Hash Map",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "A Stack operates on the Last-In, First-Out (LIFO) order.",
  },
  {
    questionNumber: 2,
    questionText: "What is the average time complexity of searching an element in a Hash Table?",
    optionA: "O(1)",
    optionB: "O(log n)",
    optionC: "O(n)",
    optionD: "O(n log n)",
    correctAnswer: "A",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "Under simple uniform hashing, average time complexity for hash lookup is O(1).",
  },
  {
    questionNumber: 3,
    questionText: "In HTTP/2 and HTTP/3, which technique allows multiple requests/responses over a single connection?",
    optionA: "Pipelining",
    optionB: "Multiplexing",
    optionC: "Long Polling",
    optionD: "WebSockets",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "Multiplexing interleaves binary frames over a single TCP/QUIC stream without head-of-line blocking.",
  },
  {
    questionNumber: 4,
    questionText: "Which normal form deals with removing transitive functional dependencies?",
    optionA: "1NF",
    optionB: "2NF",
    optionC: "3NF",
    optionD: "BCNF",
    correctAnswer: "C",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "Third Normal Form (3NF) requires 2NF plus no transitive dependencies of non-prime attributes on superkeys.",
  },
  {
    questionNumber: 5,
    questionText: "In modern operating systems, what is the purpose of the Translation Lookaside Buffer (TLB)?",
    optionA: "Buffer disk I/O requests",
    optionB: "Cache virtual-to-physical address translations",
    optionC: "Store CPU instruction cache",
    optionD: "Handle hardware interrupts",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "The TLB is an MMU hardware cache that stores recent virtual-to-physical page mappings.",
  },
  {
    questionNumber: 6,
    questionText: "In JavaScript, what will `typeof null` evaluate to?",
    optionA: "'null'",
    optionB: "'undefined'",
    optionC: "'object'",
    optionD: "'boolean'",
    correctAnswer: "C",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 25,
    explanation: "`typeof null === 'object'` is a legacy bug in JavaScript dating back to the first implementation.",
  },
  {
    questionNumber: 7,
    questionText: "Which sorting algorithm is guaranteed to run in O(n log n) time in the worst case?",
    optionA: "QuickSort",
    optionB: "MergeSort",
    optionC: "InsertionSort",
    optionD: "BubbleSort",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "MergeSort consistently divides in half and merges in linear time, yielding O(n log n) even in worst case.",
  },
  {
    questionNumber: 8,
    questionText: "What does the ACID acronym stand for in Database Management Systems?",
    optionA: "Atomicity, Consistency, Isolation, Durability",
    optionB: "Accuracy, Concurrency, Integrity, Durability",
    optionC: "Atomicity, Coherence, Isolation, Dependency",
    optionD: "Availability, Consistency, Integrity, Durability",
    correctAnswer: "A",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 25,
    explanation: "ACID represents Atomicity, Consistency, Isolation, and Durability.",
  },
  {
    questionNumber: 9,
    questionText: "Which OSI model layer is responsible for end-to-end reliability and flow control?",
    optionA: "Network Layer",
    optionB: "Transport Layer",
    optionC: "Data Link Layer",
    optionD: "Session Layer",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "The Transport Layer (Layer 4, e.g. TCP) provides end-to-end communication and flow control.",
  },
  {
    questionNumber: 10,
    questionText: "What is the primary role of a reverse proxy like NGINX in web architectures?",
    optionA: "Inspect client-side cookies only",
    optionB: "Terminate TLS, load balance, and protect backend servers",
    optionC: "Act as an in-memory SQL database",
    optionD: "Execute React components directly on the edge",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "Reverse proxies sit between clients and backends, providing SSL termination, caching, and load balancing.",
  },
  {
    questionNumber: 11,
    questionText: "In Git, which command creates a new branch and immediately switches to it?",
    optionA: "git branch <name>",
    optionB: "git switch -c <name>",
    optionC: "git merge <name>",
    optionD: "git stash <name>",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 25,
    explanation: "`git switch -c <name>` (or `git checkout -b <name>`) creates and switches in one step.",
  },
  {
    questionNumber: 12,
    questionText: "What is a 'race condition' in concurrent programming?",
    optionA: "A program that finishes execution faster than benchmark limits",
    optionB: "A condition where system behavior depends on unpredictable execution timing of threads",
    optionC: "A memory leak caused by unclosed sockets",
    optionD: "An infinite recursion in an asynchronous promise",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "A race condition occurs when two or more operations access shared state without proper synchronization.",
  },
  {
    questionNumber: 13,
    questionText: "Which cryptography standard is widely utilized as the symmetric cipher in TLS 1.3?",
    optionA: "RSA 4096",
    optionB: "AES-GCM",
    optionC: "MD5",
    optionD: "SHA-1",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "AES-GCM (Galois/Counter Mode) is an authenticated symmetric encryption standard in TLS 1.3.",
  },
  {
    questionNumber: 14,
    questionText: "In React 18+, what is the purpose of `useId` hook?",
    optionA: "Generate unique IDs for accessibility attributes across client and server renders",
    optionB: "Track component re-render counters",
    optionC: "Fetch session ID from local storage",
    optionD: "Store authentication tokens securely",
    correctAnswer: "A",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "`useId` generates stable, unique IDs that hydrate consistently between SSR and client.",
  },
  {
    questionNumber: 15,
    questionText: "Which IP address range is defined by RFC 1918 as private Class C?",
    optionA: "10.0.0.0 - 10.255.255.255",
    optionB: "172.16.0.0 - 172.31.255.255",
    optionC: "192.168.0.0 - 192.168.255.255",
    optionD: "127.0.0.0 - 127.255.255.255",
    correctAnswer: "C",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 25,
    explanation: "192.168.0.0/16 is the standard Class C private IPv4 range.",
  },
  {
    questionNumber: 16,
    questionText: "In Python, which built-in function returns an iterator of tuples containing index and value?",
    optionA: "zip()",
    optionB: "enumerate()",
    optionC: "range()",
    optionD: "map()",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 25,
    explanation: "`enumerate(iterable)` yields `(index, item)` pairs.",
  },
  {
    questionNumber: 17,
    questionText: "Which tree traversal visits nodes in order: Left subtree, Right subtree, Root?",
    optionA: "In-order",
    optionB: "Pre-order",
    optionC: "Post-order",
    optionD: "Breadth-first",
    correctAnswer: "C",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 25,
    explanation: "Post-order traversal visits Left, Right, then Root.",
  },
  {
    questionNumber: 18,
    questionText: "What is a major advantage of B-Trees over Binary Search Trees in Database Storage Engines?",
    optionA: "B-Trees consume zero memory",
    optionB: "High fan-out minimizes costly disk I/O operations by keeping the tree shallow",
    optionC: "B-Trees don't require balancing",
    optionD: "B-Trees only work in read-only systems",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "High branching factor (fan-out) ensures the tree depth is very small, drastically reducing disk block reads.",
  },
  {
    questionNumber: 19,
    questionText: "Which HTTP status code is used for 'Too Many Requests' (Rate Limiting)?",
    optionA: "401",
    optionB: "403",
    optionC: "429",
    optionD: "503",
    correctAnswer: "C",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 25,
    explanation: "HTTP 429 indicates the user has sent too many requests in a given amount of time.",
  },
  {
    questionNumber: 20,
    questionText: "In Docker, what is the role of multi-stage builds?",
    optionA: "Run multiple containers inside one process",
    optionB: "Reduce final image size by discarding build tools and intermediate artifacts",
    optionC: "Speed up docker pull by omitting SSL certificates",
    optionD: "Auto-scale containers across Kubernetes nodes",
    correctAnswer: "B",
    marks: 2.0,
    negativeMarks: 0.5,
    timeLimit: 30,
    explanation: "Multi-stage builds allow compiling in a heavy build stage and copying only binary outputs to a minimal runtime image.",
  },
];

const DEMO_PARTICIPANTS = [
  { name: "Rahul Shaji", code: "KH26-A7F92" },
  { name: "Ananya Nair", code: "KH26-B8K31" },
  { name: "Adithya Varma", code: "KH26-C9M42" },
  { name: "Fathima Zehra", code: "KH26-D2P53" },
  { name: "Gautham Krishna", code: "KH26-E3R64" },
  { name: "Meera Krishnan", code: "KH26-F4T75" },
  { name: "Nikhil Thomas", code: "KH26-G5V86" },
  { name: "Sneha Menon", code: "KH26-H6X97" },
  { name: "Vishnu Prasad", code: "KH26-J7Z18" },
  { name: "Devika Suresh", code: "KH26-K8B29" },
];

export async function GET(req: NextRequest) {
  try {
    const authSecret = process.env.AUTH_SECRET || "kwisatz-haderach-pragyan-2026-super-secret-key-production-ready-32-chars";
    const secretQuery = req.nextUrl.searchParams.get("secret");
    const admin = checkAdminAuth(req);

    if (!admin && secretQuery !== authSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Seed or Update Admin Account
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "Kwisatz@Pragyan2026";
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await prisma.admin.upsert({
      where: { username: adminUsername },
      update: { passwordHash },
      create: {
        username: adminUsername,
        passwordHash,
      },
    });

    // 2. Seed Default Quiz
    let quiz = await prisma.quiz.findFirst({
      where: { name: "KWISATZ HADERACH" },
    });

    if (!quiz) {
      quiz = await prisma.quiz.create({
        data: {
          name: "KWISATZ HADERACH",
          eventName: "PRAGYAN 2026",
          college: "Adi Shankara Institute of Engineering and Technology (ASIET)",
          department: "Department of Computer Applications",
          status: "WAITING",
          duration: 1800,
          antiCheatMode: "STRICT",
          tieBreakRule: "SCORE_CORRECT_TIME",
          allowReconnect: true,
          warningThreshold: 2,
        },
      });
    }

    // 3. Seed Questions
    await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    for (const q of SAMPLE_QUESTIONS) {
      await prisma.question.create({
        data: {
          quizId: quiz.id,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          timeLimit: q.timeLimit,
          explanation: q.explanation,
        },
      });
    }

    // 4. Seed Demo Participants
    await prisma.participant.deleteMany({ where: { quizId: quiz.id } });
    for (const p of DEMO_PARTICIPANTS) {
      await prisma.participant.create({
        data: {
          quizId: quiz.id,
          name: p.name,
          uniqueCode: p.code,
          status: "REGISTERED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database successfully initialized and seeded!",
      quizId: quiz.id,
      questionsCount: SAMPLE_QUESTIONS.length,
      participantsCount: DEMO_PARTICIPANTS.length,
      demoCode: DEMO_PARTICIPANTS[0].code,
    });
  } catch (error: any) {
    console.error("init-db error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize database" },
      { status: 500 }
    );
  }
}
