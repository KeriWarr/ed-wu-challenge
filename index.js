import _ from 'lodash';
import readline from 'readline';
import { promisify } from 'bluebird';
import columnify from 'columnify';


const rlPromise = promisify(
  (query, callback) => rl.question(query, callback.bind(undefined, undefined))
);

function parseInput(input) {
  let result;
  try {
    result = JSON.parse(input);
  } catch(e) {
    try {
      result = JSON.parse(`"${input}"`);
    } catch(e) {
      result = undefined;
    }
  }
  return result;
}


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

  const results = _.map(_.sortBy(_.map(_.pickBy(_.mapValues(_, (func, name) => {
    try {
      const timeStart = process.hrtime();
      const result = func(...(args.map(parseInput)));
      const timeEnd = process.hrtime(timeStart);
      if (result === parseInput(output)) return timeEnd[1];
      return false;
    } catch(e) {};
  }), _.identity),
  (time, name) => ({ time, name })),
  f => f.time),
  f => Object.assign({}, f, { time: `${Math.round(f.time / 100) / 10}ms`}));

  console.log('\n');
  console.log(columnify(results, {
    columns: ['name', 'time'],
    columnSplitter: '  |  '
  }));
});
