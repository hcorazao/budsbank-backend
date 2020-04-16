var Cryptr = require('cryptr');
var paginateInfo = require('paginate-info');
cryptr = new Cryptr(process.env.PASS_SECRET);
var helperFile = require('../helpers/helperFunctions.js');
var auth = require('./auth');
// import { calculateLimitAndOffset, paginate } from 'paginate-info';

exports.getNearbyDispensaries = function (req, res) {
    var userID = req.query.user_id || '';
    var longitude = req.query.longitude || '';
    var latitude = req.query.latitude || '';
    var limit = req.query.limit || process.env.LIMIT;
    var offset = req.query.offset || process.env.OFF_SET;
    var pageSize = req.query.page_size || process.env.PAGE_SIZE;
    var currentPage = req.query.current_page || process.env.CURRENT_PAGE;
    var showAll = req.query.show_all || '';
    // console.log(currentPage);
    // console.log(limit);
    if (!userID){
        output = {status: 400, isSuccess: false, message: "User ID required" };
        res.json(output);
        return;
    }
    if (!longitude){
        output = {status: 400, isSuccess: false, message: "longitude required" };
        res.json(output);
        return;
    }
    if (!latitude){
        output = {status: 400, isSuccess: false, message: "latitude required" };
        res.json(output);
        return;
    }
    SQL = `SELECT * FROM users WHERE id = ${userID}`;
    helperFile.executeQuery(SQL).then(checkUser => {
        if (!checkUser.isSuccess){
            output = {status: 400, isSuccess: false, message: checkUser.message };
            res.json(output);
        }else{
            if (checkUser.data.length > 0){
                exports.getAvailableDispensaries(userID, longitude, latitude, limit, offset, currentPage, pageSize, showAll).then(response =>{
                    if (!response.isSuccess){
                        output = {status: 400, isSuccess: false, message: response.message };
                        res.json(output);
                    } else{
                        output = {status: 200, isSuccess: true, message: "Success", dispensaries: response.dispensaries };
                        res.json(response);
                    }
                });
            }else{
                output = {status: 400, isSuccess: false, message: "Invalid User" };
                res.json(output);
            }
        }
    });
};

exports.getAvailableDispensaries = function(userID, longitude, latitude, limit, offset, currentPage, pageSize, showAll){
    return new Promise((resolve)=>{
        // SQL = `SELECT id, name, longitude, latitude, phone, address, image,
        //     created FROM dispensaries WHERE ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( latitude ) ) *
        //     cos( radians( longitude ) - radians(${longitude}) ) + sin( radians(${latitude}) ) *
        //     sin( radians( latitude ) ) ) ) < 5 AND id NOT IN (SELECT dispensary_id FROM user_disabled_dispensaries
        //     WHERE user_id = ${userID} AND status = 'true' AND expiry > CURRENT_TIMESTAMP) AND featured = 'false'
        //     ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;


        //'SELECT id, ( 3959  acos( cos( radians(' . $data['latitude'] . ') )  cos( radians( lat ) )  cos( radians( lng ) - radians(' . $data['longtitude'] . ') ) + sin( radians(' . $data['latitude'] .') )  sin( radians(lat) ) ) ) AS distance FROM locations HAVING distance < 20 ORDER BY distance'
        

        // SQL = `SELECT id, name, longitude, latitude, phone, address, image,
        //     created, ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( latitude ) ) *
        //     cos( radians( longitude ) - radians(${longitude}) ) + sin( radians(${latitude}) ) *
        //     sin( radians( latitude ) ) ) ) AS distance FROM dispensaries ORDER 
        //     BY distance`;


        if(showAll !== null && showAll !== ''){
            SQL = `SELECT id, name, longitude, latitude, phone, deal, address, image,
            created, ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( latitude ) ) *
            cos( radians( longitude ) - radians(${longitude}) ) + sin( radians(${latitude}) ) *
            sin( radians( latitude ) ) ) ) AS distance FROM dispensaries WHERE status = '1' ORDER BY distance`;
        }else{
            SQL = `SELECT id, name, longitude, latitude, phone, deal, address, image,
            created, ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( latitude ) ) *
            cos( radians( longitude ) - radians(${longitude}) ) + sin( radians(${latitude}) ) *
            sin( radians( latitude ) ) ) ) AS distance FROM dispensaries WHERE id NOT
            IN (SELECT dispensary_id FROM user_disabled_dispensaries WHERE user_id = ${userID} AND
            status = 'true' AND expiry > CURRENT_TIMESTAMP) AND status = '1' ORDER BY distance`;
        }



        helperFile.executeQuery(SQL).then(response => {
            if (!response.isSuccess){
                output = {status: 400, isSuccess: false, message: response.message};
                resolve(output);
            }else{
                if (response.data.length > 0){
                    helperFile.checkFollowedDispensaries(response.data, userID).then(responseForCHeck => {
                      console.log('hassan');
                      console.log(pageSize);
                      // console.log(currentPage);
                      if(currentPage !== null && currentPage !== '' && pageSize !== null && pageSize !== ''){
                        const { limit, offset } = paginateInfo.calculateLimitAndOffset(currentPage, pageSize);
                        const count = responseForCHeck.length;
                        const paginatedData = responseForCHeck.slice(offset, offset + limit);
                        var paginationInfo = paginateInfo.paginate(currentPage, count, paginatedData);
                        dispensariesData = paginatedData;
                      }else{
                        dispensariesData = responseForCHeck;
                        paginationInfo = [];
                      }

                        output = {status: 200, isSuccess: true, message: "Success", dispensaries: dispensariesData, pageInfo: paginationInfo};
                        resolve(output);
                    });
                }else{
                    output = {status: 200, isSuccess: true, message: "Success", dispensaries: response.data};
                    resolve(output);
                }
            }
        });
    });
};

