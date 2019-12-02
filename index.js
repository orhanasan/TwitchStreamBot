const config = require('./config');
const tmi = require('tmi.js');
const request = require('request');
const fs = require('fs');
const SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi;

const opts = {
    identity: {
        username: config.botConfig.bot_username,
        password: config.botConfig.bot_token,
    },
    channels: [
        config.botConfig.channel_name
    ]
};

var commandContainer = [];
var blacklistedWords = [];
var permittedList = [];

let specialCommandsContainer = [
    {
        name: 'komutekle',
        function: (msg, target, context) => {
            if (modCheck(context)){
                errorHandler(target, context['display-name'], `Permissions do not match for command execution: komutekle`, `Bu komutu kullanmaya izniniz yok!`);
                return;
            }
            try {
                const commandPayload = msg.substring(11);
                const parsedArray = commandPayload.split(' ');

                if (parsedArray.length < 4) {
                    errorHandler(target, context['display-name'], `Argument count do not match for command execution: komutekle`, `En az 4 tane parametre gerekiyor!`);
                    return;
                }
                var jsonObj = {};
                jsonObj['name'] = parsedArray[0];
                jsonObj['argCount'] = parsedArray[1];
                jsonObj['permedRoles'] = parseInt(parsedArray[2]) == 0 ? [] : parsedArray.slice(3, 3 + parseInt(parsedArray[2]));
                const spaceCount = 3 + parseInt(parsedArray[2]);

                var elapsed = 0;
                var spacePos = -1;
                for (let index = 0; index < commandPayload.length; index++) {
                    if (commandPayload.charAt(index) == ' ')
                        elapsed++;

                    if (elapsed == spaceCount) {
                        spacePos = index + 1;
                        break;
                    }
                }

                jsonObj['function'] = `(params, client, context, msg, target, config) => {${commandPayload.substring(spacePos)}}`;

                commandContainer.push(jsonObj);
                fs.writeFileSync(`./${target}.json`, JSON.stringify({commands: commandContainer, blacklistedWords: blacklistedWords}), {flag: 'w'});
                errorHandler(target, context['display-name'], `New command added: ${jsonObj.name}`, 'Komut başarı ile eklendi!');
            } catch (error) {
                errorHandler(target, context['display-name'], `Wrong syntax for adding command. Input: ${msg.substring(11)}`, 'Sentaks yanlış!');
            }
        }
    },
    {
        name: 'sözekle',
        function: (msg, target, context) => {
            if (modCheck(context)){
                errorHandler(target, context['display-name'], `Permissions do not match for command execution: sözekle`, `Bu komutu kullanmaya izniniz yok!`);
                return;
            }
            try {
                const commandPayload = msg.substring(9);
                const parsedArray = commandPayload.split(' ');
                console.log(JSON.stringify(parsedArray));

                if (parsedArray.length < 2) {
                    errorHandler(target, context['display-name'], `Argument count do not match for command execution: sözekle`, `En az 2 tane parametre gerekiyor!`);
                    return;
                }
                var jsonObj = {};
                jsonObj['name'] = parsedArray[0];
                jsonObj['argCount'] = 0;
                jsonObj['permedRoles'] = [];
                var spacePos = commandPayload.indexOf(' ');

                jsonObj['function'] = `(params, client, context, msg, target, config) => {client.say(target, '${commandPayload.substring(spacePos)}')}`;

                commandContainer.push(jsonObj);
                fs.writeFileSync(`./${target}.json`, JSON.stringify({commands: commandContainer, blacklistedWords: blacklistedWords}), {flag: 'w'});
                errorHandler(target, context['display-name'], `New command added: ${jsonObj.name}`, 'Komut başarı ile eklendi!');
            } catch (error) {
                errorHandler(target, context['display-name'], `Wrong syntax for adding command. Input: ${msg.substring(11)}`, 'Sentaks yanlış!');
            }
        }
    },
    {
        name: 'komutsil',
        function: (msg, target, context) => {
            if (modCheck(context)){
                errorHandler(target, context['display-name'], `Permissions do not match for command execution: komutsil`, `Bu komutu kullanmaya izniniz yok!`);
                return;
            }
            try {
                const commandPayload = msg.substring(10);

                let pos = -1;
                for (let index = 0; index < commandContainer.length; index++) {
                    if (commandContainer[index]['name'] == commandPayload) {
                        pos = index;
                        break;
                    }
                }

                if (pos != -1) {
                    commandContainer.splice(pos, 1);
                    fs.writeFileSync(`./${target}.json`, JSON.stringify({commands: commandContainer, blacklistedWords: blacklistedWords}), {flag: 'w'});
                    errorHandler(target, context['display-name'], `Command is deleted: ${commandPayload}`, 'Komut başarı ile silindi!');
                }
            } catch (error) {
                errorHandler(target, context['display-name'], `Wrong syntax for adding command. Input: ${msg.substring(11)}`, 'Sentaks yanlış!');
            }
        }
    },
    {
        name: 'komutlar',
        function: (msg, target, context) => {
            try {
                var string = "";
                var totalContainer = commandContainer.concat(specialCommandsContainer);
                totalContainer.forEach((value, index) => {
                    string += "!" + value['name'];
                    if (index < totalContainer.length - 1)
                        string += " ";
                })

                client.say(target, `Mevcut komutlar: ${string}`);
            } catch (error) {
                errorHandler(target, context['display-name'], `Wrong syntax for adding command. Input: ${msg.substring(11)}`, 'Sentaks yanlış!');
            }
        }
    },
    {
        name: 'uptime',
        function: (msg, target, context) => {
            try {
                client.api({
                    url: `https://api.twitch.tv/helix/streams?user_login=${target.substring(1)}&first=20`,
                    headers: {
                        "Client-ID": config.botConfig.client_id
                    }
                }, (err, res, body) => {
                    if (body.data.length == 0) {
                        client.say(target, 'Yayın açık değil');
                    }
                    const startedAt = Date.parse(body.data[0].started_at);
                    var msecs = Math.abs(new Date() - startedAt);

                    const days = Math.floor(msecs / (1000 * 60 * 60 * 24));
                    msecs -= days * 1000 * 60 * 60 * 24;
                    const hours = Math.floor(msecs / (1000 * 60 * 60));
                    msecs -= hours * 1000 * 60 * 60;
                    const mins = Math.floor((msecs / (1000 * 60)));
                    msecs -= mins * 1000 * 60;
                    const secs = Math.floor(msecs / 1000);
                    msecs -= secs * 1000;

                    var string = "";
                    if (days > 0)
                        string += `${days} gün `
                    if (hours > 0)
                        string += `${hours} saat `
                    if (mins > 0)
                        string += `${mins} dakika `
                    if (secs > 0)
                        string += `${secs} saniye `

                    string = string.trim();

                    client.say(target, `Yayının başlangıcından itibaren ${string} geçti!`)
                });
            }
            catch(error) {
                errorHandler(target, context['display-name'], `An error occured: ${error.toString()}`, 'Şu anda çalışamamaktayım!');
            }
        }
    },
    {
        name: 'blacklist',
        function: (msg, target, context) => {
            try {
                if (modCheck(context)){
                    errorHandler(target, context['display-name'], `Permissions do not match for command execution: blacklist`, `Bu komutu kullanmaya izniniz yok!`);
                    return;
                }
                const comms = msg.split(' ');
                if (comms[1] == 'ekle') {
                    if (blacklistedWords.findIndex((value) => {return value == comms[2]}) == -1) {
                        blacklistedWords.push(comms[2]);
                        fs.writeFileSync(`./${target}.json`, JSON.stringify({commands: commandContainer, blacklistedWords: blacklistedWords}), {flag: 'w'});
                        client.say(target, 'Kelime başarı ile blackliste eklendi');
                    }
                    else
                        errorHandler(target, context['display-name'], `A word that already is blacklisted is tried to be added to blacklist`, 'Olan bir kelimeyi blacklist olarak eklediniz!');
                }
                else if (comms[1] == 'sil') {
                    const ind = blacklistedWords.findIndex((value) => {return value == comms[2]});
                    if (ind != -1) {
                        blacklistedWords.splice(ind, 1);
                        fs.writeFileSync(`./${target}.json`, JSON.stringify({commands: commandContainer, blacklistedWords: blacklistedWords}), {flag: 'w'});
                        client.say(target, 'Kelime başarı ile blacklisten silindi');
                    }
                    else
                        errorHandler(target, context['display-name'], `A word that is not blacklisted is tried to be removed from blacklist`, 'Olmayan bir kelimeyi blacklisten silmeye çalıştınız!');
                }

            } catch(error) {
                errorHandler(target, context['display-name'], `An error occured: ${error.toString()}`, 'Şu anda çalışamamaktayım!');
            }
        }
    },
    {
        name: 'permit',
        function: (msg, target, context) => {
            try {
                if (modCheck(context)){
                    errorHandler(target, context['display-name'], `Permissions do not match for command execution: permit`, `Bu komutu kullanmaya izniniz yok!`);
                    return;
                }
                const comms = msg.split(' ');

                permittedList.push(comms[1]);
                setTimeout(() => {
                    const ind = permittedList.findIndex((value) => { return value == comms[1]; })
                    permittedList.splice(ind, 1);
                }, parseInt(comms[2]) * 60 * 1000);
                client.say(target, `${comms[1]} adlı kullanıcı ${comms[2]} dakika boyunca link atabilecek!`)
            } catch(error) {
                errorHandler(target, context['display-name'], `An error occured: ${error.toString()}`, 'Şu anda çalışamamaktayım!');
            }
        }
    }
];

