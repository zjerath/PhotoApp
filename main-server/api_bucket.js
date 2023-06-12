//
// app.get('/bucket?startafter=bucketkey', async (req, res) => {...});
//
// Retrieves the contents of the S3 bucket and returns the 
// information about each asset to the client. Note that it
// returns 12 at a time, use startafter query parameter to pass
// the last bucketkey and get the next set of 12, and so on.
//
const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

exports.get_bucket = async (req, res) => {

  console.log("call to /bucket...");

  try {

    //
    // TODO: remember, 12 at a time...  Do not try to cache them here, instead 
    // request them 12 at a time from S3
    //
    // AWS:
    //   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/listobjectsv2command.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
    //
    var startAfterBucket;
    
    if(req.query.startafter){
      startAfterBucket =         req.query.startafter.toString()
    }
    var input = {
      Bucket: s3_bucket_name,
      MaxKeys: 12,
      StartAfter: startAfterBucket
    };

    var command = new ListObjectsV2Command(input);
    var s3_response = s3.send(command);

    s3_response.then(results => {
      var data = [];
      if (results.KeyCount != 0){
        data = results["Contents"];
      }
      res.status(200).json({
        "message": "success",
        data: data
      })
    }).catch((err) => {
        res.status(400).json({
          "message": err.message,
          "data": []
        })
      });
  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }//catch

}//get
