import { create, findAllByBarangay, findAllByBarangayPaginated, findOne, update, destroy } from "../controllers/barangayRoleController.js";
import express from "express";
const router = express.Router();

export default (app) => {
	router.get("/:barangay_id/roles/paginated", findAllByBarangayPaginated);
	router.get("/:barangay_id/roles/:barangay_role_id", findOne);
	router.put("/:barangay_id/roles/:barangay_role_id", update);
	router.delete("/:barangay_id/roles/:barangay_role_id", destroy);
	router.post("/:barangay_id/roles", create);
	router.get("/:barangay_id/roles/", findAllByBarangay);

	app.use("/api/barangays", router);
};
