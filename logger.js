const fs = require('fs'), config = require('./config.js');

/**
 * 输出日志到文件
 * @param content 日志内容
 */
module.exports = (content) => {
    fs.appendFile(
        config.logger.file,
        config.now() + ': ' + (typeof content === 'string' ? content : JSON.stringify(content)) + '\r\n',
        e => e ? console.error('日志写入错误: ', e) : null
    );
};
