const express = require('express');
const app = express();
const path = require('path');
const winston = require('winston');
const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
let sitemap;

const jobs = require('./jobs');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(require('churchill')(winston));

app.engine('html', require('mustache-express')(path.join(__dirname, '/views/partials')));

app.set('view engine', 'html');
app.set('views', path.resolve(__dirname, 'views'));

app.get('/sitemap.xml', function(req, res) {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');
  // if we have a cached entry send it
  if (sitemap) {
    res.send(sitemap);
    return;
  }

  try {
    const smStream = new SitemapStream({ hostname: 'https://marvell-consulting.com/' });
    const pipeline = smStream.pipe(createGzip());

    // pipe your entries or directly write them.
    smStream.write({ url: '/'});
    smStream.write({ url: '/casestudy/asru'});
    smStream.write({ url: '/casestudy/ukvi'});
    smStream.write({ url: '/privacy'});
    smStream.end()

    // cache the response
    streamToPromise(pipeline).then(sm => sitemap = sm);
    // stream write the response
    pipeline.pipe(res).on('error', (e) => {throw e});
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

app.use((req, res, next) => {
  res.locals.jobs = jobs;
  next();
});

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/privacy', function (req, res) {
  res.render('privacy');
});

// app.get('/casestudy/:id', function (req, res) {
//   res.render(`casestudies/${req.params.id}`);
// });

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
