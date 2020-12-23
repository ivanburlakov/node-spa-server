const fs = require('fs');
const http = require('http');
const path = require('path');

require('dotenv').config({
  path: fs.existsSync('../.env.production') ? '../.env.production' : '../.env',
});

const { LIGHT_MIME_TYPES, HEAVY_MIME_TYPES } = require('./modules/constants.js');
const { postTypes, jsonResult } = require('./modules/functions.js');

const STATIC_PATH = path.join(process.cwd(), './public');
const STATIC_PATH_LENGTH = STATIC_PATH.length;

const serveFile = name => {
  const filePath = path.join(STATIC_PATH, name);
  if (!filePath.startsWith(STATIC_PATH)) {
    console.log(`Can't be served: ${name}`);
    return null;
  }
  const stream = fs.createReadStream(filePath);
  console.log(`Served: ${name}`);
  return stream;
};

const cache = new Map();

const cacheFile = async filePath => {
  const data = await fs.promises.readFile(filePath, 'utf8');
  // .split and .join are only for hosting on Windows
  const key = filePath.substring(STATIC_PATH_LENGTH).split(path.sep).join(path.posix.sep);
  cache.set(key, data);
};

const cacheDirectory = async directoryPath => {
  const files = await fs.promises.readdir(directoryPath, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(directoryPath, file.name);
    const fileExt = path.extname(filePath).substring(1);
    if (file.isDirectory()) cacheDirectory(filePath);
    else if (LIGHT_MIME_TYPES[fileExt]) cacheFile(filePath);
  }
};

cacheDirectory(STATIC_PATH);

http
  .createServer(async (req, res) => {
    const { url } = req;
    if (req.method === 'GET') {
      const fileExt = path.extname(url).substring(1);
      let mimeType = LIGHT_MIME_TYPES[fileExt] || HEAVY_MIME_TYPES[fileExt];
      if (!mimeType) mimeType = LIGHT_MIME_TYPES.html;
      res.writeHead(200, { 'Content-Type': mimeType });
      const file = fileExt === '' ? '/index.html' : url;
      const cached = cache.get(file);
      if (cached) {
        res.end(cached);
      } else {
        const stream = serveFile(file);
        if (stream) stream.pipe(res);
      }
    } else if (req.method === 'POST') {
      const postType = postTypes[url];
      let response = postType ? await postType(req) : jsonResult(`Woops, no ${url} post type!`);
      res.writeHead(response ? 200 : 500, { 'Content-Type': LIGHT_MIME_TYPES.json });
      if (!response) response = jsonResult(`Woops, your response failed to arrive!`);
      res.end(response);
    }
  })
  .listen(8000);