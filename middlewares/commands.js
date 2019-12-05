const {
    modCheck,
    errorHandler,
    helpHandler
} = require('../helpers');

class Commands {
    constructor(config, client, linkSpamMiddleware, blacklistMiddleware, announceMiddleware) {
        this.channel_name = config.channel_name;
        this.client_id = config.client_id;
        this.spotify_config = config.spotifyConfig;
        this.twitch_config = config.twitchConfig;
        this.server_config = config.serverConfig;
        this.is_local = config.isLocal;
        this.timeout = config.timeout;
        this.client = client;
        this.command_container = [];
        this.linkSpamMiddleware = linkSpamMiddleware;
        this.blacklistMiddleware = blacklistMiddleware;
        this.announceMiddleware = announceMiddleware;
        this.lastRequest = new Date();
        this.fs = require('fs');
        this.spotifyApi = null;
        this.twitchApi = require('twitch-api-v5');
        this.twitchTokenOption = {
            client: {
                id: this.twitch_config.client_id,
                secret: this.twitch_config.client_secret,
            },
            auth: {
                tokenHost: 'https://id.twitch.tv/',
                authorizePath: 'oauth2/authorize',
                tokenPath: 'oauth2/token',
            }
        };
        this.twitchAuth = null;

        if (this.fs.existsSync(`./#${this.channel_name.toLowerCase()}-commands.json`)) {
            const commandsRaw = this.fs.readFileSync(`./#${this.channel_name.toLowerCase()}-commands.json`);
            this.command_container = JSON.parse(commandsRaw);
        }

        this.special_commands_container = [
            {
                name: 'komutekle',
                function: (msg, target, context) => {
                    if (!modCheck(context)) {
                        errorHandler(this.client, target, context['display-name'], `Permissions do not match for command execution: komutekle`, `Bu komutu kullanmaya izniniz yok!`);
                        return;
                    }
                    try {
                        const commandPayload = msg.substring(11);
                        const parsedArray = commandPayload.split(' ');

                        if (parsedArray.length < 4) {
                            errorHandler(this.client, target, context['display-name'], `Argument count do not match for command execution: komutekle`, `En az 4 tane parametre gerekiyor!`);
                            return;
                        }
                        var jsonObj = {};
                        jsonObj['name'] = parsedArray[0];

                        if (this.command_container.findIndex((value) => {
                                return value.name == parsedArray[0];
                            }) != -1) {
                            errorHandler(this.client, target, context['display-name'], `A command that is in container tried to be added`, `Böyle bir komut zaten mevcut!`);
                            return;
                        }

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

                        this.command_container.push(jsonObj);
                        this.fs.writeFileSync(`./${target}-commands.json`, JSON.stringify(this.command_container), {
                            flag: 'w'
                        });
                        helpHandler(this.client, target, context['display-name'], `New command added: ${jsonObj.name}`, 'Komut başarı ile eklendi!');
                    } catch (error) {
                        errorHandler(this.client, target, context['display-name'], `Wrong syntax for adding command. Input: ${msg.substring(11)}`, 'Sentaks yanlış!');
                    }
                }
            },
            {
                name: 'sözekle',
                function: (msg, target, context) => {
                    if (!modCheck(context)) {
                        errorHandler(this.client, target, context['display-name'], `Permissions do not match for command execution: sözekle`, `Bu komutu kullanmaya izniniz yok!`);
                        return;
                    }
                    try {
                        const commandPayload = msg.substring(9);
                        const parsedArray = commandPayload.split(' ');

                        if (parsedArray.length < 2) {
                            errorHandler(this.client, target, context['display-name'], `Argument count do not match for command execution: sözekle`, `En az 2 tane parametre gerekiyor!`);
                            return;
                        }
                        var jsonObj = {};
                        jsonObj['name'] = parsedArray[0];
                        if (this.command_container.findIndex((value) => {
                                return value.name == parsedArray[0];
                            }) != -1) {
                            errorHandler(this.client, target, context['display-name'], `A command that is in container tried to be added`, `Böyle bir komut zaten mevcut!`);
                            return;
                        }
                        jsonObj['argCount'] = 0;
                        jsonObj['permedRoles'] = [];
                        var spacePos = commandPayload.indexOf(' ');

                        jsonObj['function'] = `(params, client, context, msg, target, config) => {client.say(target, '${commandPayload.substring(spacePos).trim().replace('"', "\"")}')}`;

                        this.command_container.push(jsonObj);
                        this.fs.writeFileSync(`./${target}-commands.json`, JSON.stringify(this.command_container), {
                            flag: 'w'
                        });
                        helpHandler(this.client, target, context['display-name'], `New command added: ${jsonObj.name}`, 'Komut başarı ile eklendi!');
                    } catch (error) {
                        errorHandler(this.client, target, context['display-name'], `Wrong syntax for adding command. Input: ${msg.substring(9)}`, 'Sentaks yanlış!');
                    }
                }
            },
            {
                name: 'komutsil',
                function: (msg, target, context) => {
                    if (!modCheck(context)) {
                        errorHandler(this.client, target, context['display-name'], `Permissions do not match for command execution: komutsil`, `Bu komutu kullanmaya izniniz yok!`);
                        return;
                    }
                    try {
                        const commandPayload = msg.substring(10);

                        let pos = this.command_container.findIndex((value) => {
                            return value.name == commandPayload
                        });

                        if (pos != -1) {
                            this.command_container.splice(pos, 1);
                            this.fs.writeFileSync(`./${target}-commands.json`, JSON.stringify(this.command_container), {
                                flag: 'w'
                            });
                            helpHandler(this.client, target, context['display-name'], `Command is deleted: ${commandPayload}`, 'Komut başarı ile silindi!');
                        } else {
                            errorHandler(this.client, target, context['display-name'], `A command that is not in container tried to be removed`, `Böyle bir komut bulunamadı!`);
                        }
                    } catch (error) {
                        errorHandler(this.client, target, context['display-name'], `Wrong syntax for removing command. Input: ${msg.substring(11)}`, 'Sentaks yanlış!');
                    }
                }
            },
            {
                name: 'komutlar',
                function: (msg, target, context) => {
                    try {
                        var string = "";
                        var totalContainer = this.command_container.concat(this.special_commands_container);
                        totalContainer.forEach((value, index) => {
                            string += "!" + value['name'];
                            if (index < totalContainer.length - 1)
                                string += " ";
                        })

                        client.say(target, `Mevcut komutlar: ${string}`);
                    } catch (error) {
                        errorHandler(this.client, target, context['display-name'], `Wrong syntax for listing command. Input: ${msg.substring(11)}`, 'Sentaks yanlış!');
                    }
                }
            },
            {
                name: 'uptime',
                function: (msg, target, context) => {
                    try {
                        this.client.api({
                            url: `https://api.twitch.tv/helix/streams?user_login=${target.substring(1)}&first=20`,
                            headers: {
                                "Client-ID": this.twitch_config.client_id
                            }
                        }, (err, res, body) => {
                            if (body.data.length == 0) {
                                this.client.say(target, 'Yayın açık değil');
                                return;
                            } else {
                                const string = this.parseIsoString(body.data[0].started_at);

                                this.client.say(target, `Yayının başlangıcından itibaren ${string} geçti!`);
                            }
                        });
                    } catch (error) {
                        errorHandler(this.client, target, context['display-name'], `An error occured: ${error.toString()}`, 'Bu komut çalıştırılamadı!');
                    }
                }
            },
            {
                name: 'blacklist',
                function: (msg, target, context) => {
                    try {
                        if (!modCheck(context)) {
                            errorHandler(this.client, target, context['display-name'], `Permissions do not match for command execution: blacklist`, `Bu komutu kullanmaya izniniz yok!`);
                            return;
                        }
                        const args = msg.split(' ');
                        if (args[1] == 'ekle') {
                            if (this.blacklistMiddleware.addToBlacklist(args[2])) {
                                this.client.say(target, 'Kelime başarı ile blackliste eklendi');
                            } else
                                errorHandler(this.client, target, context['display-name'], `A word that already is blacklisted is tried to be added to blacklist`, 'Olan bir kelimeyi blacklist olarak eklediniz!');
                        } else if (args[1] == 'sil') {
                            if (this.blacklistMiddleware.removeFromBlacklist(args[2])) {
                                this.client.say(target, 'Kelime başarı ile blacklisten silindi');
                            } else
                                errorHandler(this.client, target, context['display-name'], `A word that is not blacklisted is tried to be removed from blacklist`, 'Olmayan bir kelimeyi blacklisten silmeye çalıştınız!');
                        }
                    } catch (error) {
                        errorHandler(this.client, target, context['display-name'], `An error occured: ${error.toString()}`, 'Bu komut çalıştırılamadı!');
                    }
                }
            },
            {
                name: 'permit',
                function: (msg, target, context) => {
                    try {
                        if (!modCheck(context)) {
                            errorHandler(this.client, target, context['display-name'], `Permissions do not match for command execution: permit`, `Bu komutu kullanmaya izniniz yok!`);
                            return;
                        }
                        const args = msg.split(' ');

                        if (args.length !== 3) {
                            errorHandler(this.client, target, context['display-name'], `Unsufficient number of arguments: !permit`, '2 tane parametre girmeniz gerekiyor!');
                            return;
                        }

                        if (this.linkSpamMiddleware.addToPermittedList(args[1], args[2]))
                            this.client.say(target, `${args[1]} adlı kullanıcı ${args[2]} dakika boyunca link atabilecek!`);
                    } catch (error) {
                        errorHandler(this.client, target, context['display-name'], `An error occured: ${error.toString()}`, 'Bu komut çalıştırılamadı!');
                    }
                }
            },
            {
                name: 'announce',
                function: (msg, target, context) => {
                    try {
                        if (!modCheck(context)) {
                            errorHandler(this.client, target, context['display-name'], `Permissions do not match for command execution: announce`, `Bu komutu kullanmaya izniniz yok!`);
                            return;
                        }
                        const args = msg.split(' ');
                        if (args[1] == 'ekle') {
                            const spaceCount = 4;

                            var elapsed = 0;
                            var spacePos = -1;
                            for (let index = 0; index < msg.length; index++) {
                                if (msg.charAt(index) == ' ') {
                                    elapsed++;
                                }

                                if (elapsed == spaceCount) {
                                    spacePos = index + 1;
                                    break;
                                }
                            }

                            console.log(spacePos);

                            const title = args[2];
                            const interval = parseInt(args[3]);
                            const body = msg.substring(spacePos);

                            if (this.announceMiddleware.addAnnounce(title, body, interval))
                                helpHandler(this.client, target, context['display-name'], `New announce added: ${title}`, 'Duyuru başarı ile eklendi');
                            else
                                errorHandler(this.client, target, context['display-name'], `A word that already is in announce liste is tried to be added to announce list`, 'Olan bir duyuruyu duyuru olarak eklediniz!');
                        } else if (args[1] == 'sil') {
                            if (this.announceMiddleware.removeAnnounce(args[2])) {
                                helpHandler(this.client, target, context['display-name'], `An announce removed: ${title}`, 'Duyuru başarı ile silindi');
                            } else
                                errorHandler(this.client, target, context['display-name'], `A word that is not in announce list is tried to be removed from announce list`, 'Olmayan bir duyuruyu silmeye çalıştınız!');
                        }
                    } catch (error) {
                        errorHandler(this.client, target, context['display-name'], `An error occured: ${error.toString()}`, 'Bu komut çalıştırılamadı!');
                    }
                }
            }
        ]

        if (this.spotify_config && this.twitch_config) {
            var express = require('express');
            var app = express();

            if (!this.is_local) {
                app.get('/register_spotify', (req, res) => {
                    var scopes = ['user-read-private', 'user-read-email', 'user-read-currently-playing', 'user-read-playback-state'];
                    var spotifyAuthorizeURL = this.spotifyApi.createAuthorizeURL(scopes, 'state');

                    res.redirect(spotifyAuthorizeURL);
                });

                app.get('/register_twitch', (req, res) => {
                    let twitchOauth = require('simple-oauth2').create(this.twitchTokenOption);
                    var scopes = ['clips:edit', 'channel_editor', 'channel_subscriptions', 'channel_read', 'channel_subscriptions', 'channel_commercial'];
                    const twitchAuthorizeURL = twitchOauth.authorizationCode.authorizeURL({
                        redirect_uri: `http://${this.server_config.hostname}:${this.server_config.port}/callback_twitch`,
                        scope: scopes,
                        state: 'state',
                    })

                    res.redirect(twitchAuthorizeURL);
                });
            }

            app.get('/callback_spotify', (req, res) => {
                const code = req.query.code;

                var tokens = null;

                this.spotifyApi.authorizationCodeGrant(code).then((data) => {
                    // Set the access token on the API object to use it in later calls
                    tokens = {
                        access_token: data.body['access_token'],
                        refresh_token: data.body['refresh_token'],
                    }

                    this.spotifyApi.setAccessToken(tokens['access_token']);
                    this.spotifyApi.setRefreshToken(tokens['refresh_token']);

                    console.log('Spotify tokens are obtained!');
                })
                res.send('Spotify is configured!');
            });

            app.get('/callback_twitch', async (req, res) => {
                const {
                    code
                } = req.query;

                this.twitchApi.clientID = this.twitch_config.client_id;

                this.twitchApi.auth.getAccessToken({
                    clientSecret: this.twitch_config.client_secret,
                    redirectURI: `http://${this.server_config.hostname}:${this.server_config.port}`,
                    code: code
                }, (_, data) => {
                    this.twitchAuth = data;
                    res.send('OK');
                    console.log('Twitch tokens are obtained!')
                });
            });

            var server = app.listen(this.server_config.port, () => {
                console.log('OAuth2.0 server is ready and up!');

                const SpotifyWebApi = require('spotify-web-api-node');

                var credentials = {
                    clientId: this.spotify_config.client_id,
                    clientSecret: this.spotify_config.client_secret,
                    redirectUri: `http://${this.server_config.hostname}:${this.server_config.port}/callback_spotify`,
                };

                this.spotifyApi = new SpotifyWebApi(credentials);

                if (this.is_local) {
                    var scopes = ['user-read-private', 'user-read-email', 'user-read-currently-playing', 'user-read-playback-state'];
                    var spotifyAuthorizeURL = this.spotifyApi.createAuthorizeURL(scopes, 'state');

                    var opn = require('opn');

                    let twitchOauth = require('simple-oauth2').create(this.twitchTokenOption);
                    scopes = ['clips:edit', 'channel_editor', 'channel_subscriptions', 'channel_read', 'channel_subscriptions', 'channel_commercial'];
                    const twitchAuthorizeURL = twitchOauth.authorizationCode.authorizeURL({
                        redirect_uri: `http://${this.server_config.hostname}:${this.server_config.port}/callback_twitch`,
                        scope: scopes,
                        state: 'state',
                    })

                    opn(spotifyAuthorizeURL);
                    opn(twitchAuthorizeURL);
                }

                this.special_commands_container = this.special_commands_container.concat([
                    {
                        name: 'playing',
                        function: (msg, target, context) => {
                            this.spotifyApi.refreshAccessToken().then((data) => {
                                this.spotifyApi.setAccessToken(data.body['access_token']);
                                this.spotifyApi.getMyCurrentPlaybackState({}).then((data2) => {
                                    const response = data2.body.item;
                                    if (data2.body.is_playing) {
                                        var artists = "";
                                        for (let index = 0; index < response.artists.length; index++) {
                                            const element = response.artists[index];

                                            artists += element.name;

                                            if (index < response.artists.length - 1)
                                                artists += ", ";
                                        }

                                        this.client.say(target, `Şu an çalan şarkı: ${artists} - ${response.name}`);
                                    } else {
                                        errorHandler(this.client, target, context['display-name'], `Currently playing song cannot be found.`, 'Çalınan şarkı bulunamadı!');
                                    }
                                }, (err) => {
                                    errorHandler(this.client, target, context['display-name'], err.toString(), 'Çalınan şarkı bulunamadı!');
                                });
                            })
                        }
                    },
                    {
                        name: 'game',
                        function: (msg, target, context) => {
                            try {
                                const args = msg.split(' ');
                                if (args.length > 1) {
                                    if (!modCheck(context)) {
                                        errorHandler(this.client, target, context['display-name'], `Permissions do not match for command execution: blacklist`, `Bu komutu kullanmaya izniniz yok!`);
                                        return;
                                    }
                                    const gameString = msg.substring(6);

                                    this.twitchApi.auth.refreshToken({
                                        clientSecret: this.twitch_config.client_secret,
                                        refreshToken: this.twitchAuth.refresh_token
                                    }, (err, tokenData) => {
                                        if (err != null)
                                            throw Error(err);
                                        this.twitchAuth = tokenData;

                                        this.twitchApi.channels.channel({
                                            auth: this.twitchAuth.access_token
                                        }, (err2, channelData) => {
                                            if (err2 != null)
                                                throw Error(err2);

                                            this.twitchApi.channels.updateChannel({
                                                auth: this.twitchAuth.access_token,
                                                channelID: channelData._id,
                                                game: gameString
                                            }, (err3, responseData) => {
                                                if (err3 != null)
                                                    throw Error(err3);

                                                this.client.say(target, `Oyun ${responseData.game} yapıldı!`);
                                            })
                                        })
                                    });
                                } else {
                                    this.twitchApi.auth.refreshToken({
                                        clientSecret: this.twitch_config.client_secret,
                                        refreshToken: this.twitchAuth.refresh_token
                                    }, (err, tokenData) => {
                                        if (err != null)
                                            throw Error(err);
                                        this.twitchAuth = tokenData;

                                        this.twitchApi.channels.channel({
                                            auth: this.twitchAuth.access_token
                                        }, (err2, channelData) => {
                                            if (err2 != null)
                                                throw Error(err2);

                                            this.client.say(target, `Oyun: ${channelData.game}!`);
                                        })
                                    });

                                }
                            } catch (error) {
                                errorHandler(this.client, target, context['display-name'], `An error occured: ${error.toString()}`, 'Bu komut çalıştırılamadı!');
                            }
                        }
                    },
                    {
                        name: 'title',
                        function: (msg, target, context) => {
                            try {
                                const args = msg.split(' ');
                                if (args.length > 1) { 
                                    if (!modCheck(context)) {
                                        errorHandler(this.client, target, context['display-name'], `Permissions do not match for command execution: blacklist`, `Bu komutu kullanmaya izniniz yok!`);
                                        return;
                                    }
                                    const titleString = msg.substring(6);

                                    this.twitchApi.auth.refreshToken({
                                        clientSecret: this.twitch_config.client_secret,
                                        refreshToken: this.twitchAuth.refresh_token
                                    }, (err, tokenData) => {
                                        if (err != null)
                                            throw Error(err);
                                        this.twitchAuth = tokenData;

                                        this.twitchApi.channels.channel({
                                            auth: this.twitchAuth.access_token
                                        }, (err2, channelData) => {
                                            if (err2 != null)
                                                throw Error(err2);

                                            this.twitchApi.channels.updateChannel({
                                                auth: this.twitchAuth.access_token,
                                                channelID: channelData._id,
                                                status: titleString
                                            }, (err3, responseData) => {
                                                if (err3 != null)
                                                    throw Error(err3);

                                                this.client.say(target, `Başlık '${responseData.status}' yapıldı!`);
                                            })
                                        })
                                    });
                                } else {
                                    this.twitchApi.auth.refreshToken({
                                        clientSecret: this.twitch_config.client_secret,
                                        refreshToken: this.twitchAuth.refresh_token
                                    }, (err, tokenData) => {
                                        if (err != null)
                                            throw Error(err);
                                        this.twitchAuth = tokenData;
    
                                        this.twitchApi.channels.channel({
                                            auth: this.twitchAuth.access_token
                                        }, (err2, channelData) => {
                                            if (err2 != null)
                                                throw Error(err2);
    
                                            this.client.say(target, `Başlık :'${channelData.status}'!`);
                                        })
                                    });
                                }
                            } catch (error) {
                                errorHandler(this.client, target, context['display-name'], `An error occured: ${error.toString()}`, 'Bu komut çalıştırılamadı!');
                            }
                        }
                    },
                    {
                        name: 'follow',
                        function: (msg, target, context) => {
                            try {
                                this.twitchApi.auth.refreshToken({
                                    clientSecret: this.twitch_config.client_secret,
                                    refreshToken: this.twitchAuth.refresh_token
                                }, (err, tokenData) => {
                                    if (err != null)
                                        throw Error(err);
                                    this.twitchAuth = tokenData;

                                    this.twitchApi.channels.channel({
                                        auth: this.twitchAuth.access_token
                                    }, (err2, channelData) => {
                                        if (err2 != null)
                                            throw Error(err2);

                                        this.twitchApi.users.checkFollow({
                                            auth: this.twitchAuth.access_token,
                                            channelID: channelData._id,
                                            userID: context['user-id'],
                                        }, (err3, responseData) => {
                                            if (err3 != null)
                                                throw Error(err3);

                                            if (responseData.error) {
                                                this.client.say(target, `Takip bulunamadı!`);
                                            } else {
                                                const string = this.parseIsoString(responseData.created_at);
                                                this.client.say(target, `${context['display-name']}, takip süren: ${string}!`);
                                            }
                                        })
                                    })
                                });
                            } catch (error) {
                                errorHandler(this.client, target, context['display-name'], `An error occured: ${error.toString()}`, 'Bu komut çalıştırılamadı!');
                            }
                        }
                    },
                ])
            });
        }
    }

