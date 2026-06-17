/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    // --- TABLE: client_role ---
    await knex.schema.createTable("client_roles", (table) => {
        table.increments("id").primary();
        table.string("name", 255);
        table.string("label", 255);
    });

    // --- TABLE: proses_client ---
    await knex.schema.createTable("case_clients", (table) => {
        table
            .integer("case_id")
            .unsigned()
            .references("id")
            .inTable("cases")
            .onDelete("CASCADE");
        table
            .integer("client_id")
            .unsigned()
            .references("id")
            .inTable("clients")
            .onDelete("CASCADE");
        table
            .integer("role_id")
            .unsigned()
            .references("id")
            .inTable("client_roles")
            .onDelete("CASCADE");

        table.primary(["case_id", "client_id"]);

        // indexes
        table.index("client_id");
        table.index("role_id");
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.dropTable("case_clients");
    await knex.schema.dropTable("client_roles");
}
