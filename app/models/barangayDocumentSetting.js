import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayDocumentSetting extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// Barangay 1:M Barangay Feedback
			models.Barangay.hasMany(models.BarangayDocumentSetting, {
				foreignKey: "barangay_id",
				as: "barangay_document_settings",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayDocumentSetting.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay",
			});

			models.DocumentType.hasMany(models.BarangayDocumentSetting, {
				foreignKey: "document_type_id",
				as: "document_settings",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayDocumentSetting.belongsTo(models.DocumentType, {
				foreignKey: "document_type_id",
				as: "barangay_document_settings",
			});
		}
	}

	BarangayDocumentSetting.init(
		{
			barangay_document_setting_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			other_requirements: { type: DataTypes.STRING(500) },
			validity: { type: DataTypes.INTEGER },
			fee: { type: DataTypes.FLOAT(10, 2) },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: false,
			updatedAt: "updated_at",
			modelName: "BarangayDocumentSetting",
		}
	);

	return BarangayDocumentSetting;
};
