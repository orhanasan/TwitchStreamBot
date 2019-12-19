exports.botConfig = {
    bot_token: "BOT TOKEN HERE",
    channel_name: "CHANNEL NAME HERE",
    bot_username: "BOT NAME HERE",
    link_spam_protection: {
        excludedRoles: [
            'moderator',
            'broadcaster',
            'vip',
        ],
        excludedLinks: [
            'clips.twitch.com',
            'google.com',
        ],
        timeout: 5,
    },
    spam_protection: {
        timeout: 5,
    },
    blacklist_protection: {
        timeout: 10,
    },
    isLocal: true,
};

exports.spotifyConfig = {
    client_id: "SPOTIFY API CLIENT ID",
    client_secret: "SPOTIFY API CLIENT SECRET",
};

exports.twitchConfig = {
    client_id: 'TWITCH API CLIENT ID',
    client_secret: 'TWITCH API CLIENT SECRET',
};

exports.discordConfig = {
    bot_token: 'DISCORD API BOT TOKEN',
};

exports.serverConfig = {
    hostname: 'localhost',
    port: 30000,
};