const { writeFileSync, existsSync, mkdirSync } = require("fs");
const { default: axios } = require("axios");
const path = require("path");
const main = async () => {
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

  const data = (await axios.get("https://whitelist.mirror.finance/bombay.json"))
    .data;
  const delistInWhitelistKeys = Object.keys(data.whitelist);
  const delistInWhitelistValues = [];
  delistInWhitelistKeys.forEach((element) => {
    const item = data.whitelist[element];
    if (item.status == "DELISTED") {
      delistInWhitelistValues.push(item.token);
    }
  });
  const finalList = [
    ...Object.keys(data.delist),
    ...delistInWhitelistValues,
    ...blacklist,
  ];

  var uniqueList = finalList.filter((v, i, arr) => {
    return arr.indexOf(v) == i;
  });

  const fileName = `delisted-token.json`;
  const outdir = path.join(__dirname, "output");
  const filePath = path.join(outdir, fileName);
  if (!existsSync(outdir)) {
    mkdirSync(outdir);
  }

  writeFileSync(filePath, JSON.stringify(uniqueList));
};

main();
