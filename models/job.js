"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  /* 
  Create new job posting
  Returns [{ id, title, salary, equity, companyHandle }]
  */
  static async create({ title, salary, equity, company_handle }) {
    const { rows } = await db.query(
      `INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, company_handle]
    );
    const job = rows[0];

    return job;
  }

  /* 
  Find all jobs.
  Returns [{ id, title, salary, equity, companyHandle }, ...]
  */
  static async findAll() {
    const { rows } = await db.query(`SELECT * FROM jobs`);
    return rows;
  }

  /* 
  Update job data - allows for partial update
  */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                        SET ${setCols} 
                        WHERE id = ${handleVarIdx} 
                        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No jobs w/ id: ${id}`);

    return job;
  }

  /* 
  Delete given job from database based on id; returns undefined.
  Throws NotFoundError if company not found.
  */

  static async remove(id) {
    const {rows} = await db.query(`DELETE FROM jobs WHERE id = $1 RETURNING id`, [id]);
    const job = rows[0];

    if (!job) throw new NotFoundError(`No job found with id: ${id}`);
  }

  /* 
  Get a job from database based on id; returns *.
  Throws NotFoundError if company not found.
  */

  static async get(id) {
    const { rows } = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
               FROM jobs
               WHERE id = $1`,
      [id]
    );

    const job = rows[0];

    if (!job) throw new NotFoundError(`No job found with id: ${id}`);

    return job;
  }


/*
Automates filtering of companies based on query string 
Valid query strings = minSalary, title, hasEquity
*/   
  static async filterJobs(urlQuery) {
      let newQuery = `SELECT * FROM jobs WHERE`;
      let queryCount = 0;

      for (let key in urlQuery) {
          if (queryCount > 0) {
          newQuery += ` AND `;
          }
          if (key === "title") {
          newQuery += ` LOWER(title) LIKE LOWER('%${urlQuery[key]}%')`;
          }
          if (key === "hasEquity") {
          newQuery += ` equity > ${0} `;
          }
          if (key === "minSalary") {
          newQuery += ` salary > ${urlQuery[key]} `;
          }
          queryCount++;
  }

  const results = await db.query(newQuery);
  return results.rows;
  }


}

module.exports = Job;
