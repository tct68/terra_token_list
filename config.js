const { default: axios } = require("axios");
const { writeFileSync, existsSync, mkdirSync, readFileSync } = require("fs");
const path = require("path");

const main = async () => {
  const URL = "https://assets.terra.money/chains.json";
  const data = (await axios.get(URL)).data;

  const fileName = `chain.json`;
  const outdir = path.join(__dirname, "output");
  const filePath = path.join(outdir, fileName);

  if (!existsSync(outdir)) {
    mkdirSync(outdir);
  }
  delete data["localterra"];
  writeFileSync(filePath, JSON.stringify(data));
};

module.exports = main();
