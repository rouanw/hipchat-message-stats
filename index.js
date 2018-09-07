const request = require('superagent');
const querystring = require('querystring');
const _ = require('lodash');

const PER_PAGE = 1000;

const defaultOpts = {
  'max-results': PER_PAGE,
  include_deleted: false,
  reverse: false,
};

const _getHistory = async (roomName, options, hipChatApiUrl) => {
  let messages = [];
  let items;
  let lastMessageDate;
  let firstMessageDate;
  let offset = 0;
  do {
    let response;
    try {
      const opts = Object.assign({}, options, { 'start-index': offset });
      const historyUrl = `${hipChatApiUrl}/room/${encodeURIComponent(roomName)}/history?${querystring.stringify(opts)}`;
      response = await request.get(historyUrl);
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
  return { metadata, counts, messages };
};

module.exports = ({ hipChatApiUrl, hipchatToken }) => ({
  getRoomHistory(roomName, options) {
    const mergedOptions = _.pickBy(Object.assign(
      { date: new Date().toISOString() },
      defaultOpts,
      options,
      { auth_token: hipchatToken },
    ), item => item !== undefined);
    return _getHistory(roomName, mergedOptions, hipChatApiUrl);
  },
});