exports.followDispensary = function (req, res) {
  var userID = req.body.user_id || '';
  var dispensaryID = req.body.dispensary_id || '';
  if (!userID){
      output = {status: 400, isSuccess: false, message: "User ID required" };
      res.json(output);
      return;
  }
    if (!dispensaryID){
        output = {status: 400, isSuccess: false, message: "Dispensary ID required" };
        res.json(output);
        return;
    }

    SQL = `SELECT * FROM users WHERE id = ${userID}`;
    helperFile.executeQuery(SQL).then(userCheckResponse => {
       if (!userCheckResponse.isSuccess){
           output = {status: 400, isSuccess: false, message: userCheckResponse.message};
           res.json(output);
       } else{
           if (userCheckResponse.data.length > 0){
               SQL = `SELECT * FROM dispensaries WHERE id = ${dispensaryID}`;
               helperFile.executeQuery(SQL).then(checkDispensaryResponse => {
                   if (!checkDispensaryResponse.isSuccess) {
                       output = {status: 400, isSuccess: false, message: checkDispensaryResponse.message};
                       res.json(output);
                   }else{
                       if (checkDispensaryResponse.data.length > 0){
                           SQL = `SELECT * FROM user_dispensaries WHERE user_id = ${userID} AND dispensary_id = ${dispensaryID}`;
                           helperFile.executeQuery(SQL).then(checkAlreadyFollowed => {
                               if (!checkAlreadyFollowed.isSuccess){
                                   output = { status: 400, isSuccess: false, message: checkAlreadyFollowed.message};
                                   res.json(output);
                               }else{
                                   if (checkAlreadyFollowed.data.length > 0){
                                       if (checkAlreadyFollowed.data[0].isFollowed === 'false'){
                                           SQL = `UPDATE user_dispensaries SET isFollowed = 'true' WHERE (user_id = ${userID} AND dispensary_id = ${dispensaryID})`;
                                           helperFile.executeQuery(SQL).then(responseForUpdate => {
                                               if (!responseForUpdate.isSuccess){
                                                   output = { status: 400, isSuccess: false, message: responseForUpdate.message };
                                                   res.json(output);
                                               }else{
                                                   helperFile.addNotificationSetting(userID, dispensaryID, 'true').then(responseFinal => {
                                                       if (!responseFinal.isSuccess){
                                                           output = { status: 400, isSuccess: false, message: responseFinal.message };
                                                           res.json(output);
                                                       }else{
                                                           output = { status: 200, isSuccess: true, message: "Dispensary followed successfully" };
                                                           res.json(output);
                                                       }
                                                   });
                                               }
                                           })
                                       }else{
                                           output = { status: 400, isSuccess: false, message: "Dispensary already followed"};
                                           res.json(output);
                                       }
                                   }else{
                                       SQL = `INSERT INTO user_dispensaries SET user_id = ${userID}, dispensary_id = ${dispensaryID}`;
                                       helperFile.executeQuery(SQL).then(response => {
                                           if (!response.isSuccess){
                                               output = { status: 400, isSuccess: false, message: response.message}
                                               res.json(output);
                                           } else{
                                               helperFile.addNotificationSetting(userID, dispensaryID, 'true').then(responseFinal => {
                                                   if (!responseFinal.isSuccess){
                                                       output = { status: 400, isSuccess: false, message: responseFinal.message };
                                                       res.json(output);
                                                   }else{
                                                       output = { status: 200, isSuccess: true, message: "Dispensary followed successfully" };
                                                       res.json(output);
                                                   }
                                               });
                                           }
                                       });
                                   }
                               }
                           })
                       }else{
                           output = { status: 400, isSuccess: false, message: "Dispensary doesn't exists"}
                           res.json(output);
                       }
                   }
               });
           }else{
               output = { status: 400, isSuccess: false, message: "User doesn't exists"}
               res.json(output);
           }
       }
    });
};

