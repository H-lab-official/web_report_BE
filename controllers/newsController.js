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

export async function getNews(req, res) {
    const { title, user_like, user_dislike, user_share, user_fav, user_view, log_rating } = req.query;

    try {
        let cacheNewsContent = await client.get('log_news');

        if (!cacheNewsContent) {
            await updatenewsCache();
            cacheNewsContent = await client.get('log_news');
        }

        if (cacheNewsContent) {
            let news = JSON.parse(cacheNewsContent);

            // Filter by title
            if (title) {
                news = news.filter(item => item.title.includes(title));
            }

            // Filter by user_like
            if (user_like) {
                news = news.filter(item => {
                    const likes = JSON.parse(item.user_like || '[]');
                    return likes.includes(user_like);
                });
            }

            // Filter by user_dislike
            if (user_dislike) {
                news = news.filter(item => {
                    const dislikes = JSON.parse(item.user_dislike || '[]');
                    return dislikes.includes(user_dislike);
                });
            }

            // Filter by user_share
            if (user_share) {
                news = news.filter(item => {
                    const shares = JSON.parse(item.user_share || '{}');
                    return Object.keys(shares).includes(user_share);
                });
            }

            // Filter by user_fav
            if (user_fav) {
                news = news.filter(item => {
                    const favs = JSON.parse(item.user_fav || '{}');
                    return Object.keys(favs).includes(user_fav);
                });
            }

            // Filter by user_view
            if (user_view) {
                news = news.filter(item => {
                    const views = JSON.parse(item.user_view || '{}');
                    return Object.keys(views).includes(user_view);
                });
            }

            // Filter by log_rating
            if (log_rating) {
                news = news.filter(item => {
                    const ratings = JSON.parse(item.log_rating || '{}');
                    return Object.keys(ratings).includes(log_rating);
                });
            }

            if (news.length > 0) {
                res.json(news);
            } else {
                res.status(404).json({ error: 'No news found matching the criteria.' });
            }
        } else {
            res.status(500).json({ error: 'Failed to retrieve news data.' });
        }
    } catch (error) {
        console.error('Error in getNews:', error);
        res.status(500).json({ error: 'An error occurred while retrieving news data.' });
    }
}

export async function updatenewsCache() {
    try {
        const news = await prisma.news.findMany();
        const formattedNews = convertBigIntToString(news);
        await client.set('log_news', JSON.stringify(formattedNews), { EX: 1 * 24 * 60 * 60 });
    } catch (error) {
        console.error('Error updating log_news cache:', error);
    }
}
