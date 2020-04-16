var express = require('express');
var router = express.Router();
var auth = require('./auth');
var web = require('./webPreview');
var dispensaries = require('./dispansaries');
var quiz = require('./quiz');
var voucher = require('./voucher');
var notification = require('./notifications');
var fcm = require('./fcmNotifications');
const cron = require("node-cron");
var helperFile = require('../helpers/helperFunctions.js');
var admin = require('./admin.js');
var business = require('./business.js');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.post('/api/v1/user/verify', auth.verifyUser);
router.post('/api/v1/user/verify-code', auth.verifyCode);
router.get('/api/v1/user/profile', auth.getUserProfile);
// router.get('/api/v1/fcm/notification', fcm.sendTestFcmNotification);
router.get('/', function(req, res, next){
    res.send('BackEnd BudsBank is running.');
});

router.post('/forget-password', auth.forgotPassword);
router.get('/forgetPassword/:code', web.forgotPassword);
router.post('/updatePassword', auth.updatePassword);

router.get('/api/v1/home-content', auth.getHomeContent);
router.get('/api/v1/dispensary/completed-dispensaries', dispensaries.getCompletedDispensariesByUserID);
router.get('/api/v1/dispensary/followed-dispensaries', dispensaries.userFollowedDispensaries);

router.get('/api/v1/dispensaries/nearby-dispensaries', dispensaries.getNearbyDispensaries);
router.post('/api/v1/dispensary/follow-dispensary', dispensaries.followDispensary);
router.post('/api/v1/dispensary/unfollow-dispensary', dispensaries.unFollowDispensary);
router.get('/api/v1/dispensary/get-dispensary', dispensaries.getDispensaryByID);
router.get('/api/v1/dispensary/search', dispensaries.searchDispensary);
router.get('/api/v1/dispensary/featured-dispensaries', dispensaries.featuredDispensariesList);

router.get('/api/v1/quiz/get-quiz', quiz.getQuizQuestion);
router.post('/api/v1/quiz/save-quiz', quiz.saveQuizResult);

router.get('/api/v1/voucher/available-vouchers', voucher.getAvailableVouchersList);
router.get('/api/v1/voucher/redeemed-vouchers', voucher.getRedeemedVouchersList);
router.post('/api/v1/voucher/claim-voucher', voucher.claimVoucher);

router.post('/api/v1/notification/enable-disable', notification.enableDisableNotification);
router.get('/api/v1/notification/settings', notification.getAllSettings);

router.get('/api/v1/notification/all', notification.getAllNotifications);
router.get('/api/v1/notification/read-notifications', notification.getReedNotifications);
router.get('/api/v1/notification/unread-notifications', notification.getUnReedNotifications);
router.post('/api/v1/notification/mark-read', notification.markReadNotification);
router.post('/api/v1/notification/delete', notification.deleteNotification);
router.post('/data-entry', notification.doDataEntry);

