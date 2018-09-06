# Hipchat message stats

Fetches message counts per person in your HipChat rooms. Useful while HipChat is around, [which won't be long](https://slackhq.com/atlassian-and-slack-partnership).

To use it:

1. Clone this repo

2. Create a `.env.json` file in the root of the project. It needs your HipChat API URL and your API token. E.g.

```json
{
  "HIPCHAT_TOKEN": "SOSECRET",
  "HIPCHAT_API_URL": "https://mycompany.hipchat.com/v2"
}
```

3. Create an `input.json` file in the root of the project. Specify the date of the OLDEST message to fetch and a list of rooms:

```json
{
  "endDate": "2018-06-01T00:00:00.000Z",
  "rooms": [
    "Fun Chat",
    "Running Room",
    "Gnome Sharing"
  ]
}
```

4. Run `node index.js` (tested with node 8)

You'll get a json file in the `./data` directory for each room. It will look something like:

```json
{
  "metadata": {
    "firstMessageDate": "2018-06-01T05:44:06.561731+00:00",
    "lastMessageDate": "2018-09-06T10:07:56.979518+00:00",
    "numberOfMessages": 1046
  },
  "counts": [
    {
      "name": "Ada Lovelace",
      "count": 217
    },
    {
      "name": "Grace Hopper",
      "count": 209
    },
    {
      "name": "Katherine Johnson",
      "count": 208
    }
  ]
}
```