    runMiddleware(msg, context, target) {
        msg = msg.trim();
        const splitInput = msg.split(' ');

        // Command Check
        if (splitInput[0].charAt(0) != '!')
            return true;

        // Spam Check
        if (new Date() - this.lastRequest <= this.timeout * 1000)
            return false;

        // Check for special commands
        for (let index = 0; index < this.special_commands_container.length; index++) {
            const element = this.special_commands_container[index];

            if ('!' + element['name'] == splitInput[0]) {
                element.function(msg, target, context);
                return false;
            }
        }

        // Check for registered commands
        for (let index = 0; index < this.command_container.length; index++) {
            const element = this.command_container[index];

            if ('!' + element.name == splitInput[0]) {
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
                        try {
                            let params = splitInput.slice(1);
                            var targetFunction = new Function(`return ${element.function}`)();

                            targetFunction(params, this.client, context, msg, target);
                        } catch (error) {
                            errorHandler(this.client, target, context['display-name'], error.toString(), 'Bir hata meydana geldi!');
                        }
                    } else
                        errorHandler(this.client, target, context['display-name'], `Permissions do not match for command execution: ${element.name}`, 'Bu komutu kullanmaya izniniz yok!');
                } else
                    errorHandler(this.client, target, context['display-name'], `Wrong command execution: ${element.name}`, `Yanlış komut kullanımı! ${element.argCount} tane argüman girmeniz gerekiyor!`);
                return false;
            }
        }
    }

    parseIsoString(date) {
        const startedAt = Date.parse(date);
        var msecs = Math.abs(new Date() - startedAt);

        const years = Math.floor(msecs / (1000 * 60 * 60 * 24 * 365));
        msecs -= years * 1000 * 60 * 60 * 24 * 365;
        const months = Math.floor(msecs / (1000 * 60 * 60 * 24 * 30));
        msecs -= months * 1000 * 60 * 60 * 24 * 30;
        const days = Math.floor(msecs / (1000 * 60 * 60 * 24));
        msecs -= days * 1000 * 60 * 60 * 24;
        const hours = Math.floor(msecs / (1000 * 60 * 60));
        msecs -= hours * 1000 * 60 * 60;
        const mins = Math.floor((msecs / (1000 * 60)));
        msecs -= mins * 1000 * 60;
        const secs = Math.floor(msecs / 1000);
        msecs -= secs * 1000;

        var string = "";
        if (years > 0)
            string += `${years} yıl `;
        if (months > 0)
            string += `${months} ay `;
        if (days > 0)
            string += `${days} gün `;
        if (hours > 0)
            string += `${hours} saat `;
        if (mins > 0)
            string += `${mins} dakika `;
        if (secs > 0)
            string += `${secs} saniye `;

        string = string.trim();

        return string;
    }
}

exports.commandsMiddleware = Commands;