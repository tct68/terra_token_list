const axios = require("axios");
const { writeFileSync, existsSync, mkdirSync, readFileSync } = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { LCDClient, AccAddress } = require("@terra-money/terra.js");
const { readDenom, isDenomTerra } = require("@terra.kitchen/utils");

const blacklist = JSON.parse(
  readFileSync(path.join(__dirname, "output", "delisted-token.json"), {
    encoding: "utf8",
    flag: "r",
  })
);

async function main(network) {
  console.log("-------------- Get token list --------------");
  var terra = new LCDClient({
    URL: "https://lcd.terra.dev",
    chainID: "bombay-5",
  });

  // if (network == "testnet") {
  //   terra = new LCDClient({
  //     URL: "https://bombay-lcd.terra.dev",
  //     chainID: "bombay-12",
  //   });
  // }

  const terraAssetList = await getTerraAsset(network);
  const denoms = await getActiveDenoms(terra);
  const mergedTokens = terraAssetList.concat(denoms).sort(compare);

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
  await require("./config");
  return true;
}

function compare(a, b) {
  if (a.symbol < b.symbol) {
    return -1;
  }
  if (a.symbol > b.symbol) {
    return 1;
  }
  return 0;
}

async function getTerraAsset(network) {
  const terraAssetListUrl = "https://api.terraswap.io/tokens";
  const terraAssetList = await axios.default.get(terraAssetListUrl);
  const tokens = terraAssetList.data;
  console.log(tokens.length);
  return tokens;
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

async function getActiveDenoms(terra) {
  const activeDenoms = await terra.oracle.activeDenoms();
  const activeDenomsInfos = [];

  for (let index = 0; index < activeDenoms.length; index++) {
    const denom = activeDenoms[index];
    const symbol = readDenom(denom);
    const path = isDenomTerra(denom) ? `Terra/${symbol}.svg` : `${symbol}.svg`;
    const icon = `https://raw.githubusercontent.com/terra-money/assets/master/icon/svg/${path}`;

    activeDenomsInfos.push({
      name: (denom ?? "").toUpperCase(),
      symbol,
      icon,
      token: denom,
      key: denom,
    });
  }

  return activeDenomsInfos;
}

main("testnet").then((c) => {
  // return;
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
