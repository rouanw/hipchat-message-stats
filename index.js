const request = require('superagent');
const nconf = require('nconf');
const Promise = require('bluebird');
const querystring = require('querystring');
const _ = require('lodash');
const fs = require('fs');

const { rooms, dataDir = './data', endDate } = require('./input.json');
const PER_PAGE = 1000;

nconf.argv()
  .env()
  .file({ file: '.env.json' });

const defaultOpts = _.pickBy({
  auth_token: nconf.get('HIPCHAT_TOKEN'),
  'max-results': PER_PAGE,
  include_deleted: false,
  date: new Date().toISOString(),
  'end-date': endDate,
  reverse: false,
}, item => item !== undefined);

const historyUrl = (roomName, opts) => `${nconf.get('HIPCHAT_API_URL')}/room/${encodeURIComponent(roomName)}/history?${querystring.stringify(opts)}`;

const getHistory = async (roomName) => {
  let messages = [];
  let items;
  let lastMessageDate;
  let firstMessageDate;
  let offset = 0;
  do {
    let response;
    try {
      response = await request.get(historyUrl(roomName, Object.assign({}, defaultOpts, { 'start-index': offset })));
    } catch (error) {
      console.error(error);
      break;
    };
    const { body } = response;
    items = body.items;
    if (items.length === 0) {
      break;
    }
    lastMessageDate = lastMessageDate || _.first(items).date;
    firstMessageDate = _.last(items).date || firstMessageDate;
    messages = [].concat(messages, items);
    offset += PER_PAGE;
  } while (true);
  const metadata = { firstMessageDate, lastMessageDate, numberOfMessages: _.filter(messages, 'from.name').length };
  const counts = _(messages)
    .filter('from.name')
    .groupBy('from.name')
    .map((msgs, name) => ({ name, count: msgs.length }))
    .orderBy('count', 'desc')
    .value();
  const result = { metadata, counts };
  await Promise.promisify(fs.writeFile)(`${dataDir}/${roomName}.json`, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Got stats for ${roomName}`);
};

if (!fs.existsSync(dataDir)){
  fs.mkdirSync(dataDir);
}

Promise.map(rooms, getHistory);
