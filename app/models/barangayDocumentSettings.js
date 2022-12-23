import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayDocumentSettings extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// Barangay 1:M Barangay Feedback
			models.Barangay.hasMany(models.BarangayDocumentSettings, {
				foreignKey: "barangay_id",
				as: "barangay_document_settings",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayDocumentSettings.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay",
			});

			models.DocumentTypes.hasMany(models.BarangayDocumentSettings, {
				foreignKey: "document_type_id",
				as: "document_settings",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayDocumentSettings.belongsTo(models.DocumentTypes, {
				foreignKey: "document_type_id",
				as: "barangay_document_settings",
			});
		}
	}

	BarangayDocumentSettings.init(
		{
			barangay_document_settings_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			other_requirements: { type: DataTypes.STRING(500) },
			fee: { type: DataTypes.FLOAT(10, 2) },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "BarangayDocumentSettings",
		}
	);

	return BarangayDocumentSettings;
};
