const express = require('express');
const app = express();
const path = require('path');

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile('./index.html', {root: __dirname });
});

app.listen(8080);