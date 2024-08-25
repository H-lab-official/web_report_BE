import prisma from '../prismaClient.js';
import client from '../redisClient.js';

// Enum for the 'type' field
const AppointmentType = Object.freeze({
    EXAM: 'สอบ',
    TRAINING: 'อบรม'
});

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

export async function getappointments(req, res) {
    const { title, type, user_like, user_dislike, user_share, user_fav, user_view, log_rating, location_detail, link_map, link_out, date_start, date_end, time_start, time_end } = req.query;

    try {
        let cacheLogContent = await client.get('log_appointments');

        if (!cacheLogContent) {
            await updateappointmentsCache();
            cacheLogContent = await client.get('log_appointments');
        }

        if (cacheLogContent) {
            let appointments = JSON.parse(cacheLogContent);

            if (title) {
                appointments = appointments.filter(item => item.title.includes(title));
            }

            // Filter by type (enum values "สอบ" and "อบรม")
            if (type && Object.values(AppointmentType).includes(type)) {
                appointments = appointments.filter(item => item.type === type);
            }

            // Filter by user_like
            if (user_like) {
                appointments = appointments.filter(item => {
                    const likes = JSON.parse(item.user_like || '[]');
                    return likes.includes(user_like);
                });
            }

            // Filter by user_dislike
            if (user_dislike) {
                appointments = appointments.filter(item => {
                    const dislikes = JSON.parse(item.user_dislike || '[]');
                    return dislikes.includes(user_dislike);
                });
            }

            // Filter by user_share
            if (user_share) {
                appointments = appointments.filter(item => {
                    const shares = JSON.parse(item.user_share || '{}');
                    return Object.keys(shares).includes(user_share);
                });
            }

            // Filter by user_fav
            if (user_fav) {
                appointments = appointments.filter(item => {
                    const favs = JSON.parse(item.user_fav || '{}');
                    return Object.keys(favs).includes(user_fav);
                });
            }

            // Filter by user_view
            if (user_view) {
                appointments = appointments.filter(item => {
                    const views = JSON.parse(item.user_view || '{}');
                    return Object.keys(views).includes(user_view);
                });
            }

            // Filter by log_rating
            if (log_rating) {
                appointments = appointments.filter(item => {
                    const ratings = JSON.parse(item.log_rating || '{}');
                    return Object.keys(ratings).includes(log_rating);
                });
            }

            // Filter by location_detail
            if (location_detail) {
                appointments = appointments.filter(item => item.location_detail.includes(location_detail));
            }

            // Filter by link_map
            if (link_map) {
                appointments = appointments.filter(item => item.link_map.includes(link_map));
            }

            // Filter by link_out
            if (link_out) {
                appointments = appointments.filter(item => item.link_out.includes(link_out));
            }

            // Filter by date_start and date_end
            if (date_start || date_end) {
                const startDate = new Date(date_start);
                const endDate = new Date(date_end);
                appointments = appointments.filter(item => {
                    const itemStartDate = new Date(item.date_start);
                    const itemEndDate = new Date(item.date_end);
                    return (!date_start || itemStartDate >= startDate) && (!date_end || itemEndDate <= endDate);
                });
            }

            // Filter by time_start and time_end
            if (time_start || time_end) {
                const startTime = new Date(`1970-01-01T${time_start}`).getTime();
                const endTime = new Date(`1970-01-01T${time_end}`).getTime();
                appointments = appointments.filter(item => {
                    const itemStartTime = new Date(`1970-01-01T${item.time_start}`).getTime();
                    const itemEndTime = new Date(`1970-01-01T${item.time_end}`).getTime();
                    return (!time_start || itemStartTime >= startTime) && (!time_end || itemEndTime <= endTime);
                });
            }

            if (appointments.length > 0) {
                res.json(appointments);
            } else {
                res.status(404).json({ error: 'Content not found.' });
            }
        } else {
            res.status(500).json({ error: 'Failed to retrieve log training data.' });
        }
    } catch (error) {
        console.error('Error in getappointmentsLog:', error);
        res.status(500).json({ error: 'An error occurred while retrieving log appointments data.' });
    }
}

export async function updateappointmentsCache() {
    try {
        const users = await prisma.appointments.findMany();
        const formattedUsers = convertBigIntToString(users);
        await client.set('log_appointments', JSON.stringify(formattedUsers), { EX: 1 * 24 * 60 * 60 });
    } catch (error) {
        console.error('Error updating log_appointments cache:', error);
    }
}