if (config.spotifyConfig) {
    var credentials = {
        clientId: config.spotifyConfig.client_id,
        clientSecret: config.spotifyConfig.client_secret,
        redirectUri: 'http://localhost'
    };

    var spotifyApi = new SpotifyWebApi(credentials);

    var scopes = ['user-read-private', 'user-read-email', 'user-read-currently-playing'];
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, '');
    console.log(authorizeURL);

    // Retrieve an access token and a refresh token
    spotifyApi.clientCredentialsGrant().then(
        function(data) {
            console.log('The access token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
        
            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body['access_token']);

            specialCommandsContainer = specialCommandsContainer.concat([
                {
                    name: 'playing',
                    function: (msg, target, context) => {
                        spotifyApi.getMyCurrentPlaybackState({}).then((data) => {
                            const response = data.body.item;
                            if (data.body.is_playing) {
                                var artists = "";
                                for (let index = 0; index < response.artists.length; index++) {
                                    const element = response.artists[index];

                                    artists += element.name;

                                    if (index < response.artists.length - 1)
                                        artists += ", ";
                                }

                                client.say(target, `Şu an çalan şarkı: ${artists} - ${response.name}`);
                            }
                            else {
                                errorHandler(target, context['display-name'], `Currently playing song cannot be found.`, 'Çalınan şarkı bulunamadı!');
                            }
                        }, (err) => {
                            errorHandler(target, context['display-name'], err.toString(), 'Çalınan şarkı bulunamadı!');
                        });
                    }
                }
            ])
        },
        function(err) {
            console.log('Something went wrong!', err);
        }
    );
}

