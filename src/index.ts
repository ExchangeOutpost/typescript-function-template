import { FunctionArgs } from "exchange-outpost-abi";

function run() {
  const input = Host.inputString();
  const args = FunctionArgs.fromJsonString(input);

  Host.outputString(JSON.stringify({ status: 'ok'}));
}

module.exports = { run };