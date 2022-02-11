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
  "terra18py95akdje8q8aaukhx65dplh9342m0j884wt4",
  "terra1090l5p5v794dpyzr07da72cyexhuc4zag5cuer",
  "terra14vmf4tzg23fxnt9q5wavlp4wtvzzap82hdq402",
  "terra1hvmzhnhxnyhjfnctntnn49a35w6hvygmxvjt7q",
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

  const terraAssetList = await getTerraAsset(network);
  const mergedTokens = terraAssetList;

  const fileName = `${network}-token.json`;
  const outdir = path.join(__dirname, "output");
  const filePath = path.join(outdir, fileName);
  if (!existsSync(outdir)) {
    mkdirSync(outdir);
  }

  writeFileSync(filePath, "");
  const whitelists = mergedTokens.filter((v) => {
    return !blacklist.includes(v.token) && !blacklist.includes(v.contract_addr);
  });

  for (let index = 0; index < whitelists.length; index++) {
    const element = whitelists[index];
    if (!element.name) {
      const info = await terra.wasm.contractInfo(
        AccAddress.fromValAddress(element.key ?? element.contract_addr)
      );
      if (info && info.init_msg) {
        element.name = info.init_msg.name;
      }
    }
  }

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

main("mainnet").then((c) => {
  if (c) {
    console.log("Add file");
    exec("git add .", () => {
      console.log("Commit");
      exec('git commit -m "Commit token list"', () => {
        console.log("push");
        exec("git push origin main", () => {
          console.log("done");
        });
      });
    });
  }
});
