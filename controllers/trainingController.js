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
export async function getTrainings(req, res) {
    const { id, datetime_start, title, user_like, user_dislike, user_share, user_fav, user_view } = req.query;

    try {
        let cacheLogContent = await client.get('log_training');

        if (!cacheLogContent) {
            await updateTrainingsCache();
            cacheLogContent = await client.get('log_training');
        }

        if (cacheLogContent) {
            let training = JSON.parse(cacheLogContent);

            // Filter by id
            if (id) {
                training = training.filter(content => content.id === parseInt(id));
            }

            // Filter by datetime_start
            if (datetime_start) {
                const startDate = new Date(datetime_start).getTime();
                training = training.filter(content => {
                    const contentDate = new Date(content.datetime_start).getTime();
                    return contentDate >= startDate;
                });
            }

            // Filter by title
            if (title) {
                training = training.filter(content => content.title.includes(title));
            }

            // Filter by user_like
            if (user_like) {
                training = training.filter(content => {
                    const likes = JSON.parse(content.user_like || '[]');
                    return likes.includes(user_like);
                });
            }

            // Filter by user_dislike
            if (user_dislike) {
                training = training.filter(content => {
                    const dislikes = JSON.parse(content.user_dislike || '[]');
                    return dislikes.includes(user_dislike);
                });
            }

            // Filter by user_share
            if (user_share) {
                training = training.filter(content => {
                    const shares = JSON.parse(content.user_share || '{}');
                    return Object.keys(shares).includes(user_share);
                });
            }

            // Filter by user_fav
            if (user_fav) {
                training = training.filter(content => {
                    const favs = JSON.parse(content.user_fav || '{}');
                    return Object.keys(favs).includes(user_fav);
                });
            }

            // Filter by user_view
            if (user_view) {
                training = training.filter(content => {
                    const views = JSON.parse(content.user_view || '[]');
                    return views.includes(user_view);
                });
            }

            if (training.length > 0) {
                res.json(training);
            } else {
                res.status(404).json({ error: 'Content not found.' });
            }
        } else {
            res.status(500).json({ error: 'Failed to retrieve log training data.' });
        }
    } catch (error) {
        console.error('Error in getLogtraining:', error);
        res.status(500).json({ error: 'An error occurred while retrieving log training data.' });
    }
}


export async function updateTrainingsCache() {
    try {
        const users = await prisma.trainings.findMany();
        const formattedUsers = convertBigIntToString(users);
        await client.set('log_training', JSON.stringify(formattedUsers), { EX: 1 * 24 * 60 * 60 });
    } catch (error) {
        console.error('Error updating log_training cache:', error);
    }
}