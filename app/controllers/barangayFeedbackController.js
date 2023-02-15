import db from "../models/index.js";
// import dayjs from "dayjs";
import capitalize from "capitalize";

const Barangay = db.sequelize.models.Barangay;
const BarangayRole = db.sequelize.models.BarangayRole;
const BarangayFeedback = db.sequelize.models.BarangayFeedback;
const ResidentAccount = db.sequelize.models.ResidentAccount;
const Op = db.Sequelize.Op;

import axios from "axios";
import FormData from "form-data";

import fs from "fs";
import { nanoid } from "nanoid";

export const create = async (req, res) => {
	try {
		const feedback = {
			barangay_feedback_id: req.body.barangay_feedback_id,
			resident_account_id: req.body.resident_account_id,
			barangay_id: req.body.barangay_id,
			rating: req.body.rating,
			suggestions: req.body?.suggestions?.trim(),
		};

		console.log("FEEDBACK", feedback);

		const [feedbackInstance, created] = await BarangayFeedback.upsert(feedback);

		res.status(201).send({ feedbackInstance, created });
	} catch (error) {
		res.status(500).send({ message: `Could not upload data: ${error}`, stack: error.stack });
	}
};

const getPagination = (page, size) => {
	const limit = size ? +size : 3;
	const offset = page ? page * limit : 0;
	return { limit, offset };
};

const formatPaginatedData = (fetchedData, page, limit) => {
	const { count: totalItems, rows: data } = fetchedData;
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);
	return { totalItems, data, totalPages, currentPage, rowPerPage: limit };
};

//Not working
export const findAll = (req, res) => {
	let { page = 0, size = 10, search, sortBy = "updated_at", sortOrder = "DESC", barangay_id, barangay_role_id, status } = req.query;
	const { limit, offset } = getPagination(page, size);
	let residentAccountCondition = {};
	let barangayRoleCondition = {};
	let barangayCondition = {};

	if (barangay_id && barangay_id != "ALL") {
		const searchBarangayCondition = {
			barangay_id: barangay_id,
		};
		Object.assign(barangayCondition, searchBarangayCondition);
	}

	if (search) {
		const searchCondition = {
			[Op.or]: [{ first_name: { [Op.like]: `${search}%` } }, { last_name: { [Op.like]: `${search}%` } }, { email: { [Op.like]: `${search}%` } }],
		};
		Object.assign(residentAccountCondition, searchCondition);
	}

	if (status && status != "ALL") {
		const statusCondition = {
			status: status,
		};
		Object.assign(residentAccountCondition, statusCondition);
	}

	if (barangay_role_id && barangay_role_id != "ALL") {
		const setBarangayRoleCondition = {
			barangay_role_id: barangay_role_id,
		};
		Object.assign(barangayRoleCondition, setBarangayRoleCondition);
	}

	ResidentAccount.findAndCountAll({
		where: residentAccountCondition,
		limit,
		offset,
		attributes: [
			"resident_account_id",
			"profile_image_link",
			"status",
			"directory",
			[
				db.sequelize.fn(
					"CONCAT_WS",
					"|",
					db.sequelize.col("professional_title"),
					db.sequelize.col("first_name"),
					db.sequelize.col("middle_initial"),
					db.sequelize.col("last_name"),
					db.sequelize.col("suffix")
				),
				"full_name",
			],
			"email",

			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("ResidentAccount.created_at"), "%m-%d-%Y %H:%i:%s"), "created_at"],
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("ResidentAccount.updated_at"), "%m-%d-%Y %H:%i:%s"), "updated_at"],
		],
		include: [
			{
				model: BarangayRole,
				required: true,
				as: "role",
				attributes: ["barangay_role_id", "name"],
				where: barangayRoleCondition,
				include: [
					{
						model: Barangay,
						required: true,
						as: "barangay",
						attributes: ["barangay_id", "name", "logo", "number", "directory"],
						where: barangayCondition,
					},
				],
			},
		],
		order: [[sortBy, sortOrder]],
	})
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message + err.stack });
		});
};

