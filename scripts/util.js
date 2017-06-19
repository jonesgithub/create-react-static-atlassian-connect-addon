const fs = require('fs');
const path = require('path');
const pkg = require('../package');

/**
 * Update atlassian-connect.json with the baseUrl generated by `ngrok`
 * @param  {string} baseUrl
 * @return {void}
 */
exports.updateConnectConfig = (baseUrl) => {
  const configPath = path.join(__dirname, '..', 'public', 'atlassian-connect.json');

  fs.readFile(configPath, (err, data) => {
    var config = JSON.parse(data);

    config.baseUrl = baseUrl;
    config.links = {
      config: path.join(baseUrl, 'atlassian-connect.json')
    };

    fs.writeFile(configPath, JSON.stringify(config, null, 2), (err, result) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    });
  })
};

/**
 * Overwrite `react-scripts/srcipts/start.js` or `react-scripts/srcipts/start.js`
 * to set REACT_APP_HOST env variable to be used in `public/index.html`
 * @param {string} env Environment name (dev/prod)
 * @return {void}
 */
exports.setHostVariable = (env) => {
  if (!pkg['atlassian-connect-dev-instance-host']) {
    console.error('Please specify URL of your Atlassian DEVELOPMENT instance as a value of the "atlassian-connect-dev-instance-host" in your package.json (e.g. <YOUR_COMPANY>.atlassian.com).');
    process.exit(1);
  }

  if (!pkg['atlassian-connect-prod-instance-host']) {
    console.error('Please specify URL of your Atlassian PRODUCTION instance as a value of the "atlassian-connect-dev-instance-host" in your package.json (e.g. <YOUR_COMPANY>.atlassian.com).');
    process.exit(1);
  }

  const filePath = getFilePath(env);

  fs.readFile(filePath, 'utf-8', (err, data) => {
    var updatedScript = getUpdatedScript(env, data);

    fs.writeFile(filePath, updatedScript, (err, result) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    });
  });
};

/**
 * Get file name
 * @param {string} env Environment name (dev/prod)
 * @return {string}
 */
function getFileName(env) {
  return env === 'dev' ? 'start' : 'build';
}

/**
 * Geet file path
 * @param {string} env Environment name (dev/prod)
 * @return {string}
 */
function getFilePath(env) {
  const fileName = getFileName(env);
  return path.join(__dirname, `../node_modules/react-scripts/scripts/${fileName}.js`);
}

/**
 * Get atlassian instance host URL
 * @param {string} env    Environment name (dev/prod)
 * @return {string} host  Atlassian instance host URL
 */
function getHost(env) {
  let host = pkg[`atlassian-connect-${env}-instance-host`];
  host = !/^https:\/\//.test(host) && (host = `https://${host}`);
  return host;
}

/**
 * Get script udapted with `process.env.REACT_APP_HOST`
 * @param {string} host Atlassian instance host URL
 * @param {string} data `react-scripts` script (`start.js` or `build.js`)
 */
function getUpdatedScript(env, data) {
  const host = getHost(env);
  var updatedScript;

  if (data.includes('REACT_APP_HOST')) {
    updatedScript = data.replace(
      /\.REACT_APP_HOST.+?;/,
      `.REACT_APP_HOST = '${host}';`);
  } else {
    updatedScript = `process.env.REACT_APP_HOST = '${host}';\n${data}`;
  }

  return updatedScript;
}
