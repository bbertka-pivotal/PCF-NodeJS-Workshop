var path = require('path'),
    config, mysql;

var env = process.env.NODE_ENV || 'development';
var production = env == 'production';

var appEnv = {};
var sqlCredentials = {};
var mailCredentials = {};
var appUrl = null;
var config = {
    development: {
      url: 'http://localhost:2368',
      database: {
        client: 'sqlite3',
        connection: {
            filename: path.join(__dirname, '/content/data/ghost-dev.db')
        },
        debug: true
      },
      server: {
        host: '127.0.0.1',
        port: '2368'
      },
      paths: {
        contentPath: path.join(__dirname, '/content/')
      }
    }
};

if (production) {
  var cfEnv = require("cfenv");
  var pkg   = require("./package.json");
  var appEnv = cfEnv.getAppEnv();
  appUrl = appEnv.url;
  // because expressjs thinks that the X-Forward-Proto header is "http" instead of "https"
  appUrl = appUrl.replace("https://", "http://")
  console.log("App URL: " + appUrl);
  console.log(appEnv);
  console.log(appEnv.getServices());
  var sqlCredentials = appEnv.getServiceCreds(/ghost-db/);
  var mailCredentials = appEnv.getServiceCreds(/gmail/);
  var s3Credentials = appEnv.getServiceCreds(/s3/);

  console.log(sqlCredentials);
  console.log(mailCredentials);
  console.log(s3Credentials);

  config['production'] = {
    url: appUrl,
    database: {
      client: 'mysql',
      connection: {
        host     : sqlCredentials.hostname,
        user     : sqlCredentials.username,
        password : sqlCredentials.password,
        database : sqlCredentials.name,
        charset  : 'utf8'
      }
    },
    server: {
      host: appEnv.bind,
      port: appEnv.port
    },
    logging: false
  }

  if (s3Credentials !== null) {
    config['production']['storage'] = {
        active: 'ghost-s3',
        'ghost-s3': {
            accessKeyId: s3Credentials['access_key_id'],
            secretAccessKey: s3Credentials['secret_access_key'],
            bucket: s3Credentials['bucket'] || s3Credentials['aws_bucket'],
            region: s3Credentials['region'] || s3Credentials['aws_region'] || 'us-east-1',
            // assetHost: s3Credentials[''],
        }
    }
  }

  // Gmail settings
  // Be sure to allow IoT (less secure) apps http://www.google.com/settings/security/lesssecureapps
  if (mailCredentials !== null) {
    config['production']['mail'] = {
      transport: 'SMTP',
      service: 'Gmail',
      options: {
        host: 'smtp.gmail.com',
        port: 465,
        secureConnection: true,
        auth: {
          user: mailCredentials.user,
          pass: mailCredentials.pass,
        }
      }
    }
  }
}

module.exports = config;
