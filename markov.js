var _ = require('underscore');

function Markov(minimumWords) {
    this.minimumWords = minimumWords;
    this.model = {};
}

Markov.prototype.train = function(str) {
    const words = this.wordsFromText((Buffer.isBuffer(str) ? str.toString() : str));

    var next;
    var prev;
    var node;

    if (words.length >= this.minimumWords) {
        for (let i = 0; i < words.length; i++) {
            const next = words[i + 1];
            prev = words[i - 1];

            node = this.addDefaultModelNode(words[i]);

            this.incrementCount(node);

            if (next) {
                node.next[next] = this.incrementCount(node.next[next]);
            } else {
                node.next[''] = this.incrementCount(node.next['']);
            }

            if (prev) {
                node.prev[prev] = this.incrementCount(node.prev[prev]);
            } else {
                node.prev[''] = this.incrementCount(node.prev['']);
            }
        }
    }

    return this;
};

Markov.prototype.computeWeight = function(count) {
    return Math.log(count) + 1;
};

Markov.prototype.wordsFromText = function(text) {
    text = text.toString();

    return text.split(/\s+/);
};

Markov.prototype.search = function(text) {
    return this.pickWord(this.model, this.wordsFromText(text));
};
  
Markov.prototype.pickWord = function(nodes, words) {
    if (words) {
        words = _.intersection(_.keys(nodes), words)
    } else {
        words = [];
    }

    var wordsTable = mapObject(words, _.constant(true));

    var maxSample = 0;
    var sample;

    return _.reduce(_.keys(nodes), function(memo, word) {
        sample = Math.random() * nodes[word].weight * (wordsTable[word] ? 2 : 1);

        if (sample > maxSample) {
            memo = word;
            maxSample = sample;
        }

        return memo;
    }, null);
};

Markov.prototype.next = function(word) {
    if (!word || !this.model[word])
        return undefined;

    return this.pickWord(this.model[word].next);
};

Markov.prototype.prev = function(word) {
    if (!word || !this.model[word])
        return undefined;

    return this.pickWord(this.model[word].prev);
};

Markov.prototype.fill = function(word, limit) {
    var response = [word];

    if (!response[0]) {
        return [];
    }

    if (limit && response.length >= limit) {
        return response;
    }

    var previousWord = word;
    var nextWord = word;

    while (previousWord || nextWord) {
        if (previousWord) {
            previousWord = this.prev(previousWord);

            if (previousWord) {
                response.unshift(previousWord);

                if (limit && response.length >= limit) {
                    break;
                }
            }
        }

        if (nextWord) {
            nextWord = this.next(nextWord);

            if (nextWord) {
                response.push(nextWord);

                if (limit && response.length >= limit) {
                    break;
                }
            }
        }
    }

    return response.join(' ');
};

Markov.prototype.respond = function(text, limit) {
    return this.fill(this.search(text), limit);
};

Markov.prototype.export = function() {
    return _.pick(this, ['model', 'minimumWords']);
}

Markov.prototype.import = function(json) {
    _.extend(this, _.pick(json, ['model', 'minimumWords']));
    return this;
};

Markov.prototype.addDefaultModelNode = function(word) {
    if (!_.isObject(this.model[word])) {
        this.model[word] = {};
    }
    _.defaults(this.model[word], defaultModelNode());

    return this.model[word];
};

Markov.prototype.incrementCount = function(obj) {
    obj = _.isObject(obj) ? obj : {count: 0, weight: 0};

    obj.count++;
    obj.weight = this.computeWeight(obj.count);

    return obj;
};

function defaultModelNode() {
    return {
        count: 0,
        next: {},
        prev: {}
    };
}

function mapObject(list, fn) {
    var ret = {};

    _.each(list, function(val, idx) {
        ret[val] = fn(val, idx);
    });

    return ret;
}

module.exports = Markov;
