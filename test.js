const nconf = require('nconf');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');
const GetHipChatMessageStats = require('./index');

const { rooms, dataDir = './data', endDate } = require('./input.json');

nconf.argv()
  .env()
  .file({ file: '.env.json' });

if (!fs.existsSync(dataDir)){
  fs.mkdirSync(dataDir);
}

const getHipChatMessageStats = GetHipChatMessageStats({ hipChatApiUrl: nconf.get('HIPCHAT_API_URL'), hipchatToken: nconf.get('HIPCHAT_TOKEN') });

Promise.map(rooms, async (room) => {
  const result = await getHipChatMessageStats.getRoomHistory(room, { 'end-date': endDate })
  await Promise.promisify(fs.writeFile)(`${dataDir}/${room}.json`, JSON.stringify(result, null, 2), 'utf8');
});
