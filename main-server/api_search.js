//
// app.get('/search?address=useraddress&date=userdate', async (req, res) => {...});
//
// Return the top three images on/nearest a given date, and nearest a given location (latitude, longitude).
//

const dbConnection = require('./database.js')

exports.get_photos = async (req, res) => {
    try {
        console.log("call to /search...");

        // Get query parameters address and date
        if(req.query.address && req.query.date){
            var address = req.query.address;
            var date = req.query.date;
            console.log(address);
            console.log(date);
        } else {
            res.status(200).json({
                "message": "enter a valid address and date",
            })
        }

        // date = '2008:10:22 16:28:39';
        // address = '2223 Tech Drive Evanston IL'

        var rds_response = new Promise((resolve, reject) => {
            console.log("/search: calling RDS...");
            var sql = `SELECT assetid, latitude, longitude, datecreated FROM metadata 
                       ORDER BY ABS(TIMEDIFF(datecreated, ?)) ASC
                       LIMIT 5;`;

            var params = [date];
      
            dbConnection.query(sql, params, (err, results, _) => {
              if (err) {
                reject(err);
                return;
              }
      
              console.log("metadata query done");
              resolve(results);
            });
          });
        
        var metadata = await rds_response;

        // Get latitude and longitude of address ex location[0]["latitude"]
        const NodeGeocoder = require('node-geocoder');
        const options = {
            provider: 'google',
            apiKey: 'AIzaSyAJpjQk8yrMCjOeNxZkNNVAfG0QwKjfPb4',
        };
        const geocoder = NodeGeocoder(options);
        const location = await geocoder.geocode(address);

        console.log(location);

        if(location.length == 0) {
            res.status(400).json({
                "message": "location not found, sorted by date",
                "data": metadata
            });
            return;
        }

        console.log(metadata);

        // sort by distance
        metadata.sort( function(a, b) {
            let a_distance = getDistanceFromLatLonInKm(a.latitude, a.longitude, location[0]["latitude"], location[0]["longitude"]);
            let b_distance = getDistanceFromLatLonInKm(b.latitude, b.longitude, location[0]["latitude"], location[0]["longitude"]);

            if (a_distance < b_distance) {
                return -1;
            } else {
                return 1;
            }
        });

        res.status(200).json({
            "message": "success",
            "data": metadata
        })

    }
    catch (err) {
        res.status(400).json({
            "message": err.message,
            "data": []
          });
    }
}

// distance calculation for latitudes and longitudes from
// https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    if(lat1 == "N/A" || lon1 == "N/A" || lat2 == "N/A" || lon2 == "N/A") {
        return Infinity; // if NA is present in geocoder data represent distance as infinity
    }
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }