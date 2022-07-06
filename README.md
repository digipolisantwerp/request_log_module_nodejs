
![CI](https://github.com/digipolisantwerp/request_log_module_nodejs/actions/workflows/ci.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/digipolisantwerp/request_log_module_nodejs/badge.svg?branch=main)](https://coveralls.io/github/digipolisantwerp/request_log_module_nodejs?branch=main)
[![npm version](https://badge.fury.io/js/@digipolis%2Frequest-log.svg)](https://badge.fury.io/js/%40digipolis%2Frequest-log)

**npm:** [npmjs.com/package/@digipolis/request-log](https://www.npmjs.com/package/@digipolis/request-log)
# @digipolis/request-log
<img src="assets/log_request.svg" alt="log" width="100"/>

Request Log helper to log incoming / outgoing calls.


### Table of contents:

<!--ts-->
   * [Installing](#installing)
      * [npm](#npm)
      * [Yarn](#yarn)
   * [Configuration](#configuration)
   * [Example](#example)
   * [Running the tests](#running-the-tests)
   * [Dependencies](#dependencies)
   * [Versioning](#versioning)
   * [Authors](#authors)
   * [License](#license)
<!--te-->

## Spec
[https://github.com/digipolisantwerpdocumentation/logging-requirements](https://github.com/digipolisantwerpdocumentation/logging-requirements)
## Installing

#### npm:
```sh
$ npm i @digipolis/request-log
```

#### Yarn:
```sh
$ yarn add @digipolis/request-log
```

## Configuration

##### Params:
| Param                                      | Description                       | Values                                                                                                  |
| :---                                       | :---                              | :---                                                                                                    |
| ***type*** *(optional)*                    | Set logging mode                  | **log** (default) / **json** / **text** /**silent**/                                                    |
| ***correlationIdLocation*** *(optional)*   | Set correlation Location for BFF  | undefined (default will search the req.headers) / **id** (point to req.id)                              |
| ***correlationIdfallback*** *(optional)*   | Set correlationId fallback        | undefined (default will not fallback) / **string** (will replace correlationId in output if missing)    |
| ***logResponsePayload*** *(optional)*      | log response payload              | **true** / **false** (default)                                                                          |
| ***logResponseHeaders*** *(optional)*      | log response headers              | **true** (all headers) / `["headername1", "headername2"]` (log headers in array) / **false** (default)  |
| ***logRequestPayload*** *(optional)*       | log request headers               | **true** (default) / **false** (return)                                                                 |
| ***logRequestHeaders*** *(optional)*       | log request payload               | **true** (all headers) / `["headername1", "headername2"]`  (log headers in array) / **false** (default) |

### Example:

#### Example log specific headers & body:
```javascript
const { requestlogger, requestMiddleware } = require('@digipolis/request-log');

const config = {
  type: 'json',
};

// log external requests
requestlogger(config);

function initializeExpress() {
   const app = express();
   // log incoming requests
   app.use(requestMiddleware(config));
   app.post('/internalcall', (req, res) => res.json({ ok: 'ok' }));
}

```
##### Request

```sh
$ curl -X "POST" "http://localhost:2000/internalcall" \
     -H 'supersecret: ???' \
     -H 'Dgp-Correlation: correlationid' \
     -d $'{
  "a": "b",
  "d": "c"
}'
```
##### output

```javascript
// output
{
  timestamp: '2021-12-17T10:28:26.505Z',
  type: [ 'application' ],
  level: 'INFO',
  correlationId: 'correlationid',
  request: { host: 'localhost:2000', path: '/internalcall', method: 'POST' },
  response: { status: 200, duration: 2 },
  protocol: 'http'
}
```
#### Example log specific headers & body BFF:
```javascript
const { requestlogger, requestMiddleware } = require('@digipolis/request-log');

const config = {
  type: 'json',
  correlationIdLocation: 'id', // deeper nested property 'meta.id'
};

// log external requests
requestlogger(config);

function initializeExpress() {
   const app = express();
   // For BFF type applications the browser will not set the DGP header so we set it ourselves
   app.use((req, res, next) => {
      req.id = uuidv4(); // b207d502-de0f-4467-9a1e-2dd032fbe84d
      return next();
   });
   // log incoming requests
   app.use(requestMiddleware(config);
   app.post('/internalcall', (req, res) => res.json({ ok: 'ok' }));
}

```
##### Request

```sh
$ curl -X "GET" "http://localhost:2000/home" \
```
##### output

```javascript
// output
{
  timestamp: '2021-12-17T10:28:26.505Z',
  type: [ 'application' ],
  level: 'INFO',
  correlationId: 'b207d502-de0f-4467-9a1e-2dd032fbe84d',
  request: { host: 'localhost:2000', path: '/home', method: 'GET' },
  response: { status: 200, duration: 2 },
  protocol: 'http'
}
```

#### Example log specific headers & body:
```javascript
const { requestlogger, requestMiddleware } = require('@digipolis/request-log');

const config = {
  type: 'json',
  logResponsePayload: true,
  logRequestHeaders: ['dgp-correlation'],
  logRequestPayload: true,
  logResponseHeaders: ['x-powered-by'],
};

// log external requests
requestlogger(config);

function initializeExpress() {
   const app = express();
   // log incoming requests
   app.use(requestMiddleware(config);
   app.post('/internalcall', (req, res) => res.json({ ok: 'ok' }));
}

```

##### Request

```sh
$ curl -X "POST" "http://localhost:2000/internalcall" \
     -H 'supersecret: ???' \
     -H 'Dgp-Correlation: correlationid' \
     -d $'{
  "a": "b",
  "d": "c"
}'
```
##### output

```javascript
// output
{
  timestamp: '2021-12-17T10:26:20.205Z',
  type: [ 'application' ],
  level: 'INFO',
  correlationId: 'correlationid',
  request: {
    headers: { 'dgp-correlation': 'correlationid' },
    host: 'localhost:2000',
    path: '/internalcall',
    method: 'POST',
    payload: {}
  },
  response: {
    headers: { 'x-powered-by': 'Express' },
    status: 200,
    duration: 1,
    payload: '{"ok":"ok"}'
  },
  protocol: 'http'
}
```

#### Example with full headers & body:
```javascript
const { requestlogger, requestMiddleware } = require('@digipolis/request-log');


const config = {
  type: 'json',
  logResponsePayload: true,
  logRequestHeaders: true,
  logRequestPayload: true,
  logResponseHeaders: true,
};
// log external requests
requestlogger(config);

function initializeExpress() {
   const app = express();
   // log incoming requests
   app.use(requestMiddleware(config);
   app.post('/internalcall', (req, res) => res.json({ ok: 'ok' }));
}
```
##### Request

```sh
$ curl -X "POST" "http://localhost:2000/internalcall" \
     -H 'supersecret: ???' \
     -H 'Dgp-Correlation: correlationid' \
     -d $'{
  "a": "b",
  "d": "c"
}'
```
##### output

```javascript
// output
{
  timestamp: '2021-12-17T10:23:08.238Z',
  type: [ 'application' ],
  level: 'INFO',
  correlationId: 'correlationid',
  request: {
    headers: {
      supersecret: '???',
      'dgp-correlation': 'correlationid',
      host: 'localhost:2000',
      connection: 'close',
      'content-length': '17'
    },
    host: 'localhost:2000',
    path: '/internalcall',
    method: 'POST',
    payload: {}
  },
  response: {
    headers: [Object: null prototype] {
      'x-powered-by': 'Express',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '11',
      etag: 'W/"b-2F/2BWc0KYbtLqL5U2Kv5B6uQUQ"'
    },
    status: 200,
    duration: 2,
    payload: '{"ok":"ok"}'
  },
  protocol: 'http'
}
```

## Running the tests

Run the tests in this repo:

```bash
$ npm run test
$ npm run coverage
```
## Dependencies
-  **@digipolis/log:** [npm](https://www.npmjs.com/package/@digipolis/log), [Github](https://github.com/digipolisantwerp/log_module_nodejs)

## Versioning

We use [SemVer](http://semver.org/)

for versioning. For the released version check changelog / tags

## Contributing

Pull requests are always welcome, however keep the following things in mind:

- New features (both breaking and non-breaking) should always be discussed with the [repo's owner](#support). If possible, please open an issue first to discuss what you would like to change.
- Fork this repo and issue your fix or new feature via a pull request.
- Please make sure to update tests as appropriate. Also check possible linting errors and update the CHANGELOG.md if applicable.

## Support

* Olivier Van den Mooter (<olivier.vandenmooter@digipolis.be>) - *Initial work* - [Vademo](https://github.com/vademo)

See also the list of [contributors](https://github.com/digipolisantwerp/authz_module_nodejs/graphs/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
