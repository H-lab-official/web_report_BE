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
export async function getProducts(req, res) {
    const { id, datetime_start, title, user_like, user_share, user_fav, user_view, sum_rating, log_rating, user_download_pdf } = req.query;

    try {
        let cacheLogContent = await client.get('log_products');

        if (!cacheLogContent) {
            await updateProductsCache();
            cacheLogContent = await client.get('log_products');
        }

        if (cacheLogContent) {
            let products = JSON.parse(cacheLogContent);

            // Filter by id
            if (id) {
                products = products.filter(product => product.id === parseInt(id));
            }

            // Filter by datetime_start
            if (datetime_start) {
                const startDate = new Date(datetime_start).getTime();
                products = products.filter(product => {
                    const productDate = new Date(product.datetime_start).getTime();
                    return productDate >= startDate;
                });
            }

            // Filter by title
            if (title) {
                products = products.filter(product => product.title.includes(title));
            }

            // Filter by user_like
            if (user_like) {
                products = products.filter(product => {
                    const likes = JSON.parse(product.user_like || '[]');
                    return likes.includes(user_like);
                });
            }

            // Filter by user_share
            if (user_share) {
                products = products.filter(product => {
                    const shares = JSON.parse(product.user_share || '{}');
                    return Object.keys(shares).includes(user_share);
                });
            }

            // Filter by user_fav
            if (user_fav) {
                products = products.filter(product => {
                    const favs = JSON.parse(product.user_fav || '{}');
                    return Object.keys(favs).includes(user_fav);
                });
            }

            // Filter by user_view
            if (user_view) {
                products = products.filter(product => {
                    const views = JSON.parse(product.user_view || '{}');
                    return Object.keys(views).includes(user_view);
                });
            }

            // Filter by sum_rating
            if (sum_rating) {
                products = products.filter(product => product.sum_rating === sum_rating);
            }

            // Filter by log_rating
            if (log_rating) {
                products = products.filter(product => {
                    const ratings = JSON.parse(product.log_rating || '{}');
                    return Object.keys(ratings).includes(log_rating);
                });
            }

            // Filter by user_download_pdf
            if (user_download_pdf) {
                products = products.filter(product => {
                    const downloads = JSON.parse(product.user_download_pdf || '{}');
                    return Object.keys(downloads).includes(user_download_pdf);
                });
            }

            if (products.length > 0) {
                res.json(products);
            } else {
                res.status(404).json({ error: 'Content not found.' });
            }
        } else {
            res.status(500).json({ error: 'Failed to retrieve log products data.' });
        }
    } catch (error) {
        console.error('Error in getProducts:', error);
        res.status(500).json({ error: 'An error occurred while retrieving log products data.' });
    }
}



export async function updateProductsCache() {
    try {
        const users = await prisma.products.findMany();
        const formattedUsers = convertBigIntToString(users);
        await client.set('log_products', JSON.stringify(formattedUsers), { EX: 1 * 24 * 60 * 60 });
    } catch (error) {
        console.error('Error updating log_products cache:', error);
    }
}