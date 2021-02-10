"use strict";

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError, ExpressError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/* 
GET / 
   Can filter on provided search filters:
  - title (will find case-insensitive, partial matches)
  - minSalary
  - hasEquity (boolean)
  Authorization required: none
  Example: http://localhost:3001/jobs?minSalary=50000&title=sales&hasEquity=true
 */

router.get("/", async function (req, res, next) {
  try {
    
    let jobs;
    const validQueries = ['type', 'minSalary', 'title', 'hasEquity'];
    const urlQuery = req.query;
    console.log(urlQuery)
    for (let key in urlQuery) {
      if (validQueries.indexOf(key) === -1) {
        throw new ExpressError(`Invalid query: ${key}`, 400)
      }
    }
    
    if(urlQuery.title || urlQuery.minSalary || urlQuery.hasEquity) {
      delete urlQuery.type;
      jobs = await Job.filterJobs(urlQuery)
    } else {
      jobs = await Job.findAll();
    }
    
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/*
Get job based on id => Returns all data
Authorization: None
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/* 
Posts a job
json.body should contain { title, salary, equity, company_handle } 
Returns { id, title, salary, equity, companyHandle }
Authorization: Admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });

    } catch (err) {
      return next(err);
    }
});

/* 
Patch route to edit job
 Authorization: Admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
    
        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
      return next(err);
    }
});

/*
DELETE job using job_id
Authorization: Admin
*/

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
