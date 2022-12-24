const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateArrayDbObject = (array) => {
  return array.map((eachItem) => {
    return {
      stateId: eachItem.state_id,
      stateName: eachItem.state_name,
      population: eachItem.population,
    };
  });
};

const convertStateDbObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Returns a list of all states in the state table
//GET API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT 
           *
        FROM
           state;`;
  const state = await database.all(getStatesQuery);
  response.send(convertStateArrayDbObject(state));
});

//Returns a state based on the state ID
//GET API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT 
           *
        FROM 
           state
        WHERE 
           state_id = ${stateId};`;
  const stateList = await database.get(getStateQuery);
  response.send(convertStateDbObject(stateList));
});

//Create a district in the district table.
// POST API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const postCovidListQuery = `
        INSERT INTO 
            district (district_name, 
                state_id, 
                cases, 
                cured, 
                active, 
                deaths)
        VALUES 
            (
                '${districtName}', 
                ${stateId}, 
                ${cases}, 
                ${cured}, 
                ${active}, 
                ${deaths}
            );`;
  await database.run(postCovidListQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
//GET API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
            SELECT 
               * 
            FROM 
               district
            WHERE 
               district_id = ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(convertDistrictDbObject(district));
});

//Deletes a district from the district table based on the district ID
//DELETE API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
            DELETE FROM
                district
            WHERE 
                district_id = ${districtId};`;
  const deleteDistrict = await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID
//PUT API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
            UPDATE
               district
            SET 
               district_name = '${districtName}',
               state_id = ${stateId},
               cases = ${cases},
               cured = ${cured},
               active = ${active},
               deaths = '${deaths}'
            WHERE 
               district_id = ${districtId};`;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
//GET API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateCasesQuery = `
            SELECT 
               SUM(cases) AS totalCases,
               SUM(cured) AS totalCured,
               SUM(active) AS totalActive,
               SUM(deaths) AS totalDeaths 
            FROM 
               district
            WHERE
               state_id = ${stateId};`;
  const casesResponse = await database.get(getStateCasesQuery);
  response.send(casesResponse);
});

//Returns an object containing the state name of a district based on the district ID
//GET API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
            SELECT 
               state.state_name AS stateName
            FROM 
               district 
               INNER JOIN state ON district.state_id = state.state_id
            WHERE 
               district.district_id = ${districtId};`;
  const getDistrictResponse = await database.get(getDistrictDetailsQuery);
  response.send(getDistrictResponse);
});

module.exports = app;
