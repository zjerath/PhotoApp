//
// app.get('/assets', async (req, res) => {...});
//
// Return all the assets from the database:
//
const dbConnection = require('./database.js')

exports.get_assets = async (req, res) => {

  try {
      console.log("call to /assets...")

    var rds_response = new Promise((resolve, reject) => {
      console.log("/assets: calling RDS...")
      var sql = `select * from assets
                order by assetid;`
      var params = [];

      dbConnection.query(sql, (err, results, _) => {
        if (err) {
          reject(err);
          return;
        }

        console.log("/assets query done");
        resolve(results);
      });
    });

    Promise.all([rds_response]).then(rds_results => {
      console.log("/assets done, sending response....");

      res.json({
        "message": "success",
        "data": rds_results[0]
      })
    })

  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }//catch

}//get
