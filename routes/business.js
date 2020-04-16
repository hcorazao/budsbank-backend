var helperFile = require('../helpers/helperFunctions.js');
var Cryptr = require('cryptr');
cryptr = new Cryptr(process.env.PASS_SECRET);

exports.register = (req, res) => {
    let name = req.body.name || '';
    let email = req.body.email || '';
    let password = req.body.password || '';
    // let nonce = req.body.cardNonce || '';
    let role = 2;

    if (!name){
        output = {status: 400, isSuccess: false, message: "Name required"};
        res.json(output);
        return;
    }
    if (!email){
        output = {status: 400, isSuccess: false, message: "Email required"};
        res.json(output);
        return;
    }
    if (!password){
        output = {status: 400, isSuccess: false, message: "Password required"};
        res.json(output);
        return;
    }
    // if (!nonce){
    //     output = {status: 400, isSuccess: false, message: "Nonce required"};
    //     res.json(output);
    //     return;
    // }

    let isEmailValid = helperFile.checkIfEmailInString(email);
    if (!isEmailValid){
        output = {status: 400, isSuccess: false, message: "Please enter a valid email address" };
        res.json(output);
        return;
    }

    helperFile.checkEmailExists(email).then(responseForEmailCheck =>{
        if (responseForEmailCheck.isEmailExists === true){
            output = { status: 400, isSuccess: false, message: "Email already exists" };
            res.json(output);
            return;
        }else{
            helperFile.checkBusinessEmail(email).then( emailCheck => {
                if (!emailCheck){
                    output = { status: 400, isSuccess: false, message: "Email already exists" };
                    res.json(output);
                    return;
                }else{
                    var encryptedPassword = cryptr.encrypt(password);
                    SQL = `INSERT INTO admin (role, nonce_id, name, email, password) VALUES (${role}, 'no', '${name}', '${email}', '${encryptedPassword}')`;
                    helperFile.executeQuery(SQL).then(response => {
                        if (!response.isSuccess){
                            output = { status: 400, isSuccess: false, message: response.message };
                            res.json(output);
                        }else{
                            let userId = response.data.insertId;
                            SQL = `SELECT * FROM admin WHERE id = ${userId}`;
                            helperFile.executeQuery(SQL).then(responsUser => {
                                if (!responsUser.isSuccess){
                                    output = { status: 400, isSuccess: false, message: responsUser.message };
                                    res.json(output);
                                }else{
                                    output = { status: 200, isSuccess: true, message: "Success", user: responsUser.data[0] };
                                    res.json(output);
                                }
                            })  
                        }
                    })
                }
            })
            
        }
    });
}

exports.checkEmail = (req, res) => {
    let email = req.body.email || '';
    if (!email){
        output = {status: 400, isSuccess: false, message: "Email required"};
        res.json(output);
        return;
    }

    helperFile.checkEmailExists(email).then(responseForEmailCheck =>{ console.log(responseForEmailCheck);
        if (responseForEmailCheck.isEmailExists === true){
            output = { status: 400, isSuccess: false, message: "Email already exists" };
            res.json(output);
            return;
        }else{
            helperFile.checkBusinessEmail(email).then( emailCheck => { console.log(emailCheck);
                if(!emailCheck){
                    output = { status: 400, isSuccess: false, message: "Email already exists" };
                    res.json(output);
                    return;
                }else{
                    output = { status: 200, isSuccess: false, message: "Success" };
                    res.json(output);
                }
            });
        }
    });
            
}