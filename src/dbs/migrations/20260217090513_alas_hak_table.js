/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    // --- TABLE: jenis_hak ---
    await knex.schema.createTable("types", (table) => {
        table.increments("id").primary();
        table.string("name", 20);
    });

    // --- TABLE: alas_hak ---
    await knex.schema.createTable("alas_hak", (table) => {
        // columns nullable
        table.increments("id").primary();
        table.string("no_alas_hak", 255).unique();
        table.string("jor", 255);
        table.date("tgl_alas_hak");
        table.string("no_surat_ukur", 255);
        table.date("tgl_surat_ukur");
        table.string("ket", 255);
        table.timestamps(true, true);

        // columns not nullable
        table.integer("luas").notNullable();
        table.string("address_code", 20).notNullable();

        // foreign keys
        table
            .integer("type_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("types")
            .onDelete("CASCADE");

        // indexes
        table.index("type_id");
        table.index("address_code");
    });

    await knex.schema.alterTable("alas_hak", (table) => {
        table
            .integer("parent_id")
            .unsigned()
            .references("id")
            .inTable("alas_hak")
            .onDelete("SET NULL");
    });

    await knex.schema.createTable("alas_hak_documents", (table) => {
        table.increments("id").primary();
        table.string("type").notNullable();
        table.integer("size").unsigned().notNullable();
        table
            .integer("ah_id")
            .unsigned()
            .notNullable()
            .references("alas_hak.id")
            .onDelete("CASCADE");

        table.unique(["ah_id", "type"], "alas_hak:type_unique");
        table.string("path").notNullable();
        table.datetime("uploaded_at");
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.dropTable("alas_hak_documents");
    await knex.schema.dropTable("alas_hak");
    await knex.schema.dropTable("types");
}
