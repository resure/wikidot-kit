## WikidotKit [![Build Status](https://travis-ci.org/resure/wikidot-kit.svg?branch=master)](https://travis-ci.org/resure/wikidot-kit) [![Dependencies Status](https://david-dm.org/resure/wikidot-kit.svg)](https://david-dm.org/resure/wikidot-kit)



## Install

```
$ npm install --save wikidot-kit
```


## Usage

```js
const wikidotKit = require('wikidot-kit');

wikidotKit('unicorns');
//=> 'unicorns & rainbows'
```


## API

### wikidotKit(input, [options])

#### input

Type: `string`

Lorem ipsum.

#### options

##### foo

Type: `boolean`<br>
Default: `false`

Lorem ipsum.


## CLI

```
$ npm install --global wikidot-kit
```

```
$ wikidot-kit --help

  Usage
    wikidot-kit [input]

  Options
    --foo  Lorem ipsum. [Default: false]

  Examples
    $ wikidot-kit
    unicorns & rainbows
    $ wikidot-kit ponies
    ponies & rainbows
```


## License

MIT © [Gadzhi Gadzhiev](https://scpfoundation.net)
