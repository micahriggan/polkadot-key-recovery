# Goal
This project takes in a list of Mnemonic framgents, and attempt to find which set of mnemonic fragments result in a goal address.
Say for example you have a set of 12 words, and you broke it in half, but you don't remember which half comes first, this should be able to figure it out for you.
Another example would be, you have a bunch of fragments and you don't know which two go together, but you know your address, this should be able to figure it out for you.


# Instructions
* clone this repo
* npm install
* create a config file in this folder with your 12 words, or fragments of keys, with unknown orders
* npm start
```
{
  "goal": "4eG5smkeKd1r6j7tnKyQyEE5XxA5UFmsVdyG6JNzFnUuFJco",
  "fragments": [
    {
      "name": "Key 1",
      "words": "mask achieve club pear please protect cloud deputy business drink sister notice"
    },
    {
      "name": "Key 2",
      "words": "home memory fiscal profit better pony photo sock layer visual wage unaware"
    }
  ]
}
```


If the key is found, you'll see this message
```
Found match for Key 1 + Key 2 ed25519 {
  prefix: 36,
  network: 'centrifuge',
  displayName: 'Centrifuge Chain',
  symbols: [ 'CFG' ],
  decimals: [ 18 ],
  standardAccount: '*25519',
  website: 'https://centrifuge.io/',
  slip44: 747,
  hasLedgerSupport: true,
  genesisHash: [
    '0xb3db41421702df9a7fcac62b53ffeac85f7853cc4e689e0b93aeb3db18c09d82',
    '0x67dddf2673b69e5f875f6f25277495834398eafd67f492e09f3f3345e003d1b5'
  ],
  icon: 'polkadot',
  isTestnet: false,
  isIgnored: false
}
```

The script also creates a CSV of all the attempted address derivations, and another CSV of the valid 12 word combinations
