import _ from 'lodash';
import readline from 'readline';
import { promisify } from 'bluebird';
import columnify from 'columnify';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function parseInput(input) {
  let result = undefined;
  try {
    result = JSON.parse(input);
  } catch(e) {
    try {
      result = JSON.parse(`"${input}"`);
    } catch(e) {}
  }
  return result;
}

const rlPromise = promisify(
  (query, callback) => rl.question(query, callback.bind(undefined, undefined))
);

let args;

rlPromise('How many inputs? ').then(answer => {
  const numInputs = parseInt(answer);
  let inputs = [];

  return _.reduce(_.range(numInputs + 1), (promise, index) => {
    return promise.then(input => {
      input && inputs.push(input);
      return index === numInputs ? inputs : rlPromise(`Input ${index + 1}: `);
    });
  }, Promise.resolve(false))
}).then(inputs => {
  args = inputs;
  return rlPromise('Expected output? ');
}).then(output => {
  rl.close();

  const results = _.sortBy(_.toPairs(_.pickBy(_.mapValues(_, (func, name) => {
    try {
      const timeStart = process.hrtime();
      const result = func(...(args.map(parseInput)));
      const timeEnd = process.hrtime(timeStart);
      if (result === parseInput(output)) return `${Math.round(timeEnd[1] / 100) / 10}ms`;
      return false;
    } catch(e) {};
  }), _.identity)), f => f[1]);

  console.log('\n\n', columnify(data, {columns: ['FUNCTION', 'TIME']}));
});
