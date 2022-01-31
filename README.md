# node-bria

CounterPath Bria Desktop API for Node.js

## Documentation

View documentation at <https://relative.github.io/node-bria/>

## Installing

```shell
npm install --save bria # alternatively, yarn add bria, pnpm add bria
```

## Usage

```js
import { BriaClient } from 'bria'
const client = new BriaClient()
// place an audio call to +18005882300
client.on('ready', () => {
  client.calls.placeCall({
    number: '+18005882300',
    type: 'audio',
  })
})
```
