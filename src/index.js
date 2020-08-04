const http = require("http");
const formidable = require("formidable");
const fetch = require("node-fetch");
const convertSavegame = require("./converter");
const { parse } = require("url");
const {
    createReadStream,
    readFileSync,
    existsSync,
    writeFileSync
} = require("fs");

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
async function onRequest(req, res) {
    const uri = parse(req.url);

    switch (uri.pathname) {
        case "/":
            res.writeHead(200, "OK", {
                "content-type": "text/html"
            });
            createReadStream("./public/index.html").pipe(res, { end: true });
            return;
        case "/process":
            if (req.method == "POST") {
                const form = new formidable.IncomingForm();
                form.type = "multipart/form-data";
                form.maxFields = 5;
                form.maxFieldsSize = 4096;
                form.maxFileSize = 1024 * 1024 * 10;

                form.parse(req, (err, _, files) => {
                    if (err) {
                        res.writeHead(500, "Internal Server Error", {
                            "content-type": "text/plain"
                        });
                        res.end("Failed to parse form.");
                        return;
                    }

                    const file = files["savegame"];
                    if (!file) {
                        res.writeHead(500, "Internal Server Error", {
                            "content-type": "text/plain"
                        });
                        res.end(
                            'Invalid request. Please send "savegame" field.'
                        );
                        return;
                    }

                    try {
                        const result = convertSavegame(readFileSync(file.path));

                        res.writeHead(200, "OK", {
                            "content-type": "application/octet-stream",
                            "content-disposition": "attachment; filename=converted.bin"
                        });
                        res.end(result);
                    } catch (e) {
                        const errHtml = readFileSync("./public/error.html", {
                            encoding: "utf-8"
                        });

                        res.writeHead(500, "Internal Server Error", {
                            "content-type": "text/html"
                        });
                        res.end(errHtml.replace("$ERROR", e.toString()));
                    }
                });
                return;
            }
            break;
    }

    res.writeHead(404, "Not Found", {
        "content-type": "text/plain"
    });
    res.end("Not Found");
}

const root = "https://raw.githubusercontent.com/tobspr/shapez.io/master/";

if (!existsSync("./data/compressor.js")) {
    console.warn("Downloading compressor...");
    const url = root + "src/js/savegame/savegame_compressor.js";

    fetch(url)
        .then(r => r.text())
        .then(code => {
            return (
                "const G_IS_DEV = false;" +
                code.replace(/export function/g, "function") +
                "; module.exports = { compressObject, decompressObject }"
            );
        })
        .then(code =>
            writeFileSync("./data/compressor.js", code, {
                encoding: "utf-8"
            })
        )
        .then(_ => console.log("Done."))
        .catch(console.error);
}

if (!existsSync("./data/salt.js")) {
    console.warn("Downloading salt...");
    const url = root + "src/js/core/config.js";

    fetch(url)
        .then(r => r.text())
        .then(code => code.split("\n"))
        .then(lines => lines.find(l => l.includes('        file: "')))
        .then(saltLine => `module.exports = { ${saltLine} }`)
        .then(code =>
            writeFileSync("./data/salt.js", code, {
                encoding: "utf-8"
            })
        );
}

http.createServer(onRequest).listen(11241, "127.0.0.1");
