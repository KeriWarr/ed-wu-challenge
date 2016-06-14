import _ from 'lodash';
import underscore from 'underscore';
import { createInterface } from 'readline';
import { promisify } from 'bluebird';
import columnify from 'columnify';


// Create a function for reading input with promises
const rlPromise = promisify(
  (query, callback) => rl.question(query, callback.bind(undefined, undefined))
);

// Parse input which is either JSON or a non-quote delimited string
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

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

let args;
let out;

rlPromise('How many inputs? ').then(answer => {
  const numInputs = parseInt(answer);
  let inputs = [];

  // repeatedly save input and make promises for the next input
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
  out = output;

  testLibrary(_, 'Lodash:');
  testLibrary(_.omit(underscore, ['delay', 'defer']), 'Underscore:');
});

function testLibrary(lib, libName) {
  // Map all lodash functions to how long they take to execute, or false if they
  // don't produce the desired output.
  const results = _(lib).mapValues((func, name) => {
    // Some elements in the lodash object aren't functions, so catch exceptions
    try {
      const timeStart = process.hrtime();
      // Call lodash function with all supplied arguments
      const result = func(...(args.map(parseInput)));
      const timeEnd = process.hrtime(timeStart);
      if (result === parseInput(out)) return timeEnd[1];
      return false;
    } catch(e) {};
  })
  // Remove falsy results
  .pickBy(_.identity)
  // Convert to an array of objects
  .map((time, name) => ({ time, name }))
  // Sort by completion time
  .sortBy(result => result.time)
  // Format time as readable string
  .map(result => Object.assign({}, result,
    { time: `${Math.round(result.time / 100) / 10}μs`}))
  .value();

  console.log(`\n${libName}\n`);
  console.log(columnify(results, {
    columns: ['name', 'time'],
    columnSplitter: '  |  '
  }));
}
