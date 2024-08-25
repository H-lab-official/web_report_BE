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
    const { period, startDate, endDate, user_id, goal, price, status, name, taskStartDate, taskEndDate, current_rank } = req.query;

    let cacheMyGoal = await client.get('my_goal_users');
    if (!cacheMyGoal) {
        await updateGoalCache();
        cacheMyGoal = await client.get('my_goal_users');
    }
    let myGoal = JSON.parse(cacheMyGoal);

    // Filter by period
    if (period) {
        myGoal = myGoal.filter(goal => goal.period === period);
    }

    // Filter by creation date range
    if (startDate && endDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        myGoal = myGoal.filter(goal => {
            const myGoalDate = new Date(goal.created_at).getTime();
            return myGoalDate >= start && myGoalDate <= end;
        });
    }

    // Filter by user_id
    if (user_id) {
        myGoal = myGoal.filter(goal => goal.user_id === parseInt(user_id));
    }

    // Filter by goal
    if (goal) {
        myGoal = myGoal.filter(g => g.goal.toLowerCase().includes(goal.toLowerCase()));
    }

    // Filter by price
    if (price) {
        myGoal = myGoal.filter(g => parseFloat(g.price.replace(/,/g, '')) === parseFloat(price));
    }

    // Filter by status
    if (status) {
        myGoal = myGoal.filter(g => g.status ? g.status.toLowerCase() === status.toLowerCase() : false);
    }

    // Filter by name
    if (name) {
        myGoal = myGoal.filter(g => g.name.toLowerCase().includes(name.toLowerCase()));
    }

    // Filter by task start date
    if (taskStartDate) {
        const taskStart = new Date(taskStartDate).setHours(0, 0, 0, 0);
        myGoal = myGoal.filter(goal => {
            const goalStartDate = new Date(goal.date_start).getTime();
            return goalStartDate >= taskStart;
        });
    }

    // Filter by task end date
    if (taskEndDate) {
        const taskEnd = new Date(taskEndDate).setHours(23, 59, 59, 999);
        myGoal = myGoal.filter(goal => {
            const goalEndDate = new Date(goal.date_end).getTime();
            return goalEndDate <= taskEnd;
        });
    }
    const allowedRanks = ['AG', 'AVP', 'DM', 'EVP', 'SDM', 'SUM', 'UM', 'VP'];
    if (current_rank && allowedRanks.includes(current_rank)) {
        myGoal = myGoal.filter(goal => goal.current_rank === current_rank);
    }
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
