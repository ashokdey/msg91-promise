const {
  makeHttpRequest, isUnicodeString,
  validateMessage, validateMobileNos,
} = require('./helpers');

/**
 *
 * @param authKey
 * @param senderId
 * @param route : Value can be 1 for Promotional Router or 4 for Transactional Route
 */
module.exports = function MSG91(authKey, senderId, route) {
  if (!authKey) {
    throw new Error('MSG91 Authorization Key not provided.');
  }

  if (!senderId) {
    throw new Error('MSG91 Sender Id is not provided.');
  }

  if (!route) {
    throw new Error('MSG91 router Id is not provided.');
  }

  this.send = (mobileNos, message) => {
    const mobileNumbers = validateMobileNos(mobileNos);
    let encodedMessage = validateMessage(message);


    // for fixing this issue - http://help.msg91.com/article/59-problem-with-plus-sign-api-send-sms
    // EncodeUriComponent Doesn't work on ! * ( ) . _ - ' ~ `
    const specialChars = ['+', '&', '#', '%', '@', '/', ';', '=', '?', '^', '|'];
  
    if (specialChars.some(v => message.indexOf(v) >= 0)) {
      // if there is at least one special character present in message string
      encodedMessage = encodeURIComponent(encodeURIComponent(message));
    }

    let postData = `authkey=${authKey}&sender=${senderId}&mobiles=${mobileNumbers}&message=${encodedMessage}&route=${route}`;

    const isUnicode = isUnicodeString(encodedMessage);
    if (isUnicode) {
      postData += '&unicode=1';
    }

    const options = {
      hostname: 'control.msg91.com',
      port: 80,
      path: '/api/sendhttp.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
      },
    };

    return new Promise((resolve, reject) => {
      makeHttpRequest(options, postData, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  };

  this.getBalance = (customRoute) => {
    const currentRoute = customRoute || route;

    const options = {
      hostname: 'control.msg91.com',
      port: 80,
      path: `/api/balance.php?authkey=${authKey}&type=${currentRoute}`,
      method: 'GET',
    };

    return new Promise((resolve, reject) => {
      makeHttpRequest(options, null, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  };

  return this;
};
