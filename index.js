const Parser = require("rss-parser");
const parser = new Parser();
const { Client, Intents } = require("discord.js");
const dotenv = require("dotenv");
const CronJob = require("cron").CronJob;

dotenv.config();

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
  disableEveryone: false,
});
const token = process.env.TOKEN;
// const token =
const getLatestRSS = async (link, slice = 3) => {
  const feed = await parser.parseURL(link);
  return feed.items.slice(0, slice);
};

const getLatestMessages = async (channel, limit = 3) => {
  const latest_message = await channel.messages.fetch({ limit: limit });
  return latest_message.map((a) => a.content);
};
const rssToMessage = (data) => {
  if (!data) return "";
  const message = `**${data?.title || ""}**\n\n${data.contentSnippet}\n\n${
    data.link
  }\n\n@everyone`;
  return message;
};
const postDifference = (messages, posts) => {
  const post_messages = [];
  posts.forEach((element) => {
    post_messages.push(rssToMessage(element));
  });
  const difference = post_messages.filter((x) => !messages.includes(x));

  return difference;
};
const sendMessages = async (channel, messages) => {
  for (let i = 0; i < messages.length; i++) {
    await channel.send(messages[i]);
  }
};

const updateMessages = async (channel, link) => {
  const rss_data = await getLatestRSS(link, 3);
  const latest_messages = await getLatestMessages(channel, 3);
  console.log(postDifference(latest_messages, rss_data));
  await sendMessages(channel, postDifference(latest_messages, rss_data));
};
const start = async () => {
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);

  var job = new CronJob(
    "* * * * *",
    async function () {
      console.log("RUNNING");
      await updateMessages(channel, process.env.LINK);
    },
    null,
    true,
    "America/Los_Angeles"
  );
  job.start();
};

client.once("ready", start);

client.login(token);
//https://discord.com/oauth2/authorize?client_id=992197103357018213&scope=bot&permissions=68608
