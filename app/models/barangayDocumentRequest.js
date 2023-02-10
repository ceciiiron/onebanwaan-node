import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayDocumentRequest extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// Barangay 1:M Barangay Feedback
			models.Barangay.hasMany(models.BarangayDocumentRequest, {
				foreignKey: "barangay_id",
				as: "barangay_document",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayDocumentRequest.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay_document_request",
			});

			models.BarangayDocumentSetting.hasMany(models.BarangayDocumentRequest, {
				foreignKey: "barangay_document_setting_id",
				as: "document_settings",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayDocumentRequest.belongsTo(models.BarangayDocumentSetting, {
				foreignKey: "barangay_document_setting_id",
				as: "barangay_document_settings",
			});
		}
	}

	BarangayDocumentRequest.init(
		{
			barangay_document_request_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			full_name: { type: DataTypes.STRING(255), allowNull: false },
			home_address: { type: DataTypes.STRING(500), allowNull: false },
			age: { type: DataTypes.INTEGER, allowNull: false },
			birthdate: { type: DataTypes.DATEONLY },
			gender: { type: DataTypes.STRING, allowNull: false },
			civil_status: { type: DataTypes.STRING, allowNull: false },

			contact_number: { type: DataTypes.STRING(255) },
			email: { type: DataTypes.STRING(255) },

			purpose: { type: DataTypes.STRING(500), allowNull: false },
			captured_fee: { type: DataTypes.FLOAT(10, 2) },
			claim_date: { type: DataTypes.DATE },
			ticket_code: { type: DataTypes.STRING(500), allowNull: false },

			request_status: { type: DataTypes.INTEGER, defaultValue: 1 }, //1pending, 2approved, 3issued, 4disapproved
			payment_status: { type: DataTypes.INTEGER, defaultValue: 1 }, //1 pending,2 unpaid 3 paid 4 FREE 5 void
			issued_at: { type: DataTypes.DATEONLY },
			paid_at: { type: DataTypes.DATEONLY },
			or_number: { type: DataTypes.INTEGER, defaultValue: null },
			remarks: { type: DataTypes.STRING(500), allowNull: true },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "BarangayDocumentRequest",
		}
	);

	return BarangayDocumentRequest;
};
