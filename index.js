const axios = require("axios");
const { writeFileSync, existsSync, mkdirSync, readFileSync } = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { LCDClient } = require("@terra-money/terra.js");
const { readDenom, isDenomTerra } = require("@terra.kitchen/utils");

const blacklist = JSON.parse(
  readFileSync(path.join(__dirname, "output", "delisted-token.json"), {
    encoding: "utf8",
    flag: "r",
  })
);

const configs = JSON.parse(
  readFileSync(path.join(__dirname, "output", "chain.json"), {
    encoding: "utf8",
    flag: "r",
  })
);

function main() {
  const init = async (config) => {
    console.log("Init");
    const terraAssetList = await getTerraAsset(config.name);
    const mergedTokens = terraAssetList.sort(compareVerified);

    const fileName = `${config.name}-token.json`;
    const outdir = path.join(__dirname, "output");
    const filePath = path.join(outdir, fileName);

    if (!existsSync(outdir)) {
      mkdirSync(outdir);
    }

    writeFileSync(filePath, "");
    const whitelists = mergedTokens.filter((v) => {
      return (
        !blacklist.includes(v.token) &&
        !blacklist.includes(v.contract_addr) &&
        v.name != "TEST DONOT BUY" &&
        v.name != "Token test dont buy" &&
        v.name != "test dont buy 100" &&
        v.verified
      );
    });

    writeFileSync(filePath, JSON.stringify(whitelists));
    return true;
  };

  const commit = () => {
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
  };
  return {
    init,
    commit,
  };
}

function compareVerified(a, b) {
  if (a.verified < b.verified) {
    return -1;
  }
  if (a.verified > b.verified) {
    return 1;
  }
  return 0;
}

async function getTerraAsset() {
  const terraAssetListUrl = "https://api.terraswap.io/tokens";
  const terraAssetList = await axios.default.get(terraAssetListUrl);
  const tokens = terraAssetList.data;
  return tokens;
}

const run = async () => {
  const _main = main();

  for (let index = 0; index < configs.length; index++) {
    const config = configs[index];
    await _main.init(config);
  }

  _main.commit();
};

run();
