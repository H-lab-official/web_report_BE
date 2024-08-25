// controllers/countController.js
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
export async function getactivitys(req, res) {
    const { id, datetime_start, title, user_like, user_dislike, user_share, user_fav, user_view ,log_rating} = req.query;

    try {
        let cacheLogContent = await client.get('log_activitys');

        if (!cacheLogContent) {
            await updateactivitysCache();
            cacheLogContent = await client.get('log_activitys');
        }

        if (cacheLogContent) {
            let activitys = JSON.parse(cacheLogContent);
            if (title) {
                activitys = activitys.filter(item => item.title.includes(title));
            }

            // Filter by user_like
            if (user_like) {
                activitys = activitys.filter(item => {
                    const likes = JSON.parse(item.user_like || '[]');
                    return likes.includes(user_like);
                });
            }

            // Filter by user_dislike
            if (user_dislike) {
                activitys = activitys.filter(item => {
                    const dislikes = JSON.parse(item.user_dislike || '[]');
                    return dislikes.includes(user_dislike);
                });
            }

            // Filter by user_share
            if (user_share) {
                activitys = activitys.filter(item => {
                    const shares = JSON.parse(item.user_share || '{}');
                    return Object.keys(shares).includes(user_share);
                });
            }

            // Filter by user_fav
            if (user_fav) {
                activitys = activitys.filter(item => {
                    const favs = JSON.parse(item.user_fav || '{}');
                    return Object.keys(favs).includes(user_fav);
                });
            }

            // Filter by user_view
            if (user_view) {
                activitys = activitys.filter(item => {
                    const views = JSON.parse(item.user_view || '{}');
                    return Object.keys(views).includes(user_view);
                });
            }

            // Filter by log_rating
            if (log_rating) {
                activitys = activitys.filter(item => {
                    const ratings = JSON.parse(item.log_rating || '{}');
                    return Object.keys(ratings).includes(log_rating);
                });
            }

            if (activitys.length > 0) {
                res.json(activitys);
            } else {
                res.status(404).json({ error: 'Content not found.' });
            }
        } else {
            res.status(500).json({ error: 'Failed to retrieve log training data.' });
        }
    } catch (error) {
        console.error('Error in getactivitysLog:', error);
        res.status(500).json({ error: 'An error occurred while retrieving log activitys data.' });
    }
}


export async function updateactivitysCache() {
    try {
        const users = await prisma.activitys.findMany();
        const formattedUsers = convertBigIntToString(users);
        await client.set('log_activitys', JSON.stringify(formattedUsers), { EX: 1 * 24 * 60 * 60 });
    } catch (error) {
        console.error('Error updating log_activitys cache:', error);
    }
}