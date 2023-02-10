import db from "../models/index.js";
import capitalize from "capitalize";

import dayjs from "dayjs";

const Barangay = db.sequelize.models.Barangay;
const BarangayDocumentRequest = db.sequelize.models.BarangayDocumentRequest;
const BarangayDocumentSetting = db.sequelize.models.BarangayDocumentSetting;
const AuditLog = db.sequelize.models.AuditLog;
const DocumentType = db.sequelize.models.DocumentType;
const Op = db.Sequelize.Op;

import nodemailer from "nodemailer";

let transporter = nodemailer.createTransport({
	host: "smtp.hostinger.com",
	port: 465,
	secure: true, // true for 465, false for other ports
	auth: {
		user: "support@onebanwaan.com", // generated ethereal user
		pass: "2019-Cs-100456", // generated ethereal password
	},
});

const paymentStatusText = (status) => {
	switch (status) {
		case 1:
			return "pending";
			break;
		case 2:
			return "unpaid";
			break;
		case 3:
			return "paid";
			break;
		case 4:
			return "free";
			break;
		default:
			return "void";
			break;
	}
};

const requestStatusText = (status) => {
	switch (status) {
		case 1:
			return "pending";
			break;
		case 2:
			return "approved";
			break;
		case 3:
			return "issued";
			break;
		default:
			return "rejected";
			break;
	}
};

