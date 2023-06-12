//
// app.put('/user', async (req, res) => {...});
//
// Inserts a new user into the database, or if the
// user already exists (based on email) then the
// user's data is updated (name and bucket folder).
// Returns the user's userid in the database.
//
const dbConnection = require('./database.js')

exports.put_user = async (req, res) => {

  console.log("call to /user...");

  try {

    var data = req.body;  // data => JS object

    var email = data.email;
    var lastname = data.lastname;
    var firstname = data.firstname;
    var bucketfolder = data.bucketfolder;

    var rds_response = new Promise((resolve, reject) => {
      console.log("/users: calling RDS...");
      var insertUpdateSql = `
                          insert into users(email, lastname, firstname, bucketfolder)
                            values(?, ?, ?, ?) on duplicate key update lastname = ?, firstname = ?, bucketfolder = ?;`
      var params = [email, lastname, firstname, bucketfolder, lastname, firstname, bucketfolder];

      dbConnection.query(insertUpdateSql, params, (err, results, _) => {
        if(err){
          reject(err);
          return
        }
        console.log("/users insert query done")
        resolve(results);
      })
    })

    rds_response.then(result => {
      console.log("/users done, sending response.....")
      if (result.affectedRows === 1){
          res.status(200).json({
            "message": "inserted",
            "userid": result.insertId
          })
      } else {
          res.status(200).json({
            "message": "updated",
            "userid": result.insertId
          })
      }
 
    }).catch((err) => {
      res.status(400).json({
        "message": err.message,
        "userid": -1
      })
    })

    
  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "userid": -1
    });
  }//catch

}//put