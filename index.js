
const channelName = '#a';

const irc = require("irc");
const bot = new irc.Client("tty0.xyz", "markovbot", {
	channels: [channelName],
	userName: "markovbot",
	realName: "kspalaiologos' markov chain bot",
    autoRejoin: true
})

const fs = require('fs');

const markov = require('./markov')
const chain = new markov(1)

const cbor = require('cbor');

chain.train(fs.readFileSync(__dirname + '/data.slug'))

bot.addListener("message", function(from, to, message) {
    if(message == "markovbot, flush the model") {
        fs.writeFile('model.dat', cbor.encode(chain.export()), function (err) {
            if (err)
                bot.say(channelName, 'couldn\'t flush the model.')
            else
                bot.say(channelName, 'state saved successfully.')
        });
    } else if(message == "markovbot, rollback the model") {
        fs.readFile('model.dat', 'ascii', (err, content) => {
            if (err)
                bot.say(channelName, 'couldn\'t rollback the model.')
            else {
                cbor.decodeFirst(content, function(error, obj) {
                    if(error)
                        bot.say(channelName, 'couldn\'t rollback the model.')
                    else {
                        chain.import(obj);
                        bot.say(channelName, 'state rollbacked successfully.')
                    }
                });
            }
        });
    } else if(message.includes('markovbot')) {
        let alreadySaid;
        
        if(Math.random() < 0.3) {
            chain.train(message.replace('markovbot', ''));
        }
        
        bot.say(channelName, (Math.random() < 0.6 ? (from + ', ') : ('')) + (alreadySaid = chain.respond(message, Math.floor(Math.random() * 15 + 5))))
        
        if(Math.random() < 0.2) {
            bot.say(channelName, chain.respond(alreadySaid, Math.floor(Math.random() * 20)))
        }
    }
})

bot.addListener('error', function(message) {
    console.log('ERROR: ', message);
});
