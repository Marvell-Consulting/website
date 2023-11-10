const express = require('express');
const app = express();
const path = require('path');
const winston = require('winston');
const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
const axios = require('axios');
const luxon = require('luxon');

const WAGTAIL_SERVER = process.env.WAGTAIL_SERVER || 'http://localhost';
const WAGTAIL_PORT = process.env.WAGTAIL_PORT || 8000;

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
    smStream.write({ url: '/casestudy/asru-alpha'});
    smStream.write({ url: '/casestudy/asru-beta'});
    smStream.write({ url: '/casestudy/ukvi'});
    smStream.write({ url: '/casestudy/rotm'});
    smStream.write({ url: '/casestudy/hof'});
    smStream.write({ url: '/casestudy/ho-live'});
    smStream.write({ url: '/casestudy/nhsx-discovery'});
    smStream.write({ url: '/casestudy/nhsx-alpha'});
    smStream.write({ url: '/casestudy/nhsx-beta'});
    smStream.write({ url: '/casestudy/modern-slavery'});
    smStream.write({ url: '/privacy'});
    smStream.write({ url: '/social-value-statement'});
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

app.get('/services', function (req, res) {
  res.render('services');
});

app.get('/frameworks', function (req, res) {
  res.redirect('/services');
});

app.get('/services/understand', function (req, res) {
  res.render('understand');
});

app.get('/services/build', function (req, res) {
  res.render('build');
});

app.get('/services/develop', function (req, res) {
  res.render('develop');
});

app.get('/privacy', function (req, res) {
  res.render('privacy');
});

app.get('/social-value-statement', function (req, res) {
  res.render('socialvaluestatement');
});

app.get('/casestudies', function (req, res) {
  res.render('casestudies');
});

app.get('/casestudy/:id', function (req, res) {
  res.render(`casestudies/${req.params.id}`);
});

app.get('/blog', function (req, res) {
  // get all the blog posts
  axios.get(`${WAGTAIL_SERVER}:${WAGTAIL_PORT}/api/v2/pages?type=blog.BlogPage&fields=intro,thumbnail,author,date`)
    .then((response) => {
      // handle success
      let posts = response.data.items;

      // sort posts via date
      posts.sort((a, b) => {
        return luxon.DateTime.fromISO(b.date) - luxon.DateTime.fromISO(a.date);
      });

      // format date
      posts.forEach((post) => {
        post.date = luxon.DateTime.fromISO(post.date).toLocaleString(luxon.DateTime.DATE_FULL);
      });

      // render the posts
      res.render('blog', { posts: posts });
    });
});

app.get('/blog/:id', function (req, res) {
  // get the specific blog item
  axios.get(`${WAGTAIL_SERVER}:${WAGTAIL_PORT}/api/v2/pages?type=blog.BlogPage&slug=${req.params.id}&fields=body,author,headerimage,date`)
    .then((response) => {
      // handle success
      let blogPost = response.data.items[0];
      // format date
      blogPost.date = luxon.DateTime.fromISO(response.data.items[0].date).toLocaleString(luxon.DateTime.DATE_FULL);

      axios.get(`${WAGTAIL_SERVER}:${WAGTAIL_PORT}/api/v2/pages?type=blog.BlogPage&fields=intro,thumbnail,author,date`)
        .then((response) => {
          // handle success
          let posts = response.data.items;

          // sort posts via date
          posts.sort((a, b) => {
            return luxon.DateTime.fromISO(b.date) - luxon.DateTime.fromISO(a.date);
          });

          // remove the current post from the list
          posts = posts.filter((post) => {
            return post.meta.slug !== req.params.id;
          });

          // limit the posts to 3
          posts = posts.slice(0, 3);

          // format date
          posts.forEach((post) => {
            post.date = luxon.DateTime.fromISO(post.date).toLocaleString(luxon.DateTime.DATE_FULL);
          });

          blogPost.posts = posts;

          // render the post
          res.render('blog-post', blogPost);
        });

    }).catch((error) => {
      // handle error
      console.log(error);
      res.render('404');
    });
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.get('/who', function (req, res) {
  res.render('who');
});

app.get('/frameworks', function (req, res) {
  res.render('frameworks');
});

app.get('/contact', function (req, res) {
  res.render('contact');
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

app.get('/downloads/digital-academy', (req, res) => res.download('./public/pdf/digital-academy.pdf'));


app.use((req, res) => {
  res.status(404);
  res.render('404');
});

app.use((err, req, res, next) => {
  res.status(500);
  res.render('500');
});

app.listen(process.env.PORT || 8080, () => {winston.log('info', 'server started on 8080')});
