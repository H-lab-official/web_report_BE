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
        // Get data from cache
        let appointments = await client.get('log_appointments');

        // If cache is empty, update it
        if (!appointments) {
            await updateappointmentsCache();
            appointments = await client.get('log_appointments');
        }

        appointments = JSON.parse(appointments);

        // Prepare the filters
        const filters = {};

        if (title) filters.title = { contains: title };
        if (type && Object.values(AppointmentType).includes(type)) filters.type = type;
        if (user_like) filters.user_like = { has: user_like };
        if (user_dislike) filters.user_dislike = { has: user_dislike };
        if (user_share) filters.user_share = { has: user_share };
        if (user_fav) filters.user_fav = { has: user_fav };
        if (user_view) filters.user_view = { has: user_view };
        if (log_rating) filters.log_rating = { has: log_rating };
        if (location_detail) filters.location_detail = { contains: location_detail };
        if (link_map) filters.link_map = { contains: link_map };
        if (link_out) filters.link_out = { contains: link_out };

        // Filter by date_start and date_end
        if (date_start || date_end) {
            filters.date_start = { gte: new Date(date_start) };
            filters.date_end = { lte: new Date(date_end) };
        }

        // Filter by time_start and time_end
        if (time_start || time_end) {
            filters.time_start = { gte: time_start };
            filters.time_end = { lte: time_end };
        }

        // Apply the filters
        appointments = appointments.filter(appointment =>
            Object.keys(filters).every(key =>
                Array.isArray(filters[key])
                    ? filters[key].includes(appointment[key])
                    : appointment[key] && appointment[key].toString().includes(filters[key])
            )
        );

        if (appointments.length > 0) {
            res.json(appointments);
        } else {
            res.status(404).json({ error: 'Content not found.' });
        }
    } catch (error) {
        console.error('Error in getappointments:', error);
        res.status(500).json({ error: 'An error occurred while retrieving appointments data.' });
    }
}

export async function updateappointmentsCache() {
    try {
        const appointments = await prisma.appointments.findMany();
        const formattedAppointments = convertBigIntToString(appointments);
        await client.set('log_appointments', JSON.stringify(formattedAppointments), { EX: 1 * 24 * 60 * 60 });
    } catch (error) {
        console.error('Error updating log_appointments cache:', error);
    }
}
