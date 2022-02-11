const axios = require("axios");
const { writeFileSync, existsSync, mkdirSync } = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { LCDClient, AccAddress } = require("@terra-money/terra.js");

const blacklist = [
  "terra1a7zxk56c72elupp7p44hn4k94fsvavnhylhr6h",
  "terra1qs7h830ud0a4hj72yr8f7jmlppyx7z524f7gw6",
  "terra1qhkjjlqq2lyf2evzserdaqx55nugksjqdpxvru",
  "terra1374w7fkm7tqhd9dt2r5shjk8ly2kum443uennt",
  "terra1jr9s6cx4j637fctkvglrclvrr824vu3r2rrvj7",
];

async function main(network) {
  var terra = new LCDClient({
    URL: "https://lcd.terra.dev",
    chainID: "bombay-5",
  });

  if (network == "testnet") {
    terra = new LCDClient({
      URL: "https://bombay-lcd.terra.dev",
      chainID: "bombay-12",
    });
  }

  const contracts = await getContractList(network);
  const terraAssetList = await getTerraAsset(network);
  const mergedTokens = terraAssetList;

  const fileName = `${network}-token.json`;
  const outdir = path.join(__dirname, "output");
  const filePath = path.join(outdir, fileName);
  if (!existsSync(outdir)) {
    mkdirSync(outdir);
  }

  writeFileSync(filePath, "");
  const whitelists = mergedTokens.filter((v, i, ara) => {
    return !blacklist.includes(v.token) && !blacklist.includes(v.contract_addr);
  });

  const _whitelists = [];
  whitelists.forEach(async (v) => {
    const _token = v;
    if (!_token.name) {
      if (_token.key == "terra1u0t35drzyy0mujj8rkdyzhe264uls4ug3wdp3x") {
        debugger;
      }
      const info = await terra.wasm.contractInfo(
        AccAddress.fromValAddress(_token.key ?? _token.contract_addr)
      );
      if (info && info.init_msg) {
        _token.name = info.init_msg.name;
      }
    }

    _whitelists.push(_token);
  });
  writeFileSync(filePath, JSON.stringify(whitelists));

  return true;
}

async function getTerraAsset(network) {
  const terraAssetListUrl = "https://assets.terra.money/cw20/tokens.json";
  const terraAssetList = await axios.default.get(terraAssetListUrl);
  const tokens = terraAssetList.data[network];
  const list = getTokenList(tokens);
  return list;
}

async function getTerraswapAsset() {
  const terraswapAssetListUrl = "https://api.terraswap.io/tokens";
  const assetsJson = (await axios.default.get(terraswapAssetListUrl)).data;
  return assetsJson;
}

function getTokenList(tokens) {
  const keys = Object.keys(tokens);
  const tokenList = [];
  keys.forEach((element) => {
    tokenList.push({
      ...tokens[element],
      key: element,
    });
  });
  return tokenList;
}
async function getContractList(network) {
  const contractsUrl = "https://assets.terra.money/cw20/contracts.json";
  const data = (await axios.default.get(contractsUrl)).data;
  const tokens = getTokenList(data[network]);
  return tokens;
}

main("testnet").then((c) => {
  if (c) {
    console.log("Add file");
    exec("git add .", (err, stdout, stderr) => {
      console.log("Commit");
      exec('git commit -m "Commit token list"', (err, stdout, stderr) => {
        console.log("push");
        exec("git push origin main", (err, stdout, stderr) => {
          console.log("done");
        });
      });
    });
  }
});
