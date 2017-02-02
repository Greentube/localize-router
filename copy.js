var fs = require('fs');

fs.createReadStream('bundles/localize-router.umd.js').pipe(fs.createWriteStream('bundles/index.js'));