// const path = require("path");
// const programDir = path.join(__dirname, "..", "programs");
// const idlDir = path.join(__dirname, "target/idl");
// const sdkDir = path.join(__dirname, "sdk", "generated");
// const binaryInstallDir = path.join(__dirname, ".crates");
console.log("__dirname", __dirname);
const programDir = __dirname + "/programs/nc-staking";
const ildDir = __dirname + "/app/admin/sdk/idl";
// const sdkDir = __dirname + "/sdk/generated";
const sdkDir = __dirname + "/app/admin/sdk";
const binaryInstallDir = __dirname + "/.crates";

const solitarc = {
  idlGenerator: "anchor",
  programId: "stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E",
  programName: "nc_staking",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};

console.log(solitarc);
module.exports = solitarc;