if (fs.existsSync(`./#${config.botConfig.channel_name.toLowerCase()}.json`)) {
    const rawData = fs.readFileSync(`./#${config.botConfig.channel_name.toLowerCase()}.json`);
    const obj = JSON.parse(rawData);
    commandContainer = obj.commands;
    blacklistedWords = obj.blacklistedWords;
}

const client = tmi.Client(opts);

var lastRequest = new Date();
const messageHandler = (target, context, msg, self) => {
    if (self) return;

    linkCheck(msg, context, target);
    blacklistCheck(msg, context, target);

    msg = msg.trim();
    const splitInput = msg.split(' ');
    if (splitInput[0].charAt(0) != '!')
        return;

    if (new Date() - lastRequest <= config.botConfig.spam_protection.timeout * 1000)
        return;

    lastRequest = new Date();
    for (let index = 0; index < specialCommandsContainer.length; index++) {
        const element = specialCommandsContainer[index];

        if ('!' + element['name'] == splitInput[0]) {
            element.function(msg, target, context);
            break;
        }
    }

    const commandName = splitInput[0].substring(1);

    const commandContainerLength = commandContainer.length;

    for (let index = 0; index < commandContainerLength; index++) {
        const element = commandContainer[index];

        if (element.name == commandName) {
            if (splitInput.length === parseInt(element.argCount) + 1) {
                var isAllowed = true;
                if (element.permedRoles.length != 0) {
                    isAllowed = false;

                    const currentRoles = context['badges'];
                    if (currentRoles != null) {
                        element.permedRoles.forEach(role => {
                            if (currentRoles[role] == '1')
                                isAllowed = true;
                        });
                    }
                }

                if (isAllowed) {
                    params = splitInput.slice(1);
                    var func = new Function(`return ${element.function}`)();

                    try {
                        func(params, client, context, msg, target, config);
                    }
                    catch (error) {
                        errorHandler(target, context['display-name'], error.toString(), 'Bir hata meydana geldi!');
                    }
                }
                else
                    errorHandler(target, context['display-name'], `Permissions do not match for command execution: ${element.name}`, 'Bu komutu kullanmaya izniniz yok!');
            }
            else
                errorHandler(target, context['display-name'], `Wrong command execution: ${element.name}`, `Yanlış komut kullanımı! ${element.argCount} tane argüman girmeniz gerekiyor!`);
            break;
        }
    }
}

