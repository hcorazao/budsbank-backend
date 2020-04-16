var { fcmAdmin } = require('./fcm-init');

exports.sendFcmNotification = function(obj, notificationDevices)
{
    console.log('------, fcm , -------', notificationDevices);

    notificationDevices.forEach(function(registrationToken) {
        // See documentation on defining a message payload.
        var message = {
            android: {
                priority: 'high',
                data: {
                    data: JSON.stringify(obj)
                }
            },
            token: registrationToken
        };

        // Send a message to the device corresponding to the provided
        // registration token.
        fcmAdmin.messaging().send(message)
          .then((response) => {
            // Response is a message ID string.
            console.log('Android ::::::::::::hassan  live test Successfully sent message:', response);
          })
          .catch((error) => {
            
            console.log('Android::::::::::::::hassan live test registrationToken:', registrationToken);
            console.log('Android::::::::::::::hassan live test Error sending message:', error);
          });
    }, this); 
}


exports.sendTestFcmNotification = function(obj, fcmToken)
{
        var message = {
            android: {
                priority: 'high',
                data: {
                    data: 'hassan'
                }
            },
            token: fcmToken
        };
        fcmAdmin.messaging().send(message)
          .then((response) => {
            console.log('Android ::::::::::::hassan  live test Successfully sent message:', response);
          })
          .catch((error) => {
            console.log('Android::::::::::::::hassan live test Error sending message:', error);
          });
};
