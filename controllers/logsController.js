// controllers/logsController.js
import prisma from '../prismaClient.js';
import client from '../redisClient.js';

function convertBigIntToString(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value === 'bigint') {
      acc[key] = value.toString();
    } else if (value instanceof Date) {
      acc[key] = value.toISOString();
    } else {
      acc[key] = convertBigIntToString(value);
    }
    return acc;
  }, {});
}

function convertDatesFromISOString(logs) {
  return logs.map(log => ({
    ...log,
    created_at: log.created_at ? new Date(log.created_at) : null,
    updated_at: log.updated_at ? new Date(log.updated_at) : null,
  }));
}
export async function getLogs(req, res) {
  const { log_content, startDate, endDate, user_id, name, current_rank } = req.query;
  const encodedLogContent = log_content ? encodeURIComponent(log_content) : undefined;
  const encodedName = name ? encodeURIComponent(name) : undefined; 
  const cachedlogs = await client.get('all_logs');
  if (!cachedlogs) {
    await updateCache()
    return res.status(500).json({ error: "Logs are not available at the moment. Please try again later." });
  }
  let logs = convertDatesFromISOString(JSON.parse(cachedlogs));

  if (encodedLogContent) {
    logs = logs.filter(log => log.log_content && log.log_content === decodeURIComponent(encodedLogContent));
  }
  if (startDate && endDate) {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    logs = logs.filter(log => {
      const logDate = new Date(log.created_at).getTime();
      return logDate >= start && logDate <= end;
    });
  }
  if (user_id) {
    logs = logs.filter(log => log.user_id === parseInt(user_id));
  }
  if (encodedName) {
    logs = logs.filter(log => log.name && log.name.includes(decodeURIComponent(encodedName)));
  }
  const allowedRanks = ['AG', 'AVP', 'DM', 'EVP', 'SDM', 'SUM', 'UM', 'VP'];
  if (current_rank && allowedRanks.includes(current_rank)) {
    logs = logs.filter(log => log.current_rank === current_rank);
  }

  res.json(logs);
}


export async function updateCache() {
  try {
    const logs = await prisma.logs_with_user_info.findMany();
    const formattedLogs = convertBigIntToString(logs);
    await client.set('all_logs', JSON.stringify(formattedLogs), { EX: 600 });
  } catch (error) {
    console.error('Error updating cache:', error);
  }
}
