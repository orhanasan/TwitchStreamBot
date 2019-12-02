const fs = require('fs');

exports.modCheck = (context) => {
    return context['mod'] == true || (context['badges'] != null&& context['badges']['broadcaster'] == '1');
}

exports.errorHandler = (client, channel, sender, errorString, errorMessage) => {
    client.say(channel, errorMessage);
    console.log(errorString);
    fs.writeFileSync('./errors.txt', `[ERROR] | ${new Date().toString()} | Sender: ${sender} | Channel: ${channel} | Error Message: ${errorString}\n`, {flag: 'a'});
}

exports.helpHandler = (client, channel, sender, helpString, helpMessage) => {
    client.say(channel, helpMessage);
    console.log(helpString);
    fs.writeFileSync('./errors.txt', `[LOG] | ${new Date().toString()} | Sender: ${sender} | Channel: ${channel} | Error Message: ${helpString}\n`, {flag: 'a'});
}