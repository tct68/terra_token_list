const axios = require("axios");
const { writeFileSync, existsSync, mkdirSync } = require("fs");
const path = require("path");
const { exec } = require("child_process");

const blacklist = [
  "terra1a7zxk56c72elupp7p44hn4k94fsvavnhylhr6h",
  "terra1qs7h830ud0a4hj72yr8f7jmlppyx7z524f7gw6",
  "terra1qhkjjlqq2lyf2evzserdaqx55nugksjqdpxvru",
  "terra1374w7fkm7tqhd9dt2r5shjk8ly2kum443uennt",
  "terra1jr9s6cx4j637fctkvglrclvrr824vu3r2rrvj7",
];

async function main() {
  const contracts = await getContractList();
  const terraAssetList = await getTerraAsset();
  const terraswapAssetList = await getTerraswapAsset();
  const mergedTokens = terraAssetList.concat(terraswapAssetList);

  const fileName = "token.json";
  const outdir = path.join(__dirname, "output");
  const filePath = path.join(outdir, fileName);
  if (!existsSync(outdir)) {
    mkdirSync(outdir);
  }

  writeFileSync(filePath, "");
  const whitelists = mergedTokens.filter((v) => {
    console.log(v);
    return !blacklist.includes(v.token) && !blacklist.includes(v.contract_addr);
  });
  writeFileSync(filePath, JSON.stringify(whitelists));

  return true;
}

async function getTerraAsset() {
  const terraAssetListUrl = "https://assets.terra.money/cw20/tokens.json";
  const terraAssetList = await axios.default.get(terraAssetListUrl);
  const testnetTokens = terraAssetList.data["testnet"];
  const mainnetToken = terraAssetList.data["mainnet"];

  const testnets = getTokenList(testnetTokens, "testnet");
  const mainnet = getTokenList(mainnetToken, "mainnet");
  const terraAssetListFlat = testnets.concat(mainnet);
  return terraAssetListFlat;
}

async function getTerraswapAsset() {
  const terraswapAssetListUrl = "https://api.terraswap.io/tokens";
  const assetsJson = (await axios.default.get(terraswapAssetListUrl)).data;
  return assetsJson;
}

function getTokenList(tokens, network) {
  const keys = Object.keys(tokens);
  const tokenList = [];
  keys.forEach((element) => {
    tokenList.push({ ...tokens[element], isTestnet: network == "testnet" });
  });
  return tokenList;
}
async function getContractList() {
  const contractsUrl = "https://assets.terra.money/cw20/contracts.json";
  const data = (await axios.default.get(contractsUrl)).data;
  return data;
}

main().then((c) => {
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
