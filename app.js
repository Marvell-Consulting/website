const express = require('express');
const app = express();
const path = require('path');
const winston = require('winston');
const consolidate = require('consolidate');

const jobs = require('./jobs');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(require('churchill')(winston));

app.engine('html', consolidate.mustache);

app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));

app.use(require('express-partial-templates')(app));

app.use((req, res, next) => {
  res.locals.jobs = jobs;
  next();
});

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/jobs/:id', function (req, res, next) {
  const job = jobs.reduce((found, job) => {
    console.log(job.id, req.params.id)
    return found || (job.id === req.params.id ? job : null);
  }, null);
  if (!job) {
    next();
  }
  res.render(`jobs/${job.id}`);
});

app.use((req, res) => {
  res.status(404);
  res.render('404');
});

app.use((err, req, res, next) => {
  res.status(500);
  res.render('500');
});

app.listen(8080, () => {winston.log('info', 'server started on 8080')});