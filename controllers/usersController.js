// controllers/usersController.js
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

export async function getUsers(req, res) {
  const { user_id, name, check_pdpa, current_rank, startDate, endDate, check_video_welcome_page, account, role } = req.query;

  let cachedUsers = await client.get('data_users');

  if (!cachedUsers) {
    await updateUserCache();
    cachedUsers = await client.get('data_users');
  }

  let users = JSON.parse(cachedUsers);

  // Filter by user_id
  if (user_id) {
    users = users.filter(user => String(user.id) === String(user_id));
  }

  // Filter by name
  if (name) {
    users = users.filter(user => user.name && user.name.includes(name));
  }
  if (account) {
    users = users.filter(user => user.account && user.account.includes(account))
  }
  if (role) {
    role = role.filter(user => user.role && user.role.includes(role))
  }
  // Filter by check_pdpa
  if (check_pdpa === "NotChecked") {
    users = users.filter(user => user.check_pdpa === null);
  } else if (check_pdpa) {
    users = users.filter(user => user.check_pdpa === check_pdpa);
  }
  if (check_video_welcome_page === "NotChecked") {
    users = users.filter(user => user.check_video_welcome_page === null)
  } else if (check_video_welcome_page) {
    users = users.filter(user => user.check_video_welcome_page === check_video_welcome_page)
  }
  // Filter by current_rank
  if (current_rank) {
    users = users.filter(user => user.current_rank === current_rank);
  }

  // Filter by date range
  if (startDate && endDate) {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    users = users.filter(user => {
      const userDate = new Date(user.created_at).getTime();
      return userDate >= start && userDate <= end;
    });
  }

  res.json(users);
}


export async function updateUserCache() {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        check_pdpa: true,
        current_rank: true,
        created_at: true,
        status_login: true,
        check_video_welcome_page: true,
        account: true,
        role: true
      },
    });
    const formattedUsers = convertBigIntToString(users);
    await client.set('data_users', JSON.stringify(formattedUsers), { EX: 7 * 24 * 60 * 60 });
  } catch (error) {
    console.error('Error updating user data cache:', error);
  }
}
