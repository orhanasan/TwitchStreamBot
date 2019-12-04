class AnnounceClass {
    constructor(config, client) {
        this.channel_name = config.channel_name;
        this.client = client;

        this.announces = [];

        this.fs = require('fs');

        if (this.fs.existsSync(`./#${this.channel_name.toLowerCase()}-announces.json`)) {
            const announcesRaw = this.fs.readFileSync(`./#${this.channel_name.toLowerCase()}-announces.json`);
            this.announces = JSON.parse(announcesRaw);
        }

        this.announces.forEach(element => {
            const title = element.title;
            const interval = element.interval * 1000;
            const body = element.body;

            const announceFunction = () => {
                if (this.announces.findIndex((value) => { return value.title == title }) == -1)
                    return;

                this.client.say('#' + this.channel_name, body);

                setTimeout(announceFunction, interval);
            }

            setTimeout(announceFunction, Math.floor(Math.random() * 30000) + 30000);
        });
    }

    addAnnounce(title, body, interval) {
        if (this.announces.findIndex((value) => { return value.title == title }) != -1)
            return false;

        this.announces.push({
            title: title,
            body: body,
            interval: interval
        });

        this.fs.writeFileSync(`./#${this.channel_name.toLowerCase()}-announces.json`, JSON.stringify(this.announces));

        const announceFunction = () => {
            if (this.announces.findIndex((value) => { return value.title == title }) == -1)
                return;

            this.client.say('#' + this.channel_name, body);

            setTimeout(announceFunction, interval * 1000 + ( interval > 120 ? Math.floor(Math.random() * 30000) - 15000 : 0));
        }
        setTimeout(announceFunction, interval * 1000 + ( interval > 120 ? Math.floor(Math.random() * 30000) - 15000 : 0));

        return true;
    }

    removeAnnounce(title) {
        const ind = this.announces.findIndex((value) => { return value.title == title });
        if (ind == -1)
            return;

        this.announces.splice(ind, 1);

        this.fs.writeFileSync(`./#${this.channel_name.toLowerCase()}-announces.json`, JSON.stringify(this.announces));

        return true;
    }
}

exports.announceMiddleware = AnnounceClass;