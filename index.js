
const m = require('markov')();
const s = require('fs').createReadStream('data.slug');

console.log('Building a Markov chain with memory=2.');

m.seed(s, () => process.openStdin().on('data', (l) => console.log(m.respond(l.toString()).join(' '))));