exports.unFollowDispensary = function (req, res) {
    var userID = req.body.user_id || '';
    var dispensaryID = req.body.dispensary_id || '';
    if (!userID){
        output = {status: 400, isSuccess: false, message: "User ID required" };
        res.json(output);
        return;
    }
    if (!dispensaryID){
        output = {status: 400, isSuccess: false, message: "Dispensary ID required" };
        res.json(output);
        return;
    }

    SQL = `SELECT * FROM users WHERE id = ${userID}`;
    helperFile.executeQuery(SQL).then(userCheckResponse => {
        if (!userCheckResponse.isSuccess){
            output = {status: 400, isSuccess: false, message: userCheckResponse.message};
            res.json(output);
        } else{
            if (userCheckResponse.data.length > 0){
                SQL = `SELECT * FROM dispensaries WHERE id = ${dispensaryID}`;
                helperFile.executeQuery(SQL).then(checkDispensaryResponse => {
                    if (!checkDispensaryResponse.isSuccess) {
                        output = {status: 400, isSuccess: false, message: checkDispensaryResponse.message};
                        res.json(output);
                    }else{
                        if (checkDispensaryResponse.data.length > 0){
                            SQL = `SELECT * FROM user_dispensaries WHERE (user_id = ${userID} AND dispensary_id = ${dispensaryID})`;
                            helperFile.executeQuery(SQL).then(checkAlreadyFollowed => {
                                if (!checkAlreadyFollowed.isSuccess){
                                    output = { status: 400, isSuccess: false, message: checkAlreadyFollowed.message}
                                    res.json(output);
                                }else{
                                    if (checkAlreadyFollowed.data.length > 0){
                                        SQL = `UPDATE user_dispensaries SET isFollowed = 'false' WHERE (user_id = ${userID} AND dispensary_id = ${dispensaryID})`;
                                        helperFile.executeQuery(SQL).then(response => {
                                            if (!response.isSuccess){
                                                output = { status: 400, isSuccess: false, message: response.message}
                                                res.json(output);
                                            } else{
                                                helperFile.addNotificationSetting(userID, dispensaryID, 'false').then(responseFinal => {
                                                    if (!responseFinal.isSuccess){
                                                        output = { status: 400, isSuccess: false, message: responseFinal.message };
                                                        res.json(output);
                                                    }else{
                                                        output = { status: 200, isSuccess: true, message: "Dispensary un-followed successfully"}
                                                        res.json(output);
                                                    }
                                                });
                                            }
                                        });
                                    }else{
                                        output = { status: 400, isSuccess: false, message: "Current user doesn't follow this dispensary"}
                                        res.json(output);
                                    }
                                }
                            })
                        }else{
                            output = { status: 400, isSuccess: false, message: "Dispensary doesn't exists"}
                            res.json(output);
                        }
                    }
                });
            }else{
                output = { status: 400, isSuccess: false, message: "User doesn't exists"}
                res.json(output);
            }
        }
    });
};

