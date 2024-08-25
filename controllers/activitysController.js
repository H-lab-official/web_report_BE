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
    const { id, datetime_start, title, user_like, user_dislike, user_share, user_fav, user_view, log_rating } = req.query;

    try {
        let cacheLogContent = await client.get('log_activitys');

        if (!cacheLogContent) {
            await updateactivitysCache();
            cacheLogContent = await client.get('log_activitys');
        }

        if (cacheLogContent) {
            let activitys = JSON.parse(cacheLogContent);

            // Apply filtering
            activitys = activitys.filter(item => {
                let include = true;

                if (title && !item.title.includes(title)) include = false;

                if (user_like) {
                    const likes = JSON.parse(item.user_like || '[]');
                    if (!likes.includes(user_like)) include = false;
                }

                if (user_dislike) {
                    const dislikes = JSON.parse(item.user_dislike || '[]');
                    if (!dislikes.includes(user_dislike)) include = false;
                }

                if (user_share) {
                    const shares = JSON.parse(item.user_share || '{}');
                    if (!Object.keys(shares).includes(user_share)) include = false;
                }

                if (user_fav) {
                    const favs = JSON.parse(item.user_fav || '{}');
                    if (!Object.keys(favs).includes(user_fav)) include = false;
                }

                if (user_view) {
                    const views = JSON.parse(item.user_view || '{}');
                    if (!Object.keys(views).includes(user_view)) include = false;
                }

                if (log_rating) {
                    const ratings = JSON.parse(item.log_rating || '{}');
                    if (!Object.keys(ratings).includes(log_rating)) include = false;
                }

                return include;
            });

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
        const activitys = await prisma.activitys.findMany();
        const formattedActivitys = convertBigIntToString(activitys);
        await client.set('log_activitys', JSON.stringify(formattedActivitys), { EX: 1 * 24 * 60 * 60 }); 
    } catch (error) {
        console.error('Error updating log_activitys cache:', error);
    }
}
