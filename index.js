const request = require('superagent');
const nconf = require('nconf');
const Promise = require('bluebird');
const querystring = require('querystring');
const _ = require('lodash');
const fs = require('fs');

const { rooms, dataDir = './data', endDate } = require('./input.json');

nconf.argv()
  .env()
  .file({ file: '.env.json' });

const defaultOpts = _.pickBy({
  auth_token: nconf.get('HIPCHAT_TOKEN'),
  'max-results': 1000,
  include_deleted: false,
  'end-date': endDate,
  reverse: false,
}, item => item !== undefined);

const historyUrl = (roomName, opts) => `${nconf.get('HIPCHAT_API_URL')}/room/${encodeURIComponent(roomName)}/history?${querystring.stringify(opts)}`;

const getHistory = async (roomName) => {
  const { body } = await request.get(historyUrl(roomName, defaultOpts));
  const { items: messages } = body;
  const lastMessageDate = _.first(messages).date;
  const firstMessageDate = _.last(messages).date;
  const metadata = { firstMessageDate, lastMessageDate };
  const counts = _(messages)
    .filter('from.name')
    .groupBy('from.name')
    .map((msgs, name) => ({ name, count: msgs.length }))
    .orderBy('count', 'desc')
    .value();
  const result = { metadata, counts };
  await Promise.promisify(fs.writeFile)(`${dataDir}/${roomName}.json`, JSON.stringify(result, null, 2), 'utf8');
};

if (!fs.existsSync(dataDir)){
  fs.mkdirSync(dataDir);
}

Promise.map(rooms, getHistory);
