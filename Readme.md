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


