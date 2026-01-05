import { FunctionArgs, output } from "exchange-outpost-abi";

function run() {
  const args = FunctionArgs.get();

  output({"status": "ok"});
}

module.exports = { run };