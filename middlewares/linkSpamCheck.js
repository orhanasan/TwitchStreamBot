const { modCheck, errorHandler } = require('../helpers');

class LinkSpamMiddleware {
    constructor(config, client) {
        this.excludedRoles = config.excludedRoles;
        this.excludedLinks = config.excludedLinks;
        this.timeout = config.timeout;
        this.client = client;
        this.permittedList = [];
    }

    runMiddleware(msg, context, target) {
        if (msg.match(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g) != null) {
            const excludedLinks = this.excludedLinks;
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
                    this.client.say(target, `${context['display-name']}, link göndermek yasak! Sadece ${excludedLinksStr} sitelerinden link gönderebilirsin!`);
                    this.client.timeout(target, context['username'], this.timeout, 'Link atmak'); // Purge
                    return false;
                }

                const excludedRoles = this.excludedRoles;
                for (let index = 0; index < excludedRoles.length; index++) {
                    const element = excludedRoles[index];

                    if (context['badges'][element] == 1) {
                        isExcluded = true;
                        break;
                    }
                }

                if (!isExcluded) {
                    const user = context['username'].toLowerCase();
                    if (this.permittedList.findIndex((value) => { return value == user; }) == -1) {
                        var excludedLinksStr = "";
                        for (let index = 0; index < excludedLinks.length; index++) {
                            const element = excludedLinks[index];

                            excludedLinksStr += element;

                            if (index < excludedLinks.length - 1)
                                excludedLinksStr += ", ";
                        }
                        this.client.say(target, `${context['display-name']}, link göndermek yasak! Sadece ${excludedLinksStr} sitelerinden link gönderebilirsin!`);
                        this.client.timeout(target, context['username'], this.timeout, 'Link atmak'); // Purge
                        return false;
                    }
                }
            }

            return true;
        }
        return true;
    }

    addToPermittedList(username, minutes) {
        try {
            this.permittedList.push(username);
            setTimeout(() => {
                const ind = this.permittedList.findIndex((value) => { return value == username; })
                if (ind != -1)
                    this.permittedList.splice(ind, 1);
            }, parseInt(minutes) * 60 * 1000);
            return true;
        } catch(error) {
            return false;
        }
    }
}

exports.linkSpamMiddleware = LinkSpamMiddleware;