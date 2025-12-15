const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");

const projectRoot = path.resolve(__dirname, "..");
const prismaDir = path.join(projectRoot, "prisma");
const testDbPath = path.join(prismaDir, "test.db");
const testDbUrl = `file:${testDbPath}`;
const listOrigin = "http://frontend.local.test:5173";
const regexOrigin = "https://regex-allowed.example";

let app;
let prisma;

before(async () => {
  process.env.DATABASE_URL = testDbUrl;
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  process.env.CORS_ORIGIN = `${listOrigin},/^https?:\\/\\/regex-allowed\\.example$/`;

  if (fs.existsSync(testDbPath)) {
    fs.rmSync(testDbPath);
  }

  execSync("npx prisma migrate deploy --schema prisma/schema.prisma", {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: "inherit",
  });

  ({ app } = require("../index"));
  prisma = new PrismaClient();
});

after(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: "test-user-" } } });
  await prisma.$disconnect();

  if (fs.existsSync(testDbPath)) {
    fs.rmSync(testDbPath);
  }
});

test("/health expone CORS configurables y estado ok", async () => {
  const response = await request(app).get("/health").set("Origin", listOrigin).expect(200);

  assert.equal(response.headers["access-control-allow-origin"], listOrigin);
  assert.equal(response.headers["access-control-allow-credentials"], "true");
  assert.equal(response.body.status, "ok");
});

test("/health acepta orígenes que matchean regex", async () => {
  const response = await request(app).get("/health").set("Origin", regexOrigin).expect(200);

  assert.equal(response.headers["access-control-allow-origin"], regexOrigin);
  assert.equal(response.headers["access-control-allow-credentials"], "true");
});

test("/auth/register setea cookie y respeta CORS", async () => {
  const uniqueEmail = `test-user-${Date.now()}@example.com`;
  const response = await request(app)
    .post("/auth/register")
    .set("Origin", listOrigin)
    .send({
      name: "Test User",
      email: uniqueEmail,
      password: "password123",
    })
    .expect(200);

  const setCookie = response.headers["set-cookie"] || [];

  assert.ok(setCookie.some((cookie) => cookie.startsWith("token=")), "debería existir la cookie de sesión");
  assert.ok(setCookie.some((cookie) => /HttpOnly/i.test(cookie)), "la cookie debe ser HttpOnly");
  assert.ok(setCookie.some((cookie) => /SameSite=Lax/i.test(cookie)), "la cookie debe usar SameSite=Lax");
  assert.equal(response.headers["access-control-allow-origin"], listOrigin);
  assert.equal(response.headers["access-control-allow-credentials"], "true");
  assert.equal(response.body.email, uniqueEmail);

  const meResponse = await request(app)
    .get("/auth/me")
    .set("Origin", listOrigin)
    .set("Cookie", setCookie)
    .expect(200);

  assert.equal(meResponse.body.email, uniqueEmail);
});
