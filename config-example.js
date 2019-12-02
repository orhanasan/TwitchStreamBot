exports.botConfig = {
    bot_token: "BOT OAUTH TOKEN HERE",
    channel_name: "CHANNEL NAME",
    bot_username: "BOT USERNAME",
    client_id: "TWITCH CLIENT ID HERE",
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
    }
};

exports.spotifyConfig = {
    client_id: "CLIENT ID HERE",
    client_secret: "CLIENT SECRET HERE",
};