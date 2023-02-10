import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayBlotter extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// Barangay 1:M Barangay Feedback
			models.Barangay.hasMany(models.BarangayBlotter, {
				foreignKey: "barangay_id",
				as: "barangay",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayBlotter.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay_document_request",
			});

			models.BarangayCaseType.hasMany(models.BarangayBlotter, {
				foreignKey: "barangay_case_type_id",
				as: "barangay_case_type",
				onDelete: "SET NULL",
				onUpdate: "SET NULL",
			});

			models.BarangayBlotter.belongsTo(models.BarangayCaseType, {
				foreignKey: "barangay_case_type_id",
				as: "barangay_blotter_case_type",
			});
		}
	}

	BarangayBlotter.init(
		{
			barangay_blotter_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			complainants: { type: DataTypes.STRING(1000), allowNull: false },
			respondents: { type: DataTypes.STRING(1000), allowNull: false },
			witnesses: { type: DataTypes.STRING(1000), allowNull: false },

			incident_date: { type: DataTypes.DATE },
			incident_details: { type: DataTypes.STRING(1000), allowNull: false },
			incident_location: { type: DataTypes.STRING(1000), allowNull: false },
			evidence_link: { type: DataTypes.STRING(500), allowNull: true },

			book_number: { type: DataTypes.INTEGER, defaultValue: 0 },
			page_number: { type: DataTypes.INTEGER, defaultValue: 0 },

			contact_number: { type: DataTypes.STRING(255) },
			email: { type: DataTypes.STRING(255) },

			narrative: { type: DataTypes.STRING(3000), allowNull: true },
			status: { type: DataTypes.INTEGER, defaultValue: 1 },
			remarks: { type: DataTypes.STRING(500), allowNull: true }, //1pending, 2verified 3falsereport
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "BarangayBlotter",
		}
	);

	return BarangayBlotter;
};
