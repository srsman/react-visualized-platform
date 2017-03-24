"use strict"

const request = require('request');
const cheerio = require('cheerio');
var path = require('path');
const AV = require('leancloud-storage');

AV.init({
  appId: 'SiuLQajWrKuR3zDPRzfAOV1L-gzGzoHsz',
  appKey: '8pYRy3bB7zDxolBkT5WyGOQJ'
});

const log = function () {
  console.log.apply(console, arguments)
}

const Data = function () {
  this.name = ''
  this.value = 0
}

const dataFromJSON = function (data, json) {
  var airObjects = JSON.parse(json)
  for (var i = 0; i < airObjects.length; i++) {
    var airObject = airObjects[i]
    var object = new Data()

    object.name = airObject.CITY.split('市')[0]
    object.value = parseInt(airObject.AQI)
    data.push(object)
  }
}

const jsonFromBody = function (body) {
  const options = {
    decodeEntities: false
  }

  const e = cheerio.load(body, options)
  const json = e('#gisDataJson').attr('value')

  return json
}

const writeToFile = function (path, data) {
  const fs = require('fs');
  fs.writeFile(path, data, function (error) {
    if (error !== null) {
      log('写入失败', path)
    } else {
      log('写入成功', path)
    }
  })
}

const cachedUrl = function (pageNum, callback) {
  const fs = require('fs');
  var formData = {
    'page.pageNo': `${pageNum}`,
    'xmlname': '1462259560614'
  }

  var postData = {
    url: 'http://datacenter.mep.gov.cn:8099/ths-report/report!list.action',
    formData
  }

  const path = __dirname + `/list.action!${pageNum}`

  fs.readFile(path, function (err, data) {
    if (err !== null) {
      request.post(postData, function (error, response, body) {
        if (error === null) {
          writeToFile(path, body)
          callback(error, response, body)
        }
      })
    } else {
      const response = {
        statusCode: 200
      }
      callback(null, response, data)
    }
  })
}

Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1,
    "d+": this.getDate(),
    "h+": this.getHours(),
    "m+": this.getMinutes(),
    "s+": this.getSeconds(),
    "q+": Math.floor((this.getMonth() + 3) / 3),
    "S": this.getMilliseconds()
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}


const main = function () {
  const data = [];
  const path = __dirname + '/data.json';
  const date = new Date().Format('yyyy-MM-dd');
  var FogData = AV.Object.extend('FogData');

  var fogData = new FogData();
  fogData.set('time', date);

  for (var i = 1; i < 11; i++) {
    cachedUrl(i, function (error, response, body) {
      if (error === null && response.statusCode === 200) {
        const json = jsonFromBody(body)
        dataFromJSON(data, json);
        fogData.set('data', data);
        fogData.save().then(function (data) {
          log('success');
        }, function (error) {
          log('error', error)
        });
      } else {
        log('请求失败', error)
      }
    })
  }
}

main()