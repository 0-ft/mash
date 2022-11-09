# mash simple encrypted calendars
## backend server

### Developing
0. Build the client
1. Install modules: `npm install`
2. Generate the request schemas: `npm run schemas`
3. Build: `npm run build`
4. Create a `.env` file from the `.env.sample` file
5. Start the docker containers: `docker compose up`
6. To rebuild and push to a running server container; `npm run build-and-push`

### Project Structure
```
├── build
│   └── index.js
├── docker-compose.yml      docker-compose for server with mongodb
├── Dockerfile              Dockerfile to build mash-server image
├── package.json            Node config for mash-server
├── README.md               This file
├── src
│   ├── db.ts               mongodb API
│   ├── index.ts            Entrypoint for mash-server
│   ├── request-types.ts          Schemas for requests and responses
│   └── mash-server.ts           Handles actions from express server
├── testing.ts
└── tsconfig.json           TypeScript config for mash-server
```