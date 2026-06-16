import db from "../../dbs/db.mjs";
import { ExpressError } from "../../shared/utils/custom.error.mjs";

export async function getStats() {
    try {
        const [[result]] = await db.raw(`
            SELECT 
                (SELECT COUNT(*) FROM clients) as clients,    
                (SELECT COUNT(*) FROM alas_hak) as alas_hak,
                (SELECT COUNT(*) FROM akta_ppat) as akta_ppat,    
                (SELECT COUNT(*) FROM cases) as cases;
        `);

        const clients = await db("clients")
            .select(["id", "nik", "fullname"])
            .limit(5)
            .offset(0)
            .orderBy("id", "desc");
        const cases = await db("cases")
            .leftJoin("products", "products.id", "cases.prd_id")
            .leftJoin("case_steps", "case_steps.id", "cases.current_step")
            .leftJoin("workflows", "workflows.id", "case_steps.step_id")
            .select([
                "cases.id",
                "workflows.name",
                "case_steps.status",
                "products.name as product",
            ])
            .limit(5)
            .offset(0)
            .orderBy("cases.id", "desc");

        return { result, data: { clients, cases } };
    } catch (error) {
        throw new ExpressError(error.message);
    }
}
