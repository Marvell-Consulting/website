const express = require('express');
const app = express();
const path = require('path');
const winston = require('winston');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(require('churchill')(winston));

app.get('/', function (req, res) {
  res.sendFile('./index.html', {root: __dirname });
});

app.listen(8080, () => {winston.log('info', 'server started on 8080')});