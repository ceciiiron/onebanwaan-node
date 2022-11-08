import db from "../models/index.js";
import dayjs from "dayjs";
import capitalize from "capitalize";
import bcrypt from "bcryptjs";

const Barangay = db.sequelize.models.Barangay;
const ResidentAccount = db.sequelize.models.ResidentAccount;
const BarangayRole = db.sequelize.models.BarangayRole;
const Post = db.sequelize.models.Post;
const PostImage = db.sequelize.models.PostImage;
const PostHeart = db.sequelize.models.PostHeart;
const PostComment = db.sequelize.models.PostComment;
const Op = db.Sequelize.Op;

/* ========================================================================== */
/*                                COMMENT POST                                */
/* ========================================================================== */

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

export const findAllCommentsByPost = (req, res) => {
	const { page = 0, size = 10, name, number } = req.query;
	const { limit, offset } = getPagination(page, size);
	const post_id = req.params.post_id;

	return PostComment.findAndCountAll({
		where: { post_id },
		limit,
		offset,
		include: {
			model: ResidentAccount,
			required: true,
			as: "resident_comment",

			include: {
				model: BarangayRole,
				as: "role",
				include: {
					model: Barangay,
					as: "barangay",
				},
			},
		},
		order: [["created_at", "DESC"]],
	})
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message });
		});
};

export const findOneComment = async (req, res) => {
	const post_comment_id = req.params.post_comment_id;

	const data = await PostComment.findByPk(post_comment_id);

	return data ? res.send(data) : res.status(404).send({ message: `Not Found` });
};

export const createComment = async (req, res) => {
	const post_id = req.params.post_id;

	try {
		const data = await PostComment.create({
			resident_account_id: req.session.user.resident_account_id,
			post_id: post_id,
			content: req.body.content.trim(),
			as_barangay_admin: req.body.as_barangay_admin || false,
		});

		const newComment = await PostComment.findByPk(data.post_comment_id, {
			include: {
				model: ResidentAccount,
				required: true,
				as: "resident_comment",

				include: {
					model: BarangayRole,
					as: "role",
					include: {
						model: Barangay,
						as: "barangay",
					},
				},
			},
		});

		res.send(newComment);
	} catch (error) {
		res.status(500).send({ message: `Could not insert data: ${error}` });
	}
};

export const updateComment = async (req, res) => {
	const post_id = req.params.post_id;
	const post_comment_id = req.params.post_id;

	try {
		const data = await PostComment.update(
			{
				content: req.body.content.trim(),
			},
			{ where: { post_comment_id } }
		);

		res.send(data);
	} catch (error) {
		res.status(500).send({ message: `Could not insert data: ${error}` });
	}
};

export const destroyComment = async (req, res) => {
	const post_comment_id = req.params.post_comment_id;

	try {
		const affectedRow = await PostComment.destroy({ where: { post_comment_id } });

		res.send({ affectedRow });
	} catch (error) {
		res.status(500).send({ message: `Could not insert data: ${error}` });
	}
};
