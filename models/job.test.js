"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const newJob = {
  title: "new",
  salary: 100,
  equity: "0.01",
  company_handle: "c1",
};

let newJob2 = {
  title: "new2",
  salary: 200,
  equity: "0.02",
  company_handle: "c2",
};

/*************************************** create */

describe("create", function () {
  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job.title).toEqual(newJob.title);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    await Job.create(newJob);
    await Job.create(newJob2);
    let jobs = await Job.findAll();
    expect(jobs.length).toEqual(2);
  });
});

/************************************** update */

describe("update", function () {
  let updateData = {
    // title: "new2",
    salary: 1000,
    equity: "0.100",
  };

  test("works", async function () {
    let tempJob = await Job.create(newJob);
    let updatedJob = await Job.update(tempJob.id, updateData);

    expect(updatedJob.salary).toBe(1000);
  });

  test("invalid id", async function () {
    try {
      await Job.update(0, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove(id)", function () {
  test("successfully removes item", async function () {
    let tempJob = await Job.create(newJob);
    let removedJob = await Job.remove(tempJob.id);
    let allJobs = await Job.findAll();
    expect(allJobs.length).toBe(0);
  });

  test("invalid id provided", async function () {
    try {
      let removedJob = await Job.remove(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** get(id) */

describe("get(id)", function () {
  test("successfully finds job", async function () {
    let tempJob = await Job.create(newJob);
    let foundJob = await Job.get(tempJob.id);

    expect(foundJob.title).toBe("new");
  });

  test("invalid id provided", async function () {
    try {
      let foundJob = await Job.get(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** filterJobs(urlQuery) */

describe("filterJobs(urlQuery)", function () {

  test("successfully finds job w/ single query", async function () {
    await Job.create(newJob);
    await Job.create(newJob2);

    let foundJob = await Job.filterJobs({minSalary: '101'});
    expect(foundJob[0].title).toBe('new2')
    expect(foundJob.length).toEqual(1)
  });

  test("successfully finds jobs w/ multiple queries", async function () {
    await Job.create(newJob);
    await Job.create(newJob2);

    let foundJobs = await Job.filterJobs({hasEquity: true, title: 'new'});

    expect(foundJobs.length).toBe(2)
  });

  
});
