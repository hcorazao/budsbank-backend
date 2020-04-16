var helperFile = require('../helpers/helperFunctions.js');
var auth = require('./auth');
var dispensaries = require('./dispansaries');
const fs = require('fs');
var async = require('async');
var SquareConnect = require('square-connect');
const crypto = require('crypto');
var Cryptr = require('cryptr');
cryptr = new Cryptr(process.env.PASS_SECRET);

exports.login = function(req, res) {
    var email = req.body.email || '';
    var password = req.body.password || '';

    if(!email){
        output = {status: 400, isSuccess: false, message: "Email required"};
        res.json(output);
        return;
    }

    if(!password){
        output = {status: 400, isSuccess: false, message: "Password required"};
        res.json(output);
        return;
    }

    var SQL = `SELECT * FROM admin WHERE email = '${email}'`;
    
    helperFile.executeQuery(SQL).then(loginResponse => {
        if (!loginResponse.isSuccess){
            output = {status: 400, isSuccess: false, message: loginResponse.message};
            res.json(output);
        }else{
            if (loginResponse.data.length > 0  && (password === cryptr.decrypt(loginResponse.data[0].password))){
                output = {status: 200, isSuccess: true, message: "Success", data: loginResponse.data};
                res.json(output);
            }else{
                output = {status: 400, isSuccess: false, message: "Invalid Email or Password"};
                res.json(output);
            }
        }
    });
};

exports.getActiveUsers = function(req, res){
    const OFFSET = req.query.page || process.env.OFF_SET;
    const LIMIT = req.query.size || process.env.LIMIT;
    var SQL = `SELECT id, status, username, email, first_name, last_name, phone, email_verified_at, image, created FROM users WHERE status = 1 ORDER BY id DESC LIMIT ${LIMIT} OFFSET ${OFFSET}`;
    helperFile.executeQuery(SQL).then(response => {
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{ 
            if (response.data.length > 0){ 
                output = {status: 200, isSuccess: true, message: "Success", data: response.data};
                res.json(output);
            }else{
                output = {status: 400, isSuccess: false, message: "No active users found"};
                res.json(output);
            }
        }
    });
}

exports.getUserById = function(req, res){
    var userId = req.params.id || '';
    if (!userId){
        output = {status: 400, isSuccess: false, message: "User ID required"};
        res.json(output);
    }

    var SQL = `SELECT * FROM users WHERE id = ${userId}`;
    helperFile.executeQuery(SQL).then(response => {
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            if (response.data.length > 0){
                delete response.data[0].password;
                delete response.data[0].longitude;
                delete response.data[0].latitude; 
                
                output = {status: 200, isSuccess: true, message: "Success", data: response.data};
                res.json(output);
            }else{
                output = {status: 400, isSuccess: false, message: "User does not exists"};
                res.json(output);
            }
        }
    })
}

exports.updateUser = function(req, res) { 
    auth.updateUserProfile(req).then(response => {
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
            return;
        } else{
            delete response.data[0]["password"];
            output = {status: 200, isSuccess: true, message: "User Updated Successfully", user: response.data[0]};
            res.json(output);
        }
    });
};

exports.markUserDisabled = function(req, res){
    const userId = req.body.userId || '';
    if (!userId){
        output = {status: 400, isSuccess: false, message: "User ID required"};
        res.json(output);
        return;
    }else{
        var SQL = `SELECT * FROM users WHERE id = ${userId}`;
        helperFile.executeQuery(SQL).then(responseUserCheck => {
            if (!responseUserCheck.isSuccess){
                output = {status: 400, isSuccess: false, message: responseUserCheck.message};
                res.json(output);
            }else{
                if (responseUserCheck.data.length > 0){
                    var SQL =  `UPDATE users SET status = 0 WHERE id = ${userId}`;
                    helperFile.executeQuery(SQL).then(response => {
                        if (!response.isSuccess){
                            output = {status: 400, isSuccess: false, message: response.message};
                            res.json(output);
                        }else{
                            output = {status: 200, isSuccess: true, message: "Success"};
                            res.json(output);
                        }
                    })
                }else{
                    output = {status: 400, isSuccess: false, message: "Invalid User ID"};
                    res.json(output);
                }
            }
        });
    }
};

exports.getDisabledUsers = function(req, res){
    const OFFSET = req.query.page || process.env.OFF_SET;
    const LIMIT = req.query.size || process.env.LIMIT;
    var SQL =  `SELECT * FROM users WHERE status = 0 ORDER BY id DESC LIMIT ${LIMIT} OFFSET ${OFFSET}`;
    helperFile.executeQuery(SQL).then(response => {
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            if(response.data.length > 0){
                output = {status: 200, isSuccess: true, message: "Success", data: response.data};
                res.json(output);
            }else{
                output = {status: 400, isSuccess: false, message: "No Disabled Users Available"};
                res.json(output);
            }
        }
    })
}

