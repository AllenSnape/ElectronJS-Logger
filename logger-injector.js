window._console = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    log: console.log,
    trace: console.trace,
};

const logger = require('electron').remote.require('./logger');

for (const key in _console) {
    console[key] = function () {
        logger(key.toUpperCase() + ' ' + Array.from(arguments).join(' ').toString());
        window._console[key](...arguments);
    };
}

console.log('注入完成');
