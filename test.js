import redis from 'redis';

const client = redis.createClient({
    url: 'redis://:Hlab@redisReport@188.166.176.239:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

client.connect().then(async () => {
    console.log('Connected to Redis');
    const response = await client.ping();
    console.log('PING response:', response);
    client.quit();
});