exports.getDispensaryByID = function (req, res) {
    var dispensaryID    = req.query.dispensary_id || '';
    var userID          = req.query.user_id || '';
    if (!dispensaryID){
        output = {status: 400, isSuccess: false, message: "Dispensary ID required "};
        res.json(output);
        return;
    }
    if (!userID){
        output = {status: 400, isSuccess: false, message: "User ID required "};
        res.json(output);
        return;
    }
    SQL = `SELECT * FROM users WHERE id = ${userID}`;
    helperFile.executeQuery(SQL).then(userCheck => {
       if (!userCheck.isSuccess){
           output = {status: 400, isSuccess: false, message: userCheck.message};
           res.json(output);
       } else{
           if (userCheck.data.length > 0){
               SQL = `SELECT id, name, longitude, latitude, phone, deal, address, image, opening_time, closing_time,
            created FROM dispensaries WHERE id = ${dispensaryID} AND status = '1'`;
               helperFile.executeQuery(SQL).then(response => {
                   if (!response.isSuccess){
                       output = {status: 400, isSuccess: false, message: response.message};
                       res.json(output);
                   } else{
                       if (response.data.length > 0){
                           helperFile.checkFollowedDispensaries(response.data, userID).then(responseForThis => {
                               output = {status: 200, isSuccess: true, message: "Success", dispensary: responseForThis[0]};
                               res.json(output);
                           });

                           // helperFile.checkFollowedDispensariesForSingleDispensary(response.data, userID).then(responseForThis => {
                           //     output = {status: 200, isSuccess: true, message: "Success", dispensary: responseForThis};
                           //     res.json(output);
                           // });

                       }else{
                           output = {status: 400, isSuccess: false, message: "Invalid dispensary"};
                           res.json(output);
                       }
                   }
               });
           }else{
               output = {status: 400, isSuccess: false, message: "Invalid user"};
               res.json(output);
           }
       }
    });
};

exports.getCompletedDispensaries = function (userID, limit, offset, currentPage, pageSize) {

  return new Promise((resolve)=>{
     // SQL = `SELECT d.id, d.name, d.longitude, d.latitude, d.phone, d.address, d.image, d.image,
     //        d.created FROM dispensaries AS d INNER JOIN user_disabled_dispensaries as udd ON udd.dispensary_id = d.id
     //        WHERE udd.user_id = ${userID} AND udd.expiry > CURRENT_TIMESTAMP ORDER BY udd.created DESC LIMIT ${limit} OFFSET ${offset}`;
    SQL = `SELECT d.id, d.name, d.longitude, d.latitude, d.phone, d.deal, d.address, d.image, d.image,
    d.created FROM dispensaries AS d INNER JOIN user_disabled_dispensaries as udd ON udd.dispensary_id = d.id
    WHERE udd.user_id = ${userID} AND udd.expiry > CURRENT_TIMESTAMP ORDER BY udd.created DESC`;
    // console.log('dfdfdfdf');
     helperFile.executeQuery(SQL).then(response=>{ //console.log(response)
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            resolve(output);
        }else{
             console.log(pageSize);
            console.log(currentPage);
            if(currentPage !== null && currentPage !== '' && pageSize !== null && pageSize !== ''){
              const { limit, offset } = paginateInfo.calculateLimitAndOffset(currentPage, pageSize);
              const count = response.data.length;
              // console.log()
              const paginatedData = response.data.slice(offset, offset + limit);
              var paginationInfo = paginateInfo.paginate(currentPage, count, paginatedData);
              dispensariesData = paginatedData;
            }else{
              dispensariesData = response;
              paginationInfo = [];
            }
            output = {status: 200, isSuccess: true, message: "Success", completed_dispensaries: dispensariesData, pageInfo: paginationInfo};
            resolve(output);
        }
     });
  });
};

exports.getCompletedDispensariesByUserID = function (req, res) {
    var userID = req.query.user_id || '';
    var limit = req.query.limit || process.env.LIMIT;
    var offset = req.query.offset || process.env.OFF_SET;
    var pageSize = req.query.page_size || process.env.PAGE_SIZE;
    var currentPage = req.query.current_page || process.env.CURRENT_PAGE;

    if (!userID){
        output = {status: 400, isSuccess: false, message: "User ID required"};
        res.json(output);
        return;
    }
    SQL = `SELECT * FROM users WHERE id = ${userID}`;
    helperFile.executeQuery(SQL).then(userCheck => {
        if (!userCheck.isSuccess){
            output = {status: 400, isSuccess: false, message: userCheck.message};
            res.json(output);
        }else{
            if (userCheck.data.length > 0){
                exports.getCompletedDispensaries(userID, limit, offset, currentPage, pageSize).then(response=>{
                  // console.log('dfdf');
                    res.json(response);
                });
            }else{
                output = {status: 400, isSuccess: false, message: "Invalid User"};
                res.json(output);
            }
        }
    });
};

