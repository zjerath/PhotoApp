//
// app.post('/image/:userid', async (req, res) => {...});
//
// Uploads an image to the bucket and updates the database,
// returning the asset id assigned to this image.
//
const dbConnection = require('./database.js')
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

const uuid = require('uuid');

var ExifImage = require('exif').ExifImage;

exports.post_image = async (req, res) => {

  console.log("call to /image...");
  try {

    var data = req.body;  // data => JS object
    var userid = req.params.userid;
    var assetname = data.assetname;
    var imageData = data.data;
    var imageBytes = Buffer.from(imageData, 'base64');

    // console.log("userid is ", userid);
    // console.log("assetname is ", assetname);

    var rds_response = new Promise((resolve, reject) => {
      console.log("/image: calling RDS to check if user exists ...");

      var sql = `
              select * from users where userid = ?;
    `;
      var params = [userid];

      dbConnection.query(sql, params, (err, results, _) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      })
    })

    rds_response.then(result => {
      if (result.length === 0) {
        res.status(200).json({
          "message": "no such user...",
          "assetid": -1
        })
      } else {
        console.log("/image check valid userid done")
        // upload image into S3
        // generate bucket folder using UUID v4
        var assetKey = uuid.v4() + ".jpg";
        var bucketFolder = result[0].bucketfolder;

        var pathKey = bucketFolder + "/" + assetKey;

        // put asset in s3
        const command = new PutObjectCommand({
          Bucket: s3_bucket_name,
          Key: pathKey,
          Body: imageBytes
        })

        var s3_response = s3.send(command);

        // insert new row into the assets table of database
        s3_response.then(result => {
          var rds_response = new Promise((resolve, reject) => {
            var sql = `
                    insert into assets(userid, assetname, bucketkey)
                      values(?, ?, ?);
                    `;
            var params = [userid, assetname, pathKey];

            dbConnection.query(sql, params, (err, results, _) => {
              if (err) {
                reject(err);
                return;
              }
              console.log("/image insert into assets table query done")
              resolve(results);
            })
          })
          rds_response.then(result => {
            if (result.affectedRows === 1) {
              new ExifImage({ image: imageBytes }, function(error, exifData) {
                if (error) {
                  console.log('Error: ' + error.message);
                } else {
                  // Obtain the date of creation, latitude, and longitude
                  var datecreated = exifData.exif.CreateDate || "N/A";
                  var latitude = exifData.gps.GPSLatitude[2] || "N/A";
                  var longitude = exifData.gps.GPSLongitude[2] || "N/A";

                  var rds_response = new Promise((resolve, reject) => {
                    // Store the otained parameters in the database;
                    var sql = `
                      insert into metadata(assetid, longitude, latitude, datecreated)
                            values(?, ?, ?, ?);  
                      `;

                    var params = [result.insertId, longitude, latitude, datecreated];
                    dbConnection.query(sql, params, (err, results, _) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      console.log("/image added image metadata to database")
                      resolve(results);
                    });
                  });
                  rds_response.then(result => {
                    if (result.affectedRows === 1) {
                      res.status(200).json({
                        "message": "success",
                        "assetid": result.insertId
                      })
                    }
                  })
                }
              })
            }
          }).catch(err => {
            res.status(400).json({
              "message": err.message,
              "assetid": -1
            })
          })
        }).catch(err => {
          res.status(400).json({
            "message": err.message,
            "assetid": -1
          })
        })
      }
    }).catch((err) => {
      res.status(400).json({
        "message": err.message,
        "assetid": -1
      })
    })
  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "assetid": -1
    });
  }//catch

}//post