exports.activateUser = function(req, res){
    const userId = req.body.userId || '';
    if (!userId){
        output = {status: 400, isSuccess: false, message: "User ID required"};
        res.json(output);
        return;
    }else{
        var SQL = `SELECT * FROM users WHERE id = ${userId}`;
        helperFile.executeQuery(SQL).then(responseUserCheck => {
            if (!responseUserCheck.isSuccess){
                output = {status: 400, isSuccess: false, message: responseUserCheck.message};
                res.json(output);
            }else{
                if (responseUserCheck.data.length > 0){
                    var SQL =  `UPDATE users SET status = 1 WHERE id = ${userId}`;
                    helperFile.executeQuery(SQL).then(response => {
                        if (!response.isSuccess){
                            output = {status: 400, isSuccess: false, message: response.message};
                            res.json(output);
                        }else{
                            output = {status: 200, isSuccess: true, message: "Success"};
                            res.json(output);
                        }
                    })
                }else{
                    output = {status: 400, isSuccess: false, message: "Invalid User ID"};
                    res.json(output);
                }
            }
        });
    }
}

exports.addDispensary = function(req, res){
    console.log(req.body.formatted_address);
    const user_id = req.body.user_id || '';
    const featured = req.body.featured || '';
    const name = req.body.name || '';
    const longitude = req.body.longitude || '';
    const latitude = req.body.latitude || '';
    const phone = req.body.phone || '';
    const address = req.body.formatted_address || '';
    const opening_time = req.body.opening_time || '';
    const closing_time = req.body.closing_time || '';
    const open_day = req.body.open_day || '';
    const close_day = req.body.close_day || '';
    const deal = req.body.deal || '';
    const subscription_type = 'free';

    if (!user_id){
        output = {status: 400, isSuccess: false, message: "User ID required"};
        res.json(output);
        return;
    }
    if (!name){
        output = {status: 400, isSuccess: false, message: "Title required"};
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
    if (!phone){
        output = {status: 400, isSuccess: false, message: "Phonerequired"};
        res.json(output);
        return;
    }
    if (!address){
        output = {status: 400, isSuccess: false, message: "Address required"};
        res.json(output);
        return;
    }
    if (!opening_time){
        output = {status: 400, isSuccess: false, message: "Opening Time required"};
        res.json(output);
        return;
    }
    if (!closing_time){
        output = {status: 400, isSuccess: false, message: "Closing Time required"};
        res.json(output);
        return;
    }
    if (!open_day){
        output = {status: 400, isSuccess: false, message: "Opening Day required"};
        res.json(output);
        return;
    }
    if (!close_day){
        output = {status: 400, isSuccess: false, message: "Closing Day required"};
        res.json(output);
        return;
    }

    SQL = `SELECT * FROM admin WHERE id = ${user_id}`;
    helperFile.executeQuery(SQL).then(responseUser => {
        if (!responseUser.isSuccess){
            output = {status: 400, isSuccess: false, message: responseUser.message};
            res.json(output);
        }else{
            if (responseUser.data.length > 0){
                SQL = `SELECT * FROM dispensaries WHERE user_id = ${user_id}`;
                helperFile.executeQuery(SQL).then(responseDispensary => { console.log(responseDispensary)
                    if (!responseDispensary.isSuccess){
                        output = {status: 400, isSuccess: false, message: responseDispensary.message};
                        res.json(output);
                    }
                    // else if(responseDispensary.data.lenght > 0){ console.log(responseDispensary.data.length);
                        // if (responseDispensary.data.lenght > 0){ console.log("Inside if")
                        //     output = {status: 400, isSuccess: false, message: "Dispensary Add Limit Full"};
                        //     res.json(output);
                        //     return;
                        // }
                        else{
                            if (helperFile.checkValidPhone(phone)){
                                helperFile.checkDispensaryPhone(phone).then(responsePhoneExists => {
                                    if (!responsePhoneExists.isSuccess){
                                        output = {status: 400, isSuccess: false, message: responsePhoneExists.message};
                                        res.json(output);
                                    }else{
                                        if (!responsePhoneExists.data){
                                            helperFile.checkDispensaryName(name).then(responseDispensaryNameValidation => {
                                                if (!responseDispensaryNameValidation.isSuccess){
                                                    output = {status: 400, isSuccess: false, message: responseDispensaryNameValidation.message};
                                                    res.json(output);
                                                }else{
                                                    if (!responseDispensaryNameValidation.data){
                                                        SQL = `INSERT INTO dispensaries SET user_id = ${user_id}, featured = '${featured}', name = '${name}', longitude = ${longitude},
                                                        latitude = ${latitude}, phone = '${phone}', address = '${address}', deal = '${deal}', subscription_type = '${subscription_type}'`;
                                                        helperFile.executeQuery(SQL).then(response => {
                                                            if (!response.isSuccess) {
                                                                output = {status: 400, isSuccess: false, message: response.message};
                                                                res.json(output);
                                                            }else{ 
                                                                SQL = `SELECT id FROM dispensaries WHERE phone = '${phone}' AND name = '${name}'`;
                                                                helperFile.executeQuery(SQL).then(responseForDispensaryID => {
                                                                    if (!responseForDispensaryID.isSuccess){
                                                                        output = {status: 400, isSuccess: false, message: responseForDispensaryID.message};
                                                                        res.json(output);
                                                                    }else{ 
                                                                        SQL = `INSERT INTO dispensary_timmings (dispensary_id, open_day, close_day, open_time, close_time) VALUES 
                                                                            (${responseForDispensaryID.data[0].id}, '${open_day}', '${close_day}', '${opening_time}', '${closing_time}') `;
                                                                        
                                                                        helperFile.executeQuery(SQL).then(responseForInsertingTimings => {
                                                                            const dispensary_code = crypto.randomBytes(4).toString('hex');
                                                                            if (!responseForInsertingTimings.isSuccess){
                                                                                output = {status: 400, isSuccess: false, message: responseForInsertingTimings.message};
                                                                                res.json(output);

                                                                            }else{

                                                                                SQL = `INSERT INTO dispensary_codes (dispensary_id, code) VALUES (${responseForDispensaryID.data[0].id}, '${dispensary_code}') `;
                                                                                
                                                                                helperFile.executeQuery(SQL).then(responseForInsertingDCode => {
                                                                                    const dispensary_code = crypto.randomBytes(4).toString('hex');
                                                                                    if (!responseForInsertingDCode.isSuccess){
                                                                                        SQL = `INSERT INTO dispensary_codes (dispensary_id, code) VALUES (${responseForDispensaryID.data[0].id}, '${dispensary_code}') `;
                                                                                        output = {status: 400, isSuccess: false, message: responseForInsertingDCode.message};
                                                                                        res.json(output);
                                                                                    }else{
                                                                                        output = {status: 200, isSuccess: true, message: "Success", data: {'dispensaryId': responseForDispensaryID.data[0].id}};
                                                                                        res.json(output);
                                                                                    }
                                                                                })
                                                                                // output = {status: 200, isSuccess: true, message: "Success", data: {'dispensaryId': responseForDispensaryID.data[0].id}};
                                                                                // res.json(output);
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }else{
                                                        output = {status: 400, isSuccess: false, message: "Title already exists"};
                                                        res.json(output);
                                                    }
                                                }
                                            })
                                        }else{
                                            output = {status: 400, isSuccess: false, message: "Phone Number already exists"};
                                            res.json(output);
                                        }
                                    }
                                })
                            }else{
                                output = {status: 400, isSuccess: false, message: "Invalid Phone Number"};
                                res.json(output);
                            }
                        }
                    // }else{
                    //     output = {status: 400, isSuccess: false, message: "Dispensary Add Limit Full"};
                    //     res.json(output);
                    // }
                });
            }else{
                output = {status: 400, isSuccess: false, message: "Invalid User ID"};
                res.json(output);
                return;
            }
        }
    })

    
}

exports.updateDispensary = function(req, res){
    const featured = req.body.featured || '';
    const name = req.body.name || '';
    const longitude = req.body.longitude || '';
    const latitude = req.body.latitude || '';
    const phone = req.body.phone || '';
    const address = req.body.formatted_address || '';
    const opening_time = req.body.open_time || '';
    const closing_time = req.body.close_time || '';
    const open_day = req.body.open_day || '';
    const close_day = req.body.close_day || '';
    const dispensaryId = req.body.dispensary_id;
    const deal = req.body.deal || '';
    const subscription_type = 'free';

    if (!name){
        output = {status: 400, isSuccess: false, message: "Title required"};
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
    if (!phone){
        output = {status: 400, isSuccess: false, message: "Phonerequired"};
        res.json(output);
        return;
    }
    if (!address){
        output = {status: 400, isSuccess: false, message: "Address required"};
        res.json(output);
        return;
    }
    if (!opening_time){
        output = {status: 400, isSuccess: false, message: "Opening Time required"};
        res.json(output);
        return;
    }
    if (!closing_time){
        output = {status: 400, isSuccess: false, message: "Closing Time required"};
        res.json(output);
        return;
    }
    if (!open_day){
        output = {status: 400, isSuccess: false, message: "Opening Day required"};
        res.json(output);
        return;
    }
    if (!close_day){
        output = {status: 400, isSuccess: false, message: "Closing Day required"};
        res.json(output);
        return;
    }
    if (!dispensaryId){
        output = {status: 400, isSuccess: false, message: "Dispensary ID required"};
        res.json(output);
        return;
    }

    if (helperFile.checkValidPhone(phone)){
        helperFile.checkDispensaryPhone(phone, dispensaryId).then(responsePhoneExists => {
            if (!responsePhoneExists.isSuccess){
                output = {status: 400, isSuccess: false, message: responsePhoneExists.message};
                res.json(output);
            }else{
                if (!responsePhoneExists.data){
                    helperFile.checkDispensaryName(name, dispensaryId).then(responseDispensaryNameValidation => {
                        if (!responseDispensaryNameValidation.isSuccess){
                            output = {status: 400, isSuccess: false, message: responseDispensaryNameValidation.message};
                            res.json(output);
                        }else{
                            if (!responseDispensaryNameValidation.data){
                                SQL = `UPDATE dispensaries SET featured = '${featured}', name = '${name}', longitude = ${longitude},
                                latitude = ${latitude}, phone = '${phone}', address = '${address}', deal = '${deal}', subscription_type = '${subscription_type}' WHERE id = ${dispensaryId}`;
                                helperFile.executeQuery(SQL).then(response => {
                                    if (!response.isSuccess) {
                                        output = {status: 400, isSuccess: false, message: response.message};
                                        res.json(output);
                                    }else{ 
                                        SQL = `UPDATE dispensary_timmings SET open_day = '${open_day}', close_day = '${close_day}', open_time = '${opening_time}',
                                         close_time = '${closing_time}' WHERE dispensary_id = ${dispensaryId}`;
                                                         
                                        helperFile.executeQuery(SQL).then(responseForInsertingTimings => {
                                            if (!responseForInsertingTimings.isSuccess){
                                                output = {status: 400, isSuccess: false, message: responseForInsertingTimings.message};
                                                res.json(output);
                                            }else{
                                                output = {status: 200, isSuccess: true, message: "Success", data: {'dispensaryId': dispensaryId}};
                                                res.json(output);
                                            }
                                        })
                                    }
                                })
                            }else{
                                output = {status: 400, isSuccess: false, message: "Title already exists"};
                                res.json(output);
                            }
                        }
                    })
                }else{
                    output = {status: 400, isSuccess: false, message: "Phone Number already exists"};
                    res.json(output);
                }
            }
        })
    }else{
        output = {status: 400, isSuccess: false, message: "Invalid Phone Number"};
        res.json(output);
    }
}

exports.addImageToDispensary = function(req, imageName){
    return new Promise((resolve) => {
        const dispensaryId = req.body.dispensaryId || '';
    
        if (!dispensaryId){
            output = {status: 400, isSuccess: false, message: "Dispensary ID required"};
            resolve(output);
        }
    
        if (!imageName){
            output = {status: 400, isSuccess: false, message: "Image Name required"};
            resolve(output);
        }
        
        SQL = `SELECT * FROM dispensaries WHERE id = ${dispensaryId}`;
        helperFile.executeQuery(SQL).then(checkResponse => { 
            if (!checkResponse.isSuccess){
                resolve(checkResponse);
            }else{
                if (checkResponse.data){ 
                    SQL = `UPDATE dispensaries SET image = '${process.env.BASE_URL}/images/${imageName}' WHERE id = ${dispensaryId}`; 
                    helperFile.executeQuery(SQL).then(response => { 
                        resolve(response)
                    })
                }else{
                    resolve(checkResponse);
                }
            }
        })
    })
}

exports.addImageToUser = function(req, imageName){
    return new Promise((resolve) => {
        const userId = req.body.userId || '';
    
        if (!userId){
            output = {status: 400, isSuccess: false, message: "User ID required"};
            resolve(output);
        }
    
        if (!imageName){
            output = {status: 400, isSuccess: false, message: "Image Name required"};
            resolve(output);
        }
        console.log("User id :", userId)
        SQL = `SELECT * FROM users WHERE id = ${userId}`;
        helperFile.executeQuery(SQL).then(checkResponse => { 
            if (!checkResponse.isSuccess){
                resolve(checkResponse);
            }else{
                if (checkResponse.data){ 
                    SQL = `UPDATE users SET image = '${process.env.BASE_URL}/images/${imageName}' WHERE id = ${userId}`; 
                    helperFile.executeQuery(SQL).then(response => { 
                        resolve(response)
                    })
                }else{
                    resolve(checkResponse);
                }
            }
        })
    })
}

exports.activeDispensaries = function (req, res){
    const OFFSET = req.query.page || process.env.OFF_SET; 
    const LIMIT = req.query.size || process.env.LIMIT; 
    const userID = req.query.userID;
    console.log(req.query.userID);
    console.log(req.query.userID);
    if(userID === 1 || userID === '1'){
        console.log('admin here active');
        SQL = `SELECT d.*, dc.code FROM dispensaries as d JOIN dispensary_codes as dc ON dc.dispensary_id = d.id WHERE d.status = 1 ORDER BY id DESC LIMIT ${LIMIT} OFFSET ${OFFSET} `;
    }else{
        SQL = `SELECT d.*, dc.code FROM dispensaries as d JOIN dispensary_codes as dc ON dc.dispensary_id = d.id WHERE d.status = 1 AND user_id = ${userID} ORDER BY id DESC LIMIT ${LIMIT} OFFSET ${OFFSET} `;
    }
    helperFile.executeQuery(SQL).then(response=>{
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            if (response.data.length > 0){
                output = {status: 200, isSuccess: true, message: "Success", data: response.data};
                res.json(output);
            }else{
                output = {status: 400, isSuccess: false, message: "No Active Dispensaries Available"};
                res.json(output);
            }
        }
    })
}

exports.markDispensaryDisabled = function(req, res){
    const dispensaryId = req.body.dispensaryId || '';
    if (!dispensaryId){
        output = {status: 400, isSuccess: false, message: "Dispensary ID required"};
        res.json(output);
        return;
    }

    SQL = `SELECT * FROM dispensaries WHERE id = ${dispensaryId}`;
    helperFile.executeQuery(SQL).then(responseCheck => {
        if (!responseCheck.isSuccess){
            output = {status: 400, isSuccess: false, message: responseCheck.message};
            res.json(output);
        }else{
            if (responseCheck.data.length > 0){
                SQL = `UPDATE dispensaries SET status = 0 WHERE id = ${dispensaryId}`;
                helperFile.executeQuery(SQL).then(response => {
                    if (!response.isSuccess){
                        output = {status: 400, isSuccess: false, message: response.message};
                        res.json(output);
                    }else{
                        output = {status: 200, isSuccess: true, message: "Success"};
                        res.json(output);
                    }
                })
            }else{
                output = {status: 400, isSuccess: false, message: "Invalid Dispensary ID"};
                res.json(output);
            }
        }
    })
}

exports.activateDispensary = function(req, res){
    const dispensaryId = req.body.dispensaryId || '';
    if (!dispensaryId){
        output = {status: 400, isSuccess: false, message: "Dispensary ID required"};
        res.json(output);
        return;
    }

    SQL = `SELECT * FROM dispensaries WHERE id = ${dispensaryId}`;
    helperFile.executeQuery(SQL).then(responseCheck => {
        if (!responseCheck.isSuccess){
            output = {status: 400, isSuccess: false, message: responseCheck.message};
            res.json(output);
        }else{
            if (responseCheck.data.length > 0){
                SQL = `UPDATE dispensaries SET status = 1 WHERE id = ${dispensaryId}`;
                helperFile.executeQuery(SQL).then(response => {
                    if (!response.isSuccess){
                        output = {status: 400, isSuccess: false, message: response.message};
                        res.json(output);
                    }else{
                        output = {status: 200, isSuccess: true, message: "Success"};
                        res.json(output);
                    }
                })
            }else{
                output = {status: 400, isSuccess: false, message: "Invalid Dispensary ID"};
                res.json(output);
            }
        }
    })
}

exports.getDispensaryById = function(req, res){
    const dispensaryId = req.params.id || '';
    if (!dispensaryId){
        output = {status: 400, isSuccess: false, message: "Dispensary ID required"};
        res.json(output);
        return;
    }

    SQL = `SELECT * FROM dispensaries WHERE id = ${dispensaryId}`;
    helperFile.executeQuery(SQL).then(responseCheck =>{
        if (!responseCheck.isSuccess){
            output = {status: 400, isSuccess: false, message: responseCheck.message};
            res.json(output);
        }else{
            if (responseCheck.data.length > 0){
                dispensaries.getDispensaryTimmings(responseCheck.data[0].id).then(timmings => {
                    if (!timmings.isSuccess){
                        output = {status: 400, isSuccess: false, message: timmings.message};
                        res.json(output);
                    }else{
                        responseCheck.data[0]['timmings'] = timmings.timming;
                        delete responseCheck.data[0]['opening_time'];
                        delete responseCheck.data[0]['closing_time'];
                        output = {status: 200, isSuccess: true, message: "Success", data: responseCheck.data};
                        res.json(output);
                    }
                })
            }else{
                output = {status: 400, isSuccess: false, message: "Invalid Dispensary ID"};
                res.json(output);
            }
        }
    })
}

exports.getDisabledDispensaries = function(req, res){
    const OFFSET = req.query.page || process.env.OFF_SET;
    const LIMIT = req.query.size || process.env.LIMIT;
    const userID = req.query.userID;
    console.log(req.query.userID);
     if(userID === 1 || userID === '1'){
        console.log('admin here disable');
        SQL = `SELECT d.*, dc.code FROM dispensaries as d JOIN dispensary_codes as dc ON dc.dispensary_id = d.id WHERE d.status = 0 ORDER BY id DESC LIMIT ${LIMIT} OFFSET ${OFFSET} `;
    }else{
        SQL = `SELECT d.*, dc.code FROM dispensaries as d JOIN dispensary_codes as dc ON dc.dispensary_id = d.id WHERE d.status = 0 AND user_id = ${userID} ORDER BY id DESC LIMIT ${LIMIT} OFFSET ${OFFSET}`;
    }
    //SQL = `SELECT * FROM dispensaries WHERE status = 0 AND user_id = ${userID} ORDER BY id DESC LIMIT ${LIMIT} OFFSET ${OFFSET} `;
    helperFile.executeQuery(SQL).then(response=>{
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            if (response.data.length > 0){
                output = {status: 200, isSuccess: true, message: "Success", data: response.data};
                res.json(output);
            }else{
                output = {status: 400, isSuccess: false, message: "No Disabled Dispensaries Available"};
                res.json(output);
            }
        }
    })
}

exports.getActiveDispensariesWithoutPagination = function(req, res){
    SQL = 'SELECT id, name FROM dispensaries WHERE status = 1';
    helperFile.executeQuery(SQL).then(response => {
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            output = {status: 200, isSuccess: true, message: "Success", data: response.data};
            res.json(output);
        }
    })
}

exports.uploadQuizData = function(req, res){
    let data = req.body.data || ''; 

    if (!data){
        output = {status: 400, isSuccess: false, message: "Quiz Data required"};
        res.json(output);
        return;
    }

    var groupID = 0;

    SQL = `SELECT group_id FROM questions ORDER BY id DESC LIMIT 1`;
    helperFile.executeQuery(SQL).then( groupIdResponse => {
        if (!groupIdResponse.isSuccess){
            output = { status: 400, isSuccess: false, message: groupIdResponse.message };
            res.json(output);
        }else{
            if (groupIdResponse.data.length === 0){
                groupID = 1;
            }else{ 
                groupID = groupIdResponse.data[0].group_id + 1;
            } 
            helperFile.insertQuiz(data, groupID).then( response => { console.log(response)
                if (!response.isSuccess){
                    output = {status: 400, isSuccess: false, message: response.message};
                    res.json(output);
                }else{
                    output = {status: 200, isSuccess: true, message: "Success"};
                    res.json(output);
                }
            })
        }
    })
}

exports.getQuizByDispensaryId = async function(req, res){
    const OFFSET = req.query.page || process.env.OFF_SET; console.log(OFFSET);
    const LIMIT = req.query.size || process.env.LIMIT; console.log(LIMIT);
    
    //SQL = `SELECT DISTINCT group_id FROM questions ORDER BY id DESC LIMIT ${LIMIT} OFFSET ${OFFSET}`;
    // SQL = `SELECT group_id FROM questions group by group_id DESC LIMIT ${LIMIT} OFFSET ${OFFSET}`;
    SQL = `SELECT group_id, DATE(created_at) as created_at FROM questions group by group_id, DATE(created_at) DESC LIMIT ${LIMIT} OFFSET ${OFFSET}`;
    helperFile.executeQuery(SQL).then( response => { 
        if (!response.isSuccess){ 
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{ 
            if (response.data.length > 0){
                // var allData = [];
                // var index = 0;
                // response.data.forEach(element => {
                //     getCreatedAt(element.group_id).then( createdAt => { 
                //         var data = {
                //             'group_id': element.group_id,
                //             'created_at': createdAt
                //         }
                //         allData.push(data);
                //         index = index + 1;
                //         if (index === response.data.length){ 
                //             if (response.data.length > 0){
                //                 output = {status: 200, isSuccess: true, message: "Success", data: allData};
                //                 res.json(output);
                //             }
                //         }
                //     });
                // });

                output = {status: 200, isSuccess: true, message: "Success", data: response.data};
                res.json(output);
            }else{
                output = {status: 400, isSuccess: false, message: "No active questions found"};
                res.json(output);
            }
            
        }
    })
}



exports.getQuizQuestions = async function(req, res){
    const OFFSET = req.query.page || process.env.OFF_SET; console.log(OFFSET);
    const LIMIT = req.query.size || process.env.LIMIT; console.log(LIMIT);
    SQL = `SELECT * FROM questions LIMIT ${LIMIT} OFFSET ${OFFSET}`;
    helperFile.executeQuery(SQL).then( response => { 
        if (!response.isSuccess){ 
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{ 
            if (response.data.length > 0){
                output = {status: 200, isSuccess: true, message: "Success", data: response.data};
                res.json(output);
            }else{
                output = {status: 400, isSuccess: false, message: "No Active Questions Available"};
                res.json(output);
            }
        }
    })
}


exports.getSingleQuestions = async function(req, res){
    const questionID = req.query.questionID;
    SQL = `SELECT * FROM questions where id = ${questionID}`;
    helperFile.executeQuery(SQL).then( questionResponse => { 
        if (!questionResponse.isSuccess){ 
            output = {status: 400, isSuccess: false, message: questionResponse.message};
            res.json(output);
        }else{
            if(questionResponse.data.length > 0){
                console.log(questionResponse.data['0'].id);
                var questionID = questionResponse.data['0'].id;
                var questionName = questionResponse.data['0'].question;
                SQL = `SELECT * FROM question_options WHERE question_id = ${questionID}`;
                helperFile.executeQuery(SQL).then( response => { 
                    if (!response.isSuccess){ 
                        output = {status: 400, isSuccess: false, message: response.message};
                        res.json(output);
                    }else{ 
                        var opdtionData = [];
                        response.data.forEach(element => {
                            var op_data = {
                                'option_value': element.option_value,
                                'isAnswer': element.isAnswer
                            }

                            opdtionData.push(op_data);
                        })
                        var data = {
                            'question_id': questionID,
                            'question_name': questionName,
                            'options': opdtionData
                        }
                        //console.log(data);
                        output = {status: 200, isSuccess: true, message: "Success", data: data};
                        res.json(output);
                    }
                })
            }
        }
    })
}

getCreatedAt = async (groupID) => {
    return new Promise((resolve) => {
        SQL = `SELECT created_at FROM questions WHERE group_id = ${groupID} LIMIT 1`;
        helperFile.executeQuery(SQL).then( response => {
            if (!response.isSuccess){
                output = {status: 400, isSuccess: false, message: response.message};
                resolve(output);
            }else{
                resolve(response.data[0].created_at);
            }
        })
    })
}

exports.deleteQuiz = (req, res) => {
    let quizId = req.body.quiz_id;
    if (!quizId){
        output = {status: 400, isSuccess: false, message: "Quiz ID required"};
        res.json(output);
        return;
    }

    SQL = `DELETE FROM questions WHERE group_id = ${quizId}`;
    helperFile.executeQuery(SQL).then( response => {
        if(!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            output = {status: 200, isSuccess: true, message: "Success"};
            res.json(output);
        }
    })
}

exports.getDashboardData = (req, res) => {
    const userID = req.query.userID;
    console.log('----------');
    console.log('----------');
    console.log(userID);
    console.log('----------');
    console.log('----------');
    let myData = {
        'allUsers': 0,
        'allDispensaries': 0,
        'allQuestions': 0,
        'recentUsers': []
    }

    SQL = `SELECT COUNT(*) AS totalUsers FROM users`;
    helperFile.executeQuery(SQL).then( response => { 
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            myData.allUsers = response.data[0].totalUsers;
            if(userID === 1 || userID === '1'){
                SQL = `SELECT COUNT(*) AS totalDispensaries FROM dispensaries`;
            }else{
                SQL = `SELECT COUNT(*) AS totalDispensaries FROM dispensaries WHERE user_id = ${userID}`;
            }
            helperFile.executeQuery(SQL).then( response => {
                if (!response.isSuccess){
                    output = {status: 400, isSuccess: false, message: response.message};
                    res.json(output);
                }else{
                    myData.allDispensaries = response.data[0].totalDispensaries;
                    SQL = `SELECT COUNT(*) AS totalQuestions FROM questions`;
                    helperFile.executeQuery(SQL).then( response => {
                        if (!response.isSuccess){
                            output = {status: 400, isSuccess: false, message: response.message};
                            res.json(output);
                        }else{
                            myData.allQuestions = response.data[0].totalQuestions;
                            SQL = `SELECT * FROM users ORDER BY id DESC LIMIT 5`;
                            helperFile.executeQuery(SQL).then( response => { 
                                if (!response.isSuccess){
                                    output = {status: 400, isSuccess: false, message: response.message};
                                    res.json(output);
                                }else{
                                    myData.recentUsers = response.data;
                                    output = {status: 200, isSuccess: true, message: "Success", data: myData};
                                    res.json(output);
                                }
                            })
                        }
                    })
                }
            })
        }
    })  
}

exports.updateAdminPassword = (req, res) => {
    let id = req.body.id || '';
    let password = req.body.password || '';

    if (!id){
        output = {status: 400, isSuccess: false, message: "Admin ID required"};
        res.json(output);
        return;
    }
    if(!password){
        output = {status: 400, isSuccess: false, message: "Password required"};
        res.json(output);
        return;
    }
    var encryptedPassword = cryptr.encrypt(password);
    SQL = `UPDATE admin SET password = '${encryptedPassword}' WHERE id = ${id}`;
    helperFile.executeQuery(SQL).then( response => { 
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            output = {status: 200, isSuccess: true, message: "Success"};
            res.json(output);
        }
    })
}

exports.updateAdminProfile = (req, res) => {
    let email = req.body.email || '';
    let name = req.body.name || '';
    let id = req.body.id || '';

    if (!id){
        output = {status: 400, isSuccess: false, message: "Admin ID required"};
        res.json(output);
        return;
    }
    if (!name){
        output = {status: 400, isSuccess: false, message: "Admin name required"};
        res.json(output);
        return;
    }
    if (!email){
        output = {status: 400, isSuccess: false, message: "Admin email required"};
        res.json(output);
        return;
    }

    SQL = `UPDATE admin SET email = '${email}', name = '${name}' WHERE id = ${id}`;
    helperFile.executeQuery(SQL).then( response => { console.log(response);
        if (!response.isSuccess){
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            SQL = `SELECT * FROM admin WHERE id = ${id}`;
            helperFile.executeQuery(SQL).then( responseAdmin => {
                if (!responseAdmin.isSuccess){
                    output = {status: 400, isSuccess: false, message: responseAdmin.message};
                    res.json(output);
                }else{
                    output = {status: 200, isSuccess: true, message: "Success", admin: responseAdmin.data[0]};
                    res.json(output);
                }
            })
            output = {status: 200, isSuccess: true, message: "Success"};
            res.json(output);
        }
    })
}

exports.initialPayment = async (req, res) => {
     console.log(req.body);
     var defaultClient = SquareConnect.ApiClient.instance;
   //  // defaultClient.basePath = 'https://billowing-sky-9112.getsandbox.com:443';
    var oauth2 = defaultClient.authentications['oauth2'];
    oauth2.accessToken = "EAAAEHar1eE0uBd3km3_GjTta1A1eR4eshM9abJt2MRFgoI1xTTSFBxvCut1iVY9";
    defaultClient.basePath = 'https://connect.squareupsandbox.com';
    

    const idempotency_key = crypto.randomBytes(22).toString('hex');
    //var api = new SquareConnect.PaymentsApi();
    const payments_api = new SquareConnect.PaymentsApi();
    const request_body = {
        source_id: req.body.cardNonce,
        amount_money: {
          amount: 100, // £1.00 charge
          currency: 'USD'
        },
        idempotency_key: idempotency_key
      };
    
   //  // api.createPayment(request_body).then(function(data) {
   //  //     console.log('API called successfully. Returned data: ' + JSON.stringify(data, 0, 1));
   //  // }, function(error) {
   //  //     console.error(error);
   //  // });

   //  const request_params = req.body;

   // // length of idempotency_key should be less than 45
   // const idempotency_key = crypto.randomBytes(22).toString('hex');

   // // Charge the customer's card
   // const payments_api = new SquareConnect.PaymentsApi();
   // const request_body = {
   //   source_id: request_params.nonce,
   //   amount_money: {
   //     amount: 100, // $1.00 charge
   //     currency: 'USD'
   //   },
   //   idempotency_key: idempotency_key
   // };

   try {
    const response = await payments_api.createPayment(request_body);
    output = {status: 200, isSuccess: true, message: "Payment Successful", 'result': response};
    res.json(output);
     
   } catch(error) {
    console.log(error);
     res.status(500).json({
       'title': 'Payment Failure',
       'result': error
     });
   }
    
}

exports.getAdminById = (req, res) => {
    let id = req.params.id || '';
    // console.log(id);
    if (!id){
        output = { status: 400, isSuccess: false, message: "Admin ID required"};
        res.json(output);
        return;
    }

    SQL = `SELECT * FROM admin WHERE id = ${id}`;
    helperFile.executeQuery(SQL).then( response => { 
        if (!response.isSuccess){
            output = { status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{
            if(response.data.length > 0){ console.log(response.data[0]);
                output = { status: 200, isSuccess: true, message: "Success", admin: response.data[0]};
                res.json(output);
            }else{
                output = { status: 400, isSuccess: false, message: "Invalid Admin ID"};
                res.json(output);
            }
        }
    })
}

exports.getDispensaryByAdminId = (req, res) => {
    let adminId = req.params.id || '';
    if (!adminId){
        output = { status: 400, isSuccess: false, message: "Admin ID required"};
        res.json(output);
        return;
    }

    SQL = `SELECT * FROM dispensaries WHERE user_id = ${adminId}`;
    helperFile.executeQuery(SQL).then(responseCheck =>{
        if (!responseCheck.isSuccess){
            output = {status: 400, isSuccess: false, message: responseCheck.message};
            res.json(output);
        }else{
            if (responseCheck.data.length > 0){
                dispensaries.getDispensaryTimmings(responseCheck.data[0].id).then(timmings => {
                    if (!timmings.isSuccess){
                        output = {status: 400, isSuccess: false, message: timmings.message};
                        res.json(output);
                    }else{
                        responseCheck.data[0]['timmings'] = timmings.timming;
                        delete responseCheck.data[0]['opening_time'];
                        delete responseCheck.data[0]['closing_time'];
                        output = {status: 200, isSuccess: true, message: "Success", data: responseCheck.data};
                        res.json(output);
                    }
                })
            }else{
                output = {status: 400, isSuccess: false, message: "Invalid Dispensary ID"};
                res.json(output);
            }
        }
    })
}



exports.getAllVouchersList = (req, res) => {
    const OFFSET = req.query.page || process.env.OFF_SET; console.log(OFFSET);
    const LIMIT = req.query.size || process.env.LIMIT; console.log(LIMIT);
    SQL = `SELECT u.first_name,u.last_name,u.email,v.status,v.created,v.expiry,d.name FROM vouchers as v 
    JOIN users as u ON v.user_id = u.id
    JOIN dispensaries as d ON v.dispensary_id = d.id
    LIMIT ${LIMIT} OFFSET ${OFFSET}`;
    helperFile.executeQuery(SQL).then( response => { 
        if (!response.isSuccess){ 
            output = {status: 400, isSuccess: false, message: response.message};
            res.json(output);
        }else{ 
            if (response.data.length > 0){
                output = {status: 200, isSuccess: true, message: "Success", data: response.data};
                res.json(output);
            }else{
                output = {status: 400, isSuccess: false, message: "No Vouchers Available"};
                res.json(output);
            }
        }
    })
}
