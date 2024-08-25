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
export async function getLogContent(req, res) {
    const { id } = req.query; 

    try {
        let cacheLogContent = await client.get('log_content_popup');

        if (!cacheLogContent) {
            await updateLogContentCache();
            cacheLogContent = await client.get('log_content_popup');
        }

        if (cacheLogContent) {
            let content_popups = JSON.parse(cacheLogContent);

            if (id) {                
                content_popups = content_popups.filter(content => content.id === parseInt(id));
            }

            if (content_popups.length > 0) {
                res.json(content_popups);
            } else {
                res.status(404).json({ error: 'Content not found.' });
            }
        } else {
            res.status(500).json({ error: 'Failed to retrieve log content data.' });
        }
    } catch (error) {
        console.error('Error in getLogContent:', error);
        res.status(500).json({ error: 'An error occurred while retrieving log content data.' });
    }
}

export async function updateLogContentCache() {
    try {
        const users = await prisma.content_popups.findMany();
        const formattedUsers = convertBigIntToString(users);
        await client.set('log_content_popup', JSON.stringify(formattedUsers), { EX: 1 * 24 * 60 * 60 });
    } catch (error) {
        console.error('Error updating log_content_popup cache:', error);
    }
}