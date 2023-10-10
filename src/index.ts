import { validateMnemonic } from "@polkadot/util-crypto/mnemonic/bip39";
import enWords from "@polkadot/util-crypto/mnemonic/wordlists/en";
import { Keyring } from "@polkadot/keyring";
import { encodeAddress } from "@polkadot/util-crypto";
import { allNetworks } from "@polkadot/networks";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as Combinatorics from "js-combinatorics";
import { hdLedger } from "@polkadot/util-crypto";

const writeFile = promisify(fs.writeFile);

interface Config {
  goal: string;
  fragments: Array<{ name: string; words: string; guessLastWord?: boolean }>;
}

interface ReportRow {
  keyFragmentCombination: string;
  derivationPath: string;
  keyType: string;
  network: string;
  address: string;
  match: boolean;
}

const config = loadConfig();
const keyring = new Keyring();
const derivationPaths = ["//polkadot", "//centrifuge"];
const keyTypes = ["ed25519", "sr25519"];
const rows = findDerivationPathForGoal(config.fragments, config.goal);
const validKeys = Array.from(new Set(rows.map((row) => row.keyName))).map(
  (x) => ({ keyName: x })
);
saveReport(rows, "attempts.csv");
saveReport(validKeys, "validKeys.csv");

function loadConfig() {
  return JSON.parse(fs.readFileSync("config.json", "utf8")) as Config;
}

function findDerivationPathForGoal(
  fragments: Config["fragments"],
  goal: string
) {
  const results = new Array<ReportRow>();
  const allPossibleCombinationsOfWords = combinationsOfMnemonics(fragments);
  console.log(allPossibleCombinationsOfWords);
  const allKeys = deriveAllKeyPairs(fragments);
  let rows = [];
  for (const key of allKeys) {
    const { pair, network, mnemonic, keyType, derivationPath } = key;
    try {
      let address = encodeAddress(pair.publicKey, network.prefix);

      let result = {
        keyName: mnemonic.name,
        derivationPath,
        keyType,
        network: network.displayName,
        address,
        match: address === config.goal,
      };

      if (result.match) {
        console.log("Found match for", mnemonic.name, keyType, network);
        console.log(mnemonic.words);
        rows = [result].concat(rows);
        return rows;
      } else {
        rows.push(result);
      }
    } catch (error) {
      console.error("Couldn't parse address for ", mnemonic.name, keyType);
    }
  }

  console.log("No matches found");
  return rows;
}

function deriveAllKeyPairs(fragments: Config["fragments"]) {
  const allPossibleCombinationsOfWords = combinationsOfMnemonics(fragments);
  console.log(allPossibleCombinationsOfWords);

  const keypairs = [];
  for (const mnemonic of allPossibleCombinationsOfWords) {
    for (const keyType of keyTypes) {
      const pair = keyring.addFromMnemonic(mnemonic.words, {
        name: mnemonic.name,
      });
      keypairs.push({
        mnemonic,
        keyType,
        network: "",
        derivationPath: "",
        pair: pair,
      });

      for (const network of allNetworks) {
        keypairs.push(...deriveLedgerAccounts(mnemonic, network));

        for (const derivationPath of derivationPaths) {
          const derivedPair = pair.derive(derivationPath);
          keypairs.push({
            mnemonic,
            keyType,
            network,
            derivationPath,
            pair: derivedPair,
          });
        }
      }
    }
  }
  return keypairs;
}

function deriveLedgerAccounts(
  mnemonic: Config["fragments"][0],
  network: typeof allNetworks[0]
) {
  if (!network.slip44) {
    return [];
  }
  const pairs = [];
  for (let accountIndex = 0; accountIndex < 10; accountIndex++) {
    for (let addressIndex = 0; addressIndex < 10; addressIndex++) {
      const derivationPath = `m/44'/${network?.slip44}'/${accountIndex}'/0'/${addressIndex}'`;
      try {
        console.log(
          "Trying derivation path",
          derivationPath,
          "for",
          mnemonic.name
        );
        const pair = keyring.createFromPair(
          hdLedger(mnemonic.words, derivationPath)
        );
        pairs.push({
          mnemonic,
          keyType: "ed25519",
          network,
          derivationPath,
          pair,
        });
      } catch (error) {
        console.log("Skipping derivation path", derivationPath);
      }
    }
  }

  return pairs;
}

function guessLastWord(words: string) {
  let answers = [];
  for (const word of enWords) {
    const guess = words + " " + word;
    if (validateMnemonic(guess)) {
      console.log({ guess });
      answers.push(guess);
    }
  }
  return answers;
}

function combinationsOfMnemonics(fragments: Config["fragments"]) {
  const combinations = {} as { [name: string]: Config["fragments"][0] };

  for (let i = 0; i < fragments.length; i++) {
    console.log("Processing", fragments[i].name);
    if (fragments[i].guessLastWord) {
      for (const guess of guessLastWord(fragments[i].words)) {
        fragments.push({
          name: fragments[i].name + " + guessLastWord",
          words: guess,
        });
      }
    }
    const wordsI = fragments[i].words;
    const nameI = fragments[i].name;
    const wordICount = wordsI.split(" ").length;

    if (wordICount >= 12 && validateMnemonic(wordsI)) {
      combinations[nameI] = { name: nameI, words: wordsI };
    }

    for (let j = 0; j < fragments.length; j++) {
      const wordsJ = fragments[j].words;
      const nameJ = fragments[j].name;
      const wordJCount = wordsJ.split(" ").length;

      if (nameJ === nameI) {
        continue;
      }

      const name = `${nameI} + ${nameJ}`;
      const words = `${wordsI} ${wordsJ}`;

      if (
        (fragments[i].guessLastWord || fragments[j].guessLastWord) &&
        !name.includes("guessLastWord")
      ) {
        for (const guess of guessLastWord(words)) {
          fragments.push({
            name: name + " + guessLastWord",
            words: guess,
          });
        }
      }

      if (validateMnemonic(words)) {
        combinations[name] = {
          name,
          words,
        };
      }
    }
  }

  return Object.values(combinations);
}

function saveReport(data: Array<any>, fileName) {
  const headers = Object.keys(data[0]).join(",");
  const rows = [headers]
    .concat(data.map((result) => Object.values(result).join(",")))
    .join("\n");
  writeFile(fileName, rows, "utf8").catch((error) => console.error(error));
}
