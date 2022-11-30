import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayFeedback extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// Barangay 1:M Barangay Feedback
			models.Barangay.hasMany(models.BarangayFeedback, {
				foreignKey: "barangay_id",
				as: "feedbacks",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayFeedback.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay",
			});

			models.ResidentAccount.hasMany(models.BarangayFeedback, {
				foreignKey: "resident_account_id",
				as: "resident_feedbacks",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayFeedback.belongsTo(models.ResidentAccount, {
				foreignKey: "resident_account_id",
				as: "resident_account",
			});
		}
	}

	BarangayFeedback.init(
		{
			barangay_feedback_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			rating: { type: DataTypes.INTEGER },
			suggestions: { type: DataTypes.STRING(200) },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "BarangayFeedback",
		}
	);

	return BarangayFeedback;
};
