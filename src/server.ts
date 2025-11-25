import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
const server = express();

server.use(cors());
server.use(bodyParser.json());
server.use(express.text({ type: 'text/plain' }));

export default server;


