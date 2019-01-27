const fs = require('fs'), path = require('path'), app = require('electron').app;

// region 当前时间
const now = (time) => {
    if (!time || !(time instanceof Date)) time = new Date();
    return time.getFullYear() + '-' +
        ((time.getMonth() < 9 ? '0' : '') + (time.getMonth() + 1)) + '-' +
        (time.getDate() < 10 ? '0' : '') + time.getDate() +
        'T' + (time.getHours() < 10 ? '0' : '') + time.getHours() + ':' +
        (time.getMinutes() < 10 ? '0' : '') + time.getMinutes() + ':' +
        (time.getSeconds() < 10 ? '0' : '') + time.getSeconds() + '.' +
        (time.getMilliseconds() < 100 ?
            (time.getMilliseconds() < 10 ? '00' : '0') : '') +
        time.getMilliseconds();
};
// endregion

// region 日志文件
const loggerMkdir = () => {
    if (!fs.existsSync(loggerPath)) {
        fs.mkdir(loggerPath, e => e && e.code !== 'EEXIST' ? console.error(e) : null);
    }
};
const loggerPath = path.join(app.getAppPath(), 'logs');
const loggerFile = path.join(loggerPath, now().replace(/[-:.]/g, '') + '.log');
loggerMkdir();
// endregion

module.exports = {
    logger: {
        mkdir: loggerMkdir,
        cleanup: () => {
            if (fs.existsSync(loggerPath)) {
                fs.readdirSync(loggerPath).forEach(function(file){
                    fs.unlinkSync(path.join(loggerPath, file));
                });
            }
            return true;
        },
        path: loggerPath,
        file: loggerFile,
    },
    now: now,
};
