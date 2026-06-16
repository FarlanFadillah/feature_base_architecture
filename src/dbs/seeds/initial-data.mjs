import Joi from "joi";

/**
 *
 * @param {import("knex").Knex} knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
    // Deletes ALL existing entries
    await knex("types").del();
    await knex("products").del();
    await knex("client_roles").del();
    await knex("workflows").del();
    await knex("alas_hak").del();
    await knex("clients").del();
    await knex("alas_hak_clients").del();
    // Inserts seed entries

    await knex("types").insert([
        { id: 1, name: "SHM" },
        { id: 2, name: "SHGB" },
        { id: 3, name: "SHGU" },
        { id: 4, name: "SHT" },
        { id: 5, name: "NIB" },
    ]);

    await knex("client_roles").insert([
        { id: 1, name: "PEMBERI_HAK" },
        { id: 2, name: "PENERIMA_HAK" },
        { id: 3, name: "PIHAK_PERSETUJUAN" },
        { id: 4, name: "KUASA_PEMBERI" },
        { id: 5, name: "KUASA_PENERIMA" },
        { id: 6, name: "PEMOHON" },
        { id: 7, name: "SAKSI" },
    ]);

    // const [[{ ROLES }]] = await knex.raw(`
    //         SELECT JSON_ARRAYAGG(JSON_OBJECT(cr.name, cr.id)) as ROLES FROM client_roles as cr
    //     `);
    // const [[{ ROLES }]] = await knex.raw(`
    //         SELECT JSON_OBJECTAGG(name, id) as ROLES FROM client_roles
    //     `);

    const [{ ROLES }] = await knex("client_roles").select(
        knex.raw(`
            JSON_OBJECTAGG(name, id) as ROLES
        `),
    );

    // bulk insert ignore default value
    // because knex normalize the data so the missing column will be null
    [
        {
            id: 1,
            name: "JUAL BELI",
            is_transaction: true,
            type_transaction: "FULL_TRANSFER",
            roles: {
                required: [ROLES.PENERIMA_HAK],
                optional: [
                    ROLES.PIHAK_PERSETUJUAN,
                    ROLES.KUASA_PEMBERI,
                    ROLES.KUASA_PENERIMA,
                ],
                auto: [ROLES.PEMBERI_HAK],
            },
        },
        {
            id: 2,
            name: "WARIS",
            is_transaction: true,
            type_transaction: "PARTIAL_TRANSFER",
            roles: {
                required: [ROLES.PENERIMA_HAK],
                optional: [],
                auto: [ROLES.PEMBERI_HAK],
            },
        },
        {
            id: 3,
            name: "HIBAH",
            is_transaction: true,
            type_transaction: "FULL_TRANSFER",
            roles: {
                required: [ROLES.PENERIMA_HAK],
                optional: [
                    ROLES.PIHAK_PERSETUJUAN,
                    ROLES.KUASA_PEMBERI,
                    ROLES.KUASA_PENERIMA,
                ],
                auto: [ROLES.PEMBERI_HAK],
            },
        },
        {
            id: 4,
            name: "PENDAFTARAN PERTAMA",
            roles: {
                required: [ROLES.PENERIMA_HAK],
                optional: [],
                auto: [],
            },
        },
        {
            id: 5,
            name: "PEMECAHAN",
        },
        { id: 6, name: "GANTI NAMA" },
        { id: 7, name: "ROYA" },
        {
            id: 8,
            name: "PISAH HAK BERSAMA",
            is_transaction: true,
            type_transaction: "PARTIAL_RELEASE",
            roles: {
                required: [ROLES.PEMBERI_HAK, ROLES.PENERIMA_HAK],
                optional: [
                    ROLES.PIHAK_PERSETUJUAN,
                    ROLES.KUASA_PEMBERI,
                    ROLES.KUASA_PENERIMA,
                ],
                auto: [],
            },
        },
    ].forEach(async (val) => await knex("products").insert(val));

    // jual beli
    await knex("workflows").insert([
        {
            name: "Alas Hak - Input Alas Hak",
            order: 1,
            prd_id: 1,
            can_skip: false,
            validation: {
                handler: "alashak",
                fields: [{ name: "ah_id", type: "number", required: true }],
                invalidation: null,
            },
        },
        {
            name: "CLients - Input Clients",
            order: 2,
            prd_id: 1,
            can_skip: false,
            validation: {
                handler: "clients",
                fields: [
                    {
                        name: "clients",
                        type: "array",
                        required: true,
                        min: 1,
                        items: [
                            { name: "id", type: "number", required: true },
                            { name: "role_id", type: "number", required: true },
                        ],
                    },
                ],
                invalidation: {
                    strategy: "delete",
                },
            },
        },
        {
            name: "BPHTB - Masuk Survei",
            order: 3,
            prd_id: 1,
            can_skip: false,
            validation: {
                handler: "bphtb",
                fields: [
                    { name: "tgl_berkas_masuk", type: "date", required: true },
                ],
                invalidation: {
                    strategy: "delete",
                },
            },
        },
        {
            name: "BPHTB - Survei",
            order: 4,
            prd_id: 1,
            can_skip: false,
            validation: {
                handler: "bphtb",
                fields: [
                    { name: "tgl_survei", type: "date", required: true },
                    { name: "hasil_survei", type: "number", required: true },
                ],
                invalidation: {
                    strategy: "nullify",
                    fields: ["tgl_survei", "hasil_survei"],
                },
            },
        },
        {
            name: "BPHTB - Perintah Bayar",
            order: 5,
            prd_id: 1,
            can_skip: false,
            validation: {
                handler: "bphtb",
                fields: [
                    {
                        name: "tgl_perintah_bayar",
                        type: "date",
                        required: true,
                    },
                    { name: "total_bayar", type: "number", required: true },
                ],
                invalidation: {
                    strategy: "nullify",
                    fields: ["tgl_perintah_bayar", "total_bayar"],
                },
            },
        },
        {
            name: "BPHTB - Lunas",
            order: 6,
            prd_id: 1,
            can_skip: false,
            validation: {
                handler: "bphtb",
                fields: [
                    {
                        name: "tgl_bayar",
                        type: "date",
                        required: true,
                    },
                ],
                invalidation: {
                    strategy: "nullify",
                    fields: ["tgl_bayar"],
                },
            },
        },
        {
            name: "PPH - Billing",
            order: 7,
            prd_id: 1,
            can_skip: true,
            validation: {
                handler: "pph",
                fields: [
                    { name: "code", type: "string", required: true },
                    { name: "date", type: "date", required: true },
                    { name: "client_id", type: "number", required: true },
                ],
                invalidation: {
                    strategy: "delete",
                },
            },
        },
        {
            name: "PPH - Pembayaran",
            order: 7,
            prd_id: 1,
            can_skip: true,
            validation: {
                handler: "pph",
                fields: [
                    { name: "paid_date", type: "date", required: true },
                    {
                        name: "total_tax",
                        type: "number",
                        required: true,
                    },
                ],
                invalidation: {
                    strategy: "nullify",
                    fields: ["paid_date", "total_tax"],
                },
            },
        },
        {
            name: "AKTA - Input Akta PPAT",
            order: 8,
            prd_id: 1,
            can_skip: false,
            validation: {
                handler: "akta",
                fields: [
                    { name: "number", type: "number", required: true },
                    { name: "year", type: "string", length: 4, required: true },
                    { name: "date", type: "date", required: true },
                ],
                invalidation: {
                    strategy: "delete",
                },
            },
        },
        {
            name: "Proses di BPN",
            order: 9,
            prd_id: 1,
            can_skip: false,
            validation: null,
        },
    ]);

    await knex("alas_hak").insert([
        {
            id: 1,
            no_alas_hak: "03040804100025",
            type_id: 1,
            luas: 100,
            address_code: "13.06.07.2004",
            jor: "Bonjo",
            tgl_alas_hak: "2020-12-12",
            no_surat_ukur: "00030/Panampuang/2020",
            tgl_surat_ukur: "2020-12-11",
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: 2,
            no_alas_hak: "03040804100393",
            type_id: 1,
            luas: 100,
            address_code: "13.06.07.2006",
            jor: "Cibuak Ameh",
            tgl_alas_hak: "2006-12-12",
            no_surat_ukur: "00224/Pasia/2020",
            tgl_surat_ukur: "2006-12-11",
            created_at: new Date(),
            updated_at: new Date(),
        },
    ]);

    await knex("clients").insert([
        {
            id: 1,
            fullname: "John Doe",
            nik: 1307051212770001,
            address_code: "13.07.05.2007",
            gender: "pria",
        },
        {
            id: 2,
            fullname: "Jane Doe",
            nik: 1307056908800002,
            address_code: "13.07.05.2007",
            gender: "wanita",
        },
        {
            id: 3,
            fullname: "Mike Doe",
            nik: 1307051212950003,
            address_code: "13.07.05.2007",
            gender: "pria",
        },
    ]);

    await knex("alas_hak_clients").insert([
        {
            client_id: 1,
            alas_hak_id: 1,
        },
        {
            client_id: 2,
            alas_hak_id: 1,
        },
        {
            client_id: 2,
            alas_hak_id: 2,
        },
    ]);

    // await knex("cases").insert([
    //     {
    //         id: 1,
    //         ah_id: 1,
    //         prd_id: 1,
    //         status: "DRAFT",
    //     },
    // ]);

    // await knex("case_clients").insert([
    //     {
    //         case_id: 1,
    //         client_id: 1,
    //         roles_id: 1,
    //     },
    //     {
    //         case_id: 1,
    //         client_id: 2,
    //         roles_id: 2,
    //     },
    // ]);
}
