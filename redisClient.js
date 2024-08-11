// redisClient.js
import redis from 'redis';

const client = redis.createClient();

client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();

export default client;
