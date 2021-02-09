"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let jobTest;

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    jobTest = resp.body.jobs[0];

    expect(resp.statusCode).toBe(200);
    expect(resp.body.jobs.length).toEqual(3);
  });
});

/************************************** GET /jobs/:id */
describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobTest.id}`);
    expect(resp.body.job.title).toEqual("Salesman or Saleswoman");
  });

  test("job id not found", async function () {
    const resp = await request(app).get(`/job/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /jobs */

describe("POST /jobs/", function () {
  const jobData = {
    title: "Sewage Cleaner",
    salary: 25000,
    equity: "0",
    company_handle: "c1",
  };

  test("works for admin", async function () {
    const resp = await request(app)
      .post(`/jobs`)
      .send(jobData)
      .set("authorization", `Bearer ${adminToken}`);

    jobData["companyHandle"] = jobData["company_handle"];
    delete jobData["company_handle"];
    jobData["id"] = resp.body.job.id;
    expect(resp.status).toBe(201);
    expect(resp.body).toEqual({ job: jobData });
  });

  test("doesn't work for non-admin", async function () {
    const resp = await request(app)
      .post(`/jobs`)
      .send(jobData)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.status).toBe(401);
  });

  test("doesn't work w/ missing data", async function () {
    ["id", "companyHandle"].forEach((e) => delete jobData[e]);
    const resp = await request(app)
      .post(`/jobs`)
      .send(jobData)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.status).toBe(400);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobTest.id}`)
      .send({ title: "Salesperson", salary: 50000 })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body.job.title).toEqual("Salesperson");
  });

  test("Doesn't work for non-admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobTest.id}`)
      .send({ title: "Salesperson" })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("Doesn't work for anon user", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobTest.id}`)
      .send({ title: "Salesperson" });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad data entered", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobTest.id}`)
      .send({ badKey: "Best job ever!" })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */
describe("DELETE /job/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobTest.id}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${jobTest.id}` });
  });

  test("doesn't work for non-admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobTest.id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("doesn't work for anon user", async function () {
    const resp = await request(app).delete(`/jobs/${jobTest.id}`);
    expect(resp.statusCode).toEqual(401);
  });
});