var multer = require('multer');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images');
    },
    filename: (req, file, cb) => {
        console.log(file);
        var filetype = '';
        if(file.mimetype === 'image/png') {
            filetype = 'png';
        }
        if(file.mimetype === 'image/jpg') {
            filetype = 'jpg';
        }
        if(file.mimetype === 'image/jpeg') {
            filetype = 'jpeg';
        }
        if(file.mimetype === 'application/json') {
            filetype = 'json';
        }
        cb(null, 'file-' + Date.now() + '.' + filetype);
    }
});
var upload = multer({storage: storage});
router.post('/api/v1/user/update-profile', upload.single('image'), function (req, res) {
    if(req.file){
        var imageName = req.file.filename;
    }else{
        var imageName = '';
    }
    auth.updateUserProfile(req, imageName).then(response => {
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
});


router.post('/upload-image', upload.single('image'), function (req, res) { 
    res.json("success")
});




module.exports = router;



//Corn job for Voucher Coins
// cron.schedule('0 0 * * *', () => {
  
 cron.schedule('0 0 * * *', () => {
   SQL = `SELECT * FROM vouchers where date(expiry) <= CURDATE() AND status = 'true'`;
    helperFile.executeQuery(SQL).then(responseForVouchers => {
        if (!responseForVouchers.isSuccess){
            console.log('cron job error');
        }else{
          if(responseForVouchers.data.length > 0){

             console.log('-------------');
             console.log('cron job working');
             console.log('-------------');
            // console.log(responseForVouchers.data);
            helperFile.expiredVouchers(responseForVouchers.data).then(response => {
               console.log('-------------');
               console.log('cron job working in expired vouchers');
               console.log('-------------');

            });
          }
        }
    });
  
});

//Corn job for Disable dispensaries remove from disable table
// cron.schedule('0 0 * * *', () => {
cron.schedule('* * * * *', () => {
  var x = new Date();
  console.log(x);
   SQL = `DELETE FROM user_disabled_dispensaries WHERE status = 'true' AND
               expiry <= CURRENT_TIMESTAMP`;
    helperFile.executeQuery(SQL).then(responseForVouchers => {
        if (!responseForVouchers.isSuccess){
            console.log('cron job error');
        }else{
            console.log('success');
        }
    });
});

/* Admin Routes */

// User routes
router.post('/admin/login', admin.login);
router.post('/admin/forget-business-password', auth.forgotBusinessPassword);
router.post('/admin/update-business-password', auth.updateBusinessPassword);
router.post('/admin/user/add', auth.register);
router.get('/admin/user/all', admin.getActiveUsers);
router.get('/admin/user/:id', admin.getUserById);
router.post('/admin/user/update/image', upload.single('image'),function (req, res){
    var imageName = req.file.filename;
    admin.addImageToUser(req, imageName).then(response => { 
        if (!response.isSuccess){
            output = {status: 400, message: response.message}
            res.json(output)
        }else{
            res.json({status: 200, message: "Success"});
        }
    })
});
router.post('/admin/user/update/profile', admin.updateUser);
router.post('/admin/user/disable', admin.markUserDisabled);
router.get('/admin/user/disabled/all', admin.getDisabledUsers);
router.post('/admin/user/activate', admin.activateUser);
// dispensary routes
router.post('/admin/dispensary/add/image', upload.single('image'), function (req, res){
    var imageName = req.file.filename;
    admin.addImageToDispensary(req, imageName).then(response => { 
        if (!response.isSuccess){
            output = {status: 400, message: response.message}
            res.json(output)
        }else{
            res.json({status: 200, message: "Success"});
        }
    })
});
router.post('/admin/dispensary/add', admin.addDispensary);
router.get('/admin/dispensary/all', admin.activeDispensaries);
router.post('/admin/dispensary/disable', admin.markDispensaryDisabled);
router.post('/admin/dispensary/activate', admin.activateDispensary);
router.get('/admin/dispensary/:id', admin.getDispensaryById);
router.get('/admin/dispensary/disabled/all', admin.getDisabledDispensaries);
router.post('/admin/dispensary/update', admin.updateDispensary);
router.get('/admin/dispensary/active/all/without-pagination', admin.getActiveDispensariesWithoutPagination);
router.get('/admin/dispensary/admin/:id', admin.getDispensaryByAdminId);

//  quiz routes
router.post('/admin/quiz/upload', admin.uploadQuizData);
router.get('/admin/quiz/all', admin.getQuizByDispensaryId);
router.get('/admin/quiz/group/questions', admin.getQuizQuestions);
router.get('/admin/quiz/singlequestion', admin.getSingleQuestions);
router.post('/admin/quiz/delete', admin.deleteQuiz);

// Dashboard routes
router.get('/admin/dashboard/data', admin.getDashboardData);

// admin profile routes
router.post('/admin/profile/password/update', admin.updateAdminPassword);
router.post('/admin/profile/update', admin.updateAdminProfile);
router.get('/admin/:id', admin.getAdminById);

// business profile routes
router.post('/admin/register/business', business.register);
router.post('/admin/register/check-email', business.checkEmail);
router.post('/admin/process-payment', admin.initialPayment);

// Vouchers routes
router.get('/admin/voucher/getall', admin.getAllVouchersList);
