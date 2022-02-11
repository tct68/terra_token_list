const axios = require("axios");
const { writeFileSync, existsSync, mkdirSync, readFileSync } = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { LCDClient, AccAddress } = require("@terra-money/terra.js");

const blacklist = readFileSync(
  path.join(__dirname, "output", "delisted-token.json")
).toJSON().data;

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
  console.log(blacklist);
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