exports.searchDispensary = function (req, res) {
  var keyword = req.query.keyword || ''; console.log(req.query)
  var userID = req.query.user_id || '';
  var limit = req.query.limit || process.env.LIMIT;
  var offset = req.query.offset || process.env.OFF_SET;
  var pageSize = req.query.page_size || process.env.PAGE_SIZE;
  var currentPage = req.query.current_page || process.env.CURRENT_PAGE;

    if (!userID){
        output = {status: 400, isSuccess: false, message: "User ID required"};
        res.json(output);
        return;
    }
    if (!keyword){
        output = {status: 400, isSuccess: false, message: "keyword required"};
        res.json(output);
        return;
    }
    SQL = `SELECT * FROM users WHERE id = ${userID}`;
    helperFile.executeQuery(SQL).then(userCheck => {
       if (!userCheck.isSuccess){
           output = {status: 400, isSuccess: false, message: userCheck.message};
           res.json(output);
       } else{
           if (userCheck.data.length > 0){
            //    SQL = `SELECT id, name, longitude, latitude, phone, address, image, opening_time, closing_time,
            // created FROM dispensaries WHERE name LIKE '%${keyword}%' AND id NOT IN (SELECT dispensary_id FROM user_disabled_dispensaries
            // WHERE user_id = ${userID} AND status = 'true' AND expiry > CURRENT_TIMESTAMP) AND featured = 'false'
            // ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;

            //  SQL = `SELECT id, name, longitude, latitude, phone, address, image, opening_time, closing_time,
            // created FROM dispensaries WHERE name LIKE '%${keyword}%' AND id NOT IN (SELECT dispensary_id FROM user_disabled_dispensaries
            // WHERE user_id = ${userID} AND status = 'true' AND expiry > CURRENT_TIMESTAMP)
            // ORDER BY id DESC`;

            SQL = `SELECT id, name, longitude, latitude, phone, address, deal, image, opening_time, closing_time,
            created FROM dispensaries WHERE name LIKE '%${keyword}%' AND status = '1' ORDER BY id DESC`;

               helperFile.executeQuery(SQL).then(response => {
                   if (!response.isSuccess){
                       output = {status: 400, isSuccess: false, message: response.message};
                       res.json(output);
                   }else{
                       if (response.data.length > 0){
                           helperFile.checkFollowedDispensaries(response.data, userID).then(responseForCHeck => {


                              if(currentPage !== null && currentPage !== '' && pageSize !== null && pageSize !== ''){
                                  const { limit, offset } = paginateInfo.calculateLimitAndOffset(currentPage, pageSize);
                                  const count = responseForCHeck.length;
                                  // console.log()
                                  const paginatedData = responseForCHeck.slice(offset, offset + limit);
                                  var paginationInfo = paginateInfo.paginate(currentPage, count, paginatedData);
                                  searchData = paginatedData;
                                }else{
                                  searchData = responseForCHeck;
                                  paginationInfo = [];
                              }
                               output = {status: 200, isSuccess: true, message: "Success", dispensaries: searchData, pageInfo: paginationInfo};
                               res.json(output);
                           });
                       }else{
                           output = {status: 200, isSuccess: true, message: "Success", dispensaries: response.data};
                           res.json(output);
                       }
                   }
               });
           }else{
               output = {status: 400, isSuccess: false, message: "Invalid User"};
               res.json(output);
           }
       }
    });
};

