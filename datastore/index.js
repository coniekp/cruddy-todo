const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const counter = require('./counter');
const Promise = require('bluebird');

const promisifiedReadFile = Promise.promisify(fs.readFile);

var items = {};

// Public API - Fix these CRUD functions ///////////////////////////////////////

exports.create = (text, callback) => {
  counter.getNextUniqueId((err, id) => {
    var filePath = path.join(exports.dataDir, `${id}.txt`);
    fs.writeFile(filePath, text, (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null, {id, text});
      }
    });
  });
};

exports.readOne = (id, callback) => {
  var filePath = path.join(exports.dataDir, `${id}.txt`);
  fs.readFile(filePath, (err, text) => {
    if (err) {
      callback (new Error(`No item with id: ${id}`));
    } else {
      callback(null, {id: id, text: text.toString()});
    }
  });
  //data's map func needs a return value, but fs.readfile is async so will not return the expected data 
  //  => need to instead promisify readfile && do work on return promise
  //map should turn an array of files into an array of promisses. when promises come back, we can call .all on the returned values
};

exports.readAll = (callback) => {

  fs.readdir(exports.dataDir, (err, files) => {

    if (err) {
      throw (err);
    } 
    
    var data = _.map(files, (file) => {
      var id = path.basename(file, '.txt');
      let filePath = path.join(exports.dataDir, `${id}.txt`);
      return promisifiedReadFile(filePath).then((text) => { 
        return {id: id, text: text.toString()};
      });
    });

    Promise.all(data).then((data) => callback(null, data), (err) => callback(err));
  });
};

exports.update = (id, text, callback) => {
  var filePath = path.join(exports.dataDir, `${id}.txt`);
  fs.readFile(filePath, (err) =>{
    if (err) {
      callback (new Error(`No item with id: ${id}`));
    } else {
      fs.writeFile(filePath, text, (err) => {
        if (err) { throw err; }
        callback(null, text.toString());
      });
    }
  });
};

exports.delete = (id, callback) => {
  var filePath = path.join(exports.dataDir, `${id}.txt`);
  fs.unlink(filePath, (err) =>{
    if (err) {
      callback(new Error(`No item with id: ${id}`));
    } else {
      callback();
    }
  });
};

// Config+Initialization code -- DO NOT MODIFY /////////////////////////////////

exports.dataDir = path.join(__dirname, 'data');

exports.initialize = () => {
  if (!fs.existsSync(exports.dataDir)) {
    fs.mkdirSync(exports.dataDir);
  }
};