const exMessageHandler = (target, context, msg, self) => {
    if (context['display-name'] === 'deterministvemateryalist2')
        return;
    console.log(msg + " Rol: " + JSON.stringify(context['badges']));
}

const connectedHandler = (addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);
}

client.on('message', messageHandler);
client.on('connected', connectedHandler);

client.connect();

const errorHandler = (channel, sender, errorString, errorMessage) => {
    client.say(channel, errorMessage);
    console.log(errorString);
    fs.writeFileSync('./errors.txt', `[ERROR] | ${new Date().toString()} | Sender: ${sender} | Channel: ${channel} | Error Message: ${errorString}\n`, {flag: 'a'});
}

const modCheck = (context) => {
    return context['mod'] != true && (context['badges'] == null || (context['badges'] != null && context['badges']['broadcaster'] != '1'));
}

const linkCheck = (msg, context, target) => {
    if (msg.match(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g) != null) {
        const excludedLinks = config.botConfig.link_spam_protection.excludedLinks;
        var isExcluded = false;
        for (let index = 0; index < excludedLinks.length; index++) {
            const element = excludedLinks[index];

            if (msg.match(element) !== null) {
                isExcluded = true;
                break;
            }
        }

        if (!isExcluded) {
            if (context['badges'] == null) {
                var excludedLinksStr = "";
                for (let index = 0; index < excludedLinks.length; index++) {
                    const element = excludedLinks[index];

                    excludedLinksStr += element;

                    if (index < excludedLinks.length - 1)
                        excludedLinksStr += ", ";
                }
                client.say(target, `${context['display-name']}, link göndermek yasak! Sadece ${excludedLinksStr} sitelerinden link gönderebilirsin!`);
                client.timeout(target, context['username'], config.botConfig.link_spam_protection.timeout, 'Link atmak'); // Purge
                return;
            }

            const excludedRoles = config.botConfig.link_spam_protection.excludedRoles;
            for (let index = 0; index < excludedRoles.length; index++) {
                const element = excludedRoles[index];

                if (context['badges'][element] == 1) {
                    isExcluded = true;
                    break;
                }
            }

            if (!isExcluded) {
                const user = context['username'].toLowerCase();
                if (permittedList.findIndex((value) => { return value == user; }) == -1) {
                    var excludedLinksStr = "";
                    for (let index = 0; index < excludedLinks.length; index++) {
                        const element = excludedLinks[index];

                        excludedLinksStr += element;

                        if (index < excludedLinks.length - 1)
                            excludedLinksStr += ", ";
                    }
                    client.say(target, `${context['display-name']}, link göndermek yasak! Sadece ${excludedLinksStr} sitelerinden link gönderebilirsin!`);
                    client.timeout(target, context['username'], config.botConfig.link_spam_protection.timeout, 'Link atmak'); // Purge
                }
            }
        }
    }
}

const blacklistCheck = (msg, context, target) => {
    if (modCheck(context)) {
        msg = msg.toLowerCase();
        for (let index = 0; index < blacklistedWords.length; index++) {
            const element = blacklistedWords[index].toLowerCase();

            if (msg.match(element) != null) {
                client.say(target, `${context['display-name']}, blacklistteki bir kelimeyi göndermek yasak!`);
                client.timeout(target, context['username'], config.botConfig.blacklist_protection.timeout, 'Blacklisted kelime'); // Purge
                return;
            }
        }
    }
}