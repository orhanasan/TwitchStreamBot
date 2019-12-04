const { modCheck } = require('../helpers');

class BlacklistMiddleware {
    constructor(config, client) {
        this.channel_name = config.channel_name;
        this.timeout = config.timeout;
        this.client = client;

        this.blacklist = [];

        this.fs = require('fs');

        if (this.fs.existsSync(`./#${this.channel_name.toLowerCase()}-blacklist.json`)) {
            const wordsRaw = this.fs.readFileSync(`./#${this.channel_name.toLowerCase()}-blacklist.json`);
            this.blacklist = JSON.parse(wordsRaw);
        }
    }

    runMiddleware(msg, context, target) {
        if (!modCheck(context)) {
            for (let index = 0; index < this.blacklist.length; index++) {
                const element = new RegExp(this.blacklist[index]);

                if (!!element.test(msg)) {
                    this.client.say(target, `${context['display-name']}, blacklistteki bir kelimeyi göndermek yasak!`);
                    this.client.timeout(target, context['username'], this.timeout, 'Blacklisted kelime'); // Purge
                    return false;
                }
            }
        }
        return true;
    }

    addToBlacklist(word) {
        if (this.blacklist.findIndex((value) => { return value == word }) == -1) {
            this.blacklist.push(word.toString());
            this.fs.writeFileSync(`./#${this.channel_name.toLowerCase()}-blacklist.json`, JSON.stringify(this.blacklist), {flag: 'w'});
            return true;
        }
        return false;
    }

    removeFromBlacklist(word) {
        const ind = this.blacklist.findIndex((value) => { return value == word });

        if (ind != -1) {
            this.blacklist.splice(ind, 1);
            this.fs.writeFileSync(`./#${this.channel_name.toLowerCase()}-blacklist.json`, JSON.stringify(this.blacklist), {flag: 'w'});
            return true;
        }
        return false;
    }
}

exports.blacklistMiddleware = BlacklistMiddleware;