export const create = async (req, res) => {
	const { barangay_id } = req.params;

	try {
		const barangayDocumentRequest = {
			barangay_id,
			full_name: capitalize.words(req.body.full_name?.trim() ?? "", true) || null,
			home_address: capitalize.words(req.body.home_address?.trim() ?? "", true) || null,
			age: req.body.age,
			birthdate: req.body.birthdate,
			gender: req.body.gender,
			civil_status: req.body.civil_status,
			contact_number: req.body.contact_number ? req.body.contact_number.trim() : null,
			email: req.body.email ? req.body.email.trim() : null,
			barangay_document_setting_id: req.body.barangay_document_setting_id,
			purpose: req.body.purpose,
			captured_fee: req.body.captured_fee,
			claim_date: req.body.claim_date,
			ticket_code: req.body.ticket_code,
			request_status: req.body.request_status,
			payment_status: req.body.payment_status,
		};

		const data = await BarangayDocumentRequest.create(barangayDocumentRequest);

		res.send(data);
	} catch (error) {
		res.status(500).send({ message: `Could not insert data: ${error}` });
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

export const findAllRequestsByBarangay = (req, res) => {
	const {
		page = 0,
		size = 20,
		search,
		request_status,
		document_type_id,
		payment_status,
		filter_date,
		date_from,
		date_to,
		sortBy = "created_at",
		sortOrder = "DESC",
	} = req.query;
	const { limit, offset } = getPagination(page, size);
	const { barangay_id } = req.params;
	const barangayDocumentCondition = {};
	const documentTypeCondition = {};

	Object.assign(barangayDocumentCondition, { barangay_id: barangay_id });

	if (search) {
		const searchCondition = {
			[Op.or]: [
				{ full_name: { [Op.like]: `${search}%` } },
				{ ticket_code: { [Op.like]: `${search}%` } },
				{ email: { [Op.like]: `${search}%` } },
				{ or_number: { [Op.like]: `${search}%` } },
			],
		};
		Object.assign(barangayDocumentCondition, searchCondition);
	}

	if (document_type_id && document_type_id != "ALL") {
		const condition = {
			document_type_id: document_type_id,
		};
		Object.assign(documentTypeCondition, condition);
	}

	if (request_status && request_status != "ALL") {
		const statusCondition = {
			request_status: request_status,
		};
		Object.assign(barangayDocumentCondition, statusCondition);
	}

	if (payment_status && payment_status != "ALL") {
		const statusCondition = {
			payment_status: payment_status,
		};
		Object.assign(barangayDocumentCondition, statusCondition);
	}
	//DATE FILTER
	if (filter_date && filter_date != "ALL" && date_from && date_to) {
		Object.assign(barangayDocumentCondition, {
			[filter_date]: { [Op.between]: [date_from, date_to] },
		});
	}

	return BarangayDocumentRequest.findAndCountAll({
		where: barangayDocumentCondition,
		include: [
			{
				model: BarangayDocumentSetting,
				as: "barangay_document_settings",
				required: true,
				include: [
					{
						model: DocumentType,
						as: "barangay_document_settings",
						required: true,
						where: documentTypeCondition,
					},
				],
			},
		],
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

export const findOne = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	const data = await BarangayDocumentRequest.findByPk(barangay_document_request_id, {
		include: [
			{
				model: BarangayDocumentSetting,
				as: "barangay_document_settings",
				include: [
					{
						model: DocumentType,
						as: "barangay_document_settings",
						// attributes: [],
						// required: true,
					},
				],
			},
		],
	});

	return data ? res.send(data) : res.status(404).send({ message: `Hotline not found` });
};

export const updatePaymentStatus = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	const currentRequest = await BarangayDocumentRequest.findByPk(barangay_document_request_id);

	try {
		let barangayDocumentRequest = {
			payment_status: req.body.payment_status,
		};

		if (req.body.paid_at) {
			barangayDocumentRequest.paid_at = req.body.paid_at;
		}

		if (req.body.or_number) {
			barangayDocumentRequest.or_number = req.body.or_number;
		}

		await BarangayDocumentRequest.update(barangayDocumentRequest, { where: { barangay_document_request_id } });

		if (req.session?.user?.resident_account_id) {
			await AuditLog.create({
				resident_account_id: req.session.user.resident_account_id,
				module: "DOCUMENT ISSUANCE",
				action: "UPDATE",
				description: `Updated payment status of ${currentRequest.full_name} (${currentRequest.ticket_code}) from ${paymentStatusText(
					currentRequest.payment_status
				)} to ${paymentStatusText(barangayDocumentRequest.payment_status)}`,
			});
		}

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const updateRequestStatus = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	const currentRequest = await BarangayDocumentRequest.findByPk(barangay_document_request_id, {
		include: [
			{
				model: BarangayDocumentSetting,
				as: "barangay_document_settings",
				include: [
					{
						model: DocumentType,
						as: "barangay_document_settings",
						// attributes: [],
						// required: true,
					},
				],
			},
			{
				model: Barangay,
				as: "barangay_document_request",
			},
		],
	});

	try {
		let barangayDocumentRequest = {
			request_status: req.body.request_status,
		};

		if (req.body.remarks) {
			barangayDocumentRequest.remarks = req.body.remarks;
		}

		if (req.body.issued_at) {
			barangayDocumentRequest.issued_at = req.body.issued_at;
		}

		await BarangayDocumentRequest.update(barangayDocumentRequest, { where: { barangay_document_request_id } });

		if (req.session?.user?.resident_account_id) {
			await AuditLog.create({
				resident_account_id: req.session.user.resident_account_id,
				module: "DOCUMENT ISSUANCE",
				action: "UPDATE",
				description: `Updated request status of ${currentRequest.full_name} (${currentRequest.ticket_code}) from ${requestStatusText(
					currentRequest.request_status
				)} to ${requestStatusText(barangayDocumentRequest.request_status)}`,
			});
		}

		var mailOptions = {
			sender: "One Banwaan",
			from: "support@onebanwaan.com",
			to: currentRequest.email,
			subject: "Barangay Document Issuance",
			text: "",
		};

		//1pending, 2approved, 3issued, 4disapproved

		//
		if (barangayDocumentRequest.request_status === 2) {
			mailOptions.text = `Your document request (${currentRequest.barangay_document_settings.barangay_document_settings.name}) with ticket code ${
				currentRequest.ticket_code
			} has been approved by a barangay administrator. \n\nPlease prepare a fee of PHP ${
				currentRequest.barangay_document_settings.fee
			} and claim your document at Barangay ${currentRequest.barangay_document_request.number}, ${
				currentRequest.barangay_document_request.name
			}, according to your provided expected claim date and time: ${dayjs(currentRequest.claim_date).format("YYYY-MM-DD HH:mm:00")}`;
		}

		if (barangayDocumentRequest.request_status === 4) {
			mailOptions.text = `Your document request (${currentRequest.barangay_document_settings.barangay_document_settings.name}) with ticket code ${currentRequest.ticket_code} has been disapproved. REASON: ${req.body.remarks}`;
		}

		if (barangayDocumentRequest.request_status === 2 || barangayDocumentRequest.request_status == 4) {
			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
					// res.status(500).send({ message: "SERVER ERROR" });
				} else {
					console.log("Email sent: " + info.response);
				}
			});
		}

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const updatePersonalInformation = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	const currentRequest = await BarangayDocumentRequest.findByPk(barangay_document_request_id);

	try {
		const barangayDocumentRequest = {
			full_name: capitalize.words(req.body.full_name?.trim() ?? "", true) || null,
			home_address: capitalize.words(req.body.home_address?.trim() ?? "", true) || null,
			age: req.body.age,
			birthdate: req.body.birthdate,
			gender: req.body.gender,
			civil_status: req.body.civil_status,
			contact_number: req.body.contact_number ? req.body.contact_number?.trim() : null,
		};

		await BarangayDocumentRequest.update(barangayDocumentRequest, { where: { barangay_document_request_id } });

		if (req.session?.user?.resident_account_id) {
			await AuditLog.create({
				resident_account_id: req.session.user.resident_account_id,
				module: "DOCUMENT ISSUANCE",
				action: "UPDATE",
				description: `Updated personal information of ${currentRequest.full_name} (${currentRequest.ticket_code})`,
			});
		}

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const updateDocumentInformation = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	const currentRequest = await BarangayDocumentRequest.findByPk(barangay_document_request_id);

	try {
		const barangayDocumentRequest = {
			purpose: req.body.purpose,
			captured_fee: req.body.captured_fee,
		};

		await BarangayDocumentRequest.update(barangayDocumentRequest, { where: { barangay_document_request_id } });

		if (req.session?.user?.resident_account_id) {
			await AuditLog.create({
				resident_account_id: req.session.user.resident_account_id,
				module: "DOCUMENT ISSUANCE",
				action: "UPDATE",
				description: `Updated document information of ${currentRequest.full_name} (${currentRequest.ticket_code})`,
			});
		}

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

// TICKET TRACKER

export const tickettracker = async (req, res) => {
	const { ticket_code } = req.params;

	const data = await BarangayDocumentRequest.findOne({
		where: { ticket_code },
		include: [
			{
				model: BarangayDocumentSetting,
				as: "barangay_document_settings",
				include: [
					{
						model: DocumentType,
						as: "barangay_document_settings",
						// attributes: [],
						// required: true,
					},
				],
			},
		],
	});

	return data ? res.send(data) : res.status(404).send({ message: `Request not found` });
};

// GENERATE REPORT

export const generateReport = async (req, res) => {
	const { report, date } = req.query;
	const { barangay_id } = req.params;
	try {
		let results = "";

		if (report == "MONTHLY") {
			const [rs, md] = await db.sequelize.query(
				`SELECT documents.name, R.year, R.month, IFNULL(R.total, "0.00") as total, IFNULL(TotalIssuedSelect.total_issued, 0) as total_issued FROM DocumentTypes documents
				LEFT JOIN (SELECT YEAR(BDR.paid_at) as "year", MONTH(BDR.paid_at) as "month", DT.name, SUM(BDR.captured_fee) as "total", DT.document_type_id as document_type_id from BarangayDocumentRequests BDR
					JOIN BarangayDocumentSettings BDS ON BDS.barangay_document_setting_id = BDR.barangay_document_setting_id
					JOIN DocumentTypes DT ON DT.document_type_id = BDS.document_type_id
					WHERE BDR.payment_status = 3 AND YEAR(BDR.paid_at) = $year AND MONTH(BDR.paid_at) = $month
					AND BDR.barangay_id = $barangay_id
					group by DT.document_type_id , year(BDR.paid_at), month(BDR.paid_at)) 
						R ON R.document_type_id = documents.document_type_id
				LEFT JOIN (SELECT COUNT(BDR.barangay_document_request_id) as "total_issued", DT.document_type_id as document_type_id from BarangayDocumentRequests BDR
					JOIN BarangayDocumentSettings BDS ON BDS.barangay_document_setting_id = BDR.barangay_document_setting_id
					JOIN DocumentTypes DT ON DT.document_type_id = BDS.document_type_id
					WHERE BDR.request_status = 3 AND YEAR(BDR.issued_at) = $year AND MONTH(BDR.issued_at) = $month
					AND BDR.barangay_id = $barangay_id
					group by DT.document_type_id , year(BDR.issued_at), month(BDR.paid_at)) TotalIssuedSelect ON TotalIssuedSelect.document_type_id = documents.document_type_id;`,
				{
					bind: {
						barangay_id: barangay_id,
						year: date.split("-")[0],
						month: date.split("-")[1],
					},
				}
			);
			results = rs;
		} else if (report == "DAILY") {
			const [rs, md] = await db.sequelize.query(
				`SELECT documents.name, R.year, R.month, IFNULL(R.total, "0.00") as total, IFNULL(TotalIssuedSelect.total_issued, 0) as total_issued FROM DocumentTypes documents
				LEFT JOIN (SELECT YEAR(BDR.paid_at) as "year", MONTH(BDR.paid_at) as "month", DT.name, SUM(BDR.captured_fee) as "total", DT.document_type_id as document_type_id from BarangayDocumentRequests BDR
					JOIN BarangayDocumentSettings BDS ON BDS.barangay_document_setting_id = BDR.barangay_document_setting_id
					JOIN DocumentTypes DT ON DT.document_type_id = BDS.document_type_id
					WHERE BDR.payment_status = 3 AND BDR.paid_at = $date
					AND BDR.barangay_id = $barangay_id
					group by DT.document_type_id , BDR.paid_at) 
						R ON R.document_type_id = documents.document_type_id
				LEFT JOIN (SELECT COUNT(BDR.barangay_document_request_id) as "total_issued", DT.document_type_id as document_type_id from BarangayDocumentRequests BDR
					JOIN BarangayDocumentSettings BDS ON BDS.barangay_document_setting_id = BDR.barangay_document_setting_id
					JOIN DocumentTypes DT ON DT.document_type_id = BDS.document_type_id
					WHERE BDR.request_status = 3 AND BDR.issued_at = $date
					AND BDR.barangay_id = $barangay_id
					group by DT.document_type_id , BDR.issued_at) TotalIssuedSelect ON TotalIssuedSelect.document_type_id = documents.document_type_id;`,
				{
					bind: {
						barangay_id: barangay_id,
						date: date,
					},
				}
			);
			results = rs;
		} else if (report == "YEARLY") {
			const [rs, md] = await db.sequelize.query(
				`SELECT documents.name, R.year, R.month, IFNULL(R.total, "0.00") as total, IFNULL(TotalIssuedSelect.total_issued, 0) as total_issued FROM DocumentTypes documents
				LEFT JOIN (SELECT YEAR(BDR.paid_at) as "year", MONTH(BDR.paid_at) as "month", DT.name, SUM(BDR.captured_fee) as "total", DT.document_type_id as document_type_id from BarangayDocumentRequests BDR
					JOIN BarangayDocumentSettings BDS ON BDS.barangay_document_setting_id = BDR.barangay_document_setting_id
					JOIN DocumentTypes DT ON DT.document_type_id = BDS.document_type_id
					WHERE BDR.payment_status = 3 AND YEAR(BDR.paid_at) = YEAR($date)
					AND BDR.barangay_id = $barangay_id
					group by DT.document_type_id , YEAR(BDR.paid_at)) 
						R ON R.document_type_id = documents.document_type_id
				LEFT JOIN (SELECT COUNT(BDR.barangay_document_request_id) as "total_issued", DT.document_type_id as document_type_id from BarangayDocumentRequests BDR
					JOIN BarangayDocumentSettings BDS ON BDS.barangay_document_setting_id = BDR.barangay_document_setting_id
					JOIN DocumentTypes DT ON DT.document_type_id = BDS.document_type_id
					WHERE BDR.request_status = 3 AND YEAR(BDR.issued_at) = YEAR($date)
					AND BDR.barangay_id = $barangay_id
					group by DT.document_type_id , YEAR(BDR.issued_at)) TotalIssuedSelect ON TotalIssuedSelect.document_type_id = documents.document_type_id;`,
				{
					bind: {
						barangay_id: barangay_id,
						date: date,
					},
				}
			);
			results = rs;
		} else if (report == "WEEKLY") {
			const [rs, md] = await db.sequelize.query(
				`SELECT documents.name, R.year, R.month, IFNULL(R.total, "0.00") as total, IFNULL(TotalIssuedSelect.total_issued, 0) as total_issued FROM DocumentTypes documents
				LEFT JOIN (SELECT YEAR(BDR.paid_at) as "year", MONTH(BDR.paid_at) as "month", DT.name, SUM(BDR.captured_fee) as "total", DT.document_type_id as document_type_id from BarangayDocumentRequests BDR
					JOIN BarangayDocumentSettings BDS ON BDS.barangay_document_setting_id = BDR.barangay_document_setting_id
					JOIN DocumentTypes DT ON DT.document_type_id = BDS.document_type_id
					WHERE BDR.payment_status = 3 AND WEEK(BDR.paid_at) = WEEK($date)
					AND BDR.barangay_id = $barangay_id
					group by DT.document_type_id , WEEK(BDR.paid_at)) 
						R ON R.document_type_id = documents.document_type_id
				LEFT JOIN (SELECT COUNT(BDR.barangay_document_request_id) as "total_issued", DT.document_type_id as document_type_id from BarangayDocumentRequests BDR
					JOIN BarangayDocumentSettings BDS ON BDS.barangay_document_setting_id = BDR.barangay_document_setting_id
					JOIN DocumentTypes DT ON DT.document_type_id = BDS.document_type_id
					WHERE BDR.request_status = 3 AND WEEK(BDR.issued_at) = WEEK($date)
					AND BDR.barangay_id = $barangay_id
					group by DT.document_type_id , WEEK(BDR.issued_at)) TotalIssuedSelect ON TotalIssuedSelect.document_type_id = documents.document_type_id;`,
				{
					bind: {
						barangay_id: barangay_id,
						date: date,
					},
				}
			);
			results = rs;
		}

		res.status(200).send(results ?? []);
	} catch (error) {
		res.status(500).send({ message: `Could not fetch data: ${error}`, stack: error.stack });
	}
};
