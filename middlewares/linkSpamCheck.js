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
        if (this.validURL(msg)) {
            const excludedLinks = this.excludedLinks;
            var isExcluded = false;
            for (let index = 0; index < excludedLinks.length; index++) {
                const element = excludedLinks[index];

                if (msg.match(element) !== null) {
                    isExcluded = true;
                    msg = msg.replace(element, '');
                }
            }

            if (!(isExcluded && !this.validURL(msg))) {
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
            this.permittedList.push(username.toLowerCase());
            minutes = parseInt(minutes);
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

    validURL(str) {
        var pattern = /(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?/;
        return !!pattern.test(str);
    }
}

exports.linkSpamMiddleware = LinkSpamMiddleware;