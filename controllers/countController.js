// controllers/countController.js
import prisma from '../prismaClient.js';
import client from '../redisClient.js';

export async function countRanks(req, res) {
  const cacheKey = `count_current_rank`;
  const cachedCount = await client.get(cacheKey);

  if (cachedCount) {
    return res.json(JSON.parse(cachedCount));
  }

  try {
    const counts = await prisma.logs_with_user_info.groupBy({
      by: ['current_rank'],
      _count: {
        current_rank: true,
      },
    });

    await client.set(cacheKey, JSON.stringify(counts), {
      EX: 3600,
    });

    res.json(counts);
  } catch (error) {
    console.error('Error fetching current_rank counts:', error);
    res.status(500).json({ error: "An error occurred while fetching current_rank counts" });
  }
}

// export async function countContent(req, res) {
//   const cacheKey = `count_content`;
//   const cachedCount = await client.get(cacheKey);

//   if (cachedCount) {
//     return res.json(JSON.parse(cachedCount));
//   }

//   try {
//     const counts = await prisma.logs_with_user_info.groupBy({
//       by: ['log_content'],
//       _count: {
//         log_content: true,
//       },
//     });

//     const distinctLogContentCount = counts.length;

//     const response = {
//       totalDistinctLogContent: distinctLogContentCount,
//       counts,
//     };

//     await client.set(cacheKey, JSON.stringify(response), {
//       EX: 3600,
//     });

//     res.json(response);
//   } catch (error) {
//     console.error('Error fetching log_content counts:', error);
//     res.status(500).json({ error: "An error occurred while fetching log_content counts" });
//   }
// }
export async function countContent(req, res) {
  const cacheKey = `count_content`;
  const cachedCount = await client.get(cacheKey);

  if (cachedCount) {
    return res.json(JSON.parse(cachedCount));
  }

  try {
    // นับจำนวน log_content แบ่งตามวันที่
    const countsByDate = await prisma.logs_with_user_info.groupBy({
      by: ['log_content', 'created_at'], // นับตาม log_content และวันที่
      _count: {
        log_content: true,
      },
    });

    // นับจำนวน log_content ทั้งหมดโดยไม่สนใจวันที่
    const totalCounts = await prisma.logs_with_user_info.groupBy({
      by: ['log_content'], // นับเฉพาะ log_content ไม่สนใจวันที่
      _count: {
        log_content: true,
      },
    });

    // ฟอร์แมตวันที่เพื่อให้เป็นรูปแบบที่สามารถนำมาใช้งานได้ง่าย
    const formattedCountsByDate = countsByDate.map((item) => ({
      log_content: item.log_content,
      date: item.created_at.toISOString().split('T')[0], // แปลงเป็นรูปแบบ YYYY-MM-DD
      count: item._count.log_content,
    }));

    const formattedTotalCounts = totalCounts.map((item) => ({
      log_content: item.log_content,
      total_count: item._count.log_content,
    }));

    const distinctLogContentCount = formattedCountsByDate.length;

    const response = {
      totalDistinctLogContent: distinctLogContentCount,
      countsByDate: formattedCountsByDate, // ข้อมูลการนับโดยแยกตามวัน
      totalCounts: formattedTotalCounts,   // ข้อมูลการนับทั้งหมดไม่สนใจวันที่
    };

    await client.set(cacheKey, JSON.stringify(response), {
      EX: 3600,
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching log_content counts:', error);
    res.status(500).json({ error: "An error occurred while fetching log_content counts" });
  }
}