export const findOne = async (req, res) => {
	const { resident_account_id } = req.query;
	const { barangay_id } = req.params;

	if (!resident_account_id || !barangay_id) {
		return res.status(404).send({ message: `Feedback not found` });
	}

	try {
		const feedback = await BarangayFeedback.findOne({
			where: { barangay_id, resident_account_id },
			// include: {
			// 	// model: BarangayRole,
			// 	// attributes: ["barangay_role_id", "name"],
			// 	// required: true,
			// 	// as: "role",
			// 	// include: [
			// 	// 	{
			// 	// 		model: Barangay,
			// 	// 		as: "barangay",
			// 	// 	},
			// 	// ],
			// },
		});

		return feedback ? res.send(feedback) : res.status(404).send({ message: `Feedback not found` });
	} catch (error) {
		res.status(400).send({ message: `An error occured while retrieving data: ${error}` });
	}
};

export const findAllFeedbackByBarangay = (req, res) => {
	const { page = 0, size = 20, search, rating, filter_date, date_from, date_to, sortBy = "created_at", sortOrder = "DESC" } = req.query;
	const { limit, offset } = getPagination(page, size);
	const { barangay_id } = req.params;
	const barangayDocumentCondition = {};

	Object.assign(barangayDocumentCondition, { barangay_id: barangay_id });

	let searchCondition = {};
	if (search) {
		searchCondition = {
			[Op.or]: [{ first_name: { [Op.like]: `%${search}%` } }],
		};
		// Object.assign(barangayDocumentCondition, searchCondition);
	}

	if (rating && rating != "ALL") {
		const statusCondition = {
			rating: rating,
		};
		Object.assign(barangayDocumentCondition, statusCondition);
	}

	//DATE FILTER
	if (filter_date && filter_date != "ALL" && date_from && date_to) {
		Object.assign(barangayDocumentCondition, {
			[filter_date]: { [Op.between]: [date_from, date_to] },
		});
	}

	return BarangayFeedback.findAndCountAll({
		where: barangayDocumentCondition,
		include: {
			model: ResidentAccount,
			as: "resident_account",
			where: searchCondition,
			attributes: [
				"resident_account_id",
				"profile_image_link",
				"status",
				"directory",
				[
					db.sequelize.fn(
						"CONCAT_WS",
						"|",
						db.sequelize.col("first_name"),
						db.sequelize.col("middle_initial"),
						db.sequelize.col("last_name"),
						db.sequelize.col("suffix")
					),
					"full_name",
				],
				"email",
			],
			include: [
				{
					model: BarangayRole,
					required: true,
					as: "role",
					attributes: ["barangay_role_id", "name"],
					include: [
						{
							model: Barangay,
							required: true,
							as: "barangay",
							attributes: ["barangay_id", "name", "logo", "number", "directory"],
							// where: barangayCondition,
						},
					],
				},
			],
		},
		limit,
		offset,
		order: [[sortBy, sortOrder]],
	})
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message, stack: err.stack });
		});
};

export const barangayStatistics = async (req, res) => {
	const { barangay_id } = req.params;

	try {
		const total_rating = await db.sequelize.query(
			`SELECT CAST(AVG(BF.rating) AS DECIMAL(10,2)) as total_rating FROM BarangayFeedbacks BF WHERE BF.barangay_id = $barangay_id;`,
			{
				bind: {
					barangay_id: barangay_id,
				},
				type: db.Sequelize.QueryTypes.SELECT,
				plain: true,
			}
		);

		const online_ratings_overview = await db.sequelize.query(
			`SELECT RR.rating, IF(S.number_of_rating IS NULL, 0, S.number_of_rating) as rating_count FROM RatingReference RR 
			LEFT JOIN (SELECT BF.rating, Count(BF.rating) as number_of_rating FROM BarangayFeedbacks BF 
			WHERE BF.barangay_id = $barangay_id GROUP BY BF.rating) S ON S.rating = RR.rating
			ORDER BY RR.rating DESC;
			`,
			{
				bind: {
					barangay_id: barangay_id,
				},
				type: db.Sequelize.QueryTypes.SELECT,
			}
		);

		res.status(200).send({
			total_rating,
			online_ratings_overview,
		});
	} catch (error) {
		res.status(500).send({ message: `Could not fetch data: ${error}`, stack: error.stack });
	}
};
