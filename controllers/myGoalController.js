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
export async function getMyGoal(req, res) {
    let cacheMyGoal = await client.get('my_goal_users')
    if (!cacheMyGoal) {
        await updateGoalCache()
        cacheMyGoal = await client.get('my_goal_users')
    }
    let myGoal = JSON.parse(cacheMyGoal)
    res.json(myGoal);
}
export async function updateGoalCache() {
    try {
        const my_goal_users = await prisma.my_goal_users_with_user_info.findMany();
        const formattedmy_goal_users = convertBigIntToString(my_goal_users);
        await client.set('my_goal_users', JSON.stringify(formattedmy_goal_users), { EX: 1 * 24 * 60 * 60 });
    } catch (error) {
        console.error('Error updating my goal users cache:', error);
    }
}
