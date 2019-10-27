var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs');
var url = require('url');

var port = 9999;
var app = express();

var DOWNLOAD_DIR = './DATA/';

//wikipedia
app.get('/wikipedia', function(req, res) {

  var url = "https://en.wikipedia.org/wiki/Angel_Falls";

  // let's make the http request to the url above using the 'request' dependency
  request(url, function(error, response, html) {

    // only execute if there's no error
    if( !error ){

      // we can use the dependency 'cheerio' to traverse the DOM and use jQuery-like selectors and functions
      var $ = cheerio.load(html);

      // let's create a javascript object to save our data in
      var wiki_data = {
        img: '',
      };

      // all the content we are looking for are inside a div with the id 'content', let's filter so that the data we are working with is without unnecessary data
      $('#content').filter(function(){

        // we can access the properties of our javascript object by writing the name of the object 'dot' and then the name of the property
        wiki_data.img = $(this).find('img').attr('src');

      });

      // send the data we've stored in our object back to the browser
      res.send(wiki_data);

      fs.writeFile('./data/wiki_output.js', "var wiki_output = " + JSON.stringify(wiki_data), function(error){
        console.log("File is written successfully!");
      });
    }
  });
});


// INSTAGRAM SCRAPER: access by going to 'localhost:2100/instagram'
app.get('/instagram', function(req, res){

  // try any hashtags and see the results, make sure to write INSIDE the quotation marks
  var hashtag = 'waterfall';
  var url = 'https://instagram.com/explore/tags/'+ hashtag +'/?__a=1';

  // let's make the http request to the url above using the 'request' dependency
  request(url, function(error, response, html) {

    // only execute if there's no error
    if(!error) {

      // we can use the dependency 'cheerio' to traverse the DOM and use jQuery-like selectors and functions
      var $ = cheerio.load(html);

      // the url actually gives back already a ready to use JSON object so we just want that raw text
      var instagram_data = JSON.parse($.text());
      var instagram_urls = [];

      for(var i = 0; i < instagram_data.graphql.hashtag.edge_hashtag_to_media.edges.length; i++) {
        instagram_urls[i] = instagram_data.graphql.hashtag.edge_hashtag_to_media.edges[i].node.display_url;

        download_file_curl(instagram_data.graphql.hashtag.edge_hashtag_to_media.edges[i].node.display_url);

        // fs.createWriteStream('./data/'+[i]+'.jpg', instagram_data.graphql.hashtag.edge_hashtag_to_media.edges[i].node.display_url, function(err){
        //   console.log('File is written successfully!');
        // });
      }

      // send the data we've stored in our array back to the browser
      res.send(instagram_urls);

      // save the data we've stored in our object on our machine

    }
  });
});
var download_file_curl = function(file_url) {
 // extract the file name
 var file_name = url.parse(file_url).pathname.split('/').pop();
 // create an instance of writable stream
 var file = fs.createWriteStream(DOWNLOAD_DIR + file_name);
 // execute curl using child_process' spawn function
 var curl = spawn('curl', [file_url]);
 // add a 'data' event listener for the spawn instance
 curl.stdout.on('data', function(data) { file.write(data); });
 // add an 'end' event listener to close the writeable stream
 curl.stdout.on('end', function(data) {
   file.end();
   console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
 });
 // when the spawn child process exits, check if there were any errors and close the writeable stream
 curl.on('exit', function(code) {
   if (code != 0) {
     console.log('Failed: ' + code);
   }
 });
};

app.listen(port);
console.log('Magic happens on port ' + port);
exports = module.exports = app;
