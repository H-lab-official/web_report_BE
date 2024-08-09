import express from 'express';
import { PrismaClient } from '@prisma/client';
import redis from 'redis';
import cors from 'cors';

const prisma = new PrismaClient();
const app = express();
const client = redis.createClient();

client.on('error', (err) => console.log('Redis Client Error', err));


client.connect();
app.use(cors());
app.use(express.json());


function convertBigIntToString(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }

  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    acc[key] = typeof value === 'bigint' ? value.toString() : convertBigIntToString(value);
    return acc;
  }, {});
}

app.get('/logs', async (req, res) => {
  const { log_content, startDate, endDate, user_id, name, current_rank } = req.query;

  if (!log_content) {
    return res.status(400).json({ error: "log_content is required" });
  }

  const filters = {
    where: {
      log_content: {
        contains: log_content,
      },
      AND: [],
    },
    orderBy: {
      created_at: 'asc',
    },
  };


  if (startDate && endDate) {
    filters.where.AND.push({
      created_at: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    });
  }


  if (user_id) {
    filters.where.AND.push({
      user_id: parseInt(user_id),
    });
  }


  if (name) {
    filters.where.AND.push({
      name: {
        contains: name,
      },
    });
  }


  if (current_rank) {
    filters.where.AND.push({
      current_rank: {
        contains: current_rank,
      },
    });
  }


  const cacheKey = `logs_${log_content}_${startDate || 'all'}_${endDate || 'all'}_${user_id || 'all'}_${name || 'all'}_${current_rank || 'all'}`;
  const cachedlogs = await client.get(cacheKey);

  if (cachedlogs) {
    return res.json(JSON.parse(cachedlogs));
  }

  try {

    const logs = await prisma.logs_with_user_info.findMany(filters);
    const formattedLogs = convertBigIntToString(logs);
    await client.set(cacheKey, JSON.stringify(logs), {
      EX: 3600,
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: "An error occurred while fetching logs" });
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
