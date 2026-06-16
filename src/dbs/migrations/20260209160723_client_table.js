/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    // --- TABLE: clients ---
    await knex.schema.createTable("clients", (table) => {
        table.increments("id").primary();
        table
            .string("nik", 255)
            .unique({ indexName: "nik_unique" })
            .notNullable();
        table.string("fullname", 255).notNullable();
        table.string("address_code", 255).notNullable();
        table.enu("gender", ["pria", "wanita"]).notNullable();
        table.string("phone_number", 20).notNullable().defaultTo("");
        table.timestamps(true, true);
        table.boolean("is_deceased").defaultTo(false);

        // indexes
        table.index("fullname", "fullname_index");
        table.index("address_code", "address_code_index");
    });

    await knex.schema.createTable("clients_documents", (table) => {
        table.increments("id").primary();
        table.string("type").notNullable();
        table.integer("size").unsigned().notNullable();
        table
            .integer("cl_id")
            .unsigned()
            .notNullable()
            .references("clients.id")
            .onDelete("CASCADE");
        table.unique(["cl_id", "type"], "client_id:type_unique");
        table.string("path").notNullable();
        table.datetime("uploaded_at");
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.dropTable("clients_documents");
    await knex.schema.dropTable("clients");
}
