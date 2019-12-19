const config = require('./config');
const tmi = require('tmi.js');

const opts = {
    identity: {
        username: config.botConfig.bot_username,
        password: config.botConfig.bot_token,
    },
    channels: [
        config.botConfig.channel_name
    ]
};

const client = tmi.Client(opts);

var LinkSpamMiddleWare = require('./middlewares/linkSpamCheck').linkSpamMiddleware;
var linkSpamMiddleWare = new LinkSpamMiddleWare({
    excludedRoles: config.botConfig.link_spam_protection.excludedRoles,
    excludedLinks: config.botConfig.link_spam_protection.excludedLinks,
    timeout: config.botConfig.link_spam_protection.timeout,
}, client);

var BlacklistMiddleware = require('./middlewares/blacklistCheck').blacklistMiddleware;
var blacklistMiddleware = new BlacklistMiddleware({
    channel_name: config.botConfig.channel_name,
    timeout: config.botConfig.blacklist_protection.timeout,
}, client);

var AnnounceMiddleware = require('./middlewares/announceSystem').announceMiddleware;
var announceMiddleware = new AnnounceMiddleware({
    channel_name: config.botConfig.channel_name,
}, client);

var CommandsMiddleware = require('./middlewares/commands').commandsMiddleware;
var commandsMiddleware = new CommandsMiddleware({
    channel_name: config.botConfig.channel_name,
    client_id: config.botConfig.client_id,
    spotifyConfig: config.spotifyConfig,
    twitchConfig: config.twitchConfig,
    serverConfig: config.serverConfig,
    isLocal: config.botConfig.isLocal,
    timeout: config.botConfig.spam_protection.timeout,
}, client, linkSpamMiddleWare, blacklistMiddleware, announceMiddleware);

const messageHandler = (target, context, msg, self) => {
    if (self) return;

    if (!linkSpamMiddleWare.runMiddleware(msg, context, target))
        return;
    if (!blacklistMiddleware.runMiddleware(msg, context, target))
        return;
    if (!commandsMiddleware.runMiddleware(msg, context, target))
        return;
}

const connectedHandler = (addr, port) => {
    console.log('Twitch Bot is ready and up!');
}

client.on('message', messageHandler);
client.on('connected', connectedHandler);

client.connect();

exports.twitchClient = client;