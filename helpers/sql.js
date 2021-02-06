const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/*
to be used in models
dataToUpdate = updated information pulled from req.body for patch requests. 
Function transforms data to allow it to safely run via SQL
Returns data to use for UPDATE table_name SET (data), [$1, $2, etc.] 
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {  
  const keys = Object.keys(dataToUpdate);
  //makes sure there's data
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
