//
// app.get('/download/:assetid', async (req, res) => {...});
//
// downloads an asset from S3 bucket and sends it back to the
// client as a base64-encoded string.
//
const dbConnection = require('./database.js')
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

exports.get_download = async (req, res) => {

  console.log("call to /download...");

  try {


    //
    // TODO
    //
    // MySQL in JS:
    //   https://expressjs.com/en/guide/database-integration.html#mysql
    //   https://github.com/mysqljs/mysql
    // AWS:
    //   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
    //

    var assetidParam = req.params.assetid;

    console.log("/download: calling RDS...");
    var sql = `select *
              from assets
              where assetid = ?;`;

    var params = [assetidParam];

    dbConnection.query(sql, params, (err, results, _) => {
      if (err) {
        res.status(400).json({
          "message": err.message,
          "data": []
        });
        return;
      }
      if (results.length == 0) {
        res.status(200).json({
          "message": "no such asset...",
          "user_id": -1,
          "asset_name": "?",
          "bucket_key": "?",
          "data": []
        });
        return;
      }

      console.log("download/assetid query done");

      var rds_result = results[0];
      var bucket_key = rds_result['bucketkey'];
      var assetid = rds_result['assetid'];
      var assetname = rds_result['assetname'];
      var userid = rds_result['userid'];

      var input = {
        Bucket: s3_bucket_name,
        Key: bucket_key
      };

      var command = new GetObjectCommand(input);
      var s3_response = s3.send(command);


      s3_response.then(async s3_result => {
        var data_str = await s3_result.Body.transformToString("base64");
        console.log("/download done, sending response...")
        res.status(200).json({
          "message": "success",
          "user_id": userid,
          "asset_name": assetname,
          "bucket_key": bucket_key,
          "data": data_str
        })
      }).catch((err) => {
        res.status(400).json({
          "message": err.message,
          "user_id": -1,
          "asset_name": "?",
          "bucket_key": "?",
          "data": []
        })
      });
    })
  }//try
  catch (err) {
    //
    // generally we end up here if we made a 
    // programming error, like undefined variable
    // or function:
    //
    res.status(400).json({
      "message": err.message,
      "user_id": -1,
      "asset_name": "?",
      "bucket_key": "?",
      "data": []
    });
  }//catch

}//get