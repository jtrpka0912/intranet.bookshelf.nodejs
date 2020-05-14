var http = require('http');

//===========TESTING FILES===========
const fs = require('fs');
const path = require('path');

(async () => {
    try{
        const rootPath = 'R:\\';
        const files = await fs.promises.readdir(rootPath);

        // Loop Through Files and Folders
        for(const file of files) {
            const filePath = path.join(rootPath, file);
            const fileDetails = await fs.promises.stat(filePath);
            console.log('===========================')
            console.info('Is Directory?', fileDetails.isDirectory())
            console.info('Is File?', fileDetails.isFile());
            console.info('File Path', filePath);
            console.info('File Extension', path.extname(filePath));
        }

    } catch (e) {
        // Catch anything bad that happens
        console.error( "We've thrown! Whoops!", e );
    }
})();


http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
}).listen(1337, "127.0.0.1");

console.log('Server running at http://127.0.0.1:1337/');