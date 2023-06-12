//
// app.get('/users', async (req, res) => {...});
//
// Return all the users from the database:
//
const dbConnection = require('./database.js')

exports.get_users = async (req, res) => {

  try {
    console.log("call to /users...")

    var rds_response = new Promise((resolve, reject) => {
      console.log("/users: calling RDS...");
      var sql = `select * from users
                order by userid;`
      var params = [];

      dbConnection.query(sql, (err, results, _) => {
        if (err) {
          reject(err);
          return;
        }

        console.log("/users query done");
        resolve(results);
      });
    });

    Promise.all([rds_response]).then(rds_results => {
      console.log("/users done, sending response....");
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
