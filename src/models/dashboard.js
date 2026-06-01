const db = require("../config/dbConf");

const Dashboard = {
  getSummaryArea: async (id_user) => {
    query = `
        WITH AreaTerbatas AS (
    SELECT a.id_area, a.nama, a.status 
    FROM area a
    JOIN tandon t USING (id_area)
    WHERE a.id_user = ?
    GROUP BY a.id_area, a.nama, a.status
    ORDER BY MAX(t.device_id) DESC, a.id_area DESC 
    LIMIT 3
),
TandonBerurutan AS (
    SELECT 
        t.*,
        ROW_NUMBER() OVER (PARTITION BY t.id_area ORDER BY t.device_id DESC, t.id_tandon) as nomor_urut
    FROM tandon t
    WHERE t.id_area IN (SELECT id_area FROM AreaTerbatas)
)
SELECT 
    a.id_area,
    a.nama AS nama_area,
    a.status AS status_area,
    t.id_tandon,
    t.nama_tandon,
    t.device_id,
    t.mode_otomatis,
    t.status_pompa,
    t.status_s1,
    t.status_s2,
    t.min_ph,
    t.max_ph,
    t.min_ppm,
    t.max_ppm,
    t.min_volume,
    t.last_seen
FROM AreaTerbatas a
LEFT JOIN TandonBerurutan t ON a.id_area = t.id_area AND t.nomor_urut <= 2
ORDER BY t.device_id DESC, a.id_area DESC, t.id_tandon ASC;`;

    const [rows] = await db.query(query, [id_user]);
    // --- PROSES MAPPING KE NESTED ARRAY ---
    const mappedData = [];

    rows.forEach((row) => {
      // Cari apakah area ini sudah terdaftar di array mappedData
      let area = mappedData.find((a) => a.id_area === row.id_area);

      // Jika belum ada, buat kerangka objek area baru
      if (!area) {
        area = {
          id_area: row.id_area,
          nama_area: row.nama_area,
          status_area: row.status_area,
          list_tandon: [],
        };
        mappedData.push(area);
      }

      // Jika id_tandon tidak null (kebun ada isinya), push tandon ke dalam list_tandon kebun tersebut
      if (row.id_tandon) {
        area.list_tandon.push({
          id_tandon: row.id_tandon,
          nama_tandon: row.nama_tandon,
          device_id: row.device_id,
          mode_otomatis: row.mode_otomatis,
          status_pompa: row.status_pompa,
          status_s1: row.status_s1,
          status_s2: row.status_s2,
          min_ph: row.min_ph,
          max_ph: row.max_ph,
          min_ppm: row.min_ppm,
          max_ppm: row.max_ppm,
          min_volume: row.min_volume,
          last_seen: row.last_seen,
        });
      }
    });

    return mappedData;
  },
};

module.exports = Dashboard;