exports.featuredDispensariesList = function (req, res) {
    var userID = req.query.user_id || '';
    var longitude = req.query.longitude || '';
    var latitude = req.query.latitude || '';
    var limit = req.query.limit || process.env.LIMIT;
    var offset = req.query.offset || process.env.OFF_SET;

    if (!userID){
        output = {status: 400, isSuccess: false, message: "User ID required"};
        res.json(output);
        return;
    }
    if (!longitude){
        output = {status: 400, isSuccess: false, message: "Longitude required"};
        res.json(output);
        return;
    }
    if (!latitude){
        output = {status: 400, isSuccess: false, message: "Latitude required"};
        res.json(output);
        return;
    }
    SQL = `SELECT * FROM users WHERE id = ${userID}`;
    helperFile.executeQuery(SQL).then(checkUser => {
       if (!checkUser.isSuccess){
           output = {status: 400, isSuccess: false, message: checkUser.message};
           res.json(output);
       } else{
           if (checkUser.data.length > 0){
            //    SQL = `SELECT id, name, longitude, latitude, phone, address, image,
            // created FROM dispensaries WHERE ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( latitude ) ) *
            // cos( radians( longitude ) - radians(${longitude}) ) + sin( radians(${latitude}) ) *
            // sin( radians( latitude ) ) ) ) < 5 AND featured = 'true' AND id NOT IN (SELECT dispensary_id FROM user_disabled_dispensaries
            // WHERE user_id = ${userID} AND status = 'true' AND expiry > CURRENT_TIMESTAMP)
            // ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;

            SQL = `SELECT id, name, longitude, deal , latitude, phone, address, image,
            created, ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( latitude ) ) *
            cos( radians( longitude ) - radians(${longitude}) ) + sin( radians(${latitude}) ) *
            sin( radians( latitude ) ) ) ) AS distance FROM dispensaries WHERE featured = 'true' AND status = '1' ORDER BY distance`;

               helperFile.executeQuery(SQL).then(response => {
                   if (!response.isSuccess){
                       output = {status: 400, isSuccess: false, message: response.message};
                       res.json(output);
                   }else{
                       if (response.data.length > 0){
                           helperFile.checkFollowedDispensaries(response.data, userID).then(responseForCHeck => {
                               output = {status: 200, isSuccess: true, message: "Success", dispensaries: responseForCHeck};
                               res.json(output);
                           });
                       }else{
                           output = {status: 200, isSuccess: true, message: "Success", dispensaries: response.data};
                           res.json(output);
                       }
                   }
               });
           }else{
               output = {status: 400, isSuccess: false, message: "Invalid User"};
               res.json(output);
           }
       }
    });
}

exports.userFollowedDispensaries = function (req, res) {
    var userID =  req.query.user_id || '';
    var offset = req.query.offset || process.env.OFF_SET;
    var limit = req.query.limit || process.env.LIMIT;

    if (!userID){
        output = {status: 400, isSuccess: false, message: "User ID required"};
        res.json(output);
    }
    SQL = `SELECT * FROM users WHERE id = ${userID}`;
    helperFile.executeQuery(SQL).then(userCheck => {
       if (!userCheck.isSuccess){
           output = {status: 400, isSuccess: false, message: userCheck.message};
           res.json(output);
       } else{
           if (userCheck.data.length > 0){
               SQL = `SELECT d.id, d.name,d.deal, d.longitude, d.latitude, d.phone, d.address, d.image,
            d.created FROM dispensaries AS d INNER JOIN user_dispensaries AS ufd ON d.id = ufd.dispensary_id
            WHERE ufd.user_id = ${userID} ORDER BY ufd.id DESC LIMIT ${limit} OFFSET ${offset}`;
               helperFile.executeQuery(SQL).then(response => {
                   if (!response.isSuccess){
                       output = {status: 400, isSuccess: false, message: response.message};
                       res.json(output);
                   } else{
                       output = {status: 200, isSuccess: true, message: "Success", dispensaries: response.data};
                       res.json(output);
                   }
               });
           }else{
               output = {status: 400, isSuccess: false, message: "Invalid User"};
               res.json(output);
           }
       }
    });
};

exports.getDispensaryTimmings = function(dispensaryID){
  return new Promise((resolve)=>{
    SQL = `SELECT * FROM dispensary_timmings WHERE dispensary_id = ${dispensaryID}`;
    helperFile.executeQuery(SQL).then(responseForTime => {
      if (!responseForTime.isSuccess) {
        output = {status:400, isSuccess: false, message: responseForTime.message}
        resolve(output);
      }else{
        var time = {
          'open_day' : responseForTime.data[0].open_day,
          'close_day': responseForTime.data[0].close_day,
          'open_time': responseForTime.data[0].open_time,
          'close_time': responseForTime.data[0].close_time
        }
        // var time = responseForTime.data[0].open_day+'-'+responseForTime.data[0].close_day+' '+responseForTime.data[0].open_time+'-'+responseForTime.data[0].close_time;
        output = {status:200, isSuccess: true, message: "Success", timming: time}
        resolve(output);
      }
    })
  });
};
